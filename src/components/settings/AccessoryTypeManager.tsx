"use client";

import React from "react";
import { useRef, useState } from "react";
import { createAccessoryTypeAction, deleteAccessoryTypeAction, updateAccessoryTypeAction } from "@/app/actions/accessory-actions";
import type { AccessoryType } from "@/lib/accessory/types";
import { OTHER_ACCESSORY_PROFILE_CONFIG } from "@/lib/accessory/accessory-utils";
import { ActionMenu, ActionMenuButton } from "@/components/ui/ActionMenu";

export function AccessoryTypeManager({ types }: { types: AccessoryType[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    setError(null);
    try {
      await createAccessoryTypeAction(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  }

  return (
    <div className="settings-page">
      <div className="toolbar card"><h2>Types d’accessoires</h2></div>
      <div className="card settings-section">
          <h3>Ajouter un type</h3>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <form ref={formRef} action={handleAdd} className="inline-form">
            <input name="name" placeholder="Sac à dos" required />
            <select name="category" defaultValue="bag">
              <option value="bag">Sacs & poches</option>
              <option value="filter">Filtres & bagues</option>
              <option value="other">Autres accessoires</option>
            </select>
            <select name="profile" defaultValue="">
              <option value="">Aucun profil</option>
              {Object.entries(OTHER_ACCESSORY_PROFILE_CONFIG).map(([profile, config]) => <option key={profile} value={profile}>{config.label}</option>)}
            </select>
            <button className="primary-button" type="submit">Ajouter</button>
          </form>
        </div>
      <div className="card settings-section">
        <h3>Types existants ({types.length})</h3>
        {types.length === 0 ? <p className="empty-state">Aucun type. Ajoutez-en un ci-dessus.</p> : (
          <div className="settings-list">
            {types.map((type) => (
              <form key={type.id} action={updateAccessoryTypeAction.bind(null, type.id)} className="inline-form">
                <input name="name" defaultValue={type.name} required />
                <select name="category" defaultValue={type.category}>
                  <option value="bag">Sacs & poches</option>
                  <option value="filter">Filtres & bagues</option>
                  <option value="other">Autres accessoires</option>
                </select>
                <select name="profile" defaultValue={type.profile ?? ""}>
                  <option value="">Aucun profil</option>
                  {Object.entries(OTHER_ACCESSORY_PROFILE_CONFIG).map(([profile, config]) => <option key={profile} value={profile}>{config.label}</option>)}
                </select>
                <ActionMenu label={`Actions pour ${type.name}`}>
                  <ActionMenuButton type="submit">OK</ActionMenuButton>
                  <ActionMenuButton formAction={deleteAccessoryTypeAction.bind(null, type.id)} type="submit" danger>Supprimer</ActionMenuButton>
                </ActionMenu>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
