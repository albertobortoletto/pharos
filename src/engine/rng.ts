// Generatore pseudo-casuale con seed fisso (mulberry32): stesso seed, stessi numeri.

export type Rng = () => number;

export const SEED_DEMO = 20261120;

export function creaRng(seed: number = SEED_DEMO): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Indice estratto da una distribuzione discreta (le probabilità sommano a 1). */
export function categorica(rng: Rng, p: readonly number[]): number {
  const u = rng();
  let c = 0;
  for (let i = 0; i < p.length; i++) {
    c += p[i];
    if (u < c) return i;
  }
  return p.length - 1;
}

/** Poisson(λ) con il metodo di Knuth (va bene per λ piccoli e medi). */
export function poisson(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}
