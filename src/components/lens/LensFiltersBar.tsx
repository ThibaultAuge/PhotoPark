import type { LensFilters, LensReferenceData } from "@/lib/lens/types";

export function LensFiltersBar({ filters, setFilters, referenceData, onReset }: { filters: LensFilters; setFilters: (filters: LensFilters) => void; referenceData: LensReferenceData; onReset: () => void }) {
  return (
    <div className="filters card">
      <label>Recherche<input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Canon RF 70-200..." /></label>
      <label>Marque<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}><option value="">Toutes</option>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Monture<select value={filters.mount} onChange={(event) => setFilters({ ...filters, mount: event.target.value })}><option value="">Toutes</option>{referenceData.mounts.map((mount) => <option key={mount.id} value={mount.id}>{mount.name}</option>)}</select></label>
      <label>Option<select value={filters.option} onChange={(event) => setFilters({ ...filters, option: event.target.value })}><option value="">Toutes</option>{referenceData.options.map((option) => <option key={option.id} value={option.id}>{option.code}</option>)}</select></label>
      <label>Capteur<select value={filters.sensorType} onChange={(event) => setFilters({ ...filters, sensorType: event.target.value as LensFilters["sensorType"] })}><option value="">Tous</option><option value="FULL_FRAME">Plein format</option><option value="APS_C">APS-C</option></select></label>
      <label>Statut<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as LensFilters["status"] })}><option value="">Tous</option><option value="owned">Possédé</option><option value="favorite">Favori</option><option value="next">Prochain achat</option></select></label>
      <label>Focale min<input type="number" value={filters.focalMin} onChange={(event) => setFilters({ ...filters, focalMin: event.target.value })} /></label>
      <label>Focale max<input type="number" value={filters.focalMax} onChange={(event) => setFilters({ ...filters, focalMax: event.target.value })} /></label>
      <label>Ouverture ≤<input type="number" step="0.1" value={filters.maxAperture} onChange={(event) => setFilters({ ...filters, maxAperture: event.target.value })} /></label>
      <button className="ghost-button" onClick={onReset}>Réinitialiser</button>
    </div>
  );
}
