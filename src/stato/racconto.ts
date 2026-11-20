// Stato e reducer della demo originale (6 scene), ricostruiti dal file compilato.
import type { VoceRegistro } from "../data/tipi";
import { OGGI_DEMO } from "../data/itinerario";

export const SCENE = [
  { id: "dimissione", breve: "Dimissione", ruolo: "hub" },
  { id: "sede", breve: "Sede", ruolo: "hub" },
  { id: "passaggio", breve: "Presa in carico", ruolo: "spoke" },
  { id: "itinerario", breve: "Monitoraggio", ruolo: "percorso" },
  { id: "foglio", breve: "Promemoria", ruolo: "paziente" },
  { id: "servehub", breve: "Serve l'hub", ruolo: "hub" },
] as const;

export type Passaggio = "in_attesa" | "invio" | "accettato" | "rifiutato";
export type EsitoRichiamo = "fatta" | "saltata" | "non_risponde";

export interface StatoRacconto {
  scena: number;
  visitate: number[];
  confermate: string[];
  sede: "schiavonia" | "padova";
  sedeConfermata: boolean;
  restaHubMotivo: string | null;
  passaggio: Passaggio;
  rifiutoMotivo: string | null;
  postiLiberi: number;
  richiamo: EsitoRichiamo | null;
  luigi: { esito: "spoke" | "serve_hub" | null; motivo: string | null };
  registroDemo: VoceRegistro[];
}

export type AzioneRacconto =
  | { t: "vai"; scena: number; righeValide: string[] }
  | { t: "conferma_riga"; id: string }
  | { t: "conferma_tutte"; ids: string[] }
  | { t: "scegli_sede"; sede: "schiavonia" | "padova" }
  | { t: "conferma_sede" }
  | { t: "resta_hub"; motivo: string }
  | { t: "annulla_sede" }
  | { t: "invio_passaggio" }
  | { t: "accetta" }
  | { t: "rifiuta"; motivo: string }
  | { t: "annulla_rifiuto" }
  | { t: "richiamo"; esito: EsitoRichiamo }
  | { t: "annulla_richiamo" }
  | { t: "luigi_spoke" }
  | { t: "luigi_serve_hub"; motivo: string }
  | { t: "annulla_luigi" }
  | { t: "reset"; stato: StatoRacconto };

export const statoInizialeRacconto = (postiLiberi: number): StatoRacconto => ({
  scena: 0,
  visitate: [0],
  confermate: [],
  sede: "schiavonia",
  sedeConfermata: false,
  restaHubMotivo: null,
  passaggio: "in_attesa",
  rifiutoMotivo: null,
  postiLiberi,
  richiamo: null,
  luigi: { esito: null, motivo: null },
  registroDemo: [],
});

const senza = (voci: VoceRegistro[], tipo: VoceRegistro["tipo"], fase: string) =>
  voci.filter((v) => !(v.demo && v.tipo === tipo && v.fase === fase));

export function reducerRacconto(s: StatoRacconto, a: AzioneRacconto): StatoRacconto {
  switch (a.t) {
    case "vai": {
      const scena = Math.max(0, Math.min(SCENE.length - 1, a.scena));
      let r: StatoRacconto = { ...s, scena, visitate: Array.from(new Set([...s.visitate, scena])) };
      if (scena >= 1 && r.confermate.length < a.righeValide.length) r = { ...r, confermate: a.righeValide };
      if (scena >= 2 && !r.sedeConfermata) r = { ...r, sede: "schiavonia", sedeConfermata: true };
      return r;
    }
    case "conferma_riga":
      return {
        ...s,
        confermate: s.confermate.includes(a.id) ? s.confermate.filter((x) => x !== a.id) : [...s.confermate, a.id],
      };
    case "conferma_tutte":
      return { ...s, confermate: a.ids };
    case "scegli_sede":
      return { ...s, sede: a.sede };
    case "conferma_sede":
      return { ...s, sede: "schiavonia", sedeConfermata: true, restaHubMotivo: null };
    case "resta_hub":
      return {
        ...s,
        sede: "padova",
        sedeConfermata: true,
        restaHubMotivo: a.motivo,
        registroDemo: [
          { data: OGGI_DEMO, chi: "Hub", tipo: "resta_hub", motivo: a.motivo, fase: "Riabilitazione", sede: "Schiavonia", demo: true, nuova: true },
          ...senza(s.registroDemo, "resta_hub", "Riabilitazione"),
        ],
      };
    case "annulla_sede":
      return {
        ...s,
        postiLiberi: s.passaggio === "accettato" ? s.postiLiberi + 1 : s.postiLiberi,
        sede: "schiavonia",
        sedeConfermata: false,
        restaHubMotivo: null,
        passaggio: "in_attesa",
        rifiutoMotivo: null,
        registroDemo: senza(s.registroDemo, "resta_hub", "Riabilitazione"),
      };
    case "invio_passaggio":
      return { ...s, passaggio: "invio" };
    case "accetta":
      return s.passaggio !== "invio" ? s : { ...s, passaggio: "accettato", postiLiberi: s.postiLiberi - 1 };
    case "rifiuta":
      return {
        ...s,
        passaggio: "rifiutato",
        rifiutoMotivo: a.motivo,
        registroDemo: [
          { data: OGGI_DEMO, chi: "Spoke", tipo: "spoke_non_puo", motivo: a.motivo, fase: "Riabilitazione", sede: "Schiavonia", demo: true, nuova: true },
          ...senza(s.registroDemo, "spoke_non_puo", "Riabilitazione"),
        ],
      };
    case "annulla_rifiuto":
      return { ...s, passaggio: "in_attesa", rifiutoMotivo: null, registroDemo: senza(s.registroDemo, "spoke_non_puo", "Riabilitazione") };
    case "richiamo":
      return { ...s, richiamo: a.esito };
    case "annulla_richiamo":
      return { ...s, richiamo: null };
    case "luigi_spoke":
      return { ...s, luigi: { esito: "spoke", motivo: null }, registroDemo: senza(s.registroDemo, "serve_hub", "Follow-up oncologico") };
    case "luigi_serve_hub":
      return {
        ...s,
        luigi: { esito: "serve_hub", motivo: a.motivo },
        registroDemo: [
          { data: OGGI_DEMO, chi: "Hub", tipo: "serve_hub", motivo: a.motivo, fase: "Follow-up oncologico", sede: "Schiavonia", demo: true, nuova: true },
          ...senza(s.registroDemo, "serve_hub", "Follow-up oncologico"),
        ],
      };
    case "annulla_luigi":
      return { ...s, luigi: { esito: null, motivo: null }, registroDemo: senza(s.registroDemo, "serve_hub", "Follow-up oncologico") };
    case "reset":
      return a.stato;
  }
}
