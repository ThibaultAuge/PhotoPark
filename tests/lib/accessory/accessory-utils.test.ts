import { describe, expect, test } from "vitest";
import { deriveFilterAccessoryPresentation, formatFilterAccessoryLocation, resolveFilterAccessoryTypeId } from "../../../src/lib/accessory/accessory-utils";
import type { Accessory, AccessoryReferenceData } from "../../../src/lib/accessory/types";

const referenceData: AccessoryReferenceData = {
  brands: [],
  types: [
    { id: "type-filter", name: "Filtre", category: "filter" },
    { id: "type-step", name: "Bague de conversion", category: "filter" },
    { id: "type-magnetic-step", name: "Bague de réduction magnétique", category: "filter" },
    { id: "type-magnetic", name: "Bague magnétique", category: "filter" },
    { id: "type-hood", name: "Adaptateur / pare-soleil magnétique", category: "filter" },
  ],
  lenses: [],
};

describe("deriveFilterAccessoryPresentation", () => {
  /**
   * Verifies that threaded step rings derive a conversion ring presentation
   */
  test("derives a conversion ring name from threaded to threaded diameters", () => {
    expect(deriveFilterAccessoryPresentation({
      filterRole: "adapter",
      rearMountType: "threaded",
      rearDiameterMm: 72,
      frontMountType: "threaded",
      frontDiameterMm: 77,
      supportsMagneticHood: false,
      filterStrength: null,
    })).toMatchObject({
      typeName: "Bague de conversion",
      name: "Bague de conversion 72→77 mm",
      valid: true,
    });
  });

  /**
   * Verifies that threaded-to-magnetic rings derive a reduction label
   */
  test("derives a magnetic reduction ring from threaded to magnetic diameters", () => {
    expect(deriveFilterAccessoryPresentation({
      filterRole: "adapter",
      rearMountType: "threaded",
      rearDiameterMm: 72,
      frontMountType: "magnetic",
      frontDiameterMm: 77,
      supportsMagneticHood: false,
      filterStrength: null,
    })).toMatchObject({
      typeName: "Bague de réduction magnétique",
      name: "Bague de réduction magnétique 72→77 mm",
      valid: true,
    });
  });

  /**
   * Verifies that equal diameters derive a magnetic ring with hood support
   */
  test("derives a magnetic ring with hood support from equal threaded and magnetic diameters", () => {
    expect(deriveFilterAccessoryPresentation({
      filterRole: "adapter",
      rearMountType: "threaded",
      rearDiameterMm: 77,
      frontMountType: "magnetic",
      frontDiameterMm: 77,
      supportsMagneticHood: true,
      filterStrength: null,
    })).toMatchObject({
      typeName: "Bague magnétique",
      name: "Bague magnétique 77 mm avec pare-soleil",
      valid: true,
    });
  });

  /**
   * Verifies that magnetic-to-magnetic reductions derive the expected label
   */
  test("derives a magnetic reduction ring from magnetic to magnetic diameters", () => {
    expect(deriveFilterAccessoryPresentation({
      filterRole: "adapter",
      rearMountType: "magnetic",
      rearDiameterMm: 82,
      frontMountType: "magnetic",
      frontDiameterMm: 95,
      supportsMagneticHood: false,
      filterStrength: null,
    })).toMatchObject({
      typeName: "Bague de réduction magnétique",
      name: "Bague de réduction magnétique 82→95 mm",
      valid: true,
    });
  });

  /**
   * Verifies that equal magnetic diameters derive a magnetic ring label
   */
  test("derives a magnetic ring from equal magnetic diameters", () => {
    expect(deriveFilterAccessoryPresentation({
      filterRole: "adapter",
      rearMountType: "magnetic",
      rearDiameterMm: 95,
      frontMountType: "magnetic",
      frontDiameterMm: 95,
      supportsMagneticHood: true,
      filterStrength: null,
    })).toMatchObject({
      typeName: "Bague magnétique",
      name: "Bague magnétique 95 mm avec pare-soleil",
      valid: true,
    });
  });

  /**
   * Verifies that unsupported interface combinations are rejected
   */
  test("rejects unsupported adapter interface combinations", () => {
    expect(deriveFilterAccessoryPresentation({
      filterRole: "adapter",
      rearMountType: "magnetic",
      rearDiameterMm: 77,
      frontMountType: "threaded",
      frontDiameterMm: 77,
      supportsMagneticHood: false,
      filterStrength: null,
    })).toMatchObject({
      typeName: null,
      name: "",
      valid: false,
    });
  });
});

describe("resolveFilterAccessoryTypeId", () => {
  /**
   * Verifies that derived type names resolve to seeded filter type ids
   */
  test("matches the seeded type for a derived type name", () => {
    expect(resolveFilterAccessoryTypeId(referenceData, "Bague de réduction magnétique")).toBe("type-magnetic-step");
    expect(resolveFilterAccessoryTypeId(referenceData, "Bague magnétique")).toBe("type-magnetic");
  });
});

describe("formatFilterAccessoryLocation", () => {
  const mountedFilter: Pick<Accessory, "storageLocation" | "mountedOnLensId" | "mountedOnAccessoryId"> = {
    storageLocation: "reserve",
    mountedOnLensId: "lens-1",
    mountedOnAccessoryId: null,
  };

  /**
   * Verifies that mounted filter accessories use the mounted lens label
   */
  test("returns the mounted lens label when the lens exists", () => {
    expect(formatFilterAccessoryLocation(mountedFilter, new Map([
      ["lens-1", "Canon RF 35mm F1.8"],
    ]), new Map())).toBe("Canon RF 35mm F1.8");
  });

  /**
   * Verifies that parent-mounted accessories resolve the mounted lens label
   */
  test("resolves the mounted lens label through parent accessories", () => {
    expect(formatFilterAccessoryLocation({
      storageLocation: "reserve",
      mountedOnLensId: null,
      mountedOnAccessoryId: "ring-1",
    }, new Map([
      ["lens-1", "Canon RF 35mm F1.8"],
    ]), new Map([
       ["ring-1", { mountedOnLensId: "lens-1", mountedOnAccessoryId: null }],
     ]))).toBe("Canon RF 35mm F1.8");
  });

  /**
   * Verifies that nested parent chains resolve the root mounted lens label
   */
  test("walks multiple parent accessories until it finds the mounted lens", () => {
    expect(formatFilterAccessoryLocation({
      storageLocation: "reserve",
      mountedOnLensId: null,
      mountedOnAccessoryId: "ring-2",
    }, new Map([
      ["lens-1", "Canon RF 35mm F1.8"],
    ]), new Map([
      ["ring-1", { mountedOnLensId: "lens-1", mountedOnAccessoryId: null }],
      ["ring-2", { mountedOnLensId: null, mountedOnAccessoryId: "ring-1" }],
    ]))).toBe("Canon RF 35mm F1.8");
  });

  /**
   * Verifies that unknown mounted lenses fall back to the generic mounted label
   */
  test("falls back to Monté when the mounted lens reference is missing", () => {
    expect(formatFilterAccessoryLocation(mountedFilter, new Map(), new Map())).toBe("Monté");
  });

  /**
   * Verifies that cyclic parent chains fall back to the generic mounted label
   */
  test("falls back to Monté when the parent chain loops", () => {
    expect(formatFilterAccessoryLocation({
      storageLocation: "reserve",
      mountedOnLensId: null,
      mountedOnAccessoryId: "ring-1",
    }, new Map(), new Map([
      ["ring-1", { mountedOnLensId: null, mountedOnAccessoryId: "ring-2" }],
      ["ring-2", { mountedOnLensId: null, mountedOnAccessoryId: "ring-1" }],
    ]))).toBe("Monté");
  });

  /**
   * Verifies that broken parent chains fall back to the generic mounted label
   */
  test("falls back to Monté when the parent accessory cannot be resolved", () => {
    expect(formatFilterAccessoryLocation({
      storageLocation: "reserve",
      mountedOnLensId: null,
      mountedOnAccessoryId: "missing-parent",
    }, new Map([
      ["lens-1", "Canon RF 35mm F1.8"],
    ]), new Map())).toBe("Monté");
  });
});
