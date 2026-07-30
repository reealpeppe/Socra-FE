import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cosa vuoi imparare · Socra",
  description: "Scegli il tema su cui vuoi confrontarti con la community Socra.",
};

export default function GoalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
