import { z } from "zod";

export const accessoryTypeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(["bag", "filter"]).default("bag"),
});

export function parseAccessoryTypeFormData(formData: FormData) {
  return accessoryTypeSchema.parse({ name: formData.get("name"), category: formData.get("category") ?? "bag" });
}
