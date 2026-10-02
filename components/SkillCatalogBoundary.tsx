"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ClientApiError, clientGet } from "@/lib/api";
import type { SkillCatalog } from "@/lib/types";

/** Only an explicit 404 selects the legacy UI; outages never change the model. */
export function SkillCatalogBoundary({ children, legacy }: { children: (catalog: SkillCatalog) => ReactNode; legacy: ReactNode }) {
  const [catalog, setCatalog] = useState<SkillCatalog | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    clientGet<SkillCatalog>("/skills/catalog").then(value => {
      if (!value?.topics?.length || !value.discussion_modes?.length) throw new Error("Il catalogo delle attività non è disponibile.");
      if (active) setCatalog(value);
    }).catch(err => {
      if (!active) return;
      if (err instanceof ClientApiError && err.status === 404) setMissing(true);
      else setError(err instanceof Error ? err.message : "Impossibile caricare le attività.");
    });
    return () => { active = false; };
  }, [attempt]);
  if (missing) return legacy;
  if (error) return <div className="card stack" role="alert"><p>{error}</p><button className="button secondary" onClick={() => { setError(null); setAttempt(value => value + 1); }}>Riprova</button></div>;
  if (!catalog) return <div className="card" role="status">Caricamento attività…</div>;
  return children(catalog);
}
