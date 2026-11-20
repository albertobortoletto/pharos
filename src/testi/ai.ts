// Descrizioni dei modelli: usate dalla schermata «Come ragiona il sistema» e dai link «Come è calcolato?».

import { K_VICINI, SOGLIA_POCHI_DATI, VARIABILI_PROFILO } from "../engine/similar";
import { MESI_PREVISIONE, N_SIMULAZIONI } from "../engine/markov";

export type IdModello = "bayes" | "simili" | "abbinamento" | "markov";

export interface SchedaModello {
  id: IdModello;
  nome: string;
  aCosaServe: string;
  ingressi: string[];
  restituisce: string;
  chiLoVede: string;
  nonFa: string;
  limiti: string[];
}

export const MOTTO = "Il sistema propone e spiega, il medico decide, il paziente sceglie.";

export const MODELLI: Record<IdModello, SchedaModello> = {
  bayes: {
    id: "bayes",
    nome: "Rete bayesiana",
    aCosaServe:
      "Stima la probabilità che il paziente, se delegato allo spoke, debba tornare all'hub, e spiega quali fattori pesano.",
    ingressi: [
      "Età, comorbidità, stadio e tipo di intervento (FSE)",
      "Complicanza post-operatoria e continenza (lettera di dimissione e domande dell'infermiera di percorso)",
      "Distanza da casa alla struttura e presenza di un accompagnatore",
    ],
    restituisce: "Il rischio di rientro in percentuale e i 2–3 fattori che contano di più, con la direzione (+ alza, − abbassa).",
    chiLoVede: "Hub e spoke. Il paziente mai.",
    nonFa: "Non decide se delegare né sceglie la struttura.",
    limiti: [
      "Le probabilità di partenza sono stime illustrative, da far validare ai clinici",
      "Conosce solo le variabili del grafo: tutto il resto lo sa il medico",
      "Migliora solo se riceve gli esiti dei casi chiusi",
    ],
  },
  simili: {
    id: "simili",
    nome: "Pazienti simili (k vicini più prossimi)",
    aCosaServe: "Trova quali strutture hanno trattato più casi simili e con che esito.",
    ingressi: [`Profilo del paziente (${VARIABILI_PROFILO.length} variabili cliniche)`, "Casi chiusi della rete, con struttura ed esito"],
    restituisce:
      `Per ogni struttura: quanti dei ${K_VICINI} casi più simili ha trattato, quanti senza rientro, e il confronto con i rientri attesi per quella gravità.`,
    chiLoVede: "Hub e spoke. Il paziente mai.",
    nonFa: "Non fa classifiche dei medici. Avvisa quando i dati sono pochi.",
    limiti: [
      `Con meno di ${SOGLIA_POCHI_DATI} casi simili il dato è poco affidabile: compare il badge «pochi dati»`,
      "Confronta strutture, non persone",
      "Dipende dalla qualità della registrazione degli esiti",
    ],
  },
  abbinamento: {
    id: "abbinamento",
    nome: "Punteggio di abbinamento",
    aCosaServe: "Ordina le strutture che hanno requisiti e posti, e mostra il peso di ogni voce.",
    ingressi: [
      "Etichetta del PDTA della fase e requisiti delle strutture",
      "Posti dichiarati liberi questa settimana",
      "Rischio di rientro, pazienti simili, distanza, attesa e previsione della rete",
      "Pesi delle voci (da concordare con i clinici)",
    ],
    restituisce: "Una lista ordinata con il punteggio scomposto in barre, una frase di spiegazione e le strutture escluse con il motivo.",
    chiLoVede: "Hub (urologo e infermiera di percorso). Il paziente vede solo «perché qui».",
    nonFa: "Non esclude in modo nascosto: ogni esclusione ha un motivo.",
    limiti: ["I pesi sono una scelta clinica e organizzativa, non tecnica", "Propone: la decisione resta del medico"],
  },
  markov: {
    id: "markov",
    nome: "Catena di Markov",
    aCosaServe: "Prevede come si distribuiranno i pazienti nella rete e dove mancheranno posti.",
    ingressi: [
      "Passaggi mese per mese dei pazienti tra hub, spoke, rientro e conclusione",
      "Nuovi ingressi al mese (Poisson) e la loro tendenza",
      "Posti dichiarati da ogni struttura",
    ],
    restituisce: `Per ogni struttura e per i prossimi 1–${MESI_PREVISIONE} mesi, la probabilità di superare i posti dichiarati (${N_SIMULAZIONI.toLocaleString("it-IT")} simulazioni con seed fisso).`,
    chiLoVede: "Hub, spoke e Regione. Il paziente mai.",
    nonFa: "Non riguarda il singolo paziente.",
    limiti: [
      "Assume che il futuro somigli ai mesi osservati",
      "Non conosce ferie, chiusure o nuovi servizi finché non vengono dichiarati",
    ],
  },
};

/** Cosa il sistema non fa mai. */
export const NON_FA_MAI = [
  "Non sceglie al posto del medico",
  "Non mostra rischi al paziente",
  "Non classifica i medici",
  "Non legge il contenuto dei referti, ma solo la loro presenza",
  "Non inventa fasi che non sono nella lettera",
];

/** Da dove vengono i numeri. */
export const ORIGINE_NUMERI = {
  demo: "In questa demo tutti i numeri sono simulati: pazienti, casi chiusi, posti, attese e probabilità.",
  pilota: [
    "Prior epidemiologiche (es. Registro Tumori del Veneto)",
    "Stime dei clinici del GOM",
    "Casi chiusi della rete, aggiornati con lo smoothing di Laplace",
    "Volumi del PNE Agenas",
  ],
};

/** Evoluzione: solo testo, chiaramente futura. */
export const EVOLUZIONE = [
  "Modello di Markov nascosto sul PSA, per un allarme precoce nel follow-up",
  "Rete bayesiana dinamica, che segue il paziente nel tempo",
  "Assegnamento di più pazienti a posti limitati con l'algoritmo ungherese (funzione già pronta e testata nel motore)",
];

/** Schema del flusso (riquadri cliccabili). */
export const FLUSSO = [
  { id: "profilo", testo: "Profilo del paziente (FSE + domande dell'infermiera di percorso)", modello: null },
  { id: "bayes", testo: "Rete bayesiana: rischio di rientro", modello: "bayes" },
  { id: "simili", testo: "Pazienti simili: esperienza delle strutture", modello: "simili" },
  { id: "filtro", testo: "Filtro: requisiti e posti", modello: "abbinamento" },
  { id: "punteggio", testo: "Punteggio di abbinamento", modello: "abbinamento" },
  { id: "proposta", testo: "Proposta spiegata al medico", modello: null },
  { id: "decisione", testo: "Decisione del medico", modello: null },
  { id: "scelta", testo: "Scelta del paziente", modello: null },
] as const;

/** Ramo laterale e ciclo di ritorno dello schema. */
export const FLUSSO_LATERALE = {
  markov: "Catena di Markov: previsione dei posti della rete",
  mappa: "Mappa: dove mancheranno posti",
  esito: "Esito della fase",
  aggiorna: "Aggiorna i modelli (smoothing di Laplace)",
};

export const TITOLI_SCHEDA_MODELLO = {
  aCosaServe: "A cosa serve",
  ingressi: "Dati in ingresso",
  restituisce: "Cosa restituisce",
  chiLoVede: "Chi lo vede",
  nonFa: "Cosa NON fa",
  limiti: "Limiti",
  esempio: "Esempio dal vivo su Giovanni",
};

export const NOTA_CPT = "stime iniziali illustrative";

