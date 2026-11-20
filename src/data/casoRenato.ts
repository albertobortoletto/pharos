// Caso di studio: oncologia polmonare. Persona, date, telefoni e disponibilità INVENTATI.
// Il farmaco e il suo schema sono un esempio: da verificare su scheda tecnica e con il GOM.

export const NOTA_CASO = "Caso di studio: persona e date inventate. Schema del farmaco da verificare su scheda tecnica e con il GOM.";

/** La persona: chi è, cosa le serve, cosa la preoccupa. */
export const RENATO = {
  nome: "Renato D.",
  eta: 67,
  comune: "Agordo (BL)",
  lat: 46.2797,
  lng: 12.0336,
  famiglia: "Vive con la moglie Carla, che non guida.",
  telefono: "333 000 0303",
  bisogni: ["Sapere chi lo segue in ogni fase", "Non dover organizzare da solo i viaggi a Padova", "Date chiare, scritte grandi"],
  timori: ["«Padova è lontana: due ore di strada»", "«Se cambio ospedale, ricomincio da capo?»"],
};

export const CASA_RENATO = { nome: "Agordo (domicilio di Renato)", lat: RENATO.lat, lng: RENATO.lng };

/** Le due strutture del caso: lo spoke dove entra e l'hub dove va per la seconda linea. */
export const SPOKE_CASO = { nodo: "BL", nome: "Oncologia dell'Ospedale di Belluno", breve: "Belluno" };
export const HUB_CASO = { nodo: "IOV", nome: "IOV – Istituto Oncologico Veneto, Padova", breve: "IOV Padova" };

/** Distanze da casa (stime, sola andata). */
export const TRATTE_RENATO = {
  spoke: { km: 30, minuti: 40 },
  hub: { km: 135, minuti: 125 },
  altro_hub: { km: 190, minuti: 155 },
};

/** Farmaco di seconda linea: si somministra solo negli hub abilitati (esempio). */
export const SECONDA_LINEA = {
  farmaco: "tarlatamab",
  etichetta: "solo_hub" as const,
  hubAbilitati: [
    { nodo: "IOV", nome: "IOV Padova", km: TRATTE_RENATO.hub.km },
    { nodo: "VR", nome: "AOUI Verona", km: TRATTE_RENATO.altro_hub.km },
  ],
  /** Giorni del primo ciclo che si fanno all'hub. */
  giorniHub: [
    { giorno: 1, nome: "Prima infusione" },
    { giorno: 8, nome: "Seconda infusione" },
  ],
  osservazione: "Dopo ogni infusione, osservazione all'hub secondo protocollo.",
  dopo: "Le dosi successive: sede decisa dall'oncologo dell'hub.",
};

/** Prime date libere del day hospital dell'IOV per un nuovo ciclo (simulate). */
export const SLOT_HUB = ["2026-12-01", "2026-12-02", "2026-12-03"];

/** Festivi del periodo: nessuna infusione programmata in questi giorni. */
export const FESTIVI = ["2026-12-08", "2026-12-25", "2026-12-26", "2027-01-01", "2027-01-06"];

/** La storia fino a oggi: date di esempio. */
export const STORIA_RENATO = {
  prontoSoccorso: "2026-06-12",
  diagnosi: "2026-06-22",
  primaLinea: "2026-07-01",
  progressione: "2026-11-10",
  gom: "2026-11-17",
  esamiTraG1G8: 5,
};

export const INFERMIERA_HUB = { nome: "Elena", ruolo: "infermiera di percorso dell'IOV", telefono: "049 000 2345", orari: "lunedì–venerdì, 8:00–16:00" };

/** Documenti che passano all'hub con la richiesta, dal Fascicolo Sanitario Elettronico. */
export const DOCUMENTI_RENATO = ["Esame istologico (microcitoma)", "TC di rivalutazione", "Lettera dell'oncologo di Belluno", "Esami del sangue recenti"];

/** Orari del giorno di infusione all'hub (esempio). */
export const ORARI_INFUSIONE = { arrivo: "8:30", partenzaDaCasa: "6:15", luogo: "IOV Padova – Day hospital oncologico, piano 1" };
