import { listBrandsWithDomains } from "@/lib/db/lens-repository";
import { BrandManager } from "@/components/settings/BrandManager";

export default function BrandsSettingsPage() {
  return <BrandManager brands={listBrandsWithDomains()} />;
}
