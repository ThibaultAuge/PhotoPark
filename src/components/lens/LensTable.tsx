import type { Lens } from "@/lib/lens/types";
import { deleteLensAction } from "@/app/actions/lens-actions";
import { LensStatusTags } from "./LensStatusTags";

export function LensTable({ lenses, selectedIds, onToggleSelected, onEdit }: { lenses: Lens[]; selectedIds: string[]; onToggleSelected: (id: string) => void; onEdit: (lens: Lens) => void }) {
  return (
    <div className="card table-card">
      <table>
        <thead><tr><th>Comparer</th><th>Objectif</th><th>Monture</th><th>Focale</th><th>Ouverture</th><th>Prix</th><th>Poids</th><th>Tags</th><th>Actions</th></tr></thead>
        <tbody>
          {lenses.map((lens) => (
            <tr key={lens.id}>
              <td><input type="checkbox" checked={selectedIds.includes(lens.id)} onChange={() => onToggleSelected(lens.id)} aria-label={`Comparer ${lens.label}`} /></td>
              <td><strong>{lens.label}</strong><br /><small>{lens.brand}</small></td>
              <td>{lens.mount}<br /><small>{lens.sensorType === "FULL_FRAME" ? "Plein format" : "APS-C"}</small></td>
              <td>{lens.focalMinMm}-{lens.focalMaxMm} mm<br /><small>eq. APS-C {lens.apscFocalMinEquivalentMm}-{lens.apscFocalMaxEquivalentMm} mm</small></td>
              <td>f/{lens.maxApertureAtMinFocal}-{lens.maxApertureAtMaxFocal}</td>
              <td>{lens.priceEur ? `${lens.priceEur} €` : "—"}</td>
              <td>{lens.weightG ? `${lens.weightG} g` : "—"}</td>
              <td><LensStatusTags lens={lens} /></td>
              <td className="actions"><button className="ghost-button" onClick={() => onEdit(lens)}>Modifier</button><form action={deleteLensAction.bind(null, lens.id)}><button className="danger-button">Supprimer</button></form></td>
            </tr>
          ))}
        </tbody>
      </table>
      {lenses.length === 0 ? <p className="empty-state">Aucun objectif ne correspond aux filtres.</p> : null}
    </div>
  );
}
