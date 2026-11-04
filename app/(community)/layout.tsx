import { PrelaunchGate } from "@/components/PrelaunchGate";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <PrelaunchGate>{children}</PrelaunchGate>;
}
