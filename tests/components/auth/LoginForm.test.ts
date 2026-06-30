import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { loginAction } from "@/app/actions/auth-actions";

const reactHookMocks = vi.hoisted(() => ({
  useActionState: undefined as
    | undefined
    | ((
        action: typeof loginAction,
        initialState: { error?: string },
      ) => [{ error?: string }, (formData: FormData) => void, boolean]),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  const useActionState = (
    action: typeof loginAction,
    initialState: { error?: string },
  ) =>
    reactHookMocks.useActionState
      ? reactHookMocks.useActionState(action, initialState)
      : actual.useActionState(action, initialState);

  return {
    ...actual,
    default: { ...actual, useActionState },
    useActionState,
  };
});

vi.mock("@/app/actions/auth-actions", () => ({
  loginAction: vi.fn(),
}));

import { LoginForm } from "../../../src/components/auth/LoginForm";

function findElement(
  node: ReactNode,
  predicate: (element: { type: unknown; props: Record<string, unknown> }) => boolean,
): { type: unknown; props: Record<string, unknown> } | undefined {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") {
    return undefined;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);
      if (match) return match;
    }
    return undefined;
  }

  if (typeof node === "object" && "type" in node && "props" in node && node.props) {
    const element = node as { type: unknown; props: Record<string, unknown> };
    if (predicate(element)) return element;
    return findElement(element.props.children as ReactNode, predicate);
  }

  return undefined;
}

describe("LoginForm", () => {
  beforeEach(() => {
    reactHookMocks.useActionState = undefined;
    vi.clearAllMocks();
  });

  /**
   * Verifies that the form binds useActionState to loginAction and renders credentials fields
   */
  test("wires the form action to loginAction with the expected password field", () => {
    const formAction = vi.fn();
    reactHookMocks.useActionState = vi.fn().mockReturnValue([{}, formAction, false]);

    const node = LoginForm();
    const form = findElement(node, (element) => element.type === "form");
    const input = findElement(node, (element) => element.type === "input");
    const button = findElement(node, (element) => element.type === "button");

    expect(reactHookMocks.useActionState).toHaveBeenCalledWith(loginAction, {});
    expect(form?.props.action).toBe(formAction);
    expect(input?.props).toMatchObject({
      name: "password",
      type: "password",
      required: true,
      autoFocus: true,
      autoComplete: "current-password",
    });
    expect(button?.props.disabled).toBe(false);
    expect(button?.props.children).toBe("Se connecter");
  });

  /**
   * Verifies that login errors are rendered in an alert region
   */
  test("renders the current login error from action state", () => {
    reactHookMocks.useActionState = vi
      .fn()
      .mockReturnValue([{ error: "Mot de passe invalide." }, vi.fn(), false]);

    const node = LoginForm();
    const alert = findElement(node, (element) => element.props.role === "alert");

    expect(alert?.props.children).toBe("Mot de passe invalide.");
  });

  /**
   * Verifies that pending submissions disable the button and show the loading label
   */
  test("disables the submit button while login is pending", () => {
    reactHookMocks.useActionState = vi.fn().mockReturnValue([{}, vi.fn(), true]);

    const node = LoginForm();
    const button = findElement(node, (element) => element.type === "button");

    expect(button?.props.disabled).toBe(true);
    expect(button?.props.children).toBe("Connexion…");
  });
});
