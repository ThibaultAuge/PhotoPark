import React from "react";
import type { Accessory } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryInterface, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag, formatFilterAccessoryLocation, isFilterAccessory } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";
import { ActionMenu, ActionMenuButton } from "@/components/ui/ActionMenu";

export function AccessoryTable({ accessories, lensLabels, accessoryMountIndex, showFilterColumns, onShowDetail, onEdit }: { accessories: Accessory[]; lensLabels: ReadonlyMap<string, string>; accessoryMountIndex: ReadonlyMap<string, Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId">>; showFilterColumns: boolean; onShowDetail: (accessory: Accessory) => void; onEdit: (accessory: Accessory) => void }) {

  return (
    <div className="card table-card table-card-with-actions">
      <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Marque</th>
            <th>Nom</th>
            <th>Type</th>
            <th>{showFilterColumns ? "Interfaces" : "Capacité"}</th>
            <th>{showFilterColumns ? "Localisation" : "Laptop"}</th>
            <th>{showFilterColumns ? "Rôle" : "Trépied"}</th>
            {showFilterColumns ? null : <th>Poids</th>}
            <th>Prix</th>
            <th>Statuts</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {accessories.map((accessory) => (
            <tr key={accessory.id}>
              <td>{accessory.brand}</td>
              <td><button type="button" className="link-button" onClick={() => onShowDetail(accessory)}>{accessory.name}</button></td>
              <td>{accessory.type}</td>
              <td>{isFilterAccessory(accessory) ? formatAccessoryInterface(accessory) : formatAccessoryCapacity(accessory)}</td>
              <td>{isFilterAccessory(accessory) ? formatFilterAccessoryLocation(accessory, lensLabels, accessoryMountIndex) : formatBooleanFlag(accessory.fitsLaptop)}</td>
              <td>{isFilterAccessory(accessory) ? accessory.filterRole : formatBooleanFlag(accessory.fitsTripod)}</td>
              {isFilterAccessory(accessory) ? null : <td className="numeric-cell">{formatAccessoryWeight(accessory.weightG)}</td>}
              <td className="numeric-cell">{formatAccessoryPrice(accessory.priceEur)}</td>
              <td><AccessoryStatusTags accessory={accessory} /></td>
              <td className="actions-cell"><ActionMenu label={`Actions pour ${accessory.label}`}><ActionMenuButton onClick={() => onShowDetail(accessory)}>Voir</ActionMenuButton><ActionMenuButton onClick={() => onEdit(accessory)}>Modifier</ActionMenuButton></ActionMenu></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
