import { SubNav } from "@/components/layout/SubNav";

const settingsSubNavItems = [
  { href: "/settings/brands", label: "Marques" },
  { href: "/settings/mounts", label: "Montures" },
  { href: "/settings/options", label: "Options" },
  { href: "/settings/options/groups", label: "Groupes" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubNav items={settingsSubNavItems} />
      {children}
    </>
  );
}
