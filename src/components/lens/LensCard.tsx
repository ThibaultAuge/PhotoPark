import React from "react";
import type { Lens } from "@/lib/lens/types";
import { deleteLensAction } from "@/app/actions/lens-actions";
import { formatApertureRange, formatFocalRange, formatPrice, getLensKind } from "@/lib/lens/lens-utils";
import { ActionMenu, ActionMenuButton } from "@/components/ui/ActionMenu";
import { LensStatusTags } from "./LensStatusTags";

export function LensCard({ lens, selected, onToggleSelected, onEdit }: { lens: Lens; selected: boolean; onToggleSelected: (id: string) => void; onEdit: (lens: Lens) => void }) {
  return (
    <article className={`card lens-card ${selected ? "selected" : ""}`}>
      <div><h3>{lens.label}</h3><LensStatusTags lens={lens} /></div>
      <dl><div><dt>Type</dt><dd>{getLensKind(lens)}</dd></div><div><dt>Monture</dt><dd>{lens.mount}</dd></div><div><dt>Focale</dt><dd>{formatFocalRange(lens)}</dd></div><div><dt>Ouverture</dt><dd>{formatApertureRange(lens)}</dd></div><div><dt>Prix</dt><dd className="numeric-value">{lens.priceEur !== null ? formatPrice(lens.priceEur) : "—"}</dd></div></dl>
      <div className="card-actions"><button className="ghost-button" onClick={() => onToggleSelected(lens.id)}>{selected ? "Retirer" : "Comparer"}</button><ActionMenu label={`Actions pour ${lens.label}`}><ActionMenuButton onClick={() => onEdit(lens)}>Modifier</ActionMenuButton><form action={deleteLensAction.bind(null, lens.id)}><ActionMenuButton type="submit" danger>Supprimer</ActionMenuButton></form></ActionMenu></div>
    </article>
  );
}
