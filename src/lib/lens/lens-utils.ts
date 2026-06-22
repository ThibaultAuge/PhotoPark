import type { Lens, LensInput, LensOption, SensorType } from "./types";

const configuredCropFactor = Number(process.env.NEXT_PUBLIC_APSC_CROP_FACTOR ?? "1.5");
const APSC_CROP_FACTOR = Number.isFinite(configuredCropFactor) && configuredCropFactor > 0 ? configuredCropFactor : 1.5;

export function isPrimeLens(lens: Pick<Lens, "focalMinMm" | "focalMaxMm">) {
  return lens.focalMinMm === lens.focalMaxMm;
}

export function isConstantAperture(lens: Pick<Lens, "maxApertureAtMinFocal" | "maxApertureAtMaxFocal">) {
  return lens.maxApertureAtMinFocal === lens.maxApertureAtMaxFocal;
}

export function getLensKind(lens: Pick<Lens, "focalMinMm" | "focalMaxMm">) {
  return isPrimeLens(lens) ? "Fixe" : "Zoom";
}

export function calculateApscEquivalent(sensorType: SensorType, focalMm: number) {
  return sensorType === "FULL_FRAME" ? roundNumber(focalMm * APSC_CROP_FACTOR) : focalMm;
}

export function generateLensLabel(input: { brand: string; mount: string; focalMinMm: number; focalMaxMm: number; maxApertureAtMinFocal: number; maxApertureAtMaxFocal: number; options: LensOption[] }) {
  const focal = formatFocalRange(input).replace(/ mm$/, "");
  const aperture = formatApertureRange(input);
  return [input.brand, input.mount, focal, aperture, formatOptions(input.options)].filter(Boolean).join(" ").trim();
}

export function formatOptions(options: LensOption[]) {
  return options.map((option) => option.code).join(" ");
}

export function formatFocalRange(lens: Pick<Lens, "focalMinMm" | "focalMaxMm">) {
  return lens.focalMinMm === lens.focalMaxMm
    ? `${formatNumber(lens.focalMinMm)} mm`
    : `${formatNumber(lens.focalMinMm)}-${formatNumber(lens.focalMaxMm)} mm`;
}

export function formatApertureRange(lens: Pick<Lens, "maxApertureAtMinFocal" | "maxApertureAtMaxFocal">) {
  return lens.maxApertureAtMinFocal === lens.maxApertureAtMaxFocal
    ? `f/${formatNumber(lens.maxApertureAtMinFocal)}`
    : `f/${formatNumber(lens.maxApertureAtMinFocal)}-${formatNumber(lens.maxApertureAtMaxFocal)}`;
}

export function formatNumber(value: number) {
  return `${value}`;
}

export function roundNumber(value: number) {
  return Math.round(value * 10) / 10;
}

export function normalizeLensInput(input: LensInput, refs: { brand: string; mount: string; sensorType: SensorType; options: LensOption[] }) {
  return {
    ...input,
    brand: refs.brand,
    mount: refs.mount,
    sensorType: refs.sensorType,
    options: refs.options,
    apscFocalMinEquivalentMm: calculateApscEquivalent(refs.sensorType, input.focalMinMm),
    apscFocalMaxEquivalentMm: calculateApscEquivalent(refs.sensorType, input.focalMaxMm),
    label: generateLensLabel({ ...input, brand: refs.brand, mount: refs.mount, options: refs.options })
  };
}
