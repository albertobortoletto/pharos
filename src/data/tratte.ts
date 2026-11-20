import type { Tratta } from "./tipi";

export const NOTA_TRATTE =
  "Distanze e tempi andata e ritorno: STIME da ricontrollare con la matrice ISTAT (non disponibile in locale).";

/** Tratte andata e ritorno (stime). Sono le stesse cifre della scena 2 e della mappa. */
export const TRATTE: Tratta[] = [
  { da: "Montagnana", a: "padova", km_ar: 100, ore_ar: 2, fonte: "stima" },
  { da: "Montagnana", a: "schiavonia", km_ar: 44, ore_ar: 1, fonte: "stima" },
  { da: "Montagnana", a: "piove", km_ar: 120, ore_ar: 2.5, fonte: "stima" },
  { da: "Montagnana", a: "legnago", km_ar: 36, ore_ar: 1, fonte: "stima" },
  { da: "Este", a: "padova", km_ar: 70, ore_ar: 1.5, fonte: "stima" },
  { da: "Este", a: "schiavonia", km_ar: 16, ore_ar: 0.5, fonte: "stima" },
];

export function tratta(da: string, a: string): Tratta | undefined {
  return TRATTE.find((t) => t.da === da && t.a === a);
}

/** Numero di sedute usato per il conto del viaggio (dalla lettera di dimissione). */
export const SEDUTE_RIABILITAZIONE = 10;
