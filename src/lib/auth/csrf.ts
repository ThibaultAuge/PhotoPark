import { headers } from "next/headers";

export async function assertSameOriginRequest() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  if (!origin || !host) throw new Error("Missing request origin.");
  const originHost = new URL(origin).host;
  if (originHost !== host) throw new Error("Invalid request origin.");
}
