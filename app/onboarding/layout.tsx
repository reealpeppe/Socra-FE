import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey iniziale · Socra",
  description: "Completa la survey iniziale e prepara il tuo primo percorso nella community Socra.",
};

export default function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
