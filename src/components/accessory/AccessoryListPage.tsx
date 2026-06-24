"use client";

import React from "react";
import { AccessoryCard } from "@/components/accessory/AccessoryCard";
import { AccessoryDetailModal } from "@/components/accessory/AccessoryDetailModal";
import { AccessoryFiltersBar } from "@/components/accessory/AccessoryFiltersBar";
import { AccessoryForm } from "@/components/accessory/AccessoryForm";
import { AccessoryTable } from "@/components/accessory/AccessoryTable";
import { useAccessoryContext } from "@/components/accessory/AccessoryProvider";

export function AccessoryListPage() {
  const {
    filters,
    setFilters,
    resetFilters,
    detailAccessory,
    setDetailAccessory,
    editingAccessory,
    setEditingAccessory,
    showCreate,
    setShowCreate,
    initialAccessories,
    filteredAccessories,
    referenceData,
  } = useAccessoryContext();

  function startEdit() {
    if (!detailAccessory) return;
    setDetailAccessory(null);
    setEditingAccessory(detailAccessory);
  }

  return (
    <section className="manager-grid">
      <div className="toolbar card">
        <div>
          <h2>Sacs & poches</h2>
          <p>{filteredAccessories.length} accessoire(s) affiché(s) sur {initialAccessories.length}</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>Ajouter un accessoire</button>
      </div>

      <AccessoryFiltersBar filters={filters} setFilters={setFilters} referenceData={referenceData} onReset={resetFilters} />

      <div className="desktop-only">
        <AccessoryTable accessories={filteredAccessories} onShowDetail={setDetailAccessory} onEdit={setEditingAccessory} />
      </div>

      <div className="mobile-cards">
        {filteredAccessories.map((accessory) => (
          <AccessoryCard key={accessory.id} accessory={accessory} onShowDetail={setDetailAccessory} onEdit={setEditingAccessory} />
        ))}
      </div>

      {detailAccessory ? <AccessoryDetailModal accessory={detailAccessory} onClose={() => setDetailAccessory(null)} onEdit={startEdit} /> : null}
      {showCreate ? <AccessoryForm title="Ajouter un accessoire" referenceData={referenceData} onClose={() => setShowCreate(false)} /> : null}
      {editingAccessory ? <AccessoryForm title="Modifier l'accessoire" referenceData={referenceData} accessory={editingAccessory} onClose={() => setEditingAccessory(null)} /> : null}
    </section>
  );
}
