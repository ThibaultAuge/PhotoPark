import React from "react";
import type { Accessory } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryInterface, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag, formatFilterAccessoryLocation, isFilterAccessory } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";
import { ActionMenu, ActionMenuButton } from "@/components/ui/ActionMenu";

export function AccessoryCard({ accessory, lensLabels, accessoryMountIndex, onShowDetail, onEdit }: { accessory: Accessory; lensLabels: ReadonlyMap<string, string>; accessoryMountIndex: ReadonlyMap<string, Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId">>; onShowDetail: (accessory: Accessory) => void; onEdit: (accessory: Accessory) => void }) {
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
        <div><dt>{filterAccessory ? "Localisation" : "Laptop"}</dt><dd>{filterAccessory ? formatFilterAccessoryLocation(accessory, lensLabels, accessoryMountIndex) : formatBooleanFlag(accessory.fitsLaptop)}</dd></div>
        <div><dt>{filterAccessory ? "Rôle" : "Trépied"}</dt><dd>{filterAccessory ? accessory.filterRole : formatBooleanFlag(accessory.fitsTripod)}</dd></div>
        {filterAccessory ? null : <div><dt>Poids</dt><dd>{formatAccessoryWeight(accessory.weightG)}</dd></div>}
        <div><dt>Prix</dt><dd className="numeric-value">{formatAccessoryPrice(accessory.priceEur)}</dd></div>
      </dl>
      <div className="card-actions"><ActionMenu label={`Actions pour ${accessory.label}`}><ActionMenuButton onClick={() => onShowDetail(accessory)}>Voir</ActionMenuButton><ActionMenuButton onClick={() => onEdit(accessory)}>Modifier</ActionMenuButton></ActionMenu></div>
    </article>
  );
}
