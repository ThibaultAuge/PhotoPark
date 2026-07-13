"use client";

import React, { useMemo, useState } from "react";
import { createAccessoryAction, deleteAccessoryAction, updateAccessoryAction } from "@/app/actions/accessory-actions";
import { deriveFilterAccessoryPresentation, getOtherAccessoryProfileConfig, resolveFilterAccessoryTypeId } from "@/lib/accessory/accessory-utils";
import type { Accessory, AccessoryReferenceData, AccessoryTypeCategory } from "@/lib/accessory/types";

export function AccessoryForm({
  title,
  referenceData,
  accessories,
  typeCategory,
  accessory,
  onClose,
}: {
  title: string;
  referenceData: AccessoryReferenceData;
  accessories: Accessory[];
  typeCategory: AccessoryTypeCategory;
  accessory?: Accessory;
  onClose: () => void;
}) {
  const action = accessory ? updateAccessoryAction.bind(null, accessory.id) : createAccessoryAction;
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const allowedTypes = useMemo(
    () => referenceData.types.filter((type) => type.category === typeCategory),
    [referenceData.types, typeCategory],
  );
  const [selectedTypeId, setSelectedTypeId] = useState(accessory?.typeId ?? allowedTypes[0]?.id ?? "");
  const selectedType = useMemo(() => allowedTypes.find((type) => type.id === selectedTypeId) ?? null, [allowedTypes, selectedTypeId]);
  const otherProfileConfig = useMemo(() => getOtherAccessoryProfileConfig(selectedType?.profile ?? null), [selectedType?.profile]);
  const [mountTarget, setMountTarget] = useState<"none" | "lens" | "accessory">(
    accessory?.mountedOnLensId ? "lens" : accessory?.mountedOnAccessoryId ? "accessory" : "none",
  );
  const [filterDraft, setFilterDraft] = useState(() => ({
    filterRole: accessory?.filterRole ?? "filter",
    rearMountType: accessory?.rearMountType ?? "none",
    rearDiameterMm: accessory?.rearDiameterMm !== null && accessory?.rearDiameterMm !== undefined ? String(accessory.rearDiameterMm) : "",
    frontMountType: accessory?.frontMountType ?? "none",
    frontDiameterMm: accessory?.frontDiameterMm !== null && accessory?.frontDiameterMm !== undefined ? String(accessory.frontDiameterMm) : "",
    supportsMagneticHood: accessory?.supportsMagneticHood ?? false,
    filterStrength: accessory?.filterStrength ?? "",
  }));

  const filterCategory = typeCategory === "filter";
  const useDerivedFilterIdentity = filterCategory && filterDraft.filterRole !== "general";
  const parentAccessories = accessories.filter((item) => item.id !== accessory?.id && item.typeCategory === "filter" && (item.mountedOnLensId || item.mountedOnAccessoryId));
  const mountableLenses = referenceData.lenses.filter((lens) => lens.filterDiameterMm !== null);
  const derivedFilterPresentation = useDerivedFilterIdentity
    ? deriveFilterAccessoryPresentation({
      filterRole: filterDraft.filterRole,
      rearMountType: filterDraft.rearMountType,
      rearDiameterMm: parseDraftNumber(filterDraft.rearDiameterMm),
      frontMountType: filterDraft.frontMountType,
      frontDiameterMm: parseDraftNumber(filterDraft.frontDiameterMm),
      supportsMagneticHood: filterDraft.supportsMagneticHood,
      filterStrength: filterDraft.filterStrength,
    })
    : null;
  const derivedFilterTypeId = useDerivedFilterIdentity ? resolveFilterAccessoryTypeId(referenceData, derivedFilterPresentation?.typeName ?? null) : "";
  const canSubmitFilter = !useDerivedFilterIdentity || Boolean(derivedFilterPresentation?.valid && derivedFilterTypeId && derivedFilterPresentation.name.trim());

  async function submitAndClose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitFilter) {
      setError(derivedFilterPresentation?.reason ?? "Complète les interfaces pour calculer automatiquement le type et le nom.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      await action(formData);
      onClose();
    } catch (err) {
      setError(formatAccessoryFormError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!accessory) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await deleteAccessoryAction(accessory.id);
      onClose();
    } catch (err) {
      setError(formatAccessoryFormError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="accessory-form-title">
      <form onSubmit={submitAndClose} className="modal-card">
        <div className="modal-header"><h2 id="accessory-form-title">{title}</h2><button type="button" className="ghost-button" onClick={onClose}>Fermer</button></div>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="form-sections">
          <section>
            <div className="form-section-header"><h3 className="form-section-title">Identité</h3></div>
            <div className="form-section-body">
              <label>Marque<select name="brandId" defaultValue={accessory?.brandId ?? referenceData.brands[0]?.id ?? ""} required>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
              {useDerivedFilterIdentity ? (
                <>
                  <input type="hidden" name="typeId" value={derivedFilterTypeId} />
                  <input type="hidden" name="name" value={derivedFilterPresentation?.name ?? ""} />
                  <label>Type calculé<input value={derivedFilterPresentation?.typeName ?? ""} readOnly aria-readonly="true" placeholder="Calculé selon rôle et interfaces" /></label>
                  <label>Nom calculé<input value={derivedFilterPresentation?.name ?? ""} readOnly aria-readonly="true" placeholder="Calculé automatiquement" /></label>
                </>
          ) : typeCategory === "other" ? (
            <>
              <label>Type<select name="typeId" value={selectedTypeId} onChange={(event) => setSelectedTypeId(event.target.value)} required>{allowedTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
              <Field name="name" label="Nom" defaultValue={accessory?.name} required />
            </>
          ) : (
            <>
              <label>Type<select name="typeId" value={selectedTypeId} onChange={(event) => setSelectedTypeId(event.target.value)} required>{allowedTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
              <Field name="name" label="Nom" defaultValue={accessory?.name} required />
                </>
              )}
            </div>
          </section>

          {filterCategory ? (
            <>
              <section>
                <div className="form-section-header"><h3 className="form-section-title">Montage</h3></div>
                <div className="form-section-body">
                  <label>Rôle<select name="filterRole" value={filterDraft.filterRole} onChange={(event) => updateFilterDraft(setFilterDraft, "filterRole", event.target.value as "general" | "filter" | "adapter" | "hood")}><option value="general">Générique</option><option value="filter">Filtre</option><option value="adapter">Adaptateur / bague</option><option value="hood">Pare-soleil</option></select></label>
                  <label>Localisation<select name="storageLocation" defaultValue={accessory?.storageLocation ?? "bag"}><option value="bag">Sac</option><option value="reserve">Réserve</option></select></label>
                  <label>Cible de montage<select value={mountTarget} onChange={(event) => setMountTarget(event.target.value as "none" | "lens" | "accessory")}><option value="none">Non monté</option><option value="lens">Directement sur un objectif</option><option value="accessory">Devant une autre pièce</option></select></label>
                  {mountTarget === "lens" ? (
                    <label>Objectif<select name="mountedOnLensId" defaultValue={accessory?.mountedOnLensId ?? mountableLenses[0]?.id ?? ""} required><option value="">Sélectionner</option>{mountableLenses.map((lens) => <option key={lens.id} value={lens.id}>{lens.label}</option>)}</select></label>
                  ) : <input type="hidden" name="mountedOnLensId" value="" />}
                  {mountTarget === "accessory" ? (
                    <label>Pièce parente<select name="mountedOnAccessoryId" defaultValue={accessory?.mountedOnAccessoryId ?? parentAccessories[0]?.id ?? ""} required><option value="">Sélectionner</option>{parentAccessories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                  ) : <input type="hidden" name="mountedOnAccessoryId" value="" />}
                  {mountTarget === "none" ? <><input type="hidden" name="mountedOnLensId" value="" /><input type="hidden" name="mountedOnAccessoryId" value="" /></> : null}
                  <Field name="filterStrength" label="Force / variante" value={filterDraft.filterStrength} onChange={(event) => updateFilterDraft(setFilterDraft, "filterStrength", event.target.value)} />
                </div>
              </section>
              <section>
                <div className="form-section-header"><h3 className="form-section-title">Interfaces</h3></div>
                <div className="form-section-body">
                  <div className="form-row">
                    <label>Arrière<select name="rearMountType" value={filterDraft.rearMountType} onChange={(event) => updateFilterDraft(setFilterDraft, "rearMountType", event.target.value)}><option value="none">Aucune</option><option value="threaded">Filetée</option><option value="magnetic">Magnétique</option></select></label>
                    <Field name="rearDiameterMm" label="Diamètre arrière (mm)" value={filterDraft.rearDiameterMm} onChange={(event) => updateFilterDraft(setFilterDraft, "rearDiameterMm", event.target.value)} inputMode="decimal" />
                  </div>
                  {filterDraft.filterRole === "filter" ? (
                    <>
                      <input type="hidden" name="frontMountType" value={filterDraft.rearMountType} />
                      <input type="hidden" name="frontDiameterMm" value={filterDraft.rearDiameterMm} />
                      <p className="form-help">Pour un filtre, l&apos;interface avant est identique à l&apos;interface arrière.</p>
                    </>
                  ) : (
                    <>
                      <div className="form-row">
                        <label>Avant<select name="frontMountType" value={filterDraft.frontMountType} onChange={(event) => updateFilterDraft(setFilterDraft, "frontMountType", event.target.value)}><option value="none">Aucune</option><option value="threaded">Filetée</option><option value="magnetic">Magnétique</option></select></label>
                        <Field name="frontDiameterMm" label="Diamètre avant (mm)" value={filterDraft.frontDiameterMm} onChange={(event) => updateFilterDraft(setFilterDraft, "frontDiameterMm", event.target.value)} inputMode="decimal" />
                      </div>
                    </>
                  )}
                  <label><input name="supportsMagneticHood" type="checkbox" checked={filterDraft.supportsMagneticHood} onChange={(event) => updateFilterDraft(setFilterDraft, "supportsMagneticHood", event.target.checked)} /> Supporte un pare-soleil magnétique</label>
                  {!derivedFilterPresentation?.valid ? <p className="form-help form-help-error">{derivedFilterPresentation?.reason}</p> : null}
                  <label>Notes<textarea name="capacityNotes" defaultValue={accessory?.capacityNotes ?? ""} rows={4} placeholder="Ex. bague de réduction 52→77 vers Kase magnétique" /></label>
                </div>
              </section>
            </>
          ) : typeCategory === "other" ? (
            <>
              <section>
                <div className="form-section-header"><h3 className="form-section-title">Caractéristiques</h3></div>
                <div className="form-section-body">
                  {otherProfileConfig && otherProfileConfig.fields.length > 0 ? otherProfileConfig.fields.map((field) => (
                    <Field key={field.key} name={field.key} label={field.label} defaultValue={accessory?.[field.key] ?? ""} inputMode={field.key === "specPower" ? "decimal" : undefined} placeholder={field.placeholder} />
                  )) : <p className="form-help">Ce type n&apos;a pas de champ dédié. Utilise le nom libre et les notes.</p>}
                </div>
              </section>
              <section>
                <div className="form-section-header"><h3 className="form-section-title">Informations</h3></div>
                <div className="form-section-body">
                  <div className="form-row">
                    <Field name="weightG" label="Poids (g)" defaultValue={accessory?.weightG} inputMode="decimal" />
                    <Field name="priceEur" label="Prix (€)" defaultValue={accessory?.priceEur} inputMode="decimal" />
                  </div>
                  <label>Notes<textarea name="capacityNotes" defaultValue={accessory?.capacityNotes ?? ""} rows={4} placeholder="Ex. lot de 4, version USB-C, usage studio..." /></label>
                </div>
              </section>
              <OtherAccessoryHiddenFields accessory={accessory} />
            </>
          ) : (
            <>
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
              <BagAccessoryHiddenFields accessory={accessory} />
            </>
          )}
        </div>
        <div className="checkbox-row"><label><input name="isFavorite" type="checkbox" defaultChecked={accessory?.isFavorite} /> Favori</label><label><input name="isNextPurchase" type="checkbox" defaultChecked={accessory?.isNextPurchase} /> À acheter</label><label><input name="isOwned" type="checkbox" defaultChecked={accessory?.isOwned} /> Possédé</label><label><input name="retired" type="checkbox" defaultChecked={accessory?.retired} /> Retiré</label></div>
        <div className="form-actions">
          {accessory ? <button type="button" onClick={handleDelete} disabled={isSubmitting} className="danger-button">Supprimer</button> : null}
          <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>Annuler</button>
          <button className="primary-button" disabled={isSubmitting || !canSubmitFilter}>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</button>
        </div>
      </form>
    </div>
  );
}

function OtherAccessoryHiddenFields({ accessory }: { accessory?: Accessory }) {
  return (
    <>
      <input type="hidden" name="capacityLiters" value="" />
      <input type="hidden" name="capacityBodies" value="" />
      <input type="hidden" name="capacityLenses" value="" />
      <input type="hidden" name="fitsLaptop" value="" />
      <input type="hidden" name="fitsTripod" value="" />
      <input type="hidden" name="widthMm" value="" />
      <input type="hidden" name="heightMm" value="" />
      <input type="hidden" name="depthMm" value="" />
      <input type="hidden" name="carryStyleNotes" value="" />
      <input type="hidden" name="storageLocation" value={accessory?.storageLocation ?? "bag"} />
      <input type="hidden" name="mountedOnLensId" value="" />
      <input type="hidden" name="mountedOnAccessoryId" value="" />
      <input type="hidden" name="rearMountType" value="none" />
      <input type="hidden" name="rearDiameterMm" value="" />
      <input type="hidden" name="frontMountType" value="none" />
      <input type="hidden" name="frontDiameterMm" value="" />
      <input type="hidden" name="filterRole" value="general" />
      <input type="hidden" name="filterStrength" value="" />
      <input type="hidden" name="supportsMagneticHood" value="" />
    </>
  );
}

function BagAccessoryHiddenFields({ accessory }: { accessory?: Accessory }) {
  return (
    <>
      <input type="hidden" name="storageLocation" value={accessory?.storageLocation ?? "bag"} />
      <input type="hidden" name="mountedOnLensId" value="" />
      <input type="hidden" name="mountedOnAccessoryId" value="" />
      <input type="hidden" name="rearMountType" value="none" />
      <input type="hidden" name="rearDiameterMm" value="" />
      <input type="hidden" name="frontMountType" value="none" />
      <input type="hidden" name="frontDiameterMm" value="" />
      <input type="hidden" name="filterRole" value="general" />
      <input type="hidden" name="filterStrength" value="" />
      <input type="hidden" name="supportsMagneticHood" value="" />
    </>
  );
}

function Field({ name, label, defaultValue, value, onChange, required, inputMode, placeholder }: { name: string; label: string; defaultValue?: string | number | null; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; placeholder?: string }) {
  // Controlled mode when value is provided; uncontrolled mode otherwise
  const props: React.InputHTMLAttributes<HTMLInputElement> = { name, required, inputMode, placeholder };
  if (value !== undefined) {
    props.value = value;
    props.onChange = onChange;
  } else {
    props.defaultValue = defaultValue ?? "";
  }
  return <label>{label}<input {...props} /></label>;
}

function formatAccessoryFormError(error: unknown) {
  if (!(error instanceof Error)) return "Une erreur est survenue.";

  const parsed = tryParseZodIssues(error.message);
  if (parsed) return parsed;

  return error.message || "Une erreur est survenue.";
}

function tryParseZodIssues(message: string) {
  try {
    const parsed = JSON.parse(message) as Array<{ path?: string[]; message?: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((issue) => issue.message).filter((value): value is string => Boolean(value)).join(" · ");
  } catch {
    return null;
  }
}

function parseDraftNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function updateFilterDraft(
  setFilterDraft: React.Dispatch<React.SetStateAction<{
    filterRole: "general" | "filter" | "adapter" | "hood";
    rearMountType: "none" | "threaded" | "magnetic";
    rearDiameterMm: string;
    frontMountType: "none" | "threaded" | "magnetic";
    frontDiameterMm: string;
    supportsMagneticHood: boolean;
    filterStrength: string;
  }>>,
  key: string,
  value: string | boolean,
) {
  setFilterDraft((current) => ({ ...current, [key]: value }));
}
