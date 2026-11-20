import type { RigaEstratta } from "./tipi";

export const LETTERA = {
  id: "lettera-giovanni",
  titolo: "Lettera di dimissione",
  reparto: "Urologia – Hub di Padova",
  etichetta: "Esempio non clinico: testo inventato per la demo",
  paragrafi: [
    "Paziente: Giovanni R., 70 anni, residente a Montagnana.",
    "Ricoverato il 3 novembre per intervento programmato di prostatectomia radicale. Decorso post-operatorio regolare. Si dimette il 10 novembre in buone condizioni generali.",
    "Si consiglia un ciclo di 10 sedute di riabilitazione del pavimento pelvico, da iniziare entro 30 giorni dalla dimissione.",
    "Controllo urologico con esito dell'esame istologico presso il nostro ambulatorio tra 6 settimane.",
    "Tornare in urologia in caso di febbre persistente o difficoltà a urinare.",
    "Se la continenza non migliora dopo le prime 5 sedute, richiedere parere urologico.",
    "Il paziente non guida e sarà accompagnato dalla figlia.",
    "Il medico di dimissione – Urologia, hub di Padova",
  ],
};

export const NOTA_ESTRAZIONE =
  "Output PREPARATO prima della demo (nessun modello dal vivo). La verifica della frase d'origine invece gira dal vivo, nel browser.";

/** Righe estratte dalla lettera. La r6 non ha frase nella lettera: viene scartata dal vivo. */
export const ESTRAZIONE: { documento: string; righe: RigaEstratta[] } = {
  documento: "lettera-giovanni",
  righe: [
    {
      id: "r1",
      tipo: "fase",
      azione: "Riabilitazione del pavimento pelvico",
      dettaglio: "10 sedute",
      quando: "entro 30 giorni dalla dimissione",
      prestazione: "riabilitazione_pavimento_pelvico",
      frase: "Si consiglia un ciclo di 10 sedute di riabilitazione del pavimento pelvico, da iniziare entro 30 giorni dalla dimissione.",
    },
    {
      id: "r2",
      tipo: "fase",
      azione: "Controllo urologico con esito istologico",
      dettaglio: "all'hub",
      quando: "tra 6 settimane",
      prestazione: "controllo_urologico_istologico",
      frase: "Controllo urologico con esito dell'esame istologico presso il nostro ambulatorio tra 6 settimane.",
    },
    {
      id: "r3",
      tipo: "segnale",
      azione: "Condizione di rientro all'hub",
      dettaglio: "febbre persistente o difficoltà a urinare",
      quando: "in qualsiasi momento",
      frase: "Tornare in urologia in caso di febbre persistente o difficoltà a urinare.",
    },
    {
      id: "r4",
      tipo: "parere",
      azione: "Parere dell'urologo",
      dettaglio: "se la continenza non migliora",
      quando: "dopo le prime 5 sedute",
      frase: "Se la continenza non migliora dopo le prime 5 sedute, richiedere parere urologico.",
    },
    {
      id: "r5",
      tipo: "condizione",
      azione: "Condizione del paziente",
      dettaglio: "non guida, lo accompagna la figlia",
      quando: "—",
      frase: "Il paziente non guida e sarà accompagnato dalla figlia.",
    },
    {
      id: "r6",
      tipo: "fase",
      azione: "Controllo allo spoke",
      dettaglio: "a Schiavonia",
      quando: "tra 3 mesi",
      frase: "Si programma un controllo presso lo spoke di Schiavonia tra 3 mesi.",
    },
  ],
};
