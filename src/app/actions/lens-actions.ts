"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidSession } from "@/lib/auth/session";
import { assertSameOriginRequest } from "@/lib/auth/csrf";
import { createBrand, createLens, createMount, createOption, deleteBrand, deleteLens, deleteMount, deleteOption, updateBrand, updateLens, updateMount, updateOption } from "@/lib/db/lens-repository";
import { parseLensFormData } from "@/lib/validation/lens";
import { parseBrandFormData, parseMountFormData, parseOptionFormData } from "@/lib/validation/reference";

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
  const { name } = parseBrandFormData(formData);
  createBrand(name);
  revalidatePath("/settings/brands");
  revalidatePath("/lenses", "layout");
}

export async function updateBrandAction(id: string, formData: FormData) {
  await assertAuthenticated();
  const { name } = parseBrandFormData(formData);
  updateBrand(id, name);
  revalidatePath("/settings/brands");
  revalidatePath("/lenses", "layout");
}

export async function deleteBrandAction(id: string) {
  await assertAuthenticated();
  deleteBrand(id);
  revalidatePath("/settings/brands");
  revalidatePath("/lenses", "layout");
}

export async function createMountAction(formData: FormData) {
  await assertAuthenticated();
  const { name, sensorType } = parseMountFormData(formData);
  createMount(name, sensorType);
  revalidatePath("/settings/mounts");
  revalidatePath("/lenses", "layout");
}

export async function updateMountAction(id: string, formData: FormData) {
  await assertAuthenticated();
  const { name, sensorType } = parseMountFormData(formData);
  updateMount(id, name, sensorType);
  revalidatePath("/settings/mounts");
  revalidatePath("/lenses", "layout");
}

export async function deleteMountAction(id: string) {
  await assertAuthenticated();
  deleteMount(id);
  revalidatePath("/settings/mounts");
  revalidatePath("/lenses", "layout");
}

export async function createOptionAction(formData: FormData) {
  await assertAuthenticated();
  const { code, description } = parseOptionFormData(formData);
  createOption(code, description);
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
