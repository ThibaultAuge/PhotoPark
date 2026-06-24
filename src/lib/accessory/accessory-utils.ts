import { formatPrice, formatWeight } from "@/lib/lens/lens-utils";
import type { Accessory, AccessoryInput } from "@/lib/accessory/types";

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
