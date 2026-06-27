"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getLensAccessoryCompatibility } from "@/lib/accessory/filter-compatibility";
import type { Accessory, AccessoryLensReference } from "@/lib/accessory/types";

export function FilterAssemblyAssistant({ accessories, lenses }: { accessories: Accessory[]; lenses: AccessoryLensReference[] }) {
  const eligibleLenses = useMemo(
    () => lenses.filter((lens) => (lens.isOwned || lens.isFavorite || lens.isNextPurchase) && !lens.retired),
    [lenses],
  );
  const [lensId, setLensId] = useState(eligibleLenses[0]?.id ?? "");
  // Sync lensId when eligibleLenses changes (e.g. lenses prop updates)
  useEffect(() => {
    setLensId((prev) => (eligibleLenses.some((l) => l.id === prev) ? prev : eligibleLenses[0]?.id ?? ""));
  }, [eligibleLenses]);
  const lens = useMemo(() => eligibleLenses.find((item) => item.id === lensId) ?? null, [lensId, eligibleLenses]);
  const compatibility = lens ? getLensAccessoryCompatibility(lens, accessories) : null;

  return (
    <section className="card filter-assistant-card">
      <div className="toolbar">
        <div>
          <h2>Assistant de montage</h2>
          <p>Visualise la pile actuelle et les montages possibles par objectif.</p>
        </div>
      </div>
      <div className="filter-assistant-controls">
        <label>
          Objectif
          <select value={lensId} onChange={(event) => setLensId(event.target.value)}>
            {eligibleLenses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      {!lens || !compatibility ? <p className="empty-state">Aucun objectif éligible (possédé, favori ou à acheter, non retiré).</p> : (
        <div className="filter-assistant-grid">
          <AssistantBlock title="Pile montée" items={compatibility.mounted.map((item) => item.name)} emptyLabel={compatibility.blockedReason ?? "Aucune pièce montée."} />
          <AssistantBlock title="Montage immédiat" items={compatibility.available.map((item) => item.labels.join(" → "))} emptyLabel="Aucun montage immédiat." />
          <AssistantBlock title="Montage avec déplacement" items={compatibility.moveRequired.map((item) => item.labels.join(" → "))} emptyLabel="Aucun déplacement suggéré." />
        </div>
      )}
    </section>
  );
}

function AssistantBlock({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="detail-item detail-item-full">
      <strong>{title}</strong>
      {items.length === 0 ? <span>{emptyLabel}</span> : (
        <ul className="filter-assembly-list">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
