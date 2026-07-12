"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertSameOriginRequest } from "@/lib/auth/csrf";
import { hasValidSession } from "@/lib/auth/session";
import { createAccessory, createAccessoryType, deleteAccessory, deleteAccessoryType, mountAccessoryOnAccessory, mountAccessoryOnLens, unmountAccessoryAndDescendants, updateAccessory, updateAccessoryType } from "@/lib/db/accessory-repository";
import { parseAccessoryFormData } from "@/lib/validation/accessory";
import { parseAccessoryTypeFormData } from "@/lib/validation/accessory-reference";

async function assertAuthenticated() {
  await assertSameOriginRequest();
  if (!(await hasValidSession())) redirect("/login");
}

export async function createAccessoryAction(formData: FormData) {
  await assertAuthenticated();
  createAccessory(parseAccessoryFormData(formData));
  revalidatePath("/accessories", "layout");
}

export async function updateAccessoryAction(id: string, formData: FormData) {
  await assertAuthenticated();
  updateAccessory(id, parseAccessoryFormData(formData));
  revalidatePath("/accessories", "layout");
}

export async function deleteAccessoryAction(id: string) {
  await assertAuthenticated();
  deleteAccessory(id);
  revalidatePath("/accessories", "layout");
}

export async function mountAccessoryOnLensAction(accessoryId: string, lensId: string): Promise<{ success: boolean; error?: string }> {
  await assertAuthenticated();
  try {
    mountAccessoryOnLens(accessoryId, lensId);
    revalidatePath("/accessories", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue lors du montage." };
  }
}

export async function mountAccessoryOnAccessoryAction(accessoryId: string, parentAccessoryId: string): Promise<{ success: boolean; error?: string }> {
  await assertAuthenticated();
  try {
    mountAccessoryOnAccessory(accessoryId, parentAccessoryId);
    revalidatePath("/accessories", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue lors du montage." };
  }
}

export async function unmountAccessoryAction(accessoryId: string): Promise<{ success: boolean; error?: string }> {
  await assertAuthenticated();
  try {
    unmountAccessoryAndDescendants(accessoryId);
    revalidatePath("/accessories", "layout");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue lors du démontage." };
  }
}

export async function createAccessoryTypeAction(formData: FormData) {
  await assertAuthenticated();
  const { name, category, profile } = parseAccessoryTypeFormData(formData);
  createAccessoryType(name, category, profile);
  revalidatePath("/settings/accessory-types");
  revalidatePath("/accessories", "layout");
}

export async function updateAccessoryTypeAction(id: string, formData: FormData) {
  await assertAuthenticated();
  const { name, category, profile } = parseAccessoryTypeFormData(formData);
  updateAccessoryType(id, name, category, profile);
  revalidatePath("/settings/accessory-types");
  revalidatePath("/accessories", "layout");
}

export async function deleteAccessoryTypeAction(id: string) {
  await assertAuthenticated();
  deleteAccessoryType(id);
  revalidatePath("/settings/accessory-types");
  revalidatePath("/accessories", "layout");
}
