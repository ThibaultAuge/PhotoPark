import { getDerivedFilterAccessoryTypeId } from "@/lib/accessory/accessory-type-ids";
import { formatPrice, formatWeight } from "@/lib/lens/lens-utils";
import type { Accessory, AccessoryInput, AccessoryMountType, AccessoryOtherProfile, AccessoryReferenceData } from "@/lib/accessory/types";

type OtherAccessoryFieldKey = "specCapacity" | "specFormat" | "specConnection" | "specCompatibility" | "specPower" | "specColorModes" | "specVariant";

type OtherAccessoryProfileConfig = {
  label: string;
  fields: Array<{ key: OtherAccessoryFieldKey; label: string; placeholder?: string }>;
};

export const OTHER_ACCESSORY_PROFILE_CONFIG: Record<AccessoryOtherProfile, OtherAccessoryProfileConfig> = {
  generic: {
    label: "Générique",
    fields: [],
  },
  battery: {
    label: "Batterie",
    fields: [
      { key: "specCapacity", label: "Capacité", placeholder: "Ex. 2280 mAh / 16 Wh" },
      { key: "specCompatibility", label: "Compatibilité", placeholder: "Ex. Sony A7 IV" },
      { key: "specVariant", label: "Variante", placeholder: "Ex. NP-FZ100" },
    ],
  },
  memory_card: {
    label: "Carte mémoire",
    fields: [
      { key: "specFormat", label: "Format", placeholder: "Ex. SDXC, CFexpress Type B" },
      { key: "specCapacity", label: "Capacité", placeholder: "Ex. 128 Go" },
      { key: "specVariant", label: "Vitesse / classe", placeholder: "Ex. V90, 300 MB/s" },
    ],
  },
  card_reader: {
    label: "Lecteur de cartes",
    fields: [
      { key: "specFormat", label: "Formats supportés", placeholder: "Ex. SD + microSD" },
      { key: "specConnection", label: "Connexion", placeholder: "Ex. USB-C" },
      { key: "specVariant", label: "Variante", placeholder: "Ex. Double slot" },
    ],
  },
  external_storage: {
    label: "Stockage externe",
    fields: [
      { key: "specCapacity", label: "Capacité", placeholder: "Ex. 2 To" },
      { key: "specConnection", label: "Interface", placeholder: "Ex. USB-C 10 Gbps" },
      { key: "specVariant", label: "Type", placeholder: "Ex. SSD" },
    ],
  },
  remote_trigger: {
    label: "Télécommande / déclencheur",
    fields: [
      { key: "specConnection", label: "Connexion", placeholder: "Ex. Bluetooth, 2.4 GHz" },
      { key: "specCompatibility", label: "Compatibilité", placeholder: "Ex. Canon R6 / Godox X" },
      { key: "specVariant", label: "Sous-type", placeholder: "Ex. Déclencheur, intervalomètre" },
    ],
  },
  cleaning: {
    label: "Nettoyage",
    fields: [
      { key: "specCompatibility", label: "Cible", placeholder: "Ex. Capteur, optiques" },
      { key: "specVariant", label: "Sous-type", placeholder: "Ex. Soufflette, chiffon" },
    ],
  },
  color_tool: {
    label: "Outil colorimétrique",
    fields: [
      { key: "specFormat", label: "Format", placeholder: "Ex. 10 × 15 cm" },
      { key: "specVariant", label: "Sous-type", placeholder: "Ex. Charte gris neutre" },
    ],
  },
  lighting: {
    label: "Lampe / éclairage",
    fields: [
      { key: "specPower", label: "Puissance", placeholder: "Ex. 60 W" },
      { key: "specColorModes", label: "Couleurs", placeholder: "Ex. Bi-color, RGB" },
      { key: "specConnection", label: "Alimentation", placeholder: "Ex. Secteur, NP-F" },
    ],
  },
  drone_part: {
    label: "Pièce drone",
    fields: [
      { key: "specCompatibility", label: "Compatibilité", placeholder: "Ex. DJI Mini 4 Pro" },
      { key: "specVariant", label: "Sous-type", placeholder: "Ex. Hélice, protection" },
    ],
  },
  cable_adapter: {
    label: "Câble / adaptateur",
    fields: [
      { key: "specFormat", label: "Connectique", placeholder: "Ex. USB-C vers SD" },
      { key: "specConnection", label: "Fonction", placeholder: "Ex. Charge, data, vidéo" },
      { key: "specVariant", label: "Variante", placeholder: "Ex. 1 m" },
    ],
  },
  power: {
    label: "Chargeur / alimentation",
    fields: [
      { key: "specPower", label: "Puissance", placeholder: "Ex. 100 W" },
      { key: "specConnection", label: "Connectique", placeholder: "Ex. USB-C PD" },
      { key: "specCompatibility", label: "Compatibilité", placeholder: "Ex. NP-FZ100" },
    ],
  },
};

type FilterAccessoryDraft = {
  filterRole: Accessory["filterRole"];
  rearMountType: AccessoryMountType;
  rearDiameterMm: number | null;
  frontMountType: AccessoryMountType;
  frontDiameterMm: number | null;
  supportsMagneticHood: boolean;
  filterStrength: string | null;
};

export function generateAccessoryLabel(input: { brand: string; name: string }) {
  return [input.brand, input.name.trim()].filter(Boolean).join(" ").trim();
}

export function normalizeAccessoryInput(input: AccessoryInput, refs: { brand: string; type: string }) {
  return {
    ...input,
    brand: refs.brand,
    type: refs.type,
    label: generateAccessoryLabel({ brand: refs.brand, name: input.name }),
    name: input.name.trim(),
    specCapacity: input.specCapacity ?? null,
    specFormat: input.specFormat ?? null,
    specConnection: input.specConnection ?? null,
    specCompatibility: input.specCompatibility ?? null,
    specPower: input.specPower ?? null,
    specColorModes: input.specColorModes ?? null,
    specVariant: input.specVariant ?? null,
  };
}

export function formatAccessoryCapacity(accessory: Pick<Accessory, "capacityLiters" | "capacityBodies" | "capacityLenses" | "capacityNotes">) {
  const parts = [
    accessory.capacityLiters !== null ? `${accessory.capacityLiters} L` : null,
    accessory.capacityBodies !== null ? `${accessory.capacityBodies} boîtier${accessory.capacityBodies > 1 ? "s" : ""}` : null,
    accessory.capacityLenses !== null ? `${accessory.capacityLenses} objectif${accessory.capacityLenses > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(" · ");
  return accessory.capacityNotes?.trim() || "—";
}

export function isOtherAccessory(accessory: Pick<Accessory, "typeCategory">) {
  return accessory.typeCategory === "other";
}

export function getOtherAccessoryProfileConfig(profile: AccessoryOtherProfile | null) {
  return profile ? OTHER_ACCESSORY_PROFILE_CONFIG[profile] : null;
}

export function getOtherAccessorySpecEntries(accessory: Pick<Accessory, "typeProfile" | OtherAccessoryFieldKey>) {
  const config = getOtherAccessoryProfileConfig(accessory.typeProfile);
  if (!config) return [] as Array<{ label: string; value: string }>;
  return config.fields
    .map((field) => ({ label: field.label, value: accessory[field.key]?.trim() ?? "" }))
    .filter((field) => field.value.length > 0);
}

export function formatOtherAccessorySummary(accessory: Pick<Accessory, "typeProfile" | OtherAccessoryFieldKey>) {
  const entries = getOtherAccessorySpecEntries(accessory);
  return entries.length > 0 ? entries.map((entry) => entry.value).join(" · ") : "—";
}

export function formatAccessoryDimensions(accessory: Pick<Accessory, "widthMm" | "heightMm" | "depthMm">) {
  if (accessory.widthMm === null || accessory.heightMm === null || accessory.depthMm === null) return "—";
  return `${accessory.widthMm} × ${accessory.heightMm} × ${accessory.depthMm} mm`;
}

export function formatAccessoryPrice(value: number | null) {
  return value === null ? "—" : formatPrice(value);
}

export function formatAccessoryWeight(value: number | null) {
  return value === null ? "—" : formatWeight(value);
}

export function formatBooleanFlag(value: boolean) {
  return value ? "Oui" : "Non";
}

export function isFilterAccessory(accessory: Pick<Accessory, "typeCategory">) {
  return accessory.typeCategory === "filter";
}

export function formatAccessoryLocation(accessory: Pick<Accessory, "storageLocation" | "mountedOnLensId" | "mountedOnAccessoryId">) {
  if (accessory.mountedOnLensId || accessory.mountedOnAccessoryId) return "Monté";
  return accessory.storageLocation === "reserve" ? "Réserve" : "Sac";
}

export function formatFilterAccessoryLocation(
  accessory: Pick<Accessory, "storageLocation" | "mountedOnLensId" | "mountedOnAccessoryId">,
  lensLabels: ReadonlyMap<string, string>,
  accessoriesById: ReadonlyMap<string, Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId">>,
) {
  const mountedLensId = resolveMountedLensId(accessory, accessoriesById);
  if (mountedLensId) return lensLabels.get(mountedLensId) ?? "Monté";

  return formatAccessoryLocation(accessory);
}

export function resolveMountedLensId(
  accessory: Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId">,
  accessoriesById: ReadonlyMap<string, Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId">>,
) {
  const visited = new Set<string>();
  let currentAccessory: Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId"> | undefined = accessory;

  while (currentAccessory) {
    if (currentAccessory.mountedOnLensId) return currentAccessory.mountedOnLensId;

    const parentAccessoryId = currentAccessory.mountedOnAccessoryId;
    if (!parentAccessoryId || visited.has(parentAccessoryId)) break;

    visited.add(parentAccessoryId);
    currentAccessory = accessoriesById.get(parentAccessoryId);
  }

  return null;
}

export function formatAccessoryInterface(accessory: Pick<Accessory, "rearMountType" | "rearDiameterMm" | "frontMountType" | "frontDiameterMm">) {
  return `${formatMountEndpoint(accessory.rearMountType, accessory.rearDiameterMm)} → ${formatMountEndpoint(accessory.frontMountType, accessory.frontDiameterMm)}`;
}

export function formatMountEndpoint(type: Accessory["rearMountType"], diameter: number | null) {
  if (type === "none") return "Aucune";
  if (type === "threaded") return diameter === null ? "Fileté" : `Fileté ${diameter} mm`;
  return diameter === null ? "Magnétique" : `Magnétique ${diameter} mm`;
}

export function getAccessoryActiveLocation(accessory: Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId" | "storageLocation">) {
  if (accessory.mountedOnLensId || accessory.mountedOnAccessoryId) return "mounted" as const;
  return accessory.storageLocation;
}

export function deriveFilterAccessoryPresentation(draft: FilterAccessoryDraft) {
  if (draft.filterRole === "filter") {
    const diameter = getAccessoryEffectiveRearDiameter(draft.rearMountType, draft.rearDiameterMm);
    const typeName = "Filtre";
    const name = [typeName, draft.filterStrength?.trim() || null, diameter !== null ? `${diameter} mm` : null].filter(Boolean).join(" ");
    return { typeName, name: name || typeName, valid: true as const };
  }

  if (draft.filterRole === "hood") {
    const diameter = getAccessoryEffectiveRearDiameter(draft.rearMountType, draft.rearDiameterMm)
      ?? getAccessoryEffectiveFrontDiameter(draft.frontMountType, draft.frontDiameterMm);
    const typeName = "Adaptateur / pare-soleil magnétique";
    const name = ["Pare-soleil magnétique", diameter !== null ? `${diameter} mm` : null].filter(Boolean).join(" ");
    return { typeName, name, valid: true as const };
  }

  if (draft.filterRole !== "adapter") {
    return { typeName: "Filtre", name: "Filtre", valid: true as const };
  }

  const rearDiameter = getAccessoryEffectiveRearDiameter(draft.rearMountType, draft.rearDiameterMm);
  const frontDiameter = getAccessoryEffectiveFrontDiameter(draft.frontMountType, draft.frontDiameterMm);

  if (draft.rearMountType === "threaded" && draft.frontMountType === "threaded" && rearDiameter !== null && frontDiameter !== null && rearDiameter !== frontDiameter) {
    return {
      typeName: "Bague de conversion",
      name: `Bague de conversion ${rearDiameter}→${frontDiameter} mm`,
      valid: true as const,
    };
  }

  if ((draft.rearMountType === "threaded" || draft.rearMountType === "magnetic") && draft.frontMountType === "magnetic" && rearDiameter !== null && frontDiameter !== null) {
    if (rearDiameter === frontDiameter) {
      return {
        typeName: "Bague magnétique",
        name: `Bague magnétique ${rearDiameter} mm${draft.supportsMagneticHood ? " avec pare-soleil" : ""}`,
        valid: true as const,
      };
    }

    return {
      typeName: "Bague de réduction magnétique",
      name: `Bague de réduction magnétique ${rearDiameter}→${frontDiameter} mm${draft.supportsMagneticHood ? " avec pare-soleil" : ""}`,
      valid: true as const,
    };
  }

  return {
    typeName: null,
    name: "",
    valid: false as const,
    reason: "Combinaison non prise en charge. Utilise uniquement vis→vis (diamètres différents), vis→magnétique ou magnétique→magnétique.",
  };
}

export function resolveFilterAccessoryTypeId(referenceData: AccessoryReferenceData, typeName: string | null) {
  if (!typeName) return "";

  const typeId = getDerivedFilterAccessoryTypeId(typeName);

  return typeId && referenceData.types.some((type) => type.category === "filter" && type.id === typeId) ? typeId : "";
}

export function getAccessoryEffectiveRearDiameter(type: AccessoryMountType, diameter: number | null) {
  if (type === "none") return null;
  return diameter;
}

export function getAccessoryEffectiveFrontDiameter(type: AccessoryMountType, diameter: number | null) {
  if (type === "none") return null;
  return diameter;
}
