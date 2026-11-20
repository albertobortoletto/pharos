// Catena di Markov: previsione di come si distribuiranno i pazienti nella rete, mese per mese.
// Non riguarda il singolo paziente. Matrice stimata contando i passaggi nel dataset sintetico.
import { POSTI_SETTIMANA_HUB, SETTIMANE_MESE, SPOKE_PILOTA } from "../data/sintetico";
import { CONCLUSO, generaDataset, HUB, RIENTRATO, statoSpoke, type PazienteSintetico } from "./synth";
import { categorica, creaRng, poisson, SEED_DEMO } from "./rng";

export const STATI_MARKOV = [HUB, ...SPOKE_PILOTA.map(statoSpoke), RIENTRATO, CONCLUSO];

export interface ModelloMarkov {
  stati: string[];
  /** P[i][j] = probabilità di passare dallo stato i allo stato j in un mese. */
  P: number[][];
  /** Nuovi ingressi al mese (Poisson), all'hub: media degli ultimi mesi. */
  lambda: number;
  /** Crescita mensile degli ingressi, stimata con una retta sui mesi osservati. */
  tendenza: number;
  /** Pazienti in ciascuno stato oggi (mese 0). */
  iniziale: number[];
  /** Numero di passaggi osservati usati per la stima. */
  passaggi: number;
}

/** Stima la matrice contando i passaggi mese → mese. Le righe senza dati restano ferme. */
export function stimaModello(dati: PazienteSintetico[] = generaDataset(), mesiLambda = 3): ModelloMarkov {
  const n = STATI_MARKOV.length;
  const idx = new Map(STATI_MARKOV.map((s, i) => [s, i]));
  const conta = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  let passaggi = 0;
  for (const p of dati)
    for (let t = 1; t < p.percorso.length; t++) {
      conta[idx.get(p.percorso[t - 1])!][idx.get(p.percorso[t])!]++;
      passaggi++;
    }
  const P = conta.map((riga, i) => {
    const tot = riga.reduce((a, b) => a + b, 0);
    if (tot === 0) return riga.map((_, j) => (j === i ? 1 : 0));
    return riga.map((x) => x / tot);
  });
  // CONCLUSO è assorbente
  P[idx.get(CONCLUSO)!] = STATI_MARKOV.map((s) => (s === CONCLUSO ? 1 : 0));
  // ingressi per mese osservato e retta dei minimi quadrati
  const mesiOss = Array.from(new Set(dati.map((p) => p.ingresso))).sort((a, b) => a - b);
  const conteggi = mesiOss.map((m) => dati.filter((p) => p.ingresso === m).length);
  const mx = mesiOss.reduce((a, b) => a + b, 0) / mesiOss.length;
  const my = conteggi.reduce((a, b) => a + b, 0) / conteggi.length;
  const num = mesiOss.reduce((a, m, i) => a + (m - mx) * (conteggi[i] - my), 0);
  const den = mesiOss.reduce((a, m) => a + (m - mx) ** 2, 0);
  const tendenza = den > 0 ? num / den : 0;
  const ultimi = dati.filter((p) => p.ingresso > -mesiLambda);
  const lambda = ultimi.length / mesiLambda;
  const iniziale = new Array<number>(n).fill(0);
  for (const p of dati) {
    const ultimo = p.percorso[p.percorso.length - 1];
    if (ultimo !== CONCLUSO) iniziale[idx.get(ultimo)!]++;
  }
  return { stati: STATI_MARKOV, P, lambda, tendenza, iniziale, passaggi };
}

let modelloCache: ModelloMarkov | null = null;
export const modelloDemo = () => (modelloCache ??= stimaModello());

/**
 * λ del mese futuro t (t = 1, 2, 3): media recente proiettata con la tendenza osservata.
 * La media degli ultimi `mesiLambda` mesi è centrata a (mesiLambda − 1)/2 mesi fa.
 */
export function lambdaMese(m: ModelloMarkov, t: number, mesiLambda = 3): number {
  return Math.max(0, m.lambda + m.tendenza * (t + (mesiLambda - 1) / 2));
}

/** Occupazione media prevista per stato, per i mesi 0…mesi (calcolo esatto delle medie). */
export function prevedi(mesi: number, m: ModelloMarkov = modelloDemo()): number[][] {
  const out: number[][] = [m.iniziale.slice()];
  for (let t = 1; t <= mesi; t++) {
    const prima = out[t - 1];
    const dopo = m.stati.map((_, j) => prima.reduce((acc, x, i) => acc + x * m.P[i][j], 0));
    dopo[0] += lambdaMese(m, t);
    out.push(dopo);
  }
  return out;
}

/**
 * Simulazione Monte Carlo con seed fisso: occ[run][mese][stato].
 * Ogni paziente si muove con la sua riga della matrice; i nuovi ingressi sono Poisson(λ).
 */
export interface Simulazione {
  /** occupazione[run][mese][stato]: pazienti nello stato durante il mese. */
  occupazione: Uint16Array[][];
  /** ingressi[run][mese][stato]: nuove prese in carico nel mese (arrivi da un altro stato o nuovi ingressi). */
  ingressi: Uint16Array[][];
}

export function simula(mesi: number, N: number, seed: number = SEED_DEMO, m: ModelloMarkov = modelloDemo()): Simulazione {
  const rng = creaRng(seed);
  const occupazione: Uint16Array[][] = [];
  const ingressi: Uint16Array[][] = [];
  const iConcluso = m.stati.indexOf(CONCLUSO);
  for (let r = 0; r < N; r++) {
    const occ: Uint16Array[] = [Uint16Array.from(m.iniziale)];
    const ing: Uint16Array[] = [new Uint16Array(m.stati.length)];
    let corrente = Uint16Array.from(m.iniziale);
    for (let t = 1; t <= mesi; t++) {
      const nuovo = new Uint16Array(m.stati.length);
      const arrivi = new Uint16Array(m.stati.length);
      for (let i = 0; i < corrente.length; i++) {
        if (i === iConcluso) continue;
        for (let k = 0; k < corrente[i]; k++) {
          const j = categorica(rng, m.P[i]);
          nuovo[j]++;
          if (j !== i) arrivi[j]++;
        }
      }
      const entrate = poisson(rng, lambdaMese(m, t));
      nuovo[0] += entrate;
      arrivi[0] += entrate;
      occ.push(nuovo);
      ing.push(arrivi);
      corrente = nuovo;
    }
    occupazione.push(occ);
    ingressi.push(ing);
  }
  return { occupazione, ingressi };
}

export const N_SIMULAZIONI = 5000;
export const MESI_PREVISIONE = 3;
let simCache: Simulazione | null = null;
const simDemo = () => (simCache ??= simula(MESI_PREVISIONE, N_SIMULAZIONI));

/** Stato della catena per una struttura del percorso. */
export const statoPerStruttura = (struttura: string) => (struttura === "padova" ? HUB : statoSpoke(struttura));

/** Posti dichiarati nel mese a partire dai posti a settimana. */
export const postiMese = (postiSettimana: number) => postiSettimana * SETTIMANE_MESE;
export const POSTI_MESE_HUB = postiMese(POSTI_SETTIMANA_HUB);

/**
 * P(pazienti da prendere in carico nel mese > posti dichiarati nel mese), con N simulazioni.
 * Con N = 5000 e mesi ≤ 3 usa la simulazione della demo già calcolata (stesso seed).
 */
export function probSuperamento(struttura: string, soglia: number, mesi: number, N = N_SIMULAZIONI, seed = SEED_DEMO): number {
  const j = STATI_MARKOV.indexOf(statoPerStruttura(struttura));
  if (j < 0 || mesi <= 0) return 0;
  const sim = N === N_SIMULAZIONI && seed === SEED_DEMO && mesi <= MESI_PREVISIONE ? simDemo() : simula(mesi, N, seed);
  let sopra = 0;
  for (const traiettoria of sim.ingressi) if (traiettoria[mesi][j] > soglia) sopra++;
  return sopra / sim.ingressi.length;
}

/** Nuove prese in carico medie previste per una struttura al mese indicato (calcolo esatto). */
export function ingressiMedi(struttura: string, mesi: number, m: ModelloMarkov = modelloDemo()): number {
  const j = m.stati.indexOf(statoPerStruttura(struttura));
  if (j < 0 || mesi <= 0) return 0;
  const prima = prevedi(mesi - 1, m)[mesi - 1];
  let arrivi = prima.reduce((acc, x, i) => (i === j ? acc : acc + x * m.P[i][j]), 0);
  if (j === 0) arrivi += lambdaMese(m, mesi);
  return arrivi;
}

/** Occupazione media prevista di una struttura al mese indicato. */
export function occupazioneMedia(struttura: string, mesi: number): number {
  const j = STATI_MARKOV.indexOf(statoPerStruttura(struttura));
  return j < 0 ? 0 : prevedi(mesi)[mesi][j];
}

export type LivelloSaturazione = "verde" | "arancione" | "rosso";
/** Soglie del colore sulla mappa (illustrative). */
export const SOGLIE_COLORE = { arancione: 0.25, rosso: 0.6 };
export function livelloSaturazione(p: number): LivelloSaturazione {
  return p >= SOGLIE_COLORE.rosso ? "rosso" : p >= SOGLIE_COLORE.arancione ? "arancione" : "verde";
}
