"use client";

import { useRef, useState } from "react";
import type { LensMount } from "@/lib/lens/types";
import { createMountAction, updateMountAction, deleteMountAction } from "@/app/actions/lens-actions";

export function MountManager({ mounts }: { mounts: LensMount[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    setError(null);
    try {
      await createMountAction(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  }

  return (
    <div className="settings-page">
      <div className="toolbar card">
        <h2>Montures</h2>
      </div>
      <div className="card settings-section">
        <h3>Ajouter une monture</h3>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <form ref={formRef} action={handleAdd} className="inline-form">
          <input name="name" placeholder="Canon RF-S" required />
          <select name="sensorType" defaultValue="FULL_FRAME">
            <option value="FULL_FRAME">Plein format</option>
            <option value="APS_C">APS-C</option>
          </select>
          <button className="primary-button" type="submit">Ajouter</button>
        </form>
      </div>
      <div className="card settings-section">
        <h3>Montures existantes ({mounts.length})</h3>
        {mounts.length === 0 ? (
          <p className="empty-state">Aucune monture. Ajoutez-en une ci-dessus.</p>
        ) : (
          <div className="settings-list">
            {mounts.map((mount) => (
              <form key={mount.id} action={updateMountAction.bind(null, mount.id)} className="inline-form">
                <input name="name" defaultValue={mount.name} required />
                <select name="sensorType" defaultValue={mount.sensorType}>
                  <option value="FULL_FRAME">Plein format</option>
                  <option value="APS_C">APS-C</option>
                </select>
                <button className="ghost-button" type="submit">OK</button>
                <button formAction={deleteMountAction.bind(null, mount.id)} className="danger-button" type="submit">Supprimer</button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
