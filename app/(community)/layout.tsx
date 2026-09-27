import { PersistentAppShell } from "@/components/AppShell";
import { EmailVerificationGate } from "@/components/EmailVerificationGate";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <PersistentAppShell><EmailVerificationGate>{children}</EmailVerificationGate></PersistentAppShell>;
}
