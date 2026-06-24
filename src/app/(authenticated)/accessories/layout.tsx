import { SubNav } from "@/components/layout/SubNav";
import { AccessoryProvider } from "@/components/accessory/AccessoryProvider";
import { listAccessories, listAccessoryReferenceData } from "@/lib/db/accessory-repository";

const accessoriesSubNavItems = [
  { href: "/accessories", label: "Sacs & poches" },
];

export default function AccessoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccessoryProvider initialAccessories={listAccessories()} referenceData={listAccessoryReferenceData()}>
      <SubNav items={accessoriesSubNavItems} />
      {children}
    </AccessoryProvider>
  );
}
