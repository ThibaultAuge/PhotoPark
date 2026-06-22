"use client";

import React, { useMemo, useState } from "react";
import type { Lens, LensReferenceData } from "@/lib/lens/types";
import { createLensAction, updateLensAction } from "@/app/actions/lens-actions";
import { generateLensLabel } from "@/lib/lens/lens-utils";
import { parseLensLabel } from "@/lib/lens/label-parser";

export function LensForm({ title, lens, referenceData, onClose }: { title: string; lens?: Lens; referenceData: LensReferenceData; onClose: () => void }) {
  const action = lens ? updateLensAction.bind(null, lens.id) : createLensAction;
  const [brandId, setBrandId] = useState(lens?.brandId ?? referenceData.brands[0]?.id ?? "");
  const [mountId, setMountId] = useState(lens?.mountId ?? referenceData.mounts[0]?.id ?? "");
  const [focalMinMm, setFocalMinMm] = useState(formatFieldValue(lens?.focalMinMm));
  const [focalMaxMm, setFocalMaxMm] = useState(formatFieldValue(lens?.focalMaxMm));
  const [maxApertureAtMinFocal, setMaxApertureAtMinFocal] = useState(formatFieldValue(lens?.maxApertureAtMinFocal));
  const [maxApertureAtMaxFocal, setMaxApertureAtMaxFocal] = useState(formatFieldValue(lens?.maxApertureAtMaxFocal));
  const [optionIds, setOptionIds] = useState(lens?.options.map((option) => option.id) ?? []);
  const [labelDraft, setLabelDraft] = useState(lens?.label ?? buildLabel(referenceData, { brandId, mountId, focalMinMm, focalMaxMm, maxApertureAtMinFocal, maxApertureAtMaxFocal, optionIds }));
  const selectedOptionIds = useMemo(() => new Set(optionIds), [optionIds]);

  function updateFields(nextFields: Partial<FormLabelFields>) {
    const nextState = { brandId, mountId, focalMinMm, focalMaxMm, maxApertureAtMinFocal, maxApertureAtMaxFocal, optionIds, ...nextFields };
    if (typeof nextFields.brandId === "string") setBrandId(nextFields.brandId);
    if (typeof nextFields.mountId === "string") setMountId(nextFields.mountId);
    if (typeof nextFields.focalMinMm === "string") setFocalMinMm(nextFields.focalMinMm);
    if (typeof nextFields.focalMaxMm === "string") setFocalMaxMm(nextFields.focalMaxMm);
    if (typeof nextFields.maxApertureAtMinFocal === "string") setMaxApertureAtMinFocal(nextFields.maxApertureAtMinFocal);
    if (typeof nextFields.maxApertureAtMaxFocal === "string") setMaxApertureAtMaxFocal(nextFields.maxApertureAtMaxFocal);
    if (Array.isArray(nextFields.optionIds)) setOptionIds(nextFields.optionIds);
    setLabelDraft(buildLabel(referenceData, nextState));
  }

  function applyLabel(value: string) {
    setLabelDraft(value);
    const parsed = parseLensLabel(value, referenceData);
    if (parsed.brandId) setBrandId(parsed.brandId);
    if (parsed.mountId) setMountId(parsed.mountId);
    if (typeof parsed.focalMinMm === "number") setFocalMinMm(String(parsed.focalMinMm));
    if (typeof parsed.focalMaxMm === "number") setFocalMaxMm(String(parsed.focalMaxMm));
    if (typeof parsed.maxApertureAtMinFocal === "number") setMaxApertureAtMinFocal(String(parsed.maxApertureAtMinFocal));
    if (typeof parsed.maxApertureAtMaxFocal === "number") setMaxApertureAtMaxFocal(String(parsed.maxApertureAtMaxFocal));
    setOptionIds(parsed.optionIds ?? []);
  }

  function toggleOption(optionId: string, checked: boolean) {
    const nextOptionIds = checked ? Array.from(new Set([...optionIds, optionId])) : optionIds.filter((id) => id !== optionId);
    updateFields({ optionIds: nextOptionIds });
  }

  async function submitAndClose(formData: FormData) {
    await action(formData);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lens-form-title">
      <form action={submitAndClose} className="modal-card">
        <div className="modal-header"><h2 id="lens-form-title">{title}</h2><button type="button" className="ghost-button" onClick={onClose}>Fermer</button></div>
        <div className="form-grid">
          <label>Libellé<input type="text" value={labelDraft} onChange={(event) => applyLabel(event.target.value)} placeholder="Canon EF 18-55 F/3,5-5,6 IS" maxLength={160} /></label>
          <label>Marque<select name="brandId" value={brandId} onChange={(event) => updateFields({ brandId: event.target.value })} required>{referenceData.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
          <label>Monture<select name="mountId" value={mountId} onChange={(event) => updateFields({ mountId: event.target.value })} required>{referenceData.mounts.map((mount) => <option key={mount.id} value={mount.id}>{mount.name} — {mount.sensorType === "FULL_FRAME" ? "Plein format" : "APS-C"}</option>)}</select></label>
          <ControlledField name="focalMinMm" label="Focale min" type="text" inputMode="decimal" value={focalMinMm} onChange={(value) => updateFields({ focalMinMm: value })} required />
          <ControlledField name="focalMaxMm" label="Focale max" type="text" inputMode="decimal" value={focalMaxMm} onChange={(value) => updateFields({ focalMaxMm: value })} required />
          <ControlledField name="maxApertureAtMinFocal" label="Ouverture max à min focale" type="text" inputMode="decimal" value={maxApertureAtMinFocal} onChange={(value) => updateFields({ maxApertureAtMinFocal: value })} required />
          <ControlledField name="maxApertureAtMaxFocal" label="Ouverture max à max focale" type="text" inputMode="decimal" value={maxApertureAtMaxFocal} onChange={(value) => updateFields({ maxApertureAtMaxFocal: value })} />
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
        <fieldset className="options-fieldset"><legend>Options</legend>{referenceData.options.map((option) => <label key={option.id}><input name="optionIds" type="checkbox" value={option.id} checked={selectedOptionIds.has(option.id)} onChange={(event) => toggleOption(option.id, event.target.checked)} /> <strong>{option.code}</strong> — {option.description}</label>)}</fieldset>
        <div className="checkbox-row"><label><input name="isFavorite" type="checkbox" defaultChecked={lens?.isFavorite} /> Favori</label><label><input name="isNextPurchase" type="checkbox" defaultChecked={lens?.isNextPurchase} /> Prochain achat</label><label><input name="isOwned" type="checkbox" defaultChecked={lens?.isOwned} /> Possédé</label></div>
        <button className="primary-button">Enregistrer</button>
      </form>
    </div>
  );
}

type FormLabelFields = {
  brandId: string;
  mountId: string;
  focalMinMm: string;
  focalMaxMm: string;
  maxApertureAtMinFocal: string;
  maxApertureAtMaxFocal: string;
  optionIds: string[];
};

function buildLabel(referenceData: LensReferenceData, fields: FormLabelFields) {
  const brand = referenceData.brands.find((item) => item.id === fields.brandId);
  const mount = referenceData.mounts.find((item) => item.id === fields.mountId);
  const focalMinMm = parseFormNumber(fields.focalMinMm);
  const focalMaxMm = parseFormNumber(fields.focalMaxMm);
  const maxApertureAtMinFocal = parseFormNumber(fields.maxApertureAtMinFocal);
  const maxApertureAtMaxFocal = parseFormNumber(fields.maxApertureAtMaxFocal) ?? maxApertureAtMinFocal;

  if (!brand || !mount || focalMinMm === undefined || focalMaxMm === undefined || maxApertureAtMinFocal === undefined || maxApertureAtMaxFocal === undefined) {
    return [brand?.name, mount?.name].filter(Boolean).join(" ");
  }

  return generateLensLabel({
    brand: brand.name,
    mount: mount.name,
    focalMinMm,
    focalMaxMm,
    maxApertureAtMinFocal,
    maxApertureAtMaxFocal,
    options: referenceData.options.filter((option) => fields.optionIds.includes(option.id))
  });
}

function parseFormNumber(value: string) {
  if (value.trim() === "") return undefined;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatFieldValue(value: string | number | null | undefined) {
  return value === null || typeof value === "undefined" ? "" : String(value);
}

function ControlledField({ name, label, type = "text", inputMode, value, onChange, required }: { name: string; label: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label>{label}<input name={name} type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Field({ name, label, type = "text", step, inputMode, defaultValue, required }: { name: string; label: string; type?: string; step?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; defaultValue?: string | number | null; required?: boolean }) {
  return <label>{label}<input name={name} type={type} step={step} inputMode={inputMode} defaultValue={defaultValue ?? ""} required={required} /></label>;
}
