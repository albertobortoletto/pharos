// Abbinamento paziente → struttura per una fase delegabile.
// 1) filtro rigido (requisito del PDTA e posti liberi), 2) punteggio scomposto, 3) spiegazione.
// Non esclude in modo nascosto: ogni esclusione ha un motivo.
import { COMUNI, kmStrada } from "../data/comuni";
import { NODI } from "../data/rete/nodi";
import { PARAMETRI, prestazione as trovaPrestazione } from "../data/pdta";
import { KM_VICINANZA_ZERO, type Pesi } from "../data/pesi";
import { STRUTTURE } from "../data/strutture";
import type { Struttura } from "../data/tipi";
import { TRATTE } from "../data/tratte";
import { categoriaDistanza, pRientro, spiegaRischio, type Evidenza, type Fattore } from "./bayes";
import { postiMese, probSuperamento } from "./markov";
import { esperienzaPerStruttura, type EsperienzaStruttura } from "./similar";
import { fraseStruttura } from "./spiegazioni";

export interface VociPunteggio {
  rischio: number;
  esperienza: number;
  vicinanza: number;
  rapidita: number;
}

export interface Candidato {
  struttura: Struttura;
  km: number;
  rischio: number;
  fattori: Fattore[];
  esperienza: EsperienzaStruttura | null;
  postiLiberi: number;
  /** P(superare i posti dichiarati il mese prossimo), dalla catena di Markov. */
  saturazione: number;
  /** Valori grezzi delle voci, 0…1 (1 = meglio). */
  valori: VociPunteggio;
  /** Contributo pesato di ogni voce al punteggio (somma = punteggio). */
  contributi: VociPunteggio;
  punteggio: number;
  frase: string;
}

export interface Esclusa {
  struttura: Struttura;
  motivo: string;
}

export interface Abbinamento {
  ordinate: Candidato[];
  escluse: Esclusa[];
}

export interface ContestoAbbinamento {
  prestazione: string;
  profilo: Evidenza;
  comune: string;
  postiLiberi: (struttura: string) => number;
  postiDichiarati: (struttura: string) => number;
  pesi: Pesi;
  strutture?: Struttura[];
}

/** Km di sola andata: dalle tratte stimate se ci sono, altrimenti linea d'aria × 1,3. */
export function kmDaCasa(comune: string, struttura: string): number {
  const t = TRATTE.find((x) => x.da === comune && x.a === struttura);
  if (t) return t.km_ar / 2;
  const c = COMUNI.find((x) => x.nome === comune);
  const n = NODI.find((x) => x.struttura === struttura);
  return c && n ? Math.round(kmStrada(c, n)) : KM_VICINANZA_ZERO;
}

/** Rischio di rientro se la fase si fa in quella struttura (la distanza cambia con la struttura). */
export function rischioPerStruttura(profilo: Evidenza, comune: string, struttura: string) {
  const ev = { ...profilo, distanza: categoriaDistanza(kmDaCasa(comune, struttura)) };
  return { rischio: pRientro(ev), fattori: spiegaRischio(ev), evidenza: ev };
}

export function vicinanza(km: number): number {
  return Math.max(0, 1 - km / KM_VICINANZA_ZERO);
}

/** Rapidità di accesso: metà attesa dichiarata, metà saturazione prevista (catena di Markov). */
export function rapidita(attesaGiorni: number, saturazione: number): number {
  const a = Math.max(0, 1 - attesaGiorni / PARAMETRI.attesa_max_spoke_giorni);
  return 0.5 * a + 0.5 * (1 - saturazione);
}

export function abbina(ctx: ContestoAbbinamento): Abbinamento {
  const strutture = ctx.strutture ?? STRUTTURE;
  const p = trovaPrestazione(ctx.prestazione);
  const escluse: Esclusa[] = [];
  const ammesse: Struttura[] = [];
  if (p.etichetta === "solo_hub") return { ordinate: [], escluse: [] };
  for (const s of strutture.filter((x) => x.tipo === "spoke")) {
    if (!s.requisiti || !s.servizi.includes(ctx.prestazione)) escluse.push({ struttura: s, motivo: "manca un requisito per questa fase" });
    else if (ctx.postiLiberi(s.id) <= 0) escluse.push({ struttura: s, motivo: "posti esauriti questa settimana" });
    else ammesse.push(s);
  }
  const esperienze = esperienzaPerStruttura(ctx.profilo);
  const maxN = Math.max(1, ...ammesse.map((s) => esperienze.find((e) => e.struttura === s.id)?.n ?? 0));
  const sommaPesi = ctx.pesi.rischio + ctx.pesi.esperienza + ctx.pesi.vicinanza + ctx.pesi.rapidita || 1;

  const ordinate = ammesse
    .map((s): Candidato => {
      const km = kmDaCasa(ctx.comune, s.id);
      const { rischio, fattori } = rischioPerStruttura(ctx.profilo, ctx.comune, s.id);
      const esperienza = esperienze.find((e) => e.struttura === s.id) ?? null;
      const saturazione = probSuperamento(s.id, postiMese(ctx.postiDichiarati(s.id)), 1);
      const valori: VociPunteggio = {
        rischio: 1 - rischio,
        esperienza: (esperienza?.n ?? 0) / maxN,
        vicinanza: vicinanza(km),
        rapidita: rapidita(s.attesa_giorni ?? PARAMETRI.attesa_max_spoke_giorni, saturazione),
      };
      const contributi: VociPunteggio = {
        rischio: (ctx.pesi.rischio * valori.rischio) / sommaPesi,
        esperienza: (ctx.pesi.esperienza * valori.esperienza) / sommaPesi,
        vicinanza: (ctx.pesi.vicinanza * valori.vicinanza) / sommaPesi,
        rapidita: (ctx.pesi.rapidita * valori.rapidita) / sommaPesi,
      };
      const punteggio = contributi.rischio + contributi.esperienza + contributi.vicinanza + contributi.rapidita;
      const postiLiberi = ctx.postiLiberi(s.id);
      return {
        struttura: s,
        km,
        rischio,
        fattori,
        esperienza,
        postiLiberi,
        saturazione,
        valori,
        contributi,
        punteggio,
        frase: fraseStruttura({ nome: s.nome, simili: esperienza?.n ?? 0, km, rischio, postiLiberi }),
      };
    })
    .sort((a, b) => b.punteggio - a.punteggio || a.struttura.id.localeCompare(b.struttura.id));
  return { ordinate, escluse };
}

/**
 * Evoluzione: assegnamento di più pazienti a posti limitati (algoritmo ungherese).
 * costo[i][j] = costo di assegnare il paziente i al posto j. Restituisce per ogni paziente
 * l'indice del posto (o −1 se i pazienti sono più dei posti).
 */
export function ungherese(costo: number[][]): number[] {
  const n = costo.length;
  const m = costo[0]?.length ?? 0;
  const dim = Math.max(n, m);
  const GRANDE = 1e9;
  const a = Array.from({ length: dim + 1 }, (_, i) =>
    Array.from({ length: dim + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : i <= n && j <= m ? costo[i - 1][j - 1] : i <= n ? GRANDE : 0)),
  );
  const u = new Array(dim + 1).fill(0);
  const v = new Array(dim + 1).fill(0);
  const p = new Array(dim + 1).fill(0);
  const way = new Array(dim + 1).fill(0);
  for (let i = 1; i <= dim; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(dim + 1).fill(Infinity);
    const usato = new Array(dim + 1).fill(false);
    do {
      usato[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= dim; j++)
        if (!usato[j]) {
          const cur = a[i0][j] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      for (let j = 0; j <= dim; j++)
        if (usato[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const ris = new Array(n).fill(-1);
  for (let j = 1; j <= dim; j++) if (p[j] >= 1 && p[j] <= n && j <= m) ris[p[j] - 1] = j - 1;
  return ris;
}
