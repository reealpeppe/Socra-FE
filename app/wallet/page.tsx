"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/Ui";
import { clientGet, formatCredits } from "@/lib/api";
import type { Wallet, WalletTransaction } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const TX_TYPE_STYLES: Record<string, { background: string; color: string; label: string }> = {
  earn:  { background: "#d1fae5", color: "#059669", label: "Accredito" },
  reward: { background: "#d1fae5", color: "#059669", label: "Percorso completato" },
  bonus: { background: "#fef3c7", color: "#b07d1a", label: "Bonus" },
  spend: { background: "#fee2e2", color: "#dc2626", label: "Utilizzo" },
  debt:  { background: "#fee2e2", color: "#dc2626", label: "Debito" }
};

const TX_REASON_LABELS: Record<string, string> = {
  initial_grant: "Dotazione iniziale",
  path_payment: "Apertura percorso",
  path_reward: "Percorso completato",
  invitation_bonus: "Bonus invito"
};

function userSafeDescription(value: string): string {
  return value.replace(/\bcoin\b/gi, "crediti").replace(/\bx\b/g, "per");
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currencyLabel = formatCredits(wallet?.currency_label);
  const creditTotal = transactions.filter((row) => row.amount > 0).reduce((total, row) => total + row.amount, 0);
  const debitTotal = transactions.filter((row) => row.amount < 0).reduce((total, row) => total + Math.abs(row.amount), 0);

  useEffect(() => {
    Promise.all([clientGet<Wallet>("/wallet/me"), clientGet<WalletTransaction[]>("/wallet/me/transactions")])
      .then(([walletData, rows]) => {
        setWallet(walletData);
        setTransactions(rows);
      })
      .catch((err: { message?: string }) => setError(err.message || "Wallet non disponibile"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="wallet-page">
	        <div>
	          <h1 className="wallet-heading">Crediti Socra</h1>
	          <p className="wallet-subtitle">Unità interna di partecipazione, non monetizzabile, usata solo nei percorsi Socra.</p>
	        </div>

        {error && <div className="wallet-error" role="alert">{error}</div>}

        <div className="wallet-stats-grid">
          <div className="card wallet-stat-card">
            <p className="wallet-stat-label">Crediti disponibili</p>
            <div className="wallet-stat-value" style={{ color: "var(--ink)" }}>
              {wallet?.balance ?? "-"}
            </div>
            <p className="wallet-stat-sub">{currencyLabel}</p>
          </div>
          <div className="card wallet-stat-card">
            <p className="wallet-stat-label">Debito corrente</p>
            <div
              className="wallet-stat-value"
              style={{ color: wallet && wallet.debt > 0 ? "#dc2626" : "var(--mint-600)" }}
            >
              {wallet?.debt ?? "-"}
            </div>
            <p className="wallet-stat-sub">L’eventuale margine disponibile dipende dal profilo e viene verificato prima di aprire un percorso.</p>
          </div>
        </div>

        <div className="card wallet-ledger-card">
          <div className="wallet-ledger-header">
            <h2 className="wallet-ledger-title">Transazioni</h2>
            <div className="wallet-ledger-summary">
              <span className="wallet-summary-item positive">+{creditTotal} entrate</span>
              <span className="wallet-summary-item negative">-{debitTotal} uscite</span>
            </div>
          </div>

          {loading ? (
            <p className="muted" role="status">Caricamento movimenti…</p>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="Nessun movimento"
              body="I movimenti appariranno quando apri o completi percorsi."
            />
          ) : (
            <div className="wallet-tx-list">
              {transactions.map((row) => {
                const typeStyle = TX_TYPE_STYLES[row.type] ?? { background: "#f3f4f6", color: "#6b7280", label: row.type };
                const isPositive = row.amount >= 0;
                return (
                  <div className="wallet-tx-row" key={row.id}>
                    <div className="wallet-tx-left">
                      <span
                        className="wallet-tx-badge"
                        style={{ background: typeStyle.background, color: typeStyle.color }}
                      >
                        {typeStyle.label}
                      </span>
                      <div className="wallet-tx-info">
                        <span className="wallet-tx-desc">{userSafeDescription(row.description)}</span>
                        {row.reason && <span className="wallet-tx-reason">{TX_REASON_LABELS[row.reason] || "Movimento crediti"}</span>}
                        <span className="wallet-tx-date">
                          {dateFormatter.format(new Date(row.created_at))}
                          {" · "}saldo {row.balance_after}
                          {" · "}debito {row.debt_after}
                        </span>
                      </div>
                    </div>
                    <span
                      className="wallet-tx-amount"
                      style={{ color: isPositive ? "var(--mint-600)" : "#dc2626" }}
                    >
                      {row.amount > 0 ? `+${row.amount}` : row.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .wallet-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px;
          display: grid;
          gap: 24px;
        }
	        .wallet-heading {
	          font-size: 1.75rem;
	          font-weight: 800;
	          color: var(--ink);
	          margin: 0;
	        }
	        .wallet-subtitle {
	          color: var(--muted);
	          margin: 6px 0 0;
	        }
        .wallet-error {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: var(--radius-sm);
          color: #dc2626;
          font-size: 0.875rem;
          padding: 10px 14px;
        }
        .wallet-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .wallet-stats-grid {
            grid-template-columns: 1fr;
          }
        }
        .wallet-stat-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wallet-stat-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .wallet-stat-value {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
        }
        .wallet-stat-sub {
          font-size: 0.875rem;
          color: var(--muted);
          margin: 0;
        }
        .wallet-ledger-card {
          display: grid;
          gap: 20px;
        }
        .wallet-ledger-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .wallet-ledger-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0;
        }
        .wallet-ledger-summary {
          display: flex;
          gap: 12px;
          font-size: 0.8125rem;
          font-weight: 600;
        }
        .wallet-summary-item.positive { color: var(--mint-600); }
        .wallet-summary-item.negative { color: #dc2626; }
        .wallet-tx-list {
          display: grid;
          gap: 0;
        }
        .wallet-tx-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--line);
        }
        .wallet-tx-row:last-child {
          border-bottom: none;
        }
        .wallet-tx-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .wallet-tx-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .wallet-tx-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .wallet-tx-desc {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wallet-tx-reason {
          font-size: 0.8125rem;
          color: var(--muted);
        }
        .wallet-tx-date {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .wallet-tx-amount {
          font-size: 1.0625rem;
          font-weight: 800;
          white-space: nowrap;
          flex-shrink: 0;
        }
      `}</style>
    </AppShell>
  );
}
