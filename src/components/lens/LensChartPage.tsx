"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useLensContext } from "@/components/lens/LensProvider";
import { LensFiltersBar } from "@/components/lens/LensFiltersBar";
import { LensChart } from "@/components/lens/LensChart";
import { LensComparePopup } from "@/components/lens/LensComparePopup";
import { LensForm } from "@/components/lens/LensForm";

export function LensChartPage() {
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

  // Lenses visible on the chart (checked in sidebar) — no limit
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggleChecked = useCallback((id: string) => {
    setCheckedIds((ids) =>
      ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id],
    );
  }, []);

  // Memoised derived arrays to avoid unnecessary re-renders of chart/compare
  const checkedLenses = useMemo(
    () => initialLenses.filter((lens) => checkedIds.includes(lens.id)),
    [initialLenses, checkedIds],
  );
  const selectedLenses = useMemo(
    () => initialLenses.filter((lens) => selectedIds.includes(lens.id)),
    [initialLenses, selectedIds],
  );

  // O(1) lookups for the render loop
  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);
  const selectedSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );

  return (
    <section className="chart-page-layout">
      {/* Left: 4/5 — chart showing checked lenses */}
      <div className="chart-page-main">
        <div className="toolbar card">
          <div>
            <h2>Carte optique</h2>
            <p>
              {checkedLenses.length} objectif(s) affiché(s) sur{" "}
              {initialLenses.length}
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => setShowCreate(true)}
          >
            Ajouter un objectif
          </button>
        </div>
        <LensChart
          lenses={checkedLenses}
          selectedIds={selectedIds}
          onToggleSelected={toggleSelected}
        />
      </div>

      {/* Right: 1/5 — filters + lens list with visibility + selection */}
      <aside className="chart-page-sidebar">
        <LensFiltersBar
          filters={filters}
          setFilters={setFilters}
          referenceData={referenceData}
          onReset={resetFilters}
        />
        <div className="chart-lens-list card">
          <div className="chart-lens-list-header">
            <h3>Objectifs</h3>
            <span className="chart-lens-count">{filteredLenses.length}</span>
          </div>
          {filteredLenses.length === 0 ? (
            <p className="empty-state">
              Aucun objectif ne correspond aux filtres.
            </p>
          ) : (
            <ul className="chart-lens-items">
              {filteredLenses.map((lens) => {
                const isChecked = checkedSet.has(lens.id);
                const isSelected = selectedSet.has(lens.id);
                return (
                  <li
                    key={lens.id}
                    className={`chart-lens-item${isChecked ? " checked" : ""}${isSelected ? " selected" : ""}`}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChecked(lens.id)}
                        title="Afficher sur le graphique"
                      />
                    </label>
                    <span
                      className="chart-lens-item-label"
                      onClick={() => toggleChecked(lens.id)}
                    >
                      {lens.label}
                    </span>
                    <button
                      type="button"
                      className={`chart-lens-compare-btn${isSelected ? " active" : ""}`}
                      onClick={() => toggleSelected(lens.id)}
                      title={
                        isSelected
                          ? "Retirer de la comparaison"
                          : "Ajouter à la comparaison"
                      }
                    >
                      {isSelected ? "★" : "☆"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Compare popup */}
      <LensComparePopup lenses={selectedLenses} onClear={clearSelection} optionGroups={referenceData.optionGroups} optionGroupMembers={referenceData.optionGroupMembers} />

      {/* Modals */}
      {showCreate ? (
        <LensForm
          title="Ajouter un objectif"
          referenceData={referenceData}
          onClose={() => setShowCreate(false)}
        />
      ) : null}
      {editingLens ? (
        <LensForm
          title="Modifier l'objectif"
          lens={editingLens}
          referenceData={referenceData}
          onClose={() => setEditingLens(null)}
        />
      ) : null}
    </section>
  );
}
