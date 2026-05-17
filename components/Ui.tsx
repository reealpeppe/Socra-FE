import Link from "next/link";
import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="page-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link href={href} className={`button ${variant}`}>
      {children}
    </Link>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <Card className="empty-card surface-empty">
      <div className="stack">
        <h3>{title}</h3>
        <p className="muted">{body}</p>
        {action}
      </div>
    </Card>
  );
}

export function StatusPill({ status }: { status: string }) {
  const klass = status === "completed" ? "green" : status === "pending" || status === "feedback_pending" ? "amber" : "";
  return <span className={`pill ${klass}`}>{formatStatus(status)}</span>;
}

export function MetricCard({ label, value, detail, tone = "" }: { label: string; value: React.ReactNode; detail?: React.ReactNode; tone?: "green" | "amber" | "" }) {
  return (
    <Card className="metric-card">
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      {detail ? <span className={`metric-detail ${tone}`}>{detail}</span> : null}
    </Card>
  );
}

export function IconDisc({ children, tone = "" }: { children: React.ReactNode; tone?: "green" | "amber" | "purple" | "" }) {
  return <span className={`icon-disc ${tone}`.trim()}>{children}</span>;
}

export function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    open: "Aperto",
    pending: "In attesa",
    feedback_pending: "Feedback",
    completed: "Completato"
  };
  return labels[status] || status.replace(/_/g, " ");
}

// ── NUOVI COMPONENTI ──

const AVATAR_COLORS = [
  "#2f62d6", "#6857d6", "#129b68", "#b07d1a",
  "#c2410c", "#0e7490", "#7c3aed", "#be185d"
];

export function UserAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const colorIdx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <span className={`user-avatar ${size}`} style={{ background: AVATAR_COLORS[colorIdx] }} aria-label={name}>
      {initials}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const cls = level?.toLowerCase().replace(/\s/g, "") || "l0";
  return <span className={`level-badge ${cls}`}>{level || "L0"}</span>;
}

export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="star-rating" aria-label={`${value} su ${max} stelle`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`star ${i < Math.round(value) ? "" : "empty"}`}>★</span>
      ))}
    </span>
  );
}

export function CompetencyGrid({ items }: { items: Array<{ topic: string; stars: number }> }) {
  return (
    <div className="competency-grid">
      {items.map(item => (
        <div key={item.topic} className="competency-item">
          <span className="competency-topic">{item.topic}</span>
          <StarRating value={item.stars} />
        </div>
      ))}
    </div>
  );
}

export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="progress-steps">
      {steps.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className="progress-step-line" />}
            <div className={`progress-step ${isDone ? "done" : isActive ? "active" : ""}`}>
              <div className="progress-step-num">{isDone ? "✓" : i + 1}</div>
              <span className="progress-step-label">{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function MetricStat({ value, label, sub }: { value: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="metric-stat">
      <div className="metric-stat-value">{value}</div>
      <div className="metric-stat-label">{label}</div>
      {sub && <div className="metric-stat-sub">{sub}</div>}
    </div>
  );
}
