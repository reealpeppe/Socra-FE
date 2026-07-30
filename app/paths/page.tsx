"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { GraduationCap, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { TabPanel, Tabs } from "@/components/Ui";
import { clientGet } from "@/lib/api";
import type { PathItem, UserMe } from "@/lib/types";

const STATUS = {
  open:             { bg: "var(--blue-100)",   color: "var(--blue-600)",  label: "Aperto" },
  pending:          { bg: "var(--orange-100)", color: "#b07d1a",          label: "In attesa" },
  feedback_pending: { bg: "var(--orange-100)", color: "#b07d1a",          label: "Feedback" },
  completed:        { bg: "var(--mint-100)",   color: "var(--mint-600)",  label: "Completato" },
  accepted:         { bg: "var(--mint-100)",   color: "var(--mint-600)",  label: "Accettata" },
  rejected:         { bg: "#fee2e2",           color: "#dc2626",          label: "Rifiutata" },
  expired:          { bg: "var(--line)",       color: "var(--muted)",     label: "Scaduta" },
} as const;

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as keyof typeof STATUS] || { bg: "var(--line)", color: "var(--muted)", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800,
      padding: "4px 10px", whiteSpace: "nowrap"
    }}>{s.label}</span>
  );
}

export default function PathsPage() {
  return (
    <AppShell>
      <OnboardingGate>
        <Suspense fallback={<div className="card"><p className="muted">Caricamento percorsi…</p></div>}>
          <PathsContent />
        </Suspense>
      </OnboardingGate>
    </AppShell>
  );
}

function PathsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [user, setUser] = useState<UserMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestedTab: "mentee" | "mentor" = searchParams.get("tab") === "mentor" ? "mentor" : "mentee";
  const [tab, setTab] = useState<"mentee" | "mentor">(requestedTab);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [userResult, pathsResult] = await Promise.allSettled([
      clientGet<UserMe>("/auth/me"),
      clientGet<PathItem[]>("/paths/me")
    ]);

    if (userResult.status === "fulfilled") setUser(userResult.value);
    else setUser(null);
    if (pathsResult.status === "fulfilled") {
      setPaths(Array.isArray(pathsResult.value) ? pathsResult.value : []);
    } else {
      setPaths([]);
    }
    if (userResult.status === "rejected" || pathsResult.status === "rejected") {
      setError("Non riusciamo a caricare i percorsi. Riprova.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    queueMicrotask(() => setTab(requestedTab));
  }, [requestedTab]);

  function selectTab(value: string) {
    const nextTab = value === "mentor" ? "mentor" : "mentee";
    setTab(nextTab);
    router.replace(`/paths?tab=${nextTab}`, { scroll: false });
  }

  const mentorPaths = paths.filter((path) => path.mentor_id === user?.id);
  const menteePaths = paths.filter((path) => path.mentee_id === user?.id);
  const displayed = tab === "mentee" ? menteePaths : mentorPaths;

  return (
    <div style={{ display: "grid", gap: "24px", margin: "0 auto", maxWidth: "1100px", width: "100%" }}>
      {/* Page header */}
      <div>
        <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
          I tuoi percorsi
        </h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          La chiusura è indipendente per ciascun lato; il completamento richiede feedback bilaterale.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", minWidth: "140px" }}>
          <span style={{
            alignItems: "center", background: "var(--blue-100)", borderRadius: "999px",
            color: "var(--blue-600)", display: "inline-flex", flexShrink: 0,
            height: "38px", justifyContent: "center", width: "38px"
          }}>
            <GraduationCap size={18} aria-hidden />
          </span>
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>Come mentee</p>
            <strong style={{ color: "var(--navy-950)", fontSize: "1.5rem", lineHeight: 1 }}>{loading || error ? "—" : menteePaths.length}</strong>
          </div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", minWidth: "140px" }}>
          <span style={{
            alignItems: "center", background: "var(--mint-100)", borderRadius: "999px",
            color: "var(--mint-600)", display: "inline-flex", flexShrink: 0,
            height: "38px", justifyContent: "center", width: "38px"
          }}>
            <UsersRound size={18} aria-hidden />
          </span>
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>Come mentor</p>
            <strong style={{ color: "var(--navy-950)", fontSize: "1.5rem", lineHeight: 1 }}>{loading || error ? "—" : mentorPaths.length}</strong>
          </div>
        </div>
      </div>

      {error ? (
        <div className="error" role="alert" style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button className="button secondary" type="button" onClick={() => void load()}>Riprova</button>
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs
        id="paths"
        panelId="paths-panel"
        ariaLabel="Percorsi per ruolo"
        value={tab}
        onValueChange={selectTab}
        items={[
          { value: "mentee", label: `Come mentee (${loading || error ? "—" : menteePaths.length})` },
          { value: "mentor", label: `Come mentor (${loading || error ? "—" : mentorPaths.length})` },
        ]}
      />

      {/* Path list */}
      <TabPanel id="paths-panel" labelledBy={`paths-tab-${tab}`}>
      {loading ? (
        <div className="card" role="status" style={{ padding: "36px 24px", textAlign: "center" }}>
          <p className="muted">Caricamento percorsi…</p>
        </div>
      ) : error ? null : paths.length === 0 || displayed.length === 0 ? (
        <div className="card" style={{
          alignItems: "center", borderStyle: "dashed", boxShadow: "none",
          display: "flex", flexDirection: "column", gap: "8px", padding: "48px 24px", textAlign: "center"
        }}>
          <p style={{ color: "var(--muted)", fontWeight: 700, margin: 0 }}>Nessun percorso</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
            {paths.length === 0
              ? "Quando una richiesta viene accettata, appare qui."
              : `Nessun percorso come ${tab}.`}
          </p>
          <Link className="button secondary" href={tab === "mentee" ? "/matching" : "/matching/mentees"}>
            {tab === "mentee" ? "Trova un mentor" : "Cerca mentee"}
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {displayed.map((path) => {
            const counterpart = tab === "mentee"
              ? (path.mentor?.nickname || "Mentor Socra")
              : (path.mentee?.nickname || "Mentee Socra");
            const goalTag = path.goal?.goal_tag || "Percorso";
            const initial = typeof counterpart === "string" ? counterpart.slice(0, 1).toUpperCase() : "?";

            return (
              <Link
                key={path.id}
                href={`/paths/${path.id}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  alignItems: "center",
                  background: "var(--card)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-tight)",
                  display: "flex",
                  gap: "14px",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  transition: "box-shadow 0.15s, transform 0.1s",
                  flexWrap: "wrap",
                  cursor: "pointer",
                }}>
                  {/* Left: avatar + name + goal */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div style={{
                      alignItems: "center",
                      background: "linear-gradient(180deg, #153255, #07172d)",
                      borderRadius: "999px",
                      color: "white",
                      display: "inline-flex",
                      flexShrink: 0,
                      fontWeight: 800,
                      height: "42px",
                      justifyContent: "center",
                      width: "42px",
                      fontSize: "0.95rem"
                    }}>
                      {initial}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {counterpart}
                      </p>
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>{goalTag}</p>
                    </div>
                  </div>

                  {/* Right: status + arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <StatusBadge status={path.status} />
                    <span style={{ color: "var(--muted)", fontSize: "1.1rem" }}>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </TabPanel>
    </div>
  );
}
