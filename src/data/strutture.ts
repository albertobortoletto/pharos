import type { Struttura } from "./tipi";

export const NOTA_STRUTTURE = "Dati fittizi per la demo. Posti e requisiti sono esempi, non dati reali.";

/**
 * Strutture del percorso della prostata. Padova è l'hub, Schiavonia lo spoke pilota.
 * Gli altri spoke servono a mostrare l'abbinamento e le esclusioni con motivo: posti,
 * attese e requisiti sono SIMULATI.
 */
export const STRUTTURE: Struttura[] = [
  {
    id: "padova",
    nome: "Padova",
    tipo: "hub",
    ruolo: "Azienda ospedaliera – hub",
    servizi: ["urologia", "riabilitazione_pavimento_pelvico", "follow_up_oncologico_uro"],
    requisiti: true,
    nodo: "PD",
  },
  {
    id: "schiavonia",
    nome: "Schiavonia",
    tipo: "spoke",
    ruolo: "Ospedale – spoke ULSS 6 Euganea",
    servizi: ["riabilitazione_pavimento_pelvico", "follow_up_oncologico_uro"],
    requisiti: true,
    posti_settimana: 6,
    posti_liberi: 4,
    prima_data_utile: "2026-11-24",
    nodo: "SC",
    attesa_giorni: 4,
  },
  {
    id: "piove",
    nome: "Piove di Sacco",
    tipo: "spoke",
    ruolo: "Ospedale – spoke ULSS 6 Euganea (simulato)",
    servizi: ["riabilitazione_pavimento_pelvico"],
    requisiti: true,
    posti_settimana: 4,
    posti_liberi: 1,
    prima_data_utile: "2026-12-02",
    nodo: "PS",
    attesa_giorni: 12,
  },
  {
    id: "legnago",
    nome: "Legnago",
    tipo: "spoke",
    ruolo: "Ospedale – ULSS 9 Scaligera (simulato, fuori dalla rete pilota)",
    servizi: ["riabilitazione_pavimento_pelvico"],
    requisiti: true,
    posti_settimana: 3,
    posti_liberi: 0,
    nodo: "LE",
    attesa_giorni: 25,
  },
  {
    id: "spoke_x",
    nome: "Spoke X (esempio)",
    tipo: "spoke",
    ruolo: "Spoke di esempio senza il servizio",
    servizi: [],
    requisiti: false,
    posti_settimana: 0,
    posti_liberi: 0,
  },
];

export const strutturaPerId = (id: string): Struttura => {
  const s = STRUTTURE.find((x) => x.id === id);
  if (!s) throw new Error(`Struttura sconosciuta: ${id}`);
  return s;
};
