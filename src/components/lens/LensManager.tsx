"use client";

import { useMemo, useState } from "react";
import type { Lens, LensFilters, LensReferenceData } from "@/lib/lens/types";
import { LensFiltersBar } from "./LensFiltersBar";
import { LensTable } from "./LensTable";
import { LensCard } from "./LensCard";
import { LensChart } from "./LensChart";
import { LensCompareTray } from "./LensCompareTray";
import { LensCompareTable } from "./LensCompareTable";
import { LensForm } from "./LensForm";
import { ReferenceManager } from "./ReferenceManager";

const defaultFilters: LensFilters = { query: "", brand: "", mount: "", option: "", sensorType: "", status: "", focalMin: "", focalMax: "", maxAperture: "" };

export function LensManager({ initialLenses, referenceData }: { initialLenses: Lens[]; referenceData: LensReferenceData }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [editingLens, setEditingLens] = useState<Lens | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const hiddenIdSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredLenses = useMemo(() => filterLenses(initialLenses, filters).filter((lens) => !hiddenIdSet.has(lens.id)), [initialLenses, filters, hiddenIdSet]);
  const selectedLenses = initialLenses.filter((lens) => selectedIdSet.has(lens.id));

  function toggleSelected(id: string) {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((value) => value !== id);
      if (ids.length >= 5) return ids;
      return [...ids, id];
    });
  }

  function hideLens(id: string) {
    setHiddenIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setSelectedIds((ids) => ids.filter((value) => value !== id));
  }

  return (
    <section className="manager-grid">
      <div className="toolbar card">
        <div>
          <h2>Inventaire</h2>
          <p>{filteredLenses.length} objectif(s) affiché(s) sur {initialLenses.length}</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>Ajouter un objectif</button>
      </div>

      <ReferenceManager referenceData={referenceData} />
      <LensFiltersBar filters={filters} setFilters={setFilters} referenceData={referenceData} onReset={() => { setFilters(defaultFilters); setHiddenIds([]); }} />

      <div className="desktop-only">
        <LensTable lenses={filteredLenses} selectedIds={selectedIds} onToggleSelected={toggleSelected} onEdit={setEditingLens} />
      </div>
      <div className="mobile-cards">
        {filteredLenses.map((lens) => <LensCard key={lens.id} lens={lens} selected={selectedIdSet.has(lens.id)} onToggleSelected={toggleSelected} onEdit={setEditingLens} />)}
      </div>

      <LensChart lenses={filteredLenses} selectedIds={selectedIds} onToggleSelected={toggleSelected} onHide={hideLens} />
      <LensCompareTable lenses={selectedLenses} />
      <LensCompareTray lenses={selectedLenses} onClear={() => setSelectedIds([])} />

      {showCreate ? <LensForm title="Ajouter un objectif" referenceData={referenceData} onClose={() => setShowCreate(false)} /> : null}
      {editingLens ? <LensForm title="Modifier l’objectif" lens={editingLens} referenceData={referenceData} onClose={() => setEditingLens(null)} /> : null}
    </section>
  );
}

function filterLenses(lenses: Lens[], filters: LensFilters) {
  const query = filters.query.trim().toLowerCase();
  return lenses.filter((lens) => {
    if (query && ![lens.label, lens.brand, lens.mount, lens.options.map((option) => `${option.code} ${option.description}`).join(" ")].join(" ").toLowerCase().includes(query)) return false;
    if (filters.brand && lens.brandId !== filters.brand) return false;
    if (filters.mount && lens.mountId !== filters.mount) return false;
    if (filters.option && !lens.options.some((option) => option.id === filters.option)) return false;
    if (filters.sensorType && lens.sensorType !== filters.sensorType) return false;
    if (filters.status === "favorite" && !lens.isFavorite) return false;
    if (filters.status === "next" && !lens.isNextPurchase) return false;
    if (filters.status === "owned" && !lens.isOwned) return false;
    if (filters.focalMin && lens.focalMaxMm < Number(filters.focalMin)) return false;
    if (filters.focalMax && lens.focalMinMm > Number(filters.focalMax)) return false;
    if (filters.maxAperture && Math.min(lens.maxApertureAtMinFocal, lens.maxApertureAtMaxFocal) > Number(filters.maxAperture)) return false;
    return true;
  });
}
