"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Lens, LensFilters, LensReferenceData } from "@/lib/lens/types";
import { FOCAL_FILTER_MAX } from "@/lib/lens/filter-constants";
import { isPrimeLens } from "@/lib/lens/lens-utils";

export const defaultFilters: LensFilters = {
  query: "", brand: "", mount: "", option: "", kind: "", status: "",
  focalMinLow: 0, focalMinHigh: FOCAL_FILTER_MAX,
  focalMaxLow: 0, focalMaxHigh: FOCAL_FILTER_MAX,
  apertureAtMinLow: 1, apertureAtMinHigh: 30,
  apertureAtMaxLow: 1, apertureAtMaxHigh: 30,
};

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

export function filterLenses(lenses: Lens[], filters: LensFilters) {
  const query = filters.query.trim().toLowerCase();
  const hasOpenEndedFocalMinHigh = filters.focalMinHigh >= FOCAL_FILTER_MAX;
  const hasOpenEndedFocalMaxHigh = filters.focalMaxHigh >= FOCAL_FILTER_MAX;

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
    if (filters.kind === "prime" && !isPrimeLens(lens)) return false;
    if (filters.kind === "zoom" && isPrimeLens(lens)) return false;
    if (filters.status === "favorite" && !lens.isFavorite) return false;
    if (filters.status === "next" && !lens.isNextPurchase) return false;
    if (filters.status === "owned" && !lens.isOwned) return false;
    // Focale min : focalMinMm doit être dans [focalMinLow, focalMinHigh]
    if (lens.focalMinMm < filters.focalMinLow) return false;
    if (!hasOpenEndedFocalMinHigh && lens.focalMinMm > filters.focalMinHigh) return false;
    // Focale max : focalMaxMm doit être dans [focalMaxLow, focalMaxHigh]
    if (lens.focalMaxMm < filters.focalMaxLow) return false;
    if (!hasOpenEndedFocalMaxHigh && lens.focalMaxMm > filters.focalMaxHigh) return false;
    // Ouverture à focale min : maxApertureAtMinFocal dans [apertureAtMinLow, apertureAtMinHigh]
    if (lens.maxApertureAtMinFocal < filters.apertureAtMinLow) return false;
    if (lens.maxApertureAtMinFocal > filters.apertureAtMinHigh) return false;
    // Ouverture à focale max : maxApertureAtMaxFocal dans [apertureAtMaxLow, apertureAtMaxHigh]
    if (lens.maxApertureAtMaxFocal < filters.apertureAtMaxLow) return false;
    if (lens.maxApertureAtMaxFocal > filters.apertureAtMaxHigh) return false;
    return true;
  });
}
