import { PersistentAppShell } from "@/components/AppShell";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <PersistentAppShell>{children}</PersistentAppShell>;
}
