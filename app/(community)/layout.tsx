import { PersistentAppShell } from "@/components/AppShell";
import { EmailVerificationGate } from "@/components/EmailVerificationGate";
import { PrelaunchGate } from "@/components/PrelaunchGate";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <PrelaunchGate><PersistentAppShell><EmailVerificationGate>{children}</EmailVerificationGate></PersistentAppShell></PrelaunchGate>;
}
