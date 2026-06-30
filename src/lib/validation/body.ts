import { z } from "zod";

const optionalNumber = z.number().nonnegative().nullable();
const optionalInteger = z.number().int().nonnegative().nullable();

export const bodySchema = z.object({
  brandId: z.string().uuid(),
  mountId: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(120),
  bodyType: z.enum(["mirrorless", "dslr", "compact"]),
  isInterchangeableLens: z.boolean(),
  sensorFormat: z.enum(["FULL_FRAME", "APS_C", "MICRO_FOUR_THIRDS", "MEDIUM_FORMAT", "CMOS", "OTHER"]),
  megapixels: optionalNumber,
  isoMin: optionalInteger,
  isoMax: optionalInteger,
  priceEur: optionalNumber,
  weightG: optionalNumber,
  burstFps: optionalNumber,
  videoSpecs: z.string().trim().max(120).nullable(),
  batteryLifeShots: optionalInteger,
  hasIbis: z.boolean(),
  hasDualCardSlot: z.boolean(),
  isWeatherSealed: z.boolean(),
  hasArticulatedScreen: z.boolean(),
  notes: z.string().trim().max(1000).nullable(),
  isFavorite: z.boolean(),
  isNextPurchase: z.boolean(),
  isOwned: z.boolean(),
  retired: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.isInterchangeableLens && !value.mountId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mountId"], message: "La monture est requise pour un boîtier à objectifs interchangeables." });
  }
  if (!value.isInterchangeableLens && value.mountId !== null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mountId"], message: "La monture doit être vide si le boîtier n'accepte pas d'objectifs interchangeables." });
  }
  if (value.isoMin !== null && value.isoMax !== null && value.isoMin > value.isoMax) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["isoMax"], message: "L'ISO max doit être supérieur ou égal à l'ISO min." });
  }
});

export function parseBodyFormData(formData: FormData) {
  return bodySchema.parse({
    brandId: formData.get("brandId"),
    mountId: parseOptionalUuid(formData.get("mountId")),
    name: formData.get("name"),
    bodyType: formData.get("bodyType"),
    isInterchangeableLens: formData.get("isInterchangeableLens") === "on",
    sensorFormat: formData.get("sensorFormat"),
    megapixels: parseOptionalNumber(formData.get("megapixels")),
    isoMin: parseOptionalInteger(formData.get("isoMin")),
    isoMax: parseOptionalInteger(formData.get("isoMax")),
    priceEur: parseOptionalNumber(formData.get("priceEur")),
    weightG: parseOptionalNumber(formData.get("weightG")),
    burstFps: parseOptionalNumber(formData.get("burstFps")),
    videoSpecs: parseOptionalString(formData.get("videoSpecs")),
    batteryLifeShots: parseOptionalInteger(formData.get("batteryLifeShots")),
    hasIbis: formData.get("hasIbis") === "on",
    hasDualCardSlot: formData.get("hasDualCardSlot") === "on",
    isWeatherSealed: formData.get("isWeatherSealed") === "on",
    hasArticulatedScreen: formData.get("hasArticulatedScreen") === "on",
    notes: parseOptionalString(formData.get("notes")),
    isFavorite: formData.get("isFavorite") === "on",
    isNextPurchase: formData.get("isNextPurchase") === "on",
    isOwned: formData.get("isOwned") === "on",
    retired: formData.get("retired") === "on",
  });
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) return null;
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseOptionalUuid(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
