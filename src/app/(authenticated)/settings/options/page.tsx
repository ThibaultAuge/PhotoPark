import { listReferenceData } from "@/lib/db/lens-repository";
import { OptionManager } from "@/components/settings/OptionManager";

export default function OptionsSettingsPage() {
  const referenceData = listReferenceData();
  return <OptionManager options={referenceData.options} />;
}
