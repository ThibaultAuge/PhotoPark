import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Lens, LensBrand, LensInput, LensMount, LensOption, LensReferenceData, SensorType } from "@/lib/lens/types";
import { normalizeLensInput } from "@/lib/lens/lens-utils";

let db: Database.Database | null = null;

function getDatabase() {
  if (db) return db;
  const dbPath = resolve(process.env.DATABASE_PATH ?? "./data/photos.sqlite");
  mkdirSync(dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initializeSchema(db);
  seedReferenceData(db);
  return db;
}

function initializeSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS mounts (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, sensorType TEXT NOT NULL CHECK(sensorType IN ('FULL_FRAME', 'APS_C')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS lens_options (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE COLLATE NOCASE, description TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
  `);

  if (hasLegacyLensTable(database)) migrateLegacyLensTable(database);

  database.exec(`
    CREATE TABLE IF NOT EXISTS lenses (
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
    CREATE TABLE IF NOT EXISTS lens_option_links (
      lensId TEXT NOT NULL REFERENCES lenses(id) ON DELETE CASCADE,
      optionId TEXT NOT NULL REFERENCES lens_options(id) ON DELETE RESTRICT,
      PRIMARY KEY (lensId, optionId)
    );
    CREATE INDEX IF NOT EXISTS idx_lenses_brand ON lenses(brandId);
    CREATE INDEX IF NOT EXISTS idx_lenses_mount ON lenses(mountId);
    CREATE INDEX IF NOT EXISTS idx_lenses_status ON lenses(isFavorite, isNextPurchase, isOwned);
  `);
  repairLensOptionLinksSchema(database);
}

function hasLegacyLensTable(database: Database.Database) {
  const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'lenses'").get();
  if (!table) return false;
  const columns = database.prepare("PRAGMA table_info(lenses)").all() as Array<{ name: string }>;
  return columns.some((column) => column.name === "brand") && !columns.some((column) => column.name === "brandId");
}

function migrateLegacyLensTable(database: Database.Database) {
  const legacyTable = `lenses_legacy_${Date.now()}`;
  const now = new Date().toISOString();
  database.exec(`ALTER TABLE lenses RENAME TO ${legacyTable}`);
  initializeSchema(database);
  const rows = database.prepare(`SELECT * FROM ${legacyTable}`).all() as Array<Record<string, unknown>>;
  const findBrand = database.prepare("SELECT id FROM brands WHERE name = ? COLLATE NOCASE");
  const insertBrand = database.prepare("INSERT INTO brands (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)");
  const findMount = database.prepare("SELECT id FROM mounts WHERE name = ? COLLATE NOCASE");
  const insertMount = database.prepare("INSERT INTO mounts (id, name, sensorType, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)");
  const findOption = database.prepare("SELECT id FROM lens_options WHERE code = ? COLLATE NOCASE");
  const insertOption = database.prepare("INSERT INTO lens_options (id, code, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)");
  const insertLens = database.prepare(`INSERT INTO lenses (
    id, brandId, mountId, focalMinMm, focalMaxMm, apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm,
    maxApertureAtMinFocal, maxApertureAtMaxFocal, minAperture, label, filterDiameterMm, priceEur,
    minFocusDistanceM, angleAtMinFocalDeg, angleAtMaxFocalDeg, apertureBlades, groupsCount, elementsCount, weightG,
    isFavorite, isNextPurchase, isOwned, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertLink = database.prepare("INSERT OR IGNORE INTO lens_option_links (lensId, optionId) VALUES (?, ?)");

  const transaction = database.transaction(() => {
    for (const row of rows) {
      const brandName = String(row.brand || "Autre").trim() || "Autre";
      const mountName = String(row.mount || "Autre").trim() || "Autre";
      const sensorType = row.sensorType === "APS_C" ? "APS_C" : "FULL_FRAME";
      let brandId = (findBrand.get(brandName) as { id: string } | undefined)?.id;
      if (!brandId) { brandId = randomUUID(); insertBrand.run(brandId, brandName, now, now); }
      let mountId = (findMount.get(mountName) as { id: string } | undefined)?.id;
      if (!mountId) { mountId = randomUUID(); insertMount.run(mountId, mountName, sensorType, now, now); }
      const lensId = String(row.id || randomUUID());
      insertLens.run(
        lensId, brandId, mountId, row.focalMinMm, row.focalMaxMm, row.apscFocalMinEquivalentMm, row.apscFocalMaxEquivalentMm,
        row.maxApertureAtMinFocal, row.maxApertureAtMaxFocal, row.minAperture, row.label || `${brandName} ${mountName}`,
        row.filterDiameterMm, row.priceEur, row.minFocusDistanceM, row.angleAtMinFocalDeg, row.angleAtMaxFocalDeg,
        row.apertureBlades, row.groupsCount, row.elementsCount, row.weightG, row.isFavorite ? 1 : 0, row.isNextPurchase ? 1 : 0,
        row.isOwned ? 1 : 0, row.createdAt || now, row.updatedAt || now
      );
      for (const code of String(row.options || "").split(/\s+/).map((value) => value.trim()).filter(Boolean)) {
        let optionId = (findOption.get(code) as { id: string } | undefined)?.id;
        if (!optionId) { optionId = randomUUID(); insertOption.run(optionId, code, code, now, now); }
        insertLink.run(lensId, optionId);
      }
    }
  });
  transaction();
}

function seedReferenceData(database: Database.Database) {
  const now = new Date().toISOString();
  const insertBrand = database.prepare("INSERT OR IGNORE INTO brands (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)");
  const insertMount = database.prepare("INSERT OR IGNORE INTO mounts (id, name, sensorType, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)");
  const insertOption = database.prepare("INSERT OR IGNORE INTO lens_options (id, code, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)");
  insertBrand.run("11111111-1111-4111-8111-111111111111", "Canon", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222221", "Canon RF", "FULL_FRAME", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222222", "Canon RF-S", "APS_C", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222223", "Canon EF", "FULL_FRAME", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222224", "Canon EF-S", "APS_C", now, now);
  insertOption.run("33333333-3333-4333-8333-333333333331", "L", "Série professionnelle Canon L", now, now);
  insertOption.run("33333333-3333-4333-8333-333333333332", "IS", "Stabilisation optique", now, now);
  insertOption.run("33333333-3333-4333-8333-333333333333", "USM", "Motorisation ultrasonique", now, now);
  insertOption.run("33333333-3333-4333-8333-333333333334", "STM", "Motorisation pas-à-pas", now, now);
}

export function listReferenceData(): LensReferenceData {
  const database = getDatabase();
  return {
    brands: database.prepare("SELECT id, name FROM brands ORDER BY name COLLATE NOCASE").all() as LensBrand[],
    mounts: database.prepare("SELECT id, name, sensorType FROM mounts ORDER BY name COLLATE NOCASE").all() as LensMount[],
    options: database.prepare("SELECT id, code, description FROM lens_options ORDER BY code COLLATE NOCASE").all() as LensOption[]
  };
}

export function listLenses(): Lens[] {
  const database = getDatabase();
  const rows = database
    .prepare(`SELECT lenses.*, brands.name AS brand, mounts.name AS mount, mounts.sensorType AS sensorType
      FROM lenses
      JOIN brands ON brands.id = lenses.brandId
      JOIN mounts ON mounts.id = lenses.mountId
      ORDER BY brands.name COLLATE NOCASE, focalMinMm, focalMaxMm`)
    .all() as Record<string, unknown>[];
  return rows.map((row) => mapRow(database, row));
}

export function createLens(input: LensInput) {
  const database = getDatabase();
  const refs = resolveLensRefs(database, input);
  const normalized = normalizeLensInput(input, refs);
  const now = new Date().toISOString();
  const lens: Lens = { id: randomUUID(), ...normalized, createdAt: now, updatedAt: now };
  const transaction = database.transaction(() => {
    database.prepare(`INSERT INTO lenses (
      id, brandId, mountId, focalMinMm, focalMaxMm, apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm,
      maxApertureAtMinFocal, maxApertureAtMaxFocal, minAperture, label, filterDiameterMm, priceEur,
      minFocusDistanceM, angleAtMinFocalDeg, angleAtMaxFocalDeg, apertureBlades, groupsCount, elementsCount, weightG,
      isFavorite, isNextPurchase, isOwned, createdAt, updatedAt
    ) VALUES (
      @id, @brandId, @mountId, @focalMinMm, @focalMaxMm, @apscFocalMinEquivalentMm, @apscFocalMaxEquivalentMm,
      @maxApertureAtMinFocal, @maxApertureAtMaxFocal, @minAperture, @label, @filterDiameterMm, @priceEur,
      @minFocusDistanceM, @angleAtMinFocalDeg, @angleAtMaxFocalDeg, @apertureBlades, @groupsCount, @elementsCount, @weightG,
      @isFavorite, @isNextPurchase, @isOwned, @createdAt, @updatedAt
    )`).run(toDbParams(lens));
    replaceLensOptions(database, lens.id, input.optionIds);
  });
  transaction();
  return lens;
}

export function updateLens(id: string, input: LensInput) {
  const database = getDatabase();
  const refs = resolveLensRefs(database, input);
  const normalized = normalizeLensInput(input, refs);
  const updatedAt = new Date().toISOString();
  const transaction = database.transaction(() => {
    database.prepare(`UPDATE lenses SET
      brandId=@brandId, mountId=@mountId, focalMinMm=@focalMinMm, focalMaxMm=@focalMaxMm,
      apscFocalMinEquivalentMm=@apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm=@apscFocalMaxEquivalentMm,
      maxApertureAtMinFocal=@maxApertureAtMinFocal, maxApertureAtMaxFocal=@maxApertureAtMaxFocal,
      minAperture=@minAperture, label=@label, filterDiameterMm=@filterDiameterMm, priceEur=@priceEur,
      minFocusDistanceM=@minFocusDistanceM, angleAtMinFocalDeg=@angleAtMinFocalDeg, angleAtMaxFocalDeg=@angleAtMaxFocalDeg,
      apertureBlades=@apertureBlades, groupsCount=@groupsCount, elementsCount=@elementsCount, weightG=@weightG,
      isFavorite=@isFavorite, isNextPurchase=@isNextPurchase, isOwned=@isOwned, updatedAt=@updatedAt
      WHERE id=@id`).run(toDbParams({ id, ...normalized, updatedAt }));
    replaceLensOptions(database, id, input.optionIds);
  });
  transaction();
}

export function deleteLens(id: string) {
  getDatabase().prepare("DELETE FROM lenses WHERE id = ?").run(id);
}

export function createBrand(name: string) {
  const now = new Date().toISOString();
  getDatabase().prepare("INSERT INTO brands (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)").run(randomUUID(), name.trim(), now, now);
}

export function updateBrand(id: string, name: string) {
  getDatabase().prepare("UPDATE brands SET name = ?, updatedAt = ? WHERE id = ?").run(name.trim(), new Date().toISOString(), id);
  refreshLabels();
}

export function deleteBrand(id: string) {
  getDatabase().prepare("DELETE FROM brands WHERE id = ?").run(id);
}

export function createMount(name: string, sensorType: SensorType) {
  const now = new Date().toISOString();
  getDatabase().prepare("INSERT INTO mounts (id, name, sensorType, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), name.trim(), sensorType, now, now);
}

export function updateMount(id: string, name: string, sensorType: SensorType) {
  getDatabase().prepare("UPDATE mounts SET name = ?, sensorType = ?, updatedAt = ? WHERE id = ?").run(name.trim(), sensorType, new Date().toISOString(), id);
  refreshLabels();
}

export function deleteMount(id: string) {
  getDatabase().prepare("DELETE FROM mounts WHERE id = ?").run(id);
}

export function createOption(code: string, description: string) {
  const now = new Date().toISOString();
  getDatabase().prepare("INSERT INTO lens_options (id, code, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), code.trim(), description.trim(), now, now);
}

export function updateOption(id: string, code: string, description: string) {
  getDatabase().prepare("UPDATE lens_options SET code = ?, description = ?, updatedAt = ? WHERE id = ?").run(code.trim(), description.trim(), new Date().toISOString(), id);
  refreshLabels();
}

export function deleteOption(id: string) {
  getDatabase().prepare("DELETE FROM lens_options WHERE id = ?").run(id);
}

function mapRow(database: Database.Database, row: Record<string, unknown>): Lens {
  const options = database.prepare(`SELECT lens_options.id, lens_options.code, lens_options.description
    FROM lens_option_links JOIN lens_options ON lens_options.id = lens_option_links.optionId
    WHERE lens_option_links.lensId = ? ORDER BY lens_options.code COLLATE NOCASE`).all(row.id as string) as LensOption[];
  return { ...(row as Omit<Lens, "isFavorite" | "isNextPurchase" | "isOwned" | "options">), options, isFavorite: Boolean(row.isFavorite), isNextPurchase: Boolean(row.isNextPurchase), isOwned: Boolean(row.isOwned) } as Lens;
}

function resolveLensRefs(database: Database.Database, input: LensInput) {
  const brand = database.prepare("SELECT id, name FROM brands WHERE id = ?").get(input.brandId) as LensBrand | undefined;
  const mount = database.prepare("SELECT id, name, sensorType FROM mounts WHERE id = ?").get(input.mountId) as LensMount | undefined;
  if (!brand || !mount) throw new Error("Marque ou monture inconnue.");
  const options = input.optionIds.length > 0
    ? (database.prepare(`SELECT id, code, description FROM lens_options WHERE id IN (${input.optionIds.map(() => "?").join(",")}) ORDER BY code COLLATE NOCASE`).all(...input.optionIds) as LensOption[])
    : [];
  if (options.length !== new Set(input.optionIds).size) throw new Error("Option inconnue.");
  return { brand: brand.name, mount: mount.name, sensorType: mount.sensorType, options };
}

function replaceLensOptions(database: Database.Database, lensId: string, optionIds: string[]) {
  const lensExists = database.prepare("SELECT 1 FROM lenses WHERE id = ?").get(lensId);
  if (!lensExists) throw new Error("Objectif introuvable.");
  database.prepare("DELETE FROM lens_option_links WHERE lensId = ?").run(lensId);
  const insert = database.prepare("INSERT INTO lens_option_links (lensId, optionId) VALUES (?, ?)");
  for (const optionId of new Set(optionIds)) insert.run(lensId, optionId);
}

function repairLensOptionLinksSchema(database: Database.Database) {
  const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'lens_option_links'").get();
  if (!table) return;

  const foreignKeys = database.prepare("PRAGMA foreign_key_list(lens_option_links)").all() as Array<{ from: string; table: string }>;
  const lensForeignKey = foreignKeys.find((foreignKey) => foreignKey.from === "lensId");
  if (lensForeignKey?.table === "lenses") return;

  const backupTableName = `lens_option_links_invalid_${Date.now()}`;
  const transaction = database.transaction(() => {
    database.exec(`ALTER TABLE lens_option_links RENAME TO ${backupTableName}`);
    database.exec(`
      CREATE TABLE lens_option_links (
        lensId TEXT NOT NULL REFERENCES lenses(id) ON DELETE CASCADE,
        optionId TEXT NOT NULL REFERENCES lens_options(id) ON DELETE RESTRICT,
        PRIMARY KEY (lensId, optionId)
      );
    `);
    database.prepare(`INSERT OR IGNORE INTO lens_option_links (lensId, optionId)
      SELECT old.lensId, old.optionId
      FROM ${backupTableName} old
      WHERE EXISTS (SELECT 1 FROM lenses WHERE lenses.id = old.lensId)
        AND EXISTS (SELECT 1 FROM lens_options WHERE lens_options.id = old.optionId)`).run();
    database.exec(`DROP TABLE ${backupTableName}`);
  });
  transaction();
}

function refreshLabels() {
  const database = getDatabase();
  for (const lens of listLenses()) {
    const input: LensInput = { ...lens, optionIds: lens.options.map((option) => option.id) };
    const refs = resolveLensRefs(database, input);
    const normalized = normalizeLensInput(input, refs);
    database.prepare("UPDATE lenses SET label = ?, apscFocalMinEquivalentMm = ?, apscFocalMaxEquivalentMm = ?, updatedAt = ? WHERE id = ?")
      .run(normalized.label, normalized.apscFocalMinEquivalentMm, normalized.apscFocalMaxEquivalentMm, new Date().toISOString(), lens.id);
  }
}

function toDbParams<T extends object>(values: T) {
  const record = values as T & { isFavorite?: boolean; isNextPurchase?: boolean; isOwned?: boolean };
  return { ...record, isFavorite: record.isFavorite ? 1 : 0, isNextPurchase: record.isNextPurchase ? 1 : 0, isOwned: record.isOwned ? 1 : 0 };
}
