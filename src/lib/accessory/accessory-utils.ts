import { formatPrice, formatWeight } from "@/lib/lens/lens-utils";
import type { Accessory, AccessoryInput, AccessoryMountType, AccessoryReferenceData } from "@/lib/accessory/types";

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
  const visited = new Set<string>();
  let currentAccessory: Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId"> | undefined = accessory;

  while (currentAccessory) {
    if (currentAccessory.mountedOnLensId) {
      return lensLabels.get(currentAccessory.mountedOnLensId) ?? "Monté";
    }

    const parentAccessoryId = currentAccessory.mountedOnAccessoryId;
    if (!parentAccessoryId || visited.has(parentAccessoryId)) break;

    visited.add(parentAccessoryId);
    currentAccessory = accessoriesById.get(parentAccessoryId);
  }

  return formatAccessoryLocation(accessory);
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

  const preferredNames = typeName === "Bague de réduction magnétique"
    ? ["Bague de réduction magnétique", "Bague vissée → magnétique"]
    : typeName === "Bague magnétique"
      ? ["Bague magnétique", "Bague vissée → magnétique"]
      : [typeName];

  for (const candidate of preferredNames) {
    const match = referenceData.types.find((type) => type.category === "filter" && type.name === candidate);
    if (match) return match.id;
  }

  return "";
}

export function getAccessoryEffectiveRearDiameter(type: AccessoryMountType, diameter: number | null) {
  if (type === "none") return null;
  return diameter;
}

export function getAccessoryEffectiveFrontDiameter(type: AccessoryMountType, diameter: number | null) {
  if (type === "none") return null;
  return diameter;
}
