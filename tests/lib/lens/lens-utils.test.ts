import { describe, expect, test } from "vitest";

import {
  calculateApscEquivalent,
  formatOptions,
  formatNumber,
  generateLensLabel,
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
    { id: "33333333-3333-4333-8333-333333333331", code: "DG", description: "Digital" },
    { id: "33333333-3333-4333-8333-333333333332", code: "DN", description: "Mirrorless" }
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
  minAperture: 22,
  filterDiameterMm: 82,
  priceEur: 999,
  minFocusDistanceM: 0.18,
  angleAtMinFocalDeg: 84,
  angleAtMaxFocalDeg: 34,
  apertureBlades: 11,
  groupsCount: 15,
  elementsCount: 19,
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
