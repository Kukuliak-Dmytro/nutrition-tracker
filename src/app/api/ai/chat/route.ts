import { NextRequest } from "next/server";
import { convertToModelMessages, isStepCount, streamText } from "ai";
import { getSessionUserId } from "@/lib/auth";
import prisma from "../../../../../utils/prisma/prisma";
import { getAgentTools } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getLLMModel } from "@/lib/ai/adapter";
import { aiLogger } from "@/lib/ai/logger";

export const maxDuration = 60; // Allow up to 60s for agentic tool loops

export async function POST(req: NextRequest) {
  let currentSessionId: string | undefined;
  let activeUserId: string | null = null;
  const startTime = Date.now();

  try {
    const userId = await getSessionUserId();
    activeUserId = userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, sessionId, currentDate, currentTime } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Resolve or create chat session
    let activeSession = null;
    if (sessionId) {
      activeSession = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
    }

    const extractText = (msg: { content?: string; parts?: Array<{ type?: string; text?: string }> } | undefined): string => {
      if (!msg) return "";
      if (typeof msg.content === "string") return msg.content;
      if (Array.isArray(msg.parts)) {
        return msg.parts
          .filter((p) => p.type === "text" && typeof p.text === "string")
          .map((p) => p.text)
          .join("\n");
      }
      return "";
    };

    if (!activeSession) {
      const firstUserMsg = messages.find((m: { role: string }) => m.role === "user");
      const userText = extractText(firstUserMsg);
      const title = userText ? userText.slice(0, 40) : "Новий діалог";

      activeSession = await prisma.chatSession.create({
        data: {
          userId,
          title,
        },
      });
    }

    currentSessionId = activeSession.id;

    // 2. Persist latest incoming user message
    const latestUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const latestUserText = extractText(latestUserMessage);
    if (latestUserText) {
      await prisma.chatMessage.create({
        data: {
          sessionId: currentSessionId,
          role: "user",
          content: latestUserText,
        },
      });
    }

    // Log user input
    aiLogger.logInput({
      sessionId: currentSessionId,
      userId,
      userMessage: latestUserText,
      totalMessages: messages.length,
    });

    // 3. Setup agent tools and system prompt
    const rawTools = getAgentTools(userId);
    const systemPrompt = buildSystemPrompt({ currentDate, currentTime });
    const model = getLLMModel();
    const modelMessages = await convertToModelMessages(messages);

    // Track consecutive tool calls to prevent calling the exact same tool with identical parameters in a row
    let lastToolExecution: { name: string; argsKey: string } | null = null;
    let hadConsecutiveDuplicate = false;

    function canonicalArgsKey(args: unknown): string {
      if (!args || typeof args !== "object") return "";
      const sortObj = (obj: unknown): unknown => {
        if (obj === null || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(sortObj);
        const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
        const result: Record<string, unknown> = {};
        for (const key of sortedKeys) {
          result[key] = sortObj((obj as Record<string, unknown>)[key]);
        }
        return result;
      };
      return JSON.stringify(sortObj(args));
    }

    const ZERO_ARG_TOOLS = new Set([
      "get_weight_loss_progress",
      "get_nutrition_goals",
      "get_available_dishes",
    ]);

    // Wrap each tool execute function with consecutive identical parameter detection
    const tools: typeof rawTools = {} as typeof rawTools;
    for (const [toolName, toolDef] of Object.entries(rawTools)) {
      const anyToolDef = toolDef as unknown as {
        execute?: (args: unknown, options: unknown) => PromiseLike<unknown>;
      };
      if (!anyToolDef.execute) {
        (tools as Record<string, unknown>)[toolName] = toolDef;
        continue;
      }
      const originalExecute = anyToolDef.execute.bind(anyToolDef);
      (tools as Record<string, unknown>)[toolName] = {
        ...anyToolDef,
        execute: async (args: unknown, options: unknown) => {
          const argsKey = canonicalArgsKey(args);
          if (
            lastToolExecution &&
            lastToolExecution.name === toolName &&
            lastToolExecution.argsKey === argsKey
          ) {
            hadConsecutiveDuplicate = true;
            return {
              isDuplicateConsecutive: true,
              message: `Інструмент "${toolName}" щойно був викликаний з такими самими параметрами. Повторні ідентичні виклики підряд заборонені. Сформулюй фінальну відповідь користувачу на основі вже отриманих даних.`,
            };
          }
          lastToolExecution = { name: toolName, argsKey };
          return originalExecute(args, options);
        },
      };
    }

    // 4. Stream turn with agentic tool loop
    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      temperature: 0.1,
      stopWhen: isStepCount(6),
      prepareStep: ({ stepNumber, steps }) => {
        if (steps.length > 0) {
          const lastStep = steps[steps.length - 1];
          const lastToolCalls = lastStep.toolCalls || [];
          const lastCall = lastToolCalls[lastToolCalls.length - 1];

          // Check if previous step and last step called the same tool with identical input
          const isConsecutiveIdentical =
            steps.length >= 2 &&
            (() => {
              const prevCalls = steps[steps.length - 2]?.toolCalls || [];
              const currCalls = steps[steps.length - 1]?.toolCalls || [];
              const prev = prevCalls[prevCalls.length - 1];
              const curr = currCalls[currCalls.length - 1];
              return (
                prev &&
                curr &&
                prev.toolName === curr.toolName &&
                canonicalArgsKey(prev.input) === canonicalArgsKey(curr.input)
              );
            })();

          // If duplicate consecutive call was detected, or near step limit (stepNumber >= 5 out of 6),
          // force toolChoice to "none" and clear activeTools so model produces final text response.
          if (hadConsecutiveDuplicate || isConsecutiveIdentical || stepNumber >= 5) {
            return { toolChoice: "none", activeTools: [] };
          }

          // If last step called a tool with zero parameters, exclude it from activeTools for this step
          // so the model cannot call it with identical parameters in a row.
          if (lastCall && ZERO_ARG_TOOLS.has(lastCall.toolName)) {
            const availableTools = (Object.keys(tools) as (keyof typeof tools)[]).filter(
              (name) => name !== lastCall.toolName
            );
            return {
              toolChoice: "auto",
              activeTools: availableTools,
            };
          }
        }
        return {};
      },
      onStepFinish: async (step) => {
        try {
          if (step.toolCalls && step.toolCalls.length > 0) {
            for (const tc of step.toolCalls) {
              const anyTc = tc as Record<string, unknown>;
              aiLogger.logToolCall({
                sessionId: currentSessionId,
                userId,
                toolName: tc.toolName,
                toolCallId: tc.toolCallId,
                args: anyTc.input ?? anyTc.args,
              });
            }
          }
          if (step.toolResults && step.toolResults.length > 0) {
            for (const tr of step.toolResults) {
              const anyTr = tr as Record<string, unknown>;
              aiLogger.logToolResult({
                sessionId: currentSessionId,
                userId,
                toolName: tr.toolName,
                toolCallId: tr.toolCallId,
                result: anyTr.output ?? anyTr.result,
              });
            }
          }
        } catch (err) {
          console.error("[onStepFinish logging error]", err);
        }
      },
      onFinish: async (event) => {
        const durationMs = Date.now() - startTime;
        let responseContent = event.text || "";
        // Prevent hallucinated raw tool call JSON strings from being saved as text
        if (responseContent.trim().startsWith('{"name":') && responseContent.includes('"arguments":')) {
          responseContent = "";
        }

        aiLogger.logOutput({
          sessionId: currentSessionId,
          userId,
          text: responseContent,
          toolCallsCount: event.toolCalls?.length || 0,
          durationMs,
          finishReason: event.finishReason,
          usage: event.usage,
        });

        if (currentSessionId) {
          try {
            await prisma.chatMessage.create({
              data: {
                sessionId: currentSessionId,
                role: "assistant",
                content: responseContent,
                toolCalls:
                  event.toolCalls && event.toolCalls.length > 0
                    ? (event.toolCalls as unknown as object)
                    : undefined,
              },
            });
            // Touch session updated_at
            await prisma.chatSession.update({
              where: { id: currentSessionId },
              data: { updatedAt: new Date() },
            });
          } catch (err) {
            console.error("Failed to persist assistant message:", err);
          }
        }
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "x-session-id": currentSessionId,
      },
    });
  } catch (error) {
    aiLogger.logError({
      sessionId: currentSessionId,
      userId: activeUserId,
      error,
      context: "POST /api/ai/chat",
    });
    console.error("AI chat route error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal AI chat error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
