// Il percorso di Giovanni in linguaggio semplice, ricavato dallo store.
// Lo usano l'app di Laura, il pannello del medico di base e gli SMS: tutti dicono le stesse cose.
import { ITINERARIO } from "../data/itinerario";
import { ESTRAZIONE } from "../data/lettera";
import { strutturaPerId } from "../data/strutture";
import { SEDUTE_RIABILITAZIONE } from "../data/tratte";
import { dataBreve } from "../engine/date";
import { STATI_PRESA_IN_CARICO } from "../engine/scheda";
import { schedaGiovanni, type Stato } from "./store";

export type StatoFase = "fatta" | "in_corso" | "prossima";

export interface FasePercorso {
  id: string;
  nome: string;
  stato: StatoFase;
  /** Chi segue la fase, in linguaggio semplice: «lo spoke di Schiavonia». */
  chi: string;
  quando: string;
  nota?: string;
}

export interface Appuntamento {
  data: string;
  ora: string;
  cosa: string;
  luogo: string;
  indirizzo?: string;
  cosaPortare: string[];
  struttura: string;
}

const HUB = "l'hub di Padova";

/** Preposizioni articolate: «da» + «l'hub» = «dall'hub», «a» + «lo spoke» = «allo spoke». */
const articolata = (prep: "da" | "a", chi: string) =>
  chi.startsWith("l'") ? `${prep === "da" ? "dall'" : "all'"}${chi.slice(2)}` : chi.startsWith("lo ") ? `${prep === "da" ? "dallo" : "allo"} ${chi.slice(3)}` : `${prep} ${chi}`;
export const daChi = (chi: string) => articolata("da", chi);
export const aChi = (chi: string) => articolata("a", chi);
const allo = (id: string) => `lo spoke di ${strutturaPerId(id).nome}`;
const rigaLettera = (prestazione: string) => ESTRAZIONE.righe.find((r) => r.prestazione === prestazione)!;

export function fasiGiovanni(st: Stato): FasePercorso[] {
  const s = schedaGiovanni(st);
  const n = st.sedute[s.id] ?? 0;
  const riab = rigaLettera("riabilitazione_pavimento_pelvico");
  const ctrl = rigaLettera("controllo_urologico_istologico");

  let fase2: FasePercorso = { id: "riab", nome: riab.azione, stato: "prossima", chi: HUB, quando: riab.quando };
  if (s.stato === "BOZZA" || s.stato === "INVIATA")
    fase2 = { ...fase2, chi: HUB, nota: s.stato === "INVIATA" ? `Proposta ${allo(s.struttura)}, più vicino a casa: aspettiamo la conferma.` : "La sede si sceglie ora, con voi." };
  else if (s.stato === "RIFIUTATA") fase2 = { ...fase2, chi: HUB, nota: "Stiamo cercando un'altra sede: vi chiama l'infermiera di percorso." };
  else if (s.stato === "ANNULLATA") fase2 = { ...fase2, chi: HUB, nota: "Le sedute sono a Padova." };
  else if (s.stato === "ACCETTATA" || s.stato === "PRENOTATA")
    fase2 = { ...fase2, chi: allo(s.struttura), quando: `dal ${dataBreve(s.dataPrenotata ?? ITINERARIO.sedute[0])}` };
  else if (s.stato === "IN_CORSO") fase2 = { ...fase2, stato: "in_corso", chi: allo(s.struttura), quando: `seduta ${n} di ${SEDUTE_RIABILITAZIONE}` };
  else if (s.stato === "RIENTRO") fase2 = { ...fase2, stato: "in_corso", chi: HUB, nota: "L'urologo vuole rivedere Giovanni a Padova, con priorità." };
  else fase2 = { ...fase2, stato: "fatta", chi: allo(s.struttura), quando: `${SEDUTE_RIABILITAZIONE} sedute` };

  return [
    { id: "intervento", nome: "Intervento e dimissione", stato: "fatta", chi: HUB, quando: "novembre" },
    fase2,
    { id: "controllo", nome: ctrl.azione, stato: "prossima", chi: HUB, quando: dataBreve(ITINERARIO.controllo_hub.data) },
  ];
}

/** Il prossimo appuntamento certo (con data). */
export function prossimoAppuntamento(st: Stato): Appuntamento {
  const s = schedaGiovanni(st);
  const n = st.sedute[s.id] ?? 0;
  const it = ITINERARIO;
  const controllo: Appuntamento = { data: it.controllo_hub.data, ora: it.controllo_hub.ora, cosa: it.controllo_hub.cosa, luogo: it.controllo_hub.luogo, cosaPortare: it.cosa_portare.slice(0, 2), struttura: "padova" };
  const inCarico = STATI_PRESA_IN_CARICO.includes(s.stato) && !["ESITO_ATTESO", "ESITO_RICEVUTO", "CHIUSA"].includes(s.stato);
  if (inCarico && n < SEDUTE_RIABILITAZIONE) {
    const schiavonia = s.struttura === "schiavonia";
    return {
      data: it.sedute[n],
      ora: it.ora_sedute,
      cosa: `Seduta ${n + 1} di ${SEDUTE_RIABILITAZIONE} di riabilitazione`,
      luogo: schiavonia ? it.luogo_spoke : `Ospedale di ${strutturaPerId(s.struttura).nome}`,
      indirizzo: schiavonia ? it.indirizzo_spoke : undefined,
      cosaPortare: it.cosa_portare,
      struttura: s.struttura,
    };
  }
  if (s.stato === "ANNULLATA" && n < SEDUTE_RIABILITAZIONE)
    return { data: it.sedute[n], ora: it.ora_sedute, cosa: `Seduta ${n + 1} di ${SEDUTE_RIABILITAZIONE} di riabilitazione`, luogo: it.luogo_hub, cosaPortare: it.cosa_portare, struttura: "padova" };
  return controllo;
}
