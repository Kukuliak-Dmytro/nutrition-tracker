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
    const tools = getAgentTools(userId);
    const systemPrompt = buildSystemPrompt({ currentDate, currentTime });
    const model = getLLMModel();
    const modelMessages = await convertToModelMessages(messages);

    // 4. Stream turn with agentic tool loop
    const TERMINAL_TOOLS = new Set([
      "get_weight_loss_progress",
      "get_nutrition_goals",
      "get_nutrition_summary",
      "get_logged_meals",
      "get_available_dishes",
      "delete_logged_meal",
      "update_nutrition_goals",
      "log_food_entry",
    ]);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      temperature: 0.1,
      stopWhen: isStepCount(5),
      prepareStep: ({ stepNumber, steps }) => {
        if (steps.length > 0) {
          const executedTools = steps.flatMap(
            (s) => s.toolResults?.map((tr) => tr.toolName) ?? []
          );
          const lastStep = steps[steps.length - 1];
          const hasCompletedTerminal = lastStep?.toolResults?.some((tr) =>
            TERMINAL_TOOLS.has(tr.toolName)
          );

          // Once a terminal action or data summary tool is executed, or if we're near the step limit,
          // force toolChoice to "none" so the model is guaranteed to generate a final text response.
          if (hasCompletedTerminal || stepNumber >= 4) {
            return { toolChoice: "none" };
          }

          // For intermediate steps (e.g. search_foods -> search_web_nutrition -> log_food_entry),
          // eliminate already executed tools from activeTools to prevent local model attractor loops.
          const availableTools = Object.keys(tools).filter(
            (t) => !executedTools.includes(t)
          );

          if (availableTools.length === 0) {
            return { toolChoice: "none" };
          }

          return {
            toolChoice: "auto",
            activeTools: availableTools as (keyof typeof tools)[],
          };
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
