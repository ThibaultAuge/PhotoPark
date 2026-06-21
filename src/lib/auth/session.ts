import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "photos_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export async function createSession() {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const nonce = randomUUID();
  const payload = `${expires}.${nonce}`;
  const signature = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hasValidSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [expiresRaw, nonce, signature] = value.split(".");
  if (!expiresRaw || !nonce || !signature) return false;
  if (Number(expiresRaw) < Math.floor(Date.now() / 1000)) return false;
  return safeCompare(sign(`${expiresRaw}.${nonce}`), signature);
}

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeCompare(actual: string, expected: string) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
