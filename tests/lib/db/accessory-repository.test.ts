import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";
import type { LensInput } from "../../../src/lib/lens/types";

function useIsolatedDatabasePath() {
  const directory = join(tmpdir(), "photos-accessory-repository-tests");
  mkdirSync(directory, { recursive: true });
  process.env.DATABASE_PATH = join(directory, `${randomUUID()}.sqlite`);
}

function validLensInput(referenceData: { brands: Array<{ id: string; name: string }>; mounts: Array<{ id: string; name: string }>; options: Array<{ id: string; brandId: string }> }): LensInput {
  const canonBrand = referenceData.brands.find((brand) => brand.name === "Canon") ?? referenceData.brands[0];
  const mount = referenceData.mounts.find((item) => item.name === "Canon RF") ?? referenceData.mounts[0];
  const option = referenceData.options.find((item) => item.brandId === canonBrand.id) ?? referenceData.options[0];

  return {
    brandId: canonBrand.id,
    mountId: mount.id,
    optionIds: option ? [option.id] : [],
    focalMinMm: 24,
    focalMaxMm: 70,
    maxApertureAtMinFocal: 2.8,
    maxApertureAtMaxFocal: 4,
    minApertureAtMinFocal: null,
    minApertureAtMaxFocal: null,
    filterDiameterMm: 82,
    priceEur: 1200,
    minFocusDistanceM: 0.38,
    angleAtMinFocalDeg: 84,
    angleAtMaxFocalDeg: 34,
    apertureBlades: 9,
    opticalFormula: null,
    weightG: 695,
    isFavorite: false,
    isNextPurchase: false,
    isOwned: true,
    retired: false,
  };
}

describe("accessory repository", () => {
  afterEach(() => {
    delete process.env.DATABASE_PATH;
    vi.resetModules();
  });

  /**
   * Verifies that accessory reference seeds include the new magnetic adapter
   * type names used by the derived filter form.
   */
  test("listAccessoryReferenceData includes seeded magnetic adapter types", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { listAccessoryReferenceData } = await import("../../../src/lib/db/accessory-repository");

    const typeNames = listAccessoryReferenceData().types.map((type) => type.name);

    expect(typeNames).toContain("Bague de réduction magnétique");
    expect(typeNames).toContain("Bague magnétique");
    expect(typeNames).toContain("Bague vissée → magnétique");
  });

  /**
   * Verifies that filter adapter type and name are derived on the server even
   * when the submitted payload contains mismatched values.
   */
  test("createAccessory derives filter adapter type and name server-side", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createAccessory, listAccessoryReferenceData, listAccessories } = await import("../../../src/lib/db/accessory-repository");
    const { createBrand } = await import("../../../src/lib/db/lens-repository");

    createBrand("Kase", ["accessories"]);

    const referenceData = listAccessoryReferenceData();
    const canonBrand = referenceData.brands.find((brand) => brand.name === "Kase");
    const bagType = referenceData.types.find((type) => type.name === "Sac à dos");

    expect(canonBrand).toBeDefined();
    expect(bagType).toBeDefined();

    createAccessory({
      brandId: canonBrand!.id,
      typeId: bagType!.id,
      name: "Nom truqué",
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
      rearDiameterMm: 72,
      frontMountType: "magnetic",
      frontDiameterMm: 77,
      filterRole: "adapter",
      filterStrength: null,
      supportsMagneticHood: true,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });

    const created = listAccessories()[0];
    expect(created.type).toBe("Bague de réduction magnétique");
    expect(created.name).toBe("Bague de réduction magnétique 72→77 mm avec pare-soleil");
    expect(created.frontDiameterMm).toBe(77);
  });

  /**
   * Verifies that magnetic-to-magnetic adapter rings get their derived type and name server-side.
   */
  test("createAccessory derives magnetic-to-magnetic adapter rings server-side", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createAccessory, listAccessoryReferenceData, listAccessories } = await import("../../../src/lib/db/accessory-repository");
    const { createBrand } = await import("../../../src/lib/db/lens-repository");

    createBrand("Kase", ["accessories"]);

    const referenceData = listAccessoryReferenceData();
    const kaseBrand = referenceData.brands.find((brand) => brand.name === "Kase");
    const bagType = referenceData.types.find((type) => type.name === "Sac à dos");

    createAccessory({
      brandId: kaseBrand!.id,
      typeId: bagType!.id,
      name: "Nom truqué",
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
      rearMountType: "magnetic",
      rearDiameterMm: 82,
      frontMountType: "magnetic",
      frontDiameterMm: 95,
      filterRole: "adapter",
      filterStrength: null,
      supportsMagneticHood: true,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });

    const created = listAccessories()[0];
    expect(created.type).toBe("Bague de réduction magnétique");
    expect(created.name).toBe("Bague de réduction magnétique 82→95 mm avec pare-soleil");
    expect(created.rearMountType).toBe("magnetic");
    expect(created.frontMountType).toBe("magnetic");
  });

  /**
   * Verifies that equal-diameter magnetic adapters derive the magnetic ring identity server-side.
   */
  test("createAccessory derives equal-diameter magnetic rings server-side", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createAccessory, listAccessoryReferenceData, listAccessories } = await import("../../../src/lib/db/accessory-repository");
    const { createBrand } = await import("../../../src/lib/db/lens-repository");

    createBrand("Kase", ["accessories"]);

    const referenceData = listAccessoryReferenceData();
    const kaseBrand = referenceData.brands.find((brand) => brand.name === "Kase");
    const bagType = referenceData.types.find((type) => type.name === "Sac à dos");

    createAccessory({
      brandId: kaseBrand!.id,
      typeId: bagType!.id,
      name: "Nom truqué",
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
      rearMountType: "magnetic",
      rearDiameterMm: 95,
      frontMountType: "magnetic",
      frontDiameterMm: 95,
      filterRole: "adapter",
      filterStrength: null,
      supportsMagneticHood: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });

    const created = listAccessories()[0];
    expect(created.type).toBe("Bague magnétique");
    expect(created.name).toBe("Bague magnétique 95 mm");
  });

  /**
   * Verifies that repository writes reject magnetic interfaces without a diameter even when called directly.
   */
  test("createAccessory rejects magnetic interfaces without diameter server-side", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createAccessory, listAccessoryReferenceData } = await import("../../../src/lib/db/accessory-repository");
    const { createBrand } = await import("../../../src/lib/db/lens-repository");

    createBrand("Kase", ["accessories"]);

    const referenceData = listAccessoryReferenceData();
    const kaseBrand = referenceData.brands.find((brand) => brand.name === "Kase");
    const filterType = referenceData.types.find((type) => type.name === "Filtre");

    expect(() => createAccessory({
      brandId: kaseBrand!.id,
      typeId: filterType!.id,
      name: "Filtre magnétique",
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
      rearMountType: "magnetic",
      rearDiameterMm: null,
      frontMountType: "magnetic",
      frontDiameterMm: null,
      filterRole: "filter",
      filterStrength: "CPL",
      supportsMagneticHood: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    })).toThrow("Le diamètre arrière est requis pour une liaison filetée ou magnétique.");
  });

  /**
   * Verifies that non-filter accessories cannot persist mount interface metadata through the repository.
   */
  test("createAccessory rejects mount interfaces on bag accessories server-side", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createAccessory, listAccessoryReferenceData } = await import("../../../src/lib/db/accessory-repository");
    const { createBrand } = await import("../../../src/lib/db/lens-repository");

    createBrand("Peak Design", ["accessories"]);

    const referenceData = listAccessoryReferenceData();
    const brand = referenceData.brands.find((item) => item.name === "Peak Design");
    const bagType = referenceData.types.find((type) => type.name === "Sac à dos");

    expect(() => createAccessory({
      brandId: brand!.id,
      typeId: bagType!.id,
      name: "Everyday Backpack",
      capacityLiters: 20,
      capacityBodies: 2,
      capacityLenses: 4,
      fitsLaptop: true,
      fitsTripod: true,
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
      rearMountType: "magnetic",
      rearDiameterMm: 82,
      frontMountType: "none",
      frontDiameterMm: null,
      filterRole: "general",
      filterStrength: null,
      supportsMagneticHood: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    })).toThrow("Les accessoires hors filtres/bagues ne doivent pas définir d'interface de montage.");
  });

  /**
   * Verifies that moving an accessory under its own descendant is rejected to avoid cycles.
   */
  test("mountAccessoryOnAccessory rejects cycles through descendants", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createBrand, createLens, listReferenceData } = await import("../../../src/lib/db/lens-repository");
    const { createAccessory, listAccessoryReferenceData, listAccessories, mountAccessoryOnAccessory, mountAccessoryOnLens } = await import("../../../src/lib/db/accessory-repository");

    createBrand("Kase", ["accessories"]);
    const lens = createLens(validLensInput(listReferenceData()));

    const referenceData = listAccessoryReferenceData();
    const brand = referenceData.brands.find((item) => item.name === "Kase");
    const filterType = referenceData.types.find((type) => type.name === "Filtre");

    const rootAdapter = createAccessory({
      brandId: brand!.id,
      typeId: filterType!.id,
      name: "Adapter spoof",
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
      rearDiameterMm: 82,
      frontMountType: "magnetic",
      frontDiameterMm: 95,
      filterRole: "adapter",
      filterStrength: null,
      supportsMagneticHood: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });

    const middleAdapter = createAccessory({
      brandId: brand!.id,
      typeId: filterType!.id,
      name: "Mag adapter spoof",
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
      rearMountType: "magnetic",
      rearDiameterMm: 95,
      frontMountType: "magnetic",
      frontDiameterMm: 95,
      filterRole: "adapter",
      filterStrength: null,
      supportsMagneticHood: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });

    const filter = createAccessory({
      brandId: brand!.id,
      typeId: filterType!.id,
      name: "Filter spoof",
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
      rearMountType: "magnetic",
      rearDiameterMm: 95,
      frontMountType: "magnetic",
      frontDiameterMm: 95,
      filterRole: "filter",
      filterStrength: "CPL",
      supportsMagneticHood: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });

    mountAccessoryOnLens(rootAdapter.id, lens.id);
    mountAccessoryOnAccessory(middleAdapter.id, rootAdapter.id);
    mountAccessoryOnAccessory(filter.id, middleAdapter.id);

    expect(() => mountAccessoryOnAccessory(middleAdapter.id, filter.id)).toThrow("Le montage crée une boucle invalide.");

    const persisted = listAccessories();
    expect(persisted.find((item) => item.id === rootAdapter.id)?.mountedOnLensId).toBe(lens.id);
    expect(persisted.find((item) => item.id === middleAdapter.id)?.mountedOnAccessoryId).toBe(rootAdapter.id);
    expect(persisted.find((item) => item.id === filter.id)?.mountedOnAccessoryId).toBe(middleAdapter.id);
  });

  /**
   * Verifies that filter-role accessories mirror rear interface metadata to the front.
   */
  test("createAccessory mirrors front interface from rear for filter role", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createAccessory, listAccessoryReferenceData, listAccessories } = await import("../../../src/lib/db/accessory-repository");
    const { createBrand } = await import("../../../src/lib/db/lens-repository");

    createBrand("Kase", ["accessories"]);
    const referenceData = listAccessoryReferenceData();
    const kaseBrand = referenceData.brands.find((brand) => brand.name === "Kase");
    const bagType = referenceData.types.find((type) => type.name === "Sac à dos");

    createAccessory({
      brandId: kaseBrand!.id,
      typeId: bagType!.id,
      name: "Nom truqué",
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
      rearMountType: "magnetic",
      rearDiameterMm: 77,
      frontMountType: "none",
      frontDiameterMm: null,
      filterRole: "filter",
      filterStrength: "CPL",
      supportsMagneticHood: false,
      isFavorite: false,
      isNextPurchase: false,
      isOwned: true,
      retired: false,
    });

    const created = listAccessories()[0];
    expect(created.type).toBe("Filtre");
    expect(created.frontMountType).toBe("magnetic");
    expect(created.frontDiameterMm).toBe(77);
  });
});
