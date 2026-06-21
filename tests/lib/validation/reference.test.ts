import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import {
  brandSchema,
  mountSchema,
  optionSchema,
  parseBrandFormData,
  parseMountFormData,
  parseOptionFormData
} from "../../../src/lib/validation/reference";

describe("reference validation", () => {
  /**
   * Verifies that brand names are trimmed when input is valid
   */
  test("brandSchema trims valid brand names", () => {
    expect(brandSchema.parse({ name: "  Canon  " })).toEqual({ name: "Canon" });
  });

  /**
   * Verifies that empty brand names are rejected after trimming
   */
  test("brandSchema rejects blank brand names", () => {
    expect(() => brandSchema.parse({ name: "   " })).toThrow(ZodError);
  });

  /**
   * Verifies that overlong brand names are rejected
   */
  test("brandSchema rejects brand names longer than maximum", () => {
    expect(() => brandSchema.parse({ name: "a".repeat(81) })).toThrow(ZodError);
  });

  /**
   * Verifies that mount data accepts full frame sensor type
   */
  test("mountSchema accepts full frame sensor type", () => {
    expect(mountSchema.parse({ name: "  Canon RF  ", sensorType: "FULL_FRAME" })).toEqual({
      name: "Canon RF",
      sensorType: "FULL_FRAME"
    });
  });

  /**
   * Verifies that mount data accepts APS-C sensor type
   */
  test("mountSchema accepts APS-C sensor type", () => {
    expect(mountSchema.parse({ name: "Canon RF-S", sensorType: "APS_C" })).toEqual({
      name: "Canon RF-S",
      sensorType: "APS_C"
    });
  });

  /**
   * Verifies that mount data rejects unknown sensor type
   */
  test("mountSchema rejects unknown sensor type", () => {
    expect(() => mountSchema.parse({ name: "Canon RF", sensorType: "MEDIUM_FORMAT" })).toThrow(ZodError);
  });

  /**
   * Verifies that mount names longer than maximum are rejected
   */
  test("mountSchema rejects mount names longer than maximum", () => {
    expect(() => mountSchema.parse({ name: "a".repeat(41), sensorType: "FULL_FRAME" })).toThrow(ZodError);
  });

  /**
   * Verifies that option data is trimmed when input is valid
   */
  test("optionSchema trims valid option fields", () => {
    expect(optionSchema.parse({ code: "  IS  ", description: "  Stabilisation optique  " })).toEqual({
      code: "IS",
      description: "Stabilisation optique"
    });
  });

  /**
   * Verifies that blank option codes are rejected
   */
  test("optionSchema rejects blank option codes", () => {
    expect(() => optionSchema.parse({ code: "   ", description: "Stabilisation optique" })).toThrow(ZodError);
  });

  /**
   * Verifies that blank option descriptions are rejected
   */
  test("optionSchema rejects blank option descriptions", () => {
    expect(() => optionSchema.parse({ code: "IS", description: "   " })).toThrow(ZodError);
  });

  /**
   * Verifies that overlong option fields are rejected
   */
  test("optionSchema rejects option fields longer than maximum", () => {
    expect(() => optionSchema.parse({ code: "a".repeat(21), description: "Valid" })).toThrow(ZodError);
    expect(() => optionSchema.parse({ code: "IS", description: "a".repeat(161) })).toThrow(ZodError);
  });

  /**
   * Verifies that brand form data parses a valid name
   */
  test("parseBrandFormData parses valid brand form values", () => {
    const formData = new FormData();
    formData.set("name", "  Nikon  ");

    expect(parseBrandFormData(formData)).toEqual({ name: "Nikon" });
  });

  /**
   * Verifies that mount form data parses name and sensor type
   */
  test("parseMountFormData parses valid mount form values", () => {
    const formData = new FormData();
    formData.set("name", "  Sony E  ");
    formData.set("sensorType", "FULL_FRAME");

    expect(parseMountFormData(formData)).toEqual({ name: "Sony E", sensorType: "FULL_FRAME" });
  });

  /**
   * Verifies that option form data parses code and description
   */
  test("parseOptionFormData parses valid option form values", () => {
    const formData = new FormData();
    formData.set("code", "  USM  ");
    formData.set("description", "  Motorisation ultrasonique  ");

    expect(parseOptionFormData(formData)).toEqual({
      code: "USM",
      description: "Motorisation ultrasonique"
    });
  });
});
