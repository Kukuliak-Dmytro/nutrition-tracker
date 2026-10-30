import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const endpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "deadnet_admin";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "deadnet_secret_key";
export const S3_BUCKET = process.env.S3_BUCKET_NAME || "nutrition-tracker";

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Required for MinIO
});

let isBucketChecked = false;
async function ensureBucketExists(): Promise<void> {
  if (isBucketChecked) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    isBucketChecked = true;
  } catch {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      isBucketChecked = true;
    } catch (createErr) {
      console.warn("[S3] Bucket verification/creation warning:", createErr);
    }
  }
}

export async function uploadImageToStorage(
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string; key: string }> {
  await ensureBucketExists();

  const extension = mimeType.split("/")[1] || "jpeg";
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpeg";
  const key = `meals/${Date.now()}-${randomUUID()}.${safeExt}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  const url = process.env.S3_PUBLIC_URL
    ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`
    : `/api/storage/file?key=${encodeURIComponent(key)}`;

  return { url, key };
}

export async function deleteImageFromStorage(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  await s3Client.send(command);
}
