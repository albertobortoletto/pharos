// Altri pazienti con fasi in corso, per riempire le code di hub e spoke. Tutti FITTIZI.
// Le ore sono "ore di demo": 0 = mezzanotte del 20/11, 10 = le 10:00 del 20/11.

export interface PazienteFittizio {
  id: string;
  nome: string;
  eta: number;
  comune: string;
  /** Evidenza per la rete bayesiana (fittizia), come il profilo di Giovanni. */
  profilo: Record<string, string>;
}

const P = (eta: string, comorbidita: string, stadio: string, tipo_intervento: string, complicanza_postop: string, stato_funzionale: string, accompagnatore: string) => ({
  eta, comorbidita, stadio, tipo_intervento, complicanza_postop, stato_funzionale, accompagnatore,
});

export const ALTRI_PAZIENTI: PazienteFittizio[] = [
  { id: "franco", nome: "Franco B.", eta: 74, comune: "Conselve", profilo: P("65-75", "1", "localizzato", "robotica", "no", "buona", "si") },
  { id: "rosa", nome: "Rosa C.", eta: 68, comune: "Este", profilo: P("65-75", "0", "localizzato", "robotica", "no", "scarsa", "si") },
  { id: "sergio", nome: "Sergio P.", eta: 71, comune: "Monselice", profilo: P("65-75", "2+", "localmente_avanzato", "aperta", "si", "parziale", "no") },
  { id: "bruno", nome: "Bruno L.", eta: 77, comune: "Bagnoli di Sopra", profilo: P(">75", "1", "localizzato", "aperta", "no", "parziale", "si") },
  { id: "mario", nome: "Mario D.", eta: 69, comune: "Este", profilo: P("65-75", "0", "localizzato", "robotica", "no", "buona", "si") },
  { id: "luigi", nome: "Luigi M.", eta: 66, comune: "Este", profilo: P("65-75", "0", "localizzato", "robotica", "no", "buona", "no") },
];

/** Stato di partenza delle schede degli altri pazienti (vedi stato/store.ts). */
export const SCHEDE_FITTIZIE = [
  { id: "s-franco", paziente: "franco", prestazione: "riabilitazione_pavimento_pelvico", struttura: "schiavonia", stato: "IN_CORSO", dal: -24 * 9, scadenza: null, sedute: 3 },
  { id: "s-rosa", paziente: "rosa", prestazione: "riabilitazione_pavimento_pelvico", struttura: "schiavonia", stato: "IN_CORSO", dal: -24 * 18, scadenza: null, sedute: 6 },
  { id: "s-sergio", paziente: "sergio", prestazione: "riabilitazione_pavimento_pelvico", struttura: "schiavonia", stato: "INVIATA", dal: -18, scadenza: 30, sedute: 0 },
  { id: "s-bruno", paziente: "bruno", prestazione: "riabilitazione_pavimento_pelvico", struttura: "piove", stato: "INVIATA", dal: -40, scadenza: 8, sedute: 0 },
  { id: "s-mario", paziente: "mario", prestazione: "riabilitazione_pavimento_pelvico", struttura: "schiavonia", stato: "ESITO_ATTESO", dal: -24, scadenza: 26, sedute: 10 },
  { id: "s-luigi", paziente: "luigi", prestazione: "follow_up_oncologico_uro", struttura: "schiavonia", stato: "BOZZA", dal: -48, scadenza: null, sedute: 0 },
] as const;

/** Parere già aperto da Schiavonia per Rosa C. (fittizio). */
export const PARERI_FITTIZI = [
  {
    id: "p-rosa",
    scheda: "s-rosa",
    paziente: "rosa",
    struttura: "schiavonia",
    quesito: "continenza",
    testo: "Dopo 6 sedute la continenza è ancora scarsa. Chiedo se proseguire o anticipare il controllo.",
    urgente: false,
    ora: -24 * 3 + 11,
  },
] as const;
