import { listReferenceData } from "@/lib/db/lens-repository";
import { OptionGroupManager } from "@/components/settings/OptionGroupManager";

export default function OptionGroupsSettingsPage() {
  const referenceData = listReferenceData();
  return (
    <OptionGroupManager
      groups={referenceData.optionGroups}
      options={referenceData.options}
      brands={referenceData.brands}
      members={referenceData.optionGroupMembers}
    />
  );
}
