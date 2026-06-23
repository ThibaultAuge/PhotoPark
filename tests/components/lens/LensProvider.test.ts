import { describe, expect, test } from "vitest";

import { filterLenses, defaultFilters } from "../../../src/components/lens/LensProvider";
import type { Lens, LensFilters } from "../../../src/lib/lens/types";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeLens(overrides: Partial<Lens> & { id: string }): Lens {
  return {
    brandId: "brand-a",
    brand: "Canon",
    mountId: "mount-rf",
    mount: "RF",
    sensorType: "FULL_FRAME",
    options: [],
    focalMinMm: 24,
    focalMaxMm: 70,
    apscFocalMinEquivalentMm: 36,
    apscFocalMaxEquivalentMm: 105,
    maxApertureAtMinFocal: 2.8,
    maxApertureAtMaxFocal: 4,
    minApertureAtMinFocal: null,
    minApertureAtMaxFocal: null,
    label: "Canon RF 24-70 f/2.8-4",
    filterDiameterMm: null,
    priceEur: null,
    minFocusDistanceM: null,
    angleAtMinFocalDeg: null,
    angleAtMaxFocalDeg: null,
    apertureBlades: null,
    opticalFormula: null,
    weightG: null,
    isFavorite: false,
    isNextPurchase: false,
    isOwned: false,
    retired: false,
    createdAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    ...overrides,
  };
}

const lensPrime: Lens = makeLens({
  id: "lens-prime",
  brandId: "brand-b",
  brand: "Fujifilm",
  mountId: "mount-x",
  mount: "X",
  sensorType: "APS_C",
  focalMinMm: 35,
  focalMaxMm: 35,
  apscFocalMinEquivalentMm: 53,
  apscFocalMaxEquivalentMm: 53,
  maxApertureAtMinFocal: 1.4,
  maxApertureAtMaxFocal: 1.4,
  label: "Fujifilm X 35 f/1.4",
  isFavorite: true,
});

const lensTele: Lens = makeLens({
  id: "lens-tele",
  brandId: "brand-c",
  brand: "Sigma",
  mountId: "mount-e",
  mount: "E",
  sensorType: "FULL_FRAME",
  focalMinMm: 70,
  focalMaxMm: 100,
  apscFocalMinEquivalentMm: 105,
  apscFocalMaxEquivalentMm: 150,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 2.8,
  label: "Sigma E 70-100 f/2.8",
  isNextPurchase: true,
  isOwned: false,
  options: [
    { id: "opt-os", code: "OS", description: "Optical Stabilization", brandId: "brand-c" },
  ],
});

const lensWide: Lens = makeLens({
  id: "lens-wide",
  brandId: "brand-a",
  brand: "Canon",
  mountId: "mount-rf",
  mount: "RF",
  sensorType: "FULL_FRAME",
  focalMinMm: 14,
  focalMaxMm: 35,
  apscFocalMinEquivalentMm: 21,
  apscFocalMaxEquivalentMm: 53,
  maxApertureAtMinFocal: 2.8,
  maxApertureAtMaxFocal: 4.5,
  label: "Canon RF 14-35 f/2.8-4.5",
  isOwned: true,
  options: [
    { id: "opt-l", code: "L", description: "Luxury", brandId: "brand-a" },
    { id: "opt-usm", code: "USM", description: "Ultrasonic Motor", brandId: "brand-a" },
  ],
});

const allLenses = [lensPrime, lensTele, lensWide];

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("filterLenses", () => {
  // ----- No filter (default) --------------------------------------------

  /**
   * Verifies that with default filters all lenses pass through.
   */
  test("returns all lenses with default filters", () => {
    const result = filterLenses(allLenses, defaultFilters);
    expect(result).toHaveLength(3);
    expect(result.map((l) => l.id).sort()).toEqual([
      "lens-prime",
      "lens-tele",
      "lens-wide",
    ]);
  });

  // ----- Query filter ----------------------------------------------------

  /**
   * Verifies that a query matching the lens label returns that lens.
   */
  test("query filter matches lens label", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "70-100",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-tele");
  });

  /**
   * Verifies that a query matching the brand name returns that lens.
   */
  test("query filter matches brand name", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "Fujifilm",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-prime");
  });

  /**
   * Verifies that a query matching the mount name returns that lens.
   */
  test("query filter matches mount name", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "RF",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  /**
   * Verifies that a query matching an option code returns lenses with
   * that option.
   */
  test("query filter matches option code", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "OS",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-tele");
  });

  /**
   * Verifies that a query matching option description returns that lens.
   */
  test("query filter matches option description", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "Ultrasonic",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  /**
   * Verifies that query matching is case-insensitive.
   */
  test("query filter is case-insensitive", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "SIGMA",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-tele");
  });

  /**
   * Verifies that a query matching no lens returns an empty array.
   */
  test("query returns empty when no match", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "zzzznonexistent",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(0);
  });

  // ----- Brand filter ---------------------------------------------------

  /**
   * Verifies that filtering by brandId returns only lenses of that brand.
   */
  test("brand filter returns only matching brand", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      brand: "brand-a",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  /**
   * Verifies that an empty brand filter does not filter out any lens.
   */
  test("empty brand filter passes all lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      brand: "",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(3);
  });

  // ----- Mount filter ---------------------------------------------------

  /**
   * Verifies that filtering by mountId returns only lenses with that mount.
   */
  test("mount filter returns only matching mount", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      mount: "mount-x",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-prime");
  });

  // ----- Option filter --------------------------------------------------

  /**
   * Verifies that filtering by option id returns lenses with that option.
   */
  test("option filter returns lenses with the given option", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      option: "opt-l",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  /**
   * Verifies that an option filter matching no lens returns empty.
   */
  test("option filter returns empty when no lens has that option", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      option: "opt-none",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(0);
  });

  // ----- Kind filter ----------------------------------------------------

  test("kind=prime returns only fixed lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      kind: "prime",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-prime");
  });

  test("kind=zoom returns only zoom lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      kind: "zoom",
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-tele", "lens-wide"]);
  });

  test("empty kind passes all lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      kind: "",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(3);
  });

  // ----- Status filter --------------------------------------------------

  /**
   * Verifies that status "favorite" returns only favorited lenses.
   */
  test("status=favorite returns only favorited lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      status: "favorite",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-prime");
  });

  /**
   * Verifies that status "next" returns only next-purchase lenses.
   */
  test("status=next returns only next-purchase lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      status: "next",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-tele");
  });

  /**
   * Verifies that status "owned" returns only owned lenses.
   */
  test("status=owned returns only owned lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      status: "owned",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  /**
   * Verifies that empty status does not filter.
   */
  test("empty status passes all lenses", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      status: "",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(3);
  });

  // ----- FocalMin range filter -------------------------------------------

  /**
   * Verifies that focalMinLow excludes lenses with focalMinMm below the bound.
   */
  test("focalMinLow excludes lenses below the minimum", () => {
    // lens-wide has focalMinMm=14, should be excluded with low=20
    const filters: LensFilters = {
      ...defaultFilters,
      focalMinLow: 20,
      focalMinHigh: 100,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-prime", "lens-tele"]);
  });

  /**
   * Verifies that focalMinHigh excludes lenses with focalMinMm above the bound.
   */
  test("focalMinHigh excludes lenses above the maximum", () => {
    // lens-tele has focalMinMm=70, should be excluded with high=60
    const filters: LensFilters = {
      ...defaultFilters,
      focalMinLow: 0,
      focalMinHigh: 60,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-prime", "lens-wide"]);
  });

  /**
   * Verifies that a lens on the exact focalMinLow boundary is included.
   */
  test("focalMinLow boundary — lens at exact low value is included", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      focalMinLow: 14,
      focalMinHigh: 100,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id)).toContain("lens-wide");
  });

  /**
   * Verifies that a lens on the exact focalMinHigh boundary is included.
   */
  test("focalMinHigh boundary — lens at exact high value is included", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      focalMinLow: 0,
      focalMinHigh: 35,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id)).toContain("lens-prime");
  });

  // ----- FocalMax range filter -------------------------------------------

  /**
   * Verifies that focalMaxLow excludes lenses with focalMaxMm below the bound.
   */
  test("focalMaxLow excludes lenses below the minimum", () => {
    // lens-prime and lens-wide have focalMaxMm=35, should be excluded with low=40
    const filters: LensFilters = {
      ...defaultFilters,
      focalMaxLow: 40,
      focalMaxHigh: 200,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-tele"]);
  });

  /**
   * Verifies that focalMaxHigh excludes lenses with focalMaxMm above the bound.
   */
  test("focalMaxHigh excludes lenses above the maximum", () => {
    // lens-tele has focalMaxMm=100, should be excluded with high=80
    const filters: LensFilters = {
      ...defaultFilters,
      focalMaxLow: 0,
      focalMaxHigh: 80,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-prime", "lens-wide"]);
  });

  /**
   * Verifies that a lens on the exact focalMaxLow boundary is included.
   */
  test("focalMaxLow boundary — lens at exact low value is included", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      focalMaxLow: 35,
      focalMaxHigh: 200,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id)).toContain("lens-prime");
    expect(result.map((l) => l.id)).toContain("lens-wide");
  });

  // ----- ApertureAtMin range filter --------------------------------------

  /**
   * Verifies that apertureAtMinLow excludes lenses with maxApertureAtMinFocal
   * below the bound (smaller f-number means wider aperture).
   */
  test("apertureAtMinLow excludes lenses below the minimum", () => {
    // lens-prime has maxApertureAtMinFocal=1.4, excluded with low=2
    const filters: LensFilters = {
      ...defaultFilters,
      apertureAtMinLow: 2,
      apertureAtMinHigh: 30,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-tele", "lens-wide"]);
  });

  /**
   * Verifies that apertureAtMinHigh excludes lenses with maxApertureAtMinFocal
   * above the bound.
   */
  test("apertureAtMinHigh excludes lenses above the maximum", () => {
    // lens-wide has maxApertureAtMinFocal=2.8, lens-prime has 1.4, lens-tele has 2.8
    // With high=2.5, only lens-prime (1.4) passes
    const filters: LensFilters = {
      ...defaultFilters,
      apertureAtMinLow: 1,
      apertureAtMinHigh: 2.5,
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-prime");
  });

  /**
   * Verifies that a lens on the exact apertureAtMinLow boundary is included.
   */
  test("apertureAtMinLow boundary — lens at exact value is included", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      apertureAtMinLow: 1.4,
      apertureAtMinHigh: 30,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id)).toContain("lens-prime");
  });

  // ----- ApertureAtMax range filter --------------------------------------

  /**
   * Verifies that apertureAtMaxLow excludes lenses with maxApertureAtMaxFocal
   * below the bound.
   */
  test("apertureAtMaxLow excludes lenses below the minimum", () => {
    // lens-prime has aperture at max=1.4, excluded with low=2
    const filters: LensFilters = {
      ...defaultFilters,
      apertureAtMaxLow: 2,
      apertureAtMaxHigh: 30,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-tele", "lens-wide"]);
  });

  /**
   * Verifies that apertureAtMaxHigh excludes lenses with maxApertureAtMaxFocal
   * above the bound.
   */
  test("apertureAtMaxHigh excludes lenses above the maximum", () => {
    // lens-tele has aperture at max=2.8, lens-prime has 1.4, lens-wide has 4.5
    // With high=3.5, lens-wide (4.5) is excluded
    const filters: LensFilters = {
      ...defaultFilters,
      apertureAtMaxLow: 1,
      apertureAtMaxHigh: 3.5,
    };
    const result = filterLenses(allLenses, filters);
    expect(result.map((l) => l.id).sort()).toEqual(["lens-prime", "lens-tele"]);
  });

  // ----- Combined filters ------------------------------------------------

  /**
   * Verifies that multiple filters are combined with AND logic.
   */
  test("combines brand, mount, and status filters with AND", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      brand: "brand-a",
      mount: "mount-rf",
      status: "owned",
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  /**
   * Verifies that query and focal range work together.
   */
  test("combines query and focal range filter", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      query: "Canon",
      focalMinLow: 10,
      focalMinHigh: 20,
    };
    const result = filterLenses(allLenses, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  /**
   * Verifies that all range filters together narrow down correctly.
   */
  test("combines all four range filters", () => {
    const filters: LensFilters = {
      ...defaultFilters,
      focalMinLow: 10,
      focalMinHigh: 80,
      focalMaxLow: 30,
      focalMaxHigh: 80,
      apertureAtMinLow: 2,
      apertureAtMinHigh: 3,
      apertureAtMaxLow: 2,
      apertureAtMaxHigh: 5,
    };
    const result = filterLenses(allLenses, filters);
    // lens-prime: focalMin=35 ok, focalMax=35 ok, apertureMin=1.4 FAIL (below 2)
    // lens-tele:  focalMin=70 ok, focalMax=100 FAIL (above 80)
    // lens-wide:  focalMin=14 ok, focalMax=35 ok, apertureMin=2.8 ok, apertureMax=4.5 ok
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lens-wide");
  });

  // ----- Empty inputs ----------------------------------------------------

  /**
   * Verifies that an empty lens array returns an empty array.
   */
  test("returns empty array when lens list is empty", () => {
    const result = filterLenses([], defaultFilters);
    expect(result).toHaveLength(0);
  });
});
