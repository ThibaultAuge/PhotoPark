"use client";

import React, { useEffect, useRef } from "react";
import type { Body } from "@/lib/body/types";
import { BodyStatusTags } from "@/components/body/BodyStatusTags";
import { formatBatteryLife, formatBodyIsoRange, formatBodyPrice, formatBodyWeight, formatBooleanFlag, formatBurstFps, formatMegapixels, getBodySensorFormatLabel, getBodyTypeLabel } from "@/lib/body/body-utils";

export function BodyDetailModal({ body, onClose, onEdit }: { body: Body; onClose: () => void; onEdit: (body: Body) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="body-detail-title">
      <div className="modal-card">
        <div className="modal-header"><div><h2 id="body-detail-title">{body.label}</h2><BodyStatusTags body={body} /></div><button ref={closeRef} type="button" className="ghost-button" onClick={onClose}>Fermer</button></div>
        <div className="detail-grid">
          <DetailItem label="Marque" value={body.brand} />
          <DetailItem label="Nom" value={body.name} />
          <DetailItem label="Type" value={getBodyTypeLabel(body.bodyType)} />
          <DetailItem label="Objectifs interchangeables" value={formatBooleanFlag(body.isInterchangeableLens)} />
          <DetailItem label="Format capteur" value={getBodySensorFormatLabel(body.sensorFormat)} />
          <DetailItem label="Monture" value={body.mount ?? (body.isInterchangeableLens ? "—" : "Fixe") } />
          <DetailItem label="Mégapixels" value={formatMegapixels(body.megapixels)} />
          <DetailItem label="ISO" value={formatBodyIsoRange(body)} />
          <DetailItem label="Rafale" value={formatBurstFps(body.burstFps)} />
          <DetailItem label="Vidéo" value={body.videoSpecs ?? "—"} />
          <DetailItem label="Poids" value={formatBodyWeight(body.weightG)} />
          <DetailItem label="Prix" value={formatBodyPrice(body.priceEur)} />
          <DetailItem label="Autonomie" value={formatBatteryLife(body.batteryLifeShots)} />
          <DetailItem label="IBIS" value={formatBooleanFlag(body.hasIbis)} />
          <DetailItem label="Double slot" value={formatBooleanFlag(body.hasDualCardSlot)} />
          <DetailItem label="Tropicalisation" value={formatBooleanFlag(body.isWeatherSealed)} />
          <DetailItem label="Écran orientable" value={formatBooleanFlag(body.hasArticulatedScreen)} />
          <DetailItem label="Notes" value={body.notes ?? "—"} full />
        </div>
        <div className="form-actions"><button type="button" className="ghost-button" onClick={onClose}>Fermer</button><button type="button" className="primary-button" onClick={() => onEdit(body)}>Modifier</button></div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return <div className={full ? "detail-item detail-item-full" : "detail-item"}><strong>{label}</strong><span>{value}</span></div>;
}
