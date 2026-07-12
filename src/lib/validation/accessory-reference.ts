import { z } from "zod";

const otherProfileSchema = z.enum([
  "generic",
  "battery",
  "memory_card",
  "card_reader",
  "external_storage",
  "remote_trigger",
  "cleaning",
  "color_tool",
  "lighting",
  "drone_part",
  "cable_adapter",
  "power",
]);

export const accessoryTypeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(["bag", "filter", "other"]).default("bag"),
  profile: otherProfileSchema.nullable().default(null),
}).superRefine((value, ctx) => {
  if (value.category === "other" && value.profile === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["profile"], message: "Le profil est requis pour les autres accessoires." });
  }
  if (value.category !== "other" && value.profile !== null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["profile"], message: "Le profil ne s'applique qu'à la catégorie autres accessoires." });
  }
});

export function parseAccessoryTypeFormData(formData: FormData) {
  return accessoryTypeSchema.parse({
    name: formData.get("name"),
    category: formData.get("category") ?? "bag",
    profile: parseOptionalString(formData.get("profile")),
  });
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
