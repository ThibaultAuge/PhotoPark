import { describe, expect, test } from "vitest";

import { parseLensLabel } from "../../../src/lib/lens/label-parser";
import type { LensReferenceData } from "../../../src/lib/lens/types";

const referenceData: LensReferenceData = {
  brands: [
    { id: "11111111-1111-4111-8111-111111111111", name: "Canon" },
    { id: "11111111-1111-4111-8111-111111111112", name: "Canon Pro" }
  ],
  mounts: [
    { id: "22222222-2222-4222-8222-222222222221", name: "E", sensorType: "FULL_FRAME" },
    { id: "22222222-2222-4222-8222-222222222222", name: "EF", sensorType: "FULL_FRAME" },
    { id: "22222222-2222-4222-8222-222222222223", name: "RF", sensorType: "FULL_FRAME" }
  ],
  options: [
    { id: "33333333-3333-4333-8333-333333333331", code: "IS", description: "Stabilisé" },
    { id: "33333333-3333-4333-8333-333333333332", code: "USM", description: "Ultrasonic" },
    { id: "33333333-3333-4333-8333-333333333333", code: "L", description: "Luxury" },
    { id: "33333333-3333-4333-8333-333333333334", code: "IS II", description: "Stabilisé génération II" }
  ]
};

describe("parseLensLabel", () => {
  /**
   * Verifies that the canonical example parses French decimal commas.
   */
  test("parses Canon EF zoom label with decimal comma aperture range", () => {
    expect(parseLensLabel("Canon EF 18-55 F/3,5-5,6 IS", referenceData)).toMatchObject({
      brandId: "11111111-1111-4111-8111-111111111111",
      mountId: "22222222-2222-4222-8222-222222222222",
      focalMinMm: 18,
      focalMaxMm: 55,
      maxApertureAtMinFocal: 3.5,
      maxApertureAtMaxFocal: 5.6,
      optionIds: ["33333333-3333-4333-8333-333333333331"]
    });
  });

  /**
   * Verifies that prime labels duplicate single focal and aperture values.
   */
  test("parses prime lens labels as identical focal and aperture bounds", () => {
    expect(parseLensLabel("Canon RF 50mm f/1.8", referenceData)).toMatchObject({
      mountId: "22222222-2222-4222-8222-222222222223",
      focalMinMm: 50,
      focalMaxMm: 50,
      maxApertureAtMinFocal: 1.8,
      maxApertureAtMaxFocal: 1.8
    });
  });

  /**
   * Verifies that multiple option codes are returned in reference order.
   */
  test("parses multiple known option codes", () => {
    expect(parseLensLabel("Canon EF 70-200 f/2.8 L IS USM", referenceData).optionIds).toEqual([
      "33333333-3333-4333-8333-333333333331",
      "33333333-3333-4333-8333-333333333332",
      "33333333-3333-4333-8333-333333333333"
    ]);
  });

  /**
   * Verifies that unknown words do not block partial parsing.
   */
  test("ignores unknown label parts", () => {
    expect(parseLensLabel("Unknown EF 24-70 f/4 Magic", referenceData)).toMatchObject({
      mountId: "22222222-2222-4222-8222-222222222222",
      focalMinMm: 24,
      focalMaxMm: 70,
      maxApertureAtMinFocal: 4,
      maxApertureAtMaxFocal: 4
    });
  });

  /**
   * Verifies that longest reference names win when names overlap.
   */
  test("prioritizes longest brand and mount names", () => {
    expect(parseLensLabel("Canon Pro EF 35 f/2", referenceData)).toMatchObject({
      brandId: "11111111-1111-4111-8111-111111111112",
      mountId: "22222222-2222-4222-8222-222222222222"
    });
  });

  /**
   * Verifies that empty labels do not return inferred field values.
   */
  test("returns no fields for empty labels", () => {
    expect(parseLensLabel("", referenceData)).toEqual({});
    expect(parseLensLabel("   ", referenceData)).toEqual({});
  });

  /**
   * Verifies that unicode ranges and aperture glyphs are parsed correctly.
   */
  test("parses unicode focal range and aperture glyph labels", () => {
    expect(parseLensLabel("Canon RF 24–70mm ƒ/2.8 IS", referenceData)).toMatchObject({
      brandId: "11111111-1111-4111-8111-111111111111",
      mountId: "22222222-2222-4222-8222-222222222223",
      focalMinMm: 24,
      focalMaxMm: 70,
      maxApertureAtMinFocal: 2.8,
      maxApertureAtMaxFocal: 2.8,
      optionIds: ["33333333-3333-4333-8333-333333333331"]
    });
  });

  /**
   * Verifies that ratio-style apertures with decimal commas are parsed.
   */
  test("parses ratio aperture notation with decimal comma", () => {
    expect(parseLensLabel("Canon RF 85mm 1:1,2 USM", referenceData)).toMatchObject({
      focalMinMm: 85,
      focalMaxMm: 85,
      maxApertureAtMinFocal: 1.2,
      maxApertureAtMaxFocal: 1.2,
      optionIds: ["33333333-3333-4333-8333-333333333332"]
    });
  });

  /**
   * Verifies that references are not matched inside longer words.
   */
  test("does not match references inside longer words", () => {
    const parsed = parseLensLabel("Canon Every 35mm f/2 historic", referenceData);

    expect(parsed.brandId).toBe("11111111-1111-4111-8111-111111111111");
    expect(parsed.mountId).toBeUndefined();
    expect(parsed.optionIds).toBeUndefined();
    expect(parsed.focalMinMm).toBe(35);
    expect(parsed.maxApertureAtMinFocal).toBe(2);
  });

  /**
   * Verifies that focal ranges are preferred over earlier standalone numbers.
   */
  test("prefers focal ranges over standalone version numbers", () => {
    expect(parseLensLabel("Canon RF 1 10-30 f/3.5", referenceData)).toMatchObject({
      focalMinMm: 10,
      focalMaxMm: 30,
      maxApertureAtMinFocal: 3.5
    });
  });

  /**
   * Verifies that explicit mm focal values outrank earlier ambiguous ranges.
   */
  test("prefers explicit mm focal values over earlier ambiguous ranges", () => {
    expect(parseLensLabel("Canon RF model 1-2 50mm f/1.8", referenceData)).toMatchObject({
      focalMinMm: 50,
      focalMaxMm: 50,
      maxApertureAtMinFocal: 1.8
    });
  });

  /**
   * Verifies that longer overlapping options suppress their shorter token parts.
   */
  test("prioritizes longer overlapping option codes", () => {
    expect(parseLensLabel("Canon RF 24-70 f/4 IS II", referenceData).optionIds).toEqual([
      "33333333-3333-4333-8333-333333333334"
    ]);
  });
});
