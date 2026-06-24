import { z } from "zod";

export const brandDomainSchema = z.enum(["lenses", "accessories"]);
export const brandSchema = z.object({
  name: z.string().trim().min(1).max(80),
  domains: z.array(brandDomainSchema).min(1),
});
export const mountSchema = z.object({ name: z.string().trim().min(1).max(40), sensorType: z.enum(["FULL_FRAME", "APS_C"]) });
export const optionSchema = z.object({ code: z.string().trim().min(1).max(20), description: z.string().trim().min(1).max(160), brandId: z.string().uuid() });
export const optionGroupSchema = z.object({ slug: z.string().trim().min(1).max(40), name: z.string().trim().min(1).max(80), type: z.enum(["flag", "value"]) });

export function parseBrandFormData(formData: FormData) {
  return brandSchema.parse({ name: formData.get("name"), domains: formData.getAll("domains") });
}

export function parseMountFormData(formData: FormData) {
  return mountSchema.parse({ name: formData.get("name"), sensorType: formData.get("sensorType") });
}

export function parseOptionFormData(formData: FormData) {
  return optionSchema.parse({ code: formData.get("code"), description: formData.get("description"), brandId: formData.get("brandId") });
}

export function parseOptionGroupFormData(formData: FormData) {
  return optionGroupSchema.parse({ slug: formData.get("slug"), name: formData.get("name"), type: formData.get("type") });
}
