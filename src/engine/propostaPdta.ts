import type { EtichettaPdta, Struttura } from "../data/tipi";

export interface PropostaPdta {
  sede: Struttura | null;
  motivi: { ok: boolean; testo: string }[];
  scartate: { nome: string; perche: string }[];
}

/**
 * Proposta della scena 2: il primo spoke con requisiti e posti, con i motivi in chiaro.
 * `postiLiberi` permette di usare i posti correnti dello store condiviso.
 */
export function propostaPdta(
  prestazione: string,
  etichetta: EtichettaPdta,
  condizioni: { non_guida: boolean; serve_accompagnatore: boolean },
  strutture: Struttura[],
  postiLiberi: (s: Struttura) => number = (s) => s.posti_liberi ?? 0,
): PropostaPdta {
  const scartate: PropostaPdta["scartate"] = [];
  if (etichetta === "solo_hub")
    return { sede: null, motivi: [{ ok: false, testo: "Etichetta del PDTA: «solo hub». Nessuna proposta." }], scartate };
  const candidate = strutture
    .filter((s) => s.tipo === "spoke")
    .filter((s) => {
      if (!s.servizi.includes(prestazione) || !s.requisiti) {
        scartate.push({ nome: s.nome, perche: "servizio o requisiti non dichiarati" });
        return false;
      }
      if (postiLiberi(s) <= 0) {
        scartate.push({ nome: s.nome, perche: "nessun posto libero dichiarato" });
        return false;
      }
      return true;
    });
  const sede = candidate[0] ?? null;
  if (!sede) return { sede: null, motivi: [{ ok: false, testo: "Nessuno spoke con requisiti e posti." }], scartate };
  const motivi = [
    {
      ok: true,
      testo:
        etichetta === "spoke"
          ? "Il percorso di cura (PDTA) la indica come fase che si può fare allo spoke"
          : "Il percorso di cura (PDTA) la prevede allo spoke con parere dell’hub",
    },
    { ok: true, testo: `${sede.nome} ha i requisiti per questa fase` },
    { ok: true, testo: `Posti dichiarati: ${sede.posti_settimana} a settimana, liberi ${postiLiberi(sede)}` },
  ];
  if (condizioni.non_guida) motivi.push({ ok: true, testo: "Giovanni non guida: basta questo per proporre lo spoke" });
  if (condizioni.serve_accompagnatore) motivi.push({ ok: true, testo: "Serve un accompagnatore (la figlia)" });
  return { sede, motivi, scartate };
}
