import { describe, expect, test } from "vitest";
import { getLensAccessoryCompatibility, getMountedAssembly } from "../../../src/lib/accessory/filter-compatibility";
import type { Accessory, AccessoryLensReference } from "../../../src/lib/accessory/types";

const lens: AccessoryLensReference = {
  id: "lens-1",
  label: "Canon RF 35mm F1.8",
  filterDiameterMm: 52,
  isOwned: true,
  isFavorite: false,
  isNextPurchase: false,
  retired: false,
};

function createFilterAccessory(overrides: Partial<Accessory>): Accessory {
  return {
    id: "acc-1",
    brandId: "brand-1",
    brand: "Kase",
    typeId: "type-filter",
    type: "Bague vissée → magnétique",
    typeCategory: "filter",
    name: "Base ring",
    label: "Kase Base ring",
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
    storageLocation: "bag",
    mountedOnLensId: null,
    mountedOnAccessoryId: null,
    rearMountType: "threaded",
    rearDiameterMm: 52,
    frontMountType: "magnetic",
    frontDiameterMm: 77,
    filterRole: "adapter",
    filterStrength: null,
    supportsMagneticHood: false,
    isFavorite: false,
    isNextPurchase: false,
    isOwned: true,
    retired: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filter compatibility", () => {
  /**
   * Verifies that compatibility is blocked when lens filter diameter is missing
   */
  test("returns a blocking reason when the lens has no filter diameter", () => {
    const result = getLensAccessoryCompatibility({ ...lens, filterDiameterMm: null }, [createFilterAccessory({})]);

    expect(result).toEqual({
      mounted: [],
      available: [],
      moveRequired: [],
      blockedReason: "Cet objectif n'a pas de diamètre de filtre renseigné.",
    });
  });

  /**
   * Verifies that mounted assembly traversal stops safely on repeated links
   */
  test("ignores repeated links when building the mounted chain", () => {
    const root = createFilterAccessory({ id: "root", mountedOnLensId: lens.id });
    const child = createFilterAccessory({
      id: "child",
      mountedOnAccessoryId: "root",
      rearMountType: "magnetic",
      rearDiameterMm: 77,
    });
    const loop = createFilterAccessory({
      id: "root",
      mountedOnAccessoryId: "child",
      rearMountType: "magnetic",
      rearDiameterMm: 77,
    });

    expect(getMountedAssembly(lens.id, [root, child, loop]).map((item) => item.id)).toEqual(["root", "child"]);
  });

  /**
   * Verifies that unavailable inventory returns a blocking reason
   */
  test("returns a blocking reason when no owned active filter accessory matches", () => {
    const result = getLensAccessoryCompatibility(lens, [
      createFilterAccessory({ id: "retired", retired: true }),
      createFilterAccessory({ id: "unowned", isOwned: false }),
    ]);

    expect(result.available).toEqual([]);
    expect(result.moveRequired).toEqual([]);
    expect(result.blockedReason).toBe("Aucun montage compatible disponible avec l'inventaire actuel.");
  });

  /**
   * Verifies that mounted filter chains are returned in lens-to-front order
   */
  test("builds the current mounted chain for a lens", () => {
    const baseRing = createFilterAccessory({ id: "ring", mountedOnLensId: lens.id });
    const cpl = createFilterAccessory({
      id: "cpl",
      name: "CPL",
      label: "Kase CPL",
      mountedOnAccessoryId: "ring",
      rearMountType: "magnetic",
      rearDiameterMm: 77,
      frontMountType: "magnetic",
      frontDiameterMm: 77,
      filterRole: "filter",
    });

    expect(getMountedAssembly(lens.id, [baseRing, cpl]).map((item) => item.id)).toEqual(["ring", "cpl"]);
  });

  /**
   * Verifies that compatible chains are split by immediate and move-required use
   */
  test("classifies immediate and move-required compatible chains", () => {
    const availableRing = createFilterAccessory({ id: "ring-available" });
    const availableFilter = createFilterAccessory({
      id: "filter-available",
      name: "ND64",
      label: "Kase ND64",
      rearMountType: "magnetic",
      rearDiameterMm: 77,
      frontMountType: "none",
      frontDiameterMm: null,
      filterRole: "filter",
    });
    const mountedElsewhere = createFilterAccessory({ id: "ring-mounted", mountedOnLensId: "lens-2" });

    const result = getLensAccessoryCompatibility(lens, [availableRing, availableFilter, mountedElsewhere]);

    expect(result.available.some((item) => item.labels.join(" → ") === "Kase Base ring → Kase ND64")).toBe(true);
    expect(result.moveRequired.some((item) => item.labels[0] === "Kase Base ring")).toBe(true);
  });
});
