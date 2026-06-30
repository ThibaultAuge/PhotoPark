import { describe, expect, test } from "vitest";
import { defaultBodyFilters, filterBodies } from "../../../src/components/body/BodyProvider";
import type { Body } from "../../../src/lib/body/types";

const baseBody: Body = {
  id: "body-1",
  brandId: "brand-1",
  brand: "Canon",
  mountId: "mount-1",
  mount: "Canon RF",
  name: "EOS R6 Mark II",
  label: "Canon EOS R6 Mark II",
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
  notes: "Boîtier principal",
  isFavorite: true,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const retiredBody: Body = {
  ...baseBody,
  id: "body-2",
  brandId: "brand-2",
  brand: "Nikon",
  mountId: "mount-2",
  mount: "Nikon F",
  name: "D850",
  label: "Nikon D850",
  bodyType: "dslr",
  sensorFormat: "FULL_FRAME",
  videoSpecs: "4K30",
  hasIbis: false,
  hasDualCardSlot: true,
  isFavorite: false,
  isNextPurchase: true,
  isOwned: false,
  retired: true,
};

const compactBody: Body = {
  ...baseBody,
  id: "body-3",
  brandId: "brand-3",
  brand: "Olympus",
  mountId: null,
  mount: null,
  name: "Tough TG-6",
  label: "Olympus Tough TG-6",
  bodyType: "compact",
  isInterchangeableLens: false,
  sensorFormat: "CMOS",
  isFavorite: false,
  isNextPurchase: false,
  isOwned: true,
  retired: false,
};

describe("filterBodies", () => {
  /**
   * Verifies that default body filters start with no active constraints
   */
  test("exports the expected default filters", () => {
    expect(defaultBodyFilters).toEqual({
      query: "",
      brand: "",
      mount: "",
      sensorFormat: "",
      bodyType: "",
      status: "",
    });
  });

  /**
   * Verifies that text search matches label, video specs, and notes fields
   */
  test("filters by trimmed case-insensitive text query", () => {
    expect(filterBodies([baseBody], { ...defaultBodyFilters, query: " canon " })).toEqual([baseBody]);
    expect(filterBodies([baseBody], { ...defaultBodyFilters, query: "4K60" })).toEqual([baseBody]);
    expect(filterBodies([baseBody], { ...defaultBodyFilters, query: "introuvable" })).toEqual([]);
  });

  /**
   * Verifies that structural filters match exact brand, mount, type, and format
   */
  test("filters by brand, mount, sensor format and body type", () => {
    const bodies = [baseBody, retiredBody, compactBody];
    expect(filterBodies(bodies, { ...defaultBodyFilters, brand: "brand-2" })).toEqual([retiredBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, mount: "mount-1" })).toEqual([baseBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, sensorFormat: "FULL_FRAME" })).toEqual([baseBody, retiredBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, sensorFormat: "CMOS" })).toEqual([compactBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, bodyType: "dslr" })).toEqual([retiredBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, bodyType: "compact" })).toEqual([compactBody]);
  });

  /**
   * Verifies that each status filter returns only bodies with that flag
   */
  test("filters by each supported status", () => {
    const bodies = [baseBody, retiredBody];
    expect(filterBodies(bodies, { ...defaultBodyFilters, status: "favorite" })).toEqual([baseBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, status: "next" })).toEqual([retiredBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, status: "owned" })).toEqual([baseBody]);
    expect(filterBodies(bodies, { ...defaultBodyFilters, status: "retired" })).toEqual([retiredBody]);
  });
});
