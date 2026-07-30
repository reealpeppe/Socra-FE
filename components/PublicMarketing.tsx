import Link from "next/link";
import { Brand } from "@/components/Brand";

export function PublicNav() {
  return (
    <header className="premium-public-nav" aria-label="Navigazione pubblica">
      <Link className="premium-brand-link" href="/" aria-label="Vai alla home Socra">
        <Brand />
      </Link>
      <nav aria-label="Sezioni pubbliche">
        <Link href="/#come-funziona">Come funziona</Link>
        <Link href="/#community">Community</Link>
        <Link href="/#sicurezza">Sicurezza</Link>
      </nav>
      <div className="premium-nav-actions">
        <Link className="premium-link-button" href="/login">Accedi</Link>
        <Link className="premium-gold-button" href="/register">Crea account</Link>
      </div>
    </header>
  );
}

export function PublicAuthShell({
  children,
  sideTitle,
  sideText
}: {
  children: React.ReactNode;
  sideTitle: string;
  sideText: string;
}) {
  return (
    <main className="premium-auth-page">
      <style>{premiumPublicStyles}</style>
      <PublicNav />
      <section className="premium-auth-layout">
        <aside className="premium-auth-aside" aria-label="Sintesi Socra">
          <p className="premium-kicker">Community peer-to-peer</p>
          <h1>{sideTitle}</h1>
          <p>{sideText}</p>
          <div className="premium-auth-proof">
            <span>Livelli L0-L5</span>
            <span>Feedback reciproco</span>
            <span>Crediti interni</span>
          </div>
          <div className="premium-auth-panel" aria-label="Flusso protetto">
            <div>
              <span>01</span>
              <strong>Account V1</strong>
              <p>Username/email e password, senza OTP temporaneamente.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Onboarding</strong>
              <p>Il livello guida visibilita, richieste e matching.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Percorso</strong>
              <p>Crediti interni, reputazione e feedback restano tracciabili.</p>
            </div>
          </div>
        </aside>
        {children}
      </section>
    </main>
  );
}

const premiumPublicStyles = `
  .premium-auth-page {
    min-height: 100vh;
    color: #f7edda;
    background:
      radial-gradient(circle at 18% 8%, rgba(218, 174, 92, 0.22), transparent 31rem),
      linear-gradient(135deg, #061225 0%, #071a33 50%, #09111e 100%);
    padding: 22px;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  }

  .premium-public-nav {
    width: min(1180px, 100%);
    margin: 0 auto;
    min-height: 68px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 24px;
    border: 1px solid rgba(232, 196, 126, 0.26);
    background: rgba(4, 15, 30, 0.72);
    box-shadow: 0 22px 70px rgba(0, 0, 0, 0.32);
    backdrop-filter: blur(18px);
    border-radius: 0;
    padding: 12px 16px;
  }

  .premium-brand-link {
    color: inherit;
    text-decoration: none;
  }

  .premium-public-nav .brand-mark {
    color: #fff7e8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .premium-public-nav .brand-glyph {
    background: linear-gradient(145deg, #f4d992, #b88432);
    color: #061225;
  }

  .premium-public-nav nav {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .premium-public-nav nav a,
  .premium-link-button {
    color: rgba(247, 237, 218, 0.78);
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 10px 12px;
  }

  .premium-public-nav nav a:hover,
  .premium-link-button:hover {
    color: #f6d98f;
  }

  .premium-nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
  }

  .premium-gold-button {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 229, 169, 0.4);
    background: linear-gradient(135deg, #f2d38a, #b6812e);
    color: #061225;
    text-decoration: none;
    font-weight: 900;
    padding: 10px 16px;
    box-shadow: 0 18px 34px rgba(182, 129, 46, 0.26);
  }

  .premium-auth-layout {
    width: min(1180px, 100%);
    margin: 32px auto 0;
    display: grid;
    grid-template-columns: minmax(0, 0.94fr) minmax(360px, 0.76fr);
    gap: 24px;
    align-items: stretch;
  }

  .premium-auth-aside,
  .premium-auth-card {
    border: 1px solid rgba(232, 196, 126, 0.24);
    background: rgba(5, 18, 35, 0.74);
    box-shadow: 0 32px 90px rgba(0, 0, 0, 0.34);
  }

  .premium-auth-aside {
    position: relative;
    overflow: hidden;
    padding: clamp(28px, 5vw, 58px);
    min-height: 640px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .premium-auth-aside::before {
    content: "";
    position: absolute;
    inset: 18px;
    border: 1px solid rgba(242, 211, 138, 0.16);
    pointer-events: none;
  }

  .premium-auth-aside h1 {
    position: relative;
    max-width: 12ch;
    margin: 14px 0 18px;
    color: #fff8ea;
    font-size: clamp(3rem, 8vw, 6.8rem);
    line-height: 0.9;
    letter-spacing: 0;
  }

  .premium-auth-aside > p:not(.premium-kicker) {
    position: relative;
    max-width: 58ch;
    color: rgba(247, 237, 218, 0.78);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 1.05rem;
    line-height: 1.7;
  }

  .premium-kicker {
    position: relative;
    margin: 0;
    color: #f6d98f;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.76rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .premium-auth-proof {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 26px 0;
  }

  .premium-auth-proof span {
    border: 1px solid rgba(242, 211, 138, 0.24);
    color: #f6d98f;
    background: rgba(242, 211, 138, 0.08);
    padding: 8px 11px;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .premium-auth-panel {
    position: relative;
    display: grid;
    gap: 0;
    border-top: 1px solid rgba(242, 211, 138, 0.18);
  }

  .premium-auth-panel div {
    display: grid;
    grid-template-columns: 42px 1fr;
    gap: 0 16px;
    padding: 18px 0;
    border-bottom: 1px solid rgba(242, 211, 138, 0.16);
  }

  .premium-auth-panel span {
    color: #f6d98f;
    font-size: 0.78rem;
    font-weight: 900;
  }

  .premium-auth-panel strong {
    color: #fff8ea;
    font-size: 1rem;
  }

  .premium-auth-panel p {
    grid-column: 2;
    margin: 5px 0 0;
    color: rgba(247, 237, 218, 0.62);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.9rem;
    line-height: 1.55;
  }

  .premium-auth-card {
    align-self: start;
    padding: clamp(24px, 4vw, 42px);
    background: #fff8ea;
    color: #071a33;
  }

  .premium-auth-card .brand-mark {
    color: #071a33;
  }

  .premium-auth-card .brand-glyph {
    background: #071a33;
    color: #f6d98f;
  }

  .premium-auth-card .eyebrow {
    color: #9b6b22;
    letter-spacing: 0.14em;
  }

  .premium-auth-card h1 {
    margin: 5px 0 8px;
    color: #071a33;
    font-size: clamp(2.15rem, 5vw, 3.4rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .premium-auth-card .muted {
    color: #5f6674;
  }

  .premium-auth-card .field {
    gap: 8px;
  }

  .premium-auth-card label {
    color: #1c2a3f;
    font-weight: 800;
  }

  .premium-auth-card .input {
    min-height: 50px;
    border: 1px solid rgba(7, 26, 51, 0.18);
    border-radius: 0;
    background: #fffdf7;
    color: #071a33;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  .premium-auth-card .input:focus {
    border-color: #b6812e;
    outline: 3px solid rgba(214, 173, 93, 0.22);
  }

  .premium-auth-card .button.primary {
    min-height: 52px;
    border: 1px solid rgba(7, 26, 51, 0.08);
    border-radius: 0;
    background: linear-gradient(135deg, #f2d38a, #b6812e);
    color: #071a33;
    font-weight: 900;
    box-shadow: 0 18px 32px rgba(182, 129, 46, 0.22);
  }

  .premium-auth-card .button.secondary {
    border-radius: 0;
    border: 1px solid rgba(7, 26, 51, 0.16);
    background: #fffdf7;
    color: #071a33;
  }

  .premium-auth-card .check {
    align-items: flex-start;
    border: 1px solid rgba(7, 26, 51, 0.1);
    background: rgba(255, 253, 247, 0.74);
    padding: 12px;
  }

  .premium-auth-card .check span {
    color: #344259;
    line-height: 1.45;
  }

  .premium-auth-card .error {
    border: 1px solid rgba(176, 55, 55, 0.22);
    background: #fff0ed;
    color: #9d2e25;
    padding: 12px 14px;
  }

  .premium-auth-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .premium-auth-meta span {
    border: 1px solid rgba(7, 26, 51, 0.1);
    color: #314057;
    background: rgba(7, 26, 51, 0.04);
    padding: 7px 9px;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .premium-password-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: end;
  }

  .premium-auth-card a {
    color: #8a5c18;
    font-weight: 900;
  }

  @media (max-width: 880px) {
    .premium-auth-page {
      padding: 12px;
    }

    .premium-public-nav,
    .premium-auth-layout {
      grid-template-columns: 1fr;
    }

    .premium-public-nav nav,
    .premium-nav-actions {
      justify-content: flex-start;
    }

    .premium-auth-aside {
      min-height: auto;
    }
  }

  @media (max-width: 560px) {
    .premium-public-nav nav {
      display: none;
    }

    .premium-nav-actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .premium-link-button,
    .premium-gold-button {
      width: 100%;
      text-align: center;
    }

    .premium-auth-layout {
      margin-top: 14px;
    }

    .premium-auth-aside h1 {
      font-size: 2.7rem;
    }

    .premium-password-row {
      grid-template-columns: 1fr;
    }
  }
`;
