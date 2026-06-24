import { describe, expect, test } from "vitest";
import { filterAccessories, defaultAccessoryFilters } from "../../../src/components/accessory/AccessoryProvider";
import type { Accessory } from "../../../src/lib/accessory/types";

const baseAccessory: Accessory = {
  id: "a1",
  brandId: "b1",
  brand: "Peak Design",
  typeId: "t1",
  type: "Sac à dos",
  name: "Everyday Backpack",
  label: "Peak Design Everyday Backpack",
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
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const retiredAccessory: Accessory = {
  ...baseAccessory,
  id: "a2",
  brandId: "b2",
  brand: "Wandrd",
  typeId: "t2",
  type: "Sac bandoulière",
  name: "Rogue Sling",
  label: "Wandrd Rogue Sling",
  capacityLiters: null,
  capacityBodies: 1,
  capacityLenses: 2,
  fitsLaptop: false,
  fitsTripod: false,
  weightG: null,
  carryStyleNotes: "Compacte",
  capacityNotes: "Usage urbain",
  isFavorite: false,
  isNextPurchase: true,
  isOwned: false,
  retired: true,
};

describe("filterAccessories", () => {
  /**
   * Verifies that default accessory filters only expose the remaining fields
   */
  test("exports default filters without removed capacity and weight fields", () => {
    expect(defaultAccessoryFilters).toEqual({
      query: "",
      brand: "",
      type: "",
      status: "",
      laptop: "",
      tripod: "",
    });
  });

  /**
   * Verifies that the accessory type filter keeps only matching type IDs
   */
  test("filters by accessory type", () => {
    const result = filterAccessories([baseAccessory], { ...defaultAccessoryFilters, type: "t1" });
    expect(result).toHaveLength(1);
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, type: "other" })).toHaveLength(0);
  });

  /**
   * Verifies that the text query matches label, brand, type, and notes
   */
  test("filters by trimmed case-insensitive query across searchable fields", () => {
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, query: "  peak design  " })).toEqual([baseAccessory]);
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, query: "SAC À DOS" })).toEqual([baseAccessory]);
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, query: "boîtiers" })).toEqual([baseAccessory]);
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, query: "CONFORTABLE" })).toEqual([baseAccessory]);
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, query: "introuvable" })).toEqual([]);
  });

  /**
   * Verifies that the brand filter keeps only matching brand IDs
   */
  test("filters by brand", () => {
    expect(filterAccessories([baseAccessory, retiredAccessory], { ...defaultAccessoryFilters, brand: "b2" })).toEqual([retiredAccessory]);
  });

  /**
   * Verifies that status filters include favorite, next, owned, and retired
   */
  test("filters by each supported status", () => {
    const accessories = [baseAccessory, retiredAccessory];

    expect(filterAccessories(accessories, { ...defaultAccessoryFilters, status: "favorite" })).toEqual([baseAccessory]);
    expect(filterAccessories(accessories, { ...defaultAccessoryFilters, status: "next" })).toEqual([retiredAccessory]);
    expect(filterAccessories(accessories, { ...defaultAccessoryFilters, status: "owned" })).toEqual([baseAccessory]);
    expect(filterAccessories(accessories, { ...defaultAccessoryFilters, status: "retired" })).toEqual([retiredAccessory]);
  });

  /**
   * Verifies that the laptop filter distinguishes yes and no values
   */
  test("filters by laptop boolean", () => {
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, laptop: "yes" })).toHaveLength(1);
    expect(filterAccessories([baseAccessory], { ...defaultAccessoryFilters, laptop: "no" })).toHaveLength(0);
  });

  /**
   * Verifies that the tripod filter distinguishes yes and no values
   */
  test("filters by tripod boolean", () => {
    expect(filterAccessories([baseAccessory, retiredAccessory], { ...defaultAccessoryFilters, tripod: "yes" })).toEqual([baseAccessory]);
    expect(filterAccessories([baseAccessory, retiredAccessory], { ...defaultAccessoryFilters, tripod: "no" })).toEqual([retiredAccessory]);
  });

});
