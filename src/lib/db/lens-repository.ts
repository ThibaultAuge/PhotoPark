import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Lens, LensBrand, LensInput, LensMount, LensOption, LensReferenceData, OptionGroup, OptionGroupMember, SensorType } from "@/lib/lens/types";
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
  `);

  migrateLegacyLensOptions(database);

  database.exec(`
    CREATE TABLE IF NOT EXISTS lens_options (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL COLLATE NOCASE,
      description TEXT NOT NULL,
      brandId TEXT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(code, brandId)
    );
    CREATE TABLE IF NOT EXISTS option_groups (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('flag', 'value')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS option_group_members (
      optionId TEXT NOT NULL REFERENCES lens_options(id) ON DELETE CASCADE,
      groupId TEXT NOT NULL REFERENCES option_groups(id) ON DELETE RESTRICT,
      PRIMARY KEY (optionId, groupId)
    );
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
    CREATE TABLE IF NOT EXISTS lens_option_links (
      lensId TEXT NOT NULL REFERENCES lenses(id) ON DELETE CASCADE,
      optionId TEXT NOT NULL REFERENCES lens_options(id) ON DELETE RESTRICT,
      PRIMARY KEY (lensId, optionId)
    );
  `);
  ensureLensColumns(database);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_lenses_brand ON lenses(brandId);
    CREATE INDEX IF NOT EXISTS idx_lenses_mount ON lenses(mountId);
    CREATE INDEX IF NOT EXISTS idx_lenses_status ON lenses(isFavorite, isNextPurchase, isOwned);
    CREATE INDEX IF NOT EXISTS idx_lens_options_brand ON lens_options(brandId);
  `);
  repairLensOptionLinksSchema(database);
}

function ensureLensColumns(database: Database.Database) {
  const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'lenses'").get();
  if (!table) return;

  const columns = new Set((database.prepare("PRAGMA table_info(lenses)").all() as Array<{ name: string }>).map((column) => column.name));
  const requiredColumns = [
    { name: "filterDiameterMm", definition: "REAL" },
    { name: "priceEur", definition: "REAL" },
    { name: "minFocusDistanceM", definition: "REAL" },
    { name: "angleAtMinFocalDeg", definition: "REAL" },
    { name: "angleAtMaxFocalDeg", definition: "REAL" },
    { name: "apertureBlades", definition: "INTEGER" },
    { name: "opticalFormula", definition: "TEXT" },
    { name: "weightG", definition: "REAL" },
    { name: "isFavorite", definition: "INTEGER NOT NULL DEFAULT 0" },
    { name: "isNextPurchase", definition: "INTEGER NOT NULL DEFAULT 0" },
    { name: "isOwned", definition: "INTEGER NOT NULL DEFAULT 0" },
    { name: "minApertureAtMinFocal", definition: "REAL" },
    { name: "minApertureAtMaxFocal", definition: "REAL" },
    { name: "retired", definition: "INTEGER NOT NULL DEFAULT 0" },
  ];

  for (const column of requiredColumns) {
    if (!columns.has(column.name)) {
      database.exec(`ALTER TABLE lenses ADD COLUMN ${column.name} ${column.definition}`);
    }
  }
}

function hasLegacyLensOptions(database: Database.Database) {
  const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'lens_options'").get();
  if (!table) return false;
  const columns = database.prepare("PRAGMA table_info(lens_options)").all() as Array<{ name: string }>;
  return columns.some((col) => col.name === "code") && !columns.some((col) => col.name === "brandId");
}

function migrateLegacyLensOptions(database: Database.Database) {
  if (!hasLegacyLensOptions(database)) return;

  const legacyOptTable = `lens_options_legacy_${Date.now()}`;
  const now = new Date().toISOString();

  const transaction = database.transaction(() => {
    // Rename old lens_options table
    database.exec(`ALTER TABLE lens_options RENAME TO ${legacyOptTable}`);

    // Create the new lens_options table with brandId
    database.exec(`
      CREATE TABLE lens_options (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL COLLATE NOCASE,
        description TEXT NOT NULL,
        brandId TEXT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(code, brandId)
      );
    `);

    // Ensure "Autre" brand exists
    const findBrand = database.prepare("SELECT id FROM brands WHERE name = ? COLLATE NOCASE");
    const insertBrand = database.prepare("INSERT OR IGNORE INTO brands (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)");
    let autreId = (findBrand.get("Autre") as { id: string } | undefined)?.id;
    if (!autreId) { autreId = randomUUID(); insertBrand.run(autreId, "Autre", now, now); }

    // Check if lens_option_links exists and has data we can use
    const hasLinksTable = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'lens_option_links'").get();

    // Try to move lens_option_links aside only if it has the old FK structure
    let hasBackupLinks = false;
    if (hasLinksTable) {
      // Rename it safely
      database.exec(`ALTER TABLE lens_option_links RENAME TO lens_option_links_backup`);
      // Re-create the empty lens_option_links with correct schema (handled by initializeSchema later)
      database.exec(`
        CREATE TABLE lens_option_links (
          lensId TEXT NOT NULL REFERENCES lenses(id) ON DELETE CASCADE,
          optionId TEXT NOT NULL REFERENCES lens_options(id) ON DELETE RESTRICT,
          PRIMARY KEY (lensId, optionId)
        );
      `);
      hasBackupLinks = true;
    }

    // Prepare query to get brand usage from backup links
    let getUsageBrands: ((optionId: string) => Array<{ brandId: string }>) | null = null;
    let getLinksForOption: ((optionId: string) => Array<{ lensId: string }>) | null = null;
    let insertRelink: ((lensId: string, optionId: string) => void) | null = null;

    if (hasBackupLinks) {
      const getBrandStmt = database.prepare(`SELECT DISTINCT lenses.brandId
        FROM lens_option_links_backup
        JOIN lenses ON lenses.id = lens_option_links_backup.lensId
        WHERE lens_option_links_backup.optionId = ?`);
      getUsageBrands = (optionId: string) => getBrandStmt.all(optionId) as Array<{ brandId: string }>;

      const getLinkStmt = database.prepare("SELECT lensId FROM lens_option_links_backup WHERE optionId = ?");
      getLinksForOption = (optionId: string) => getLinkStmt.all(optionId) as Array<{ lensId: string }>;

      const insertStmt = database.prepare("INSERT INTO lens_option_links (lensId, optionId) VALUES (?, ?)");
      insertRelink = (lensId: string, optionId: string) => { insertStmt.run(lensId, optionId); };
    }

    const insertOption = database.prepare("INSERT INTO lens_options (id, code, description, brandId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");

    const oldOptions = database.prepare(`SELECT * FROM ${legacyOptTable}`).all() as Array<{ id: string; code: string; description: string; createdAt: string; updatedAt: string }>;

    for (const oldOpt of oldOptions) {
      let brandsForOption: Array<{ brandId: string }> = [];
      if (getUsageBrands) {
        brandsForOption = getUsageBrands(oldOpt.id);
      }
      const uniqueBrandIds = [...new Set(brandsForOption.map((b) => b.brandId))];

      if (uniqueBrandIds.length === 0) {
        // No usage -> assign to "Autre", preserve original ID
        insertOption.run(oldOpt.id, oldOpt.code, oldOpt.description, autreId, oldOpt.createdAt, now);
      } else if (uniqueBrandIds.length === 1) {
        // Single brand, preserve original ID
        insertOption.run(oldOpt.id, oldOpt.code, oldOpt.description, uniqueBrandIds[0], oldOpt.createdAt, now);
        if (insertRelink && getLinksForOption) {
          const links = getLinksForOption(oldOpt.id);
          for (const link of links) {
            insertRelink(link.lensId, oldOpt.id);
          }
        }
      } else {
        // Multiple brands -> create one option per brand with new IDs
        const lensBrandStmt = database.prepare("SELECT brandId FROM lenses WHERE id = ?");
        for (const brandId of uniqueBrandIds) {
          const newId = randomUUID();
          insertOption.run(newId, oldOpt.code, oldOpt.description, brandId, oldOpt.createdAt, now);
          if (insertRelink && getLinksForOption) {
            const links = getLinksForOption(oldOpt.id);
            for (const link of links) {
              const lensBrand = lensBrandStmt.get(link.lensId) as { brandId: string } | undefined;
              if (lensBrand?.brandId === brandId) {
                insertRelink(link.lensId, newId);
              }
            }
          }
        }
      }
    }

    // Clean up backup link table
    if (hasBackupLinks) {
      database.exec(`DROP TABLE IF EXISTS lens_option_links_backup`);
    }

    // Drop the old options table
    database.exec(`DROP TABLE ${legacyOptTable}`);
  });
  transaction();
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
  const insertOption = database.prepare("INSERT INTO lens_options (id, code, description, brandId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
  const insertLens = database.prepare(`INSERT INTO lenses (
    id, brandId, mountId, focalMinMm, focalMaxMm, apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm,
    maxApertureAtMinFocal, maxApertureAtMaxFocal, minApertureAtMinFocal, minApertureAtMaxFocal, label, filterDiameterMm, priceEur,
    minFocusDistanceM, angleAtMinFocalDeg, angleAtMaxFocalDeg, apertureBlades, opticalFormula, weightG,
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
        row.maxApertureAtMinFocal, row.maxApertureAtMaxFocal, row.minApertureAtMinFocal, row.minApertureAtMaxFocal, row.label || `${brandName} ${mountName}`,
        row.filterDiameterMm, row.priceEur, row.minFocusDistanceM, row.angleAtMinFocalDeg, row.angleAtMaxFocalDeg,
        row.apertureBlades, row.opticalFormula, row.weightG, row.isFavorite ? 1 : 0, row.isNextPurchase ? 1 : 0,
        row.isOwned ? 1 : 0, row.createdAt || now, row.updatedAt || now
      );
      for (const code of String(row.options || "").split(/\s+/).map((value) => value.trim()).filter(Boolean)) {
        let optionId = (findOption.get(code) as { id: string } | undefined)?.id;
        if (!optionId) { optionId = randomUUID(); insertOption.run(optionId, code, code, brandId, now, now); }
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
  const insertOption = database.prepare("INSERT OR IGNORE INTO lens_options (id, code, description, brandId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
  const insertGroup = database.prepare("INSERT OR IGNORE INTO option_groups (id, slug, name, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
  const insertMember = database.prepare("INSERT OR IGNORE INTO option_group_members (optionId, groupId) VALUES (?, ?)");
  const canonId = "11111111-1111-4111-8111-111111111111";

  insertBrand.run(canonId, "Canon", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222221", "Canon RF", "FULL_FRAME", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222222", "Canon RF-S", "APS_C", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222223", "Canon EF", "FULL_FRAME", now, now);
  insertMount.run("22222222-2222-4222-8222-222222222224", "Canon EF-S", "APS_C", now, now);

  // Seed Canon options with brandId
  insertOption.run("33333333-3333-4333-8333-333333333331", "L", "Série professionnelle Canon L", canonId, now, now);
  insertOption.run("33333333-3333-4333-8333-333333333332", "IS", "Stabilisation optique", canonId, now, now);
  insertOption.run("33333333-3333-4333-8333-333333333333", "USM", "Motorisation ultrasonique", canonId, now, now);
  insertOption.run("33333333-3333-4333-8333-333333333334", "STM", "Motorisation pas-à-pas", canonId, now, now);

  // Seed option groups
  insertGroup.run("g-stab", "stabilization", "Stabilisation", "flag", now, now);
  insertGroup.run("g-motor", "motor", "Motorisation", "value", now, now);
  insertGroup.run("g-series", "series", "Série", "value", now, now);

  // Seed group members — use lookup by (code, brandId) so they work even if the
  // migration created options with different UUIDs than the hardcoded seed IDs above.
  const findCanonOption = database.prepare("SELECT id FROM lens_options WHERE code = ? AND brandId = ?");
  const stabOption = (findCanonOption.get("IS", canonId) as { id: string } | undefined);
  const motorOption1 = (findCanonOption.get("USM", canonId) as { id: string } | undefined);
  const motorOption2 = (findCanonOption.get("STM", canonId) as { id: string } | undefined);
  const seriesOption = (findCanonOption.get("L", canonId) as { id: string } | undefined);
  if (stabOption) insertMember.run(stabOption.id, "g-stab");
  if (motorOption1) insertMember.run(motorOption1.id, "g-motor");
  if (motorOption2) insertMember.run(motorOption2.id, "g-motor");
  if (seriesOption) insertMember.run(seriesOption.id, "g-series");
}

export function listReferenceData(): LensReferenceData {
  const database = getDatabase();
  return {
    brands: database.prepare("SELECT id, name FROM brands ORDER BY name COLLATE NOCASE").all() as LensBrand[],
    mounts: database.prepare("SELECT id, name, sensorType FROM mounts ORDER BY name COLLATE NOCASE").all() as LensMount[],
    options: database.prepare("SELECT id, code, description, brandId FROM lens_options ORDER BY code COLLATE NOCASE").all() as LensOption[],
    optionGroups: database.prepare("SELECT id, slug, name, type FROM option_groups ORDER BY slug COLLATE NOCASE").all() as OptionGroup[],
    optionGroupMembers: database.prepare("SELECT optionId, groupId FROM option_group_members").all() as OptionGroupMember[]
  };
}

export function listOptionsByBrand(brandId: string): LensOption[] {
  return getDatabase().prepare("SELECT id, code, description, brandId FROM lens_options WHERE brandId = ? ORDER BY code COLLATE NOCASE").all(brandId) as LensOption[];
}

export class DuplicateLensError extends Error {
  constructor(duplicateLabel: string) {
    super(`Cet objectif existe déjà : ${duplicateLabel}`);
    this.name = "DuplicateLensError";
  }
}

function assertNoDuplicateLens(database: Database.Database, input: { brandId: string; focalMinMm: number; focalMaxMm: number; maxApertureAtMinFocal: number; maxApertureAtMaxFocal: number; mountId: string }, excludeId?: string) {
  const numericFields = [input.focalMinMm, input.focalMaxMm, input.maxApertureAtMinFocal, input.maxApertureAtMaxFocal];
  if (numericFields.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new TypeError("Valeurs numériques invalides pour la vérification des doublons.");
  }
  const params: Array<string | number> = [input.brandId, input.focalMinMm, input.focalMaxMm, input.maxApertureAtMinFocal, input.maxApertureAtMaxFocal, input.mountId];
  let sql = `SELECT id, label FROM lenses WHERE brandId = ? AND focalMinMm = ? AND focalMaxMm = ? AND maxApertureAtMinFocal = ? AND maxApertureAtMaxFocal = ? AND mountId = ?`;
  if (excludeId) { sql += ` AND id != ?`; params.push(excludeId); }
  const duplicate = database.prepare(sql).get(...params) as { id: string; label: string } | undefined;
  if (duplicate) throw new DuplicateLensError(duplicate.label);
}

function getLensIdentity(database: Database.Database, id: string) {
  return database.prepare(`SELECT brandId, mountId, focalMinMm, focalMaxMm, maxApertureAtMinFocal, maxApertureAtMaxFocal
    FROM lenses WHERE id = ?`).get(id) as {
    brandId: string;
    mountId: string;
    focalMinMm: number;
    focalMaxMm: number;
    maxApertureAtMinFocal: number;
    maxApertureAtMaxFocal: number;
  } | undefined;
}

function isSameLensIdentity(
  current: ReturnType<typeof getLensIdentity>,
  next: { brandId: string; focalMinMm: number; focalMaxMm: number; maxApertureAtMinFocal: number; maxApertureAtMaxFocal: number; mountId: string },
) {
  return Boolean(
    current
      && current.brandId === next.brandId
      && current.mountId === next.mountId
      && current.focalMinMm === next.focalMinMm
      && current.focalMaxMm === next.focalMaxMm
      && current.maxApertureAtMinFocal === next.maxApertureAtMinFocal
      && current.maxApertureAtMaxFocal === next.maxApertureAtMaxFocal,
  );
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
    assertNoDuplicateLens(database, normalized);
    database.prepare(`INSERT INTO lenses (
      id, brandId, mountId, focalMinMm, focalMaxMm, apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm,
      maxApertureAtMinFocal, maxApertureAtMaxFocal, minApertureAtMinFocal, minApertureAtMaxFocal, label, filterDiameterMm, priceEur,
      minFocusDistanceM, angleAtMinFocalDeg, angleAtMaxFocalDeg, apertureBlades, opticalFormula, weightG,
      isFavorite, isNextPurchase, isOwned, retired, createdAt, updatedAt
    ) VALUES (
      @id, @brandId, @mountId, @focalMinMm, @focalMaxMm, @apscFocalMinEquivalentMm, @apscFocalMaxEquivalentMm,
      @maxApertureAtMinFocal, @maxApertureAtMaxFocal, @minApertureAtMinFocal, @minApertureAtMaxFocal, @label, @filterDiameterMm, @priceEur,
      @minFocusDistanceM, @angleAtMinFocalDeg, @angleAtMaxFocalDeg, @apertureBlades, @opticalFormula, @weightG,
      @isFavorite, @isNextPurchase, @isOwned, @retired, @createdAt, @updatedAt
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
    const currentIdentity = getLensIdentity(database, id);
    if (!isSameLensIdentity(currentIdentity, normalized)) {
      assertNoDuplicateLens(database, normalized, id);
    }
    database.prepare(`UPDATE lenses SET
      brandId=@brandId, mountId=@mountId, focalMinMm=@focalMinMm, focalMaxMm=@focalMaxMm,
      apscFocalMinEquivalentMm=@apscFocalMinEquivalentMm, apscFocalMaxEquivalentMm=@apscFocalMaxEquivalentMm,
      maxApertureAtMinFocal=@maxApertureAtMinFocal, maxApertureAtMaxFocal=@maxApertureAtMaxFocal,
      minApertureAtMinFocal=@minApertureAtMinFocal, minApertureAtMaxFocal=@minApertureAtMaxFocal,
      label=@label, filterDiameterMm=@filterDiameterMm, priceEur=@priceEur,
      minFocusDistanceM=@minFocusDistanceM, angleAtMinFocalDeg=@angleAtMinFocalDeg, angleAtMaxFocalDeg=@angleAtMaxFocalDeg,
      apertureBlades=@apertureBlades, opticalFormula=@opticalFormula, weightG=@weightG,
      isFavorite=@isFavorite, isNextPurchase=@isNextPurchase, isOwned=@isOwned, retired=@retired, updatedAt=@updatedAt
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

export function createOption(code: string, description: string, brandId: string) {
  const now = new Date().toISOString();
  getDatabase().prepare("INSERT INTO lens_options (id, code, description, brandId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), code.trim(), description.trim(), brandId, now, now);
}

export function updateOption(id: string, code: string, description: string) {
  getDatabase().prepare("UPDATE lens_options SET code = ?, description = ?, updatedAt = ? WHERE id = ?").run(code.trim(), description.trim(), new Date().toISOString(), id);
  refreshLabels();
}

export function deleteOption(id: string) {
  getDatabase().prepare("DELETE FROM lens_options WHERE id = ?").run(id);
}

// --- Option Groups CRUD ---

export function createOptionGroup(slug: string, name: string, type: "flag" | "value") {
  const now = new Date().toISOString();
  getDatabase().prepare("INSERT INTO option_groups (id, slug, name, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), slug.trim(), name.trim(), type, now, now);
}

export function updateOptionGroup(id: string, slug: string, name: string, type: "flag" | "value") {
  getDatabase().prepare("UPDATE option_groups SET slug = ?, name = ?, type = ?, updatedAt = ? WHERE id = ?").run(slug.trim(), name.trim(), type, new Date().toISOString(), id);
}

export function deleteOptionGroup(id: string) {
  getDatabase().prepare("DELETE FROM option_groups WHERE id = ?").run(id);
}

export function listOptionGroups(): OptionGroup[] {
  return getDatabase().prepare("SELECT id, slug, name, type FROM option_groups ORDER BY slug COLLATE NOCASE").all() as OptionGroup[];
}

// --- Option Group Members ---

export function getOptionGroupMembers(groupId: string): LensOption[] {
  return getDatabase().prepare(`SELECT lens_options.id, lens_options.code, lens_options.description, lens_options.brandId
    FROM option_group_members
    JOIN lens_options ON lens_options.id = option_group_members.optionId
    WHERE option_group_members.groupId = ?
    ORDER BY lens_options.code COLLATE NOCASE`).all(groupId) as LensOption[];
}

export function replaceGroupMembers(groupId: string, optionIds: string[]) {
  const database = getDatabase();
  const transaction = database.transaction(() => {
    database.prepare("DELETE FROM option_group_members WHERE groupId = ?").run(groupId);
    const insert = database.prepare("INSERT OR IGNORE INTO option_group_members (optionId, groupId) VALUES (?, ?)");
    for (const optionId of new Set(optionIds)) insert.run(optionId, groupId);
  });
  transaction();
}

function mapRow(database: Database.Database, row: Record<string, unknown>): Lens {
  const options = database.prepare(`SELECT lens_options.id, lens_options.code, lens_options.description, lens_options.brandId
    FROM lens_option_links JOIN lens_options ON lens_options.id = lens_option_links.optionId
    WHERE lens_option_links.lensId = ? ORDER BY lens_options.code COLLATE NOCASE`).all(row.id as string) as LensOption[];
  return { ...(row as Omit<Lens, "isFavorite" | "isNextPurchase" | "isOwned" | "retired" | "options">), options, isFavorite: Boolean(row.isFavorite), isNextPurchase: Boolean(row.isNextPurchase), isOwned: Boolean(row.isOwned), retired: Boolean(row.retired) } as Lens;
}

function resolveLensRefs(database: Database.Database, input: LensInput) {
  const brand = database.prepare("SELECT id, name FROM brands WHERE id = ?").get(input.brandId) as LensBrand | undefined;
  const mount = database.prepare("SELECT id, name, sensorType FROM mounts WHERE id = ?").get(input.mountId) as LensMount | undefined;
  if (!brand || !mount) throw new Error("Marque ou monture inconnue.");
  const options = input.optionIds.length > 0
    ? (database.prepare(`SELECT id, code, description, brandId FROM lens_options WHERE id IN (${input.optionIds.map(() => "?").join(",")}) ORDER BY code COLLATE NOCASE`).all(...input.optionIds) as LensOption[])
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
  const record = values as T & { isFavorite?: boolean; isNextPurchase?: boolean; isOwned?: boolean; retired?: boolean };
  return { ...record, isFavorite: record.isFavorite ? 1 : 0, isNextPurchase: record.isNextPurchase ? 1 : 0, isOwned: record.isOwned ? 1 : 0, retired: record.retired ? 1 : 0 };
}
