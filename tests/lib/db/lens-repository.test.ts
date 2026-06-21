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
    minAperture: 22,
    filterDiameterMm: 82,
    priceEur: 1200,
    minFocusDistanceM: 0.38,
    angleAtMinFocalDeg: 84,
    angleAtMaxFocalDeg: 34,
    apertureBlades: 9,
    groupsCount: 14,
    elementsCount: 18,
    weightG: 695,
    isFavorite: false,
    isNextPurchase: false,
    isOwned: true
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
      minAperture REAL,
      label TEXT NOT NULL,
      filterDiameterMm REAL,
      priceEur REAL,
      minFocusDistanceM REAL,
      angleAtMinFocalDeg REAL,
      angleAtMaxFocalDeg REAL,
      apertureBlades INTEGER,
      groupsCount INTEGER,
      elementsCount INTEGER,
      weightG REAL,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      isNextPurchase INTEGER NOT NULL DEFAULT 0,
      isOwned INTEGER NOT NULL DEFAULT 0,
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
      maxApertureAtMinFocal, maxApertureAtMaxFocal, minAperture, label, filterDiameterMm, priceEur,
      minFocusDistanceM, angleAtMinFocalDeg, angleAtMaxFocalDeg, apertureBlades, groupsCount, elementsCount,
      weightG, isFavorite, isNextPurchase, isOwned, createdAt, updatedAt
    ) VALUES (
      '${LENS_ID}', '${BRAND_ID}', '${MOUNT_ID}', 24, 70, 36, 105, 2.8, 4, 22,
      'Canon RF 24-70 f/2.8-4 L', 82, 1200, 0.38, 84, 34, 9, 14, 18,
      695, 0, 0, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
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

  /**
   * Verifies that updating a missing lens fails without changing other links
   */
  test("updateLens preserves existing options when lens is missing", async () => {
    useIsolatedDatabasePath();
    vi.resetModules();
    const { createLens, listLenses, updateLens } = await import("../../../src/lib/db/lens-repository");
    const createdLens = createLens(validLensInput([OPTION_L_ID]));

    expect(() => updateLens("missing-lens", validLensInput([OPTION_IS_ID]))).toThrow("Objectif introuvable.");

    const [storedLens] = listLenses().filter((lens) => lens.id === createdLens.id);
    expect(storedLens.options.map((option) => option.code)).toEqual(["L"]);
  });
});
