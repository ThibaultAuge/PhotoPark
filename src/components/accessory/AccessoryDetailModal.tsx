"use client";

import React, { useEffect, useRef } from "react";
import type { Accessory } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryDimensions, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";

export function AccessoryDetailModal({ accessory, onClose, onEdit }: { accessory: Accessory; onClose: () => void; onEdit: (accessory: Accessory) => void }) {
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
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="accessory-detail-title">
      <div className="modal-card">
        <div className="modal-header"><div><h2 id="accessory-detail-title">{accessory.label}</h2><AccessoryStatusTags accessory={accessory} /></div><button ref={closeRef} type="button" className="ghost-button" onClick={onClose}>Fermer</button></div>
        <div className="detail-grid">
          <DetailItem label="Marque" value={accessory.brand} />
          <DetailItem label="Type" value={accessory.type} />
          <DetailItem label="Capacité" value={formatAccessoryCapacity(accessory)} />
          <DetailItem label="Dimensions" value={formatAccessoryDimensions(accessory)} />
          <DetailItem label="Laptop" value={formatBooleanFlag(accessory.fitsLaptop)} />
          <DetailItem label="Trépied" value={formatBooleanFlag(accessory.fitsTripod)} />
          <DetailItem label="Poids" value={formatAccessoryWeight(accessory.weightG)} />
          <DetailItem label="Prix" value={formatAccessoryPrice(accessory.priceEur)} />
          <DetailItem label="Transport & confort" value={accessory.carryStyleNotes ?? "—"} full />
          <DetailItem label="Notes capacité" value={accessory.capacityNotes ?? "—"} full />
        </div>
        <div className="form-actions"><button type="button" className="ghost-button" onClick={onClose}>Fermer</button><button type="button" className="primary-button" onClick={() => onEdit(accessory)}>Modifier</button></div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return <div className={full ? "detail-item detail-item-full" : "detail-item"}><strong>{label}</strong><span>{value}</span></div>;
}
