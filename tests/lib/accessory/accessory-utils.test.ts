import { describe, expect, test } from "vitest";
import { deriveFilterAccessoryPresentation, resolveFilterAccessoryTypeId } from "../../../src/lib/accessory/accessory-utils";
import type { AccessoryReferenceData } from "../../../src/lib/accessory/types";

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
  test("matches the seeded type for a derived type name", () => {
    expect(resolveFilterAccessoryTypeId(referenceData, "Bague de réduction magnétique")).toBe("type-magnetic-step");
    expect(resolveFilterAccessoryTypeId(referenceData, "Bague magnétique")).toBe("type-magnetic");
  });
});
