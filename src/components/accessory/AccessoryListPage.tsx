"use client";

import React from "react";
import { useEffect } from "react";
import { AccessoryCard } from "@/components/accessory/AccessoryCard";
import { AccessoryDetailModal } from "@/components/accessory/AccessoryDetailModal";
import { AccessoryFiltersBar } from "@/components/accessory/AccessoryFiltersBar";
import { AccessoryForm } from "@/components/accessory/AccessoryForm";
import { AccessoryTable } from "@/components/accessory/AccessoryTable";
import { sanitizeAccessoryFilters, useAccessoryContext } from "@/components/accessory/AccessoryProvider";
import { FilterAssemblyAssistant } from "@/components/accessory/FilterAssemblyAssistant";
import type { AccessoryTypeCategory } from "@/lib/accessory/types";

export function AccessoryListPage({ typeCategory = "bag" }: { typeCategory?: AccessoryTypeCategory }) {
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

  const scopedInitialAccessories = React.useMemo(
    () => initialAccessories.filter((accessory) => accessory.typeCategory === typeCategory),
    [initialAccessories, typeCategory],
  );
  const scopedFilteredAccessories = React.useMemo(
    () => filteredAccessories.filter((accessory) => accessory.typeCategory === typeCategory),
    [filteredAccessories, typeCategory],
  );
  const lensLabels = React.useMemo(
    () => new Map(referenceData.lenses.map((lens) => [lens.id, lens.label])),
    [referenceData.lenses],
  );
  const accessoryMountIndex = React.useMemo(
    () => new Map(scopedInitialAccessories.map((accessory) => [accessory.id, { mountedOnLensId: accessory.mountedOnLensId, mountedOnAccessoryId: accessory.mountedOnAccessoryId }])),
    [scopedInitialAccessories],
  );
  const title = typeCategory === "filter" ? "Filtres & bagues" : "Sacs & poches";
  const createLabel = typeCategory === "filter" ? "Ajouter une pièce" : "Ajouter un accessoire";

  useEffect(() => {
    const sanitized = sanitizeAccessoryFilters(filters, typeCategory);
    if (JSON.stringify(sanitized) !== JSON.stringify(filters)) setFilters(sanitized);
  }, [filters, setFilters, typeCategory]);

  function startEdit() {
    if (!detailAccessory) return;
    setDetailAccessory(null);
    setEditingAccessory(detailAccessory);
  }

  return (
    <section className="manager-grid">
      <div className="toolbar card">
        <div>
          <h2>{title}</h2>
          <p>{scopedFilteredAccessories.length} accessoire(s) affiché(s) sur {scopedInitialAccessories.length}</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>{createLabel}</button>
      </div>

      <AccessoryFiltersBar filters={filters} setFilters={setFilters} referenceData={referenceData} onReset={resetFilters} typeCategory={typeCategory} />

      {typeCategory === "filter" ? <FilterAssemblyAssistant accessories={scopedInitialAccessories} lenses={referenceData.lenses} /> : null}

      <div className="desktop-only">
        <AccessoryTable accessories={scopedFilteredAccessories} lensLabels={lensLabels} accessoryMountIndex={accessoryMountIndex} showFilterColumns={typeCategory === "filter"} onShowDetail={setDetailAccessory} onEdit={setEditingAccessory} />
      </div>

      <div className="mobile-cards">
        {scopedFilteredAccessories.map((accessory) => (
          <AccessoryCard key={accessory.id} accessory={accessory} lensLabels={lensLabels} accessoryMountIndex={accessoryMountIndex} onShowDetail={setDetailAccessory} onEdit={setEditingAccessory} />
        ))}
      </div>

      {detailAccessory ? <AccessoryDetailModal accessory={detailAccessory} accessories={scopedInitialAccessories} lenses={referenceData.lenses} onClose={() => setDetailAccessory(null)} onEdit={startEdit} /> : null}
      {showCreate ? <AccessoryForm title={createLabel} referenceData={referenceData} typeCategory={typeCategory} accessories={scopedInitialAccessories} onClose={() => setShowCreate(false)} /> : null}
      {editingAccessory ? <AccessoryForm title="Modifier l'accessoire" referenceData={referenceData} typeCategory={typeCategory} accessory={editingAccessory} accessories={scopedInitialAccessories} onClose={() => setEditingAccessory(null)} /> : null}
    </section>
  );
}
