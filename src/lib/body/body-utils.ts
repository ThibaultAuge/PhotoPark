import type { Body, BodyInput, BodySensorFormat, BodyType } from "@/lib/body/types";
import { formatPrice, formatWeight } from "@/lib/lens/lens-utils";

export function generateBodyLabel(input: { brand: string; name: string }) {
  return [input.brand.trim(), input.name.trim()].filter(Boolean).join(" ").trim();
}

export function normalizeBodyInput(input: BodyInput, refs: { brand: string; mount: string | null }) {
  const isInterchangeableLens = Boolean(input.isInterchangeableLens);
  const mountId = isInterchangeableLens ? input.mountId : null;
  const mount = isInterchangeableLens ? refs.mount : null;
  const name = input.name.trim();

  return {
    ...input,
    brand: refs.brand,
    mountId,
    mount,
    name,
    isInterchangeableLens,
    label: generateBodyLabel({ brand: refs.brand, name }),
  };
}

export function getBodyTypeLabel(bodyType: BodyType) {
  return bodyType === "mirrorless" ? "Hybride" : "Reflex";
}

export function getBodySensorFormatLabel(sensorFormat: BodySensorFormat) {
  switch (sensorFormat) {
    case "FULL_FRAME":
      return "Plein format";
    case "APS_C":
      return "APS-C";
    case "MICRO_FOUR_THIRDS":
      return "Micro 4/3";
    case "MEDIUM_FORMAT":
      return "Moyen format";
    default:
      return "Autre";
  }
}

export function formatBooleanFlag(value: boolean) {
  return value ? "Oui" : "Non";
}

export function formatBodyPrice(value: number | null) {
  return value !== null ? formatPrice(value) : "—";
}

export function formatBodyWeight(value: number | null) {
  return value !== null ? formatWeight(value) : "—";
}

export function formatBodyIsoRange(body: Pick<Body, "isoMin" | "isoMax">) {
  if (body.isoMin === null && body.isoMax === null) return "—";
  if (body.isoMin !== null && body.isoMax !== null) return `${body.isoMin}–${body.isoMax}`;
  return `${body.isoMin ?? body.isoMax}`;
}

export function formatMegapixels(value: number | null) {
  return value !== null ? `${value} MP` : "—";
}

export function formatBurstFps(value: number | null) {
  return value !== null ? `${value} i/s` : "—";
}

export function formatBatteryLife(value: number | null) {
  return value !== null ? `${value} vues` : "—";
}
