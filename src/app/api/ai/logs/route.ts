import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { aiLogger } from "@/lib/ai/logger";

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 50;

    const logs = await aiLogger.getRecentLogs(limit);

    // Filter logs for this user if available
    const userLogs = logs.filter((log) => !log.userId || log.userId === userId);

    return NextResponse.json({
      total: userLogs.length,
      logs: userLogs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load logs" },
      { status: 500 }
    );
  }
}
