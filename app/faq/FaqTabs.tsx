"use client";
import { useState } from "react";

const sections = [
  {
    label: "Percorso",
    faqs: [
      {
        q: "Cos'è SOCRA?",
        a: "SOCRA è una piattaforma gratuita di mentorship peer-to-peer per gli investimenti. Persone reali ti aiutano a crescere in base al tuo livello e ai tuoi obiettivi. No guru, no corsi da comprare.",
      },
      {
        q: "Come funziona il percorso?",
        a: "Ogni percorso si articola in sessioni tra mentee e mentor. La prima call avviene in piattaforma, poi il rapporto può evolvere. Al termine, entrambi lasciano un feedback che alimenta la reputazione.",
      },
      {
        q: "Quante sessioni ci sono per percorso?",
        a: "Non esiste un numero fisso. Il percorso è flessibile e si adatta all'obiettivo concordato tra mentee e mentor. Di solito 3-6 sessioni sono sufficienti per un obiettivo specifico.",
      },
      {
        q: "Come finisce un percorso?",
        a: "Un percorso si chiude quando entrambe le parti lo confermano come completato. Segue un feedback bidirezionale che contribuisce ai punteggi di reputazione di entrambi.",
      },
    ],
  },
  {
    label: "Valuta interna",
    faqs: [
      {
        q: "Quanto costa SOCRA?",
        a: "SOCRA è gratuita. Non ci sono abbonamenti, crediti da acquistare o commissioni. La valuta interna è un sistema di bilanciamento tra dare e ricevere, non è monetizzabile.",
      },
      {
        q: "Come funziona la valuta interna?",
        a: "Quando ricevi un percorso come mentee, utilizzi crediti. Quando lo dai come mentor, li accumuli. Questo bilancia domanda e offerta senza introdurre denaro reale.",
      },
      {
        q: "Cosa succede se finisco i crediti?",
        a: "Puoi diventare mentor su aree dove hai esperienza per recuperare crediti. Il sistema non ti blocca permanentemente, ma incoraggia la reciprocità.",
      },
    ],
  },
  {
    label: "Matching",
    faqs: [
      {
        q: "Come funziona il matching?",
        a: "Il sistema suggerisce mentor compatibili in base al tuo livello (max ±1), agli obiettivi dichiarati e alla disponibilità. Sei sempre tu a scegliere chi contattare.",
      },
      {
        q: "Che tipo di obiettivi posso scegliere?",
        a: "ETF, azioni, obbligazioni, fiscalità, pianificazione finanziaria, basi di investimento, portafoglio. L'obiettivo deve essere specifico e raggiungibile in pochi mesi.",
      },
      {
        q: "Posso cambiare mentor?",
        a: "Sì. Se il percorso non va come previsto, puoi chiuderlo e cercarne uno nuovo. Il feedback finale è sempre opzionale se il percorso si interrompe prima del completamento.",
      },
    ],
  },
  {
    label: "Reputazione",
    faqs: [
      {
        q: "Come vengono calcolati i livelli?",
        a: "I livelli si basano su percorsi completati, qualità del feedback ricevuto e impatto sulla community. Non sull'anzianità, non sul portfolio, non su auto-dichiarazioni.",
      },
      {
        q: "Cosa succede se ho un problema con il mio percorso?",
        a: "Puoi segnalare il problema direttamente dalla piattaforma. Il team interviene entro 24 ore per i casi urgenti. I comportamenti scorretti portano a sospensione dell'account.",
      },
    ],
  },
  {
    label: "Sicurezza",
    faqs: [
      {
        q: "Come funziona la reputazione?",
        a: "La reputazione è costruita sul feedback bidirezionale dei percorsi completati. È aggregata, non mostra singoli voti, ed è visibile pubblicamente solo in forma sintetica.",
      },
      {
        q: "Le call vengono registrate?",
        a: "No. Le sessioni non vengono registrate senza consenso esplicito di entrambe le parti. La prima call avviene in piattaforma per sicurezza, ma non viene conservata.",
      },
      {
        q: "Posso essere sempre sicuro del mio mentore?",
        a: "I profili sono moderati dal team. In aggiunta, il sistema di reputazione e il feedback degli utenti è il miglior strumento di garanzia. Puoi sempre segnalare comportamenti scorretti.",
      },
    ],
  },
  {
    label: "Account",
    faqs: [
      {
        q: "Come mi registro?",
        a: "Vai su /register, crea un account con email e password. Poi completa la survey di onboarding per scoprire il tuo livello. L'intero processo dura circa 5 minuti.",
      },
      {
        q: "Posso sospendere il mio account?",
        a: "Sì. Dalle impostazioni del profilo puoi mettere il tuo account in pausa. Non riceverai nuove richieste e i percorsi in corso vengono notificati ai partner.",
      },
      {
        q: "Come vengono protetti i miei dati?",
        a: "I dati finanziari restano privati nel tuo profilo. Non vengono condivisi con mentor o terze parti. Il matching usa solo il livello, gli obiettivi e la disponibilità.",
      },
    ],
  },
];

const allFaqs = sections.flatMap((s) => s.faqs.map((f) => ({ ...f, section: s.label })));

export function FaqTabs() {
  const [activeTab, setActiveTab] = useState<string>("Tutte");
  const tabs = ["Tutte", ...sections.map((s) => s.label)];

  const displayed =
    activeTab === "Tutte"
      ? allFaqs
      : sections.find((s) => s.label === activeTab)?.faqs ?? [];

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "32px",
        overflowX: "auto",
        paddingBottom: "4px",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? "var(--navy-950)" : "var(--paper)",
              border: "1px solid",
              borderColor: activeTab === tab ? "var(--navy-950)" : "var(--line)",
              borderRadius: "999px",
              color: activeTab === tab ? "#ffffff" : "var(--muted)",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 700,
              padding: "8px 18px",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {displayed.map((faq, i) => (
          <details
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <summary style={{
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 20px",
              color: "var(--ink)",
              fontSize: "0.95rem",
              fontWeight: 700,
              listStyle: "none",
              gap: "12px",
            }}>
              {faq.q}
              <span style={{
                color: "var(--muted)",
                fontSize: "1.2rem",
                lineHeight: 1,
                flexShrink: 0,
              }}>+</span>
            </summary>
            <div style={{
              padding: "0 20px 18px",
              color: "var(--muted)",
              fontSize: "0.875rem",
              lineHeight: 1.65,
              borderTop: "1px solid var(--line)",
              paddingTop: "16px",
            }}>
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
