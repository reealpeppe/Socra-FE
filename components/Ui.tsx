"use client";

import Link from "next/link";
import {
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type SurfaceElement = "div" | "section" | "article";
type ContainerElement = "div" | "section" | "main";
type ButtonVariant = "primary" | "secondary" | "dark" | "danger" | "ghost";
type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function PageContainer({
  as: Element = "div",
  children,
  className = "",
  size = "wide",
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: ContainerElement;
  children: ReactNode;
  size?: "narrow" | "default" | "wide" | "fluid";
}) {
  return (
    <Element className={cx("page-container", `page-container-${size}`, className)} {...props}>
      {children}
    </Element>
  );
}

export function Card({
  as: Element = "div",
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: SurfaceElement;
  children: ReactNode;
}) {
  return (
    <Element className={cx("card", className)} {...props}>
      {children}
    </Element>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("page-header", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {children}
    </header>
  );
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  return (
    <button
      className={cx("button", variant, `button-${size}`, className)}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Link href={href} className={cx("button", variant, `button-${size}`, className)}>
      {children}
    </Link>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  action,
  className = "",
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const urgent = tone === "danger";
  return (
    <div
      className={cx("ui-alert", `ui-alert-${tone}`, className)}
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
    >
      <div className="ui-alert-copy">
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
      {action ? <div className="ui-alert-action">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  embedded = false,
  headingLevel = 3,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  embedded?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const content = (
    <div className="stack ui-state-copy">
      <Heading>{title}</Heading>
      <p className="muted">{body}</p>
      {action}
    </div>
  );
  if (embedded) return <div className="empty-card surface-empty ui-state-card">{content}</div>;
  return <Card className="empty-card surface-empty ui-state-card">{content}</Card>;
}

export function AsyncState({
  status = "loading",
  title,
  body,
  action,
  compact = false,
  headingLevel = 2,
}: {
  status?: "loading" | "error" | "empty";
  title?: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 3 ? "h3" : "h2";
  const defaults = {
    loading: {
      title: "Caricamento in corso…",
      body: "Stiamo preparando questa sezione.",
    },
    error: {
      title: "Questa sezione non è disponibile",
      body: "Riprova tra poco oppure torna alla pagina precedente.",
    },
    empty: {
      title: "Non c’è ancora nulla qui",
      body: "I contenuti appariranno quando saranno disponibili.",
    },
  } as const;
  const copy = defaults[status];
  return (
    <div
      className={cx("ui-async-state", compact && "compact", `ui-async-state-${status}`)}
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      aria-busy={status === "loading" || undefined}
    >
      {status === "loading" ? <span className="ui-spinner" aria-hidden="true" /> : null}
      <div className="ui-state-copy">
        <Heading>{title || copy.title}</Heading>
        <p>{body || copy.body}</p>
      </div>
      {action ? <div className="ui-state-action">{action}</div> : null}
    </div>
  );
}

export function Skeleton({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("ui-skeleton", className)} aria-hidden="true" {...props} />;
}

const STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  open: { label: "Aperto", tone: "info" },
  pending: { label: "In attesa", tone: "warning" },
  feedback_pending: { label: "Feedback", tone: "warning" },
  completed: { label: "Completato", tone: "success" },
  accepted: { label: "Accettata", tone: "success" },
  rejected: { label: "Rifiutata", tone: "danger" },
  expired: { label: "Scaduta", tone: "neutral" },
  expired_by_timeout: { label: "Scaduta", tone: "neutral" },
  in_review: { label: "In revisione", tone: "warning" },
  flagged: { label: "Da verificare", tone: "danger" },
};

export function StatusBadge({
  status,
  label,
  tone,
  className = "",
}: {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
}) {
  const meta = STATUS_META[status] || {
    label: formatStatus(status),
    tone: "neutral" as StatusTone,
  };
  const resolvedTone = tone || meta.tone;
  const legacyTone =
    resolvedTone === "success"
      ? "green"
      : resolvedTone === "warning"
        ? "amber"
        : resolvedTone === "danger"
          ? "danger"
          : "";
  return (
    <span
      className={cx("pill", legacyTone, "ui-status-badge", `status-${resolvedTone}`, className)}
    >
      {label || meta.label}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "green" | "amber" | "";
}) {
  return (
    <Card className="metric-card" aria-label={label}>
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      {detail ? <span className={cx("metric-detail", tone)}>{detail}</span> : null}
    </Card>
  );
}

export function IconDisc({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "purple" | "";
}) {
  return <span className={cx("icon-disc", tone)} aria-hidden="true">{children}</span>;
}

export function formatStatus(status: string): string {
  return STATUS_META[status]?.label || status.replace(/_/g, " ");
}

const AVATAR_COLORS = [
  "#2f62d6",
  "#6857d6",
  "#08754d",
  "#7a4b00",
  "#c2410c",
  "#0e7490",
  "#7c3aed",
  "#be185d",
];

export function UserAvatar({
  name,
  size = "md",
  standaloneLabel,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  standaloneLabel?: string;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const colorIdx =
    name.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return (
    <span
      className={cx("user-avatar", size)}
      style={{ background: AVATAR_COLORS[colorIdx] }}
      role={standaloneLabel ? "img" : undefined}
      aria-label={standaloneLabel}
      aria-hidden={standaloneLabel ? undefined : true}
    >
      {initials}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const cls = level?.toLowerCase().replace(/\s/g, "") || "l0";
  return <span className={cx("level-badge", cls)}>{level || "L0"}</span>;
}

export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="star-rating" role="img" aria-label={`${value} su ${max} stelle`}>
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={cx("star", index >= Math.round(value) && "empty")}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function CompetencyGrid({
  items,
}: {
  items: Array<{ topic: string; stars: number }>;
}) {
  return (
    <div className="competency-grid">
      {items.map((item) => (
        <div key={item.topic} className="competency-item">
          <span className="competency-topic">{item.topic}</span>
          <StarRating value={item.stars} />
        </div>
      ))}
    </div>
  );
}

export function ProgressSteps({
  steps,
  current,
  label = "Avanzamento",
}: {
  steps: string[];
  current: number;
  label?: string;
}) {
  return (
    <ol className="progress-steps" aria-label={label}>
      {steps.map((stepLabel, index) => {
        const isDone = index < current;
        const isActive = index === current;
        return (
          <li
            key={stepLabel}
            className={cx("progress-step", isDone && "done", isActive && "active")}
            aria-current={isActive ? "step" : undefined}
            aria-label={`${index + 1} di ${steps.length}: ${stepLabel}${isActive ? " (corrente)" : isDone ? " (completato)" : ""}`}
          >
            {index > 0 ? (
              <span
                className={cx("progress-step-line", (isDone || isActive) && "done")}
                aria-hidden="true"
              />
            ) : null}
            <span className="progress-step-num" aria-hidden="true">
              {isDone ? "✓" : index + 1}
            </span>
            <span className="progress-step-label">{stepLabel}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Tabs({
  items,
  value,
  onValueChange,
  ariaLabel,
  id,
  panelId,
  className = "",
}: {
  items: Array<{ value: string; label: ReactNode; disabled?: boolean }>;
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  id?: string;
  panelId?: string;
  className?: string;
}) {
  const generatedId = useId();
  const baseId = id || `tabs-${generatedId}`;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledIndexes = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((index) => index >= 0);
  const selectedIndex = items.findIndex((item) => item.value === value && !item.disabled);
  const focusIndex = selectedIndex >= 0 ? selectedIndex : enabledIndexes[0];

  function selectAndFocus(index: number) {
    const target = items[index];
    if (!target || target.disabled) return;
    onValueChange(target.value);
    tabRefs.current[index]?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    if (enabledIndexes.length === 0) return;
    const currentEnabledIndex = enabledIndexes.indexOf(currentIndex);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = enabledIndexes[(currentEnabledIndex + 1) % enabledIndexes.length];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        enabledIndexes[(currentEnabledIndex - 1 + enabledIndexes.length) % enabledIndexes.length];
    } else if (event.key === "Home") {
      nextIndex = enabledIndexes[0];
    } else if (event.key === "End") {
      nextIndex = enabledIndexes[enabledIndexes.length - 1];
    }
    if (nextIndex === null) return;
    event.preventDefault();
    selectAndFocus(nextIndex);
  }

  return (
    <div className={cx("ui-tabs", className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={`${baseId}-tab-${item.value}`}
            className={cx("ui-tab", selected && "active")}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId || `${baseId}-panel-${item.value}`}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  labelledBy,
  children,
  className = "",
}: {
  id: string;
  labelledBy: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cx("ui-tab-panel", className)}
      role="tabpanel"
      aria-labelledby={labelledBy}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function MetricStat({
  value,
  label,
  sub,
}: {
  value: ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="metric-stat">
      <div className="metric-stat-value">{value}</div>
      <div className="metric-stat-label">{label}</div>
      {sub ? <div className="metric-stat-sub">{sub}</div> : null}
    </div>
  );
}
