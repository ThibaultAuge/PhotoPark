import type { Lens } from "@/lib/lens/types";

export function LensChart({ lenses, selectedIds, onToggleSelected, onHide }: { lenses: Lens[]; selectedIds: string[]; onToggleSelected: (id: string) => void; onHide: (id: string) => void }) {
  const width = 820;
  const height = 360;
  const margin = 46;
  const maxFocal = Math.max(200, ...lenses.map((lens) => lens.focalMaxMm));
  const minAperture = Math.min(1, ...lenses.map((lens) => Math.min(lens.maxApertureAtMinFocal, lens.maxApertureAtMaxFocal)));
  const maxAperture = Math.max(8, ...lenses.map((lens) => Math.max(lens.maxApertureAtMinFocal, lens.maxApertureAtMaxFocal)));
  const x = (focal: number) => margin + (focal / maxFocal) * (width - margin * 1.6);
  const y = (aperture: number) => height - margin - ((aperture - minAperture) / (maxAperture - minAperture || 1)) * (height - margin * 1.8);

  return (
    <section className="card chart-card">
      <div className="section-title"><div><h2>Carte optique</h2><p>Cliquez sur une ligne ou un point pour sélectionner l’objectif. Le bouton × le masque de la vue courante.</p></div></div>
      <div className="chart-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Graphique des objectifs par focale et ouverture maximale">
          <line x1={margin} y1={height - margin} x2={width - margin / 2} y2={height - margin} className="axis" />
          <line x1={margin} y1={margin / 2} x2={margin} y2={height - margin} className="axis" />
          <text x={width / 2} y={height - 8} className="axis-label">Focale (mm)</text>
          <text x={8} y={24} className="axis-label">Ouverture f/</text>
          {[24, 35, 50, 70, 100, 135, 200, 300, 400].filter((tick) => tick <= maxFocal).map((tick) => <g key={tick}><line x1={x(tick)} y1={height - margin} x2={x(tick)} y2={height - margin + 5} className="axis" /><text x={x(tick) - 8} y={height - 24} className="tick">{tick}</text></g>)}
          {[1.4, 2, 2.8, 4, 5.6, 8].filter((tick) => tick >= minAperture && tick <= maxAperture).map((tick) => <g key={tick}><line x1={margin - 5} y1={y(tick)} x2={margin} y2={y(tick)} className="axis" /><text x={10} y={y(tick) + 4} className="tick">f/{tick}</text></g>)}
          {lenses.map((lens, index) => {
            const selected = selectedIds.includes(lens.id);
            const color = selected ? "#f97316" : palette[index % palette.length];
            const x1 = x(lens.focalMinMm); const x2 = x(lens.focalMaxMm); const y1 = y(lens.maxApertureAtMinFocal); const y2 = y(lens.maxApertureAtMaxFocal);
            return <g key={lens.id} className="chart-item"><title>{lens.label}</title><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={selected ? 5 : 3} strokeLinecap="round" onClick={() => onToggleSelected(lens.id)} /><circle cx={x1} cy={y1} r={selected ? 7 : 5} fill={color} onClick={() => onToggleSelected(lens.id)} />{x1 !== x2 ? <circle cx={x2} cy={y2} r={selected ? 7 : 5} fill={color} onClick={() => onToggleSelected(lens.id)} /> : null}<text x={Math.min(x1, x2) + 6} y={Math.min(y1, y2) - 8} className="chart-label">{lens.label}</text><text x={Math.max(x1, x2) + 6} y={Math.max(y1, y2) + 4} className="hide-label" onClick={() => onHide(lens.id)}>×</text></g>;
          })}
        </svg>
      </div>
    </section>
  );
}

const palette = ["#2563eb", "#16a34a", "#9333ea", "#dc2626", "#0891b2", "#ca8a04", "#4f46e5"];
