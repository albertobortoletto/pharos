import type { RigaInfermiera } from "./tipi";

export const NOTA_INFERMIERA = "Elenco dell'infermiera di percorso, 20 novembre. Pazienti fittizi.";

export const RIGHE_INFERMIERA: RigaInfermiera[] = [
  {
    id: "n1",
    paziente: "Franco B.",
    eta: 74,
    comune: "Conselve",
    fase: "Riabilitazione, seduta 3 di 10",
    sede: "schiavonia",
    data: "2026-11-18",
    stato: "da_richiamare",
    spiegazione: "Nessuna conferma dello spoke da 2 giorni lavorativi.",
    contatto: { chi: "Franco o il figlio Paolo", numero: "333 000 0202" },
  },
  {
    id: "n2",
    paziente: "Giovanni R.",
    eta: 70,
    comune: "Montagnana",
    fase: "Riabilitazione, 10 sedute",
    sede: "schiavonia",
    data: "2026-11-24",
    stato: "giovanni",
  },
  {
    id: "n3",
    paziente: "Rosa C.",
    eta: 68,
    comune: "Este",
    fase: "Riabilitazione, seduta 6 di 10",
    sede: "schiavonia",
    data: "2026-11-19",
    stato: "fatta",
    spiegazione: "Esecuzione registrata nell'agenda dello spoke.",
  },
  {
    id: "n4",
    paziente: "Luigi M.",
    eta: 66,
    comune: "Este",
    fase: "Esami prima del follow-up",
    sede: "schiavonia",
    data: "2026-11-16",
    stato: "referto_arrivato",
    spiegazione: "Il referto risulta presente all'hub (solo la presenza, non il contenuto).",
  },
  {
    id: "n5",
    paziente: "Anna T.",
    eta: 72,
    comune: "Piove di Sacco",
    fase: "Esame ecografico",
    sede: "privato",
    data: "2026-11-18",
    stato: "non_verificabile",
    spiegazione:
      "Struttura privata convenzionata: il sistema non legge la sua agenda. Lo chiedo alla paziente alla prossima telefonata.",
  },
];

export const ZONE = {
  vedo: [
    "Agende dell'hub di Padova (estrazione settimanale)",
    "Conferme di esecuzione dello spoke di Schiavonia",
    "Presenza dei referti all'hub (non il contenuto)",
    "Risposte dello spoke: «Prendo in carico» / «Non posso»",
  ],
  non_vedo: [
    "Strutture private convenzionate",
    "Referti di altre aziende sanitarie",
    "Come sta il paziente a casa: lo sa solo chi lo chiama",
  ],
};
