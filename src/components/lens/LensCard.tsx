import type { Lens } from "@/lib/lens/types";
import { deleteLensAction } from "@/app/actions/lens-actions";
import { LensStatusTags } from "./LensStatusTags";

export function LensCard({ lens, selected, onToggleSelected, onEdit }: { lens: Lens; selected: boolean; onToggleSelected: (id: string) => void; onEdit: (lens: Lens) => void }) {
  return (
    <article className={`card lens-card ${selected ? "selected" : ""}`}>
      <div><h3>{lens.label}</h3><LensStatusTags lens={lens} /></div>
      <dl><div><dt>Monture</dt><dd>{lens.mount}</dd></div><div><dt>Focale</dt><dd>{lens.focalMinMm}-{lens.focalMaxMm} mm</dd></div><div><dt>Ouverture</dt><dd>f/{lens.maxApertureAtMinFocal}-{lens.maxApertureAtMaxFocal}</dd></div><div><dt>Prix</dt><dd>{lens.priceEur ? `${lens.priceEur} €` : "—"}</dd></div></dl>
      <div className="card-actions"><button className="ghost-button" onClick={() => onToggleSelected(lens.id)}>{selected ? "Retirer" : "Comparer"}</button><button className="ghost-button" onClick={() => onEdit(lens)}>Modifier</button><form action={deleteLensAction.bind(null, lens.id)}><button className="danger-button">Supprimer</button></form></div>
    </article>
  );
}
