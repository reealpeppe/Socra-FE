import { redirect } from "next/navigation";

// Keep old bookmarks usable without exposing the retired public level model.
export default function LegacyLevelsPage() {
  redirect("/come-funziona");
}
