import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import {
  brandSchema,
  mountSchema,
  optionSchema,
  optionGroupSchema,
  parseBrandFormData,
  parseMountFormData,
  parseOptionFormData,
  parseOptionGroupFormData
} from "../../../src/lib/validation/reference";

describe("reference validation", () => {
  /**
   * Verifies that brand names are trimmed when input is valid
   */
  test("brandSchema trims valid brand names", () => {
    expect(brandSchema.parse({ name: "  Canon  ", domains: ["lenses"] })).toEqual({ name: "Canon", domains: ["lenses"] });
  });

  test("brandSchema accepts bodies domain", () => {
    expect(brandSchema.parse({ name: "Canon", domains: ["bodies"] })).toEqual({ name: "Canon", domains: ["bodies"] });
  });

  /**
   * Verifies that empty brand names are rejected after trimming
   */
  test("brandSchema rejects blank brand names", () => {
    expect(() => brandSchema.parse({ name: "   ", domains: ["lenses"] })).toThrow(ZodError);
  });

  /**
   * Verifies that overlong brand names are rejected
   */
  test("brandSchema rejects brand names longer than maximum", () => {
    expect(() => brandSchema.parse({ name: "a".repeat(81), domains: ["lenses"] })).toThrow(ZodError);
  });

  /**
   * Verifies that at least one brand domain is required
   */
  test("brandSchema requires at least one domain", () => {
    expect(() => brandSchema.parse({ name: "Canon", domains: [] })).toThrow(ZodError);
  });

  /**
   * Verifies that unknown brand domains are rejected by the schema
   */
  test("brandSchema rejects unknown brand domains", () => {
    expect(() => brandSchema.parse({ name: "Canon", domains: ["bags"] })).toThrow(ZodError);
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
    expect(optionSchema.parse({ code: "  IS  ", description: "  Stabilisation optique  ", brandId: "11111111-1111-4111-8111-111111111111" })).toEqual({
      code: "IS",
      description: "Stabilisation optique",
      brandId: "11111111-1111-4111-8111-111111111111"
    });
  });

  /**
   * Verifies that blank option codes are rejected
   */
  test("optionSchema rejects blank option codes", () => {
    expect(() => optionSchema.parse({ code: "   ", description: "Stabilisation optique", brandId: "11111111-1111-4111-8111-111111111111" })).toThrow(ZodError);
  });

  /**
   * Verifies that blank option descriptions are rejected
   */
  test("optionSchema rejects blank option descriptions", () => {
    expect(() => optionSchema.parse({ code: "IS", description: "   ", brandId: "11111111-1111-4111-8111-111111111111" })).toThrow(ZodError);
  });

  /**
   * Verifies that overlong option fields are rejected
   */
  test("optionSchema rejects option fields longer than maximum", () => {
    expect(() => optionSchema.parse({ code: "a".repeat(21), description: "Valid", brandId: "11111111-1111-4111-8111-111111111111" })).toThrow(ZodError);
    expect(() => optionSchema.parse({ code: "IS", description: "a".repeat(161), brandId: "11111111-1111-4111-8111-111111111111" })).toThrow(ZodError);
  });

  /**
   * Verifies that brand form data parses a valid name
   */
  test("parseBrandFormData parses valid brand form values", () => {
    const formData = new FormData();
    formData.set("name", "  Nikon  ");
    formData.append("domains", "lenses");
    formData.append("domains", "accessories");
    formData.append("domains", "bodies");

    expect(parseBrandFormData(formData)).toEqual({ name: "Nikon", domains: ["lenses", "accessories", "bodies"] });
  });

  /**
   * Verifies that brand form data rejects submissions without any domain
   */
  test("parseBrandFormData rejects missing brand domains", () => {
    const formData = new FormData();
    formData.set("name", "Nikon");

    expect(() => parseBrandFormData(formData)).toThrow(ZodError);
  });

  /**
   * Verifies that brand form data rejects unsupported domain values
   */
  test("parseBrandFormData rejects unknown brand domains", () => {
    const formData = new FormData();
    formData.set("name", "Nikon");
    formData.append("domains", "bags");

    expect(() => parseBrandFormData(formData)).toThrow(ZodError);
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
    formData.set("brandId", "11111111-1111-4111-8111-111111111111");

    expect(parseOptionFormData(formData)).toEqual({
      code: "USM",
      description: "Motorisation ultrasonique",
      brandId: "11111111-1111-4111-8111-111111111111"
    });
  });

  // -----------------------------------------------------------------------
  // optionGroupSchema
  // -----------------------------------------------------------------------

  /**
   * Verifies that option group schema trims valid slug and name fields
   */
  test("optionGroupSchema trims valid option group fields", () => {
    expect(optionGroupSchema.parse({ slug: "  stabilization  ", name: "  Stabilisation  ", type: "flag" })).toEqual({
      slug: "stabilization",
      name: "Stabilisation",
      type: "flag"
    });
  });

  /**
   * Verifies that blank option group slugs are rejected after trimming
   */
  test("optionGroupSchema rejects blank slug", () => {
    expect(() => optionGroupSchema.parse({ slug: "   ", name: "Stabilisation", type: "flag" })).toThrow(ZodError);
  });

  /**
   * Verifies that blank option group names are rejected after trimming
   */
  test("optionGroupSchema rejects blank name", () => {
    expect(() => optionGroupSchema.parse({ slug: "stabilization", name: "   ", type: "flag" })).toThrow(ZodError);
  });

  /**
   * Verifies that overlong option group fields are rejected
   */
  test("optionGroupSchema rejects fields longer than maximum", () => {
    expect(() => optionGroupSchema.parse({ slug: "a".repeat(41), name: "Valid", type: "flag" })).toThrow(ZodError);
    expect(() => optionGroupSchema.parse({ slug: "valid", name: "a".repeat(81), type: "flag" })).toThrow(ZodError);
  });

  /**
   * Verifies that option group schema accepts value type
   */
  test("optionGroupSchema accepts value type", () => {
    expect(optionGroupSchema.parse({ slug: "motor", name: "Motorisation", type: "value" })).toEqual({
      slug: "motor",
      name: "Motorisation",
      type: "value"
    });
  });

  /**
   * Verifies that option group schema rejects unknown type
   */
  test("optionGroupSchema rejects unknown type", () => {
    expect(() => optionGroupSchema.parse({ slug: "test", name: "Test", type: "boolean" })).toThrow(ZodError);
  });

  // -----------------------------------------------------------------------
  // parseOptionGroupFormData
  // -----------------------------------------------------------------------

  /**
   * Verifies that parseOptionGroupFormData parses valid form values
   */
  test("parseOptionGroupFormData parses valid form values", () => {
    const formData = new FormData();
    formData.set("slug", "  stabilization  ");
    formData.set("name", "  Stabilisation  ");
    formData.set("type", "flag");

    expect(parseOptionGroupFormData(formData)).toEqual({
      slug: "stabilization",
      name: "Stabilisation",
      type: "flag"
    });
  });

  /**
   * Verifies that parseOptionGroupFormData accepts value type
   */
  test("parseOptionGroupFormData parses value type group", () => {
    const formData = new FormData();
    formData.set("slug", "motor");
    formData.set("name", "Motorisation");
    formData.set("type", "value");

    expect(parseOptionGroupFormData(formData)).toEqual({
      slug: "motor",
      name: "Motorisation",
      type: "value"
    });
  });
});
