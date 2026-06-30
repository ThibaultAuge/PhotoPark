"use client";

import React, { useState } from "react";
import { createBodyAction, deleteBodyAction, updateBodyAction } from "@/app/actions/body-actions";
import type { Body, BodyReferenceData } from "@/lib/body/types";

export function BodyForm({ title, referenceData, body, onClose }: { title: string; referenceData: BodyReferenceData; body?: Body; onClose: () => void }) {
  const action = body ? updateBodyAction.bind(null, body.id) : createBodyAction;
  const [error, setError] = useState<string | null>(null);
  const [isInterchangeableLens, setIsInterchangeableLens] = useState(body?.isInterchangeableLens ?? true);

  async function submitAndClose(formData: FormData) {
    setError(null);
    try {
      await action(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="body-form-title">
      <form action={submitAndClose} className="modal-card">
        <div className="modal-header"><h2 id="body-form-title">{title}</h2><button type="button" className="ghost-button" onClick={onClose}>Fermer</button></div>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="form-sections">
          <section>
            <div className="form-section-header"><h3 className="form-section-title">Identité</h3></div>
            <div className="form-section-body">
              <label>Marque<select name="brandId" defaultValue={body?.brandId ?? referenceData.brands[0]?.id ?? ""} required>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
              <Field name="name" label="Nom" defaultValue={body?.name} required />
              <div className="form-row">
                <label>Type<select name="bodyType" defaultValue={body?.bodyType ?? "mirrorless"} required><option value="mirrorless">Hybride</option><option value="dslr">Reflex</option><option value="compact">Compact</option></select></label>
                <label>Format capteur<select name="sensorFormat" defaultValue={body?.sensorFormat ?? "FULL_FRAME"} required><option value="FULL_FRAME">Plein format</option><option value="APS_C">APS-C</option><option value="MICRO_FOUR_THIRDS">Micro 4/3</option><option value="MEDIUM_FORMAT">Moyen format</option><option value="CMOS">CMOS</option><option value="OTHER">Autre</option></select></label>
              </div>
              <label className="inline-checkbox"><input name="isInterchangeableLens" type="checkbox" defaultChecked={isInterchangeableLens} onChange={(event) => setIsInterchangeableLens(event.target.checked)} /> Objectifs interchangeables</label>
              <label>Monture<select name="mountId" defaultValue={body?.mountId ?? ""} disabled={!isInterchangeableLens} required={isInterchangeableLens}><option value="">Aucune</option>{referenceData.mounts.map((mount) => <option key={mount.id} value={mount.id}>{mount.name}</option>)}</select></label>
            </div>
          </section>

          <section>
            <div className="form-section-header"><h3 className="form-section-title">Capteur & performances</h3></div>
            <div className="form-section-body">
              <div className="form-row">
                <Field name="megapixels" label="Mégapixels" defaultValue={body?.megapixels} inputMode="decimal" />
                <Field name="burstFps" label="Rafale (i/s)" defaultValue={body?.burstFps} inputMode="decimal" />
              </div>
              <div className="form-row">
                <Field name="isoMin" label="ISO min" defaultValue={body?.isoMin} inputMode="numeric" />
                <Field name="isoMax" label="ISO max" defaultValue={body?.isoMax} inputMode="numeric" />
              </div>
              <Field name="videoSpecs" label="Vidéo" defaultValue={body?.videoSpecs} placeholder="4K60, 6K RAW..." />
            </div>
          </section>

          <section>
            <div className="form-section-header"><h3 className="form-section-title">Prix & gabarit</h3></div>
            <div className="form-section-body">
              <div className="form-row">
                <Field name="priceEur" label="Prix (€)" defaultValue={body?.priceEur} inputMode="decimal" />
                <Field name="weightG" label="Poids (g)" defaultValue={body?.weightG} inputMode="decimal" />
              </div>
              <Field name="batteryLifeShots" label="Autonomie (vues)" defaultValue={body?.batteryLifeShots} inputMode="numeric" />
            </div>
          </section>

          <section>
            <div className="form-section-header"><h3 className="form-section-title">Équipement</h3></div>
            <div className="form-section-body">
              <div className="checkbox-row accessory-checkbox-row"><label><input name="hasIbis" type="checkbox" defaultChecked={body?.hasIbis} /> IBIS</label><label><input name="hasDualCardSlot" type="checkbox" defaultChecked={body?.hasDualCardSlot} /> Double slot</label><label><input name="isWeatherSealed" type="checkbox" defaultChecked={body?.isWeatherSealed} /> Tropicalisation</label><label><input name="hasArticulatedScreen" type="checkbox" defaultChecked={body?.hasArticulatedScreen} /> Écran orientable</label></div>
              <label>Notes<textarea name="notes" defaultValue={body?.notes ?? ""} rows={5} placeholder="Ergonomie, AF, viseur, remarques d'usage..." /></label>
            </div>
          </section>
        </div>
        <div className="checkbox-row"><label><input name="isFavorite" type="checkbox" defaultChecked={body?.isFavorite} /> Favori</label><label><input name="isNextPurchase" type="checkbox" defaultChecked={body?.isNextPurchase} /> À acheter</label><label><input name="isOwned" type="checkbox" defaultChecked={body?.isOwned} /> Possédé</label><label><input name="retired" type="checkbox" defaultChecked={body?.retired} /> Retiré</label></div>
        <div className="form-actions">
          {body ? <button type="submit" formAction={async () => { await deleteBodyAction(body.id); onClose(); }} className="danger-button">Supprimer</button> : null}
          <button type="button" className="ghost-button" onClick={onClose}>Annuler</button>
          <button className="primary-button">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, defaultValue, required, inputMode, placeholder }: { name: string; label: string; defaultValue?: string | number | null; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; placeholder?: string }) {
  return <label>{label}<input name={name} defaultValue={defaultValue ?? ""} required={required} inputMode={inputMode} placeholder={placeholder} /></label>;
}
