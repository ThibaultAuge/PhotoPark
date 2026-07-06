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
} as const;

export const LEGACY_ACCESSORY_TYPE_IDS = {
  magneticRing: "a-type-magnetic-ring",
} as const;

export const BUILT_IN_ACCESSORY_TYPES = [
  { id: ACCESSORY_TYPE_IDS.backpack, name: "Sac à dos", category: "bag" },
  { id: ACCESSORY_TYPE_IDS.shoulder, name: "Bandoulière", category: "bag" },
  { id: ACCESSORY_TYPE_IDS.pouch, name: "Poche", category: "bag" },
  { id: ACCESSORY_TYPE_IDS.belt, name: "Ceinture", category: "bag" },
  { id: ACCESSORY_TYPE_IDS.filter, name: "Filtre", category: "filter" },
  { id: ACCESSORY_TYPE_IDS.stepRing, name: "Bague de conversion", category: "filter" },
  { id: ACCESSORY_TYPE_IDS.magneticStepRing, name: "Bague de réduction magnétique", category: "filter" },
  { id: ACCESSORY_TYPE_IDS.magneticBaseRing, name: "Bague magnétique", category: "filter" },
  { id: ACCESSORY_TYPE_IDS.hoodAdapter, name: "Adaptateur / pare-soleil magnétique", category: "filter" },
] as const;

export function getDerivedFilterAccessoryTypeId(typeName: string | null) {
  if (typeName === "Filtre") return ACCESSORY_TYPE_IDS.filter;
  if (typeName === "Bague de conversion") return ACCESSORY_TYPE_IDS.stepRing;
  if (typeName === "Bague de réduction magnétique") return ACCESSORY_TYPE_IDS.magneticStepRing;
  if (typeName === "Bague magnétique") return ACCESSORY_TYPE_IDS.magneticBaseRing;
  if (typeName === "Adaptateur / pare-soleil magnétique") return ACCESSORY_TYPE_IDS.hoodAdapter;
  return null;
}
