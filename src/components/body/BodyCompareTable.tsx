import React from "react";
import type { Body } from "@/lib/body/types";
import { formatBatteryLife, formatBodyIsoRange, formatBodyPrice, formatBodyWeight, formatBooleanFlag, formatBurstFps, formatMegapixels, getBodySensorFormatLabel, getBodyTypeLabel } from "@/lib/body/body-utils";

const rows: Array<[string, (body: Body) => string]> = [
  ["Marque", (body) => body.brand],
  ["Nom", (body) => body.name],
  ["Type", (body) => getBodyTypeLabel(body.bodyType)],
  ["Objectifs interchangeables", (body) => formatBooleanFlag(body.isInterchangeableLens)],
  ["Format capteur", (body) => getBodySensorFormatLabel(body.sensorFormat)],
  ["Monture", (body) => body.mount ?? (body.isInterchangeableLens ? "—" : "Fixe")],
  ["Mégapixels", (body) => formatMegapixels(body.megapixels)],
  ["ISO", (body) => formatBodyIsoRange(body)],
  ["Rafale", (body) => formatBurstFps(body.burstFps)],
  ["Vidéo", (body) => body.videoSpecs ?? "—"],
  ["Poids", (body) => formatBodyWeight(body.weightG)],
  ["Prix", (body) => formatBodyPrice(body.priceEur)],
  ["Autonomie", (body) => formatBatteryLife(body.batteryLifeShots)],
  ["IBIS", (body) => formatBooleanFlag(body.hasIbis)],
  ["Double slot", (body) => formatBooleanFlag(body.hasDualCardSlot)],
  ["Tropicalisation", (body) => formatBooleanFlag(body.isWeatherSealed)],
  ["Écran orientable", (body) => formatBooleanFlag(body.hasArticulatedScreen)],
  ["Favori", (body) => formatBooleanFlag(body.isFavorite)],
  ["À acheter", (body) => formatBooleanFlag(body.isNextPurchase)],
  ["Possédé", (body) => formatBooleanFlag(body.isOwned)],
  ["Retiré", (body) => formatBooleanFlag(body.retired)],
];

export function BodyCompareTable({ bodies }: { bodies: Body[] }) {
  if (bodies.length < 2) return <section className="card"><h2>Comparaison</h2><p>Sélectionnez 2 à 5 boîtiers pour comparer toutes leurs caractéristiques.</p></section>;

  return (
    <section className="card table-card">
      <h2>Comparaison</h2>
      <table className="compare-table"><thead><tr><th>Caractéristique</th>{bodies.map((body) => <th key={body.id}>{body.label}</th>)}</tr></thead><tbody>{rows.map(([label, getter]) => { const values = bodies.map((body) => getter(body)); const differs = new Set(values).size > 1; return <tr key={label}><th>{label}</th>{values.map((value, index) => <td key={`${label}-${bodies[index].id}`}>{differs ? <strong>{value}</strong> : value}</td>)}</tr>; })}</tbody></table>
    </section>
  );
}
