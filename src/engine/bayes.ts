// Rete bayesiana: rischio di rientro all'hub se la fase è delegata allo spoke.
// Inferenza esatta per enumerazione (la rete è piccola: 5184 combinazioni).
import datiCpt from "../data/bn_cpt.json";

export type Evidenza = Partial<Record<string, string>>;

export interface Nodo {
  id: string;
  nome: string;
  /** Stati dal più favorevole al meno favorevole per il rischio. */
  stati: string[];
  genitori: string[];
}

export interface Rete {
  nodi: Nodo[];
  /** cpt[nodo][chiave dei genitori "a|b|c"] = distribuzione sugli stati del nodo. */
  cpt: Record<string, Record<string, number[]>>;
}

export const NODO_RISCHIO = "rientro_hub";

export function reteDaJson(j: typeof datiCpt): Rete {
  return {
    nodi: Object.entries(j.nodi).map(([id, n]) => ({ id, nome: n.nome, stati: n.stati, genitori: n.genitori })),
    cpt: j.cpt as Rete["cpt"],
  };
}

/** Rete con le CPT iniziali illustrative. */
export const RETE_INIZIALE: Rete = reteDaJson(datiCpt);

/** Nodi in ordine topologico (i genitori prima dei figli). */
export function ordineTopologico(rete: Rete): Nodo[] {
  const fatti = new Set<string>();
  const out: Nodo[] = [];
  while (out.length < rete.nodi.length) {
    for (const n of rete.nodi)
      if (!fatti.has(n.id) && n.genitori.every((g) => fatti.has(g))) {
        out.push(n);
        fatti.add(n.id);
      }
  }
  return out;
}

const chiave = (n: Nodo, ass: Record<string, string>) => n.genitori.map((g) => ass[g]).join("|");

export function probCondizionata(rete: Rete, n: Nodo, stato: string, ass: Record<string, string>): number {
  const riga = rete.cpt[n.id][chiave(n, ass)];
  return riga[n.stati.indexOf(stato)];
}

/** Distribuzione a posteriori di un nodo data l'evidenza, per enumerazione completa. */
export function posteriori(rete: Rete, query: string, evidenza: Evidenza): Record<string, number> {
  const ordine = ordineTopologico(rete);
  const nq = rete.nodi.find((n) => n.id === query)!;
  const somme: Record<string, number> = Object.fromEntries(nq.stati.map((s) => [s, 0]));
  const ass: Record<string, string> = {};
  const visita = (i: number, p: number) => {
    if (p === 0) return;
    if (i === ordine.length) {
      somme[ass[query]] += p;
      return;
    }
    const n = ordine[i];
    const fissato = evidenza[n.id];
    const stati = fissato !== undefined ? [fissato] : n.stati;
    for (const s of stati) {
      ass[n.id] = s;
      visita(i + 1, p * probCondizionata(rete, n, s, ass));
    }
    delete ass[n.id];
  };
  visita(0, 1);
  const tot = Object.values(somme).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(somme).map(([k, v]) => [k, v / tot]));
}

/** P(rientro all'hub = sì | evidenza). */
export function pRientro(evidenza: Evidenza, rete: Rete = RETE_INIZIALE): number {
  return posteriori(rete, NODO_RISCHIO, evidenza).si;
}

export interface Fattore {
  nodo: string;
  nome: string;
  valore: string;
  /**
   * Effetto in punti percentuali, con la direzione:
   * > 0  il valore osservato alza il rischio rispetto al valore più favorevole (`confronto`);
   * < 0  il valore osservato è già il più favorevole e protegge rispetto al peggiore (`confronto`).
   */
  punti: number;
  confronto: string;
}

/**
 * Spiegazione: per ogni variabile osservata calcola di quanto cambia P(rientro) se la variabile
 * prende il valore più favorevole (o, se lo è già, il meno favorevole). Restituisce i fattori
 * con l'effetto maggiore in valore assoluto. Le variabili senza effetto (es. età quando la
 * complicanza è già nota) restano fuori.
 */
export function spiegaRischio(evidenza: Evidenza, rete: Rete = RETE_INIZIALE, quanti = 3): Fattore[] {
  const base = pRientro(evidenza, rete);
  const fattori: Fattore[] = [];
  for (const [id, valore] of Object.entries(evidenza)) {
    if (valore === undefined || id === NODO_RISCHIO) continue;
    const n = rete.nodi.find((x) => x.id === id)!;
    const p = n.stati.map((s) => pRientro({ ...evidenza, [id]: s }, rete));
    const iMin = p.indexOf(Math.min(...p));
    const iMax = p.indexOf(Math.max(...p));
    const iCur = n.stati.indexOf(valore);
    const punti = iCur !== iMin ? (base - p[iMin]) * 100 : (base - p[iMax]) * 100;
    const confronto = iCur !== iMin ? n.stati[iMin] : n.stati[iMax];
    if (Math.abs(punti) >= 0.05) fattori.push({ nodo: id, nome: n.nome, valore, punti, confronto });
  }
  return fattori.sort((a, b) => Math.abs(b.punti) - Math.abs(a.punti) || a.nodo.localeCompare(b.nodo)).slice(0, quanti);
}

export type Caso = Record<string, string>;

/**
 * Aggiorna le CPT con lo smoothing di Laplace a partire dai casi chiusi (assegnazioni complete).
 * P(x | genitori) = (conteggio + alfa) / (totale + alfa · numero di stati).
 */
export function aggiornaCPT(casi: Caso[], rete: Rete = RETE_INIZIALE, alfa = 1): Rete {
  const cpt: Rete["cpt"] = {};
  for (const n of rete.nodi) {
    cpt[n.id] = {};
    for (const k of Object.keys(rete.cpt[n.id])) {
      const conteggi = n.stati.map(() => 0);
      for (const c of casi) if (chiave(n, c) === k) conteggi[n.stati.indexOf(c[n.id])]++;
      const tot = conteggi.reduce((a, b) => a + b, 0);
      cpt[n.id][k] = conteggi.map((x) => (x + alfa) / (tot + alfa * n.stati.length));
    }
  }
  return { nodi: rete.nodi, cpt };
}

/** Estrazione di un caso completo dalla rete (campionamento ancestrale), con evidenza fissata. */
export function campiona(rete: Rete, rng: () => number, fissati: Evidenza = {}): Caso {
  const ass: Caso = {};
  for (const n of ordineTopologico(rete)) {
    const f = fissati[n.id];
    if (f !== undefined) {
      ass[n.id] = f;
      continue;
    }
    const riga = rete.cpt[n.id][chiave(n, ass)];
    const u = rng();
    let c = 0;
    let scelto = n.stati[n.stati.length - 1];
    for (let i = 0; i < riga.length; i++) {
      c += riga[i];
      if (u < c) {
        scelto = n.stati[i];
        break;
      }
    }
    ass[n.id] = scelto;
  }
  return ass;
}

/** Categoria di distanza dai km di sola andata (soglie illustrative). */
export function categoriaDistanza(km: number): "vicino" | "medio" | "lontano" {
  return km < 15 ? "vicino" : km <= 40 ? "medio" : "lontano";
}

/** Etichetta in parole del rischio. */
export function livelloRischio(p: number): "basso" | "medio" | "alto" {
  return p < 0.15 ? "basso" : p < 0.3 ? "medio" : "alto";
}
