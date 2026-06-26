"use client";

import React, { useState } from "react";
import type { LensBrand, LensOption, OptionGroup, OptionGroupMember } from "@/lib/lens/types";
import { createOptionGroupAction, updateOptionGroupAction, deleteOptionGroupAction, setOptionGroupMembersAction } from "@/app/actions/lens-actions";

export function OptionGroupManager({
  groups,
  options,
  brands,
  members
}: {
  groups: OptionGroup[];
  options: LensOption[];
  brands: LensBrand[];
  members: OptionGroupMember[];
}) {
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id ?? "");

  const memberOptionIds = members.filter((m) => m.groupId === selectedGroupId).map((m) => m.optionId);

  return (
    <div className="settings-page">
      <div className="toolbar card">
        <h2>Groupes d&apos;options</h2>
      </div>

      {/* Create group */}
      <div className="card settings-section">
        <h3>Ajouter un groupe</h3>
        <form action={createOptionGroupAction} className="inline-form">
          <input name="slug" placeholder="stabilization" required />
          <input name="name" placeholder="Stabilisation" required />
          <select name="type" required>
            <option value="flag">Oui / Non (drapeau)</option>
            <option value="value">Valeur (affiche le code)</option>
          </select>
          <button className="primary-button" type="submit">Ajouter</button>
        </form>
      </div>

      {/* List groups */}
      <div className="card settings-section">
        <h3>Groupes existants ({groups.length})</h3>
        {groups.length === 0 ? (
          <p className="empty-state">Aucun groupe. Ajoutez-en un ci-dessus.</p>
        ) : (
          <div className="settings-list">
            {groups.map((group) => (
              <div key={group.id} className="settings-list-item">
                {editingGroupId === group.id ? (
                  <form action={updateOptionGroupAction.bind(null, group.id)} className="inline-form">
                    <input name="slug" defaultValue={group.slug} required />
                    <input name="name" defaultValue={group.name} required />
                    <select name="type" defaultValue={group.type} required>
                      <option value="flag">Oui / Non (drapeau)</option>
                      <option value="value">Valeur (affiche le code)</option>
                    </select>
                    <button className="ghost-button" type="submit">OK</button>
                    <button type="button" className="ghost-button" onClick={() => setEditingGroupId(null)}>Annuler</button>
                  </form>
                ) : (
                  <div className="inline-form">
                    <span className="settings-item-label"><strong>{group.name}</strong> ({group.slug}) — {group.type === "flag" ? "Drapeau" : "Valeur"}</span>
                    <button className="ghost-button" onClick={() => setEditingGroupId(group.id)}>Modifier</button>
                    <form style={{ display: "inline" }} action={deleteOptionGroupAction.bind(null, group.id)}>
                      <button className="danger-button" type="submit">Supprimer</button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group selector and members */}
      <div className="card settings-section">
        <label>
          Groupe à configurer
          <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name} ({group.slug})</option>
            ))}
          </select>
        </label>
      </div>

      {selectedGroupId ? (
        <div className="card settings-section" key={selectedGroupId}>
          <h3>Options du groupe : {groups.find((g) => g.id === selectedGroupId)?.name ?? ""}</h3>
          <form action={setOptionGroupMembersAction.bind(null, selectedGroupId)} className="options-fieldset">
            <p className="section-note">Cochez les options appartenant à ce groupe</p>
            {brands.map((brand) => {
              const brandOptions = options.filter((o) => o.brandId === brand.id);
              if (brandOptions.length === 0) return null;
              return (
                <fieldset key={brand.id} className="brand-option-group">
                  <legend>{brand.name}</legend>
                  {brandOptions.map((option) => (
                    <label key={option.id}>
                      <input
                        name="optionId"
                        type="checkbox"
                        value={option.id}
                        defaultChecked={memberOptionIds.includes(option.id)}
                      />
                      {" "}<strong>{option.code}</strong> — {option.description}
                    </label>
                  ))}
                </fieldset>
              );
            })}
            <button className="primary-button" type="submit">Enregistrer les associations</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
