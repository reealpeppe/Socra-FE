"use client";

import { useState } from "react";

const sections = [
  {
    label: "Percorso",
    faqs: [
      {
        q: "Cos'è SOCRA?",
        a: "SOCRA è una community di mentorship peer-to-peer per apprendere e confrontarsi su temi legati agli investimenti. Non sostituisce una consulenza professionale e non garantisce risultati finanziari.",
      },
      {
        q: "Come funziona un percorso?",
        a: "Dopo survey e obiettivo, Socra suggerisce mentor compatibili. Il mentee può contattare un mentor e un mentor disponibile può proporre un percorso a un mentee. Si apre soltanto quando chi riceve accetta.",
      },
      {
        q: "Quante sessioni ci sono?",
        a: "Non esiste un numero fisso e il percorso non ha una scadenza automatica. Mentee e mentor concordano il lavoro necessario e mantengono il percorso aperto finché non completano la chiusura prevista.",
      },
      {
        q: "Come si chiude un percorso?",
        a: "Mentee e mentor chiudono in modo indipendente il proprio lato. La chiusura formale richiede l'azione e il feedback obbligatorio di entrambe le persone.",
      },
    ],
  },
  {
    label: "Crediti",
    faqs: [
      {
        q: "I crediti Socra si possono acquistare?",
        a: "No. Le unità interne di partecipazione non sono monetizzabili, acquistabili, convertibili o trasferibili fuori da Socra.",
      },
      {
        q: "Quando vengono spostati i crediti?",
        a: "Il costo del percorso viene addebitato al mentee quando il destinatario accetta la proposta. Il mentor riceve l'accredito solo al completamento formale del percorso.",
      },
      {
        q: "Cosa succede se il saldo non basta?",
        a: "Prima di aprire un percorso Socra verifica il saldo disponibile. Se non è sufficiente, lo segnala prima della conferma e impedisce operazioni non consentite per il tuo profilo.",
      },
    ],
  },
  {
    label: "Matching",
    faqs: [
      {
        q: "Come funziona il matching?",
        a: "Socra cerca profili coerenti con il tuo obiettivo, il tuo livello e la disponibilità del momento. Se le alternative sono poche, può ampliare i suggerimenti e lo indica chiaramente. La scelta finale resta sempre alla persona che invia o riceve la proposta.",
      },
      {
        q: "Che cosa vedo del punteggio?",
        a: "L'interfaccia mostra una compatibilità sintetica e una motivazione leggibile. Formule, pesi e valutazioni interne non vengono esposti.",
      },
      {
        q: "Posso cambiare mentor?",
        a: "Se il percorso non funziona, puoi segnalarlo e chiuderlo. Il feedback resta obbligatorio anche in caso di chiusura anticipata; un nuovo percorso da mentee può aprirsi dopo il completamento formale del precedente.",
      },
    ],
  },
  {
    label: "Reputazione",
    faqs: [
      {
        q: "Come viene costruita la reputazione?",
        a: "Nasce dall’esperienza maturata nei percorsi e dai feedback reciproci. Socra mostra soltanto segnali aggregati e badge, mai il voto della singola persona.",
      },
      {
        q: "Quali informazioni mostra il profilo mentor?",
        a: "Il profilo può mostrare livello, argomenti, percorsi completati e badge ricevuti. Quando lo storico è ancora limitato, il profilo viene presentato come “Nuovo utente”.",
      },
      {
        q: "Cosa succede dopo una segnalazione?",
        a: "La segnalazione e gli eventuali segnali anomali vengono inviati a revisione manuale. Non esiste un blocco automatico né viene promesso un tempo fisso di risposta.",
      },
    ],
  },
  {
    label: "Sicurezza",
    faqs: [
      {
        q: "Le call vengono registrate?",
        a: "Socra non registra audio o video. Per la prima call conserva soltanto i metadati operativi necessari, come ingresso, uscita, durata e presenza. Un’eventuale trascrizione richiede una scelta esplicita di entrambe le persone.",
      },
      {
        q: "Socra può garantire l'affidabilità di un mentor?",
        a: "Nessuna piattaforma può eliminare ogni rischio. Socra riduce l’incertezza con informazioni aggregate sul profilo, una prima call collegata al percorso e segnalazioni soggette a revisione.",
      },
      {
        q: "Dove segnalo un problema?",
        a: "L'azione “Segnala problema” è disponibile nel dettaglio del percorso e può essere usata in qualsiasi momento.",
      },
    ],
  },
  {
    label: "Account",
    faqs: [
      {
        q: "Come mi registro?",
        a: "Crei un account con username, email e password, poi completi la survey iniziale e definisci il tuo obiettivo di apprendimento.",
      },
      {
        q: "Posso disattivare la disponibilità come mentor?",
        a: "Sì. Quando la funzione è disponibile per il tuo profilo, puoi attivarla o disattivarla dalle impostazioni. La scelta non interrompe i percorsi già aperti.",
      },
      {
        q: "Quali dati diventano pubblici?",
        a: "Il profilo pubblico usa solo livello, topic tradotti, metriche aggregate, badge e testi facoltativi. Le risposte dettagliate della survey non vengono pubblicate.",
      },
    ],
  },
];

const allFaqs = sections.flatMap((section) => section.faqs);

export function FaqTabs() {
  const [activeTab, setActiveTab] = useState("Tutte");
  const tabs = ["Tutte", ...sections.map((section) => section.label)];
  const activeIndex = tabs.indexOf(activeTab);
  const displayed =
    activeTab === "Tutte"
      ? allFaqs
      : sections.find((section) => section.label === activeTab)?.faqs ?? [];

  function selectTab(index: number) {
    const nextIndex = (index + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIndex]);
    requestAnimationFrame(() => document.getElementById(`faq-tab-${nextIndex}`)?.focus());
  }

  return (
    <div>
      <div
        aria-label="Categorie delle domande frequenti"
        role="tablist"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "32px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {tabs.map((tab, index) => (
          <button
            aria-controls="faq-panel"
            aria-selected={activeTab === tab}
            id={`faq-tab-${index}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                selectTab(activeIndex + 1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                selectTab(activeIndex - 1);
              }
              if (event.key === "Home") {
                event.preventDefault();
                selectTab(0);
              }
              if (event.key === "End") {
                event.preventDefault();
                selectTab(tabs.length - 1);
              }
            }}
            role="tab"
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
              transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
            tabIndex={activeTab === tab ? 0 : -1}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`faq-tab-${activeIndex}`}
        id="faq-panel"
        role="tabpanel"
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        tabIndex={0}
      >
        {displayed.map((faq) => (
          <details
            key={faq.q}
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
              <span
                aria-hidden="true"
                style={{
                  color: "var(--muted)",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                +
              </span>
            </summary>
            <div style={{
              padding: "16px 20px 18px",
              color: "var(--muted)",
              fontSize: "0.875rem",
              lineHeight: 1.65,
              borderTop: "1px solid var(--line)",
            }}>
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
