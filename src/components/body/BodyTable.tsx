import React from "react";
import type { Body } from "@/lib/body/types";
import { BodyStatusTags } from "@/components/body/BodyStatusTags";
import { formatBodyIsoRange, formatBodyPrice, formatBodyWeight, formatBurstFps, formatMegapixels, getBodySensorFormatLabel, getBodyTypeLabel } from "@/lib/body/body-utils";

export function BodyTable({ bodies, selectedIds, onToggleSelected, onShowDetail, onEdit }: { bodies: Body[]; selectedIds: string[]; onToggleSelected: (id: string) => void; onShowDetail: (body: Body) => void; onEdit: (body: Body) => void }) {
  return (
    <div className="card table-card">
      <table>
        <thead>
          <tr>
            <th>Comparer</th>
            <th>Marque</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Format</th>
            <th>Monture</th>
            <th>Capteur</th>
            <th>ISO</th>
            <th>Rafale</th>
            <th>Poids</th>
            <th>Prix</th>
            <th>Statuts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bodies.map((body) => {
            const selected = selectedIds.includes(body.id);
            return (
              <tr key={body.id}>
                <td><button type="button" className={selected ? "primary-button" : "ghost-button"} onClick={() => onToggleSelected(body.id)}>{selected ? "Ajouté" : "Comparer"}</button></td>
                <td>{body.brand}</td>
                <td><button type="button" className="link-button" onClick={() => onShowDetail(body)}>{body.name}</button></td>
                <td>{getBodyTypeLabel(body.bodyType)}</td>
                <td>{getBodySensorFormatLabel(body.sensorFormat)}</td>
                <td>{body.mount ?? (body.isInterchangeableLens ? "—" : "Fixe")}</td>
                <td>{formatMegapixels(body.megapixels)}</td>
                <td>{formatBodyIsoRange(body)}</td>
                <td>{formatBurstFps(body.burstFps)}</td>
                <td className="numeric-cell">{formatBodyWeight(body.weightG)}</td>
                <td className="numeric-cell">{formatBodyPrice(body.priceEur)}</td>
                <td><BodyStatusTags body={body} /></td>
                <td><div className="actions"><button type="button" className="ghost-button" onClick={() => onShowDetail(body)}>Voir</button><button type="button" className="ghost-button" onClick={() => onEdit(body)}>Modifier</button></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
