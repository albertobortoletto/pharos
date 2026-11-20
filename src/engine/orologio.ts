// Orologio simulato della demo: le ore contano dalla mezzanotte del giorno di partenza.
import { OGGI_DEMO } from "../data/itinerario";
import { aggiungiGiorni, dataBreve, dataLunga, giorniTra } from "./date";

/** Ora d'inizio della demo: 20 novembre, 10:00. */
export const ORA_INIZIO = 10;

export function dataDaOra(ora: number, base = OGGI_DEMO): string {
  return aggiungiGiorni(base, Math.floor(ora / 24));
}

export function oraDaData(iso: string, ore = 9, base = OGGI_DEMO): number {
  return giorniTra(base, iso) * 24 + ore;
}

export function orarioDaOra(ora: number): string {
  const h = ((ora % 24) + 24) % 24;
  return `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
}

export function etichettaOra(ora: number): string {
  return `${dataLunga(dataDaOra(ora))}, ${orarioDaOra(ora)}`;
}

/** Versione compatta per l'header: «ven 20/11 · 10:00». */
export function etichettaOraBreve(ora: number): string {
  const d = dataDaOra(ora);
  return `${dataLunga(d).slice(0, 3)} ${dataBreve(d)} · ${orarioDaOra(ora)}`;
}
