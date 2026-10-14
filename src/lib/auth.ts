import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import prisma from "../../utils/prisma/prisma";

export const AUTH_COOKIE_NAME = "auth_token";
const AUTH_SECRET =
  process.env.AUTH_SECRET || "nutrition-tracker-secret-session-key-2026-safe";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function signToken(userId: string): string {
  const data = `${userId}.${Date.now()}`;
  const sig = createHmac("sha256", AUTH_SECRET).update(data).digest("hex");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [userId, timestampStr, signature] = parts;
    const data = `${userId}.${timestampStr}`;
    const expectedSig = createHmac("sha256", AUTH_SECRET).update(data).digest("hex");
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const timestamp = parseInt(timestampStr, 10);
    // 60-day session expiry
    if (isNaN(timestamp) || Date.now() - timestamp > 60 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return user;
}
