
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import { PrelaunchNotice } from "@/components/PrelaunchNotice";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><PublicNavbar /><PrelaunchNotice />{children}<PublicFooter /></>;
}
