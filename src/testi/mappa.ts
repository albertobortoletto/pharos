// Testi della mappa: titoli dei passi della demo, didascalie, legenda e avvisi. Una sola fonte.

export const SOTTOTITOLO_MAPPA = "Veneto: rete ospedaliera, rete ictus e rete oncologica, dalle fonti pubbliche.";
export const MESSAGGIO_MAPPA = "La rete sulla carta esiste già. Mancano le linee che collegano i passaggi di ogni singolo paziente.";

/** I 7 passi della demo della mappa, nell'ordine del pitch. */
export const PASSI_MAPPA = [
  { n: 1, bottone: "Rete ospedaliera", titolo: "La rete sulla carta esiste già." },
  { n: 2, bottone: "Rete ictus", titolo: "Hub e spoke dipendono dalla rete." },
  { n: 3, bottone: "Rete oncologica", titolo: "Per la prostata, i collegamenti per singola fase non sono scritti da nessuna parte." },
  { n: 4, bottone: "Segui Renato", titolo: "Mancano le linee che collegano i passaggi di ogni singolo paziente." },
  { n: 5, bottone: "Perché l'IOV?", titolo: "Il sistema propone e spiega, il medico decide." },
  { n: 6, bottone: "Previsione: oggi → +3 mesi", titolo: "Dove mancheranno posti, prima che manchino." },
  { n: 7, bottone: "Apri il caso di Renato", titolo: "Dalla rete al paziente." },
] as const;

export const ETICHETTA_BELLUNO = "Hub nella rete ospedaliera, spoke nella rete ictus";
export const DIDASCALIA_ONCO = "Per la prostata, i collegamenti per singola fase non sono scritti da nessuna parte.";
export const ROV_DA_COMPLETARE = "Altri poli della ROV: da completare con il Decreto 82/2024";

export const NOMI_LIVELLI = {
  ospedaliera: "Rete ospedaliera (DGR 614/2019)",
  ictus: "Rete ictus (DGR 4198/2008)",
  onco: "Rete oncologica (ROV)",
  percorso: "Percorso di Renato",
  previsione: "Previsione (catena di Markov)",
} as const;

export const NOMI_RUOLO_OSPEDALIERO = {
  hub_eu: "hub di riferimento europeo",
  hub_prov: "hub provinciale",
  altro: "ospedale della rete",
} as const;

export const AVVISO_MAPPA = "Ricostruita da fonti pubbliche; collegamenti in parte dedotti; dati di capacità simulati.";
export const FONTI_MAPPA = "Confini: ISTAT via openpolis (CC BY 4.0) · Ruoli: DGR 614/2019, DGR 4198/2008, ROV · Coordinate: OpenStreetMap";
export const NOTA_ICTUS = "Collegamenti spoke→hub dedotti dall'ULSS di appartenenza (macro-aree).";

/** «A gennaio servono più posti di riabilitazione a Schiavonia (simulato)» */
export const frasePrevisione = (mese: string, struttura: string) => `A ${mese} servono più posti di riabilitazione a ${struttura} (simulato)`;
