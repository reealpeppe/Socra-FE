import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Video, AlertTriangle, Users, Star, CheckCircle } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Sicurezza Socra — Regole e strumenti della community",
  description: "Le regole operative di Socra per call, segnalazioni, dati pubblici e revisione manuale.",
};

const features = [
  {
    icon: Lock,
    title: "Profilo pubblico essenziale",
    body: "Il profilo pubblico mostra livello, topic tradotti, metriche aggregate, badge e testi facoltativi. Le risposte dettagliate della survey non sono pubbliche",
  },
  {
    icon: Video,
    title: "Nessuna registrazione audio o video",
    body: "Socra non registra audio o video. Un’eventuale trascrizione della prima sessione richiede una scelta esplicita di entrambe le persone",
  },
  {
    icon: Shield,
    title: "Prima call collegata al percorso",
    body: "La prima call usa un Google Meet creato da Socra. Il percorso conserva solo i metadati operativi previsti: ingresso, uscita, durata e presenza",
  },
  {
    icon: CheckCircle,
    title: "Revisione manuale",
    body: "I segnali anomali aprono una revisione amministrativa. Non generano sospensioni o blocchi automatici",
  },
  {
    icon: AlertTriangle,
    title: "Segnala problema",
    body: "La segnalazione resta disponibile nel dettaglio del percorso. Il contesto viene valutato prima di qualsiasi intervento",
  },
  {
    icon: Star,
    title: "Reputazione aggregata",
    body: "Il feedback reciproco alimenta badge e metriche sintetiche. I singoli voti e gli score interni non vengono mostrati pubblicamente",
  },
];

const rules = [
  "Rispetta l'altra persona e mantieni il confronto sul percorso concordato.",
  "Non usare Socra per pressioni commerciali, spam o comportamenti discriminatori.",
  "Descrivi obiettivi e aspettative in modo chiaro, senza presentare opinioni come garanzie.",
  "Se emerge un problema, usa la segnalazione nel percorso e fornisci elementi verificabili.",
];

export default function SicurezzaPage() {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} style={{ paddingTop: "64px" }}>

        {/* ── Hero ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(56px,8vw,100px) clamp(16px,4vw,40px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.2fr) minmax(240px,0.5fr)",
            gap: "clamp(32px,5vw,72px)",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="sic-hero-grid"
          >
            <div>
              <h1 style={{
                color: "var(--ink)",
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                fontWeight: 900,
                margin: "0 0 24px",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}>
                Sicurezza concreta,<br />regole leggibili.
              </h1>
              <p style={{
                color: "var(--muted)",
                fontSize: "clamp(1rem, 2vw, 1.1rem)",
                lineHeight: 1.7,
                margin: "0 0 28px",
                maxWidth: "55ch",
              }}>
                Socra combina regole di percorso, metadati minimi della prima call, feedback reciproco e revisione manuale delle segnalazioni.
              </p>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--muted)",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}>
                <Shield size={18} color="var(--gold-500)" />
                Nessun blocco automatico basato sui soli segnali.
              </div>
            </div>

            <div className="sic-hero-mark" style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold-500), #ffd36a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 24px 60px rgba(245,182,47,0.3)",
              }}>
                <Shield size={64} color="var(--navy-950)" />
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 720px) {
              .sic-hero-grid { grid-template-columns: 1fr !important; }
              .sic-hero-mark { display: none !important; }
            }
          `}</style>
        </section>

        {/* ── Come proteggiamo la community ── */}
        <section style={{
          background: "var(--paper)",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 40px",
              letterSpacing: "-0.02em",
            }}>
              Come proteggiamo la community
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: "20px",
            }}
              className="sic-features-grid"
            >
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} style={{
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: "14px",
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "var(--navy-950)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Icon size={20} color="var(--gold-500)" />
                    </div>
                    <h3 style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                      {f.title}
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                      {f.body}
                    </p>
                  </div>
                );
              })}
            </div>

            <style>{`
              @media (max-width: 900px) {
                .sic-features-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
              }
              @media (max-width: 560px) {
                .sic-features-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── Le nostre regole, il nostro patto ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: "clamp(32px,5vw,80px)",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="sic-rules-grid"
          >
            <div>
              <h2 style={{
                color: "var(--ink)",
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                fontWeight: 900,
                margin: "0 0 24px",
                letterSpacing: "-0.02em",
              }}>
                Le nostre regole,<br />il nostro patto
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {rules.map((rule, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    padding: "16px",
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                  }}>
                    <CheckCircle size={18} color="var(--mint-600)" style={{ flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ color: "var(--ink)", fontSize: "0.9rem", lineHeight: 1.55, margin: 0 }}>
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}>
              <Users size={32} color="var(--navy-950)" />
              <h3 style={{ color: "var(--ink)", fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                Community safety prima di tutto
              </h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                SOCRA non può eliminare ogni rischio da un incontro tra persone. Per questo rende visibili le regole, mantiene la prima call collegata al percorso e raccoglie segnalazioni contestualizzate.
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
                Le anomalie vengono portate in revisione manuale. Eventuali azioni sull&apos;account dipendono dalla valutazione del caso, non da un automatismo.
              </p>
            </div>
          </div>

          <style>{`
            @media (max-width: 760px) {
              .sic-rules-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ── Hai bisogno di aiuto? ── */}
        <section style={{
          background: "var(--navy-950)",
          padding: "clamp(56px,8vw,96px) clamp(16px,4vw,40px)",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <h2 style={{
              color: "#ffffff",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontWeight: 900,
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
            }}>
              Hai bisogno di aiuto?
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "0 0 32px",
            }}>
              Durante un percorso trovi l&apos;azione “Segnala problema” nel relativo dettaglio. Per conoscere regole e limiti della community, consulta le risposte frequenti.
            </p>
            <Link href="/faq" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--gold-500)",
              color: "var(--navy-950)",
              fontWeight: 800,
              fontSize: "1rem",
              padding: "14px 32px",
              borderRadius: "999px",
              textDecoration: "none",
            }}>
              Consulta le FAQ
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
