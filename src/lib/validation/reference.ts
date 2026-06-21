import { z } from "zod";

export const brandSchema = z.object({ name: z.string().trim().min(1).max(80) });
export const mountSchema = z.object({ name: z.string().trim().min(1).max(40), sensorType: z.enum(["FULL_FRAME", "APS_C"]) });
export const optionSchema = z.object({ code: z.string().trim().min(1).max(20), description: z.string().trim().min(1).max(160) });

export function parseBrandFormData(formData: FormData) {
  return brandSchema.parse({ name: formData.get("name") });
}

export function parseMountFormData(formData: FormData) {
  return mountSchema.parse({ name: formData.get("name"), sensorType: formData.get("sensorType") });
}

export function parseOptionFormData(formData: FormData) {
  return optionSchema.parse({ code: formData.get("code"), description: formData.get("description") });
}
