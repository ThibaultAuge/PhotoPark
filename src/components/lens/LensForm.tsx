import React from "react";
import type { Lens, LensReferenceData } from "@/lib/lens/types";
import { createLensAction, updateLensAction } from "@/app/actions/lens-actions";

export function LensForm({ title, lens, referenceData, onClose }: { title: string; lens?: Lens; referenceData: LensReferenceData; onClose: () => void }) {
  const action = lens ? updateLensAction.bind(null, lens.id) : createLensAction;
  const selectedOptionIds = new Set(lens?.options.map((option) => option.id) ?? []);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lens-form-title">
      <form action={action} className="modal-card">
        <div className="modal-header"><h2 id="lens-form-title">{title}</h2><button type="button" className="ghost-button" onClick={onClose}>Fermer</button></div>
        <div className="form-grid">
          <label>Marque<select name="brandId" defaultValue={lens?.brandId ?? referenceData.brands[0]?.id} required>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
          <label>Monture<select name="mountId" defaultValue={lens?.mountId ?? referenceData.mounts[0]?.id} required>{referenceData.mounts.map((mount) => <option key={mount.id} value={mount.id}>{mount.name} — {mount.sensorType === "FULL_FRAME" ? "Plein format" : "APS-C"}</option>)}</select></label>
          <Field name="focalMinMm" label="Focale min" type="text" inputMode="decimal" defaultValue={lens?.focalMinMm} required />
          <Field name="focalMaxMm" label="Focale max" type="text" inputMode="decimal" defaultValue={lens?.focalMaxMm} required />
          <Field name="maxApertureAtMinFocal" label="Ouverture max à min focale" type="text" inputMode="decimal" defaultValue={lens?.maxApertureAtMinFocal} required />
          <Field name="maxApertureAtMaxFocal" label="Ouverture max à max focale" type="text" inputMode="decimal" defaultValue={lens?.maxApertureAtMaxFocal} />
          <Field name="minAperture" label="Ouverture min" type="text" inputMode="decimal" defaultValue={lens?.minAperture} />
          <Field name="filterDiameterMm" label="Diamètre filtre (mm)" type="text" inputMode="decimal" defaultValue={lens?.filterDiameterMm} />
          <Field name="priceEur" label="Prix (€)" type="text" inputMode="decimal" defaultValue={lens?.priceEur} />
          <Field name="minFocusDistanceM" label="Distance mini MAP (m)" type="text" inputMode="decimal" defaultValue={lens?.minFocusDistanceM} />
          <Field name="angleAtMinFocalDeg" label="Angle min focale (°)" type="text" inputMode="decimal" defaultValue={lens?.angleAtMinFocalDeg} />
          <Field name="angleAtMaxFocalDeg" label="Angle max focale (°)" type="text" inputMode="decimal" defaultValue={lens?.angleAtMaxFocalDeg} />
          <Field name="apertureBlades" label="Diaphragme (lames)" type="text" inputMode="numeric" defaultValue={lens?.apertureBlades} />
          <Field name="groupsCount" label="Groupes" type="text" inputMode="numeric" defaultValue={lens?.groupsCount} />
          <Field name="elementsCount" label="Lentilles" type="text" inputMode="numeric" defaultValue={lens?.elementsCount} />
          <Field name="weightG" label="Poids (g)" type="text" inputMode="decimal" defaultValue={lens?.weightG} />
        </div>
        <fieldset className="options-fieldset"><legend>Options</legend>{referenceData.options.map((option) => <label key={option.id}><input name="optionIds" type="checkbox" value={option.id} defaultChecked={selectedOptionIds.has(option.id)} /> <strong>{option.code}</strong> — {option.description}</label>)}</fieldset>
        <div className="checkbox-row"><label><input name="isFavorite" type="checkbox" defaultChecked={lens?.isFavorite} /> Favori</label><label><input name="isNextPurchase" type="checkbox" defaultChecked={lens?.isNextPurchase} /> Prochain achat</label><label><input name="isOwned" type="checkbox" defaultChecked={lens?.isOwned} /> Possédé</label></div>
        <button className="primary-button">Enregistrer</button>
      </form>
    </div>
  );
}

function Field({ name, label, type = "text", step, inputMode, defaultValue, required }: { name: string; label: string; type?: string; step?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; defaultValue?: string | number | null; required?: boolean }) {
  return <label>{label}<input name={name} type={type} step={step} inputMode={inputMode} defaultValue={defaultValue ?? ""} required={required} /></label>;
}
