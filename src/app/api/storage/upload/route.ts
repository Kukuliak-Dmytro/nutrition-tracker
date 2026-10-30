import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { uploadImageToStorage } from "@/lib/storage/s3";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const mimeType = (file.type || "image/jpeg").toLowerCase();
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to MinIO S3 storage
    const { url, key } = await uploadImageToStorage(buffer, mimeType);

    // 2. Prepare base64 for Gemini multimodal input
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      url,
      key,
      mimeType,
      dataUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload image";
    console.error("[Storage Upload Error]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
