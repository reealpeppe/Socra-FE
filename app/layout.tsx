import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socra",
  description: "Peer mentorship for investment learning paths"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
