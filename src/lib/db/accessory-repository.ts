import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Accessory, AccessoryInput, AccessoryReferenceData, AccessoryType } from "@/lib/accessory/types";
import { deriveFilterAccessoryPresentation, normalizeAccessoryInput } from "@/lib/accessory/accessory-utils";
import { getDatabase, listBrandsByDomain, listLenses } from "@/lib/db/lens-repository";

let accessorySchemaReady = false;

function getAccessoryDatabase() {
  const database = getDatabase();
  if (!accessorySchemaReady) {
    initializeAccessorySchema(database);
    ensureAccessorySchemaColumns(database);
    ensureAccessorySchemaIndexes(database);
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
      category TEXT NOT NULL DEFAULT 'bag' CHECK(category IN ('bag', 'filter')),
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
      storageLocation TEXT NOT NULL DEFAULT 'bag' CHECK(storageLocation IN ('bag', 'reserve')),
      mountedOnLensId TEXT REFERENCES lenses(id) ON UPDATE CASCADE ON DELETE SET NULL,
      mountedOnAccessoryId TEXT REFERENCES accessories(id) ON UPDATE CASCADE ON DELETE SET NULL,
      rearMountType TEXT NOT NULL DEFAULT 'none' CHECK(rearMountType IN ('none', 'threaded', 'magnetic')),
      rearDiameterMm REAL,
      frontMountType TEXT NOT NULL DEFAULT 'none' CHECK(frontMountType IN ('none', 'threaded', 'magnetic')),
      frontDiameterMm REAL,
      filterRole TEXT NOT NULL DEFAULT 'general' CHECK(filterRole IN ('general', 'filter', 'adapter', 'hood')),
      filterStrength TEXT,
      supportsMagneticHood INTEGER NOT NULL DEFAULT 0,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      isNextPurchase INTEGER NOT NULL DEFAULT 0,
      isOwned INTEGER NOT NULL DEFAULT 0,
      retired INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

function ensureAccessorySchemaColumns(database: Database.Database) {
  const typeColumns = new Set((database.prepare("PRAGMA table_info(accessory_types)").all() as Array<{ name: string }>).map((column) => column.name));
  if (!typeColumns.has("category")) database.exec("ALTER TABLE accessory_types ADD COLUMN category TEXT NOT NULL DEFAULT 'bag'");

  const accessoryColumns = new Set((database.prepare("PRAGMA table_info(accessories)").all() as Array<{ name: string }>).map((column) => column.name));
  const missingColumns = [
    ["storageLocation", "TEXT NOT NULL DEFAULT 'bag'"],
    ["mountedOnLensId", "TEXT"],
    ["mountedOnAccessoryId", "TEXT"],
    ["rearMountType", "TEXT NOT NULL DEFAULT 'none'"],
    ["rearDiameterMm", "REAL"],
    ["frontMountType", "TEXT NOT NULL DEFAULT 'none'"],
    ["frontDiameterMm", "REAL"],
    ["filterRole", "TEXT NOT NULL DEFAULT 'general'"],
    ["filterStrength", "TEXT"],
    ["supportsMagneticHood", "INTEGER NOT NULL DEFAULT 0"],
  ] as const;
  for (const [name, definition] of missingColumns) {
    if (!accessoryColumns.has(name)) database.exec(`ALTER TABLE accessories ADD COLUMN ${name} ${definition}`);
  }
}

function ensureAccessorySchemaIndexes(database: Database.Database) {
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_accessories_brand ON accessories(brandId);
    CREATE INDEX IF NOT EXISTS idx_accessories_type ON accessories(typeId);
    CREATE INDEX IF NOT EXISTS idx_accessories_status ON accessories(isFavorite, isNextPurchase, isOwned, retired);
    CREATE INDEX IF NOT EXISTS idx_accessories_lens_mount ON accessories(mountedOnLensId);
    CREATE INDEX IF NOT EXISTS idx_accessories_accessory_mount ON accessories(mountedOnAccessoryId);
  `);
}

function seedAccessoryReferenceData(database: Database.Database) {
  const now = new Date().toISOString();
  const insert = database.prepare("INSERT OR IGNORE INTO accessory_types (id, name, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)");
  insert.run("a-type-backpack", "Sac à dos", "bag", now, now);
  insert.run("a-type-shoulder", "Bandoulière", "bag", now, now);
  insert.run("a-type-pouch", "Poche", "bag", now, now);
  insert.run("a-type-belt", "Ceinture", "bag", now, now);
  insert.run("a-type-filter", "Filtre", "filter", now, now);
  insert.run("a-type-step-ring", "Bague de conversion", "filter", now, now);
  insert.run("a-type-magnetic-step-ring", "Bague de réduction magnétique", "filter", now, now);
  insert.run("a-type-magnetic-base-ring", "Bague magnétique", "filter", now, now);
  insert.run("a-type-magnetic-ring", "Bague vissée → magnétique", "filter", now, now);
  insert.run("a-type-hood-adapter", "Adaptateur / pare-soleil magnétique", "filter", now, now);
}

export function listAccessoryReferenceData(): AccessoryReferenceData {
  const database = getAccessoryDatabase();
  return {
    brands: listBrandsByDomain("accessories"),
    types: database.prepare("SELECT id, name, category FROM accessory_types ORDER BY category, name COLLATE NOCASE").all() as AccessoryType[],
    lenses: listLenses().map((lens) => ({ id: lens.id, label: lens.label, filterDiameterMm: lens.filterDiameterMm, isOwned: lens.isOwned, isFavorite: lens.isFavorite, isNextPurchase: lens.isNextPurchase, retired: lens.retired })),
  };
}

export function listAccessories(): Accessory[] {
  const database = getAccessoryDatabase();
  const rows = database.prepare(`SELECT accessories.*, brands.name AS brand, accessory_types.name AS type, accessory_types.category AS typeCategory
    FROM accessories
    JOIN brands ON brands.id = accessories.brandId
    JOIN accessory_types ON accessory_types.id = accessories.typeId
    ORDER BY brands.name COLLATE NOCASE, accessories.name COLLATE NOCASE`).all() as Record<string, unknown>[];
  return rows.map(mapAccessoryRow);
}

export function createAccessory(input: AccessoryInput) {
  const database = getAccessoryDatabase();
  const persistedInput = deriveAccessoryPersistenceInput(database, input);
  const refs = resolveAccessoryRefs(database, persistedInput);
  const normalized = normalizeAccessoryInput(persistedInput, refs);
  assertAccessoryMountConsistency(database, null, normalized, refs.typeCategory);
  const now = new Date().toISOString();
  const accessory: Accessory = { id: randomUUID(), ...normalized, typeCategory: refs.typeCategory, createdAt: now, updatedAt: now };
  database.prepare(`INSERT INTO accessories (
    id, brandId, typeId, name, label, capacityLiters, capacityBodies, capacityLenses, fitsLaptop, fitsTripod,
    widthMm, heightMm, depthMm, weightG, priceEur, carryStyleNotes, capacityNotes,
    storageLocation, mountedOnLensId, mountedOnAccessoryId, rearMountType, rearDiameterMm,
    frontMountType, frontDiameterMm, filterRole, filterStrength, supportsMagneticHood,
    isFavorite, isNextPurchase, isOwned, retired, createdAt, updatedAt
  ) VALUES (
    @id, @brandId, @typeId, @name, @label, @capacityLiters, @capacityBodies, @capacityLenses, @fitsLaptop, @fitsTripod,
    @widthMm, @heightMm, @depthMm, @weightG, @priceEur, @carryStyleNotes, @capacityNotes,
    @storageLocation, @mountedOnLensId, @mountedOnAccessoryId, @rearMountType, @rearDiameterMm,
    @frontMountType, @frontDiameterMm, @filterRole, @filterStrength, @supportsMagneticHood,
    @isFavorite, @isNextPurchase, @isOwned, @retired, @createdAt, @updatedAt
  )`).run(toAccessoryDbParams(accessory));
  return accessory;
}

export function updateAccessory(id: string, input: AccessoryInput) {
  const database = getAccessoryDatabase();
  const persistedInput = deriveAccessoryPersistenceInput(database, input);
  const refs = resolveAccessoryRefs(database, persistedInput);
  const normalized = normalizeAccessoryInput(persistedInput, refs);
  assertAccessoryMountConsistency(database, id, normalized, refs.typeCategory);
  database.prepare(`UPDATE accessories SET
    brandId=@brandId, typeId=@typeId, name=@name, label=@label, capacityLiters=@capacityLiters,
    capacityBodies=@capacityBodies, capacityLenses=@capacityLenses, fitsLaptop=@fitsLaptop, fitsTripod=@fitsTripod,
    widthMm=@widthMm, heightMm=@heightMm, depthMm=@depthMm, weightG=@weightG, priceEur=@priceEur,
    carryStyleNotes=@carryStyleNotes, capacityNotes=@capacityNotes, storageLocation=@storageLocation,
    mountedOnLensId=@mountedOnLensId, mountedOnAccessoryId=@mountedOnAccessoryId, rearMountType=@rearMountType,
    rearDiameterMm=@rearDiameterMm, frontMountType=@frontMountType,
    frontDiameterMm=@frontDiameterMm, filterRole=@filterRole,
    filterStrength=@filterStrength, supportsMagneticHood=@supportsMagneticHood, isFavorite=@isFavorite,
    isNextPurchase=@isNextPurchase, isOwned=@isOwned, retired=@retired, updatedAt=@updatedAt
    WHERE id=@id`).run(toAccessoryDbParams({ id, ...normalized, updatedAt: new Date().toISOString() }));
}

export function deleteAccessory(id: string) {
  const database = getAccessoryDatabase();
  const hasChildren = database.prepare("SELECT 1 FROM accessories WHERE mountedOnAccessoryId = ? LIMIT 1").get(id);
  if (hasChildren) throw new Error("Impossible de supprimer une pièce qui supporte déjà un autre élément monté.");
  getAccessoryDatabase().prepare("DELETE FROM accessories WHERE id = ?").run(id);
}

export function createAccessoryType(name: string, category: AccessoryType["category"]) {
  const now = new Date().toISOString();
  getAccessoryDatabase().prepare("INSERT INTO accessory_types (id, name, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), name.trim(), category, now, now);
}

export function updateAccessoryType(id: string, name: string, category: AccessoryType["category"]) {
  const database = getAccessoryDatabase();
  const existing = database.prepare("SELECT category FROM accessory_types WHERE id = ?").get(id) as { category: AccessoryType["category"] } | undefined;
  if (!existing) throw new Error("Type d'accessoire inconnu.");
  if (existing.category !== category) {
    const inUse = database.prepare("SELECT 1 FROM accessories WHERE typeId = ? LIMIT 1").get(id);
    if (inUse) throw new Error("Impossible de changer la catégorie d'un type déjà utilisé par des accessoires.");
  }
  database.prepare("UPDATE accessory_types SET name = ?, category = ?, updatedAt = ? WHERE id = ?").run(name.trim(), category, new Date().toISOString(), id);
  refreshAccessoryLabels();
}

export function deleteAccessoryType(id: string) {
  getAccessoryDatabase().prepare("DELETE FROM accessory_types WHERE id = ?").run(id);
}

function resolveAccessoryRefs(database: Database.Database, input: AccessoryInput) {
  const brand = database.prepare("SELECT id, name FROM brands WHERE id = ?").get(input.brandId) as { id: string; name: string } | undefined;
  const type = database.prepare("SELECT id, name, category FROM accessory_types WHERE id = ?").get(input.typeId) as AccessoryType | undefined;
  if (!brand || !type) throw new Error("Marque ou type d'accessoire inconnu.");
  const brandInAccessoryDomain = database.prepare("SELECT 1 FROM brand_domains WHERE brandId = ? AND domain = 'accessories'").get(input.brandId);
  if (!brandInAccessoryDomain) throw new Error("Cette marque n'est pas disponible pour les accessoires.");
  return { brand: brand.name, type: type.name, typeCategory: type.category };
}

function deriveAccessoryPersistenceInput(database: Database.Database, input: AccessoryInput): AccessoryInput {
  if (input.filterRole === "filter") {
    input = {
      ...input,
      frontMountType: input.rearMountType,
      frontDiameterMm: input.rearDiameterMm,
    };
  }

  if (input.filterRole === "general") {
    return input;
  }

  const derived = deriveFilterAccessoryPresentation({
    filterRole: input.filterRole,
    rearMountType: input.rearMountType,
    rearDiameterMm: input.rearDiameterMm,
    frontMountType: input.frontMountType,
    frontDiameterMm: input.frontDiameterMm,
    supportsMagneticHood: input.supportsMagneticHood,
    filterStrength: input.filterStrength,
  });

  if (!derived.valid || !derived.typeName) {
    throw new Error(derived.reason ?? "Type de filtre/bague impossible à déduire.");
  }

  const derivedType = database.prepare("SELECT id FROM accessory_types WHERE category = 'filter' AND name = ?").get(derived.typeName) as { id: string } | undefined;
  if (!derivedType) {
    throw new Error(`Type de filtre/bague introuvable: ${derived.typeName}.`);
  }

  return {
    ...input,
    typeId: derivedType.id,
    name: derived.name,
  };
}

function assertAccessoryMountConsistency(database: Database.Database, currentId: string | null, input: AccessoryInput, typeCategory: AccessoryType["category"]) {
  if (typeCategory !== "filter") {
    if (input.mountedOnLensId || input.mountedOnAccessoryId) throw new Error("Seules les pièces de filtres/bagues peuvent être montées sur un objectif ou une autre pièce.");
    return;
  }
  if (input.mountedOnLensId && input.mountedOnAccessoryId) throw new Error("Une pièce ne peut être montée qu'à un seul endroit.");
  if (!input.isOwned && (input.mountedOnLensId || input.mountedOnAccessoryId)) throw new Error("Une pièce non possédée ne peut pas être marquée comme montée.");
  if (input.retired && (input.mountedOnLensId || input.mountedOnAccessoryId)) throw new Error("Une pièce retirée ne peut pas rester montée.");
  if (currentId && input.mountedOnAccessoryId === currentId) throw new Error("Une pièce ne peut pas être montée sur elle-même.");

  if (input.mountedOnLensId) {
    const lens = database.prepare("SELECT id, filterDiameterMm FROM lenses WHERE id = ?").get(input.mountedOnLensId) as { id: string; filterDiameterMm: number | null } | undefined;
    if (!lens) throw new Error("Objectif inconnu pour le montage.");
    if (lens.filterDiameterMm === null) throw new Error("Cet objectif n'a pas de diamètre de filtre renseigné.");
    assertMountMatchesLens(lens.filterDiameterMm, input);
    const existing = database.prepare("SELECT id FROM accessories WHERE mountedOnLensId = ? AND id != ? LIMIT 1").get(input.mountedOnLensId, currentId ?? "") as { id: string } | undefined;
    if (existing) throw new Error("Cet objectif a déjà une pièce montée directement dessus.");
  }

  if (input.mountedOnAccessoryId) {
    const parent = database.prepare("SELECT id, typeId, mountedOnLensId, mountedOnAccessoryId, frontMountType, frontDiameterMm, typeId FROM accessories WHERE id = ?").get(input.mountedOnAccessoryId) as (Pick<Accessory, "id" | "mountedOnLensId" | "mountedOnAccessoryId" | "frontMountType" | "frontDiameterMm" | "typeId">) | undefined;
    if (!parent) throw new Error("Pièce parente inconnue pour le montage.");
    const parentType = database.prepare("SELECT category FROM accessory_types WHERE id = ?").get(parent.typeId) as { category: AccessoryType["category"] } | undefined;
    if (parentType?.category !== "filter") throw new Error("La pièce parente doit appartenir à la sous-catégorie filtres/bagues.");
    assertMountMatchesAccessory(parent, input);
    const existingChild = database.prepare("SELECT id FROM accessories WHERE mountedOnAccessoryId = ? AND id != ? LIMIT 1").get(input.mountedOnAccessoryId, currentId ?? "") as { id: string } | undefined;
    if (existingChild) throw new Error("Cette pièce a déjà un élément monté devant elle.");
    if (!parent.mountedOnLensId && !parent.mountedOnAccessoryId) throw new Error("La pièce parente doit déjà faire partie d'un montage sur objectif.");
    if (currentId && hasAccessoryCycle(database, currentId, input.mountedOnAccessoryId)) throw new Error("Le montage crée une boucle invalide.");
  }
}

function hasAccessoryCycle(database: Database.Database, currentId: string, parentId: string) {
  let cursor: string | null = parentId;
  while (cursor) {
    if (cursor === currentId) return true;
    const next = database.prepare("SELECT mountedOnAccessoryId FROM accessories WHERE id = ?").get(cursor) as { mountedOnAccessoryId: string | null } | undefined;
    cursor = next?.mountedOnAccessoryId ?? null;
  }
  return false;
}

function assertMountMatchesLens(lensDiameter: number, input: Pick<AccessoryInput, "rearMountType" | "rearDiameterMm">) {
  if (input.rearMountType !== "threaded") throw new Error("La première pièce montée sur un objectif doit être filetée.");
  if (input.rearDiameterMm !== lensDiameter) throw new Error("Le diamètre arrière de la pièce ne correspond pas au diamètre de l'objectif.");
}

function assertMountMatchesAccessory(parent: Pick<Accessory, "frontMountType" | "frontDiameterMm">, input: Pick<AccessoryInput, "rearMountType" | "rearDiameterMm">) {
  if (parent.frontMountType === "none") throw new Error("La pièce parente n'accepte aucun élément supplémentaire.");
  if (parent.frontMountType !== input.rearMountType) throw new Error("Le type de liaison de la pièce ne correspond pas à la sortie de la pièce parente.");
  if (parent.frontDiameterMm !== input.rearDiameterMm) throw new Error("Le diamètre ne correspond pas à la pièce parente.");
}

function mapAccessoryRow(row: Record<string, unknown>) {
  return {
    ...(row as Omit<Accessory, "fitsLaptop" | "fitsTripod" | "supportsMagneticHood" | "isFavorite" | "isNextPurchase" | "isOwned" | "retired">),
    fitsLaptop: Boolean(row.fitsLaptop),
    fitsTripod: Boolean(row.fitsTripod),
    supportsMagneticHood: Boolean(row.supportsMagneticHood),
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
  const record = values as T & { fitsLaptop?: boolean; fitsTripod?: boolean; supportsMagneticHood?: boolean; isFavorite?: boolean; isNextPurchase?: boolean; isOwned?: boolean; retired?: boolean };
  return {
    ...record,
    fitsLaptop: record.fitsLaptop ? 1 : 0,
    fitsTripod: record.fitsTripod ? 1 : 0,
    supportsMagneticHood: record.supportsMagneticHood ? 1 : 0,
    isFavorite: record.isFavorite ? 1 : 0,
    isNextPurchase: record.isNextPurchase ? 1 : 0,
    isOwned: record.isOwned ? 1 : 0,
    retired: record.retired ? 1 : 0,
  };
}
