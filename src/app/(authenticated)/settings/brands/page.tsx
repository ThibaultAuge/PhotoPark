import { listReferenceData } from "@/lib/db/lens-repository";
import { BrandManager } from "@/components/settings/BrandManager";

export default function BrandsSettingsPage() {
  const referenceData = listReferenceData();
  return <BrandManager brands={referenceData.brands} />;
}
