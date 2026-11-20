// Parametri del generatore del dataset SINTETICO (nessun dato reale).
// Sono le "regole del gioco" con cui nascono i pazienti fittizi: il motore poi le
// ri-stima dai dati, come farebbe con i casi veri di un pilota.

/** Nuovi pazienti al mese, dal mese −5 al mese 0 (oggi): la domanda cresce. */
export const ENTRATE_MENSILI = [34, 38, 43, 49, 56, 64];

/** Spoke della riabilitazione considerati nel pilota. */
export const SPOKE_PILOTA = ["schiavonia", "piove", "legnago"] as const;

/** Oltre questa distanza (km) il paziente resta all'hub. */
export const KM_MAX_SPOKE = 45;
/** Probabilità che un paziente vicino a uno spoke venga delegato. */
export const P_DELEGA = 0.8;

/** Probabilità mensili "vere" del generatore. */
export const GENERATORE = {
  hubVersoSpoke: 0.5,
  hubResta: 0.35,
  hubSoloResta: 0.45,
  spokeResta: 0.35,
  rientratoVersoHub: 0.6,
};

/** Struttura hub e posti dichiarati simulati per la previsione dell'hub. */
export const POSTI_SETTIMANA_HUB = 18;
/** Settimane per mese usate per passare da posti a settimana a posti nel mese. */
export const SETTIMANE_MESE = 4;
