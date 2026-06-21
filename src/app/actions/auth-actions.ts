"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth/session";
import { assertSameOriginRequest } from "@/lib/auth/csrf";
import { verifyPassword } from "@/lib/auth/password";
import { clearAttempts, isRateLimited, recordFailedAttempt } from "@/lib/auth/rate-limit";

export async function loginAction(_previousState: { error?: string }, formData: FormData) {
  const headerStore = await headers();
  const forwardedIp = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = process.env.TRUST_PROXY === "true" && forwardedIp ? forwardedIp : "shared-login";
  if (isRateLimited(ip)) return { error: "Trop de tentatives. Réessayez plus tard." };

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    recordFailedAttempt(ip);
    return { error: "Mot de passe invalide." };
  }
  clearAttempts(ip);
  await createSession();
  redirect("/");
}

export async function logoutAction() {
  await assertSameOriginRequest();
  await destroySession();
  redirect("/login");
}
