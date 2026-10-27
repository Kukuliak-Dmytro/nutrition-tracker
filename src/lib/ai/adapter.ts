import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getLLMModel() {
  const baseURL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const modelName = process.env.OLLAMA_MODEL || "qwen2.5:3b";

  // Support both Ollama and cloud OpenAI-compatible providers
  const client = createOpenAICompatible({
    name: "ollama",
    baseURL: baseURL.endsWith("/v1") ? baseURL : `${baseURL}/v1`,
  });

  return client(modelName);
}
