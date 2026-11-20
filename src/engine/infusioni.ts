// Pianificazione del primo ciclo all'hub: tutte le infusioni (es. giorno 1 e giorno 8)
// devono cadere in un giorno feriale non festivo. Il sistema propone, l'oncologo conferma.
import { aggiungiGiorni, dataLunga, lavorativo } from "./date";

export interface DataScartata {
  inizio: string;
  motivo: string;
}

export interface PianoCiclo {
  /** Date delle infusioni, nello stesso ordine dei giorni richiesti. */
  date: string[];
  /** Primi giorni scartati, con il motivo in parole semplici. */
  scartate: DataScartata[];
}

/**
 * Sceglie la prima data libera dell'hub (in `slot`) per cui ogni giorno del ciclo
 * (`giorni`, contati da 1) è feriale e non festivo. `null` se nessuna va bene.
 */
export function pianificaCiclo(slot: string[], giorni: number[], festivi: string[]): PianoCiclo | null {
  const scartate: DataScartata[] = [];
  for (const inizio of slot) {
    const date = giorni.map((g) => aggiungiGiorni(inizio, g - 1));
    const i = date.findIndex((d) => !lavorativo(d) || festivi.includes(d));
    if (i === -1) return { date, scartate };
    const perche = festivi.includes(date[i]) ? "festivo" : "nel fine settimana";
    scartate.push({ inizio, motivo: `il giorno ${giorni[i]} cadrebbe ${dataLunga(date[i])}, ${perche}` });
  }
  return null;
}
