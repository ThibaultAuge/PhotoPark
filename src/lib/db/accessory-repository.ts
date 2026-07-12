import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { ACCESSORY_TYPE_IDS, BUILT_IN_ACCESSORY_TYPES, LEGACY_ACCESSORY_TYPE_IDS, getDerivedFilterAccessoryTypeId } from "@/lib/accessory/accessory-type-ids";
import type { Accessory, AccessoryInput, AccessoryOtherProfile, AccessoryReferenceData, AccessoryType } from "@/lib/accessory/types";
import { deriveFilterAccessoryPresentation, generateAccessoryLabel, normalizeAccessoryInput } from "@/lib/accessory/accessory-utils";
import { getDatabase, listBrandsByDomain, listLenses } from "@/lib/db/lens-repository";

let accessorySchemaReady = false;

const OTHER_PROFILE_VALUES = ["generic", "battery", "memory_card", "card_reader", "external_storage", "remote_trigger", "cleaning", "color_tool", "lighting", "drone_part", "cable_adapter", "power"] as const;

function getAccessoryDatabase() {
  const database = getDatabase();
  if (!accessorySchemaReady) {
    initializeAccessorySchema(database);
    ensureAccessorySchemaColumns(database);
    reconcileBuiltInAccessoryTypeIds(database);
    ensureAccessorySchemaIndexes(database);
    seedAccessoryReferenceData(database);
    migrateLegacyMagneticRingType(database);
    accessorySchemaReady = true;
  }
  return database;
}

function initializeAccessorySchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS accessory_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      category TEXT NOT NULL DEFAULT 'bag' CHECK(category IN ('bag', 'filter', 'other')),
      profile TEXT,
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
      specCapacity TEXT,
      specFormat TEXT,
      specConnection TEXT,
      specCompatibility TEXT,
      specPower TEXT,
      specColorModes TEXT,
      specVariant TEXT,
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
  const typeTableSql = (database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'accessory_types'").get() as { sql?: string } | undefined)?.sql ?? "";
  if (typeTableSql && !typeTableSql.includes("'other'")) {
    database.exec(`
      ALTER TABLE accessory_types RENAME TO accessory_types_legacy;
      CREATE TABLE accessory_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        category TEXT NOT NULL DEFAULT 'bag' CHECK(category IN ('bag', 'filter', 'other')),
        profile TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      INSERT INTO accessory_types (id, name, category, profile, createdAt, updatedAt)
      SELECT id, name, category, NULL, createdAt, updatedAt FROM accessory_types_legacy;
      DROP TABLE accessory_types_legacy;
    `);
  }

  const typeColumns = new Set((database.prepare("PRAGMA table_info(accessory_types)").all() as Array<{ name: string }>).map((column) => column.name));
  if (!typeColumns.has("category")) database.exec("ALTER TABLE accessory_types ADD COLUMN category TEXT NOT NULL DEFAULT 'bag'");
  if (!typeColumns.has("profile")) database.exec("ALTER TABLE accessory_types ADD COLUMN profile TEXT");

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
    ["specCapacity", "TEXT"],
    ["specFormat", "TEXT"],
    ["specConnection", "TEXT"],
    ["specCompatibility", "TEXT"],
    ["specPower", "TEXT"],
    ["specColorModes", "TEXT"],
    ["specVariant", "TEXT"],
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
  const insert = database.prepare("INSERT OR IGNORE INTO accessory_types (id, name, category, profile, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
  for (const type of BUILT_IN_ACCESSORY_TYPES) {
    insert.run(type.id, type.name, type.category, type.profile, now, now);
  }
}

function reconcileBuiltInAccessoryTypeIds(database: Database.Database) {
  const selectById = database.prepare("SELECT id, category, profile FROM accessory_types WHERE id = ?");
  const selectByName = database.prepare("SELECT id FROM accessory_types WHERE name = ? AND category = ?");
  const updateCategory = database.prepare("UPDATE accessory_types SET category = ?, updatedAt = ? WHERE id = ?");
  const updateProfile = database.prepare("UPDATE accessory_types SET profile = ?, updatedAt = ? WHERE id = ?");
  const updateId = database.prepare("UPDATE accessory_types SET id = ? WHERE id = ?");
  const insert = database.prepare("INSERT INTO accessory_types (id, name, category, profile, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
  const now = new Date().toISOString();

  const reconcile = database.transaction(() => {
    for (const type of BUILT_IN_ACCESSORY_TYPES) {
      const existingById = selectById.get(type.id) as { id: string; category: AccessoryType["category"]; profile: AccessoryOtherProfile | null } | undefined;
      if (existingById) {
        if (existingById.category !== type.category) updateCategory.run(type.category, now, type.id);
        if ((existingById.profile ?? null) !== (type.profile ?? null)) updateProfile.run(type.profile ?? null, now, type.id);
        continue;
      }

      const existingByName = selectByName.get(type.name, type.category) as { id: string } | undefined;
      if (existingByName) {
        updateId.run(type.id, existingByName.id);
        continue;
      }

      insert.run(type.id, type.name, type.category, type.profile ?? null, now, now);
    }
  });

  reconcile();
}

function migrateLegacyMagneticRingType(database: Database.Database) {
  const legacyType = database.prepare("SELECT id FROM accessory_types WHERE id = ?").get(LEGACY_ACCESSORY_TYPE_IDS.magneticRing) as { id: string } | undefined;
  if (!legacyType) return;

  const magneticType = database.prepare("SELECT id FROM accessory_types WHERE id = ? AND category = 'filter'").get(ACCESSORY_TYPE_IDS.magneticBaseRing) as { id: string } | undefined;
  const magneticStepType = database.prepare("SELECT id FROM accessory_types WHERE id = ? AND category = 'filter'").get(ACCESSORY_TYPE_IDS.magneticStepRing) as { id: string } | undefined;
  if (!magneticType || !magneticStepType) return;

  const legacyAccessories = database.prepare(`SELECT accessories.id, brands.name AS brand, rearMountType, rearDiameterMm, frontMountType, frontDiameterMm, supportsMagneticHood
    FROM accessories
    JOIN brands ON brands.id = accessories.brandId
    WHERE typeId = ?`).all(legacyType.id) as Array<Pick<Accessory, "id" | "brand" | "rearMountType" | "rearDiameterMm" | "frontMountType" | "frontDiameterMm" | "supportsMagneticHood">>;

  const updateType = database.prepare("UPDATE accessories SET typeId = ?, name = ?, label = ?, updatedAt = ? WHERE id = ?");
  const deleteType = database.prepare("DELETE FROM accessory_types WHERE id = ?");
  const now = new Date().toISOString();

  const migrate = database.transaction(() => {
    for (const accessory of legacyAccessories) {
      const derived = deriveFilterAccessoryPresentation({
        filterRole: "adapter",
        rearMountType: accessory.rearMountType,
        rearDiameterMm: accessory.rearDiameterMm,
        frontMountType: accessory.frontMountType,
        frontDiameterMm: accessory.frontDiameterMm,
        supportsMagneticHood: Boolean(accessory.supportsMagneticHood),
        filterStrength: null,
      });
      if (!derived.valid || (derived.typeName !== "Bague magnétique" && derived.typeName !== "Bague de réduction magnétique")) {
        throw new Error(`Legacy accessory type migration failed for ${accessory.id}: unsupported geometry for \"Bague vissée → magnétique\".`);
      }

      const canonicalTypeName = derived.typeName;
      const canonicalName = derived.name;
      const targetTypeId = canonicalTypeName === "Bague de réduction magnétique" ? magneticStepType.id : magneticType.id;

      updateType.run(targetTypeId, canonicalName, generateAccessoryLabel({ brand: accessory.brand, name: canonicalName }), now, accessory.id);
    }

    deleteType.run(legacyType.id);
  });

  migrate();
}

export function listAccessoryReferenceData(): AccessoryReferenceData {
  const database = getAccessoryDatabase();
  return {
    brands: listBrandsByDomain("accessories"),
    types: database.prepare("SELECT id, name, category, profile FROM accessory_types ORDER BY category, name COLLATE NOCASE").all() as AccessoryType[],
    lenses: listLenses().map((lens) => ({ id: lens.id, label: lens.label, filterDiameterMm: lens.filterDiameterMm, isOwned: lens.isOwned, isFavorite: lens.isFavorite, isNextPurchase: lens.isNextPurchase, retired: lens.retired })),
  };
}

export function listAccessories(): Accessory[] {
  const database = getAccessoryDatabase();
  const rows = database.prepare(`SELECT accessories.*, brands.name AS brand, accessory_types.name AS type, accessory_types.category AS typeCategory, accessory_types.profile AS typeProfile
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
  const normalized = normalizeAccessoryInput(sanitizeAccessoryInputByCategory(persistedInput, refs.typeCategory), refs);
  assertAccessoryMountConsistency(database, null, normalized, refs.typeCategory);
  const now = new Date().toISOString();
  const accessory: Accessory = { id: randomUUID(), ...normalized, typeCategory: refs.typeCategory, typeProfile: refs.typeProfile, createdAt: now, updatedAt: now };
  database.prepare(`INSERT INTO accessories (
    id, brandId, typeId, name, label, capacityLiters, capacityBodies, capacityLenses, fitsLaptop, fitsTripod,
    widthMm, heightMm, depthMm, weightG, priceEur, carryStyleNotes, capacityNotes,
    specCapacity, specFormat, specConnection, specCompatibility, specPower, specColorModes, specVariant,
    storageLocation, mountedOnLensId, mountedOnAccessoryId, rearMountType, rearDiameterMm,
    frontMountType, frontDiameterMm, filterRole, filterStrength, supportsMagneticHood,
    isFavorite, isNextPurchase, isOwned, retired, createdAt, updatedAt
  ) VALUES (
    @id, @brandId, @typeId, @name, @label, @capacityLiters, @capacityBodies, @capacityLenses, @fitsLaptop, @fitsTripod,
    @widthMm, @heightMm, @depthMm, @weightG, @priceEur, @carryStyleNotes, @capacityNotes,
    @specCapacity, @specFormat, @specConnection, @specCompatibility, @specPower, @specColorModes, @specVariant,
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
  const normalized = normalizeAccessoryInput(sanitizeAccessoryInputByCategory(persistedInput, refs.typeCategory), refs);
  assertAccessoryMountConsistency(database, id, normalized, refs.typeCategory);
  database.prepare(`UPDATE accessories SET
    brandId=@brandId, typeId=@typeId, name=@name, label=@label, capacityLiters=@capacityLiters,
    capacityBodies=@capacityBodies, capacityLenses=@capacityLenses, fitsLaptop=@fitsLaptop, fitsTripod=@fitsTripod,
    widthMm=@widthMm, heightMm=@heightMm, depthMm=@depthMm, weightG=@weightG, priceEur=@priceEur,
    carryStyleNotes=@carryStyleNotes, capacityNotes=@capacityNotes,
    specCapacity=@specCapacity, specFormat=@specFormat, specConnection=@specConnection,
    specCompatibility=@specCompatibility, specPower=@specPower, specColorModes=@specColorModes, specVariant=@specVariant,
    storageLocation=@storageLocation,
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

/**
 * Mount an accessory directly on a lens.
 * Validates consistency and updates mountedOnLensId.
 * Wrapped in a transaction for atomicity.
 */
export function mountAccessoryOnLens(accessoryId: string, lensId: string) {
  const database = getAccessoryDatabase();
  database.transaction(() => {
    const accessory = database.prepare("SELECT * FROM accessories WHERE id = ?").get(accessoryId) as Record<string, unknown> | undefined;
    if (!accessory) throw new Error("Accessoire inconnu.");
    const mapped = mapAccessoryRow(accessory);
    const refs = resolveAccessoryRefs(database, mapped as AccessoryInput);
    const input: AccessoryInput = { ...mapped, mountedOnLensId: lensId, mountedOnAccessoryId: null };
    assertAccessoryMountConsistency(database, accessoryId, input, refs.typeCategory);
    // If the accessory had descendants from a previous mount location, unmount them first
    unmountDescendants(database, accessoryId);
    database.prepare("UPDATE accessories SET mountedOnLensId = ?, mountedOnAccessoryId = NULL, updatedAt = ? WHERE id = ?")
      .run(lensId, new Date().toISOString(), accessoryId);
  })();
}

/**
 * Mount an accessory on top of another accessory (parent).
 * The parent must already be part of a lens-mounted chain.
 */
export function mountAccessoryOnAccessory(accessoryId: string, parentAccessoryId: string) {
  if (accessoryId === parentAccessoryId) throw new Error("Impossible de monter une pièce sur elle-même.");
  const database = getAccessoryDatabase();
  database.transaction(() => {
    const accessory = database.prepare("SELECT * FROM accessories WHERE id = ?").get(accessoryId) as Record<string, unknown> | undefined;
    if (!accessory) throw new Error("Accessoire inconnu.");
    const mapped = mapAccessoryRow(accessory);
    const refs = resolveAccessoryRefs(database, mapped as AccessoryInput);
    const input: AccessoryInput = { ...mapped, mountedOnLensId: null, mountedOnAccessoryId: parentAccessoryId };
    assertAccessoryMountConsistency(database, accessoryId, input, refs.typeCategory);
    // If the accessory had descendants from a previous mount location, unmount them first
    unmountDescendants(database, accessoryId);
    database.prepare("UPDATE accessories SET mountedOnAccessoryId = ?, mountedOnLensId = NULL, updatedAt = ? WHERE id = ?")
      .run(parentAccessoryId, new Date().toISOString(), accessoryId);
  })();
}

/** Unmount descendants (items mounted on the given accessory) without affecting the accessory itself. */
function unmountDescendants(database: Database.Database, parentId: string) {
  const ids = collectDescendantIds(database, parentId);
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  const stmt = database.prepare("UPDATE accessories SET mountedOnLensId = NULL, mountedOnAccessoryId = NULL, updatedAt = ? WHERE id = ?");
  database.transaction(() => {
    for (const id of ids) {
      stmt.run(now, id);
    }
  })();
}

/**
 * Unmount an accessory and all accessories mounted after it (cascade).
 * Walks the mountedOnAccessoryId chain and clears mount fields on all descendants.
 * Wrapped in a transaction for atomicity.
 */
export function unmountAccessoryAndDescendants(accessoryId: string) {
  const database = getAccessoryDatabase();
  const idsToUnmount = collectDescendantIds(database, accessoryId);
  // Also unmount the requested item itself
  idsToUnmount.push(accessoryId);
  const now = new Date().toISOString();
  const stmt = database.prepare("UPDATE accessories SET mountedOnLensId = NULL, mountedOnAccessoryId = NULL, updatedAt = ? WHERE id = ?");
  database.transaction(() => {
    for (const id of idsToUnmount) {
      stmt.run(now, id);
    }
  })();
}

/** Recursively collects all accessory IDs that are mounted (directly or indirectly) on the given accessory. */
function collectDescendantIds(database: Database.Database, parentId: string): string[] {
  const ids: string[] = [];
  const visited = new Set<string>();
  const MAX_DESCENDANT_DEPTH = 20;
  function walk(id: string, depth: number) {
    if (depth > MAX_DESCENDANT_DEPTH || visited.has(id)) return;
    visited.add(id);
    const children = database.prepare("SELECT id FROM accessories WHERE mountedOnAccessoryId = ?").all(id) as { id: string }[];
    for (const child of children) {
      ids.push(child.id);
      walk(child.id, depth + 1);
    }
  }
  walk(parentId, 0);
  return ids;
}

export function createAccessoryType(name: string, category: AccessoryType["category"], profile: AccessoryOtherProfile | null) {
  const now = new Date().toISOString();
  getAccessoryDatabase().prepare("INSERT INTO accessory_types (id, name, category, profile, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), name.trim(), category, normalizeAccessoryTypeProfile(category, profile), now, now);
}

export function updateAccessoryType(id: string, name: string, category: AccessoryType["category"], profile: AccessoryOtherProfile | null) {
  const database = getAccessoryDatabase();
  const existing = database.prepare("SELECT category, profile FROM accessory_types WHERE id = ?").get(id) as { category: AccessoryType["category"]; profile: AccessoryOtherProfile | null } | undefined;
  if (!existing) throw new Error("Type d'accessoire inconnu.");
  const builtInType = BUILT_IN_ACCESSORY_TYPES.find((type) => type.id === id);
  if (builtInType && category !== builtInType.category) throw new Error("Impossible de changer la catégorie d'un type système requis.");
  const normalizedProfile = normalizeAccessoryTypeProfile(category, profile);
  if (builtInType && normalizedProfile !== (builtInType.profile ?? null)) {
    throw new Error("Impossible de changer le profil d'un type système requis.");
  }
  if (existing.category !== category || (existing.profile ?? null) !== normalizedProfile) {
    const inUse = database.prepare("SELECT 1 FROM accessories WHERE typeId = ? LIMIT 1").get(id);
    if (inUse) throw new Error("Impossible de changer la catégorie ou le profil d'un type déjà utilisé par des accessoires.");
  }
  database.prepare("UPDATE accessory_types SET name = ?, category = ?, profile = ?, updatedAt = ? WHERE id = ?").run(name.trim(), category, normalizedProfile, new Date().toISOString(), id);
}

export function deleteAccessoryType(id: string) {
  if (BUILT_IN_ACCESSORY_TYPES.some((type) => type.id === id)) throw new Error("Impossible de supprimer un type système requis.");
  getAccessoryDatabase().prepare("DELETE FROM accessory_types WHERE id = ?").run(id);
}

function resolveAccessoryRefs(database: Database.Database, input: AccessoryInput) {
  const brand = database.prepare("SELECT id, name FROM brands WHERE id = ?").get(input.brandId) as { id: string; name: string } | undefined;
  const type = database.prepare("SELECT id, name, category, profile FROM accessory_types WHERE id = ?").get(input.typeId) as AccessoryType | undefined;
  if (!brand || !type) throw new Error("Marque ou type d'accessoire inconnu.");
  const brandInAccessoryDomain = database.prepare("SELECT 1 FROM brand_domains WHERE brandId = ? AND domain = 'accessories'").get(input.brandId);
  if (!brandInAccessoryDomain) throw new Error("Cette marque n'est pas disponible pour les accessoires.");
  return { brand: brand.name, type: type.name, typeCategory: type.category, typeProfile: type.profile ?? null };
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

  const derivedTypeId = getDerivedFilterAccessoryTypeId(derived.typeName);
  const derivedType = derivedTypeId
    ? database.prepare("SELECT id FROM accessory_types WHERE id = ? AND category = 'filter'").get(derivedTypeId) as { id: string } | undefined
    : undefined;
  if (!derivedType) {
    throw new Error(`Type de filtre/bague introuvable: ${derived.typeName}.`);
  }

  return {
    ...input,
    typeId: derivedType.id,
    name: derived.name,
  };
}

function sanitizeAccessoryInputByCategory(input: AccessoryInput, typeCategory: AccessoryType["category"]): AccessoryInput {
  input = {
    ...input,
    specCapacity: input.specCapacity ?? null,
    specFormat: input.specFormat ?? null,
    specConnection: input.specConnection ?? null,
    specCompatibility: input.specCompatibility ?? null,
    specPower: input.specPower ?? null,
    specColorModes: input.specColorModes ?? null,
    specVariant: input.specVariant ?? null,
  };

  if (typeCategory === "filter") {
    return {
      ...input,
      capacityLiters: null,
      capacityBodies: null,
      capacityLenses: null,
      fitsLaptop: false,
      fitsTripod: false,
      widthMm: null,
      heightMm: null,
      depthMm: null,
      carryStyleNotes: null,
      specCapacity: null,
      specFormat: null,
      specConnection: null,
      specCompatibility: null,
      specPower: null,
      specColorModes: null,
      specVariant: null,
    };
  }

  if (typeCategory === "other") {
    return {
      ...input,
      capacityLiters: null,
      capacityBodies: null,
      capacityLenses: null,
      fitsLaptop: false,
      fitsTripod: false,
      widthMm: null,
      heightMm: null,
      depthMm: null,
      carryStyleNotes: null,
      storageLocation: "bag",
      mountedOnLensId: null,
      mountedOnAccessoryId: null,
      rearMountType: "none",
      rearDiameterMm: null,
      frontMountType: "none",
      frontDiameterMm: null,
      filterRole: "general",
      filterStrength: null,
      supportsMagneticHood: false,
    };
  }

  return {
    ...input,
    specCapacity: null,
    specFormat: null,
    specConnection: null,
    specCompatibility: null,
    specPower: null,
    specColorModes: null,
    specVariant: null,
  };
}

function assertAccessoryMountConsistency(database: Database.Database, currentId: string | null, input: AccessoryInput, typeCategory: AccessoryType["category"]) {
  assertMountEndpointMetadata(input.rearMountType, input.rearDiameterMm, "arrière");
  assertMountEndpointMetadata(input.frontMountType, input.frontDiameterMm, "avant");

  if (typeCategory !== "filter") {
    if (input.mountedOnLensId || input.mountedOnAccessoryId) throw new Error("Seules les pièces de filtres/bagues peuvent être montées sur un objectif ou une autre pièce.");
    if (input.rearMountType !== "none" || input.frontMountType !== "none" || input.rearDiameterMm !== null || input.frontDiameterMm !== null) {
      throw new Error("Les accessoires hors filtres/bagues ne doivent pas définir d'interface de montage.");
    }
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
  const visited = new Set<string>();
  let cursor: string | null = parentId;
  while (cursor) {
    if (visited.has(cursor)) return true; // cycle in data
    visited.add(cursor);
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

function assertMountEndpointMetadata(type: AccessoryInput["rearMountType"], diameter: number | null, side: "arrière" | "avant") {
  if (type === "none") return;
  if (diameter === null) throw new Error(`Le diamètre ${side} est requis pour une liaison filetée ou magnétique.`);
  if (diameter <= 0) throw new Error(`Le diamètre ${side} doit être supérieur à 0.`);
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

function normalizeAccessoryTypeProfile(category: AccessoryType["category"], profile: AccessoryOtherProfile | null) {
  if (category !== "other") return null;
  if (!profile || !OTHER_PROFILE_VALUES.includes(profile)) throw new Error("Profil d'accessoire invalide pour la catégorie autres accessoires.");
  return profile;
}
