import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Body, BodyInput, BodyReferenceData } from "@/lib/body/types";
import type { LensMount } from "@/lib/lens/types";
import { normalizeBodyInput } from "@/lib/body/body-utils";
import { getDatabase, listBrandsByDomain } from "@/lib/db/lens-repository";

let bodySchemaReady = false;

function getBodyDatabase() {
  const database = getDatabase();
  if (!bodySchemaReady) {
    initializeBodySchema(database);
    bodySchemaReady = true;
  }
  return database;
}

function initializeBodySchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS bodies (
      id TEXT PRIMARY KEY,
      brandId TEXT NOT NULL REFERENCES brands(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      mountId TEXT REFERENCES mounts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      bodyType TEXT NOT NULL CHECK(bodyType IN ('mirrorless', 'dslr')),
      isInterchangeableLens INTEGER NOT NULL DEFAULT 1,
      sensorFormat TEXT NOT NULL CHECK(sensorFormat IN ('FULL_FRAME', 'APS_C', 'MICRO_FOUR_THIRDS', 'MEDIUM_FORMAT', 'OTHER')),
      megapixels REAL,
      isoMin INTEGER,
      isoMax INTEGER,
      priceEur REAL,
      weightG REAL,
      burstFps REAL,
      videoSpecs TEXT,
      batteryLifeShots INTEGER,
      hasIbis INTEGER NOT NULL DEFAULT 0,
      hasDualCardSlot INTEGER NOT NULL DEFAULT 0,
      isWeatherSealed INTEGER NOT NULL DEFAULT 0,
      hasArticulatedScreen INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      isNextPurchase INTEGER NOT NULL DEFAULT 0,
      isOwned INTEGER NOT NULL DEFAULT 0,
      retired INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bodies_brand ON bodies(brandId);
    CREATE INDEX IF NOT EXISTS idx_bodies_mount ON bodies(mountId);
    CREATE INDEX IF NOT EXISTS idx_bodies_status ON bodies(isFavorite, isNextPurchase, isOwned, retired);
  `);
}

export function listBodyReferenceData(): BodyReferenceData {
  const database = getBodyDatabase();
  return {
    brands: listBrandsByDomain("bodies"),
    mounts: database.prepare("SELECT id, name, sensorType FROM mounts ORDER BY name COLLATE NOCASE").all() as LensMount[],
  };
}

export function listBodies(): Body[] {
  const database = getBodyDatabase();
  const rows = database.prepare(`SELECT bodies.*, brands.name AS brand, mounts.name AS mount
    FROM bodies
    JOIN brands ON brands.id = bodies.brandId
    LEFT JOIN mounts ON mounts.id = bodies.mountId
    ORDER BY brands.name COLLATE NOCASE, bodies.name COLLATE NOCASE`).all() as Record<string, unknown>[];
  return rows.map(mapBodyRow);
}

export function createBody(input: BodyInput) {
  const database = getBodyDatabase();
  const refs = resolveBodyRefs(database, input);
  const normalized = normalizeBodyInput(input, refs);
  const now = new Date().toISOString();
  const body: Body = { id: randomUUID(), ...normalized, createdAt: now, updatedAt: now };
  database.prepare(`INSERT INTO bodies (
    id, brandId, mountId, name, label, bodyType, isInterchangeableLens, sensorFormat, megapixels, isoMin, isoMax,
    priceEur, weightG, burstFps, videoSpecs, batteryLifeShots, hasIbis, hasDualCardSlot, isWeatherSealed,
    hasArticulatedScreen, notes, isFavorite, isNextPurchase, isOwned, retired, createdAt, updatedAt
  ) VALUES (
    @id, @brandId, @mountId, @name, @label, @bodyType, @isInterchangeableLens, @sensorFormat, @megapixels, @isoMin, @isoMax,
    @priceEur, @weightG, @burstFps, @videoSpecs, @batteryLifeShots, @hasIbis, @hasDualCardSlot, @isWeatherSealed,
    @hasArticulatedScreen, @notes, @isFavorite, @isNextPurchase, @isOwned, @retired, @createdAt, @updatedAt
  )`).run(toBodyDbParams(body));
  return body;
}

export function updateBody(id: string, input: BodyInput) {
  const database = getBodyDatabase();
  const refs = resolveBodyRefs(database, input);
  const normalized = normalizeBodyInput(input, refs);
  database.prepare(`UPDATE bodies SET
    brandId=@brandId, mountId=@mountId, name=@name, label=@label, bodyType=@bodyType,
    isInterchangeableLens=@isInterchangeableLens, sensorFormat=@sensorFormat, megapixels=@megapixels,
    isoMin=@isoMin, isoMax=@isoMax, priceEur=@priceEur, weightG=@weightG, burstFps=@burstFps,
    videoSpecs=@videoSpecs, batteryLifeShots=@batteryLifeShots, hasIbis=@hasIbis, hasDualCardSlot=@hasDualCardSlot,
    isWeatherSealed=@isWeatherSealed, hasArticulatedScreen=@hasArticulatedScreen, notes=@notes,
    isFavorite=@isFavorite, isNextPurchase=@isNextPurchase, isOwned=@isOwned, retired=@retired, updatedAt=@updatedAt
    WHERE id=@id`).run(toBodyDbParams({ id, ...normalized, updatedAt: new Date().toISOString() }));
}

export function deleteBody(id: string) {
  getBodyDatabase().prepare("DELETE FROM bodies WHERE id = ?").run(id);
}

function resolveBodyRefs(database: Database.Database, input: BodyInput) {
  const brand = database.prepare("SELECT id, name FROM brands WHERE id = ?").get(input.brandId) as { id: string; name: string } | undefined;
  if (!brand) throw new Error("Marque inconnue.");
  const brandInDomain = database.prepare("SELECT 1 FROM brand_domains WHERE brandId = ? AND domain = 'bodies'").get(input.brandId);
  if (!brandInDomain) throw new Error("Cette marque n'est pas disponible pour les boîtiers.");

  if (!input.isInterchangeableLens) {
    return { brand: brand.name, mount: null };
  }

  if (!input.mountId) throw new Error("Monture inconnue.");
  const mount = database.prepare("SELECT id, name FROM mounts WHERE id = ?").get(input.mountId) as { id: string; name: string } | undefined;
  if (!mount) throw new Error("Monture inconnue.");
  return { brand: brand.name, mount: mount.name };
}

function mapBodyRow(row: Record<string, unknown>) {
  return {
    ...(row as Omit<Body, "isInterchangeableLens" | "hasIbis" | "hasDualCardSlot" | "isWeatherSealed" | "hasArticulatedScreen" | "isFavorite" | "isNextPurchase" | "isOwned" | "retired">),
    isInterchangeableLens: Boolean(row.isInterchangeableLens),
    hasIbis: Boolean(row.hasIbis),
    hasDualCardSlot: Boolean(row.hasDualCardSlot),
    isWeatherSealed: Boolean(row.isWeatherSealed),
    hasArticulatedScreen: Boolean(row.hasArticulatedScreen),
    isFavorite: Boolean(row.isFavorite),
    isNextPurchase: Boolean(row.isNextPurchase),
    isOwned: Boolean(row.isOwned),
    retired: Boolean(row.retired),
  } as Body;
}

export function refreshBodyLabels() {
  const database = getBodyDatabase();
  const bodies = listBodies();
  for (const body of bodies) {
    const normalized = normalizeBodyInput(body, { brand: body.brand, mount: body.mount });
    database.prepare("UPDATE bodies SET name = ?, label = ?, updatedAt = ? WHERE id = ?")
      .run(normalized.name, normalized.label, new Date().toISOString(), body.id);
  }
}

function toBodyDbParams<T extends object>(values: T) {
  const record = values as T & {
    isInterchangeableLens?: boolean;
    hasIbis?: boolean;
    hasDualCardSlot?: boolean;
    isWeatherSealed?: boolean;
    hasArticulatedScreen?: boolean;
    isFavorite?: boolean;
    isNextPurchase?: boolean;
    isOwned?: boolean;
    retired?: boolean;
  };
  return {
    ...record,
    isInterchangeableLens: record.isInterchangeableLens ? 1 : 0,
    hasIbis: record.hasIbis ? 1 : 0,
    hasDualCardSlot: record.hasDualCardSlot ? 1 : 0,
    isWeatherSealed: record.isWeatherSealed ? 1 : 0,
    hasArticulatedScreen: record.hasArticulatedScreen ? 1 : 0,
    isFavorite: record.isFavorite ? 1 : 0,
    isNextPurchase: record.isNextPurchase ? 1 : 0,
    isOwned: record.isOwned ? 1 : 0,
    retired: record.retired ? 1 : 0,
  };
}
