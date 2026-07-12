"use client";

import React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { getAccessoryActiveLocation } from "@/lib/accessory/accessory-utils";
import type { Accessory, AccessoryFilters, AccessoryReferenceData, AccessoryTypeCategory } from "@/lib/accessory/types";

export const defaultAccessoryFilters: AccessoryFilters = {
  query: "",
  brand: "",
  type: "",
  status: "",
  laptop: "",
  tripod: "",
  location: "",
  mountType: "",
};

type AccessoryContextValue = {
  filters: AccessoryFilters;
  setFilters: (filters: AccessoryFilters) => void;
  resetFilters: () => void;
  detailAccessory: Accessory | null;
  setDetailAccessory: (accessory: Accessory | null) => void;
  editingAccessory: Accessory | null;
  setEditingAccessory: (accessory: Accessory | null) => void;
  showCreate: boolean;
  setShowCreate: (show: boolean) => void;
  initialAccessories: Accessory[];
  filteredAccessories: Accessory[];
  referenceData: AccessoryReferenceData;
};

const AccessoryContext = createContext<AccessoryContextValue | null>(null);

export function useAccessoryContext() {
  const context = useContext(AccessoryContext);
  if (!context) throw new Error("useAccessoryContext must be used within an AccessoryProvider");
  return context;
}

export function AccessoryProvider({ initialAccessories, referenceData, children }: { initialAccessories: Accessory[]; referenceData: AccessoryReferenceData; children: React.ReactNode }) {
  const [filters, setFilters] = useState(defaultAccessoryFilters);
  const [detailAccessory, setDetailAccessory] = useState<Accessory | null>(null);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filteredAccessories = useMemo(() => filterAccessories(initialAccessories, filters), [initialAccessories, filters]);

  const value = useMemo(() => ({
    filters,
    setFilters,
    resetFilters: () => setFilters(defaultAccessoryFilters),
    detailAccessory,
    setDetailAccessory,
    editingAccessory,
    setEditingAccessory,
    showCreate,
    setShowCreate,
    initialAccessories,
    filteredAccessories,
    referenceData,
  }), [detailAccessory, editingAccessory, filteredAccessories, filters, initialAccessories, referenceData, showCreate]);

  return <AccessoryContext.Provider value={value}>{children}</AccessoryContext.Provider>;
}

export function filterAccessories(accessories: Accessory[], filters: AccessoryFilters) {
  const query = filters.query.trim().toLowerCase();
  return accessories.filter((accessory) => {
    if (query && ![
      accessory.label,
      accessory.brand,
      accessory.type,
      accessory.capacityNotes ?? "",
      accessory.carryStyleNotes ?? "",
      accessory.filterStrength ?? "",
      accessory.specCapacity ?? "",
      accessory.specFormat ?? "",
      accessory.specConnection ?? "",
      accessory.specCompatibility ?? "",
      accessory.specPower ?? "",
      accessory.specColorModes ?? "",
      accessory.specVariant ?? "",
    ].join(" ").toLowerCase().includes(query)) return false;
    if (filters.brand && accessory.brandId !== filters.brand) return false;
    if (filters.type && accessory.typeId !== filters.type) return false;
    if (filters.status === "favorite" && !accessory.isFavorite) return false;
    if (filters.status === "next" && !accessory.isNextPurchase) return false;
    if (filters.status === "owned" && !accessory.isOwned) return false;
    if (filters.status === "retired" && !accessory.retired) return false;
    if (filters.laptop === "yes" && !accessory.fitsLaptop) return false;
    if (filters.laptop === "no" && accessory.fitsLaptop) return false;
    if (filters.tripod === "yes" && !accessory.fitsTripod) return false;
    if (filters.tripod === "no" && accessory.fitsTripod) return false;
    if (filters.location && getAccessoryActiveLocation(accessory) !== filters.location) return false;
    if (filters.mountType && accessory.rearMountType !== filters.mountType && accessory.frontMountType !== filters.mountType) return false;
    return true;
  });
}

export function sanitizeAccessoryFilters(filters: AccessoryFilters, typeCategory: AccessoryTypeCategory): AccessoryFilters {
  if (typeCategory === "bag") {
    return {
      ...filters,
      location: "",
      mountType: "",
    };
  }

  if (typeCategory === "other") {
    return {
      ...filters,
      laptop: "",
      tripod: "",
      location: "",
      mountType: "",
    };
  }

  return {
    ...filters,
    laptop: "",
    tripod: "",
  };
}
