import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Socra",
  title: {
    default: "Socra — Community peer-to-peer",
    template: "%s | Socra"
  },
  description: "La community peer-to-peer per confrontarsi, imparare e condividere esperienze sugli investimenti.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Socra",
    title: "Socra — Community peer-to-peer",
    description: "Confrontati, impara e condividi esperienze sugli investimenti con la community Socra."
  },
  twitter: {
    card: "summary",
    title: "Socra — Community peer-to-peer",
    description: "Confrontati, impara e condividi esperienze sugli investimenti con la community Socra."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020817"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
