import React from "react";
import type { Accessory } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryInterface, formatAccessoryLocation, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag, isFilterAccessory } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";

export function AccessoryCard({ accessory, onShowDetail, onEdit }: { accessory: Accessory; onShowDetail: (accessory: Accessory) => void; onEdit: (accessory: Accessory) => void }) {
  const filterAccessory = isFilterAccessory(accessory);

  return (
    <article className="lens-card card accessory-card">
      <div>
        <h3>{accessory.label}</h3>
        <AccessoryStatusTags accessory={accessory} />
      </div>
      <dl>
        <div><dt>Type</dt><dd>{accessory.type}</dd></div>
        <div><dt>{filterAccessory ? "Interfaces" : "Capacité"}</dt><dd>{filterAccessory ? formatAccessoryInterface(accessory) : formatAccessoryCapacity(accessory)}</dd></div>
        <div><dt>{filterAccessory ? "Localisation" : "Laptop"}</dt><dd>{filterAccessory ? formatAccessoryLocation(accessory) : formatBooleanFlag(accessory.fitsLaptop)}</dd></div>
        <div><dt>{filterAccessory ? "Rôle" : "Trépied"}</dt><dd>{filterAccessory ? accessory.filterRole : formatBooleanFlag(accessory.fitsTripod)}</dd></div>
        <div><dt>Poids</dt><dd>{formatAccessoryWeight(accessory.weightG)}</dd></div>
        <div><dt>Prix</dt><dd className="numeric-value">{formatAccessoryPrice(accessory.priceEur)}</dd></div>
      </dl>
      <div className="card-actions"><button type="button" className="ghost-button" onClick={() => onShowDetail(accessory)}>Voir</button><button type="button" className="ghost-button" onClick={() => onEdit(accessory)}>Modifier</button></div>
    </article>
  );
}
