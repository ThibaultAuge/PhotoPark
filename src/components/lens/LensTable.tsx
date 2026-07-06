import React from "react";
import type { Lens } from "@/lib/lens/types";
import { deleteLensAction } from "@/app/actions/lens-actions";
import { formatApertureRange, formatFocalRange, formatPrice, formatWeight, getLensKind } from "@/lib/lens/lens-utils";
import { ActionMenu, ActionMenuButton } from "@/components/ui/ActionMenu";
import { LensStatusTags } from "./LensStatusTags";

export function LensTable({ lenses, selectedIds, onToggleSelected, onEdit }: { lenses: Lens[]; selectedIds: string[]; onToggleSelected: (id: string) => void; onEdit: (lens: Lens) => void }) {
  return (
    <div className="card table-card table-card-with-actions">
      <div className="table-scroll">
      <table>
        <thead><tr><th>Comparer</th><th>Objectif</th><th>Type</th><th>Monture</th><th>Focale</th><th>Ouverture</th><th className="numeric-cell">Prix</th><th className="numeric-cell">Poids</th><th>Tags</th><th className="actions-column">Actions</th></tr></thead>
        <tbody>
          {lenses.map((lens) => (
            <tr key={lens.id}>
              <td><input type="checkbox" checked={selectedIds.includes(lens.id)} onChange={() => onToggleSelected(lens.id)} aria-label={`Comparer ${lens.label}`} /></td>
              <td><strong>{lens.label}</strong><br /><small>{lens.brand}</small></td>
              <td>{getLensKind(lens)}</td>
              <td>{lens.mount}<br /><small>{lens.sensorType === "FULL_FRAME" ? "Plein format" : "APS-C"}</small></td>
              <td>{formatFocalRange(lens)}<br /><small>eq. APS-C {formatFocalRange({ focalMinMm: lens.apscFocalMinEquivalentMm, focalMaxMm: lens.apscFocalMaxEquivalentMm })}</small></td>
              <td>{formatApertureRange(lens)}</td>
              <td className="numeric-cell">{lens.priceEur !== null ? formatPrice(lens.priceEur) : "—"}</td>
              <td className="numeric-cell">{lens.weightG !== null ? formatWeight(lens.weightG) : "—"}</td>
              <td><LensStatusTags lens={lens} /></td>
              <td className="actions-cell">
                <ActionMenu label={`Actions pour ${lens.label}`}>
                  <ActionMenuButton onClick={() => onEdit(lens)}>Modifier</ActionMenuButton>
                  <form action={deleteLensAction.bind(null, lens.id)}>
                    <ActionMenuButton type="submit" danger>Supprimer</ActionMenuButton>
                  </form>
                </ActionMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {lenses.length === 0 ? <p className="empty-state">Aucun objectif ne correspond aux filtres.</p> : null}
    </div>
  );
}
