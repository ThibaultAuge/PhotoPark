import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { accessorySchema, parseAccessoryFormData } from "../../../src/lib/validation/accessory";

describe("accessory validation", () => {
  /**
   * Verifies that valid accessory data is accepted and trimmed by the schema
   */
  test("accessorySchema accepts valid accessory data", () => {
    expect(accessorySchema.parse({
      brandId: "11111111-1111-4111-8111-111111111111",
      typeId: "22222222-2222-4222-8222-222222222222",
      name: "  Everyday Backpack  ",
      capacityLiters: 20,
      capacityBodies: 2,
      capacityLenses: 4,
      fitsLaptop: true,
      fitsTripod: true,
      widthMm: 300,
      heightMm: 450,
      depthMm: 180,
      weightG: 1660,
      priceEur: 299,
      carryStyleNotes: "Confortable",
      capacityNotes: "2 boîtiers + 4 objectifs",
      isFavorite: true,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    }).name).toBe("Everyday Backpack");
  });

  /**
   * Verifies that invalid brand and type UUIDs are rejected by the schema
   */
  test("accessorySchema rejects invalid UUIDs", () => {
    expect(() => accessorySchema.parse({
      brandId: "bad",
      typeId: "bad",
      name: "Test",
      capacityLiters: null,
      capacityBodies: null,
      capacityLenses: null,
      fitsLaptop: false,
      fitsTripod: false,
      widthMm: null,
      heightMm: null,
      depthMm: null,
      weightG: null,
      priceEur: null,
      carryStyleNotes: null,
      capacityNotes: null,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: false,
      retired: false,
    })).toThrow(ZodError);
  });

  /**
   * Verifies that form data parses checkboxes and decimal numbers correctly
   */
  test("parseAccessoryFormData parses checkboxes and decimals", () => {
    const formData = new FormData();
    formData.set("brandId", "11111111-1111-4111-8111-111111111111");
    formData.set("typeId", "22222222-2222-4222-8222-222222222222");
    formData.set("name", "Field Pouch");
    formData.set("capacityLiters", "3,5");
    formData.set("weightG", "250");
    formData.set("fitsLaptop", "on");
    formData.set("isOwned", "on");

    expect(parseAccessoryFormData(formData)).toMatchObject({
      name: "Field Pouch",
      capacityLiters: 3.5,
      weightG: 250,
      fitsLaptop: true,
      fitsTripod: false,
      isOwned: true,
    });
  });

  /**
   * Verifies that blank optional fields become null and unchecked boxes false
   */
  test("parseAccessoryFormData normalizes empty optional fields", () => {
    const formData = new FormData();
    formData.set("brandId", "11111111-1111-4111-8111-111111111111");
    formData.set("typeId", "22222222-2222-4222-8222-222222222222");
    formData.set("name", "  Field Pouch  ");
    formData.set("capacityLiters", "");
    formData.set("capacityBodies", "");
    formData.set("capacityLenses", "");
    formData.set("carryStyleNotes", "   ");
    formData.set("capacityNotes", "  Compact  ");

    expect(parseAccessoryFormData(formData)).toMatchObject({
      name: "Field Pouch",
      capacityLiters: null,
      capacityBodies: null,
      capacityLenses: null,
      carryStyleNotes: null,
      capacityNotes: "Compact",
      fitsLaptop: false,
      fitsTripod: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: false,
      retired: false,
    });
  });

  /**
   * Verifies that non-integer capacity counts are rejected during parsing
   */
  test("parseAccessoryFormData rejects invalid integer capacity values", () => {
    const formData = new FormData();
    formData.set("brandId", "11111111-1111-4111-8111-111111111111");
    formData.set("typeId", "22222222-2222-4222-8222-222222222222");
    formData.set("name", "Field Pouch");
    formData.set("capacityBodies", "2.5");

    expect(() => parseAccessoryFormData(formData)).toThrow(ZodError);
  });
});
