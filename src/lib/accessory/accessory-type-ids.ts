export const ACCESSORY_TYPE_IDS = {
  backpack: "a-type-backpack",
  shoulder: "a-type-shoulder",
  pouch: "a-type-pouch",
  belt: "a-type-belt",
  filter: "a-type-filter",
  stepRing: "a-type-step-ring",
  magneticStepRing: "a-type-magnetic-step-ring",
  magneticBaseRing: "a-type-magnetic-base-ring",
  hoodAdapter: "a-type-hood-adapter",
  genericOther: "a-type-other-generic",
  battery: "a-type-other-battery",
  memoryCard: "a-type-other-memory-card",
  cardReader: "a-type-other-card-reader",
  externalStorage: "a-type-other-external-storage",
  remoteTrigger: "a-type-other-remote-trigger",
  cleaning: "a-type-other-cleaning",
  colorTool: "a-type-other-color-tool",
  lighting: "a-type-other-lighting",
  dronePart: "a-type-other-drone-part",
  cableAdapter: "a-type-other-cable-adapter",
  power: "a-type-other-power",
} as const;

export const LEGACY_ACCESSORY_TYPE_IDS = {
  magneticRing: "a-type-magnetic-ring",
} as const;

export const BUILT_IN_ACCESSORY_TYPES = [
  { id: ACCESSORY_TYPE_IDS.backpack, name: "Sac à dos", category: "bag", profile: null },
  { id: ACCESSORY_TYPE_IDS.shoulder, name: "Bandoulière", category: "bag", profile: null },
  { id: ACCESSORY_TYPE_IDS.pouch, name: "Poche", category: "bag", profile: null },
  { id: ACCESSORY_TYPE_IDS.belt, name: "Ceinture", category: "bag", profile: null },
  { id: ACCESSORY_TYPE_IDS.filter, name: "Filtre", category: "filter", profile: null },
  { id: ACCESSORY_TYPE_IDS.stepRing, name: "Bague de conversion", category: "filter", profile: null },
  { id: ACCESSORY_TYPE_IDS.magneticStepRing, name: "Bague de réduction magnétique", category: "filter", profile: null },
  { id: ACCESSORY_TYPE_IDS.magneticBaseRing, name: "Bague magnétique", category: "filter", profile: null },
  { id: ACCESSORY_TYPE_IDS.hoodAdapter, name: "Adaptateur / pare-soleil magnétique", category: "filter", profile: null },
  { id: ACCESSORY_TYPE_IDS.genericOther, name: "Accessoire générique", category: "other", profile: "generic" },
  { id: ACCESSORY_TYPE_IDS.battery, name: "Batterie", category: "other", profile: "battery" },
  { id: ACCESSORY_TYPE_IDS.memoryCard, name: "Carte mémoire", category: "other", profile: "memory_card" },
  { id: ACCESSORY_TYPE_IDS.cardReader, name: "Lecteur de cartes", category: "other", profile: "card_reader" },
  { id: ACCESSORY_TYPE_IDS.externalStorage, name: "Stockage externe", category: "other", profile: "external_storage" },
  { id: ACCESSORY_TYPE_IDS.remoteTrigger, name: "Télécommande / déclencheur", category: "other", profile: "remote_trigger" },
  { id: ACCESSORY_TYPE_IDS.cleaning, name: "Outil de nettoyage", category: "other", profile: "cleaning" },
  { id: ACCESSORY_TYPE_IDS.colorTool, name: "Outil colorimétrique", category: "other", profile: "color_tool" },
  { id: ACCESSORY_TYPE_IDS.lighting, name: "Lampe / éclairage", category: "other", profile: "lighting" },
  { id: ACCESSORY_TYPE_IDS.dronePart, name: "Pièce drone", category: "other", profile: "drone_part" },
  { id: ACCESSORY_TYPE_IDS.cableAdapter, name: "Câble / adaptateur", category: "other", profile: "cable_adapter" },
  { id: ACCESSORY_TYPE_IDS.power, name: "Chargeur / alimentation", category: "other", profile: "power" },
] as const;

export function getDerivedFilterAccessoryTypeId(typeName: string | null) {
  if (typeName === "Filtre") return ACCESSORY_TYPE_IDS.filter;
  if (typeName === "Bague de conversion") return ACCESSORY_TYPE_IDS.stepRing;
  if (typeName === "Bague de réduction magnétique") return ACCESSORY_TYPE_IDS.magneticStepRing;
  if (typeName === "Bague magnétique") return ACCESSORY_TYPE_IDS.magneticBaseRing;
  if (typeName === "Adaptateur / pare-soleil magnétique") return ACCESSORY_TYPE_IDS.hoodAdapter;
  return null;
}
