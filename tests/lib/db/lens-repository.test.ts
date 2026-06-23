import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { LensInput } from "../../../src/lib/lens/types";

const BRAND_ID = "11111111-1111-4111-8111-111111111111";
const MOUNT_ID = "22222222-2222-4222-8222-222222222221";
const OPTION_L_ID = "33333333-3333-4333-8333-333333333331";
const OPTION_IS_ID = "33333333-3333-4333-8333-333333333332";
const LENS_ID = "44444444-4444-4444-8444-444444444444";

function useIsolatedDatabasePath() {
  const directory = join(tmpdir(), "photos-lens-repository-tests");
  mkdirSync(directory, { recursive: true });
  process.env.DATABASE_PATH = join(directory, `${randomUUID()}.sqlite`);
  return process.env.DATABASE_PATH;
}

function validLensInput(optionIds: string[] = [OPTION_L_ID]): LensInput {
  return {
    brandId: BRAND_ID,
    mountId: MOUNT_ID,
    optionIds,
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
    retired: false
  };
}

function createDatabaseWithLegacyOptionLinkForeignKey(path: string) {
  const database = new Database(path);
  database.pragma("foreign_keys = OFF");
  database.exec(`
    CREATE TABLE brands (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE mounts (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, sensorType TEXT NOT NULL CHECK(sensorType IN ('FULL_FRAME', 'APS_C')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE lens_options (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE COLLATE NOCASE, description TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE lenses_legacy_broken (id TEXT PRIMARY KEY);
    CREATE TABLE lenses (
      id TEXT PRIMARY KEY,
      brandId TEXT NOT NULL REFERENCES brands(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      mountId TEXT NOT NULL REFERENCES mounts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      focalMinMm REAL NOT NULL,
      focalMaxMm REAL NOT NULL,
      apscFocalMinEquivalentMm REAL NOT NULL,
      apscFocalMaxEquivalentMm REAL NOT NULL,
      maxApertureAtMinFocal REAL NOT NULL,
      maxApertureAtMaxFocal REAL NOT NULL,
      minApertureAtMinFocal REAL,
      minApertureAtMaxFocal REAL,
      label TEXT NOT NULL,
      filterDiameterMm REAL,
      priceEur REAL,
      minFocusDistanceM REAL,
      angleAtMinFocalDeg REAL,
      angleAtMaxFocalDeg REAL,
      apertureBlades INTEGER,
      opticalFormula TEXT,
      weightG REAL,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      isNextPurchase INTEGER NOT NULL DEFAULT 0,
      isOwned INTEGER NOT NULL DEFAULT 0,
      retired INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE lens_option_links (
      lensId TEXT NOT NULL REFERENCES lenses_legacy_broken(id) ON DELETE CASCADE,
      optionId TEXT NOT NULL REFERENCES lens_options(id) ON DELETE RESTRICT,
      PRIMARY KEY (lensId, optionId)
    );
    INSERT INTO brands (id, name, createdAt, updatedAt) VALUES ('${BRAND_ID}', 'Canon', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO mounts (id, name, sensorType, createdAt, updatedAt) VALUES ('${MOUNT_ID}', 'Canon RF', 'FULL_FRAME', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO lens_options (id, code, description, createdAt, updatedAt) VALUES ('${OPTION_L_ID}', 'L', 'Série professionnelle Canon L', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO lens_options (id, code, description, createdAt, updatedAt) VALUES ('${OPTION_IS_ID}', 'IS', 'Stabilisation optique', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO lenses (
      id, brandId, mountId, focalMinMm, focalMaxMm, apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm,
      maxApertureAtMinFocal, maxApertureAtMaxFocal, minApertureAtMinFocal, minApertureAtMaxFocal, label, filterDiameterMm, priceEur,
      minFocusDistanceM, angleAtMinFocalDeg, angleAtMaxFocalDeg, apertureBlades, opticalFormula,
      weightG, isFavorite, isNextPurchase, isOwned, createdAt, updatedAt
    ) VALUES (
      '${LENS_ID}', '${BRAND_ID}', '${MOUNT_ID}', 24, 70, 36, 105, 2.8, 4, NULL, NULL,
      'Canon RF 24-70 f/2.8-4 L', 82, 1200, 0.38, 84, 34, 9, NULL,
      695, 0, 0, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
    );
    INSERT INTO lens_option_links (lensId, optionId) VALUES ('${LENS_ID}', '${OPTION_L_ID}');
  `);
  database.close();
}

function createDatabaseWithMissingLensColumns(path: string) {
  const database = new Database(path);
  database.pragma("foreign_keys = OFF");
  database.exec(`
    CREATE TABLE brands (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE mounts (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, sensorType TEXT NOT NULL CHECK(sensorType IN ('FULL_FRAME', 'APS_C')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE lens_options (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL COLLATE NOCASE,
      description TEXT NOT NULL,
      brandId TEXT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(code, brandId)
    );
    CREATE TABLE lenses (
      id TEXT PRIMARY KEY,
      brandId TEXT NOT NULL REFERENCES brands(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      mountId TEXT NOT NULL REFERENCES mounts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      focalMinMm REAL NOT NULL,
      focalMaxMm REAL NOT NULL,
      apscFocalMinEquivalentMm REAL NOT NULL,
      apscFocalMaxEquivalentMm REAL NOT NULL,
      maxApertureAtMinFocal REAL NOT NULL,
      maxApertureAtMaxFocal REAL NOT NULL,
      label TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE lens_option_links (
      lensId TEXT NOT NULL REFERENCES lenses(id) ON DELETE CASCADE,
      optionId TEXT NOT NULL REFERENCES lens_options(id) ON DELETE RESTRICT,
      PRIMARY KEY (lensId, optionId)
    );
    INSERT INTO brands (id, name, createdAt, updatedAt) VALUES ('${BRAND_ID}', 'Canon', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO mounts (id, name, sensorType, createdAt, updatedAt) VALUES ('${MOUNT_ID}', 'Canon RF', 'FULL_FRAME', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO lens_options (id, code, description, brandId, createdAt, updatedAt) VALUES ('${OPTION_L_ID}', 'L', 'Série professionnelle Canon L', '${BRAND_ID}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    INSERT INTO lenses (
      id, brandId, mountId, focalMinMm, focalMaxMm, apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm,
      maxApertureAtMinFocal, maxApertureAtMaxFocal, label, createdAt, updatedAt
    ) VALUES (
      '${LENS_ID}', '${BRAND_ID}', '${MOUNT_ID}', 24, 70, 36, 105, 2.8, 4,
      'Canon RF 24-70 f/2.8-4 L', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
    );
    INSERT INTO lens_option_links (lensId, optionId) VALUES ('${LENS_ID}', '${OPTION_L_ID}');
  `);
  database.close();
}

describe("lens repository", () => {
  afterEach(() => {
    delete process.env.DATABASE_PATH;
    vi.resetModules();
  });

  /**
   * Verifies that repaired option links leave no backup blocking deletes
   */
  test("updateLens repairs legacy option link foreign key and allows unused option deletion", async () => {
    const databasePath = useIsolatedDatabasePath();
    createDatabaseWithLegacyOptionLinkForeignKey(databasePath);
    vi.resetModules();

    const { deleteOption, listLenses, listReferenceData, updateLens } = await import("../../../src/lib/db/lens-repository");

    expect(listLenses()[0].options.map((option) => option.code)).toEqual(["L"]);

    updateLens(LENS_ID, validLensInput([OPTION_IS_ID]));
    expect(() => deleteOption(OPTION_L_ID)).not.toThrow();

    const [updatedLens] = listLenses();
    expect(updatedLens.options.map((option) => option.code)).toEqual(["IS"]);
    expect(updatedLens.label).toContain("IS");
    expect(listReferenceData().options.map((option) => option.code)).not.toContain("L");

    const database = new Database(databasePath, { readonly: true });
    const backupTables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'lens_option_links_invalid_%'").all();
    database.close();
    expect(backupTables).toEqual([]);
  });

  test("updateLens migrates missing optional and retired columns on existing databases", async () => {
    const databasePath = useIsolatedDatabasePath();
    createDatabaseWithMissingLensColumns(databasePath);
    vi.resetModules();

    const { listLenses, updateLens } = await import("../../../src/lib/db/lens-repository");

    expect(() => updateLens(LENS_ID, { ...validLensInput([OPTION_L_ID]), retired: true })).not.toThrow();

    const [updatedLens] = listLenses();
    expect(updatedLens.opticalFormula).toBeNull();
    expect(updatedLens.filterDiameterMm).toBe(82);
    expect(updatedLens.priceEur).toBe(1200);
    expect(updatedLens.minApertureAtMinFocal).toBeNull();
    expect(updatedLens.minApertureAtMaxFocal).toBeNull();
    expect(updatedLens.retired).toBe(true);

    const database = new Database(databasePath, { readonly: true });
    const columnNames = (database.prepare("PRAGMA table_info(lenses)").all() as Array<{ name: string }>).map((column) => column.name);
    database.close();

    expect(columnNames).toContain("minApertureAtMinFocal");
    expect(columnNames).toContain("minApertureAtMaxFocal");
    expect(columnNames).toContain("opticalFormula");
    expect(columnNames).toContain("filterDiameterMm");
    expect(columnNames).toContain("retired");
  });

  /**
   * Verifies that updating a missing lens fails without changing other links
   */
  test("updateLens preserves existing options when lens is missing", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, listLenses, updateLens } = await import("../../../src/lib/db/lens-repository");
    const createdLens = createLens(validLensInput([OPTION_L_ID]));

    // Use different focal/ aperture values to avoid duplicate detection before missing-lens check
    const nonDuplicateInput = { ...validLensInput([OPTION_IS_ID]), focalMinMm: 16, focalMaxMm: 35, maxApertureAtMinFocal: 4, maxApertureAtMaxFocal: 4 };
    expect(() => updateLens("missing-lens", nonDuplicateInput)).toThrow("Objectif introuvable.");

    const [storedLens] = listLenses().filter((lens) => lens.id === createdLens.id);
    expect(storedLens.options.map((option) => option.code)).toEqual(["L"]);
  });

  /**
   * Verifies that creating a lens with the same brand, mount, focal range and apertures throws DuplicateLensError
   */
  test("createLens rejects duplicate lens", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, DuplicateLensError } = await import("../../../src/lib/db/lens-repository");

    createLens(validLensInput([OPTION_L_ID])); // first creation succeeds

    expect(() => createLens(validLensInput([OPTION_IS_ID]))).toThrow(DuplicateLensError);
  });

  /**
   * Verifies that updating a lens to duplicate another lens throws DuplicateLensError
   */
  test("updateLens rejects duplicate lens", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, updateLens, DuplicateLensError } = await import("../../../src/lib/db/lens-repository");

    const lensA = createLens(validLensInput([OPTION_L_ID])); // focalMinMm=24, focalMaxMm=70, maxApertureAtMinFocal=2.8, maxApertureAtMaxFocal=4

    const differentInput = validLensInput([OPTION_L_ID]);
    differentInput.focalMinMm = 16; // Different focal to create a non-duplicate
    const lensB = createLens(differentInput);

    // Try to update lensB to have the same specs as lensA
    expect(() => updateLens(lensB.id, validLensInput([OPTION_IS_ID]))).toThrow(DuplicateLensError);
  });

  /**
   * Verifies that updating a lens with its own values does NOT throw (self-comparison excluded)
   */
  test("updateLens allows saving same lens without duplicate error", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, updateLens } = await import("../../../src/lib/db/lens-repository");

    const lens = createLens(validLensInput([OPTION_L_ID]));

    // Updating with the same values should succeed (excludes current ID)
    expect(() => updateLens(lens.id, validLensInput([OPTION_L_ID]))).not.toThrow();
  });

  test("updateLens allows editing non-identity fields when an identical duplicate already exists", async () => {
    const databasePath = useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, updateLens, listLenses } = await import("../../../src/lib/db/lens-repository");

    const lens = createLens(validLensInput([OPTION_L_ID]));

    const database = new Database(databasePath);
    const duplicateId = randomUUID();
    database.prepare(`INSERT INTO lenses (
      id, brandId, mountId, focalMinMm, focalMaxMm, apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm,
      maxApertureAtMinFocal, maxApertureAtMaxFocal, minApertureAtMinFocal, minApertureAtMaxFocal, label, filterDiameterMm, priceEur,
      minFocusDistanceM, angleAtMinFocalDeg, angleAtMaxFocalDeg, apertureBlades, opticalFormula, weightG,
      isFavorite, isNextPurchase, isOwned, retired, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        duplicateId,
        lens.brandId,
        lens.mountId,
        lens.focalMinMm,
        lens.focalMaxMm,
        lens.apscFocalMinEquivalentMm,
        lens.apscFocalMaxEquivalentMm,
        lens.maxApertureAtMinFocal,
        lens.maxApertureAtMaxFocal,
        lens.minApertureAtMinFocal,
        lens.minApertureAtMaxFocal,
        lens.label,
        lens.filterDiameterMm,
        lens.priceEur,
        lens.minFocusDistanceM,
        lens.angleAtMinFocalDeg,
        lens.angleAtMaxFocalDeg,
        lens.apertureBlades,
        lens.opticalFormula,
        lens.weightG,
        lens.isFavorite ? 1 : 0,
        lens.isNextPurchase ? 1 : 0,
        lens.isOwned ? 1 : 0,
        lens.retired ? 1 : 0,
        lens.createdAt,
        lens.updatedAt,
      );
    database.prepare("INSERT INTO lens_option_links (lensId, optionId) VALUES (?, ?)").run(duplicateId, OPTION_L_ID);
    database.close();

    expect(() => updateLens(lens.id, { ...validLensInput([OPTION_L_ID]), retired: true })).not.toThrow();

    const updated = listLenses().find((entry) => entry.id === lens.id);
    const untouchedDuplicate = listLenses().find((entry) => entry.id === duplicateId);
    expect(updated?.retired).toBe(true);
    expect(untouchedDuplicate?.retired).toBe(false);
  });

  /**
   * Verifies that a lens created with retired:true is persisted and
   * retrieved with retired=true.
   */
  test("createLens stores retired flag as true", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, listLenses } = await import("../../../src/lib/db/lens-repository");

    const input = { ...validLensInput([OPTION_L_ID]), retired: true };
    const created = createLens(input);

    expect(created.retired).toBe(true);

    const lenses = listLenses();
    const stored = lenses.find((l) => l.id === created.id);
    expect(stored).toBeDefined();
    expect(stored!.retired).toBe(true);
  });

  /**
   * Verifies that updating a lens to set retired=true persists the change.
   */
  test("updateLens changes retired flag to true", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, updateLens, listLenses } = await import("../../../src/lib/db/lens-repository");

    // Create lens with retired=false
    const lens = createLens(validLensInput([OPTION_L_ID]));
    expect(lens.retired).toBe(false);

    // Update to retired=true (use different focal to avoid duplicate detection)
    const updatedInput = {
      ...validLensInput([OPTION_L_ID]),
      retired: true,
      focalMinMm: 16,
      focalMaxMm: 35,
      maxApertureAtMinFocal: 4,
      maxApertureAtMaxFocal: 4,
    };
    updateLens(lens.id, updatedInput);

    const stored = listLenses().find((l) => l.id === lens.id);
    expect(stored).toBeDefined();
    expect(stored!.retired).toBe(true);
  });
});

describe("option groups", () => {
  afterEach(() => {
    delete process.env.DATABASE_PATH;
    vi.resetModules();
  });

  // -----------------------------------------------------------------------
  // createOption with brandId
  // -----------------------------------------------------------------------

  /**
   * Verifies that createOption stores the brandId on the new option
   */
  test("createOption stores brandId", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOption, listReferenceData } = await import("../../../src/lib/db/lens-repository");

    createOption("VR", "Vibration Reduction", BRAND_ID);

    const options = listReferenceData().options;
    const vr = options.find((o) => o.code === "VR");
    expect(vr).toBeDefined();
    expect(vr!.brandId).toBe(BRAND_ID);
  });

  /**
   * Verifies that createOption inserts into the new schema (UNIQUE(code, brandId))
   */
  test("createOption enforces UNIQUE(code, brandId)", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOption } = await import("../../../src/lib/db/lens-repository");

    createOption("VR", "Vibration Reduction", BRAND_ID);
    // Same code + same brand -> should throw
    expect(() => createOption("VR", "Vibration Reduction v2", BRAND_ID)).toThrow();
  });

  /**
   * Verifies that createOption allows same code for different brandId
   */
  test("createOption allows same code for different brands", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOption, createBrand, listReferenceData } = await import("../../../src/lib/db/lens-repository");

    // Create a second brand and look up its ID
    createBrand("Nikon");
    const nikonBrandId = listReferenceData().brands.find((b) => b.name === "Nikon")!.id;

    createOption("VR", "Vibration Reduction", BRAND_ID);
    // Same code, different brand should succeed
    expect(() => createOption("VR", "Vibration Reduction NIKKOR", nikonBrandId)).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // listOptionsByBrand
  // -----------------------------------------------------------------------

  /**
   * Verifies that listOptionsByBrand returns only options for the given brand
   */
  test("listOptionsByBrand filters by brandId", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createBrand, createOption, listOptionsByBrand, listReferenceData } = await import("../../../src/lib/db/lens-repository");

    createBrand("Nikon");
    const nikonBrandId = listReferenceData().brands.find((b) => b.name === "Nikon")!.id;

    createOption("VR", "Vibration Reduction", nikonBrandId);
    createOption("ED", "Extra-low Dispersion", nikonBrandId);

    const canonOptions = listOptionsByBrand(BRAND_ID);
    expect(canonOptions.every((o) => o.brandId === BRAND_ID)).toBe(true);
    // Canon should NOT include Nikon options
    expect(canonOptions.find((o) => o.code === "VR")).toBeUndefined();

    const nikonOptions = listOptionsByBrand(nikonBrandId);
    expect(nikonOptions).toHaveLength(2);
    expect(nikonOptions.map((o) => o.code)).toEqual(["ED", "VR"]);
  });

  /**
   * Verifies that listOptionsByBrand returns empty array for non-existent brand
   */
  test("listOptionsByBrand returns empty for unknown brand", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { listOptionsByBrand } = await import("../../../src/lib/db/lens-repository");

    const result = listOptionsByBrand("00000000-0000-4000-8000-000000000000");
    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // createOptionGroup / listOptionGroups
  // -----------------------------------------------------------------------

  /**
   * Verifies that createOptionGroup creates a new option group and listOptionGroups returns it
   */
  test("createOptionGroup and listOptionGroups round-trip", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOptionGroup, listOptionGroups } = await import("../../../src/lib/db/lens-repository");

    createOptionGroup("my-group", "Mon Groupe", "flag");

    const groups = listOptionGroups();
    const created = groups.find((g) => g.slug === "my-group");
    expect(created).toBeDefined();
    expect(created!.name).toBe("Mon Groupe");
    expect(created!.type).toBe("flag");
  });

  /**
   * Verifies that createOptionGroup with value type is persisted correctly
   */
  test("createOptionGroup stores value type", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOptionGroup, listOptionGroups } = await import("../../../src/lib/db/lens-repository");

    createOptionGroup("motor-group", "Motorisation", "value");

    const groups = listOptionGroups();
    const motor = groups.find((g) => g.slug === "motor-group");
    expect(motor).toBeDefined();
    expect(motor!.type).toBe("value");
  });

  /**
   * Verifies that seed data option groups are present after initialization
   */
  test("seed data includes option groups", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { listOptionGroups } = await import("../../../src/lib/db/lens-repository");

    const groups = listOptionGroups();
    expect(groups.length).toBeGreaterThanOrEqual(3);
    expect(groups.find((g) => g.slug === "stabilization")).toBeDefined();
    expect(groups.find((g) => g.slug === "motor")).toBeDefined();
    expect(groups.find((g) => g.slug === "series")).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // updateOptionGroup
  // -----------------------------------------------------------------------

  /**
   * Verifies that updateOptionGroup changes slug and name
   */
  test("updateOptionGroup updates fields", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOptionGroup, listOptionGroups, updateOptionGroup } = await import("../../../src/lib/db/lens-repository");

    createOptionGroup("old-slug", "Old Name", "flag");
    const created = listOptionGroups().find((g) => g.slug === "old-slug")!;

    updateOptionGroup(created.id, "new-slug", "New Name", "value");

    const groups = listOptionGroups();
    expect(groups.find((g) => g.id === created.id)!).toMatchObject({
      slug: "new-slug",
      name: "New Name",
      type: "value"
    });
  });

  // -----------------------------------------------------------------------
  // deleteOptionGroup
  // -----------------------------------------------------------------------

  /**
   * Verifies that deleteOptionGroup removes the group
   */
  test("deleteOptionGroup removes group", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOptionGroup, listOptionGroups, deleteOptionGroup } = await import("../../../src/lib/db/lens-repository");

    createOptionGroup("delete-me", "Delete Me", "flag");
    expect(listOptionGroups().length).toBeGreaterThanOrEqual(1);

    const created = listOptionGroups().find((g) => g.slug === "delete-me")!;
    deleteOptionGroup(created.id);

    const after = listOptionGroups();
    expect(after.find((g) => g.id === created.id)).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // replaceGroupMembers / getOptionGroupMembers
  // -----------------------------------------------------------------------

  /**
   * Verifies that replaceGroupMembers sets members and getOptionGroupMembers returns them
   */
  test("replaceGroupMembers sets members for a group", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOptionGroup, replaceGroupMembers, getOptionGroupMembers, listReferenceData } = await import("../../../src/lib/db/lens-repository");

    createOptionGroup("test-group", "Test", "flag");
    const groups = listReferenceData().optionGroups;
    const group = groups.find((g) => g.slug === "test-group")!;

    // Replace with IS and L options from seed
    replaceGroupMembers(group.id, [OPTION_IS_ID, OPTION_L_ID]);

    const members = getOptionGroupMembers(group.id);
    expect(members).toHaveLength(2);
    expect(members.map((m) => m.id)).toEqual(expect.arrayContaining([OPTION_IS_ID, OPTION_L_ID]));
  });

  /**
   * Verifies that replaceGroupMembers replaces (not appends) members
   */
  test("replaceGroupMembers replaces existing members", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOptionGroup, replaceGroupMembers, getOptionGroupMembers, listReferenceData } = await import("../../../src/lib/db/lens-repository");

    createOptionGroup("test-group", "Test", "flag");
    const groups = listReferenceData().optionGroups;
    const group = groups.find((g) => g.slug === "test-group")!;

    replaceGroupMembers(group.id, [OPTION_IS_ID]);
    expect(getOptionGroupMembers(group.id)).toHaveLength(1);

    // Replace with different option — should overwrite
    replaceGroupMembers(group.id, [OPTION_L_ID]);
    const members = getOptionGroupMembers(group.id);
    expect(members).toHaveLength(1);
    expect(members[0].id).toBe(OPTION_L_ID);
  });

  /**
   * Verifies that getOptionGroupMembers returns empty array for a group with no members
   */
  test("getOptionGroupMembers returns empty for unassigned group", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createOptionGroup, getOptionGroupMembers, listReferenceData } = await import("../../../src/lib/db/lens-repository");

    createOptionGroup("empty-group", "Empty", "flag");
    const groups = listReferenceData().optionGroups;
    const group = groups.find((g) => g.slug === "empty-group")!;

    const members = getOptionGroupMembers(group.id);
    expect(members).toEqual([]);
  });
});
