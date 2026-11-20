// Glossario: i termini fissi dell'app. Si scrivono SEMPRE così, in ogni vista.
// Il test di coerenza (test/coerenza.test.ts) controlla le varianti vietate.

export const G = {
  infermieraPrima: "infermiera di percorso (case manager)",
  infermiera: "infermiera di percorso",
  scheda: "scheda di fase",
  presaInCarico: "presa in carico",
  parere: "parere dell'hub",
  rientro: "rientro all'hub",
  posti: "posti dichiarati",
  conto: "conto del viaggio",
  rischio: "rischio di rientro",
  simili: "pazienti simili",
  punteggio: "punteggio di abbinamento",
  previsione: "previsione della rete",
  simulato: "simulato",
  dedotto: "dedotto",
} as const;

/** Varianti da non usare mai (sinistra) e termine corretto (destra). */
export const VARIANTI_VIETATE: [RegExp, string][] = [
  [/care manager/i, "infermiera di percorso (case manager)"],
  [/caregiver dell'hub|il caregiver chiama|caregiver di percorso/i, "infermiera di percorso"],
  [/infermiere di percorso/i, "infermiera di percorso"],
  [/rischio di ritorno|rischio rientro\b/i, "rischio di rientro"],
  [/posti disponibili dichiarati|posti offerti/i, "posti dichiarati"],
  [/costo del viaggio/i, "conto del viaggio"],
  [/pazienti analoghi|casi analoghi/i, "pazienti simili"],
  [/punteggio di matching|score di abbinamento/i, "punteggio di abbinamento"],
  [/simulat[ao] \(dati\)|dati finti/i, "simulato"],
];

/** Nomi leggibili dei valori dei nodi della rete bayesiana. */
export const NOMI_VALORI: Record<string, Record<string, string>> = {
  eta: { "<65": "meno di 65 anni", "65-75": "65–75 anni", ">75": "più di 75 anni" },
  comorbidita: { "0": "nessuna", "1": "una", "2+": "due o più" },
  stadio: { localizzato: "localizzato", localmente_avanzato: "localmente avanzato" },
  tipo_intervento: { robotica: "robotica", aperta: "a cielo aperto" },
  complicanza_postop: { no: "no", si: "sì" },
  stato_funzionale: { buona: "continenza buona", parziale: "continenza parziale", scarsa: "continenza scarsa" },
  distanza: { vicino: "vicino (meno di 15 km)", medio: "medio (15–40 km)", lontano: "lontano (oltre 40 km)" },
  accompagnatore: { si: "sì", no: "no" },
  aderenza: { alta: "alta", bassa: "bassa" },
  rientro_hub: { no: "no", si: "sì" },
};

/** Nomi dei responsabili in linguaggio semplice. */
export const NOMI_RESPONSABILI = {
  hub: "l'hub di Padova (urologo)",
  spoke: "lo spoke",
  case_manager: "l'infermiera di percorso",
  paziente: "il paziente o chi lo accompagna",
  nessuno: "nessuno: fase chiusa",
} as const;
