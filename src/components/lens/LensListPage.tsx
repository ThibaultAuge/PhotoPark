"use client";

import { useLensContext } from "@/components/lens/LensProvider";
import { LensFiltersBar } from "@/components/lens/LensFiltersBar";
import { LensTable } from "@/components/lens/LensTable";
import { LensCard } from "@/components/lens/LensCard";
import { LensCompareTable } from "@/components/lens/LensCompareTable";
import { LensCompareTray } from "@/components/lens/LensCompareTray";
import { LensForm } from "@/components/lens/LensForm";

export function LensListPage() {
  const {
    filters,
    setFilters,
    resetFilters,
    selectedIds,
    toggleSelected,
    clearSelection,
    editingLens,
    setEditingLens,
    showCreate,
    setShowCreate,
    initialLenses,
    filteredLenses,
    referenceData,
  } = useLensContext();

  const selectedLenses = initialLenses.filter((lens) => selectedIds.includes(lens.id));

  return (
    <section className="manager-grid">
      <div className="toolbar card">
        <div>
          <h2>Inventaire</h2>
          <p>{filteredLenses.length} objectif(s) affiché(s) sur {initialLenses.length}</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>Ajouter un objectif</button>
      </div>

      <LensFiltersBar
        filters={filters}
        setFilters={setFilters}
        referenceData={referenceData}
        onReset={resetFilters}
      />

      <div className="desktop-only">
        <LensTable lenses={filteredLenses} selectedIds={selectedIds} onToggleSelected={toggleSelected} onEdit={setEditingLens} />
      </div>
      <div className="mobile-cards">
        {filteredLenses.map((lens) => (
          <LensCard key={lens.id} lens={lens} selected={selectedIds.includes(lens.id)} onToggleSelected={toggleSelected} onEdit={setEditingLens} />
        ))}
      </div>

      <LensCompareTable lenses={selectedLenses} />
      <LensCompareTray lenses={selectedLenses} onClear={clearSelection} />

      {showCreate ? <LensForm title="Ajouter un objectif" referenceData={referenceData} onClose={() => setShowCreate(false)} /> : null}
      {editingLens ? <LensForm title="Modifier l'objectif" lens={editingLens} referenceData={referenceData} onClose={() => setEditingLens(null)} /> : null}
    </section>
  );
}
