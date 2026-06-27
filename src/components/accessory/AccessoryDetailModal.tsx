"use client";

import React, { useEffect, useRef } from "react";
import type { Accessory, AccessoryLensReference } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryDimensions, formatAccessoryInterface, formatAccessoryLocation, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag, isFilterAccessory } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";
import { getLensAccessoryCompatibility } from "@/lib/accessory/filter-compatibility";

export function AccessoryDetailModal({ accessory, lenses, accessories, onClose, onEdit }: { accessory: Accessory; lenses: AccessoryLensReference[]; accessories: Accessory[]; onClose: () => void; onEdit: (accessory: Accessory) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const mountedLens = lenses.find((lens) => lens.id === accessory.mountedOnLensId) ?? null;
  const filterAccessory = isFilterAccessory(accessory);
  const compatibility = mountedLens ? getLensAccessoryCompatibility(mountedLens, accessories) : null;

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
          <DetailItem label={filterAccessory ? "Interfaces" : "Capacité"} value={filterAccessory ? formatAccessoryInterface(accessory) : formatAccessoryCapacity(accessory)} />
          <DetailItem label={filterAccessory ? "Localisation" : "Dimensions"} value={filterAccessory ? formatAccessoryLocation(accessory) : formatAccessoryDimensions(accessory)} />
          <DetailItem label={filterAccessory ? "Rôle" : "Laptop"} value={filterAccessory ? accessory.filterRole : formatBooleanFlag(accessory.fitsLaptop)} />
          <DetailItem label={filterAccessory ? "Force / variante" : "Trépied"} value={filterAccessory ? accessory.filterStrength ?? "—" : formatBooleanFlag(accessory.fitsTripod)} />
          <DetailItem label="Poids" value={formatAccessoryWeight(accessory.weightG)} />
          <DetailItem label="Prix" value={formatAccessoryPrice(accessory.priceEur)} />
          {filterAccessory ? <DetailItem label="Montage actuel" value={mountedLens ? mountedLens.label : accessory.mountedOnAccessoryId ? "Monté derrière une autre pièce" : "Non monté"} /> : null}
          {filterAccessory ? <DetailItem label="Support pare-soleil magnétique" value={formatBooleanFlag(accessory.supportsMagneticHood)} /> : null}
          {filterAccessory && compatibility ? <DetailItem label="Pile active sur l'objectif" value={compatibility.mounted.map((item) => item.name).join(" → ") || "Cette pièce est seule sur l'objectif."} full /> : null}
          <DetailItem label={filterAccessory ? "Notes" : "Transport & confort"} value={(filterAccessory ? accessory.capacityNotes : accessory.carryStyleNotes) ?? "—"} full />
          {!filterAccessory ? <DetailItem label="Notes capacité" value={accessory.capacityNotes ?? "—"} full /> : null}
        </div>
        <div className="form-actions"><button type="button" className="ghost-button" onClick={onClose}>Fermer</button><button type="button" className="primary-button" onClick={() => onEdit(accessory)}>Modifier</button></div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return <div className={full ? "detail-item detail-item-full" : "detail-item"}><strong>{label}</strong><span>{value}</span></div>;
}
