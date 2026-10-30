import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const SYSTEM_INSTRUCTION = `You are an expert multilingual speech-to-text transcriber for a food, nutrition, and meal logging application.
Transcribe the user's spoken audio into text accurately.
The user is speaking in Ukrainian or English. They are describing what they ate, meal names, ingredients, portion sizes, or nutritional weights (e.g., "з'їв 200 грам гречки та 150 грам курячого філе", "вівсянка на молоці з бананом", "два варених яйця і тост", "капучино 300 мл без цукру").

Strict rules:
1. Return ONLY the transcribed text verbatim.
2. Do NOT add any preamble, conversational replies, polite remarks, quotation marks, or explanations.
3. If the audio contains only silence, background noise, or no recognizable speech, return an empty string.`;

// Handles both standard part.text and Gemini Transcribe part.audioTranscription.text
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTranscriptionText(response: any): string {
  try {
    const candidate = response?.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      const texts: string[] = [];
      for (const part of parts) {
        if (typeof part.text === "string" && part.text.trim()) {
          texts.push(part.text.trim());
        } else if (
          part.audioTranscription &&
          typeof part.audioTranscription.text === "string" &&
          part.audioTranscription.text.trim()
        ) {
          texts.push(part.audioTranscription.text.trim());
        }
      }
      if (texts.length > 0) {
        return texts.join(" ");
      }
    }
  } catch (e) {
    console.error("[Transcribe] Error extracting parts:", e);
  }

  try {
    return typeof response.text === "function" ? response.text() : "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("audio") as Blob | File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "Google Generative AI API key is not configured" },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = (file.type || "audio/webm").split(";")[0].trim() || "audio/webm";

    const genAI = new GoogleGenerativeAI(apiKey.trim());

    const promptParts = [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: SYSTEM_INSTRUCTION },
    ];

    let transcribedText = "";

    // 1. Try dedicated transcribe model first
    try {
      const primaryModel = genAI.getGenerativeModel({
        model: process.env.GEMINI_TRANSCRIBE_MODEL || "gemini-3.5-transcribe",
      });
      const response = await primaryModel.generateContent(promptParts);
      transcribedText = extractTranscriptionText(response.response);
    } catch (primaryError: unknown) {
      const errMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn("[Transcribe] Primary model failed, trying fallback:", errMsg);

      // 2. Fallback to multimodal Gemini model (e.g. gemini-3.5-flash-lite)
      const fallbackModelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
      const fallbackModel = genAI.getGenerativeModel({
        model: fallbackModelName,
      });
      const response = await fallbackModel.generateContent(promptParts);
      transcribedText = extractTranscriptionText(response.response);
    }

    // Clean up potential formatting artifacts
    const cleanText = transcribedText
      .trim()
      .replace(/^["'«»]+|["'«»]+$/g, "")
      .replace(/^Транскрипція:\s*/i, "")
      .trim();

    console.log(
      `[Transcribe] File size: ${file.size} bytes, mime: ${mimeType}, result: "${cleanText}"`
    );

    return NextResponse.json({ text: cleanText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal transcription error";
    console.error("[Transcribe] Endpoint error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
