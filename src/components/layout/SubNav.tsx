"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SubNavItem = {
  href: string;
  label: string;
};

export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="sub-nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sub-nav-link${pathname === item.href ? " active" : ""}`}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
