// Pazienti simili (k vicini più prossimi): quali strutture hanno trattato più casi simili e con che esito.
// Non fa classifiche dei medici. Avvisa quando i dati sono pochi.
import { pRientro, RETE_INIZIALE, type Caso, type Evidenza } from "./bayes";
import { generaDataset, type PazienteSintetico } from "./synth";

/** Variabili del profilo usate per la somiglianza (dalla rete bayesiana). */
export const VARIABILI_PROFILO = ["eta", "comorbidita", "stadio", "tipo_intervento", "complicanza_postop", "stato_funzionale"];
/** Variabili osservabili per calcolare il rischio atteso di un caso (l'aderenza non si osserva prima). */
export const VARIABILI_OSSERVABILI = [...VARIABILI_PROFILO, "distanza", "accompagnatore"];

export const K_VICINI = 50;
export const SOGLIA_POCHI_DATI = 10;

const statiDi = (v: string) => RETE_INIZIALE.nodi.find((n) => n.id === v)!.stati;

/** Distanza di Gower su variabili ordinali codificate in [0, 1]. */
export function distanzaGower(a: Evidenza, b: Evidenza, variabili = VARIABILI_PROFILO): number {
  let somma = 0;
  let usate = 0;
  for (const v of variabili) {
    const x = a[v];
    const y = b[v];
    if (x === undefined || y === undefined) continue;
    const s = statiDi(v);
    somma += Math.abs(s.indexOf(x) - s.indexOf(y)) / (s.length - 1);
    usate++;
  }
  return usate ? somma / usate : 1;
}

export function vicini(profilo: Evidenza, dati: PazienteSintetico[] = generaDataset(), k = K_VICINI): PazienteSintetico[] {
  return dati
    .filter((p) => p.chiuso)
    .map((p) => ({ p, d: distanzaGower(profilo, p.profilo) }))
    .sort((a, b) => a.d - b.d || a.p.id.localeCompare(b.p.id))
    .slice(0, k)
    .map((x) => x.p);
}

const cacheAtteso = new Map<string, number>();
/** Rischio di rientro atteso di un caso, dalla rete con le sue sole variabili osservabili. */
export function rischioAttesoCaso(c: Caso): number {
  const ev: Evidenza = Object.fromEntries(VARIABILI_OSSERVABILI.map((v) => [v, c[v]]));
  const k = VARIABILI_OSSERVABILI.map((v) => c[v]).join("|");
  if (!cacheAtteso.has(k)) cacheAtteso.set(k, pRientro(ev));
  return cacheAtteso.get(k)!;
}

export interface EsperienzaStruttura {
  struttura: string;
  /** Casi simili trattati (tra i k più vicini). */
  n: number;
  rientri: number;
  /** Quota senza rientro, 0…1. */
  senzaRientro: number;
  /** Rientri attesi dato il rischio dei casi trattati: corregge per la gravità. */
  rientriAttesi: number;
  /** Osservati / attesi: < 1 vuol dire meglio dell'atteso per casi di quella gravità. */
  rapportoOE: number | null;
  pochiDati: boolean;
}

/** Esperienza per struttura sui k casi più simili, con correzione per la gravità (osservati/attesi). */
export function esperienzaPerStruttura(profilo: Evidenza, dati: PazienteSintetico[] = generaDataset(), k = K_VICINI): EsperienzaStruttura[] {
  const v = vicini(profilo, dati, k);
  const gruppi = new Map<string, PazienteSintetico[]>();
  for (const p of v) gruppi.set(p.struttura, [...(gruppi.get(p.struttura) ?? []), p]);
  return Array.from(gruppi.entries())
    .map(([struttura, casi]) => {
      const rientri = casi.filter((c) => c.rientro).length;
      const attesi = casi.reduce((a, c) => a + rischioAttesoCaso(c.profilo), 0);
      return {
        struttura,
        n: casi.length,
        rientri,
        senzaRientro: 1 - rientri / casi.length,
        rientriAttesi: attesi,
        rapportoOE: attesi > 0 ? rientri / attesi : null,
        pochiDati: casi.length < SOGLIA_POCHI_DATI,
      };
    })
    .sort((a, b) => b.n - a.n || a.struttura.localeCompare(b.struttura));
}
