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
    { id: "33333333-3333-4333-8333-333333333331", code: "IS", description: "Stabilisé", brandId: "11111111-1111-4111-8111-111111111111" },
    { id: "33333333-3333-4333-8333-333333333332", code: "USM", description: "Ultrasonic", brandId: "11111111-1111-4111-8111-111111111111" },
    { id: "33333333-3333-4333-8333-333333333333", code: "L", description: "Luxury", brandId: "11111111-1111-4111-8111-111111111111" },
    { id: "33333333-3333-4333-8333-333333333334", code: "IS II", description: "Stabilisé génération II", brandId: "11111111-1111-4111-8111-111111111111" }
  ],
  optionGroups: [],
  optionGroupMembers: []
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

  // -----------------------------------------------------------------------
  // Brand-specific option matching
  // -----------------------------------------------------------------------

  const multiBrandReferenceData: LensReferenceData = {
    brands: [
      { id: "canon-brand-id", name: "Canon" },
      { id: "sony-brand-id", name: "Sony" }
    ],
    mounts: [
      { id: "mount-1", name: "RF", sensorType: "FULL_FRAME" },
      { id: "mount-2", name: "E", sensorType: "FULL_FRAME" }
    ],
    options: [
      // Canon-only options
      { id: "canon-opt-is", code: "IS", description: "Stabilisé", brandId: "canon-brand-id" },
      { id: "canon-opt-usm", code: "USM", description: "Ultrasonique", brandId: "canon-brand-id" },
      // Sony-only options
      { id: "sony-opt-gm", code: "GM", description: "G Master", brandId: "sony-brand-id" },
      { id: "sony-opt-oss", code: "OSS", description: "Optical SteadyShot", brandId: "sony-brand-id" }
    ],
    optionGroups: [],
    optionGroupMembers: []
  };

  /**
   * Verifies that when a brand is identified, only options belonging to that
   * brand are matched. A Canon lens should not match a Sony-only option code.
   */
  test("matches only options of identified brand for Canon lens", () => {
    const result = parseLensLabel("Canon RF 24-70 f/2.8 IS GM", multiBrandReferenceData);
    // "IS" is a Canon option -> should match
    expect(result.optionIds).toContain("canon-opt-is");
    // "GM" is a Sony-only option -> should NOT match because brand is Canon
    expect(result.optionIds).not.toContain("sony-opt-gm");
  });

  /**
   * Verifies that when a Sony brand is identified, only Sony options match
   */
  test("matches only options of identified brand for Sony lens", () => {
    const result = parseLensLabel("Sony E 24-70 f/2.8 GM OSS", multiBrandReferenceData);
    // Both GM and OSS are Sony options -> should match
    expect(result.optionIds).toContain("sony-opt-gm");
    expect(result.optionIds).toContain("sony-opt-oss");
  });

  /**
   * Verifies that when no brand is identified, all options across all brands
   * are searched and matched
   */
  test("searches all options when brand is unknown", () => {
    const result = parseLensLabel("Generic E 24-70 f/2.8 IS GM", multiBrandReferenceData);
    // Brand is unknown -> all options are searched
    expect(result.brandId).toBeUndefined();
    // Both Canon IS and Sony GM should match
    expect(result.optionIds).toContain("canon-opt-is");
    expect(result.optionIds).toContain("sony-opt-gm");
  });

  /**
   * Verifies that option codes unique to a brand do not appear when
   * another brand is identified
   */
  test("does not cross-match options between brands", () => {
    // Sony brand identified — OSS should match, IS (Canon) should not
    const result = parseLensLabel("Sony E 70-200 f/2.8 GM OSS IS", multiBrandReferenceData);
    expect(result.optionIds).toContain("sony-opt-gm");
    expect(result.optionIds).toContain("sony-opt-oss");
    expect(result.optionIds).not.toContain("canon-opt-is");
  });
});
