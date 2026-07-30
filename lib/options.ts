export type SelectOption = {
  value: string;
  label: string;
  score?: number;
  levels?: string[];
};

export const practiceOptions: SelectOption[] = [
  { value: "none", label: "No, mai", score: 0 },
  { value: "minimal", label: "Ho provato una volta ma non ho continuato", score: 1 },
  { value: "occasional", label: "Sì, investo occasionalmente", score: 2 },
  { value: "regular", label: "Sì, investo regolarmente", score: 3 }
];

export const durationOptions: SelectOption[] = [
  { value: "lt_6m", label: "Meno di 6 mesi", score: 1 },
  { value: "6m_2y", label: "Tra 6 mesi e 2 anni", score: 2 },
  { value: "2y_5y", label: "Tra 2 e 5 anni", score: 3 },
  { value: "gt_5y", label: "Più di 5 anni", score: 4 }
];

export const instrumentOptions = [
  { value: "savings_first_steps", label: "Conto deposito / buoni postali" },
  { value: "mutual_funds", label: "Fondi comuni (tramite banca/consulente)" },
  { value: "etf_funds", label: "ETF" },
  { value: "stocks", label: "Azioni singole" },
  { value: "bonds", label: "Obbligazioni" },
  { value: "crypto", label: "Crypto" },
  { value: "derivatives", label: "Forex / derivati / opzioni" }
];

export const instrumentDepthOptions: SelectOption[] = [
  { value: "0", label: "Mai usato", score: 0 },
  { value: "1", label: "Ho provato", score: 1 },
  { value: "2", label: "Uso regolarmente", score: 2 },
  { value: "3", label: "Uso con autonomia", score: 3 }
];

export const knowledgeConcepts = [
  { value: "diversification", label: "Diversificazione" },
  { value: "compound_interest", label: "Interesse composto" },
  { value: "risk_return", label: "Rapporto rischio/rendimento" },
  { value: "pac", label: "PAC (Piano di Accumulo)" },
  { value: "asset_allocation", label: "Asset allocation" },
  { value: "taxation", label: "Fiscalità degli investimenti" }
];

export const knowledgeOptions: SelectOption[] = [
  { value: "0", label: "Non so cosa sia", score: 0 },
  { value: "0.5", label: "Ne ho sentito parlare", score: 0.5 },
  { value: "1", label: "Ho una comprensione di base", score: 1 },
  { value: "2", label: "Lo conosco bene", score: 2 }
];

export const autonomyOptions: SelectOption[] = [
  { value: "delegated", label: "Mi affido completamente a un consulente/banca", score: 1 },
  { value: "guided", label: "Seguo consigli ma scelgo io dove mettere i soldi", score: 2 },
  { value: "independent", label: "Decido in autonomia dopo ricerche personali", score: 3 }
];

export const investedCapitalOptions: SelectOption[] = [
  { value: "lt_1k", label: "Meno di 1.000 EUR", score: 1 },
  { value: "1k_10k", label: "Tra 1.000 EUR e 10.000 EUR", score: 2 },
  { value: "10k_50k", label: "Tra 10.000 EUR e 50.000 EUR", score: 3 },
  { value: "gt_50k", label: "Più di 50.000 EUR", score: 4 }
];

export const situationalQuestions = [
  {
    key: "D7",
    title: "ETF S&P 500",
    prompt: "Un amico ha investito tutto in un ETF S&P 500. Ti dice: Sono diversificato, ci sono 500 aziende.",
    options: [
      { value: "superficial", label: "Ha ragione, 500 aziende sono tante", score: 0 },
      { value: "honest_unsure", label: "Non ne sono sicuro/a", score: 1 },
      { value: "good", label: "Ha un punto, ma è tutto nello stesso mercato e nella stessa asset class", score: 3 },
      { value: "excellent", label: "Dipende dal resto della sua situazione finanziaria e orizzonte", score: 4 }
    ]
  },
  {
    key: "D8",
    title: "PAC in discesa",
    prompt: "Hai un PAC da un anno su un ETF azionario. Il mercato è sceso del 20%. Un collega ti dice di sospenderlo.",
    options: [
      { value: "reactive", label: "Lo sospendo, ha senso aspettare", score: 0 },
      { value: "honest_unsure", label: "Non saprei, ci devo pensare", score: 1 },
      { value: "good", label: "Continuo: il PAC funziona così, compri di più quando costa meno", score: 3 },
      { value: "excellent", label: "Continuo, ma rivaluto l'allocazione complessiva", score: 4 }
    ]
  },
  {
    key: "D9",
    title: "Mutuo e rischio",
    prompt: "Due persone, stesso reddito ed età. Una ha un mutuo, l'altra no. Dovrebbero investire allo stesso modo?",
    options: [
      { value: "superficial", label: "Sì, contano reddito ed età", score: 0 },
      { value: "honest_unsure", label: "Non ci ho mai pensato", score: 1 },
      { value: "good", label: "No, il mutuo cambia capacità di rischio e orizzonte", score: 3 },
      { value: "excellent", label: "Dipende da molti fattori: tipo mutuo, debiti, fondo emergenza", score: 4 }
    ]
  }
];

export const sectionDQuestions = [
  {
    key: "D1",
    label: "Situazione professionale",
    options: [
      { value: "employee_permanent", label: "Dipendente a tempo indeterminato" },
      { value: "employee_fixed", label: "Dipendente a tempo determinato" },
      { value: "self_employed", label: "Lavoratore autonomo / freelance" },
      { value: "entrepreneur", label: "Imprenditore / socio d'azienda" },
      { value: "student", label: "Studente" },
      { value: "retired", label: "Pensionato" },
      { value: "unemployed", label: "Non occupato / in cerca di lavoro" },
      { value: "undisclosed", label: "Preferisco non rispondere" }
    ]
  },
  {
    key: "D2",
    label: "Reddito annuo lordo",
    options: [
      { value: "lt_15k", label: "Meno di 15.000 EUR" },
      { value: "15k_25k", label: "Tra 15.000 EUR e 25.000 EUR" },
      { value: "25k_35k", label: "Tra 25.000 EUR e 35.000 EUR" },
      { value: "35k_50k", label: "Tra 35.000 EUR e 50.000 EUR" },
      { value: "50k_75k", label: "Tra 50.000 EUR e 75.000 EUR" },
      { value: "gt_75k", label: "Più di 75.000 EUR" },
      { value: "undisclosed", label: "Preferisco non rispondere" }
    ]
  },
  {
    key: "D3",
    label: "Risparmio mensile medio",
    options: [
      { value: "none", label: "Non riesco a risparmiare" },
      { value: "lt_100", label: "Meno di 100 EUR" },
      { value: "100_300", label: "Tra 100 EUR e 300 EUR" },
      { value: "300_600", label: "Tra 300 EUR e 600 EUR" },
      { value: "600_1k", label: "Tra 600 EUR e 1.000 EUR" },
      { value: "gt_1k", label: "Più di 1.000 EUR" },
      { value: "undisclosed", label: "Preferisco non rispondere" }
    ]
  },
  {
    key: "D4",
    label: "Mutuo o debiti significativi",
    options: [
      { value: "none", label: "No, non ho debiti significativi" },
      { value: "mortgage", label: "Sì, ho un mutuo sulla prima casa" },
      { value: "mortgage_plus", label: "Sì, ho un mutuo e altri debiti" },
      { value: "other_debt", label: "Sì, ho debiti ma non un mutuo" },
      { value: "undisclosed", label: "Preferisco non rispondere" }
    ]
  },
  {
    key: "D5",
    label: "Fondo di emergenza",
    options: [
      { value: "adequate", label: "Sì, ce l'ho e copre almeno 3 mesi di spese" },
      { value: "partial", label: "Sì, ma è inferiore a 3 mesi di spese" },
      { value: "none", label: "No, non ce l'ho" },
      { value: "unaware", label: "Non so cosa sia o come calcolarlo" },
      { value: "undisclosed", label: "Preferisco non rispondere" }
    ]
  }
];

export const topicOptions: SelectOption[] = [
  { value: "undefined", label: "Non lo so ancora / voglio capire da dove partire", levels: ["L0", "L1"] },
  { value: "savings_first_steps", label: "Risparmio e primi investimenti", levels: ["L0", "L1"] },
  { value: "etf_funds", label: "ETF e fondi", levels: ["L0", "L1", "L2"] },
  { value: "stocks", label: "Azioni singole", levels: ["L1", "L2"] },
  { value: "bonds", label: "Obbligazioni", levels: ["L1", "L2"] },
  { value: "crypto", label: "Crypto", levels: ["L1", "L2"] },
  { value: "planning", label: "Pianificazione e principi di diversificazione", levels: ["L2"] },
  { value: "taxation", label: "Fiscalità degli investimenti", levels: ["L2"] },
  { value: "derivatives", label: "Forex / derivati", levels: ["L2"] }
];

export const goalOptionsByLevelTopic: Record<string, Record<string, SelectOption[]>> = {
  L0: {
    undefined: [
      { value: "understand_basics", label: "Capire le basi: cos'è investire, come funziona, da dove si parte" },
      { value: "guided_orientation", label: "Fare ordine tra i concetti e capire quali domande pormi" },
      { value: "evaluate_readiness", label: "Capire prerequisiti, rischi e cautele prima di decidere in autonomia" }
    ],
    savings_first_steps: [
      { value: "first_savings_placement", label: "Confrontare gli strumenti di base e capirne le differenze" },
      { value: "bank_vs_invest", label: "Capire la differenza tra liquidità, risparmio e investimento" },
      { value: "first_operation", label: "Capire passaggi e cautele di una prima operazione" },
      { value: "build_savings_habit", label: "Capire come funziona un piano periodico nel tempo" }
    ],
    etf_funds: [
      { value: "understand_etf", label: "Capire cosa sono gli ETF e come funzionano" },
      { value: "etf_vs_funds", label: "Capire la differenza tra ETF e fondi comuni" },
      { value: "first_etf_pac", label: "Capire i criteri con cui si valutano ETF e piani periodici" },
      { value: "etf_costs_risks", label: "Capire i costi e i rischi degli ETF prima di iniziare" }
    ]
  },
  L1: {
    undefined: [
      { value: "explore_options", label: "Esplorare approcci diversi e chiarire le domande da approfondire" },
      { value: "organize_knowledge", label: "Mettere ordine in quello che so già e costruire un metodo di studio" },
      { value: "learn_diversification", label: "Capire come diversificare rispetto a quello che faccio già" }
    ],
    savings_first_steps: [
      { value: "savings_to_investing", label: "Capire il passaggio dal risparmio a un approccio più strutturato" },
      { value: "build_small_portfolio", label: "Studiare i principi di una diversificazione semplice" },
      { value: "monthly_plan", label: "Confrontare metodi per organizzare un piano periodico" }
    ],
    etf_funds: [
      { value: "build_pac", label: "Capire come si struttura e si valuta un PAC su ETF" },
      { value: "etf_selection", label: "Capire come scegliere un ETF (indice, costi, replica, dimensione)" },
      { value: "diversify_etf_portfolio", label: "Approfondire la diversificazione tra ETF" },
      { value: "compare_etf_funds", label: "Confrontare caratteristiche, costi e limiti di ETF e fondi comuni" }
    ],
    stocks: [
      { value: "understand_stocks", label: "Capire come funziona il mercato azionario e come si compra un'azione" },
      { value: "stock_evaluation_basics", label: "Imparare i criteri di base per studiare un'azienda" },
      { value: "build_stock_portfolio", label: "Studiare rischi e principi di diversificazione tra azioni" },
      { value: "stocks_vs_etf", label: "Capire la differenza tra investire in azioni e investire in ETF" }
    ],
    bonds: [
      { value: "understand_bonds", label: "Capire come funzionano le obbligazioni e quali rischi comportano" },
      { value: "evaluate_bond_types", label: "Confrontare BTP, BOT e obbligazioni corporate" },
      { value: "bonds_for_diversification", label: "Studiare il ruolo delle obbligazioni nella diversificazione" },
      { value: "bond_rate_relationship", label: "Capire il rapporto tra tassi di interesse e prezzo delle obbligazioni" }
    ],
    crypto: [
      { value: "understand_crypto", label: "Capire come funzionano le crypto e la blockchain a livello base" },
      { value: "start_crypto_investing", label: "Capire exchange, wallet e sicurezza prima di qualunque scelta" },
      { value: "crypto_risk_assessment", label: "Approfondire i rischi reali delle crypto" },
      { value: "crypto_taxonomy", label: "Capire la differenza tra Bitcoin, altcoin, stablecoin e token" }
    ]
  },
  L2: {
    etf_funds: [
      { value: "optimize_etf_portfolio", label: "Approfondire ribilanciamento, costi ed efficienza degli ETF" },
      { value: "multi_asset_etf", label: "Studiare la diversificazione multi-asset con ETF" },
      { value: "thematic_etf", label: "Valutare caratteristiche e rischi degli ETF settoriali o tematici" },
      { value: "pac_vs_pic", label: "Confrontare strategie: PAC vs PIC vs approccio ibrido" }
    ],
    stocks: [
      { value: "fundamental_analysis", label: "Imparare l'analisi fondamentale (bilanci, multipli, valutazione)" },
      { value: "stock_picking_strategy", label: "Studiare metodi strutturati di analisi e selezione" },
      { value: "exit_strategy", label: "Confrontare criteri di uscita e gestione delle perdite" },
      { value: "stocks_in_portfolio", label: "Approfondire il ruolo delle azioni singole in un insieme diversificato" }
    ],
    bonds: [
      { value: "bond_strategy", label: "Studiare approcci obbligazionari: duration, ladder e barbell" },
      { value: "corporate_bond_analysis", label: "Valutare obbligazioni corporate e il rischio di credito" },
      { value: "optimize_bond_allocation", label: "Approfondire il ruolo obbligazionario in un insieme multi-asset" },
      { value: "macro_bond_impact", label: "Capire l'impatto della politica monetaria sulle obbligazioni" }
    ],
    crypto: [
      { value: "crypto_allocation_strategy", label: "Studiare il ruolo e i rischi delle crypto in un insieme diversificato" },
      { value: "defi_deep_dive", label: "Approfondire la DeFi (lending, staking, liquidity pool)" },
      { value: "crypto_project_evaluation", label: "Valutare progetti crypto con criteri strutturati (tokenomics, team, roadmap)" },
      { value: "crypto_security", label: "Gestire la sicurezza avanzata (cold wallet, multisig, seed phrase management)" }
    ],
    planning: [
      { value: "full_financial_plan", label: "Studiare gli elementi di una pianificazione: obiettivi, diversificazione e orizzonte" },
      { value: "optimize_asset_allocation", label: "Approfondire principi e limiti dell’asset allocation" },
      { value: "goal_based_planning", label: "Capire come cambiano le scelte al variare di obiettivi e orizzonte" },
      { value: "rebalancing_strategy", label: "Confrontare metodi di ribilanciamento periodico" }
    ],
    taxation: [
      { value: "tax_by_instrument", label: "Capire la tassazione sui diversi strumenti (ETF, azioni, obbligazioni, crypto)" },
      { value: "tax_optimization", label: "Capire minusvalenze, plusvalenze e meccanismi di compensazione" },
      { value: "tax_regime_choice", label: "Capire la differenza tra regime dichiarativo e amministrato" },
      { value: "foreign_platform_tax", label: "Comprendere gli adempimenti fiscali legati alle piattaforme estere" }
    ],
    derivatives: [
      { value: "understand_derivatives", label: "Capire come funzionano opzioni e futures e quali rischi comportano" },
      { value: "options_hedging", label: "Studiare il funzionamento della copertura tramite opzioni" },
      { value: "forex_strategy", label: "Approfondire funzionamento e rischi operativi del forex" },
      { value: "derivatives_risk_management", label: "Capire i rischi reali dei derivati e come gestire la leva" }
    ]
  }
};

export const capitalGoalOptions: SelectOption[] = [
  { value: "undefined", label: "Preferisco non indicarlo", levels: ["L0", "L1", "L2"] },
  { value: "lt_500", label: "Sto esplorando il tema con un primo passo contenuto", levels: ["L0", "L1"] },
  { value: "500_5k", label: "Ho in mente un progetto personale contenuto", levels: ["L0", "L1", "L2"] },
  { value: "5k_20k", label: "Ho già avviato un progetto personale", levels: ["L1", "L2"] },
  { value: "20k_50k", label: "Parto da un contesto già strutturato", levels: ["L2"] },
  { value: "gt_50k", label: "Il mio contesto richiede un confronto articolato", levels: ["L2"] }
];

export const riskOptions: SelectOption[] = [
  { value: "conservative", label: "Preferisco partire da basi, rischi e cautele" },
  { value: "balanced", label: "Voglio confrontare pro e contro in modo equilibrato" },
  { value: "aggressive", label: "Voglio approfondire scenari complessi e relative criticità" },
  { value: "undefined", label: "Non ho ancora una preferenza" }
];
