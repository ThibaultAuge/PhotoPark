"use client";

import React, { useState } from "react";
import { createAccessoryAction, deleteAccessoryAction, updateAccessoryAction } from "@/app/actions/accessory-actions";
import type { Accessory, AccessoryReferenceData } from "@/lib/accessory/types";

export function AccessoryForm({ title, referenceData, accessory, onClose }: { title: string; referenceData: AccessoryReferenceData; accessory?: Accessory; onClose: () => void }) {
  const action = accessory ? updateAccessoryAction.bind(null, accessory.id) : createAccessoryAction;
  const [error, setError] = useState<string | null>(null);

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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="accessory-form-title">
      <form action={submitAndClose} className="modal-card">
        <div className="modal-header"><h2 id="accessory-form-title">{title}</h2><button type="button" className="ghost-button" onClick={onClose}>Fermer</button></div>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="form-sections">
          <section>
            <div className="form-section-header"><h3 className="form-section-title">Identité</h3></div>
            <div className="form-section-body">
              <label>Marque<select name="brandId" defaultValue={accessory?.brandId ?? referenceData.brands[0]?.id ?? ""} required>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
              <label>Type<select name="typeId" defaultValue={accessory?.typeId ?? referenceData.types[0]?.id ?? ""} required>{referenceData.types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
              <Field name="name" label="Nom" defaultValue={accessory?.name} required />
            </div>
          </section>
          <section>
            <div className="form-section-header"><h3 className="form-section-title">Capacité</h3></div>
            <div className="form-section-body">
              <div className="form-row">
                <Field name="capacityLiters" label="Litres" defaultValue={accessory?.capacityLiters} inputMode="decimal" />
                <Field name="capacityBodies" label="Nb boîtiers" defaultValue={accessory?.capacityBodies} inputMode="numeric" />
              </div>
              <div className="form-row">
                <Field name="capacityLenses" label="Nb objectifs" defaultValue={accessory?.capacityLenses} inputMode="numeric" />
                <Field name="weightG" label="Poids (g)" defaultValue={accessory?.weightG} inputMode="decimal" />
              </div>
              <label>Notes capacité<textarea name="capacityNotes" defaultValue={accessory?.capacityNotes ?? ""} rows={4} /></label>
            </div>
          </section>
          <section>
            <div className="form-section-header"><h3 className="form-section-title">Encombrement</h3></div>
            <div className="form-section-body">
              <div className="form-row-3">
                <Field name="widthMm" label="Largeur (mm)" defaultValue={accessory?.widthMm} inputMode="decimal" />
                <Field name="heightMm" label="Hauteur (mm)" defaultValue={accessory?.heightMm} inputMode="decimal" />
                <Field name="depthMm" label="Profondeur (mm)" defaultValue={accessory?.depthMm} inputMode="decimal" />
              </div>
              <Field name="priceEur" label="Prix (€)" defaultValue={accessory?.priceEur} inputMode="decimal" />
            </div>
          </section>
          <section>
            <div className="form-section-header"><h3 className="form-section-title">Transport</h3></div>
            <div className="form-section-body">
              <label>Confort / transport<textarea name="carryStyleNotes" defaultValue={accessory?.carryStyleNotes ?? ""} rows={4} placeholder="Ceinture ventrale, accès rapide, housse pluie..." /></label>
              <div className="checkbox-row accessory-checkbox-row"><label><input name="fitsLaptop" type="checkbox" defaultChecked={accessory?.fitsLaptop} /> Laptop</label><label><input name="fitsTripod" type="checkbox" defaultChecked={accessory?.fitsTripod} /> Trépied</label></div>
            </div>
          </section>
        </div>
        <div className="checkbox-row"><label><input name="isFavorite" type="checkbox" defaultChecked={accessory?.isFavorite} /> Favori</label><label><input name="isNextPurchase" type="checkbox" defaultChecked={accessory?.isNextPurchase} /> À acheter</label><label><input name="isOwned" type="checkbox" defaultChecked={accessory?.isOwned} /> Possédé</label><label><input name="retired" type="checkbox" defaultChecked={accessory?.retired} /> Retiré</label></div>
        <div className="form-actions">
          {accessory ? <button type="submit" formAction={async () => { await deleteAccessoryAction(accessory.id); onClose(); }} className="danger-button">Supprimer</button> : null}
          <button type="button" className="ghost-button" onClick={onClose}>Annuler</button>
          <button className="primary-button">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, defaultValue, required, inputMode }: { name: string; label: string; defaultValue?: string | number | null; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return <label>{label}<input name={name} defaultValue={defaultValue ?? ""} required={required} inputMode={inputMode} /></label>;
}
