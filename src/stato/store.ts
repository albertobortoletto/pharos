// Store unico della demo: tutte le viste leggono e scrivono qui.
// Un'azione in una vista (es. lo spoke accetta) si vede subito nelle altre.
import { PARAMETRI } from "../data/pdta";
import { STRUTTURE } from "../data/strutture";
import { ITINERARIO } from "../data/itinerario";
import { SEDUTE_RIABILITAZIONE } from "../data/tratte";
import { INFERMIERA } from "../data/persone";
import { PARERI_FITTIZI, SCHEDE_FITTIZIE } from "../data/schede";
import { PESI_PREDEFINITI, type Pesi } from "../data/pesi";
import type { VoceRegistro } from "../data/tipi";
import { dataDaOra, oraDaData, ORA_INIZIO } from "../engine/orologio";
import { dataLunga } from "../engine/date";
import { eventiDaTimer, nuovaScheda, transizione, STATI_PRESA_IN_CARICO, type EventoScheda, type Scheda, type StatoScheda } from "../engine/scheda";
import { scadenzaParere, type Parere, type RispostaParere } from "../engine/pareri";
import { SCENE, type AzioneRacconto, type EsitoRichiamo, type StatoRacconto } from "./racconto";

export type Vista = "mappa" | "hub" | "spoke" | "paziente" | "ai" | "racconto";

export const ID_SCHEDA_GIOVANNI = "g-riab";

export interface Notifica {
  id: string;
  ora: number;
  canale: "app" | "sms";
  testo: string;
  letta: boolean;
  oraLettura: number | null;
  /** Il case manager ha già telefonato per questa notifica. */
  chiamata: boolean;
}

export interface Segnalazione {
  id: string;
  ora: number;
  motivo: string;
  richiamatemi: boolean;
  gestita: boolean;
}

export interface LivelliMappa {
  ospedaliera: boolean;
  ictus: boolean;
  onco: boolean;
  giovanni: boolean;
  previsione: boolean;
}

export interface StatoMappa {
  passo: number;
  livelli: LivelliMappa;
  mesi: number;
  zoom: boolean;
  nodo: string | null;
  spiegazione: boolean;
  lampeggio: number;
}

export interface Stato {
  versione: 3;
  vista: Vista;
  /** Ora di demo: ore dalla mezzanotte del 20/11. */
  ora: number;
  racconto: { scena: number; visitate: number[]; confermate: string[] };
  giovanni: {
    sede: "schiavonia" | "padova";
    sedeConfermata: boolean;
    restaHubMotivo: string | null;
    invioInCorso: boolean;
    seconda: string | null;
    condizioniRientro: string[];
  };
  schede: Scheda[];
  sedute: Record<string, number>;
  /** Esito del controllo obbligatorio alla seduta del PDTA: «c'è miglioramento?». */
  controlli: Record<string, "si" | "no">;
  posti: Record<string, { dichiarati: number; occupati: number }>;
  richiamo: EsitoRichiamo | null;
  luigi: StatoRacconto["luigi"];
  registroDemo: VoceRegistro[];
  notifiche: Notifica[];
  segnalazioni: Segnalazione[];
  pareri: Parere[];
  pesi: Pesi;
  mappa: StatoMappa;
  pazienteSelezionato: string;
}

export const MAPPA_INIZIALE: StatoMappa = {
  passo: 1,
  livelli: { ospedaliera: true, ictus: false, onco: false, giovanni: false, previsione: false },
  mesi: 0,
  zoom: false,
  nodo: null,
  spiegazione: false,
  lampeggio: 0,
};

export const CONDIZIONI_RIENTRO_PREDEFINITE = ["febbre", "difficolta_urinare", "non_miglioramento"];

export function statoIniziale(): Stato {
  const ora = ORA_INIZIO;
  const schedeFittizie: Scheda[] = SCHEDE_FITTIZIE.map((x) => ({
    ...nuovaScheda(x.id, x.paziente, x.prestazione, x.struttura, x.dal),
    stato: x.stato as StatoScheda,
    scadenza: x.scadenza,
  }));
  const posti: Stato["posti"] = {};
  for (const s of STRUTTURE)
    if (s.tipo === "spoke") posti[s.id] = { dichiarati: s.posti_settimana ?? 0, occupati: (s.posti_settimana ?? 0) - (s.posti_liberi ?? 0) };
  const sedute: Record<string, number> = { [ID_SCHEDA_GIOVANNI]: 0 };
  for (const x of SCHEDE_FITTIZIE) sedute[x.id] = x.sedute;
  return {
    versione: 3,
    vista: "mappa",
    ora,
    racconto: { scena: 0, visitate: [0], confermate: [] },
    giovanni: {
      sede: "schiavonia",
      sedeConfermata: false,
      restaHubMotivo: null,
      invioInCorso: false,
      seconda: null,
      condizioniRientro: CONDIZIONI_RIENTRO_PREDEFINITE,
    },
    schede: [nuovaScheda(ID_SCHEDA_GIOVANNI, "giovanni", "riabilitazione_pavimento_pelvico", "schiavonia", ora), ...schedeFittizie],
    sedute,
    controlli: Object.fromEntries(SCHEDE_FITTIZIE.filter((x) => x.sedute >= PARAMETRI.seduta_controllo).map((x) => [x.id, "si"])),
    posti,
    richiamo: null,
    luigi: { esito: null, motivo: null },
    registroDemo: [],
    notifiche: [],
    segnalazioni: [],
    pareri: PARERI_FITTIZI.map((p) => ({
      ...p,
      scadenza: scadenzaParere(p.ora, p.urgente, PARAMETRI),
      risposta: null,
      oraRisposta: null,
      escalation: false,
    })),
    pesi: PESI_PREDEFINITI,
    mappa: MAPPA_INIZIALE,
    pazienteSelezionato: "giovanni",
  };
}

// ——— Azioni ———

export type Azione =
  | AzioneRacconto
  | { t: "vista"; vista: Vista; paziente?: string }
  | { t: "tempo"; ore: number }
  | { t: "proponi_giovanni"; struttura: string; seconda: string | null }
  | { t: "posti_dichiarati"; struttura: string; n: number }
  | { t: "posti_ripristina"; struttura: string }
  | { t: "spoke_accetta"; scheda: string }
  | { t: "spoke_rifiuta"; scheda: string; motivo: string }
  | { t: "registra_seduta"; scheda: string }
  | { t: "controllo_miglioramento"; scheda: string; esito: "si" | "no" }
  | { t: "chiedi_parere"; scheda: string; quesito: string; testo: string; urgente: boolean }
  | { t: "rispondi_parere"; id: string; risposta: RispostaParere }
  | { t: "invia_esito"; scheda: string }
  | { t: "chiudi_scheda"; scheda: string }
  | { t: "rientro"; scheda: string; motivo: string }
  | { t: "invia_seconda" }
  | { t: "notifica_letta"; id: string }
  | { t: "chiamata_fatta"; id: string }
  | { t: "segnala_problema"; motivo: string; richiamatemi: boolean }
  | { t: "segnalazione_gestita"; id: string }
  | { t: "pesi"; pesi: Pesi }
  | { t: "condizioni_rientro"; lista: string[] }
  | { t: "mappa"; patch: Partial<StatoMappa> }
  | { t: "mappa_reset" }
  | { t: "reset_tutto" };

// ——— Utilità interne ———

const OGGI = () => dataDaOra(ORA_INIZIO);
const senza = (voci: VoceRegistro[], tipo: VoceRegistro["tipo"], fase: string) => voci.filter((v) => !(v.demo && v.tipo === tipo && v.fase === fase));

export const schedaDi = (st: Stato, id: string) => st.schede.find((s) => s.id === id)!;
export const schedaGiovanni = (st: Stato) => schedaDi(st, ID_SCHEDA_GIOVANNI);

function aggiornaScheda(st: Stato, id: string, e: EventoScheda, extra?: { oraPrenotata?: number }): Stato {
  return { ...st, schede: st.schede.map((s) => (s.id === id ? transizione(s, e, st.ora, PARAMETRI, extra) : s)) };
}

let contatore = 0;
const nuovoId = (p: string) => `${p}-${Date.now().toString(36)}-${(contatore++).toString(36)}`;

function notifica(st: Stato, testo: string, canale: Notifica["canale"] = "app"): Stato {
  const n: Notifica = { id: nuovoId("n"), ora: st.ora, canale, testo, letta: false, oraLettura: null, chiamata: false };
  return { ...st, notifiche: [n, ...st.notifiche] };
}

const nomeStruttura = (id: string) => STRUTTURE.find((s) => s.id === id)?.nome ?? id;

/** Prima seduta prenotata nelle agende dedicate al PDTA (dati dell'itinerario). */
const PRIMA_SEDUTA = ITINERARIO.sedute[0];

function proponi(st: Stato, struttura: string, seconda: string | null): Stato {
  let r: Stato = {
    ...st,
    giovanni: { ...st.giovanni, sede: "schiavonia", sedeConfermata: true, restaHubMotivo: null, seconda },
  };
  r = aggiornaScheda(r, ID_SCHEDA_GIOVANNI, { tipo: "proponi", struttura });
  if (r !== st && schedaGiovanni(r).stato === "INVIATA" && schedaGiovanni(st).stato !== "INVIATA")
    r = notifica(
      r,
      `La riabilitazione di Giovanni è stata proposta all'ospedale di ${nomeStruttura(struttura)}, più vicino a casa. Aspettiamo che lo spoke la prenda in carico: fino ad allora vi segue l'hub di Padova.`,
    );
  return r;
}

function accetta(st: Stato, id: string): Stato {
  const s = schedaDi(st, id);
  if (s.stato !== "INVIATA") return st;
  const p = st.posti[s.struttura];
  if (p && p.dichiarati - p.occupati <= 0) return st;
  let r = aggiornaScheda(st, id, { tipo: "accetta" });
  // Prenotazione nelle agende dedicate al PDTA, con lo stesso clic di chi prende in carico.
  const data = id === ID_SCHEDA_GIOVANNI ? PRIMA_SEDUTA : dataDaOra(st.ora + 24 * 4);
  r = aggiornaScheda(r, id, { tipo: "prenota", data }, { oraPrenotata: oraDaData(data, 9.5) });
  if (p) r = { ...r, posti: { ...r.posti, [s.struttura]: { ...p, occupati: p.occupati + 1 } } };
  if (id === ID_SCHEDA_GIOVANNI) {
    r = { ...r, giovanni: { ...r.giovanni, invioInCorso: false } };
    const luogo = s.struttura === "schiavonia" ? "all'Ospedale di Schiavonia, piano terra" : `a ${nomeStruttura(s.struttura)}`;
    r = notifica(
      r,
      `Ora segue Giovanni lo spoke di ${nomeStruttura(s.struttura)}. Prima seduta di riabilitazione ${dataLunga(data)} ore ${ITINERARIO.ora_sedute} ${luogo}. Per qualsiasi problema: ${INFERMIERA.nome}, ${INFERMIERA.telefono}.`,
    );
    r = notifica(
      r,
      `Giovanni ha la 1ª seduta di riabilitazione ${dataLunga(data)} ore ${ITINERARIO.ora_sedute} ${luogo}. Dubbi o disdette: ${INFERMIERA.nome}, ${INFERMIERA.telefono} (lun–ven 8–16).`,
      "sms",
    );
  }
  return r;
}

function rifiuta(st: Stato, id: string, motivo: string): Stato {
  const s = schedaDi(st, id);
  let r = aggiornaScheda(st, id, { tipo: "rifiuta", motivo });
  if (r === st) return st;
  const voce: VoceRegistro = { data: OGGI(), chi: "Spoke", tipo: "spoke_non_puo", motivo, fase: "Riabilitazione", sede: nomeStruttura(s.struttura), demo: true, nuova: true };
  if (id === ID_SCHEDA_GIOVANNI) {
    r = { ...r, giovanni: { ...r.giovanni, invioInCorso: false }, registroDemo: [voce, ...senza(r.registroDemo, "spoke_non_puo", "Riabilitazione")] };
    r = notifica(r, `Lo spoke di ${nomeStruttura(s.struttura)} non può accogliere Giovanni. Giovanni resta seguito dall'hub di Padova: ${INFERMIERA.nome} vi chiamerà per la nuova sede.`);
  }
  return r;
}

/** Riporta la scheda di Giovanni in bozza (annulla la scelta, demo). */
function annullaSede(st: Stato): Stato {
  const s = schedaGiovanni(st);
  let posti = st.posti;
  if (STATI_PRESA_IN_CARICO.includes(s.stato) && posti[s.struttura])
    posti = { ...posti, [s.struttura]: { ...posti[s.struttura], occupati: Math.max(0, posti[s.struttura].occupati - 1) } };
  return {
    ...st,
    posti,
    giovanni: { ...st.giovanni, sede: "schiavonia", sedeConfermata: false, restaHubMotivo: null, invioInCorso: false, seconda: null },
    schede: st.schede.map((x) => (x.id === ID_SCHEDA_GIOVANNI ? nuovaScheda(x.id, x.paziente, x.prestazione, "schiavonia", st.ora) : x)),
    sedute: { ...st.sedute, [ID_SCHEDA_GIOVANNI]: 0 },
    controlli: Object.fromEntries(Object.entries(st.controlli).filter(([k]) => k !== ID_SCHEDA_GIOVANNI)),
    pareri: st.pareri.filter((p) => p.scheda !== ID_SCHEDA_GIOVANNI),
    registroDemo: senza(senza(st.registroDemo, "resta_hub", "Riabilitazione"), "spoke_non_puo", "Riabilitazione"),
  };
}

function avanzaTempo(st: Stato, ore: number): Stato {
  let r: Stato = { ...st, ora: st.ora + ore };
  for (const s of r.schede) for (const e of eventiDaTimer(s, r.ora)) r = aggiornaScheda(r, s.id, e);
  r = { ...r, pareri: r.pareri.map((p) => (p.risposta === null && r.ora >= p.scadenza && !p.escalation ? { ...p, escalation: true } : p)) };
  return r;
}

// ——— Reducer ———

export function reducer(st: Stato, a: Azione): Stato {
  switch (a.t) {
    // — azioni delle 6 scene (modalità racconto) —
    case "vai": {
      const scena = Math.max(0, Math.min(SCENE.length - 1, a.scena));
      let r: Stato = { ...st, racconto: { ...st.racconto, scena, visitate: Array.from(new Set([...st.racconto.visitate, scena])) } };
      if (scena >= 1 && r.racconto.confermate.length < a.righeValide.length) r = { ...r, racconto: { ...r.racconto, confermate: a.righeValide } };
      if (scena >= 2 && !r.giovanni.sedeConfermata) r = proponi(r, "schiavonia", null);
      return r;
    }
    case "conferma_riga": {
      const c = st.racconto.confermate;
      return { ...st, racconto: { ...st.racconto, confermate: c.includes(a.id) ? c.filter((x) => x !== a.id) : [...c, a.id] } };
    }
    case "conferma_tutte":
      return { ...st, racconto: { ...st.racconto, confermate: a.ids } };
    case "scegli_sede":
      return { ...st, giovanni: { ...st.giovanni, sede: a.sede } };
    case "conferma_sede":
      return proponi(st, "schiavonia", st.giovanni.seconda);
    case "proponi_giovanni":
      return proponi(st, a.struttura, a.seconda);
    case "resta_hub": {
      let r: Stato = {
        ...st,
        giovanni: { ...st.giovanni, sede: "padova", sedeConfermata: true, restaHubMotivo: a.motivo },
        registroDemo: [
          { data: OGGI(), chi: "Hub", tipo: "resta_hub", motivo: a.motivo, fase: "Riabilitazione", sede: "Schiavonia", demo: true, nuova: true },
          ...senza(st.registroDemo, "resta_hub", "Riabilitazione"),
        ],
      };
      r = aggiornaScheda(r, ID_SCHEDA_GIOVANNI, { tipo: "annulla", motivo: a.motivo });
      return notifica(r, "La riabilitazione di Giovanni resta all'ospedale di Padova. Per qualsiasi problema il riferimento è l'infermiera di percorso.");
    }
    case "annulla_sede":
      return annullaSede(st);
    case "invio_passaggio":
      return { ...st, giovanni: { ...st.giovanni, invioInCorso: true } };
    case "accetta": {
      if (!st.giovanni.invioInCorso) return st;
      const r = accetta(st, ID_SCHEDA_GIOVANNI);
      return r === st ? { ...st, giovanni: { ...st.giovanni, invioInCorso: false } } : r;
    }
    case "rifiuta":
      return rifiuta(st, ID_SCHEDA_GIOVANNI, a.motivo);
    case "annulla_rifiuto":
      return {
        ...aggiornaScheda(st, ID_SCHEDA_GIOVANNI, { tipo: "ripristina", stato: "INVIATA" }),
        registroDemo: senza(st.registroDemo, "spoke_non_puo", "Riabilitazione"),
      };
    case "richiamo":
      return { ...st, richiamo: a.esito };
    case "annulla_richiamo":
      return { ...st, richiamo: null };
    case "luigi_spoke":
      return { ...st, luigi: { esito: "spoke", motivo: null }, registroDemo: senza(st.registroDemo, "serve_hub", "Follow-up oncologico") };
    case "luigi_serve_hub":
      return {
        ...st,
        luigi: { esito: "serve_hub", motivo: a.motivo },
        registroDemo: [
          { data: OGGI(), chi: "Hub", tipo: "serve_hub", motivo: a.motivo, fase: "Follow-up oncologico", sede: "Schiavonia", demo: true, nuova: true },
          ...senza(st.registroDemo, "serve_hub", "Follow-up oncologico"),
        ],
      };
    case "annulla_luigi":
      return { ...st, luigi: { esito: null, motivo: null }, registroDemo: senza(st.registroDemo, "serve_hub", "Follow-up oncologico") };
    case "reset":
      return statoIniziale();

    // — viste per ruolo —
    case "vista":
      return { ...st, vista: a.vista, pazienteSelezionato: a.paziente ?? st.pazienteSelezionato };
    case "tempo":
      return avanzaTempo(st, a.ore);
    case "posti_dichiarati": {
      const p = st.posti[a.struttura];
      return p ? { ...st, posti: { ...st.posti, [a.struttura]: { ...p, dichiarati: Math.max(0, Math.min(30, Math.round(a.n))) } } } : st;
    }
    case "posti_ripristina": {
      const p = st.posti[a.struttura];
      const orig = STRUTTURE.find((x) => x.id === a.struttura)?.posti_settimana;
      return p && orig !== undefined ? { ...st, posti: { ...st.posti, [a.struttura]: { ...p, dichiarati: orig } } } : st;
    }
    case "spoke_accetta":
      return accetta(st, a.scheda);
    case "spoke_rifiuta":
      return rifiuta(st, a.scheda, a.motivo);
    case "registra_seduta": {
      const s = schedaDi(st, a.scheda);
      let r = st;
      if (s.stato === "PRENOTATA") r = aggiornaScheda(r, a.scheda, { tipo: "iniziaSedute" });
      if (schedaDi(r, a.scheda).stato !== "IN_CORSO") return st;
      if (!puoRegistrareSeduta(r, a.scheda)) return st;
      const n = Math.min(SEDUTE_RIABILITAZIONE, (r.sedute[a.scheda] ?? 0) + 1);
      r = { ...r, sedute: { ...r.sedute, [a.scheda]: n } };
      if (n >= SEDUTE_RIABILITAZIONE) r = aggiornaScheda(r, a.scheda, { tipo: "fineSedute" });
      return r;
    }
    case "controllo_miglioramento": {
      if (schedaDi(st, a.scheda).stato !== "IN_CORSO" || st.controlli[a.scheda]) return st;
      let r: Stato = { ...st, controlli: { ...st.controlli, [a.scheda]: a.esito } };
      if (a.esito === "no") r = aggiornaScheda(r, a.scheda, { tipo: "segnalaNonMiglioramento" });
      return r;
    }
    case "chiedi_parere": {
      const s = schedaDi(st, a.scheda);
      const p: Parere = {
        id: nuovoId("p"),
        scheda: a.scheda,
        paziente: s.paziente,
        struttura: s.struttura,
        quesito: a.quesito,
        testo: a.testo.slice(0, PARAMETRI.quesito_max_caratteri),
        urgente: a.urgente,
        ora: st.ora,
        scadenza: scadenzaParere(st.ora, a.urgente, PARAMETRI),
        risposta: null,
        oraRisposta: null,
        escalation: false,
      };
      let r: Stato = { ...st, pareri: [p, ...st.pareri] };
      if (a.scheda === ID_SCHEDA_GIOVANNI)
        r = notifica(r, "La fisiatra di Schiavonia ha chiesto un parere all'urologo dell'hub. Non dovete fare nulla: vi avvisiamo noi della risposta.");
      return r;
    }
    case "rispondi_parere": {
      const p = st.pareri.find((x) => x.id === a.id);
      if (!p || p.risposta) return st;
      let r: Stato = { ...st, pareri: st.pareri.map((x) => (x.id === a.id ? { ...x, risposta: a.risposta, oraRisposta: st.ora } : x)) };
      if (a.risposta.tipo === "serve_hub") {
        r = aggiornaScheda(r, p.scheda, { tipo: "rientro", motivo: a.risposta.motivo });
        if (p.scheda === ID_SCHEDA_GIOVANNI)
          r = notifica(r, `L'urologo vuole rivedere Giovanni a Padova: ${dataLunga(a.risposta.dataSlot)}, posto riservato ai rientri. ${INFERMIERA.nome} vi chiamerà per i dettagli.`);
      } else {
        // L'hub dice di continuare: le sedute riprendono.
        if (r.controlli[p.scheda] === "no") r = { ...r, controlli: { ...r.controlli, [p.scheda]: "si" } };
        if (p.scheda === ID_SCHEDA_GIOVANNI) r = notifica(r, "L'urologo ha risposto alla fisiatra: Giovanni continua la riabilitazione a Schiavonia.");
      }
      return r;
    }
    case "invia_esito": {
      let r = aggiornaScheda(st, a.scheda, { tipo: "inviaEsito" });
      if (r !== st && a.scheda === ID_SCHEDA_GIOVANNI) r = notifica(r, "La riabilitazione a Schiavonia è conclusa. L'esito è arrivato all'urologo di Padova, che vi aspetta al controllo.");
      return r;
    }
    case "chiudi_scheda":
      return aggiornaScheda(st, a.scheda, { tipo: "chiudi" });
    case "rientro":
      return aggiornaScheda(st, a.scheda, { tipo: "rientro", motivo: a.motivo });
    case "invia_seconda": {
      const s2 = st.giovanni.seconda;
      if (!s2 || schedaGiovanni(st).stato !== "RIFIUTATA") return st;
      return proponi({ ...st, giovanni: { ...st.giovanni, seconda: null } }, s2, null);
    }
    case "notifica_letta":
      return { ...st, notifiche: st.notifiche.map((n) => (n.id === a.id ? { ...n, letta: true, oraLettura: st.ora } : n)) };
    case "chiamata_fatta":
      return { ...st, notifiche: st.notifiche.map((n) => (n.id === a.id ? { ...n, chiamata: true } : n)) };
    case "segnala_problema":
      return { ...st, segnalazioni: [{ id: nuovoId("seg"), ora: st.ora, motivo: a.motivo, richiamatemi: a.richiamatemi, gestita: false }, ...st.segnalazioni] };
    case "segnalazione_gestita":
      return { ...st, segnalazioni: st.segnalazioni.map((x) => (x.id === a.id ? { ...x, gestita: true } : x)) };
    case "pesi":
      return { ...st, pesi: a.pesi };
    case "condizioni_rientro":
      return { ...st, giovanni: { ...st.giovanni, condizioniRientro: a.lista } };
    case "mappa":
      return { ...st, mappa: { ...st.mappa, ...a.patch } };
    case "mappa_reset":
      return { ...st, mappa: MAPPA_INIZIALE };
    case "reset_tutto":
      return statoIniziale();
  }
}

// ——— Selettori ———

/** Alla seduta del controllo serve la risposta «c'è miglioramento?»; se è «no», serve prima il parere dell'hub. */
export function puoRegistrareSeduta(st: Stato, scheda: string): boolean {
  const n = st.sedute[scheda] ?? 0;
  if (n >= SEDUTE_RIABILITAZIONE) return false;
  if (n >= PARAMETRI.seduta_controllo && st.controlli[scheda] !== "si") return false;
  return true;
}

/** Serve ora il controllo «c'è miglioramento?» per questa scheda. */
export const serveControllo = (st: Stato, scheda: string) =>
  schedaDi(st, scheda).stato === "IN_CORSO" && (st.sedute[scheda] ?? 0) >= PARAMETRI.seduta_controllo && !st.controlli[scheda];

/** Posti liberi questa settimana per struttura (dichiarati − presi in carico). */
export function postiLiberi(st: Stato, struttura: string): number {
  const p = st.posti[struttura];
  return p ? Math.max(0, p.dichiarati - p.occupati) : 0;
}

/** Vista dello stato con la forma usata dalle 6 scene originali. */
export function vistaRacconto(st: Stato): StatoRacconto {
  const g = schedaGiovanni(st);
  const passaggio: StatoRacconto["passaggio"] = st.giovanni.invioInCorso
    ? "invio"
    : STATI_PRESA_IN_CARICO.includes(g.stato)
      ? "accettato"
      : g.stato === "RIFIUTATA"
        ? "rifiutato"
        : "in_attesa";
  return {
    scena: st.racconto.scena,
    visitate: st.racconto.visitate,
    confermate: st.racconto.confermate,
    sede: st.giovanni.sede,
    sedeConfermata: st.giovanni.sedeConfermata,
    restaHubMotivo: st.giovanni.restaHubMotivo,
    passaggio,
    rifiutoMotivo: g.stato === "RIFIUTATA" ? g.motivo : null,
    postiLiberi: postiLiberi(st, "schiavonia"),
    richiamo: st.richiamo,
    luigi: st.luigi,
    registroDemo: st.registroDemo,
  };
}

/** Notifiche dell'app non confermate da più di 24 ore: il case manager telefona. */
export function daChiamare(st: Stato): Notifica[] {
  return st.notifiche.filter((n) => n.canale === "app" && !n.letta && !n.chiamata && st.ora - n.ora >= PARAMETRI.conferma_paziente_ore);
}
