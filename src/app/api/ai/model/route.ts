import { NextResponse } from "next/server";
import { getActiveModelInfo } from "@/lib/ai/adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const info = getActiveModelInfo();
  return NextResponse.json(info);
}
