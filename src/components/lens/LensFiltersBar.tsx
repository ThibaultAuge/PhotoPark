"use client";

import React from "react";
import type { LensFilters, LensReferenceData } from "@/lib/lens/types";
import { DualRangeSlider } from "@/components/lens/DualRangeSlider";
import { FOCAL_FILTER_MAX } from "@/lib/lens/filter-constants";

export function LensFiltersBar({ filters, setFilters, referenceData, onReset }: { filters: LensFilters; setFilters: (filters: LensFilters) => void; referenceData: LensReferenceData; onReset: () => void }) {
  const formatFocalLowValue = (value: number) => `${value} mm`;
  const formatFocalHighValue = (value: number) => (value >= FOCAL_FILTER_MAX ? `${FOCAL_FILTER_MAX}+ mm` : `${value} mm`);

  return (
    <div className="filters card">
      <label>Recherche<input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Canon RF 70-200..." /></label>
      <label>Marque<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Toutes</option>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Monture<select value={filters.mount} onChange={(event) => setFilters({ ...filters, mount: event.target.value })}><option value="">Toutes</option>{referenceData.mounts.map((mount) => <option key={mount.id} value={mount.id}>{mount.name}</option>)}</select></label>
      <label>Type<select value={filters.kind} onChange={(event) => setFilters({ ...filters, kind: event.target.value as LensFilters["kind"] })}><option value="">Tous</option><option value="prime">Fixe</option><option value="zoom">Zoom</option></select></label>
      <label>Option<select value={filters.option} onChange={(event) => setFilters({ ...filters, option: event.target.value })}><option value="">Toutes</option>{referenceData.options.map((option) => <option key={option.id} value={option.id}>{option.code}</option>)}</select></label>
      <label>Statut<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as LensFilters["status"] })}><option value="">Tous</option><option value="owned">Possédé</option><option value="favorite">Favori</option><option value="next">Prochain achat</option></select></label>
      <div className="filter-sliders">
        <DualRangeSlider label="Focale min" min={0} max={FOCAL_FILTER_MAX} low={filters.focalMinLow} high={filters.focalMinHigh} step={1} formatLowValue={formatFocalLowValue} formatHighValue={formatFocalHighValue} onChange={(range) => setFilters({ ...filters, focalMinLow: range.low, focalMinHigh: range.high })} />
        <DualRangeSlider label="Focale max" min={0} max={FOCAL_FILTER_MAX} low={filters.focalMaxLow} high={filters.focalMaxHigh} step={1} formatLowValue={formatFocalLowValue} formatHighValue={formatFocalHighValue} onChange={(range) => setFilters({ ...filters, focalMaxLow: range.low, focalMaxHigh: range.high })} />
        <DualRangeSlider label="Ouverture à focale min" min={1} max={30} low={filters.apertureAtMinLow} high={filters.apertureAtMinHigh} step={0.1} formatValue={(v) => `f/${v}`} onChange={(range) => setFilters({ ...filters, apertureAtMinLow: range.low, apertureAtMinHigh: range.high })} />
        <DualRangeSlider label="Ouverture à focale max" min={1} max={30} low={filters.apertureAtMaxLow} high={filters.apertureAtMaxHigh} step={0.1} formatValue={(v) => `f/${v}`} onChange={(range) => setFilters({ ...filters, apertureAtMaxLow: range.low, apertureAtMaxHigh: range.high })} />
      </div>
      <button className="ghost-button" onClick={onReset}>Réinitialiser</button>
    </div>
  );
}
