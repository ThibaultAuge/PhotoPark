import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import type { BodyInput } from "../../../src/lib/body/types";

const CANON_BRAND_ID = "11111111-1111-4111-8111-111111111111";
const RF_MOUNT_ID = "22222222-2222-4222-8222-222222222221";

function useIsolatedDatabasePath() {
  const directory = join(tmpdir(), "photos-body-repository-tests");
  mkdirSync(directory, { recursive: true });
  process.env.DATABASE_PATH = join(directory, `${randomUUID()}.sqlite`);
}

function validBodyInput(overrides: Partial<BodyInput> = {}): BodyInput {
  return {
    brandId: CANON_BRAND_ID,
    mountId: RF_MOUNT_ID,
    name: " EOS R6 Mark II ",
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
    ...overrides,
  };
}

describe("body repository", () => {
  afterEach(() => {
    delete process.env.DATABASE_PATH;
    vi.resetModules();
  });

  /**
   * Verifies that body reference data only returns brands in the bodies domain
   */
  test("listBodyReferenceData filters brands by bodies domain", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createBrand } = await import("../../../src/lib/db/lens-repository");
    const { listBodyReferenceData } = await import("../../../src/lib/db/body-repository");

    createBrand("Peak Design", ["accessories"]);
    createBrand("Sony", ["lenses", "bodies"]);

    const refs = listBodyReferenceData();
    expect(refs.brands.map((brand) => brand.name)).toEqual(["Canon", "Sony"]);
    expect(refs.mounts.map((mount) => mount.name)).toContain("Canon RF");
  });

  /**
   * Verifies that createBody trims fields and persists normalized labels
   */
  test("createBody stores normalized label and trimmed name", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createBody, listBodies } = await import("../../../src/lib/db/body-repository");

    const created = createBody(validBodyInput());
    const [stored] = listBodies();

    expect(created.label).toBe("Canon EOS R6 Mark II");
    expect(stored).toMatchObject({
      id: created.id,
      name: "EOS R6 Mark II",
      label: "Canon EOS R6 Mark II",
      mountId: RF_MOUNT_ID,
      mount: "Canon RF",
      isOwned: true,
      retired: false,
    });
  });

  /**
   * Verifies that createBody rejects brands outside the bodies domain
   */
  test("createBody rejects brands without bodies domain access", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createBrand, listBrandsWithDomains } = await import("../../../src/lib/db/lens-repository");
    const { createBody } = await import("../../../src/lib/db/body-repository");

    createBrand("Sigma", ["lenses"]);
    const sigmaBrandId = listBrandsWithDomains().find((brand) => brand.name === "Sigma")?.id;

    expect(sigmaBrandId).toBeDefined();
    expect(() => createBody(validBodyInput({ brandId: sigmaBrandId! }))).toThrow("Cette marque n'est pas disponible pour les boîtiers.");
  });

  /**
   * Verifies that updateBody clears mount data when the body becomes fixed-lens
   */
  test("updateBody removes mount data for fixed-lens bodies", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createBody, listBodies, updateBody } = await import("../../../src/lib/db/body-repository");

    const created = createBody(validBodyInput());
    updateBody(created.id, validBodyInput({
      name: " PowerShot V1 ",
      isInterchangeableLens: false,
      mountId: null,
      sensorFormat: "OTHER",
      hasIbis: false,
      hasDualCardSlot: false,
      isWeatherSealed: false,
      hasArticulatedScreen: false,
    }));

    const updated = listBodies().find((body) => body.id === created.id);
    expect(updated).toMatchObject({
      name: "PowerShot V1",
      label: "Canon PowerShot V1",
      mountId: null,
      mount: null,
      isInterchangeableLens: false,
    });
  });

  /**
   * Verifies that repository persists compact type and CMOS sensor format
   */
  test("createBody accepts compact and CMOS values", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createBody, listBodies } = await import("../../../src/lib/db/body-repository");

    const created = createBody(validBodyInput({
      name: " Tough TG-6 ",
      bodyType: "compact",
      isInterchangeableLens: false,
      mountId: null,
      sensorFormat: "CMOS",
    }));

    const stored = listBodies().find((body) => body.id === created.id);
    expect(stored).toMatchObject({
      name: "Tough TG-6",
      label: "Canon Tough TG-6",
      bodyType: "compact",
      sensorFormat: "CMOS",
      isInterchangeableLens: false,
      mountId: null,
      mount: null,
    });
  });

  /**
   * Verifies that refreshBodyLabels updates stored labels after brand renames
   */
  test("refreshBodyLabels regenerates labels from renamed brands", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { updateBrand } = await import("../../../src/lib/db/lens-repository");
    const { createBody, listBodies, refreshBodyLabels } = await import("../../../src/lib/db/body-repository");

    createBody(validBodyInput());
    updateBrand(CANON_BRAND_ID, "Canon Pro", ["lenses", "bodies"]);
    refreshBodyLabels();

    expect(listBodies()[0].label).toBe("Canon Pro EOS R6 Mark II");
  });

  /**
   * Verifies that deleteBody removes persisted bodies from the listing
   */
  test("deleteBody removes the stored body", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();

    const { createBody, deleteBody, listBodies } = await import("../../../src/lib/db/body-repository");

    const created = createBody(validBodyInput());
    expect(listBodies()).toHaveLength(1);

    deleteBody(created.id);
    expect(listBodies()).toEqual([]);
  });
});
