import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getLLMModel() {
  const geminiApiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim().length > 0) {
    const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const google = createGoogleGenerativeAI({
      apiKey: geminiApiKey.trim(),
    });
    return google(geminiModel);
  }

  // Fallback to local Ollama if no cloud API key provided
  const baseURL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const modelName = process.env.OLLAMA_MODEL || "nutrition-agent:3b";

  const client = createOpenAICompatible({
    name: "ollama",
    baseURL: baseURL.endsWith("/v1") ? baseURL : `${baseURL}/v1`,
  });

  return client(modelName);
}

export function getActiveModelInfo() {
  const geminiApiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim().length > 0) {
    const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    let displayName = "Gemini Flash";
    if (geminiModel.includes("3.8")) displayName = "Gemini 3.8 Flash";
    else if (geminiModel.includes("3.5")) displayName = "Gemini 3.5 Flash";

    return {
      provider: "google",
      displayName,
      isCloud: true,
    };
  }

  const modelName = process.env.OLLAMA_MODEL || "nutrition-agent:3b";
  return {
    provider: "ollama",
    displayName: modelName.includes("3b") ? "Qwen 2.5 3B Local" : "Ollama Local",
    isCloud: false,
  };
}
