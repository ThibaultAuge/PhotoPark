import React from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { hasValidSession } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await hasValidSession()) redirect("/lenses");

  return (
    <main className="login-shell">
      <LoginForm />
    </main>
  );
}
