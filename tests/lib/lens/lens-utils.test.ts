import { describe, expect, test } from "vitest";

import {
  calculateApscEquivalent,
  formatApertureRange,
  formatFocalRange,
  formatOptions,
  formatNumber,
  generateLensLabel,
  getLensKind,
  isConstantAperture,
  isPrimeLens,
  normalizeLensInput,
  roundNumber
} from "../../../src/lib/lens/lens-utils";
import type { LensInput } from "../../../src/lib/lens/types";

const refs = {
  brand: "Sigma",
  mount: "E",
  sensorType: "FULL_FRAME" as const,
  options: [
    { id: "33333333-3333-4333-8333-333333333331", code: "DG", description: "Digital", brandId: "11111111-1111-4111-8111-111111111111" },
    { id: "33333333-3333-4333-8333-333333333332", code: "DN", description: "Mirrorless", brandId: "11111111-1111-4111-8111-111111111111" }
  ]
};

const baseLensInput: LensInput = {
  brandId: "11111111-1111-4111-8111-111111111111",
  mountId: "22222222-2222-4222-8222-222222222221",
  optionIds: refs.options.map((option) => option.id),
  focalMinMm: 24,
  focalMaxMm: 70,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 4,
  minApertureAtMinFocal: null,
  minApertureAtMaxFocal: null,
  filterDiameterMm: 82,
  priceEur: 999,
  minFocusDistanceM: 0.18,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 11,
  opticalFormula: null,
  weightG: 835,
  isFavorite: true,
  isNextPurchase: false,
  isOwned: true
};

describe("lens-utils", () => {
  /**
   * Verifies that identical focal bounds are detected as a prime lens
   */
  test("isPrimeLens returns true for identical focal lengths", () => {
    expect(isPrimeLens({ focalMinMm: 50, focalMaxMm: 50 })).toBe(true);
  });

  /**
   * Verifies that different focal bounds are detected as a zoom lens
   */
  test("isPrimeLens returns false for different focal lengths", () => {
    expect(isPrimeLens({ focalMinMm: 24, focalMaxMm: 70 })).toBe(false);
  });

  /**
   * Verifies that lens kind is derived from focal bounds
   */
  test("getLensKind returns Fixe or Zoom from focal bounds", () => {
    expect(getLensKind({ focalMinMm: 50, focalMaxMm: 50 })).toBe("Fixe");
    expect(getLensKind({ focalMinMm: 24, focalMaxMm: 70 })).toBe("Zoom");
  });

  /**
   * Verifies that identical aperture bounds are constant aperture
   */
  test("isConstantAperture returns true for equal aperture values", () => {
    expect(isConstantAperture({ maxApertureAtMinFocal: 2.8, maxApertureAtMaxFocal: 2.8 })).toBe(true);
  });

  /**
   * Verifies that full frame focal lengths are converted to APS-C
   */
  test("calculateApscEquivalent applies crop factor for full frame", () => {
    expect(calculateApscEquivalent("FULL_FRAME", 35)).toBe(52.5);
  });

  /**
   * Verifies that APS-C focal lengths are left unchanged
   */
  test("calculateApscEquivalent keeps APS-C focal length unchanged", () => {
    expect(calculateApscEquivalent("APS_C", 35)).toBe(35);
  });

  /**
   * Verifies that decimal values are rounded to one digit
   */
  test("roundNumber rounds values to one decimal place", () => {
    expect(roundNumber(10.26)).toBe(10.3);
  });

  /**
   * Verifies that numbers are formatted without useless decimals
   */
  test("formatNumber omits trailing zero decimals", () => {
    expect(formatNumber(4)).toBe("4");
    expect(formatNumber(2.8)).toBe("2.8");
  });

  /**
   * Verifies that display formatting does not silently round stored precision
   */
  test("formatNumber preserves non-integer precision", () => {
    expect(formatNumber(7.85)).toBe("7.85");
  });

  /**
   * Verifies that option codes are formatted in their input order
   */
  test("formatOptions joins option codes in input order", () => {
    expect(formatOptions(refs.options)).toBe("DG DN");
  });

  /**
   * Verifies that empty options format to an empty string
   */
  test("formatOptions returns empty string for empty options", () => {
    expect(formatOptions([])).toBe("");
  });

  /**
   * Verifies that identical focal bounds are not repeated
   */
  test("formatFocalRange avoids repeating fixed focal lengths", () => {
    expect(formatFocalRange({ focalMinMm: 7.8, focalMaxMm: 7.8 })).toBe("7.8 mm");
    expect(formatFocalRange({ focalMinMm: 24, focalMaxMm: 70 })).toBe("24-70 mm");
  });

  /**
   * Verifies that identical aperture bounds are not repeated
   */
  test("formatApertureRange avoids repeating constant apertures", () => {
    expect(formatApertureRange({ maxApertureAtMinFocal: 4, maxApertureAtMaxFocal: 4 })).toBe("f/4");
    expect(formatApertureRange({ maxApertureAtMinFocal: 4, maxApertureAtMaxFocal: 5.6 })).toBe("f/4-5.6");
  });

  /**
   * Verifies that zoom labels include focal and aperture ranges
   */
  test("generateLensLabel builds zoom label with aperture range", () => {
    expect(generateLensLabel({ ...baseLensInput, brand: refs.brand, mount: refs.mount, options: refs.options })).toBe("Sigma E 24-70 f/2.8-4 DG DN");
  });

  /**
   * Verifies that prime labels use single focal and aperture values
   */
  test("generateLensLabel builds prime label with constant aperture", () => {
    expect(generateLensLabel({
      ...baseLensInput,
      brand: "Sony",
      mount: "E",
      focalMinMm: 50,
      focalMaxMm: 50,
      maxApertureAtMinFocal: 1.8,
      maxApertureAtMaxFocal: 1.8,
      options: []
    })).toBe("Sony E 50 f/1.8");
  });

  /**
   * Verifies that normalized input computes equivalents from mount sensor type
   */
  test("normalizeLensInput computes derived fields", () => {
    expect(normalizeLensInput(baseLensInput, refs)).toMatchObject({
      brand: "Sigma",
      mount: "E",
      options: refs.options,
      apscFocalMinEquivalentMm: 36,
      apscFocalMaxEquivalentMm: 105
    });
  });

  /**
   * Verifies that normalized labels use reference fields
   */
  test("normalizeLensInput builds label from reference fields", () => {
    expect(normalizeLensInput(baseLensInput, refs).label).toBe("Sigma E 24-70 f/2.8-4 DG DN");
  });
});
