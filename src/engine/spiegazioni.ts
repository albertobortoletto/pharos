// Frasi generate dai dati. UNICO posto dove nascono: hub, spoke, mappa e schermata AI le usano
// così come sono, per dire le stesse cose nello stesso modo.
import { livelloRischio, type Fattore } from "./bayes";
import { NOMI_VALORI } from "../testi/glossario";

export const percento = (p: number) => `${Math.round(p * 100)}%`;
export const punti = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x).toFixed(0)} punti`;

/** «rischio di rientro basso (12%)» */
export function fraseRischio(p: number): string {
  return `rischio di rientro ${livelloRischio(p)} (${percento(p)})`;
}

/** «Schiavonia: 38 casi simili trattati, 22 km da casa, rischio di rientro basso (12%), 2 posti liberi questa settimana» */
export function fraseStruttura(x: { nome: string; simili: number; km: number; rischio: number; postiLiberi: number }): string {
  const posti = x.postiLiberi === 1 ? "1 posto libero" : `${x.postiLiberi} posti liberi`;
  return `${x.nome}: ${x.simili} casi simili trattati, ${Math.round(x.km)} km da casa, ${fraseRischio(x.rischio)}, ${posti} questa settimana`;
}

const valore = (nodo: string, v: string) => NOMI_VALORI[nodo]?.[v] ?? v;

/** «Complicanza post-operatoria: no (−17 punti rispetto a «sì»)» */
export function fraseFattore(f: Fattore): string {
  return `${f.nome}: ${valore(f.nodo, f.valore)} (${punti(f.punti)} rispetto a «${valore(f.nodo, f.confronto)}»)`;
}

/** Nome del valore leggibile. */
export function nomeValore(nodo: string, v: string): string {
  return valore(nodo, v);
}
