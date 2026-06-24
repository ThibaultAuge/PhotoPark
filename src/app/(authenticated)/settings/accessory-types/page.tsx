import { AccessoryTypeManager } from "@/components/settings/AccessoryTypeManager";
import { listAccessoryReferenceData } from "@/lib/db/accessory-repository";

export default function AccessoryTypesSettingsPage() {
  const referenceData = listAccessoryReferenceData();
  return <AccessoryTypeManager types={referenceData.types} />;
}
