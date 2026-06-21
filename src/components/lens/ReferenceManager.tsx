import type { LensReferenceData } from "@/lib/lens/types";
import { createBrandAction, createMountAction, createOptionAction, deleteBrandAction, deleteMountAction, deleteOptionAction, updateBrandAction, updateMountAction, updateOptionAction } from "@/app/actions/lens-actions";

export function ReferenceManager({ referenceData }: { referenceData: LensReferenceData }) {
  return (
    <details className="card reference-manager">
      <summary>Gérer les listes : marques, montures et options</summary>
      <div className="reference-grid">
        <section><h3>Marques</h3><form action={createBrandAction} className="inline-form"><input name="name" placeholder="Nouvelle marque" required /><button className="primary-button">Ajouter</button></form>{referenceData.brands.map((brand) => <form key={brand.id} action={updateBrandAction.bind(null, brand.id)} className="inline-form"><input name="name" defaultValue={brand.name} required /><button className="ghost-button">OK</button><button formAction={deleteBrandAction.bind(null, brand.id)} className="danger-button">Supprimer</button></form>)}</section>
        <section><h3>Montures</h3><form action={createMountAction} className="inline-form"><input name="name" placeholder="Canon RF-S" required /><select name="sensorType" defaultValue="FULL_FRAME"><option value="FULL_FRAME">Plein format</option><option value="APS_C">APS-C</option></select><button className="primary-button">Ajouter</button></form>{referenceData.mounts.map((mount) => <form key={mount.id} action={updateMountAction.bind(null, mount.id)} className="inline-form"><input name="name" defaultValue={mount.name} required /><select name="sensorType" defaultValue={mount.sensorType}><option value="FULL_FRAME">Plein format</option><option value="APS_C">APS-C</option></select><button className="ghost-button">OK</button><button formAction={deleteMountAction.bind(null, mount.id)} className="danger-button">Supprimer</button></form>)}</section>
        <section><h3>Options</h3><form action={createOptionAction} className="inline-form"><input name="code" placeholder="IS" required /><input name="description" placeholder="Stabilisation optique" required /><button className="primary-button">Ajouter</button></form>{referenceData.options.map((option) => <form key={option.id} action={updateOptionAction.bind(null, option.id)} className="inline-form"><input name="code" defaultValue={option.code} required /><input name="description" defaultValue={option.description} required /><button className="ghost-button">OK</button><button formAction={deleteOptionAction.bind(null, option.id)} className="danger-button">Supprimer</button></form>)}</section>
      </div>
    </details>
  );
}
