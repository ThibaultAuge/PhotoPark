"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refreshAccessoryLabels } from "@/lib/db/accessory-repository";
import { refreshBodyLabels } from "@/lib/db/body-repository";
import { hasValidSession } from "@/lib/auth/session";
import { assertSameOriginRequest } from "@/lib/auth/csrf";
import { createBrand, createLens, createMount, createOption, createOptionGroup, deleteBrand, deleteLens, deleteMount, deleteOption, deleteOptionGroup, replaceGroupMembers, updateBrand, updateLens, updateMount, updateOption, updateOptionGroup } from "@/lib/db/lens-repository";
import { parseLensFormData } from "@/lib/validation/lens";
import { parseBrandFormData, parseMountFormData, parseOptionFormData, parseOptionGroupFormData } from "@/lib/validation/reference";

async function assertAuthenticated() {
  await assertSameOriginRequest();
  if (!(await hasValidSession())) redirect("/login");
}

export async function createLensAction(formData: FormData) {
  await assertAuthenticated();
  createLens(parseLensFormData(formData));
  revalidatePath("/lenses", "layout");
}

export async function updateLensAction(id: string, formData: FormData) {
  await assertAuthenticated();
  updateLens(id, parseLensFormData(formData));
  revalidatePath("/lenses", "layout");
}

export async function deleteLensAction(id: string) {
  await assertAuthenticated();
  deleteLens(id);
  revalidatePath("/lenses", "layout");
}

export async function createBrandAction(formData: FormData) {
  await assertAuthenticated();
  const { name, domains } = parseBrandFormData(formData);
  createBrand(name, domains);
  revalidatePath("/settings/brands");
  revalidatePath("/lenses", "layout");
  revalidatePath("/accessories", "layout");
  revalidatePath("/bodies", "layout");
}

export async function updateBrandAction(id: string, formData: FormData) {
  await assertAuthenticated();
  const { name, domains } = parseBrandFormData(formData);
  updateBrand(id, name, domains);
  refreshAccessoryLabels();
  refreshBodyLabels();
  revalidatePath("/settings/brands");
  revalidatePath("/lenses", "layout");
  revalidatePath("/accessories", "layout");
  revalidatePath("/bodies", "layout");
}

export async function deleteBrandAction(id: string) {
  await assertAuthenticated();
  deleteBrand(id);
  revalidatePath("/settings/brands");
  revalidatePath("/lenses", "layout");
  revalidatePath("/accessories", "layout");
  revalidatePath("/bodies", "layout");
}

export async function createMountAction(formData: FormData) {
  await assertAuthenticated();
  const { name, sensorType } = parseMountFormData(formData);
  createMount(name, sensorType);
  revalidatePath("/settings/mounts");
  revalidatePath("/lenses", "layout");
  revalidatePath("/bodies", "layout");
}

export async function updateMountAction(id: string, formData: FormData) {
  await assertAuthenticated();
  const { name, sensorType } = parseMountFormData(formData);
  updateMount(id, name, sensorType);
  revalidatePath("/settings/mounts");
  revalidatePath("/lenses", "layout");
  revalidatePath("/bodies", "layout");
}

export async function deleteMountAction(id: string) {
  await assertAuthenticated();
  deleteMount(id);
  revalidatePath("/settings/mounts");
  revalidatePath("/lenses", "layout");
  revalidatePath("/bodies", "layout");
}

export async function createOptionAction(formData: FormData) {
  await assertAuthenticated();
  const { code, description, brandId } = parseOptionFormData(formData);
  createOption(code, description, brandId);
  revalidatePath("/settings/options");
  revalidatePath("/lenses", "layout");
}

export async function updateOptionAction(id: string, formData: FormData) {
  await assertAuthenticated();
  const { code, description } = parseOptionFormData(formData);
  updateOption(id, code, description);
  revalidatePath("/settings/options");
  revalidatePath("/lenses", "layout");
}

export async function deleteOptionAction(id: string) {
  await assertAuthenticated();
  deleteOption(id);
  revalidatePath("/settings/options");
  revalidatePath("/lenses", "layout");
}

// --- Option Groups Actions ---

export async function createOptionGroupAction(formData: FormData) {
  await assertAuthenticated();
  const { slug, name, type } = parseOptionGroupFormData(formData);
  createOptionGroup(slug, name, type);
  revalidatePath("/settings/options/groups");
  revalidatePath("/lenses", "layout");
}

export async function updateOptionGroupAction(id: string, formData: FormData) {
  await assertAuthenticated();
  const { slug, name, type } = parseOptionGroupFormData(formData);
  updateOptionGroup(id, slug, name, type);
  revalidatePath("/settings/options/groups");
  revalidatePath("/lenses", "layout");
}

export async function deleteOptionGroupAction(id: string) {
  await assertAuthenticated();
  deleteOptionGroup(id);
  revalidatePath("/settings/options/groups");
  revalidatePath("/lenses", "layout");
}

export async function setOptionGroupMembersAction(groupId: string, formData: FormData) {
  await assertAuthenticated();
  const optionIds = formData.getAll("optionId") as string[];
  replaceGroupMembers(groupId, optionIds);
  revalidatePath("/settings/options/groups");
  revalidatePath("/lenses", "layout");
}
