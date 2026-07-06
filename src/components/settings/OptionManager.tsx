"use client";

import React from "react";
import { useRef, useState } from "react";
import type { LensBrand, LensOption } from "@/lib/lens/types";
import { createOptionAction, updateOptionAction, deleteOptionAction } from "@/app/actions/lens-actions";
import { ActionMenu, ActionMenuButton } from "@/components/ui/ActionMenu";

export function OptionManager({ options, brands }: { options: LensOption[]; brands: LensBrand[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id ?? "");

  const filteredOptions = options.filter((option) => option.brandId === selectedBrandId);

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
        <label>
          Marque
          <select value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)}>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="card settings-section">
        <h3>Ajouter une option pour {brands.find((b) => b.id === selectedBrandId)?.name ?? "..."}</h3>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <form ref={formRef} action={handleAdd} className="inline-form">
          <input name="code" placeholder="IS" required />
          <input name="description" placeholder="Stabilisation optique" required />
          <input type="hidden" name="brandId" value={selectedBrandId} />
          <button className="primary-button" type="submit">Ajouter</button>
        </form>
      </div>
      <div className="card settings-section">
        <h3>Options {brands.find((b) => b.id === selectedBrandId)?.name ?? ""} ({filteredOptions.length})</h3>
        {filteredOptions.length === 0 ? (
          <p className="empty-state">Aucune option pour cette marque. Ajoutez-en une ci-dessus.</p>
        ) : (
          <div className="settings-list">
            {filteredOptions.map((option) => (
              <form key={option.id} action={updateOptionAction.bind(null, option.id)} className="inline-form">
                <input name="code" defaultValue={option.code} required />
                <input name="description" defaultValue={option.description} required />
                <input type="hidden" name="brandId" value={option.brandId} />
                <ActionMenu label={`Actions pour ${option.code}`}>
                  <ActionMenuButton type="submit">OK</ActionMenuButton>
                  <ActionMenuButton formAction={deleteOptionAction.bind(null, option.id)} type="submit" danger>Supprimer</ActionMenuButton>
                </ActionMenu>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
