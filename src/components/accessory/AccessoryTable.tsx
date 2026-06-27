import React from "react";
import type { Accessory } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryInterface, formatAccessoryLocation, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag, isFilterAccessory } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";

export function AccessoryTable({ accessories, onShowDetail, onEdit }: { accessories: Accessory[]; onShowDetail: (accessory: Accessory) => void; onEdit: (accessory: Accessory) => void }) {
  const showFilterColumns = accessories.some((accessory) => isFilterAccessory(accessory));

  return (
    <div className="card table-card">
      <table>
        <thead>
          <tr>
            <th>Marque</th>
            <th>Nom</th>
            <th>Type</th>
            <th>{showFilterColumns ? "Interfaces" : "Capacité"}</th>
            <th>{showFilterColumns ? "Localisation" : "Laptop"}</th>
            <th>{showFilterColumns ? "Rôle" : "Trépied"}</th>
            <th>Poids</th>
            <th>Prix</th>
            <th>Statuts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accessories.map((accessory) => (
            <tr key={accessory.id}>
              <td>{accessory.brand}</td>
              <td><button type="button" className="link-button" onClick={() => onShowDetail(accessory)}>{accessory.name}</button></td>
              <td>{accessory.type}</td>
              <td>{isFilterAccessory(accessory) ? formatAccessoryInterface(accessory) : formatAccessoryCapacity(accessory)}</td>
              <td>{isFilterAccessory(accessory) ? formatAccessoryLocation(accessory) : formatBooleanFlag(accessory.fitsLaptop)}</td>
              <td>{isFilterAccessory(accessory) ? accessory.filterRole : formatBooleanFlag(accessory.fitsTripod)}</td>
              <td className="numeric-cell">{formatAccessoryWeight(accessory.weightG)}</td>
              <td className="numeric-cell">{formatAccessoryPrice(accessory.priceEur)}</td>
              <td><AccessoryStatusTags accessory={accessory} /></td>
              <td><div className="actions"><button type="button" className="ghost-button" onClick={() => onShowDetail(accessory)}>Voir</button><button type="button" className="ghost-button" onClick={() => onEdit(accessory)}>Modifier</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
