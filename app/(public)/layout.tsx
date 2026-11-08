
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import { PrelaunchPublicBoundary } from "@/components/PrelaunchPublicBoundary";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><PublicNavbar /><PrelaunchPublicBoundary>{children}</PrelaunchPublicBoundary><PublicFooter /></>;
}
