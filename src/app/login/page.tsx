"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth-actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<{ error?: string }, FormData>(loginAction, {});
  return (
    <main className="login-shell">
      <form action={formAction} className="login-card">
        <p className="eyebrow">Accès privé</p>
        <h1>PhotoPark</h1>
        <p>Entrez le mot de passe partagé pour accéder à l’inventaire.</p>
        <label>
          Mot de passe
          <input name="password" type="password" required autoFocus autoComplete="current-password" />
        </label>
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        <button className="primary-button" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
      </form>
    </main>
  );
}
