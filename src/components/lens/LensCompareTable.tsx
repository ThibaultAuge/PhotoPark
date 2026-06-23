import React from "react";
import type { Lens, OptionGroup, OptionGroupMember } from "@/lib/lens/types";
import { formatApertureRange, formatFocalRange, getLensKind } from "@/lib/lens/lens-utils";

const rows: Array<[string, (lens: Lens) => string | number | boolean | null]> = [
  ["Marque", (l) => l.brand], ["Monture", (l) => l.mount], ["Capteur", (l) => l.sensorType === "FULL_FRAME" ? "Plein format" : "APS-C"],
  ["Type", (l) => getLensKind(l)], ["Focale", (l) => formatFocalRange(l)], ["Équiv. APS-C", (l) => formatFocalRange({ focalMinMm: l.apscFocalMinEquivalentMm, focalMaxMm: l.apscFocalMaxEquivalentMm })],
  ["Ouverture max", (l) => formatApertureRange(l)], ["Ouverture min", (l) => { const min = [l.minApertureAtMinFocal, l.minApertureAtMaxFocal].filter(Boolean); return min.length ? `f/${min.join(" / f/")}` : "—"; }],
  ["Options", (l) => l.options.map((option) => option.code).join(" ") || "—"], ["Filtre", (l) => l.filterDiameterMm ? `${l.filterDiameterMm} mm` : "—"], ["Prix", (l) => l.priceEur ? `${l.priceEur} €` : "—"],
  ["Distance mini", (l) => l.minFocusDistanceM ? `${l.minFocusDistanceM} m` : "—"], ["Angle min/max", (l) => `${l.angleAtMinFocalDeg ?? "—"}° / ${l.angleAtMaxFocalDeg ?? "—"}°`],
  ["Diaphragme", (l) => l.apertureBlades ? `${l.apertureBlades} lames` : "—"], ["Formule optique", (l) => l.opticalFormula || "—"],
  ["Poids", (l) => l.weightG ? `${l.weightG} g` : "—"], ["Favori", (l) => l.isFavorite ? "Oui" : "Non"], ["Prochain achat", (l) => l.isNextPurchase ? "Oui" : "Non"], ["Possédé", (l) => l.isOwned ? "Oui" : "Non"]
];

function makeGroupRows(groups: OptionGroup[], members: OptionGroupMember[]): Array<[string, (lens: Lens) => string]> {
  return groups.map((group) => {
    const optionIdsInGroup = new Set(members.filter((m) => m.groupId === group.id).map((m) => m.optionId));
    return [
      group.name,
      (lens: Lens) => {
        const lensGroupOptions = lens.options.filter((o) => optionIdsInGroup.has(o.id));
        if (group.type === "flag") {
          return lensGroupOptions.length > 0 ? "Oui" : "—";
        }
        return lensGroupOptions.map((o) => o.code).join(", ") || "—";
      }
    ];
  });
}

export function LensCompareTable({
  lenses,
  optionGroups,
  optionGroupMembers
}: {
  lenses: Lens[];
  optionGroups?: OptionGroup[];
  optionGroupMembers?: OptionGroupMember[];
}) {
  if (lenses.length < 2) return <section className="card"><h2>Comparaison</h2><p>Sélectionnez 2 à 5 objectifs pour comparer toutes leurs caractéristiques.</p></section>;

  const groupRows = (optionGroups && optionGroupMembers) ? makeGroupRows(optionGroups, optionGroupMembers) : [];
  const allRows = [...rows, ...groupRows];

  return (
    <section className="card table-card">
      <h2>Comparaison</h2>
      <table className="compare-table"><thead><tr><th>Caractéristique</th>{lenses.map((lens) => <th key={lens.id}>{lens.label}</th>)}</tr></thead><tbody>{allRows.map(([label, getter]) => { const values = lenses.map((lens) => String(getter(lens))); const differs = new Set(values).size > 1; return <tr key={label}><th>{label}</th>{values.map((value, index) => <td key={`${label}-${lenses[index].id}`}>{differs ? <strong>{value}</strong> : value}</td>)}</tr>; })}</tbody></table>
    </section>
  );
}
