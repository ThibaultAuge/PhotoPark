import React from "react";
import type { Body } from "@/lib/body/types";
import { BodyStatusTags } from "@/components/body/BodyStatusTags";
import { formatBodyIsoRange, formatBodyPrice, formatBodyWeight, formatBurstFps, formatMegapixels, getBodySensorFormatLabel, getBodyTypeLabel } from "@/lib/body/body-utils";

1
export function BodyCard({ body, selected, onToggleSelected, onShowDetail, onEdit }: { body: Body; selected: boolean; onToggleSelected: (id: string) => void; onShowDetail: (body: Body) => void; onEdit: (body: Body) => void }) {
  return (
    <article className={`lens-card card${selected ? " selected" : ""}`}>
      <div>
        <h3>{body.label}</h3>
        <BodyStatusTags body={body} />
      </div>
      <dl>
        <div><dt>Type</dt><dd>{getBodyTypeLabel(body.bodyType)}</dd></div>
        <div><dt>Format</dt><dd>{getBodySensorFormatLabel(body.sensorFormat)}</dd></div>
        <div><dt>Monture</dt><dd>{body.mount ?? (body.isInterchangeableLens ? "—" : "Fixe")}</dd></div>
        <div><dt>Capteur</dt><dd>{formatMegapixels(body.megapixels)}</dd></div>
        <div><dt>ISO</dt><dd>{formatBodyIsoRange(body)}</dd></div>
        <div><dt>Rafale</dt><dd>{formatBurstFps(body.burstFps)}</dd></div>
        <div><dt>Poids</dt><dd>{formatBodyWeight(body.weightG)}</dd></div>
        <div><dt>Prix</dt><dd className="numeric-value">{formatBodyPrice(body.priceEur)}</dd></div>
      </dl>
      <div className="card-actions"><button type="button" className={selected ? "primary-button" : "ghost-button"} onClick={() => onToggleSelected(body.id)}>{selected ? "Retirer" : "Comparer"}</button><button type="button" className="ghost-button" onClick={() => onShowDetail(body)}>Voir</button><button type="button" className="ghost-button" onClick={() => onEdit(body)}>Modifier</button></div>
    </article>
  );
}
