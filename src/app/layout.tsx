import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhotoPark",
  description: "PhotoPark — Inventaire et comparateur personnel de matériel photo",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
