
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><PublicNavbar />{children}<PublicFooter /></>;
}
