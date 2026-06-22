import { listReferenceData } from "@/lib/db/lens-repository";
import { MountManager } from "@/components/settings/MountManager";

export default function MountsSettingsPage() {
  const referenceData = listReferenceData();
  return <MountManager mounts={referenceData.mounts} />;
}
