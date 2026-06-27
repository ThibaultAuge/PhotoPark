import { describe, expect, test } from "vitest";
import { filterAccessories, defaultAccessoryFilters, sanitizeAccessoryFilters } from "../../../src/components/accessory/AccessoryProvider";
import type { Accessory } from "../../../src/lib/accessory/types";

const baseAccessory: Accessory = {
  id: "a1",
  brandId: "b1",
  brand: "Peak Design",
  typeId: "t1",
  type: "Sac à dos",
  typeCategory: "bag",
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
  storageLocation: "bag",
  mountedOnLensId: null,
  mountedOnAccessoryId: null,
  rearMountType: "none",
  rearDiameterMm: null,
  frontMountType: "none",
  frontDiameterMm: null,
  filterRole: "general",
  filterStrength: null,
  supportsMagneticHood: false,
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
  typeCategory: "bag",
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

const filterAccessory: Accessory = {
  ...baseAccessory,
  id: "a3",
  brandId: "b3",
  brand: "Kase",
  typeId: "t3",
  type: "Filtre magnétique",
  typeCategory: "filter",
  name: "ND64",
  label: "Kase ND64",
  capacityLiters: null,
  capacityBodies: null,
  capacityLenses: null,
  fitsLaptop: false,
  fitsTripod: false,
  carryStyleNotes: null,
  capacityNotes: "Montage rapide",
  storageLocation: "reserve",
  mountedOnLensId: null,
  mountedOnAccessoryId: null,
  rearMountType: "magnetic",
  rearDiameterMm: 77,
  frontMountType: "magnetic",
  frontDiameterMm: 77,
  filterRole: "filter",
  filterStrength: "ND64",
  supportsMagneticHood: true,
  isFavorite: false,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
};

const mountedFilterAccessory: Accessory = {
  ...filterAccessory,
  id: "a4",
  label: "Kase CPL",
  name: "CPL",
  storageLocation: "bag",
  mountedOnLensId: "lens-1",
  filterStrength: "CPL",
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
      location: "",
      mountType: "",
      compatibleLensId: "",
      onlyCompatible: false,
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

  /**
   * Verifies that filter accessory queries also match strength metadata
   */
  test("filters filter accessories by strength in the text query", () => {
    expect(filterAccessories([filterAccessory], { ...defaultAccessoryFilters, query: "nd64" })).toEqual([filterAccessory]);
    expect(filterAccessories([filterAccessory], { ...defaultAccessoryFilters, query: "cpl" })).toEqual([]);
  });

  /**
   * Verifies that the location filter distinguishes reserve and mounted items
   */
  test("filters by active storage location", () => {
    const accessories = [filterAccessory, mountedFilterAccessory];

    expect(filterAccessories(accessories, { ...defaultAccessoryFilters, location: "reserve" })).toEqual([filterAccessory]);
    expect(filterAccessories(accessories, { ...defaultAccessoryFilters, location: "mounted" })).toEqual([mountedFilterAccessory]);
  });

  /**
   * Verifies that filter-specific interface filters match rear or front mounts
   */
  test("filters by mount type", () => {
    const accessories = [baseAccessory, filterAccessory];

    expect(filterAccessories(accessories, { ...defaultAccessoryFilters, mountType: "magnetic" })).toEqual([filterAccessory]);
  });

  test("sanitizes filters when switching between bag and filter pages", () => {
    const mixedFilters = { ...defaultAccessoryFilters, laptop: "yes" as const, tripod: "no" as const, location: "mounted" as const };

    expect(sanitizeAccessoryFilters(mixedFilters, "bag")).toMatchObject({ laptop: "yes", tripod: "no", location: "" });
    expect(sanitizeAccessoryFilters(mixedFilters, "filter")).toMatchObject({ laptop: "", tripod: "", location: "mounted" });
  });

});
