"use client";

import React from "react";
import type { AccessoryFilters, AccessoryReferenceData } from "@/lib/accessory/types";

export function AccessoryFiltersBar({ filters, setFilters, referenceData, onReset }: { filters: AccessoryFilters; setFilters: (filters: AccessoryFilters) => void; referenceData: AccessoryReferenceData; onReset: () => void }) {
  return (
    <div className="filters card">
      <label>Recherche<input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Marque, nom, notes..." /></label>
      <label>Marque<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Toutes</option>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Type<select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Tous</option>{referenceData.types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
      <label>Statut<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as AccessoryFilters["status"] })}><option value="">Tous</option><option value="favorite">Favori</option><option value="next">À acheter</option><option value="owned">Possédé</option><option value="retired">Retiré</option></select></label>
      <label>Laptop<select value={filters.laptop} onChange={(event) => setFilters({ ...filters, laptop: event.target.value as AccessoryFilters["laptop"] })}><option value="">Tous</option><option value="yes">Oui</option><option value="no">Non</option></select></label>
      <label>Trépied<select value={filters.tripod} onChange={(event) => setFilters({ ...filters, tripod: event.target.value as AccessoryFilters["tripod"] })}><option value="">Tous</option><option value="yes">Oui</option><option value="no">Non</option></select></label>
      <div className="actions"><button className="ghost-button" type="button" onClick={onReset}>Réinitialiser</button></div>
    </div>
  );
}
