// Scene e azioni della demo originale (6 scene). Lo stato vero sta nello store unico (store.ts):
// le scene ne leggono una "vista" con la forma originale (vistaRacconto).
import type { VoceRegistro } from "../data/tipi";

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
  | { t: "reset" };
