import { listLenses, listReferenceData } from "@/lib/db/lens-repository";
import { LensProvider } from "@/components/lens/LensProvider";
import { SubNav } from "@/components/layout/SubNav";

const lensSubNavItems = [
  { href: "/lenses", label: "Liste" },
  { href: "/lenses/chart", label: "Graphique des ouvertures" },
];

export default async function LensesLayout({ children }: { children: React.ReactNode }) {
  const lenses = listLenses();
  const referenceData = listReferenceData();

  return (
    <LensProvider initialLenses={lenses} referenceData={referenceData}>
      <SubNav items={lensSubNavItems} />
      {children}
    </LensProvider>
  );
}
