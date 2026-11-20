// Tipi dei dati della demo. Tutti i dati sono fittizi.

export type EtichettaPdta = "spoke" | "solo_hub" | "spoke_con_parere_hub";

export interface Struttura {
  id: string;
  nome: string;
  tipo: "hub" | "spoke";
  ruolo: string;
  servizi: string[];
  requisiti: boolean;
  /** Posti dichiarati a settimana (solo spoke). */
  posti_settimana?: number;
  /** Posti liberi all'avvio della demo (solo spoke). */
  posti_liberi?: number;
  prima_data_utile?: string;
  /** Nodo della mappa corrispondente (vedi rete/nodi.ts). */
  nodo?: string;
  /** Attesa media simulata per la prima seduta, in giorni. */
  attesa_giorni?: number;
}

export interface Tratta {
  da: string;
  a: string;
  km_ar: number;
  ore_ar: number;
  fonte: "stima" | "ISTAT";
}

export interface Prestazione {
  id: string;
  nome: string;
  etichetta: EtichettaPdta;
}

export interface ParametriPdta {
  parere_giorni_lavorativi: number;
  parere_urgente_ore: number;
  rientro_priorita_giorni: number;
  attesa_max_spoke_giorni: number;
  risposta_spoke_ore: number;
  conferma_paziente_ore: number;
  seduta_controllo: number;
  quesito_max_caratteri: number;
}

export interface RigaEstratta {
  id: string;
  tipo: "fase" | "segnale" | "parere" | "condizione";
  azione: string;
  dettaglio: string;
  quando: string;
  prestazione?: string;
  frase: string;
}

export interface Motivo {
  id: string;
  testo: string;
}

export interface VoceRegistro {
  data: string;
  chi: "Hub" | "Spoke";
  tipo: "resta_hub" | "spoke_non_puo" | "serve_hub";
  motivo: string;
  fase: string;
  sede: string;
  demo?: boolean;
  nuova?: boolean;
}

export interface RigaInfermiera {
  id: string;
  paziente: string;
  eta: number;
  comune: string;
  fase: string;
  sede: string;
  data: string;
  stato: "da_richiamare" | "giovanni" | "fatta" | "referto_arrivato" | "non_verificabile";
  spiegazione?: string;
  contatto?: { chi: string; numero: string };
}
