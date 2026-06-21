import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth-actions";
import { listLenses, listReferenceData } from "@/lib/db/lens-repository";
import { hasValidSession } from "@/lib/auth/session";
import { LensManager } from "@/components/lens/LensManager";

export default async function HomePage() {
  if (!(await hasValidSession())) redirect("/login");
  const lenses = listLenses();
  const referenceData = listReferenceData();
  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Inventaire personnel</p>
          <h1>Objectifs photo</h1>
          <p>Listez, filtrez, visualisez et comparez vos objectifs Canon RF, EF, EF-S et plus.</p>
        </div>
        <form action={logoutAction}>
          <button className="ghost-button">Déconnexion</button>
        </form>
      </header>
      <LensManager initialLenses={lenses} referenceData={referenceData} />
    </main>
  );
}
