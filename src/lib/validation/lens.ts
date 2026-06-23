import { z } from "zod";

const optionalNumber = z.preprocess(
  (value) => parseOptionalNumber(value),
  z.number().finite().nonnegative().nullable()
);

const requiredPositiveNumber = z.preprocess(
  (value) => parseRequiredNumber(value),
  z.number().finite().positive()
);

const optionalPositiveNumber = z.preprocess(
  (value) => parseOptionalNumber(value),
  z.number().finite().positive().nullable()
);

const optionalInteger = z.preprocess(
  (value) => parseOptionalNumber(value),
  z.number().int().nonnegative().nullable()
);

function parseRequiredNumber(value: unknown) {
  return typeof value === "string" ? Number(normalizeNumberString(value)) : Number(value);
}

function parseOptionalNumber(value: unknown) {
  if (typeof value === "string") {
    const normalized = normalizeNumberString(value);
    return normalized === "" ? null : Number(normalized);
  }
  return value === null || typeof value === "undefined" ? null : Number(value);
}

function normalizeNumberString(value: string) {
  return value.trim().replace(",", ".");
}

export const lensSchema = z
  .object({
    brandId: z.string().uuid(),
    mountId: z.string().uuid(),
    optionIds: z.array(z.string().uuid()).max(50).transform((ids) => Array.from(new Set(ids))).default([]),
    focalMinMm: requiredPositiveNumber,
    focalMaxMm: requiredPositiveNumber,
    maxApertureAtMinFocal: requiredPositiveNumber,
    maxApertureAtMaxFocal: optionalPositiveNumber,
    minApertureAtMinFocal: optionalPositiveNumber,
    minApertureAtMaxFocal: optionalPositiveNumber,
    filterDiameterMm: optionalNumber,
    priceEur: optionalNumber,
    minFocusDistanceM: optionalNumber,
    angleAtMinFocalDeg: optionalNumber,
    angleAtMaxFocalDeg: optionalNumber,
    apertureBlades: optionalInteger,
    opticalFormula: z.string().max(100).nullable().default(null),
    weightG: optionalNumber,
    isFavorite: z.coerce.boolean().default(false),
    isNextPurchase: z.coerce.boolean().default(false),
    isOwned: z.coerce.boolean().default(false)
  })
  .refine((value) => value.focalMaxMm >= value.focalMinMm, {
    path: ["focalMaxMm"],
    message: "La focale max doit être supérieure ou égale à la focale min."
  })
  .refine((value) => value.minApertureAtMinFocal === null || value.minApertureAtMinFocal >= value.maxApertureAtMinFocal, {
    path: ["minApertureAtMinFocal"],
    message: "L'ouverture minimale à focale min doit être supérieure ou égale à l'ouverture max."
  })
  .refine((value) => value.minApertureAtMaxFocal === null || value.minApertureAtMaxFocal >= (value.maxApertureAtMaxFocal ?? value.maxApertureAtMinFocal), {
    path: ["minApertureAtMaxFocal"],
    message: "L'ouverture minimale à focale max doit être supérieure ou égale à l'ouverture max."
  })
  .transform((value) => ({ ...value, maxApertureAtMaxFocal: value.maxApertureAtMaxFocal ?? value.maxApertureAtMinFocal }));

export function parseLensFormData(formData: FormData) {
  return lensSchema.parse({
    brandId: formData.get("brandId"),
    mountId: formData.get("mountId"),
    optionIds: formData.getAll("optionIds"),
    focalMinMm: formData.get("focalMinMm"),
    focalMaxMm: formData.get("focalMaxMm"),
    maxApertureAtMinFocal: formData.get("maxApertureAtMinFocal"),
    maxApertureAtMaxFocal: formData.get("maxApertureAtMaxFocal"),
    minApertureAtMinFocal: formData.get("minApertureAtMinFocal"),
    minApertureAtMaxFocal: formData.get("minApertureAtMaxFocal"),
    filterDiameterMm: formData.get("filterDiameterMm"),
    priceEur: formData.get("priceEur"),
    minFocusDistanceM: formData.get("minFocusDistanceM"),
    angleAtMinFocalDeg: formData.get("angleAtMinFocalDeg"),
    angleAtMaxFocalDeg: formData.get("angleAtMaxFocalDeg"),
    apertureBlades: formData.get("apertureBlades"),
    opticalFormula: formData.get("opticalFormula"),
    weightG: formData.get("weightG"),
    isFavorite: formData.get("isFavorite") === "on",
    isNextPurchase: formData.get("isNextPurchase") === "on",
    isOwned: formData.get("isOwned") === "on"
  });
}
