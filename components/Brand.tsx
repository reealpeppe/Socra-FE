export function Brand({ compact = false, variant = "light" }: {
  compact?: boolean;
  variant?: "light" | "dark";
}) {
  const textColor = variant === "light" ? "#ffffff" : "#020817";
  return (
    <span style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
      {/* Glyph S */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#020817" />
        <text x="16" y="22" textAnchor="middle" fontSize="20" fontWeight="900" fontFamily="system-ui,sans-serif" fill="#f5b62f">S</text>
      </svg>
      {!compact && (
        <span style={{ color: textColor, fontFamily: "system-ui,sans-serif", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          SOCRA
        </span>
      )}
    </span>
  );
}
