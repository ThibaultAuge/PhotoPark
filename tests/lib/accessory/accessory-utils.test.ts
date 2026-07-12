import { describe, expect, test } from "vitest";
import { deriveFilterAccessoryPresentation, formatFilterAccessoryLocation, formatOtherAccessorySummary, getOtherAccessoryProfileConfig, getOtherAccessorySpecEntries, resolveFilterAccessoryTypeId, resolveMountedLensId } from "../../../src/lib/accessory/accessory-utils";
import type { Accessory, AccessoryReferenceData } from "../../../src/lib/accessory/types";

const referenceData: AccessoryReferenceData = {
  brands: [],
  types: [
    { id: "a-type-filter", name: "Filtre", category: "filter", profile: null },
    { id: "a-type-step-ring", name: "Bague de conversion", category: "filter", profile: null },
    { id: "a-type-magnetic-step-ring", name: "Bague de réduction magnétique", category: "filter", profile: null },
    { id: "a-type-magnetic-base-ring", name: "Bague magnétique", category: "filter", profile: null },
    { id: "a-type-hood-adapter", name: "Adaptateur / pare-soleil magnétique", category: "filter", profile: null },
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
    expect(resolveFilterAccessoryTypeId(referenceData, "Bague de réduction magnétique")).toBe("a-type-magnetic-step-ring");
    expect(resolveFilterAccessoryTypeId(referenceData, "Bague magnétique")).toBe("a-type-magnetic-base-ring");
  });

  /**
   * Verifies that the removed legacy type name no longer resolves to a type id
   */
  test("returns an empty id for the removed legacy magnetic ring label", () => {
    expect(resolveFilterAccessoryTypeId(referenceData, "Bague vissée → magnétique")).toBe("");
  });

  /**
   * Verifies that canonical derived names still resolve after display renames
   */
  test("resolves canonical filter type ids even when display names were renamed", () => {
    expect(resolveFilterAccessoryTypeId({
      ...referenceData,
      types: referenceData.types.map((type) => type.id === "a-type-magnetic-base-ring" ? { ...type, name: "Anneau magnétique" } : type),
    }, "Bague magnétique")).toBe("a-type-magnetic-base-ring");
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

describe("resolveMountedLensId", () => {
  /**
   * Verifies that nested parent chains resolve the root mounted lens id
   */
  test("resolves the root mounted lens id through parent accessory chains", () => {
    expect(resolveMountedLensId({
      mountedOnLensId: null,
      mountedOnAccessoryId: "ring-2",
    }, new Map([
      ["ring-1", { mountedOnLensId: "lens-1", mountedOnAccessoryId: null }],
      ["ring-2", { mountedOnLensId: null, mountedOnAccessoryId: "ring-1" }],
    ]))).toBe("lens-1");
  });

  /**
   * Verifies that broken or cyclic parent chains return no mounted lens id
   */
  test("returns null for broken or cyclic parent chains", () => {
    expect(resolveMountedLensId({
      mountedOnLensId: null,
      mountedOnAccessoryId: "missing-parent",
    }, new Map())).toBeNull();

    expect(resolveMountedLensId({
      mountedOnLensId: null,
      mountedOnAccessoryId: "ring-1",
    }, new Map([
      ["ring-1", { mountedOnLensId: null, mountedOnAccessoryId: "ring-2" }],
      ["ring-2", { mountedOnLensId: null, mountedOnAccessoryId: "ring-1" }],
    ]))).toBeNull();
  });
});

describe("other accessory helpers", () => {
  /**
   * Verifies that profile config exposes the dedicated battery fields
   */
  test("returns the battery profile configuration", () => {
    expect(getOtherAccessoryProfileConfig("battery")).toMatchObject({
      label: "Batterie",
      fields: [
        { key: "specCapacity", label: "Capacité" },
        { key: "specCompatibility", label: "Compatibilité" },
        { key: "specVariant", label: "Variante" },
      ],
    });
  });

  /**
   * Verifies that other spec entries omit blank values and preserve labels
   */
  test("returns labeled other-accessory spec entries", () => {
    expect(getOtherAccessorySpecEntries({
      typeProfile: "power",
      specCapacity: null,
      specFormat: null,
      specConnection: "USB-C PD",
      specCompatibility: "MacBook Pro",
      specPower: "100 W",
      specColorModes: " ",
      specVariant: "GaN",
    })).toEqual([
      { label: "Puissance", value: "100 W" },
      { label: "Connectique", value: "USB-C PD" },
      { label: "Compatibilité", value: "MacBook Pro" },
    ]);
  });

  /**
   * Verifies that other summaries join only configured non-empty values
   */
  test("formats other-accessory summaries from configured spec values", () => {
    expect(formatOtherAccessorySummary({
      typeProfile: "power",
      specCapacity: null,
      specFormat: null,
      specConnection: "USB-C PD",
      specCompatibility: "",
      specPower: "100 W",
      specColorModes: null,
      specVariant: "",
    })).toBe("100 W · USB-C PD");
  });
});
