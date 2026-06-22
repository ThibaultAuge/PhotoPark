"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth-actions";

const links = [
  { href: "/lenses", label: "Objectifs" },
  { href: "/bodies", label: "Boîtiers" },
  { href: "/accessories", label: "Accessoires" },
  { href: "/settings/brands", label: "Paramètres" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/lenses") return pathname.startsWith("/lenses");
    if (href === "/settings/brands") return pathname.startsWith("/settings");
    return pathname.startsWith(href);
  }

  return (
    <nav className="app-nav">
      <Link href="/lenses" className="app-logo">PhotoPark</Link>
      <div className="app-nav-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`app-nav-link${isActive(link.href) ? " active" : ""}`}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <form action={logoutAction} className="app-nav-logout">
        <button className="ghost-button" type="submit">Déconnexion</button>
      </form>
    </nav>
  );
}
