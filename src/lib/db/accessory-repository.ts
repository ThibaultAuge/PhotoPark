import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Accessory, AccessoryInput, AccessoryReferenceData, AccessoryType } from "@/lib/accessory/types";
import { normalizeAccessoryInput } from "@/lib/accessory/accessory-utils";
import { getDatabase, listBrandsByDomain } from "@/lib/db/lens-repository";

let accessorySchemaReady = false;

function getAccessoryDatabase() {
  const database = getDatabase();
  if (!accessorySchemaReady) {
    initializeAccessorySchema(database);
    seedAccessoryReferenceData(database);
    accessorySchemaReady = true;
  }
  return database;
}

function initializeAccessorySchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS accessory_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accessories (
      id TEXT PRIMARY KEY,
      brandId TEXT NOT NULL REFERENCES brands(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      typeId TEXT NOT NULL REFERENCES accessory_types(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      capacityLiters REAL,
      capacityBodies INTEGER,
      capacityLenses INTEGER,
      fitsLaptop INTEGER NOT NULL DEFAULT 0,
      fitsTripod INTEGER NOT NULL DEFAULT 0,
      widthMm REAL,
      heightMm REAL,
      depthMm REAL,
      weightG REAL,
      priceEur REAL,
      carryStyleNotes TEXT,
      capacityNotes TEXT,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      isNextPurchase INTEGER NOT NULL DEFAULT 0,
      isOwned INTEGER NOT NULL DEFAULT 0,
      retired INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_accessories_brand ON accessories(brandId);
    CREATE INDEX IF NOT EXISTS idx_accessories_type ON accessories(typeId);
    CREATE INDEX IF NOT EXISTS idx_accessories_status ON accessories(isFavorite, isNextPurchase, isOwned, retired);
  `);
}

function seedAccessoryReferenceData(database: Database.Database) {
  const now = new Date().toISOString();
  const insert = database.prepare("INSERT OR IGNORE INTO accessory_types (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)");
  insert.run("a-type-backpack", "Sac à dos", now, now);
  insert.run("a-type-shoulder", "Bandoulière", now, now);
  insert.run("a-type-pouch", "Poche", now, now);
  insert.run("a-type-belt", "Ceinture", now, now);
}

export function listAccessoryReferenceData(): AccessoryReferenceData {
  const database = getAccessoryDatabase();
  return {
    brands: listBrandsByDomain("accessories"),
    types: database.prepare("SELECT id, name FROM accessory_types ORDER BY name COLLATE NOCASE").all() as AccessoryType[],
  };
}

export function listAccessories(): Accessory[] {
  const database = getAccessoryDatabase();
  const rows = database.prepare(`SELECT accessories.*, brands.name AS brand, accessory_types.name AS type
    FROM accessories
    JOIN brands ON brands.id = accessories.brandId
    JOIN accessory_types ON accessory_types.id = accessories.typeId
    ORDER BY brands.name COLLATE NOCASE, accessories.name COLLATE NOCASE`).all() as Record<string, unknown>[];
  return rows.map(mapAccessoryRow);
}

export function createAccessory(input: AccessoryInput) {
  const database = getAccessoryDatabase();
  const refs = resolveAccessoryRefs(database, input);
  const normalized = normalizeAccessoryInput(input, refs);
  const now = new Date().toISOString();
  const accessory: Accessory = { id: randomUUID(), ...normalized, createdAt: now, updatedAt: now };
  database.prepare(`INSERT INTO accessories (
    id, brandId, typeId, name, label, capacityLiters, capacityBodies, capacityLenses, fitsLaptop, fitsTripod,
    widthMm, heightMm, depthMm, weightG, priceEur, carryStyleNotes, capacityNotes,
    isFavorite, isNextPurchase, isOwned, retired, createdAt, updatedAt
  ) VALUES (
    @id, @brandId, @typeId, @name, @label, @capacityLiters, @capacityBodies, @capacityLenses, @fitsLaptop, @fitsTripod,
    @widthMm, @heightMm, @depthMm, @weightG, @priceEur, @carryStyleNotes, @capacityNotes,
    @isFavorite, @isNextPurchase, @isOwned, @retired, @createdAt, @updatedAt
  )`).run(toAccessoryDbParams(accessory));
  return accessory;
}

export function updateAccessory(id: string, input: AccessoryInput) {
  const database = getAccessoryDatabase();
  const refs = resolveAccessoryRefs(database, input);
  const normalized = normalizeAccessoryInput(input, refs);
  database.prepare(`UPDATE accessories SET
    brandId=@brandId, typeId=@typeId, name=@name, label=@label, capacityLiters=@capacityLiters,
    capacityBodies=@capacityBodies, capacityLenses=@capacityLenses, fitsLaptop=@fitsLaptop, fitsTripod=@fitsTripod,
    widthMm=@widthMm, heightMm=@heightMm, depthMm=@depthMm, weightG=@weightG, priceEur=@priceEur,
    carryStyleNotes=@carryStyleNotes, capacityNotes=@capacityNotes, isFavorite=@isFavorite,
    isNextPurchase=@isNextPurchase, isOwned=@isOwned, retired=@retired, updatedAt=@updatedAt
    WHERE id=@id`).run(toAccessoryDbParams({ id, ...normalized, updatedAt: new Date().toISOString() }));
}

export function deleteAccessory(id: string) {
  getAccessoryDatabase().prepare("DELETE FROM accessories WHERE id = ?").run(id);
}

export function createAccessoryType(name: string) {
  const now = new Date().toISOString();
  getAccessoryDatabase().prepare("INSERT INTO accessory_types (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)").run(randomUUID(), name.trim(), now, now);
}

export function updateAccessoryType(id: string, name: string) {
  getAccessoryDatabase().prepare("UPDATE accessory_types SET name = ?, updatedAt = ? WHERE id = ?").run(name.trim(), new Date().toISOString(), id);
  refreshAccessoryLabels();
}

export function deleteAccessoryType(id: string) {
  getAccessoryDatabase().prepare("DELETE FROM accessory_types WHERE id = ?").run(id);
}

function resolveAccessoryRefs(database: Database.Database, input: AccessoryInput) {
  const brand = database.prepare("SELECT id, name FROM brands WHERE id = ?").get(input.brandId) as { id: string; name: string } | undefined;
  const type = database.prepare("SELECT id, name FROM accessory_types WHERE id = ?").get(input.typeId) as AccessoryType | undefined;
  if (!brand || !type) throw new Error("Marque ou type d'accessoire inconnu.");
  const brandInAccessoryDomain = database.prepare("SELECT 1 FROM brand_domains WHERE brandId = ? AND domain = 'accessories'").get(input.brandId);
  if (!brandInAccessoryDomain) throw new Error("Cette marque n'est pas disponible pour les accessoires.");
  return { brand: brand.name, type: type.name };
}

function mapAccessoryRow(row: Record<string, unknown>) {
  return {
    ...(row as Omit<Accessory, "fitsLaptop" | "fitsTripod" | "isFavorite" | "isNextPurchase" | "isOwned" | "retired">),
    fitsLaptop: Boolean(row.fitsLaptop),
    fitsTripod: Boolean(row.fitsTripod),
    isFavorite: Boolean(row.isFavorite),
    isNextPurchase: Boolean(row.isNextPurchase),
    isOwned: Boolean(row.isOwned),
    retired: Boolean(row.retired),
  } as Accessory;
}

export function refreshAccessoryLabels() {
  const database = getAccessoryDatabase();
  const accessories = listAccessories();
  for (const accessory of accessories) {
    const normalized = normalizeAccessoryInput(accessory, { brand: accessory.brand, type: accessory.type });
    database.prepare("UPDATE accessories SET name = ?, label = ?, updatedAt = ? WHERE id = ?")
      .run(normalized.name, normalized.label, new Date().toISOString(), accessory.id);
  }
}

function toAccessoryDbParams<T extends object>(values: T) {
  const record = values as T & { fitsLaptop?: boolean; fitsTripod?: boolean; isFavorite?: boolean; isNextPurchase?: boolean; isOwned?: boolean; retired?: boolean };
  return {
    ...record,
    fitsLaptop: record.fitsLaptop ? 1 : 0,
    fitsTripod: record.fitsTripod ? 1 : 0,
    isFavorite: record.isFavorite ? 1 : 0,
    isNextPurchase: record.isNextPurchase ? 1 : 0,
    isOwned: record.isOwned ? 1 : 0,
    retired: record.retired ? 1 : 0,
  };
}
