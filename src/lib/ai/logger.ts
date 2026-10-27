import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOGS_DIR, "ai-agent.log");

interface BaseLogParams {
  sessionId?: string | null;
  userId?: string | null;
}

interface InputLogParams extends BaseLogParams {
  userMessage: string;
  totalMessages: number;
}

interface ToolCallLogParams extends BaseLogParams {
  toolName: string;
  toolCallId?: string;
  args: unknown;
}

interface ToolResultLogParams extends BaseLogParams {
  toolName: string;
  toolCallId?: string;
  result: unknown;
}

interface OutputLogParams extends BaseLogParams {
  text: string;
  toolCallsCount: number;
  durationMs: number;
  finishReason?: string;
  usage?: unknown;
}

interface ErrorLogParams extends BaseLogParams {
  error: unknown;
  context?: string;
}

class AILogger {
  private isInitialized = false;

  private async ensureDir() {
    if (!this.isInitialized) {
      try {
        await fs.promises.mkdir(LOGS_DIR, { recursive: true });
        this.isInitialized = true;
      } catch (err) {
        console.error("[AILogger] Failed to create logs dir:", err);
      }
    }
  }

  private async writeLog(level: "INPUT" | "TOOL_CALL" | "TOOL_RESULT" | "OUTPUT" | "ERROR", data: Record<string, unknown>) {
    await this.ensureDir();
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      ...data,
    };

    const line = JSON.stringify(logEntry) + "\n";

    // 1. Append to log file
    fs.appendFile(LOG_FILE, line, (err) => {
      if (err) console.error("[AILogger] Error writing to log file:", err);
    });

    // 2. Formatted terminal output for live development and container debugging
    const sessStr = data.sessionId ? `[${String(data.sessionId).slice(0, 8)}]` : "";
    switch (level) {
      case "INPUT":
        console.log(`\x1b[36m[AI:INPUT]\x1b[0m ${sessStr} User: "${data.userMessage}"`);
        break;
      case "TOOL_CALL":
        console.log(
          `\x1b[33m[AI:TOOL_CALL]\x1b[0m ${sessStr} \x1b[1m${data.toolName}\x1b[0m(${JSON.stringify(data.args)})`
        );
        break;
      case "TOOL_RESULT": {
        const preview = JSON.stringify(data.result);
        const truncated = preview.length > 200 ? preview.slice(0, 200) + "..." : preview;
        console.log(`\x1b[34m[AI:TOOL_RESULT]\x1b[0m ${sessStr} \x1b[1m${data.toolName}\x1b[0m -> ${truncated}`);
        break;
      }
      case "OUTPUT":
        console.log(
          `\x1b[35m[AI:OUTPUT]\x1b[0m ${sessStr} (${data.durationMs}ms) Response: "${String(data.text).slice(0, 150)}${String(data.text).length > 150 ? "..." : ""}"`
        );
        break;
      case "ERROR":
        console.error(`\x1b[31m[AI:ERROR]\x1b[0m ${sessStr}`, data.error);
        break;
    }
  }

  public logInput(params: InputLogParams) {
    this.writeLog("INPUT", {
      sessionId: params.sessionId,
      userId: params.userId,
      userMessage: params.userMessage,
      totalMessages: params.totalMessages,
    });
  }

  public logToolCall(params: ToolCallLogParams) {
    this.writeLog("TOOL_CALL", {
      sessionId: params.sessionId,
      userId: params.userId,
      toolName: params.toolName,
      toolCallId: params.toolCallId,
      args: params.args,
    });
  }

  public logToolResult(params: ToolResultLogParams) {
    this.writeLog("TOOL_RESULT", {
      sessionId: params.sessionId,
      userId: params.userId,
      toolName: params.toolName,
      toolCallId: params.toolCallId,
      result: params.result,
    });
  }

  public logOutput(params: OutputLogParams) {
    this.writeLog("OUTPUT", {
      sessionId: params.sessionId,
      userId: params.userId,
      text: params.text,
      toolCallsCount: params.toolCallsCount,
      durationMs: params.durationMs,
      finishReason: params.finishReason,
      usage: params.usage,
    });
  }

  public logError(params: ErrorLogParams) {
    this.writeLog("ERROR", {
      sessionId: params.sessionId,
      userId: params.userId,
      error: params.error instanceof Error ? { message: params.error.message, stack: params.error.stack } : params.error,
      context: params.context,
    });
  }

  public async getRecentLogs(limit = 100): Promise<Array<Record<string, unknown>>> {
    try {
      if (!fs.existsSync(LOG_FILE)) return [];
      const content = await fs.promises.readFile(LOG_FILE, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      return lines
        .slice(-limit)
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return { raw: l };
          }
        })
        .reverse();
    } catch {
      return [];
    }
  }
}

export const aiLogger = new AILogger();
