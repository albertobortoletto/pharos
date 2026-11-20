// Date in formato ISO (AAAA-MM-GG), sempre in UTC per evitare sorprese con i fusi orari.

export const MESI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];
const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

const parti = (iso: string) => iso.slice(0, 10).split("-").map(Number) as [number, number, number];
const aDate = (iso: string) => {
  const [a, m, g] = parti(iso);
  return new Date(Date.UTC(a, m - 1, g));
};
const aIso = (d: Date) => d.toISOString().slice(0, 10);

/** «martedì 24 novembre» */
export function dataLunga(iso: string): string {
  const [, m, g] = parti(iso);
  return `${GIORNI[aDate(iso).getUTCDay()]} ${g} ${MESI[m - 1]}`;
}

/** «24/11» */
export function dataBreve(iso: string): string {
  const [, m, g] = parti(iso);
  return `${g}/${m}`;
}

export function aggiungiGiorni(iso: string, giorni: number): string {
  const d = aDate(iso);
  d.setUTCDate(d.getUTCDate() + giorni);
  return aIso(d);
}

export function aggiungiMesi(iso: string, mesi: number): string {
  const d = aDate(iso);
  d.setUTCMonth(d.getUTCMonth() + mesi);
  return aIso(d);
}

/** Giorni da `da` ad `a` (positivo se `a` è dopo). */
export function giorniTra(da: string, a: string): number {
  return Math.round((aDate(a).getTime() - aDate(da).getTime()) / 86_400_000);
}

export function lavorativo(iso: string): boolean {
  const g = aDate(iso).getUTCDay();
  return g !== 0 && g !== 6;
}

export function aggiungiGiorniLavorativi(iso: string, n: number): string {
  let d = iso;
  let contati = 0;
  while (contati < n) {
    d = aggiungiGiorni(d, 1);
    if (lavorativo(d)) contati++;
  }
  return d;
}

/** Nome del mese di una data ISO. */
export function nomeMese(iso: string): string {
  return MESI[parti(iso)[1] - 1];
}

/** Ore rimaste fino a una scadenza, a partire da "ora" (entrambi in ore assolute di demo). */
export function formattaOre(ore: number): string {
  const segno = ore < 0 ? -1 : 1;
  const h = Math.abs(Math.round(ore));
  const g = Math.floor(h / 24);
  const r = h % 24;
  const testo = g > 0 ? (r > 0 ? `${g} g ${r} h` : `${g} g`) : `${r} h`;
  return segno < 0 ? `scaduto da ${testo}` : testo;
}
