import type { Tratta } from "../data/tipi";
import { TRATTE } from "../data/tratte";

export interface VoceConto {
  viaggi: number;
  km: number;
  ore: number;
  giornate: number;
  mezze: number;
}

export interface ContoViaggio {
  tuttoHub: VoceConto;
  misto: VoceConto;
  risparmio: { km: number; ore: number };
  fonte: "stima" | "ISTAT";
}

/**
 * Conto del viaggio: tutto all'hub contro sedute allo spoke.
 * È l'unica funzione che calcola queste cifre: scena 2, vista Hub, mappa e app di Laura la usano.
 */
export function contoViaggio(
  comune: string,
  sedute: number,
  tratte: Tratta[] = TRATTE,
  hub = "padova",
  spoke = "schiavonia",
): ContoViaggio {
  const t = (a: string) => {
    const x = tratte.find((p) => p.da === comune && p.a === a);
    if (!x) throw new Error(`Tratta mancante: ${comune} → ${a}`);
    return x;
  };
  const h = t(hub);
  const s = t(spoke);
  const tuttoHub = { viaggi: sedute, km: sedute * h.km_ar, ore: sedute * h.ore_ar, giornate: sedute, mezze: 0 };
  const misto = { viaggi: sedute, km: sedute * s.km_ar, ore: sedute * s.ore_ar, giornate: 0, mezze: sedute };
  return {
    tuttoHub,
    misto,
    risparmio: { km: tuttoHub.km - misto.km, ore: tuttoHub.ore - misto.ore },
    fonte: h.fonte === "stima" || s.fonte === "stima" ? "stima" : "ISTAT",
  };
}

/** Km di sola andata da casa alla struttura (metà della tratta andata e ritorno). */
export function kmAndata(comune: string, struttura: string, tratte: Tratta[] = TRATTE): number | null {
  const x = tratte.find((p) => p.da === comune && p.a === struttura);
  return x ? x.km_ar / 2 : null;
}

/** Km risparmiati a ogni viaggio (andata e ritorno) scegliendo lo spoke invece dell'hub. */
export function kmRisparmiatiAViaggio(comune: string, spoke: string, hub = "padova", tratte: Tratta[] = TRATTE): number {
  const h = tratte.find((p) => p.da === comune && p.a === hub);
  const s = tratte.find((p) => p.da === comune && p.a === spoke);
  return h && s ? h.km_ar - s.km_ar : 0;
}
