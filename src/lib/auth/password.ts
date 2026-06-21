import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

export function verifyPassword(password: string) {
  const encoded = process.env.APP_PASSWORD_HASH;
  if (!encoded) {
    const fallback = process.env.APP_PASSWORD;
    if (!fallback) return false;
    return safeCompare(password, fallback);
  }
  const [scheme, digest, iterationsRaw, salt, expected] = encoded.split(":");
  if (scheme !== "pbkdf2" || digest !== "sha256" || !iterationsRaw || !salt || !expected) return false;
  const actual = pbkdf2Sync(password, salt, Number(iterationsRaw), 32, digest).toString("base64url");
  return safeCompare(actual, expected);
}

function safeCompare(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
