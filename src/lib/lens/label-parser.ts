import type { LensReferenceData } from "./types";

export type ParsedLensLabel = {
  brandId?: string;
  mountId?: string;
  optionIds?: string[];
  focalMinMm?: number;
  focalMaxMm?: number;
  maxApertureAtMinFocal?: number;
  maxApertureAtMaxFocal?: number;
};

const NUMBER_PATTERN = String.raw`\d+(?:[.,]\d+)?`;
const APERTURE_PATTERN = new RegExp(String.raw`(?:^|\s)(?:f\s*/|1\s*:|ƒ\s*/?)\s*(${NUMBER_PATTERN})(?:\s*[-–—]\s*(${NUMBER_PATTERN}))?`, "i");
const FOCAL_PATTERN = new RegExp(String.raw`(?:^|\s)(${NUMBER_PATTERN})(?:\s*[-–—]\s*(${NUMBER_PATTERN}))?\s*(mm)?(?=\s|$)`, "gi");

export function parseLensLabel(label: string, referenceData: LensReferenceData): ParsedLensLabel {
  const parsed: ParsedLensLabel = {};
  const normalizedLabel = normalizeText(label);

  const brand = findReferenceByName(normalizedLabel, referenceData.brands.map((item) => ({ id: item.id, name: item.name })));
  if (brand) parsed.brandId = brand.id;

  const mount = findReferenceByName(normalizedLabel, referenceData.mounts.map((item) => ({ id: item.id, name: item.name })));
  if (mount) parsed.mountId = mount.id;

  const apertureMatch = label.match(APERTURE_PATTERN);
  if (apertureMatch) {
    const minAperture = parseLabelNumber(apertureMatch[1]);
    const maxAperture = parseLabelNumber(apertureMatch[2] ?? apertureMatch[1]);
    if (typeof minAperture === "number") parsed.maxApertureAtMinFocal = minAperture;
    if (typeof maxAperture === "number") parsed.maxApertureAtMaxFocal = maxAperture;
  }

  const labelWithoutAperture = apertureMatch ? `${label.slice(0, apertureMatch.index)} ${label.slice((apertureMatch.index ?? 0) + apertureMatch[0].length)}` : label;
  const focalMatch = findBestFocalMatch(labelWithoutAperture);
  if (focalMatch) {
    const focalMin = parseLabelNumber(focalMatch.min);
    const focalMax = parseLabelNumber(focalMatch.max ?? focalMatch.min);
    if (typeof focalMin === "number") parsed.focalMinMm = focalMin;
    if (typeof focalMax === "number") parsed.focalMaxMm = focalMax;
  }

  // Only search options that belong to the identified brand (if found)
  const optionsForBrand = parsed.brandId
    ? referenceData.options.filter((o) => o.brandId === parsed.brandId)
    : referenceData.options;
  const optionIds = findOptionIds(normalizedLabel, optionsForBrand.map((item) => ({ id: item.id, name: item.code })));
  if (optionIds.length > 0) parsed.optionIds = optionIds;

  return parsed;
}

function findReferenceByName(normalizedLabel: string, refs: { id: string; name: string }[]) {
  return refs
    .map((ref) => ({ ...ref, normalizedName: normalizeText(ref.name) }))
    .filter((ref) => ref.normalizedName !== "" && containsTokenSequence(normalizedLabel, ref.normalizedName))
    .sort((a, b) => b.normalizedName.length - a.normalizedName.length)[0];
}

function findBestFocalMatch(label: string) {
  const matches = Array.from(label.matchAll(FOCAL_PATTERN)).map((match) => ({
    min: match[1],
    max: match[2],
    hasMm: Boolean(match[3]),
    index: match.index ?? 0
  }));
  return matches.find((match) => match.max && match.hasMm) ?? matches.find((match) => match.hasMm) ?? matches.find((match) => match.max) ?? matches[0];
}

function findOptionIds(normalizedLabel: string, options: { id: string; name: string }[]) {
  const selectedIds = new Set<string>();
  const selectedRanges: { start: number; end: number }[] = [];
  const candidates = options
    .map((option) => ({ ...option, normalizedName: normalizeText(option.name) }))
    .filter((option) => option.normalizedName !== "")
    .sort((a, b) => b.normalizedName.length - a.normalizedName.length);

  for (const option of candidates) {
    const range = findTokenSequenceRange(normalizedLabel, option.normalizedName);
    if (!range || selectedRanges.some((selectedRange) => rangesOverlap(range, selectedRange))) continue;
    selectedRanges.push(range);
    selectedIds.add(option.id);
  }

  return options.filter((option) => selectedIds.has(option.id)).map((option) => option.id);
}

function containsTokenSequence(normalizedLabel: string, normalizedValue: string) {
  return Boolean(findTokenSequenceRange(normalizedLabel, normalizedValue));
}

function findTokenSequenceRange(normalizedLabel: string, normalizedValue: string) {
  if (!normalizedValue) return undefined;
  const match = new RegExp(`(^| )${escapeRegExp(normalizedValue)}(?= |$)`, "i").exec(normalizedLabel);
  if (!match) return undefined;
  const start = (match.index ?? 0) + match[1].length;
  return { start, end: start + normalizedValue.length };
}

function rangesOverlap(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseLabelNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
