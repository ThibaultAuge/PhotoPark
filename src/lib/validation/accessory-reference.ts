import { z } from "zod";

export const accessoryTypeSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export function parseAccessoryTypeFormData(formData: FormData) {
  return accessoryTypeSchema.parse({ name: formData.get("name") });
}
