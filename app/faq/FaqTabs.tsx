"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./FaqTabs.module.css";

const sections = [
  {
    label: "Percorso",
    faqs: [
      {
        q: "Cos'è Socra?",
        a: "Socra è una community di finanza personale dove puoi imparare dagli altri e condividere ciò che già sai. Dalle basi a un approfondimento tra persone esperte, ci si incontra attraverso percorsi con obiettivi concreti. Non offre consulenza finanziaria, non indica dove investire e non garantisce rendimenti.",
      },
      {
        q: "Come funziona un percorso?",
        a: "Dopo la survey, indichi l’argomento, il risultato che vuoi raggiungere e il tipo di confronto. Socra suggerisce mentor compatibili e spiega perché. Sia mentor sia apprendista possono proporre un percorso con un messaggio iniziale: si parte solo quando l’altra persona accetta. Poi chiarite l’obiettivo e organizzate gli incontri.",
      },
      {
        q: "Quante sessioni ci sono?",
        a: "Non c’è un numero prestabilito di sessioni né una scadenza automatica del percorso. Mentor e apprendista concordano gli incontri necessari in base all’obiettivo. Il percorso resta attivo fino alla chiusura e al feedback di entrambi.",
      },
      {
        q: "Come si chiude un percorso?",
        a: "Dopo la verifica della prima call, mentor e apprendista possono concludere il proprio lato in modo indipendente. Il percorso è completato quando entrambi hanno confermato la chiusura e lasciato il feedback previsto. Se la verifica della call non è disponibile, segnala il problema: non basta uscire dalla pagina per chiudere il percorso.",
      },
    ],
  },
  {
    label: "Crediti",
    faqs: [
      {
        q: "I crediti Socra si possono acquistare?",
        a: "No. I crediti servono a mantenere in equilibrio lo scambio tra ciò che ricevi e ciò che condividi. Non possono essere acquistati, venduti, convertiti in denaro o trasferiti al di fuori di Socra.",
      },
      {
        q: "Quando vengono spostati i crediti?",
        a: "All’accettazione di una proposta viene scalato un credito dal saldo dell’apprendista. Il mentor riceve un credito solo quando entrambi hanno chiuso il percorso e lasciato il feedback. Rifiutare una proposta non comporta un addebito.",
      },
      {
        q: "Cosa succede se il saldo non basta?",
        a: "Socra verifica il saldo prima dell’invio e di nuovo all’accettazione. Se non basta, il percorso non può partire e non si crea debito. Il saldo iniziale è di due crediti; completando percorsi come mentor, quando hai esperienza adatta da condividere, puoi ottenerne altri.",
      },
    ],
  },
  {
    label: "Matching",
    faqs: [
      {
        q: "Come funziona il matching?",
        a: "Socra cerca esperienza pertinente al tuo argomento e al tuo punto di partenza, tenendo conto dei risultati dei percorsi. Anche persone nuove o meno viste hanno spazio nei suggerimenti. Se non ci sono mentor idonei, puoi valutare esplicitamente un obiettivo diverso. La scelta finale resta tua.",
      },
      {
        q: "Che cosa vedo del punteggio?",
        a: "L'interfaccia mostra una compatibilità sintetica e una motivazione leggibile. Formule, pesi e valutazioni interne non vengono esposti.",
      },
      {
        q: "Posso cambiare mentor?",
        a: "Puoi concordare una conclusione anticipata e segnalare eventuali problemi. Per iniziare un altro percorso come apprendista occorrono la verifica della prima call, la chiusura e i feedback di entrambi, poi la revisione del tuo obiettivo. Non è un cambio immediato né un rimborso automatico. Se non riuscite a completare questi passaggi, usa “Segnala problema”.",
      },
    ],
  },
  {
    label: "Reputazione",
    faqs: [
      {
        q: "Come viene costruita la reputazione?",
        a: "Si costruisce con i percorsi completati e i feedback ricevuti nel tempo. Il profilo mostra risultati aggregati e badge, non il voto della singola persona. Nel matching contano soprattutto i risultati sullo stesso argomento con persone che avevano un bisogno simile: tante recensioni non rendono esperti di qualsiasi strumento.",
      },
      {
        q: "Quali informazioni mostra il profilo mentor?",
        a: "Il profilo mostra gli argomenti su cui la persona può condividere esperienza, percorsi completati, risultati aggregati e badge. Non mostra livelli o risposte dettagliate della survey. Quando lo storico è limitato compare “Nuovo utente”: significa nuovo nella community, non necessariamente inesperto nell’argomento.",
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
        a: "No. Socra non registra audio o video e oggi non acquisisce trascrizioni. Quando l’integrazione Meet è attiva, per la prima call conserva soltanto i metadati disponibili di presenza e durata, senza accedere al contenuto della conversazione.",
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
        a: "Crea il tuo account con username, email e password. Completa la survey raccontando cosa conosci e quali esperienze puoi condividere; poi scegli ciò che vuoi imparare o approfondire. La community è pensata sia per chi comincia sia per chi ha già esperienza.",
      },
      {
        q: "Posso disattivare la disponibilità come mentor?",
        a: "Sì. Quando la funzione è disponibile per il tuo profilo, puoi attivarla o disattivarla dalle impostazioni. La scelta non interrompe i percorsi già aperti.",
      },
      {
        q: "Quali dati diventano pubblici?",
        a: "Le persone nella community vedono il nickname, gli argomenti su cui puoi aiutare, percorsi completati, badge e risultati aggregati quando disponibili. La survey dettagliata, gli importi e le valutazioni interne non sono pubblici. Chi valuta un percorso con te vede anche obiettivo e tipi di confronto; il messaggio iniziale resta tra i partecipanti.",
      },
    ],
  },
];

sections[0].faqs.push({
  q: "Ho già esperienza: Socra fa per me?",
  a: "Sì. Puoi approfondire un argomento che conosci, confrontare metodi o ragionare su un caso concreto con chi ha esperienza adatta. Puoi anche essere mentor su uno strumento e apprendista su un altro. Apprendista è il ruolo nel singolo percorso, non un giudizio sulla tua preparazione complessiva.",
}, {
  q: "A cosa servono i tipi di confronto?",
  a: "Puoi indicare fino a tre preferenze, per esempio capire il metodo, chiarire dubbi o confrontare approcci. Il mentor le vede prima di accettare, insieme al tuo obiettivo e al messaggio. Descrivono come vuoi lavorare, non attestano competenze e non sostituiscono il risultato di apprendimento scelto.",
});

const allFaqs = sections.flatMap((section) => section.faqs);
const tabs = ["Tutte", ...sections.map((section) => section.label)];

export function FaqTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("categoria");
  const activeTab = tabs.find((tab) => tabSlug(tab) === requestedTab) ?? "Tutte";
  const activeIndex = tabs.indexOf(activeTab);
  const displayed =
    activeTab === "Tutte"
      ? allFaqs
      : sections.find((section) => section.label === activeTab)?.faqs ?? [];

  function updateTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "Tutte") {
      params.delete("categoria");
    } else {
      params.set("categoria", tabSlug(tab));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function selectTab(index: number) {
    const nextIndex = (index + tabs.length) % tabs.length;
    updateTab(tabs[nextIndex]);
    requestAnimationFrame(() => document.getElementById(`faq-tab-${nextIndex}`)?.focus());
  }

  return (
    <div>
      <div
        aria-label="Categorie delle domande frequenti"
        className={styles.tabList}
        role="tablist"
      >
        {tabs.map((tab, index) => (
          <button
            aria-controls="faq-panel"
            aria-selected={activeTab === tab}
            id={`faq-tab-${index}`}
            key={tab}
            className={styles.tab}
            data-active={activeTab === tab}
            onClick={() => updateTab(tab)}
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
            tabIndex={activeTab === tab ? 0 : -1}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`faq-tab-${activeIndex}`}
        className={styles.panel}
        id="faq-panel"
        role="tabpanel"
        tabIndex={0}
      >
        {displayed.map((faq) => (
          <details
            className={styles.item}
            key={faq.q}
          >
            <summary className={styles.summary}>
              {faq.q}
              <span aria-hidden="true" className={styles.indicator} />
            </summary>
            <div className={styles.answer}>
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function tabSlug(tab: string) {
  return tab.toLocaleLowerCase("it-IT");
}
