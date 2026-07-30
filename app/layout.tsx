import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socra — Percorsi peer-to-peer",
  description: "Percorsi di apprendimento peer-to-peer sugli investimenti, con matching tra mentee e mentor."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
