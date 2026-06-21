import { pbkdf2Sync } from "node:crypto";

import { afterEach, describe, expect, test } from "vitest";

import { verifyPassword } from "../../../src/lib/auth/password";

const originalPasswordHash = process.env.APP_PASSWORD_HASH;
const originalPassword = process.env.APP_PASSWORD;

function restoreEnv(name: "APP_PASSWORD_HASH" | "APP_PASSWORD", value: string | undefined) {
  if (typeof value === "undefined") {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function pbkdf2Hash(password: string) {
  const iterations = 1000;
  const salt = "test-salt";
  const expected = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  return `pbkdf2:sha256:${iterations}:${salt}:${expected}`;
}

describe("password auth", () => {
  afterEach(() => {
    restoreEnv("APP_PASSWORD_HASH", originalPasswordHash);
    restoreEnv("APP_PASSWORD", originalPassword);
  });

  /**
   * Verifies that a valid PBKDF2 hash accepts the matching password
   */
  test("verifyPassword returns true for matching pbkdf2 hash", () => {
    process.env.APP_PASSWORD_HASH = pbkdf2Hash("correct horse battery staple");
    delete process.env.APP_PASSWORD;

    expect(verifyPassword("correct horse battery staple")).toBe(true);
  });

  /**
   * Verifies that a valid PBKDF2 hash rejects a wrong password
   */
  test("verifyPassword returns false for wrong pbkdf2 password", () => {
    process.env.APP_PASSWORD_HASH = pbkdf2Hash("correct horse battery staple");
    delete process.env.APP_PASSWORD;

    expect(verifyPassword("wrong password")).toBe(false);
  });

  /**
   * Verifies that malformed hash configuration rejects all passwords
   */
  test("verifyPassword returns false for malformed hash", () => {
    process.env.APP_PASSWORD_HASH = "pbkdf2:sha512:1000:test-salt:abc";
    process.env.APP_PASSWORD = "fallback-is-ignored";

    expect(verifyPassword("fallback-is-ignored")).toBe(false);
  });

  /**
   * Verifies that plain fallback password works when hash is absent
   */
  test("verifyPassword uses fallback password when hash is absent", () => {
    delete process.env.APP_PASSWORD_HASH;
    process.env.APP_PASSWORD = "local-secret";

    expect(verifyPassword("local-secret")).toBe(true);
    expect(verifyPassword("other-secret")).toBe(false);
  });

  /**
   * Verifies that missing password configuration rejects login
   */
  test("verifyPassword returns false when no password is configured", () => {
    delete process.env.APP_PASSWORD_HASH;
    delete process.env.APP_PASSWORD;

    expect(verifyPassword("anything")).toBe(false);
  });
});
