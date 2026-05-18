"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GraduationCap, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
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
        <Suspense fallback={<div className="card"><p className="muted">Caricamento percorsi...</p></div>}>
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
  const [tab, setTab] = useState<"mentee" | "mentor">("mentee");

  useEffect(() => {
    Promise.all([clientGet<UserMe>("/auth/me"), clientGet<PathItem[]>("/paths/me")])
      .then(([userResponse, pathsResponse]) => {
        setUser(userResponse);
        setPaths(pathsResponse);
      })
      .catch((err) => setError(err.message || "Percorsi non disponibili"));
  }, []);

  useEffect(() => {
    setTab(searchParams.get("tab") === "mentor" ? "mentor" : "mentee");
  }, [searchParams]);

  const mentorPaths = paths.filter((path) => path.mentor_id === user?.id);
  const menteePaths = paths.filter((path) => path.mentee_id === user?.id);
  const displayed = tab === "mentee" ? menteePaths : mentorPaths;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
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
            <strong style={{ color: "var(--navy-950)", fontSize: "1.5rem", lineHeight: 1 }}>{menteePaths.length}</strong>
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
            <strong style={{ color: "var(--navy-950)", fontSize: "1.5rem", lineHeight: 1 }}>{mentorPaths.length}</strong>
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {/* Tabs */}
      <div style={{ borderBottom: "2px solid var(--line)", display: "flex", gap: "0" }}>
        {(["mentee", "mentor"] as const).map((t) => (
          <button
            key={t}
            type="button"
	            onClick={() => {
	              setTab(t);
	              router.replace(`/paths?tab=${t}`, { scroll: false });
	            }}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--navy-950)" : "2px solid transparent",
              color: tab === t ? "var(--navy-950)" : "var(--muted)",
              cursor: "pointer",
              fontWeight: tab === t ? 800 : 600,
              fontSize: "0.9rem",
              marginBottom: "-2px",
              padding: "10px 20px",
              transition: "color 0.15s",
            }}
          >
            {t === "mentee"
              ? `Come mentee (${menteePaths.length})`
              : `Come mentor (${mentorPaths.length})`}
          </button>
        ))}
      </div>

      {/* Path list */}
      {paths.length === 0 || displayed.length === 0 ? (
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
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {displayed.map((path) => {
            const counterpart = tab === "mentee"
              ? (path.mentor?.nickname || path.mentor?.user_id || path.mentor_id)
              : (path.mentee?.nickname || path.mentee?.user_id || path.mentee_id);
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
    </div>
  );
}
