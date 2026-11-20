import type { Motivo, VoceRegistro } from "./tipi";

export const NOTA_REGISTRO =
  "SIMULAZIONE: voci inventate, pazienti fittizi, ultimi 30 giorni. Elenco chiuso, nessun testo clinico libero.";

/** Motivi dell'hub: resta all'hub / serve l'hub. Elenco chiuso. */
export const MOTIVI_HUB: Motivo[] = [
  { id: "clinico", testo: "Motivo clinico: serve una competenza dell'hub" },
  { id: "manca_servizio", testo: "Manca il servizio allo spoke" },
  { id: "agenda_oltre", testo: "Agenda dello spoke oltre 30 giorni" },
  { id: "referto_non_visibile", testo: "Referto non visibile all'hub" },
  { id: "preferenza", testo: "Preferenza del paziente" },
  { id: "altro", testo: "Altro (senza testo libero)" },
];

/** Motivi dello spoke: «Non posso». Elenco chiuso. */
export const MOTIVI_SPOKE: Motivo[] = [
  { id: "clinico_spoke", testo: "Motivo clinico: serve prima una valutazione dell'hub" },
  { id: "posti_esauriti", testo: "Posti della settimana esauriti" },
  { id: "manca_requisito", testo: "Manca un requisito per questa fase" },
  { id: "agenda_oltre", testo: "Agenda oltre 30 giorni" },
  { id: "altro", testo: "Altro (senza testo libero)" },
];

/** Motivi del parere «serve l'hub» (risposta dell'hub allo spoke). */
export const MOTIVI_SERVE_HUB: Motivo[] = [
  { id: "valutazione_urologica", testo: "Serve una visita urologica all'hub" },
  { id: "esame_solo_hub", testo: "Serve un esame che si fa solo all'hub" },
  { id: "discussione_gom", testo: "Il caso va discusso al GOM" },
  { id: "altro", testo: "Altro (senza testo libero)" },
];

/** Quesiti del parere dallo spoke all'hub. Elenco chiuso + 300 caratteri al massimo. */
export const QUESITI_PARERE: Motivo[] = [
  { id: "continenza", testo: "La continenza non migliora dopo le prime sedute" },
  { id: "dolore", testo: "Dolore o fastidio durante le sedute" },
  { id: "sintomi_urinari", testo: "Nuovi sintomi urinari" },
  { id: "altro", testo: "Altro" },
];

/** Condizioni di rientro all'hub scritte dall'urologo nella scheda di fase. Elenco chiuso. */
export const CONDIZIONI_RIENTRO: Motivo[] = [
  { id: "febbre", testo: "Febbre persistente" },
  { id: "difficolta_urinare", testo: "Difficoltà a urinare" },
  { id: "non_miglioramento", testo: "Nessun miglioramento della continenza al controllo di metà percorso" },
  { id: "dolore", testo: "Dolore pelvico che non passa" },
  { id: "ematuria", testo: "Sangue nelle urine" },
];

/** Documenti collegati alla scheda: solo il titolo, il contenuto resta nel FSE. */
export const DOCUMENTI_FSE = ["Lettera di dimissione", "Verbale operatorio", "Esame istologico (in attesa)"];

/** Problemi segnalati dal caregiver nell'app. Elenco chiuso. */
export const PROBLEMI_CAREGIVER: Motivo[] = [
  { id: "accompagnare", testo: "Non posso più accompagnarlo" },
  { id: "seduta_saltata", testo: "Seduta saltata" },
  { id: "peggio", testo: "Sta peggio" },
  { id: "altro", testo: "Altro" },
];

export const REGISTRO_VOCI: VoceRegistro[] = [
  { data: "2026-11-14", chi: "Hub", tipo: "resta_hub", motivo: "preferenza", fase: "Riabilitazione", sede: "Schiavonia" },
  { data: "2026-11-12", chi: "Hub", tipo: "serve_hub", motivo: "clinico", fase: "Follow-up oncologico", sede: "Schiavonia" },
  { data: "2026-11-10", chi: "Hub", tipo: "resta_hub", motivo: "manca_servizio", fase: "Follow-up oncologico", sede: "Spoke X" },
  { data: "2026-11-06", chi: "Hub", tipo: "resta_hub", motivo: "agenda_oltre", fase: "Riabilitazione", sede: "Schiavonia" },
  { data: "2026-11-03", chi: "Spoke", tipo: "spoke_non_puo", motivo: "agenda_oltre", fase: "Riabilitazione", sede: "Schiavonia" },
  { data: "2026-10-29", chi: "Hub", tipo: "resta_hub", motivo: "referto_non_visibile", fase: "Follow-up oncologico", sede: "Schiavonia" },
  { data: "2026-10-27", chi: "Hub", tipo: "resta_hub", motivo: "agenda_oltre", fase: "Riabilitazione", sede: "Schiavonia" },
  { data: "2026-10-23", chi: "Spoke", tipo: "spoke_non_puo", motivo: "posti_esauriti", fase: "Riabilitazione", sede: "Schiavonia" },
];
