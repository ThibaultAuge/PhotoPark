"use client";

import React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { Body, BodyFilters, BodyReferenceData } from "@/lib/body/types";

export const defaultBodyFilters: BodyFilters = {
  query: "",
  brand: "",
  mount: "",
  sensorFormat: "",
  bodyType: "",
  status: "",
};

type BodyContextValue = {
  filters: BodyFilters;
  setFilters: (filters: BodyFilters) => void;
  resetFilters: () => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  detailBody: Body | null;
  setDetailBody: (body: Body | null) => void;
  editingBody: Body | null;
  setEditingBody: (body: Body | null) => void;
  showCreate: boolean;
  setShowCreate: (show: boolean) => void;
  initialBodies: Body[];
  filteredBodies: Body[];
  referenceData: BodyReferenceData;
};

const BodyContext = createContext<BodyContextValue | null>(null);

export function useBodyContext() {
  const context = useContext(BodyContext);
  if (!context) throw new Error("useBodyContext must be used within a BodyProvider");
  return context;
}

export function BodyProvider({ initialBodies, referenceData, children }: { initialBodies: Body[]; referenceData: BodyReferenceData; children: React.ReactNode }) {
  const [filters, setFilters] = useState(defaultBodyFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailBody, setDetailBody] = useState<Body | null>(null);
  const [editingBody, setEditingBody] = useState<Body | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filteredBodies = useMemo(() => filterBodies(initialBodies, filters), [initialBodies, filters]);

  function toggleSelected(id: string) {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((value) => value !== id);
      if (ids.length >= 5) return ids;
      return [...ids, id];
    });
  }

  const value = useMemo(() => ({
    filters,
    setFilters,
    resetFilters: () => setFilters(defaultBodyFilters),
    selectedIds,
    toggleSelected,
    clearSelection: () => setSelectedIds([]),
    detailBody,
    setDetailBody,
    editingBody,
    setEditingBody,
    showCreate,
    setShowCreate,
    initialBodies,
    filteredBodies,
    referenceData,
  }), [detailBody, editingBody, filteredBodies, filters, initialBodies, referenceData, selectedIds, showCreate]);

  return <BodyContext.Provider value={value}>{children}</BodyContext.Provider>;
}

export function filterBodies(bodies: Body[], filters: BodyFilters) {
  const query = filters.query.trim().toLowerCase();
  return bodies.filter((body) => {
    if (query && ![body.label, body.brand, body.mount ?? "", body.videoSpecs ?? "", body.notes ?? ""].join(" ").toLowerCase().includes(query)) return false;
    if (filters.brand && body.brandId !== filters.brand) return false;
    if (filters.mount && body.mountId !== filters.mount) return false;
    if (filters.sensorFormat && body.sensorFormat !== filters.sensorFormat) return false;
    if (filters.bodyType && body.bodyType !== filters.bodyType) return false;
    if (filters.status === "favorite" && !body.isFavorite) return false;
    if (filters.status === "next" && !body.isNextPurchase) return false;
    if (filters.status === "owned" && !body.isOwned) return false;
    if (filters.status === "retired" && !body.retired) return false;
    return true;
  });
}
