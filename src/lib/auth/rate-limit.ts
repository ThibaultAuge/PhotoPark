const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string) {
  const record = attempts.get(key);
  if (!record) return false;
  if (record.resetAt < Date.now()) {
    attempts.delete(key);
    return false;
  }
  return record.count >= 5;
}

export function recordFailedAttempt(key: string) {
  const existing = attempts.get(key);
  const resetAt = Date.now() + 15 * 60 * 1000;
  attempts.set(key, { count: existing ? existing.count + 1 : 1, resetAt });
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
