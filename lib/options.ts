export type SelectOption = {
  value: string;
  label: string;
  score?: number;
  levels?: string[];
};

export const practiceOptions: SelectOption[] = [
  { value: "none", label: "No, mai", score: 0 },
  { value: "minimal", label: "Ho provato una volta ma non ho continuato", score: 1 },
  { value: "occasional", label: "Si, investo occasionalmente", score: 2 },
  { value: "regular", label: "Si, investo regolarmente", score: 3 }
];

export const durationOptions: SelectOption[] = [
  { value: "lt_6m", label: "Meno di 6 mesi", score: 1 },
  { value: "6m_2y", label: "Tra 6 mesi e 2 anni", score: 2 },
  { value: "2y_5y", label: "Tra 2 e 5 anni", score: 3 },
  { value: "gt_5y", label: "Piu di 5 anni", score: 4 }
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
  { value: "taxation", label: "Fiscalita degli investimenti" }
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
  { value: "gt_50k", label: "Piu di 50.000 EUR", score: 4 }
];

export const situationalQuestions = [
  {
    key: "D7",
    title: "ETF S&P 500",
    prompt: "Un amico ha investito tutto in un ETF S&P 500. Ti dice: Sono diversificato, ci sono 500 aziende.",
    options: [
      { value: "superficial", label: "Ha ragione, 500 aziende sono tante", score: 0 },
      { value: "honest_unsure", label: "Non ne sono sicuro/a", score: 1 },
      { value: "good", label: "Ha un punto, ma e tutto nello stesso mercato e asset class", score: 3 },
      { value: "excellent", label: "Dipende dal resto della sua situazione finanziaria e orizzonte", score: 4 }
    ]
  },
  {
    key: "D8",
    title: "PAC in discesa",
    prompt: "Hai un PAC da un anno su un ETF azionario. Il mercato e sceso del 20%. Un collega ti dice di sospenderlo.",
    options: [
      { value: "reactive", label: "Lo sospendo, ha senso aspettare", score: 0 },
      { value: "honest_unsure", label: "Non saprei, ci devo pensare", score: 1 },
      { value: "good", label: "Continuo: il PAC funziona cosi, compri di piu quando costa meno", score: 3 },
      { value: "excellent", label: "Continuo, ma rivaluto l'allocazione complessiva", score: 4 }
    ]
  },
  {
    key: "D9",
    title: "Mutuo e rischio",
    prompt: "Due persone, stesso reddito e eta. Una ha un mutuo, l'altra no. Dovrebbero investire allo stesso modo?",
    options: [
      { value: "superficial", label: "Si, contano reddito ed eta", score: 0 },
      { value: "honest_unsure", label: "Non ci ho mai pensato", score: 1 },
      { value: "good", label: "No, il mutuo cambia capacita di rischio e orizzonte", score: 3 },
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
      { value: "gt_75k", label: "Piu di 75.000 EUR" },
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
      { value: "gt_1k", label: "Piu di 1.000 EUR" },
      { value: "undisclosed", label: "Preferisco non rispondere" }
    ]
  },
  {
    key: "D4",
    label: "Mutuo o debiti significativi",
    options: [
      { value: "none", label: "No, non ho debiti significativi" },
      { value: "mortgage", label: "Si, ho un mutuo sulla prima casa" },
      { value: "mortgage_plus", label: "Si, ho un mutuo e altri debiti" },
      { value: "other_debt", label: "Si, ho debiti ma non un mutuo" },
      { value: "undisclosed", label: "Preferisco non rispondere" }
    ]
  },
  {
    key: "D5",
    label: "Fondo di emergenza",
    options: [
      { value: "adequate", label: "Si, ce l'ho e copre almeno 3 mesi di spese" },
      { value: "partial", label: "Si, ma e inferiore a 3 mesi di spese" },
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
  { value: "planning", label: "Pianificazione finanziaria / asset allocation", levels: ["L2"] },
  { value: "taxation", label: "Fiscalita degli investimenti", levels: ["L2"] },
  { value: "derivatives", label: "Forex / derivati", levels: ["L2"] }
];

export const goalOptionsByLevelTopic: Record<string, Record<string, SelectOption[]>> = {
  L0: {
    undefined: [
      { value: "understand_basics", label: "Capire le basi: cos'e investire, come funziona, da dove si parte" },
      { value: "guided_orientation", label: "Farmi aiutare a capire cosa potrebbe fare al caso mio" },
      { value: "evaluate_readiness", label: "Capire se investire fa per me o se e meglio aspettare" }
    ],
    savings_first_steps: [
      { value: "first_savings_placement", label: "Capire dove mettere i miei primi risparmi (conto deposito, buoni, ETF...)" },
      { value: "bank_vs_invest", label: "Capire la differenza tra lasciare i soldi in banca e investirli" },
      { value: "first_operation", label: "Aprire un conto di investimento e fare la mia prima operazione" },
      { value: "build_savings_habit", label: "Costruire un'abitudine di risparmio e investimento regolare" }
    ],
    etf_funds: [
      { value: "understand_etf", label: "Capire cosa sono gli ETF e come funzionano" },
      { value: "etf_vs_funds", label: "Capire la differenza tra ETF e fondi comuni" },
      { value: "first_etf_pac", label: "Scegliere il mio primo ETF e iniziare un PAC" },
      { value: "etf_costs_risks", label: "Capire i costi e i rischi degli ETF prima di iniziare" }
    ]
  },
  L1: {
    undefined: [
      { value: "explore_options", label: "Esplorare le opzioni di investimento e capire quale direzione fa per me" },
      { value: "organize_knowledge", label: "Mettere ordine in quello che so gia e costruire un piano" },
      { value: "learn_diversification", label: "Capire come diversificare rispetto a quello che faccio gia" }
    ],
    savings_first_steps: [
      { value: "savings_to_investing", label: "Passare dal risparmio passivo a un investimento strutturato" },
      { value: "build_small_portfolio", label: "Costruire un piccolo portafoglio diversificato partendo da poco" },
      { value: "monthly_plan", label: "Capire quanto mettere da parte ogni mese e dove investirlo" }
    ],
    etf_funds: [
      { value: "build_pac", label: "Costruire un PAC su ETF adatto al mio profilo" },
      { value: "etf_selection", label: "Capire come scegliere un ETF (indice, costi, replica, dimensione)" },
      { value: "diversify_etf_portfolio", label: "Diversificare un portafoglio ETF che ho gia iniziato" },
      { value: "compare_etf_funds", label: "Confrontare ETF e fondi comuni per capire cosa conviene a me" }
    ],
    stocks: [
      { value: "understand_stocks", label: "Capire come funziona il mercato azionario e come si compra un'azione" },
      { value: "stock_evaluation_basics", label: "Imparare a valutare un'azienda prima di investirci" },
      { value: "build_stock_portfolio", label: "Costruire un piccolo portafoglio di azioni singole" },
      { value: "stocks_vs_etf", label: "Capire la differenza tra investire in azioni e investire in ETF" }
    ],
    bonds: [
      { value: "understand_bonds", label: "Capire come funzionano le obbligazioni e quando ha senso usarle" },
      { value: "evaluate_bond_types", label: "Valutare BTP, BOT e obbligazioni corporate per il mio profilo" },
      { value: "bonds_for_diversification", label: "Inserire obbligazioni nel mio portafoglio per ridurre il rischio" },
      { value: "bond_rate_relationship", label: "Capire il rapporto tra tassi di interesse e prezzo delle obbligazioni" }
    ],
    crypto: [
      { value: "understand_crypto", label: "Capire come funzionano le crypto e la blockchain a livello base" },
      { value: "start_crypto_investing", label: "Iniziare a investire in crypto in modo consapevole (exchange, wallet, sicurezza)" },
      { value: "crypto_risk_assessment", label: "Capire i rischi reali delle crypto prima di metterci soldi" },
      { value: "crypto_taxonomy", label: "Capire la differenza tra Bitcoin, altcoin, stablecoin e token" }
    ]
  },
  L2: {
    etf_funds: [
      { value: "optimize_etf_portfolio", label: "Ottimizzare un portafoglio ETF esistente (ribilanciamento, costi, efficienza)" },
      { value: "multi_asset_etf", label: "Costruire un portafoglio multi-asset con ETF (azionario, obbligazionario, commodity)" },
      { value: "thematic_etf", label: "Valutare ETF settoriali o tematici per una strategia satellite" },
      { value: "pac_vs_pic", label: "Confrontare strategie: PAC vs PIC vs approccio ibrido" }
    ],
    stocks: [
      { value: "fundamental_analysis", label: "Imparare l'analisi fondamentale (bilanci, multipli, valutazione)" },
      { value: "stock_picking_strategy", label: "Costruire una strategia di stock picking strutturata" },
      { value: "exit_strategy", label: "Capire quando vendere e come gestire le posizioni in perdita" },
      { value: "stocks_in_portfolio", label: "Integrare azioni singole in un portafoglio gia diversificato" }
    ],
    bonds: [
      { value: "bond_strategy", label: "Costruire una strategia obbligazionaria (duration, ladder, barbell)" },
      { value: "corporate_bond_analysis", label: "Valutare obbligazioni corporate e il rischio di credito" },
      { value: "optimize_bond_allocation", label: "Ottimizzare la componente obbligazionaria in un portafoglio multi-asset" },
      { value: "macro_bond_impact", label: "Capire l'impatto della politica monetaria sul mio portafoglio obbligazionario" }
    ],
    crypto: [
      { value: "crypto_allocation_strategy", label: "Costruire una strategia di allocazione crypto all'interno del portafoglio" },
      { value: "defi_deep_dive", label: "Approfondire la DeFi (lending, staking, liquidity pool)" },
      { value: "crypto_project_evaluation", label: "Valutare progetti crypto con criteri strutturati (tokenomics, team, roadmap)" },
      { value: "crypto_security", label: "Gestire la sicurezza avanzata (cold wallet, multisig, seed phrase management)" }
    ],
    planning: [
      { value: "full_financial_plan", label: "Costruire un piano finanziario completo (obiettivi, allocazione, orizzonte)" },
      { value: "optimize_asset_allocation", label: "Ottimizzare l'asset allocation del mio portafoglio attuale" },
      { value: "goal_based_planning", label: "Pianificare per un obiettivo specifico (casa, pensione, liberta finanziaria)" },
      { value: "rebalancing_strategy", label: "Definire una strategia di ribilanciamento periodico" }
    ],
    taxation: [
      { value: "tax_by_instrument", label: "Capire la tassazione sui diversi strumenti (ETF, azioni, obbligazioni, crypto)" },
      { value: "tax_optimization", label: "Ottimizzare il carico fiscale del mio portafoglio (minus/plusvalenze, compensazione)" },
      { value: "tax_regime_choice", label: "Capire la differenza tra regime dichiarativo e amministrato" },
      { value: "foreign_platform_tax", label: "Gestire gli adempimenti fiscali per investimenti su piattaforme estere" }
    ],
    derivatives: [
      { value: "understand_derivatives", label: "Capire come funzionano opzioni e futures e quando ha senso usarli" },
      { value: "options_hedging", label: "Usare le opzioni come strumento di copertura (hedging) su un portafoglio esistente" },
      { value: "forex_strategy", label: "Iniziare a operare sul forex con una strategia strutturata" },
      { value: "derivatives_risk_management", label: "Capire i rischi reali dei derivati e come gestire la leva" }
    ]
  }
};

export const capitalGoalOptions: SelectOption[] = [
  { value: "undefined", label: "Non ho ancora un importo in mente", levels: ["L0", "L1", "L2"] },
  { value: "lt_500", label: "Meno di 500 EUR", levels: ["L0", "L1"] },
  { value: "500_5k", label: "Tra 500 EUR e 5.000 EUR", levels: ["L0", "L1", "L2"] },
  { value: "5k_20k", label: "Tra 5.000 EUR e 20.000 EUR", levels: ["L1", "L2"] },
  { value: "20k_50k", label: "Tra 20.000 EUR e 50.000 EUR", levels: ["L2"] },
  { value: "gt_50k", label: "Piu di 50.000 EUR", levels: ["L2"] }
];

export const riskOptions: SelectOption[] = [
  { value: "conservative", label: "Voglio rischiare il meno possibile" },
  { value: "balanced", label: "Accetto un po' di rischio per un rendimento migliore" },
  { value: "aggressive", label: "Sono disposto/a a rischiare per rendimenti alti" },
  { value: "undefined", label: "Non lo so / non ci ho ancora pensato" }
];
