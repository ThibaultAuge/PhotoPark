import { redirect } from "next/navigation";
import { hasValidSession } from "@/lib/auth/session";
import { AppNav } from "@/components/layout/AppNav";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasValidSession())) redirect("/login");

  return (
    <>
      <AppNav />
      <div className="app-shell">{children}</div>
    </>
  );
}
