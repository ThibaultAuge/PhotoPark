import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockRedirect = vi.hoisted(() => vi.fn());
const mockHasValidSession = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/auth/session", () => ({
  hasValidSession: mockHasValidSession,
}));

vi.mock("@/components/auth/LoginForm", () => ({
  LoginForm: function LoginFormMock() {
    return createElement("div", { "data-testid": "login-form" }, "LOGIN_FORM");
  },
}));

import LoginPage from "../../../src/app/login/page";

describe("login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Verifies that authenticated users are redirected to the home page
   */
  test("redirects authenticated users to the lenses route", async () => {
    mockHasValidSession.mockResolvedValue(true);
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockHasValidSession).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/lenses");
  });

  /**
   * Verifies that unauthenticated users receive the login shell and form
   */
  test("renders the login form for unauthenticated users", async () => {
    mockHasValidSession.mockResolvedValue(false);

    const page = await LoginPage();
    const html = renderToStaticMarkup(page);

    expect(mockHasValidSession).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(html).toContain("class=\"login-shell\"");
    expect(html).toContain("LOGIN_FORM");
  });
});
