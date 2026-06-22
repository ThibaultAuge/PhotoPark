import type { Lens } from "@/lib/lens/types";
import { formatApertureRange, formatFocalRange, getLensKind } from "@/lib/lens/lens-utils";

const rows: Array<[string, (lens: Lens) => string | number | boolean | null]> = [
  ["Marque", (l) => l.brand], ["Monture", (l) => l.mount], ["Capteur", (l) => l.sensorType === "FULL_FRAME" ? "Plein format" : "APS-C"],
  ["Type", (l) => getLensKind(l)], ["Focale", (l) => formatFocalRange(l)], ["Équiv. APS-C", (l) => formatFocalRange({ focalMinMm: l.apscFocalMinEquivalentMm, focalMaxMm: l.apscFocalMaxEquivalentMm })],
  ["Ouverture max", (l) => formatApertureRange(l)], ["Ouverture min", (l) => l.minAperture ? `f/${l.minAperture}` : "—"],
  ["Options", (l) => l.options.map((option) => option.code).join(" ") || "—"], ["Filtre", (l) => l.filterDiameterMm ? `${l.filterDiameterMm} mm` : "—"], ["Prix", (l) => l.priceEur ? `${l.priceEur} €` : "—"],
  ["Distance mini", (l) => l.minFocusDistanceM ? `${l.minFocusDistanceM} m` : "—"], ["Angle min/max", (l) => `${l.angleAtMinFocalDeg ?? "—"}° / ${l.angleAtMaxFocalDeg ?? "—"}°`],
  ["Diaphragme", (l) => l.apertureBlades ? `${l.apertureBlades} lames` : "—"], ["Groupes-lentilles", (l) => l.groupsCount && l.elementsCount ? `${l.groupsCount}-${l.elementsCount}` : "—"],
  ["Poids", (l) => l.weightG ? `${l.weightG} g` : "—"], ["Favori", (l) => l.isFavorite ? "Oui" : "Non"], ["Prochain achat", (l) => l.isNextPurchase ? "Oui" : "Non"], ["Possédé", (l) => l.isOwned ? "Oui" : "Non"]
];

export function LensCompareTable({ lenses }: { lenses: Lens[] }) {
  if (lenses.length < 2) return <section className="card"><h2>Comparaison</h2><p>Sélectionnez 2 à 5 objectifs pour comparer toutes leurs caractéristiques.</p></section>;
  return (
    <section className="card table-card">
      <h2>Comparaison</h2>
      <table className="compare-table"><thead><tr><th>Caractéristique</th>{lenses.map((lens) => <th key={lens.id}>{lens.label}</th>)}</tr></thead><tbody>{rows.map(([label, getter]) => { const values = lenses.map((lens) => String(getter(lens))); const differs = new Set(values).size > 1; return <tr key={label}><th>{label}</th>{values.map((value, index) => <td key={`${label}-${lenses[index].id}`}>{differs ? <strong>{value}</strong> : value}</td>)}</tr>; })}</tbody></table>
    </section>
  );
}
