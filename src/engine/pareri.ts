// Parere con scadenza: lo spoke chiede, l'hub risponde. Se la scadenza passa, va al coordinatore del GOM.
import type { ParametriPdta } from "../data/tipi";
import { aggiungiGiorniLavorativi, giorniTra } from "./date";
import { dataDaOra } from "./orologio";

export type RispostaParere =
  | { tipo: "continua" }
  | { tipo: "continua_modifiche"; testo: string }
  | { tipo: "serve_hub"; motivo: string; dataSlot: string };

export interface Parere {
  id: string;
  scheda: string;
  paziente: string;
  struttura: string;
  quesito: string;
  testo: string;
  urgente: boolean;
  ora: number;
  scadenza: number;
  risposta: RispostaParere | null;
  oraRisposta: number | null;
  escalation: boolean;
}

/** Scadenza del parere dai parametri del PDTA: 5 giorni lavorativi, 24 ore se urgente. */
export function scadenzaParere(ora: number, urgente: boolean, p: ParametriPdta): number {
  if (urgente) return ora + p.parere_urgente_ore;
  const oggi = dataDaOra(ora);
  const fine = aggiungiGiorniLavorativi(oggi, p.parere_giorni_lavorativi);
  return ora + giorniTra(oggi, fine) * 24;
}

export function parereScaduto(x: Parere, ora: number): boolean {
  return x.risposta === null && ora >= x.scadenza;
}
