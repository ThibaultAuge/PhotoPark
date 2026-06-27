import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

function useIsolatedDatabasePath() {
  const directory = join(tmpdir(), "photos-accessory-repository-tests");
  mkdirSync(directory, { recursive: true });
  process.env.DATABASE_PATH = join(directory, `${randomUUID()}.sqlite`);
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
