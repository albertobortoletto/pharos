// Dataset sintetico: pazienti FITTIZI con profili campionati dalla rete bayesiana stessa.
// Deterministico: stesso seed, stessi dati.
import { COMUNI, kmStrada } from "../data/comuni";
import { NODI } from "../data/rete/nodi";
import { ENTRATE_MENSILI, GENERATORE, KM_MAX_SPOKE, P_DELEGA, SPOKE_PILOTA } from "../data/sintetico";
import { campiona, categoriaDistanza, RETE_INIZIALE, type Caso } from "./bayes";
import { categorica, creaRng, SEED_DEMO } from "./rng";

export type StatoMarkov = string; // "HUB_padova" | "SPOKE_<id>" | "RIENTRATO" | "CONCLUSO"
export const HUB = "HUB_padova";
export const RIENTRATO = "RIENTRATO";
export const CONCLUSO = "CONCLUSO";
export const statoSpoke = (id: string) => `SPOKE_${id}`;

export interface PazienteSintetico {
  id: string;
  comune: string;
  /** Dove è stata fatta la fase delegabile: uno spoke del pilota oppure l'hub. */
  struttura: string;
  km: number;
  profilo: Caso;
  /** Esito della fase allo spoke: è dovuto tornare all'hub? (null se fatta all'hub) */
  rientro: boolean | null;
  /** Mese di ingresso (negativo nel passato, 0 è il mese corrente). */
  ingresso: number;
  /** Stato mese per mese, dall'ingresso al mese 0 (o fino a CONCLUSO). */
  percorso: StatoMarkov[];
  /** La fase allo spoke è conclusa e l'esito è noto. */
  chiuso: boolean;
}

const coordStruttura = (id: string) => {
  const n = NODI.find((x) => x.struttura === id)!;
  return { lat: n.lat, lng: n.lng };
};

let cache: PazienteSintetico[] | null = null;

export function generaDataset(seed: number = SEED_DEMO): PazienteSintetico[] {
  if (seed === SEED_DEMO && cache) return cache;
  const rng = creaRng(seed);
  const pesi = COMUNI.map((c) => c.peso);
  const totPesi = pesi.reduce((a, b) => a + b, 0);
  const out: PazienteSintetico[] = [];
  let k = 0;
  ENTRATE_MENSILI.forEach((quanti, i) => {
    const ingresso = i - (ENTRATE_MENSILI.length - 1);
    for (let j = 0; j < quanti; j++) {
      const comune = COMUNI[categorica(rng, pesi.map((p) => p / totPesi))];
      // spoke più vicino del pilota
      const distanze = SPOKE_PILOTA.map((s) => ({ s, km: kmStrada(comune, coordStruttura(s)) })).sort((a, b) => a.km - b.km);
      const vicino = distanze[0];
      const kmHub = kmStrada(comune, coordStruttura("padova"));
      // chi abita più vicino all'hub che a qualsiasi spoke resta all'hub
      const delegato = vicino.km < kmHub && vicino.km <= KM_MAX_SPOKE && rng() < P_DELEGA;
      const struttura = delegato ? vicino.s : "padova";
      const km = delegato ? vicino.km : kmHub;
      const profilo = campiona(RETE_INIZIALE, rng, { distanza: categoriaDistanza(km) });
      const rientro = delegato ? profilo.rientro_hub === "si" : null;

      // percorso mensile
      const percorso: StatoMarkov[] = [HUB];
      let stato = HUB;
      let spokeFatto = !delegato;
      for (let m = ingresso + 1; m <= 0 && stato !== CONCLUSO; m++) {
        const u = rng();
        if (stato === HUB) {
          if (!spokeFatto) {
            stato = u < GENERATORE.hubVersoSpoke ? statoSpoke(struttura) : u < GENERATORE.hubVersoSpoke + GENERATORE.hubResta ? HUB : CONCLUSO;
            if (stato !== HUB) spokeFatto = true;
          } else stato = u < GENERATORE.hubSoloResta ? HUB : CONCLUSO;
        } else if (stato.startsWith("SPOKE_")) {
          stato = u < GENERATORE.spokeResta ? stato : rientro ? RIENTRATO : CONCLUSO;
        } else if (stato === RIENTRATO) {
          stato = u < GENERATORE.rientratoVersoHub ? HUB : CONCLUSO;
        }
        percorso.push(stato);
      }
      const passatoDalloSpoke = percorso.some((s) => s.startsWith("SPOKE_"));
      const uscitoDalloSpoke = passatoDalloSpoke && !percorso[percorso.length - 1].startsWith("SPOKE_");
      out.push({
        id: `S${String(++k).padStart(3, "0")}`,
        comune: comune.nome,
        struttura,
        km: Math.round(km),
        profilo,
        rientro,
        ingresso,
        percorso,
        chiuso: delegato && uscitoDalloSpoke,
      });
    }
  });
  if (seed === SEED_DEMO) cache = out;
  return out;
}

/** Casi chiusi (assegnazioni complete della rete) per aggiornare le CPT. */
export function casiChiusi(dataset: PazienteSintetico[] = generaDataset()): Caso[] {
  return dataset.filter((p) => p.chiuso).map((p) => p.profilo);
}
