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
      category: "bag",
      profile: null,
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

    expect(parseAccessoryTypeFormData(formData)).toEqual({ name: "Besace", category: "bag", profile: null });
  });

  /**
   * Verifies that accessory type form data keeps the selected filter category
   */
  test("parseAccessoryTypeFormData parses the filter category", () => {
    const formData = new FormData();
    formData.set("name", "Bague magnétique");
    formData.set("category", "filter");

    expect(parseAccessoryTypeFormData(formData)).toEqual({ name: "Bague magnétique", category: "filter", profile: null });
  });

  test("parseAccessoryTypeFormData parses other accessory profiles", () => {
    const formData = new FormData();
    formData.set("name", "Batterie drone");
    formData.set("category", "other");
    formData.set("profile", "battery");

    expect(parseAccessoryTypeFormData(formData)).toEqual({ name: "Batterie drone", category: "other", profile: "battery" });
  });

  /**
   * Verifies that other accessory types require a profile
   */
  test("accessoryTypeSchema rejects other category without profile", () => {
    expect(() => accessoryTypeSchema.parse({ name: "Chargeur", category: "other", profile: null })).toThrow(ZodError);
  });

  /**
   * Verifies that non-other categories reject an other-only profile
   */
  test("accessoryTypeSchema rejects profiles on non-other categories", () => {
    expect(() => accessoryTypeSchema.parse({ name: "Sac à dos", category: "bag", profile: "battery" })).toThrow(ZodError);
  });
});
