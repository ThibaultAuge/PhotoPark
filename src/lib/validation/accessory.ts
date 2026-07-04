import { z } from "zod";

const optionalNumber = z.number().nonnegative().nullable();
const optionalInteger = z.number().int().nonnegative().nullable();
const optionalUuid = z.string().uuid().nullable().default(null);
const mountTypeSchema = z.enum(["none", "threaded", "magnetic"]);
const storageLocationSchema = z.enum(["bag", "reserve"]);
const filterRoleSchema = z.enum(["general", "filter", "adapter", "hood"]);

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
  storageLocation: storageLocationSchema.default("bag"),
  mountedOnLensId: optionalUuid,
  mountedOnAccessoryId: optionalUuid,
  rearMountType: mountTypeSchema.default("none"),
  rearDiameterMm: optionalNumber.default(null),
  frontMountType: mountTypeSchema.default("none"),
  frontDiameterMm: optionalNumber.default(null),
  filterRole: filterRoleSchema.default("general"),
  filterStrength: z.string().trim().max(120).nullable().default(null),
  supportsMagneticHood: z.boolean().default(false),
  isFavorite: z.boolean(),
  isNextPurchase: z.boolean(),
  isOwned: z.boolean(),
  retired: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.mountedOnLensId && value.mountedOnAccessoryId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mountedOnLensId"], message: "Une pièce ne peut être montée qu'à un seul endroit." });
  }
  if ((value.rearMountType === "threaded" || value.rearMountType === "magnetic") && value.rearDiameterMm === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rearDiameterMm"], message: "Le diamètre arrière est requis pour une liaison filetée ou magnétique." });
  }
  if ((value.rearMountType === "threaded" || value.rearMountType === "magnetic") && value.rearDiameterMm !== null && value.rearDiameterMm <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rearDiameterMm"], message: "Le diamètre arrière doit être supérieur à 0." });
  }
  if ((value.frontMountType === "threaded" || value.frontMountType === "magnetic") && value.frontDiameterMm === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["frontDiameterMm"], message: "Le diamètre avant est requis pour une liaison filetée ou magnétique." });
  }
  if ((value.frontMountType === "threaded" || value.frontMountType === "magnetic") && value.frontDiameterMm !== null && value.frontDiameterMm <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["frontDiameterMm"], message: "Le diamètre avant doit être supérieur à 0." });
  }
  if (value.filterRole === "adapter") {
    const isThreadedToThreaded = value.rearMountType === "threaded" && value.frontMountType === "threaded" && value.rearDiameterMm !== null && value.frontDiameterMm !== null && value.rearDiameterMm !== value.frontDiameterMm;
    const isThreadedToMagnetic = value.rearMountType === "threaded" && value.frontMountType === "magnetic" && value.rearDiameterMm !== null && value.frontDiameterMm !== null;
    const isMagneticToMagnetic = value.rearMountType === "magnetic" && value.frontMountType === "magnetic" && value.rearDiameterMm !== null && value.frontDiameterMm !== null;

    if (!isThreadedToThreaded && !isThreadedToMagnetic && !isMagneticToMagnetic) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["frontMountType"], message: "Un adaptateur doit être en vis→vis (diamètres différents), vis→magnétique ou magnétique→magnétique." });
    }
  }
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
    storageLocation: formData.get("storageLocation") ?? "bag",
    mountedOnLensId: parseOptionalString(formData.get("mountedOnLensId")),
    mountedOnAccessoryId: parseOptionalString(formData.get("mountedOnAccessoryId")),
    rearMountType: formData.get("rearMountType") ?? "none",
    rearDiameterMm: parseOptionalNumber(formData.get("rearDiameterMm")),
    frontMountType: formData.get("frontMountType") ?? "none",
    frontDiameterMm: parseOptionalNumber(formData.get("frontDiameterMm")),
    filterRole: formData.get("filterRole") ?? "general",
    filterStrength: parseOptionalString(formData.get("filterStrength")),
    supportsMagneticHood: formData.get("supportsMagneticHood") === "on",
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
