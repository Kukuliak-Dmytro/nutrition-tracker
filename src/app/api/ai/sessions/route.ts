import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import prisma from "../../../../../utils/prisma/prisma";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title || "Новий діалог";

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
