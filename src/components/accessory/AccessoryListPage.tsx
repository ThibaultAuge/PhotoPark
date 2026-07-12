"use client";

import React from "react";
import { useEffect, useRef } from "react";
import { AccessoryCard } from "@/components/accessory/AccessoryCard";
import { AccessoryDetailModal } from "@/components/accessory/AccessoryDetailModal";
import { AccessoryFiltersBar } from "@/components/accessory/AccessoryFiltersBar";
import { AccessoryForm } from "@/components/accessory/AccessoryForm";
import { AccessoryTable } from "@/components/accessory/AccessoryTable";
import { filterAccessories, sanitizeAccessoryFilters, useAccessoryContext } from "@/components/accessory/AccessoryProvider";
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
    referenceData,
  } = useAccessoryContext();
  const previousTypeCategoryRef = useRef(typeCategory);
  const [hasHydratedSharedUiState, setHasHydratedSharedUiState] = React.useState(false);
  const categoryChanged = previousTypeCategoryRef.current !== typeCategory;
  if (categoryChanged) previousTypeCategoryRef.current = typeCategory;

  const sanitizedFilters = React.useMemo(() => sanitizeAccessoryFilters(filters, typeCategory), [filters, typeCategory]);
  const scopedInitialAccessories = React.useMemo(
    () => initialAccessories.filter((accessory) => accessory.typeCategory === typeCategory),
    [initialAccessories, typeCategory],
  );
  const scopedFilteredAccessories = React.useMemo(
    () => filterAccessories(scopedInitialAccessories, sanitizedFilters),
    [sanitizedFilters, scopedInitialAccessories],
  );
  const lensLabels = React.useMemo(
    () => new Map(referenceData.lenses.map((lens) => [lens.id, lens.label])),
    [referenceData.lenses],
  );
  const accessoryMountIndex = React.useMemo(
    () => new Map(scopedInitialAccessories.map((accessory) => [accessory.id, { mountedOnLensId: accessory.mountedOnLensId, mountedOnAccessoryId: accessory.mountedOnAccessoryId }])),
    [scopedInitialAccessories],
  );
  const title = typeCategory === "filter" ? "Filtres & bagues" : typeCategory === "other" ? "Autres accessoires" : "Sacs & poches";
  const createLabel = typeCategory === "filter" ? "Ajouter une pièce" : "Ajouter un accessoire";

  useEffect(() => {
    if (JSON.stringify(sanitizedFilters) !== JSON.stringify(filters)) setFilters(sanitizedFilters);
  }, [filters, sanitizedFilters, setFilters]);

  function setCategoryFilters(nextFilters: typeof filters) {
    setFilters(sanitizeAccessoryFilters(nextFilters, typeCategory));
  }

  useEffect(() => {
    setDetailAccessory(null);
    setEditingAccessory(null);
    setShowCreate(false);
    setHasHydratedSharedUiState(true);
  }, [setDetailAccessory, setEditingAccessory, setShowCreate, typeCategory]);

  function startEdit() {
    if (!detailAccessory || detailAccessory.typeCategory !== typeCategory) return;
    setDetailAccessory(null);
    setEditingAccessory(detailAccessory);
  }

  const scopedDetailAccessory = detailAccessory?.typeCategory === typeCategory ? detailAccessory : null;
  const scopedEditingAccessory = editingAccessory?.typeCategory === typeCategory ? editingAccessory : null;
  const canRenderSharedUi = hasHydratedSharedUiState && !categoryChanged;

  return (
    <section className="manager-grid">
      <div className="toolbar card">
        <div>
          <h2>{title}</h2>
          <p>{scopedFilteredAccessories.length} accessoire(s) affiché(s) sur {scopedInitialAccessories.length}</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>{createLabel}</button>
      </div>

      <AccessoryFiltersBar filters={sanitizedFilters} setFilters={setCategoryFilters} referenceData={referenceData} onReset={resetFilters} typeCategory={typeCategory} />

      {typeCategory === "filter" ? <FilterAssemblyAssistant accessories={scopedInitialAccessories} lenses={referenceData.lenses} /> : null}

      <div className="desktop-only">
        <AccessoryTable accessories={scopedFilteredAccessories} lensLabels={lensLabels} accessoryMountIndex={accessoryMountIndex} typeCategory={typeCategory} showFilterColumns={typeCategory === "filter"} onShowDetail={setDetailAccessory} onEdit={setEditingAccessory} />
      </div>

      <div className="mobile-cards">
        {scopedFilteredAccessories.map((accessory) => (
          <AccessoryCard key={accessory.id} accessory={accessory} lensLabels={lensLabels} accessoryMountIndex={accessoryMountIndex} onShowDetail={setDetailAccessory} onEdit={setEditingAccessory} />
        ))}
      </div>

      {canRenderSharedUi && scopedDetailAccessory ? <AccessoryDetailModal accessory={scopedDetailAccessory} accessories={scopedInitialAccessories} lenses={referenceData.lenses} onClose={() => setDetailAccessory(null)} onEdit={startEdit} /> : null}
      {canRenderSharedUi && showCreate ? <AccessoryForm title={createLabel} referenceData={referenceData} typeCategory={typeCategory} accessories={scopedInitialAccessories} onClose={() => setShowCreate(false)} /> : null}
      {canRenderSharedUi && scopedEditingAccessory ? <AccessoryForm title="Modifier l'accessoire" referenceData={referenceData} typeCategory={typeCategory} accessory={scopedEditingAccessory} accessories={scopedInitialAccessories} onClose={() => setEditingAccessory(null)} /> : null}
    </section>
  );
}
