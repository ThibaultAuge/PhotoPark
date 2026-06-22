"use client";

import { useRef, useState } from "react";
import type { LensOption } from "@/lib/lens/types";
import { createOptionAction, updateOptionAction, deleteOptionAction } from "@/app/actions/lens-actions";

export function OptionManager({ options }: { options: LensOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    setError(null);
    try {
      await createOptionAction(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  }

  return (
    <div className="settings-page">
      <div className="toolbar card">
        <h2>Options objectifs</h2>
      </div>
      <div className="card settings-section">
        <h3>Ajouter une option</h3>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <form ref={formRef} action={handleAdd} className="inline-form">
          <input name="code" placeholder="IS" required />
          <input name="description" placeholder="Stabilisation optique" required />
          <button className="primary-button" type="submit">Ajouter</button>
        </form>
      </div>
      <div className="card settings-section">
        <h3>Options existantes ({options.length})</h3>
        {options.length === 0 ? (
          <p className="empty-state">Aucune option. Ajoutez-en une ci-dessus.</p>
        ) : (
          <div className="settings-list">
            {options.map((option) => (
              <form key={option.id} action={updateOptionAction.bind(null, option.id)} className="inline-form">
                <input name="code" defaultValue={option.code} required />
                <input name="description" defaultValue={option.description} required />
                <button className="ghost-button" type="submit">OK</button>
                <button formAction={deleteOptionAction.bind(null, option.id)} className="danger-button" type="submit">Supprimer</button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
