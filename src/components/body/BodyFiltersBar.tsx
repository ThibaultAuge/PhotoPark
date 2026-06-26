"use client";

import React from "react";
import type { BodyFilters, BodyReferenceData } from "@/lib/body/types";

export function BodyFiltersBar({ filters, setFilters, referenceData, onReset }: { filters: BodyFilters; setFilters: (filters: BodyFilters) => void; referenceData: BodyReferenceData; onReset: () => void }) {
  return (
    <div className="filters card">
      <label>Recherche<input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Marque, nom, vidéo, notes..." /></label>
      <label>Marque<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Toutes</option>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Monture<select value={filters.mount} onChange={(event) => setFilters({ ...filters, mount: event.target.value })}><option value="">Toutes</option>{referenceData.mounts.map((mount) => <option key={mount.id} value={mount.id}>{mount.name}</option>)}</select></label>
      <label>Format<select value={filters.sensorFormat} onChange={(event) => setFilters({ ...filters, sensorFormat: event.target.value as BodyFilters["sensorFormat"] })}><option value="">Tous</option><option value="FULL_FRAME">Plein format</option><option value="APS_C">APS-C</option><option value="MICRO_FOUR_THIRDS">Micro 4/3</option><option value="MEDIUM_FORMAT">Moyen format</option><option value="OTHER">Autre</option></select></label>
      <label>Type<select value={filters.bodyType} onChange={(event) => setFilters({ ...filters, bodyType: event.target.value as BodyFilters["bodyType"] })}><option value="">Tous</option><option value="mirrorless">Hybride</option><option value="dslr">Reflex</option></select></label>
      <label>Statut<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as BodyFilters["status"] })}><option value="">Tous</option><option value="favorite">Favori</option><option value="next">À acheter</option><option value="owned">Possédé</option><option value="retired">Retiré</option></select></label>
      <div className="actions"><button className="ghost-button" type="button" onClick={onReset}>Réinitialiser</button></div>
    </div>
  );
}
