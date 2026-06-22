"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Lens, LensFilters, LensReferenceData } from "@/lib/lens/types";

export const defaultFilters: LensFilters = { query: "", brand: "", mount: "", option: "", sensorType: "", status: "", focalMin: "", focalMax: "", maxAperture: "" };

type LensContextValue = {
  filters: LensFilters;
  setFilters: (filters: LensFilters) => void;
  resetFilters: () => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  hiddenIds: string[];
  hideLens: (id: string) => void;
  editingLens: Lens | null;
  setEditingLens: (lens: Lens | null) => void;
  showCreate: boolean;
  setShowCreate: (show: boolean) => void;
  initialLenses: Lens[];
  filteredLenses: Lens[];
  referenceData: LensReferenceData;
};

const LensContext = createContext<LensContextValue | null>(null);

export function useLensContext() {
  const ctx = useContext(LensContext);
  if (!ctx) throw new Error("useLensContext must be used within a LensProvider");
  return ctx;
}

export function LensProvider({
  initialLenses,
  referenceData,
  children,
}: {
  initialLenses: Lens[];
  referenceData: LensReferenceData;
  children: React.ReactNode;
}) {
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [editingLens, setEditingLens] = useState<Lens | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const hiddenIdSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const filteredLenses = useMemo(
    () => filterLenses(initialLenses, filters).filter((lens) => !hiddenIdSet.has(lens.id)),
    [initialLenses, filters, hiddenIdSet]
  );

  function resetFilters() {
    setFilters(defaultFilters);
    setHiddenIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((value) => value !== id);
      if (ids.length >= 5) return ids;
      return [...ids, id];
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function hideLens(id: string) {
    setHiddenIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setSelectedIds((ids) => ids.filter((value) => value !== id));
  }

  const value = useMemo<LensContextValue>(
    () => ({
      filters,
      setFilters,
      resetFilters,
      selectedIds,
      toggleSelected,
      clearSelection,
      hiddenIds,
      hideLens,
      editingLens,
      setEditingLens,
      showCreate,
      setShowCreate,
      initialLenses,
      filteredLenses,
      referenceData,
    }),
    [
      filters,
      selectedIds,
      hiddenIds,
      editingLens,
      showCreate,
      initialLenses,
      filteredLenses,
      referenceData,
    ]
  );

  return <LensContext.Provider value={value}>{children}</LensContext.Provider>;
}

function filterLenses(lenses: Lens[], filters: LensFilters) {
  const query = filters.query.trim().toLowerCase();
  return lenses.filter((lens) => {
    if (
      query &&
      ![lens.label, lens.brand, lens.mount, lens.options.map((option) => `${option.code} ${option.description}`).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
      return false;
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
