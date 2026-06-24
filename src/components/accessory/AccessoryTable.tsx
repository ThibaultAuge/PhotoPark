import React from "react";
import type { Accessory } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";

export function AccessoryTable({ accessories, onShowDetail, onEdit }: { accessories: Accessory[]; onShowDetail: (accessory: Accessory) => void; onEdit: (accessory: Accessory) => void }) {
  return (
    <div className="card table-card">
      <table>
        <thead>
          <tr>
            <th>Marque</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Capacité</th>
            <th>Laptop</th>
            <th>Trépied</th>
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
              <td>{formatAccessoryCapacity(accessory)}</td>
              <td>{formatBooleanFlag(accessory.fitsLaptop)}</td>
              <td>{formatBooleanFlag(accessory.fitsTripod)}</td>
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
