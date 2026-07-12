"use client";

import React, { useEffect, useRef } from "react";
import type { Accessory, AccessoryLensReference } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryDimensions, formatAccessoryInterface, formatAccessoryLocation, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag, getOtherAccessorySpecEntries, isFilterAccessory, isOtherAccessory, resolveMountedLensId } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";
import { getLensAccessoryCompatibility } from "@/lib/accessory/filter-compatibility";

export function AccessoryDetailModal({ accessory, lenses, accessories, onClose, onEdit }: { accessory: Accessory; lenses: AccessoryLensReference[]; accessories: Accessory[]; onClose: () => void; onEdit: (accessory: Accessory) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const accessoryMountIndex = new Map(accessories.map((item) => [item.id, { mountedOnLensId: item.mountedOnLensId, mountedOnAccessoryId: item.mountedOnAccessoryId }]));
  const mountedLensId = resolveMountedLensId(accessory, accessoryMountIndex);
  const mountedLens = lenses.find((lens) => lens.id === mountedLensId) ?? null;
  const filterAccessory = isFilterAccessory(accessory);
  const otherAccessory = isOtherAccessory(accessory);
  const compatibility = mountedLens ? getLensAccessoryCompatibility(mountedLens, accessories) : null;
  const otherSpecEntries = getOtherAccessorySpecEntries(accessory);

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
          <DetailItem label={filterAccessory ? "Interfaces" : otherAccessory ? "Caractéristiques" : "Capacité"} value={filterAccessory ? formatAccessoryInterface(accessory) : otherAccessory ? otherSpecEntries.map((entry) => `${entry.label}: ${entry.value}`).join(" · ") || "—" : formatAccessoryCapacity(accessory)} />
          <DetailItem label={filterAccessory ? "Localisation" : otherAccessory ? "Compatibilité" : "Dimensions"} value={filterAccessory ? formatAccessoryLocation(accessory) : otherAccessory ? accessory.specCompatibility ?? "—" : formatAccessoryDimensions(accessory)} />
          <DetailItem label={filterAccessory ? "Rôle" : otherAccessory ? "Connexion" : "Laptop"} value={filterAccessory ? accessory.filterRole : otherAccessory ? accessory.specConnection ?? "—" : formatBooleanFlag(accessory.fitsLaptop)} />
          <DetailItem label={filterAccessory ? "Force / variante" : otherAccessory ? "Variante" : "Trépied"} value={filterAccessory ? accessory.filterStrength ?? "—" : otherAccessory ? accessory.specVariant ?? "—" : formatBooleanFlag(accessory.fitsTripod)} />
          {otherAccessory ? <DetailItem label="Puissance" value={accessory.specPower ?? "—"} /> : null}
          {otherAccessory ? <DetailItem label="Couleurs" value={accessory.specColorModes ?? "—"} /> : null}
          <DetailItem label="Poids" value={formatAccessoryWeight(accessory.weightG)} />
          <DetailItem label="Prix" value={formatAccessoryPrice(accessory.priceEur)} />
          {filterAccessory ? <DetailItem label="Montage actuel" value={mountedLens ? mountedLens.label : accessory.mountedOnAccessoryId ? "Monté derrière une autre pièce" : "Non monté"} /> : null}
          {filterAccessory ? <DetailItem label="Support pare-soleil magnétique" value={formatBooleanFlag(accessory.supportsMagneticHood)} /> : null}
          {filterAccessory && compatibility ? <DetailItem label="Pile active sur l'objectif" value={compatibility.mounted.map((item) => item.name).join(" → ") || "Cette pièce est seule sur l'objectif."} full /> : null}
          <DetailItem label={filterAccessory ? "Notes" : otherAccessory ? "Notes" : "Transport & confort"} value={(filterAccessory ? accessory.capacityNotes : otherAccessory ? accessory.capacityNotes : accessory.carryStyleNotes) ?? "—"} full />
          {!filterAccessory && !otherAccessory ? <DetailItem label="Notes capacité" value={accessory.capacityNotes ?? "—"} full /> : null}
        </div>
        <div className="form-actions"><button type="button" className="ghost-button" onClick={onClose}>Fermer</button><button type="button" className="primary-button" onClick={() => onEdit(accessory)}>Modifier</button></div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return <div className={full ? "detail-item detail-item-full" : "detail-item"}><strong>{label}</strong><span>{value}</span></div>;
}
