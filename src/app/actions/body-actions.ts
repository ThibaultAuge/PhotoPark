"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertSameOriginRequest } from "@/lib/auth/csrf";
import { hasValidSession } from "@/lib/auth/session";
import { createBody, deleteBody, updateBody } from "@/lib/db/body-repository";
import { parseBodyFormData } from "@/lib/validation/body";

async function assertAuthenticated() {
  await assertSameOriginRequest();
  if (!(await hasValidSession())) redirect("/login");
}

export async function createBodyAction(formData: FormData) {
  await assertAuthenticated();
  createBody(parseBodyFormData(formData));
  revalidatePath("/bodies", "layout");
}

export async function updateBodyAction(id: string, formData: FormData) {
  await assertAuthenticated();
  updateBody(id, parseBodyFormData(formData));
  revalidatePath("/bodies", "layout");
}

export async function deleteBodyAction(id: string) {
  await assertAuthenticated();
  deleteBody(id);
  revalidatePath("/bodies", "layout");
}
