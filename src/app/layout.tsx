import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Objectifs photo",
  description: "Inventaire et comparateur personnel d'objectifs photo"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
