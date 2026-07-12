"use client";

import React from "react";
import type { AccessoryFilters, AccessoryReferenceData, AccessoryTypeCategory } from "@/lib/accessory/types";
import { CollapsibleFilters } from "@/components/ui/CollapsibleFilters";

export function AccessoryFiltersBar({ filters, setFilters, referenceData, onReset, typeCategory }: { filters: AccessoryFilters; setFilters: (filters: AccessoryFilters) => void; referenceData: AccessoryReferenceData; onReset: () => void; typeCategory: AccessoryTypeCategory }) {
  const types = referenceData.types.filter((type) => type.category === typeCategory);
  const showFilterFields = typeCategory === "filter";
  const showOtherFields = typeCategory === "other";

  return (
    <CollapsibleFilters onReset={onReset}>
      <label>Recherche<input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder={showFilterFields ? "Marque, nom, force, notes..." : showOtherFields ? "Marque, nom, caractéristiques, notes..." : "Marque, nom, notes..."} /></label>
      <label>Marque<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Toutes</option>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Type<select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Tous</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
      <label>Statut<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as AccessoryFilters["status"] })}><option value="">Tous</option><option value="favorite">Favori</option><option value="next">À acheter</option><option value="owned">Possédé</option><option value="retired">Retiré</option></select></label>
      {showFilterFields ? (
        <>
          <label>Localisation<select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value as AccessoryFilters["location"] })}><option value="">Toutes</option><option value="mounted">Monté</option><option value="bag">Sac</option><option value="reserve">Réserve</option></select></label>
          <label>Liaison<select value={filters.mountType} onChange={(event) => setFilters({ ...filters, mountType: event.target.value as AccessoryFilters["mountType"] })}><option value="">Toutes</option><option value="threaded">Filetée</option><option value="magnetic">Magnétique</option></select></label>
        </>
      ) : showOtherFields ? null : (
        <>
          <label>Laptop<select value={filters.laptop} onChange={(event) => setFilters({ ...filters, laptop: event.target.value as AccessoryFilters["laptop"] })}><option value="">Tous</option><option value="yes">Oui</option><option value="no">Non</option></select></label>
          <label>Trépied<select value={filters.tripod} onChange={(event) => setFilters({ ...filters, tripod: event.target.value as AccessoryFilters["tripod"] })}><option value="">Tous</option><option value="yes">Oui</option><option value="no">Non</option></select></label>
        </>
      )}
    </CollapsibleFilters>
  );
}
