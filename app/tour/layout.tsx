import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Come iniziare · Socra",
  description: "Scopri come funzionano matching, richieste e percorsi Socra.",
};

export default function TourLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
