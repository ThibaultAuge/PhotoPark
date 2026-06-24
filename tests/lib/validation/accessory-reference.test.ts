import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import {
  accessoryTypeSchema,
  parseAccessoryTypeFormData,
} from "../../../src/lib/validation/accessory-reference";

describe("accessory reference validation", () => {
  /**
   * Verifies that accessory type names are trimmed when input is valid
   */
  test("accessoryTypeSchema trims valid type names", () => {
    expect(accessoryTypeSchema.parse({ name: "  Sac à dos  " })).toEqual({
      name: "Sac à dos",
    });
  });

  /**
   * Verifies that blank accessory type names are rejected after trimming
   */
  test("accessoryTypeSchema rejects blank type names", () => {
    expect(() => accessoryTypeSchema.parse({ name: "   " })).toThrow(ZodError);
  });

  /**
   * Verifies that overlong accessory type names are rejected
   */
  test("accessoryTypeSchema rejects names longer than maximum", () => {
    expect(() => accessoryTypeSchema.parse({ name: "a".repeat(81) })).toThrow(ZodError);
  });

  /**
   * Verifies that accessory type form data is parsed and trimmed correctly
   */
  test("parseAccessoryTypeFormData parses valid form values", () => {
    const formData = new FormData();
    formData.set("name", "  Besace  ");

    expect(parseAccessoryTypeFormData(formData)).toEqual({ name: "Besace" });
  });
});
