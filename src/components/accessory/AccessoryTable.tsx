import React from "react";
import type { Accessory, AccessoryTypeCategory } from "@/lib/accessory/types";
import { formatAccessoryCapacity, formatAccessoryInterface, formatAccessoryPrice, formatAccessoryWeight, formatBooleanFlag, formatFilterAccessoryLocation, formatOtherAccessorySummary, isFilterAccessory, isOtherAccessory } from "@/lib/accessory/accessory-utils";
import { AccessoryStatusTags } from "@/components/accessory/AccessoryStatusTags";
import { ActionMenu, ActionMenuButton } from "@/components/ui/ActionMenu";

export function AccessoryTable({ accessories, lensLabels, accessoryMountIndex, typeCategory, showFilterColumns, onShowDetail, onEdit }: { accessories: Accessory[]; lensLabels: ReadonlyMap<string, string>; accessoryMountIndex: ReadonlyMap<string, Pick<Accessory, "mountedOnLensId" | "mountedOnAccessoryId">>; typeCategory: AccessoryTypeCategory; showFilterColumns: boolean; onShowDetail: (accessory: Accessory) => void; onEdit: (accessory: Accessory) => void }) {
  const detailsHeaderOne = typeCategory === "other" ? "Compatibilité / connexion" : showFilterColumns ? "Localisation" : "Laptop";
  const detailsHeaderTwo = typeCategory === "other" ? "Variante / puissance" : showFilterColumns ? "Rôle" : "Trépied";
  const primaryDetailsHeader = typeCategory === "other" ? "Caractéristiques" : showFilterColumns ? "Interfaces" : "Capacité";

  function renderCells(accessory: Accessory) {
    const filterAccessory = isFilterAccessory(accessory);
    const otherAccessory = isOtherAccessory(accessory);

    return (
      <>
        <td>{accessory.brand}</td>
        <td><button type="button" className="link-button" onClick={() => onShowDetail(accessory)}>{accessory.name}</button></td>
        <td>{accessory.type}</td>
        <td>{filterAccessory ? formatAccessoryInterface(accessory) : otherAccessory ? formatOtherAccessorySummary(accessory) : formatAccessoryCapacity(accessory)}</td>
        <td>{filterAccessory ? formatFilterAccessoryLocation(accessory, lensLabels, accessoryMountIndex) : otherAccessory ? (accessory.specCompatibility ?? accessory.specConnection ?? "—") : formatBooleanFlag(accessory.fitsLaptop)}</td>
        <td>{filterAccessory ? accessory.filterRole : otherAccessory ? (accessory.specVariant ?? accessory.specPower ?? "—") : formatBooleanFlag(accessory.fitsTripod)}</td>
        {filterAccessory ? null : <td className="numeric-cell">{formatAccessoryWeight(accessory.weightG)}</td>}
        <td className="numeric-cell">{formatAccessoryPrice(accessory.priceEur)}</td>
        <td><AccessoryStatusTags accessory={accessory} /></td>
        <td className="actions-cell"><ActionMenu label={`Actions pour ${accessory.label}`}><ActionMenuButton onClick={() => onShowDetail(accessory)}>Voir</ActionMenuButton><ActionMenuButton onClick={() => onEdit(accessory)}>Modifier</ActionMenuButton></ActionMenu></td>
      </>
    );
  }

  return (
    <div className="card table-card table-card-with-actions">
      <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Marque</th>
            <th>Nom</th>
            <th>Type</th>
            <th>{primaryDetailsHeader}</th>
            <th>{detailsHeaderOne}</th>
            <th>{detailsHeaderTwo}</th>
            {showFilterColumns ? null : <th>Poids</th>}
            <th>Prix</th>
            <th>Statuts</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
          <tbody>
            {accessories.map((accessory) => (
              <tr key={accessory.id}>{renderCells(accessory)}</tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
