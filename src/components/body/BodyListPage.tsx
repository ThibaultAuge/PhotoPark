"use client";

import { useMemo } from "react";
import { BodyCard } from "@/components/body/BodyCard";
import { BodyComparePopup } from "@/components/body/BodyComparePopup";
import { BodyDetailModal } from "@/components/body/BodyDetailModal";
import { BodyFiltersBar } from "@/components/body/BodyFiltersBar";
import { BodyForm } from "@/components/body/BodyForm";
import { BodyTable } from "@/components/body/BodyTable";
import { useBodyContext } from "@/components/body/BodyProvider";

export function BodyListPage() {
  const {
    filters,
    setFilters,
    resetFilters,
    selectedIds,
    toggleSelected,
    clearSelection,
    detailBody,
    setDetailBody,
    editingBody,
    setEditingBody,
    showCreate,
    setShowCreate,
    initialBodies,
    filteredBodies,
    referenceData,
  } = useBodyContext();

  const selectedBodies = useMemo(() => initialBodies.filter((body) => selectedIds.includes(body.id)), [initialBodies, selectedIds]);

  function startEdit() {
    if (!detailBody) return;
    setDetailBody(null);
    setEditingBody(detailBody);
  }

  return (
    <section className="manager-grid">
      <div className="toolbar card">
        <div>
          <h2>Boîtiers</h2>
          <p>{filteredBodies.length} boîtier(s) affiché(s) sur {initialBodies.length}</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>Ajouter un boîtier</button>
      </div>

      <BodyFiltersBar filters={filters} setFilters={setFilters} referenceData={referenceData} onReset={resetFilters} />

      <div className="desktop-only">
        <BodyTable bodies={filteredBodies} selectedIds={selectedIds} onToggleSelected={toggleSelected} onShowDetail={setDetailBody} onEdit={setEditingBody} />
      </div>

      <div className="mobile-cards">
        {filteredBodies.map((body) => <BodyCard key={body.id} body={body} selected={selectedIds.includes(body.id)} onToggleSelected={toggleSelected} onShowDetail={setDetailBody} onEdit={setEditingBody} />)}
      </div>

      <BodyComparePopup bodies={selectedBodies} onClear={clearSelection} />

      {detailBody ? <BodyDetailModal body={detailBody} onClose={() => setDetailBody(null)} onEdit={startEdit} /> : null}
      {showCreate ? <BodyForm title="Ajouter un boîtier" referenceData={referenceData} onClose={() => setShowCreate(false)} /> : null}
      {editingBody ? <BodyForm title="Modifier le boîtier" referenceData={referenceData} body={editingBody} onClose={() => setEditingBody(null)} /> : null}
    </section>
  );
}
