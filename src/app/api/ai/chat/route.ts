import { NextRequest } from "next/server";
import { convertToModelMessages, isStepCount, streamText } from "ai";
import { getSessionUserId } from "@/lib/auth";
import prisma from "../../../../../utils/prisma/prisma";
import { getAgentTools } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getLLMModel } from "@/lib/ai/adapter";

export const maxDuration = 60; // Allow up to 60s for agentic tool loops

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
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

    const currentSessionId = activeSession.id;

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

    // 3. Setup agent tools and system prompt
    const tools = getAgentTools(userId);
    const systemPrompt = buildSystemPrompt({ currentDate, currentTime });
    const model = getLLMModel();
    const modelMessages = await convertToModelMessages(messages);

    // 4. Stream turn with agentic tool loop
    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: isStepCount(5),
      onFinish: async (event) => {
        try {
          await prisma.chatMessage.create({
            data: {
              sessionId: currentSessionId,
              role: "assistant",
              content: event.text || "",
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
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "x-session-id": currentSessionId,
      },
    });
  } catch (error) {
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
