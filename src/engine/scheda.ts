// Macchina a stati della scheda di fase.
// Ogni stato ha UN solo responsabile e un timer. Funzioni pure: nessun effetto collaterale.
import type { ParametriPdta } from "../data/tipi";

export type StatoScheda =
  | "BOZZA"
  | "INVIATA"
  | "ACCETTATA"
  | "PRENOTATA"
  | "IN_CORSO"
  | "ESITO_ATTESO"
  | "ESITO_RICEVUTO"
  | "CHIUSA"
  | "RIENTRO"
  | "RIFIUTATA"
  | "ANNULLATA";

export type Responsabile = "hub" | "spoke" | "case_manager" | "paziente" | "nessuno";

export type EventoScheda =
  | { tipo: "proponi"; struttura: string }
  | { tipo: "accetta" }
  | { tipo: "rifiuta"; motivo: string }
  | { tipo: "annulla"; motivo: string }
  | { tipo: "prenota"; data: string }
  | { tipo: "iniziaSedute" }
  | { tipo: "segnalaNonMiglioramento" }
  | { tipo: "fineSedute" }
  | { tipo: "inviaEsito" }
  | { tipo: "chiudi" }
  | { tipo: "rientro"; motivo: string }
  | { tipo: "sollecito" }
  | { tipo: "escalation" }
  | { tipo: "ripristina"; stato: StatoScheda };

export interface VoceStoria {
  ora: number;
  evento: EventoScheda["tipo"];
  da: StatoScheda;
  a: StatoScheda;
  nota?: string;
}

export interface Scheda {
  id: string;
  paziente: string;
  prestazione: string;
  /** Struttura che deve eseguire la fase (per BOZZA è la proposta corrente). */
  struttura: string;
  stato: StatoScheda;
  /** Ora di demo (ore dall'inizio del 20/11) in cui è iniziato lo stato corrente. */
  dal: number;
  /** Ora di demo entro cui il responsabile deve agire; null se non c'è timer. */
  scadenza: number | null;
  motivo: string | null;
  dataPrenotata: string | null;
  solleciti: number;
  /** Escalation al coordinatore del GOM già partita. */
  escalation: boolean;
  /** È stato segnalato un mancato miglioramento (parere aperto). */
  nonMiglioramento: boolean;
  storia: VoceStoria[];
}

/** Il SOLO responsabile di ogni stato. */
export const RESPONSABILE: Record<StatoScheda, Responsabile> = {
  BOZZA: "hub",
  INVIATA: "spoke",
  ACCETTATA: "spoke",
  PRENOTATA: "spoke",
  IN_CORSO: "spoke",
  ESITO_ATTESO: "spoke",
  ESITO_RICEVUTO: "hub",
  CHIUSA: "nessuno",
  RIENTRO: "hub",
  RIFIUTATA: "case_manager",
  ANNULLATA: "nessuno",
};

/** Transizioni ammesse: evento → stati di partenza → stato d'arrivo. */
const TRANSIZIONI: Partial<Record<EventoScheda["tipo"], { da: StatoScheda[]; a: StatoScheda | null }>> = {
  proponi: { da: ["BOZZA", "RIFIUTATA"], a: "INVIATA" },
  accetta: { da: ["INVIATA"], a: "ACCETTATA" },
  rifiuta: { da: ["INVIATA"], a: "RIFIUTATA" },
  annulla: { da: ["BOZZA", "INVIATA", "RIFIUTATA"], a: "ANNULLATA" },
  prenota: { da: ["ACCETTATA"], a: "PRENOTATA" },
  iniziaSedute: { da: ["PRENOTATA"], a: "IN_CORSO" },
  segnalaNonMiglioramento: { da: ["IN_CORSO"], a: null },
  fineSedute: { da: ["IN_CORSO"], a: "ESITO_ATTESO" },
  inviaEsito: { da: ["IN_CORSO", "ESITO_ATTESO"], a: "ESITO_RICEVUTO" },
  chiudi: { da: ["ESITO_RICEVUTO"], a: "CHIUSA" },
  rientro: { da: ["ACCETTATA", "PRENOTATA", "IN_CORSO", "ESITO_ATTESO", "ESITO_RICEVUTO"], a: "RIENTRO" },
  sollecito: { da: ["INVIATA", "ACCETTATA", "ESITO_ATTESO", "ESITO_RICEVUTO", "RIFIUTATA"], a: null },
  escalation: { da: ["INVIATA", "RIFIUTATA", "ESITO_ATTESO"], a: null },
};

export const STATI_ATTIVI: StatoScheda[] = ["BOZZA", "INVIATA", "ACCETTATA", "PRENOTATA", "IN_CORSO", "ESITO_ATTESO", "ESITO_RICEVUTO", "RIFIUTATA", "RIENTRO"];
export const STATI_PRESA_IN_CARICO: StatoScheda[] = ["ACCETTATA", "PRENOTATA", "IN_CORSO", "ESITO_ATTESO", "ESITO_RICEVUTO", "CHIUSA"];

export function puo(s: Scheda, evento: EventoScheda["tipo"]): boolean {
  if (evento === "ripristina") return true;
  const t = TRANSIZIONI[evento];
  return !!t && t.da.includes(s.stato);
}

/** Ore lavorative approssimate: 5 giorni lavorativi = 7 giorni di calendario. */
const oreGiorniLavorativi = (g: number) => Math.ceil((g * 7) / 5) * 24;

/** Timer del nuovo stato, in ore di demo. */
export function scadenzaPer(stato: StatoScheda, ora: number, p: ParametriPdta, extra?: { oraPrenotata?: number }): number | null {
  switch (stato) {
    case "INVIATA":
      return ora + p.risposta_spoke_ore;
    case "ACCETTATA":
      return ora + 24;
    case "PRENOTATA":
      return extra?.oraPrenotata ?? ora + 24 * 7;
    case "ESITO_ATTESO":
      return ora + oreGiorniLavorativi(2);
    case "ESITO_RICEVUTO":
      return ora + oreGiorniLavorativi(p.parere_giorni_lavorativi);
    case "RIFIUTATA":
      return ora + oreGiorniLavorativi(2);
    case "RIENTRO":
      return ora + p.rientro_priorita_giorni * 24;
    default:
      return null;
  }
}

export function nuovaScheda(id: string, paziente: string, prestazione: string, struttura: string, ora: number): Scheda {
  return {
    id,
    paziente,
    prestazione,
    struttura,
    stato: "BOZZA",
    dal: ora,
    scadenza: null,
    motivo: null,
    dataPrenotata: null,
    solleciti: 0,
    escalation: false,
    nonMiglioramento: false,
    storia: [],
  };
}

/**
 * Applica un evento. Se la transizione non è ammessa restituisce la scheda invariata
 * (stesso riferimento): chi chiama può confrontare per sapere se è cambiato qualcosa.
 */
export function transizione(s: Scheda, e: EventoScheda, ora: number, p: ParametriPdta, extra?: { oraPrenotata?: number }): Scheda {
  if (!puo(s, e.tipo)) return s;
  const voce = (a: StatoScheda, nota?: string): VoceStoria => ({ ora, evento: e.tipo, da: s.stato, a, nota });

  if (e.tipo === "ripristina")
    return { ...s, stato: e.stato, dal: ora, scadenza: scadenzaPer(e.stato, ora, p), motivo: null, escalation: false, storia: [...s.storia, voce(e.stato, "annullato in demo")] };
  if (e.tipo === "sollecito") return { ...s, solleciti: s.solleciti + 1, storia: [...s.storia, voce(s.stato)] };
  if (e.tipo === "escalation") return { ...s, escalation: true, storia: [...s.storia, voce(s.stato, "al coordinatore del GOM")] };
  if (e.tipo === "segnalaNonMiglioramento") return { ...s, nonMiglioramento: true, storia: [...s.storia, voce(s.stato)] };

  const a = TRANSIZIONI[e.tipo]!.a!;
  const base: Scheda = { ...s, stato: a, dal: ora, scadenza: scadenzaPer(a, ora, p, extra), escalation: false, solleciti: 0, storia: [...s.storia, voce(a)] };
  switch (e.tipo) {
    case "proponi":
      return { ...base, struttura: e.struttura, motivo: null };
    case "rifiuta":
    case "annulla":
    case "rientro":
      return { ...base, motivo: e.motivo };
    case "prenota":
      return { ...base, dataPrenotata: e.data };
    default:
      return base;
  }
}

/** Eventi automatici che il tempo fa scattare (solleciti ed escalation, mai decisioni cliniche). */
export function eventiDaTimer(s: Scheda, ora: number): EventoScheda[] {
  if (s.scadenza === null || ora < s.scadenza) return [];
  if (s.stato === "INVIATA" && !s.escalation) return [{ tipo: "escalation" }];
  if (s.stato === "RIFIUTATA" && !s.escalation) return [{ tipo: "escalation" }];
  if (s.stato === "ESITO_ATTESO" && s.solleciti === 0) return [{ tipo: "sollecito" }];
  if (s.stato === "ESITO_ATTESO" && s.solleciti > 0 && !s.escalation && ora >= s.scadenza + 48) return [{ tipo: "escalation" }];
  return [];
}

export const NOME_STATO: Record<StatoScheda, string> = {
  BOZZA: "Bozza",
  INVIATA: "Inviata allo spoke",
  ACCETTATA: "Accettata",
  PRENOTATA: "Prenotata",
  IN_CORSO: "In corso",
  ESITO_ATTESO: "Esito atteso",
  ESITO_RICEVUTO: "Esito ricevuto",
  CHIUSA: "Chiusa",
  RIENTRO: "Rientro all'hub",
  RIFIUTATA: "Rifiutata",
  ANNULLATA: "Annullata: resta all'hub",
};
