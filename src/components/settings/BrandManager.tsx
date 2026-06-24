"use client";

import { useRef, useState } from "react";
import type { BrandDomain, LensBrand } from "@/lib/lens/types";
import { createBrandAction, updateBrandAction, deleteBrandAction } from "@/app/actions/lens-actions";

export function BrandManager({ brands }: { brands: LensBrand[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    setError(null);
    try {
      await createBrandAction(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  }

  return (
    <div className="settings-page">
      <div className="toolbar card">
        <h2>Marques</h2>
      </div>
      <div className="card settings-section">
        <h3>Ajouter une marque</h3>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <form ref={formRef} action={handleAdd} className="inline-form">
          <input name="name" placeholder="Nouvelle marque" required />
          <label className="inline-checkbox"><input name="domains" type="checkbox" value="lenses" defaultChecked /> Objectifs</label>
          <label className="inline-checkbox"><input name="domains" type="checkbox" value="accessories" /> Accessoires</label>
          <button className="primary-button" type="submit">Ajouter</button>
        </form>
      </div>
      <div className="card settings-section">
        <h3>Marques existantes ({brands.length})</h3>
        {brands.length === 0 ? (
          <p className="empty-state">Aucune marque. Ajoutez-en une ci-dessus.</p>
        ) : (
          <div className="settings-list">
            {brands.map((brand) => (
              <form key={brand.id} action={updateBrandAction.bind(null, brand.id)} className="inline-form">
                <input name="name" defaultValue={brand.name} required />
                <label className="inline-checkbox"><input name="domains" type="checkbox" value="lenses" defaultChecked={hasDomain(brand.domains, "lenses")} /> Objectifs</label>
                <label className="inline-checkbox"><input name="domains" type="checkbox" value="accessories" defaultChecked={hasDomain(brand.domains, "accessories")} /> Accessoires</label>
                <button className="ghost-button" type="submit">OK</button>
                <button formAction={deleteBrandAction.bind(null, brand.id)} className="danger-button" type="submit">Supprimer</button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function hasDomain(domains: BrandDomain[] | undefined, domain: BrandDomain) {
  return domains?.includes(domain) ?? false;
}
