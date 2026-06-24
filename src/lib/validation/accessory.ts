import { z } from "zod";

const optionalNumber = z.number().nonnegative().nullable();
const optionalInteger = z.number().int().nonnegative().nullable();

export const accessorySchema = z.object({
  brandId: z.string().uuid(),
  typeId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  capacityLiters: optionalNumber,
  capacityBodies: optionalInteger,
  capacityLenses: optionalInteger,
  fitsLaptop: z.boolean(),
  fitsTripod: z.boolean(),
  widthMm: optionalNumber,
  heightMm: optionalNumber,
  depthMm: optionalNumber,
  weightG: optionalNumber,
  priceEur: optionalNumber,
  carryStyleNotes: z.string().trim().max(500).nullable(),
  capacityNotes: z.string().trim().max(500).nullable(),
  isFavorite: z.boolean(),
  isNextPurchase: z.boolean(),
  isOwned: z.boolean(),
  retired: z.boolean(),
});

export function parseAccessoryFormData(formData: FormData) {
  return accessorySchema.parse({
    brandId: formData.get("brandId"),
    typeId: formData.get("typeId"),
    name: formData.get("name"),
    capacityLiters: parseOptionalNumber(formData.get("capacityLiters")),
    capacityBodies: parseOptionalInteger(formData.get("capacityBodies")),
    capacityLenses: parseOptionalInteger(formData.get("capacityLenses")),
    fitsLaptop: formData.get("fitsLaptop") === "on",
    fitsTripod: formData.get("fitsTripod") === "on",
    widthMm: parseOptionalNumber(formData.get("widthMm")),
    heightMm: parseOptionalNumber(formData.get("heightMm")),
    depthMm: parseOptionalNumber(formData.get("depthMm")),
    weightG: parseOptionalNumber(formData.get("weightG")),
    priceEur: parseOptionalNumber(formData.get("priceEur")),
    carryStyleNotes: parseOptionalString(formData.get("carryStyleNotes")),
    capacityNotes: parseOptionalString(formData.get("capacityNotes")),
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
