import { NextRequest, NextResponse } from "next/server";
import { s3Client, S3_BUCKET } from "@/lib/storage/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key || key.includes("..")) {
    return new NextResponse("Invalid file key", { status: 400 });
  }

  try {
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    const bytes = await s3Response.Body?.transformToByteArray();
    if (!bytes) {
      return new NextResponse("File not found", { status: 404 });
    }

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": s3Response.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[Storage GET] Error fetching object from S3:", err);
    return new NextResponse("File not found", { status: 404 });
  }
}
