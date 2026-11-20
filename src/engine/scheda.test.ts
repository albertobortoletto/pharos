import { describe, expect, it } from "vitest";
import { PARAMETRI } from "../data/pdta";
import { eventiDaTimer, nuovaScheda, RESPONSABILE, transizione, type StatoScheda } from "./scheda";

const base = () => nuovaScheda("x", "giovanni", "riabilitazione_pavimento_pelvico", "schiavonia", 10);

describe("scheda di fase", () => {
  it("segue il percorso completo fino alla chiusura", () => {
    let s = base();
    const passi: [Parameters<typeof transizione>[1], StatoScheda][] = [
      [{ tipo: "proponi", struttura: "schiavonia" }, "INVIATA"],
      [{ tipo: "accetta" }, "ACCETTATA"],
      [{ tipo: "prenota", data: "2026-11-24" }, "PRENOTATA"],
      [{ tipo: "iniziaSedute" }, "IN_CORSO"],
      [{ tipo: "fineSedute" }, "ESITO_ATTESO"],
      [{ tipo: "inviaEsito" }, "ESITO_RICEVUTO"],
      [{ tipo: "chiudi" }, "CHIUSA"],
    ];
    for (const [e, atteso] of passi) {
      s = transizione(s, e, 10, PARAMETRI);
      expect(s.stato).toBe(atteso);
    }
    expect(s.storia).toHaveLength(passi.length);
  });

  it("ogni stato ha un solo responsabile", () => {
    for (const r of Object.values(RESPONSABILE)) expect(typeof r).toBe("string");
    expect(RESPONSABILE.INVIATA).toBe("spoke");
    expect(RESPONSABILE.ESITO_RICEVUTO).toBe("hub");
  });

  it("rifiuta e annulla registrano il motivo", () => {
    const inviata = transizione(base(), { tipo: "proponi", struttura: "schiavonia" }, 10, PARAMETRI);
    const r = transizione(inviata, { tipo: "rifiuta", motivo: "posti_esauriti" }, 12, PARAMETRI);
    expect(r.stato).toBe("RIFIUTATA");
    expect(r.motivo).toBe("posti_esauriti");
    const a = transizione(base(), { tipo: "annulla", motivo: "preferenza" }, 10, PARAMETRI);
    expect(a.stato).toBe("ANNULLATA");
  });

  it("ignora le transizioni non ammesse", () => {
    const s = base();
    expect(transizione(s, { tipo: "accetta" }, 10, PARAMETRI)).toBe(s);
    expect(transizione(s, { tipo: "chiudi" }, 10, PARAMETRI)).toBe(s);
  });

  it("lo spoke ha 48 ore per rispondere, poi parte l'escalation", () => {
    const s = transizione(base(), { tipo: "proponi", struttura: "schiavonia" }, 10, PARAMETRI);
    expect(s.scadenza).toBe(10 + PARAMETRI.risposta_spoke_ore);
    expect(eventiDaTimer(s, 30)).toEqual([]);
    expect(eventiDaTimer(s, 10 + PARAMETRI.risposta_spoke_ore)).toEqual([{ tipo: "escalation" }]);
    const e = transizione(s, { tipo: "escalation" }, 60, PARAMETRI);
    expect(e.escalation).toBe(true);
    expect(eventiDaTimer(e, 100)).toEqual([]);
  });

  it("dopo la data prevista il sollecito dell'esito parte da solo", () => {
    let s = base();
    for (const e of [
      { tipo: "proponi", struttura: "schiavonia" },
      { tipo: "accetta" },
      { tipo: "prenota", data: "2026-11-24" },
      { tipo: "iniziaSedute" },
      { tipo: "fineSedute" },
    ] as const)
      s = transizione(s, e, 10, PARAMETRI);
    expect(eventiDaTimer(s, s.scadenza!)).toEqual([{ tipo: "sollecito" }]);
  });
});
