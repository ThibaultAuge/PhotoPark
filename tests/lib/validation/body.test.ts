import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import { bodySchema, parseBodyFormData } from "../../../src/lib/validation/body";

const BRAND_ID = "11111111-1111-4111-8111-111111111111";
const MOUNT_ID = "22222222-2222-4222-8222-222222222221";

describe("body validation", () => {
  /**
   * Verifies that a valid interchangeable body passes schema validation
   */
  test("accepts a valid interchangeable body", () => {
    expect(bodySchema.parse({
      brandId: BRAND_ID,
      mountId: MOUNT_ID,
      name: "EOS R6 Mark II",
      bodyType: "mirrorless",
      isInterchangeableLens: true,
      sensorFormat: "FULL_FRAME",
      megapixels: 24.2,
      isoMin: 100,
      isoMax: 102400,
      priceEur: 2899,
      weightG: 670,
      burstFps: 12,
      videoSpecs: "4K60",
      batteryLifeShots: 580,
      hasIbis: true,
      hasDualCardSlot: true,
      isWeatherSealed: true,
      hasArticulatedScreen: true,
      notes: null,
      isFavorite: true,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    }).mountId).toBe(MOUNT_ID);
  });

  /**
   * Verifies that interchangeable bodies require a mount identifier
   */
  test("rejects interchangeable body without mount", () => {
    expect(() => bodySchema.parse({
      brandId: BRAND_ID,
      mountId: null,
      name: "EOS R8",
      bodyType: "mirrorless",
      isInterchangeableLens: true,
      sensorFormat: "FULL_FRAME",
      megapixels: null,
      isoMin: null,
      isoMax: null,
      priceEur: null,
      weightG: null,
      burstFps: null,
      videoSpecs: null,
      batteryLifeShots: null,
      hasIbis: false,
      hasDualCardSlot: false,
      isWeatherSealed: false,
      hasArticulatedScreen: false,
      notes: null,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: false,
      retired: false,
    })).toThrow(ZodError);
  });

  /**
   * Verifies that fixed-lens bodies reject any submitted mount identifier
   */
  test("rejects fixed-lens body with mount", () => {
    expect(() => bodySchema.parse({
      brandId: BRAND_ID,
      mountId: MOUNT_ID,
      name: "PowerShot",
      bodyType: "mirrorless",
      isInterchangeableLens: false,
      sensorFormat: "OTHER",
      megapixels: null,
      isoMin: null,
      isoMax: null,
      priceEur: null,
      weightG: null,
      burstFps: null,
      videoSpecs: null,
      batteryLifeShots: null,
      hasIbis: false,
      hasDualCardSlot: false,
      isWeatherSealed: false,
      hasArticulatedScreen: false,
      notes: null,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: false,
      retired: false,
    })).toThrow(ZodError);
  });

  /**
   * Verifies that ISO validation rejects ranges where max is below min
   */
  test("rejects descending iso range", () => {
    expect(() => bodySchema.parse({
      brandId: BRAND_ID,
      mountId: MOUNT_ID,
      name: "EOS R5",
      bodyType: "mirrorless",
      isInterchangeableLens: true,
      sensorFormat: "FULL_FRAME",
      megapixels: 45,
      isoMin: 6400,
      isoMax: 100,
      priceEur: null,
      weightG: null,
      burstFps: null,
      videoSpecs: null,
      batteryLifeShots: null,
      hasIbis: true,
      hasDualCardSlot: true,
      isWeatherSealed: true,
      hasArticulatedScreen: true,
      notes: null,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: false,
      retired: false,
    })).toThrow(ZodError);
  });

  /**
   * Verifies that form parsing trims strings and converts decimal commas
   */
  test("parses form data with decimal commas and optional mount", () => {
    const formData = new FormData();
    formData.set("brandId", BRAND_ID);
    formData.set("mountId", MOUNT_ID);
    formData.set("name", " EOS R6 Mark II ");
    formData.set("bodyType", "mirrorless");
    formData.set("isInterchangeableLens", "on");
    formData.set("sensorFormat", "FULL_FRAME");
    formData.set("megapixels", "24,2");
    formData.set("isoMin", "100");
    formData.set("isoMax", "102400");
    formData.set("priceEur", "2899,99");
    formData.set("weightG", "670");
    formData.set("burstFps", "12,0");
    formData.set("videoSpecs", " 4K60 ");
    formData.set("batteryLifeShots", "580");
    formData.set("hasIbis", "on");
    formData.set("hasDualCardSlot", "on");
    formData.set("hasArticulatedScreen", "on");
    formData.set("notes", " Boîtier principal ");
    formData.set("isOwned", "on");

    expect(parseBodyFormData(formData)).toEqual({
      brandId: BRAND_ID,
      mountId: MOUNT_ID,
      name: "EOS R6 Mark II",
      bodyType: "mirrorless",
      isInterchangeableLens: true,
      sensorFormat: "FULL_FRAME",
      megapixels: 24.2,
      isoMin: 100,
      isoMax: 102400,
      priceEur: 2899.99,
      weightG: 670,
      burstFps: 12,
      videoSpecs: "4K60",
      batteryLifeShots: 580,
      hasIbis: true,
      hasDualCardSlot: true,
      isWeatherSealed: false,
      hasArticulatedScreen: true,
      notes: "Boîtier principal",
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });
  });

  /**
   * Verifies that form parsing converts blank optional values to null
   */
  test("parses blank optional fields as null", () => {
    const formData = new FormData();
    formData.set("brandId", BRAND_ID);
    formData.set("mountId", "");
    formData.set("name", " PowerShot G7 X ");
    formData.set("bodyType", "mirrorless");
    formData.set("sensorFormat", "OTHER");

    expect(parseBodyFormData(formData)).toEqual({
      brandId: BRAND_ID,
      mountId: null,
      name: "PowerShot G7 X",
      bodyType: "mirrorless",
      isInterchangeableLens: false,
      sensorFormat: "OTHER",
      megapixels: null,
      isoMin: null,
      isoMax: null,
      priceEur: null,
      weightG: null,
      burstFps: null,
      videoSpecs: null,
      batteryLifeShots: null,
      hasIbis: false,
      hasDualCardSlot: false,
      isWeatherSealed: false,
      hasArticulatedScreen: false,
      notes: null,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: false,
      retired: false,
    });
  });
});
