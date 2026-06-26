import { describe, expect, test } from "vitest";

import {
  formatBatteryLife,
  formatBodyIsoRange,
  formatBodyPrice,
  formatBodyWeight,
  formatBurstFps,
  formatMegapixels,
  generateBodyLabel,
  getBodySensorFormatLabel,
  getBodyTypeLabel,
  normalizeBodyInput,
} from "../../../src/lib/body/body-utils";
import type { BodyInput } from "../../../src/lib/body/types";

const baseInput: BodyInput = {
  brandId: "brand-1",
  mountId: "mount-1",
  name: " EOS R6 Mark II ",
  bodyType: "mirrorless",
  isInterchangeableLens: true,
  sensorFormat: "FULL_FRAME",
  megapixels: 24.2,
  isoMin: 100,
  isoMax: 102400,
  priceEur: 0,
  weightG: 0,
  burstFps: 12,
  videoSpecs: "4K60",
  batteryLifeShots: 580,
  hasIbis: true,
  hasDualCardSlot: true,
  isWeatherSealed: true,
  hasArticulatedScreen: true,
  notes: null,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
};

describe("body utils", () => {
  /**
   * Verifies that body labels trim both brand and name before joining them
   */
  test("generateBodyLabel trims brand and name", () => {
    expect(generateBodyLabel({ brand: "  Canon ", name: " EOS R5  " })).toBe("Canon EOS R5");
  });

  /**
   * Verifies that normalization keeps the mount for interchangeable bodies
   */
  test("normalizeBodyInput preserves mount for interchangeable bodies", () => {
    expect(normalizeBodyInput(baseInput, { brand: "Canon", mount: "Canon RF" })).toMatchObject({
      name: "EOS R6 Mark II",
      brand: "Canon",
      mountId: "mount-1",
      mount: "Canon RF",
      label: "Canon EOS R6 Mark II",
      isInterchangeableLens: true,
    });
  });

  /**
   * Verifies that normalization clears mount data for fixed-lens bodies
   */
  test("normalizeBodyInput clears mount for fixed-lens bodies", () => {
    expect(normalizeBodyInput({ ...baseInput, isInterchangeableLens: false, mountId: "mount-1" }, { brand: "Canon", mount: null })).toMatchObject({
      mountId: null,
      mount: null,
      isInterchangeableLens: false,
    });
  });

  /**
   * Verifies that price and weight formatters keep zero values visible
   */
  test("formatBodyPrice and formatBodyWeight render zero values", () => {
    expect(formatBodyPrice(0)).toBe("0.00 €");
    expect(formatBodyWeight(0)).toBe("0 g");
  });

  /**
   * Verifies that ISO range formatting handles full, partial, and empty ranges
   */
  test("formatBodyIsoRange handles all ISO range variants", () => {
    expect(formatBodyIsoRange({ isoMin: 100, isoMax: 102400 })).toBe("100–102400");
    expect(formatBodyIsoRange({ isoMin: 100, isoMax: null })).toBe("100");
    expect(formatBodyIsoRange({ isoMin: null, isoMax: null })).toBe("—");
  });

  /**
   * Verifies that body label helpers return the expected localized strings
   */
  test("returns localized labels for body type and sensor format", () => {
    expect(getBodyTypeLabel("mirrorless")).toBe("Hybride");
    expect(getBodyTypeLabel("dslr")).toBe("Reflex");
    expect(getBodySensorFormatLabel("MICRO_FOUR_THIRDS")).toBe("Micro 4/3");
    expect(getBodySensorFormatLabel("OTHER")).toBe("Autre");
  });

  /**
   * Verifies that numeric helper formatters return fallbacks for null values
   */
  test("returns fallbacks for nullable numeric helpers", () => {
    expect(formatMegapixels(null)).toBe("—");
    expect(formatBurstFps(null)).toBe("—");
    expect(formatBatteryLife(null)).toBe("—");
  });
});
