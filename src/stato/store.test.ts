import { describe, expect, it } from "vitest";
import { daChiamare, postiLiberi, reducer, serveControllo, schedaGiovanni, statoIniziale, vistaRacconto, type Azione, type Stato } from "./store";

const applica = (st: Stato, ...azioni: Azione[]) => azioni.reduce(reducer, st);

describe("store condiviso", () => {
  it("parte dalla mappa con Giovanni in bozza e 4 posti liberi a Schiavonia", () => {
    const st = statoIniziale();
    expect(st.vista).toBe("mappa");
    expect(schedaGiovanni(st).stato).toBe("BOZZA");
    expect(postiLiberi(st, "schiavonia")).toBe(4);
  });

  it("racconto: conferma sede → presa in carico → posti scendono", () => {
    let st = applica(statoIniziale(), { t: "conferma_sede" });
    expect(schedaGiovanni(st).stato).toBe("INVIATA");
    expect(vistaRacconto(st).passaggio).toBe("in_attesa");
    st = applica(st, { t: "invio_passaggio" }, { t: "accetta" });
    expect(schedaGiovanni(st).stato).toBe("PRENOTATA");
    expect(vistaRacconto(st).passaggio).toBe("accettato");
    expect(vistaRacconto(st).postiLiberi).toBe(3);
    expect(st.notifiche.some((n) => n.canale === "sms")).toBe(true);
  });

  it("annulla la scelta restituisce il posto", () => {
    const st = applica(statoIniziale(), { t: "conferma_sede" }, { t: "invio_passaggio" }, { t: "accetta" }, { t: "annulla_sede" });
    expect(postiLiberi(st, "schiavonia")).toBe(4);
    expect(schedaGiovanni(st).stato).toBe("BOZZA");
  });

  it("con zero posti dichiarati lo spoke non può accettare", () => {
    const st = applica(statoIniziale(), { t: "posti_dichiarati", struttura: "schiavonia", n: 0 }, { t: "conferma_sede" }, { t: "spoke_accetta", scheda: "g-riab" });
    expect(schedaGiovanni(st).stato).toBe("INVIATA");
    expect(postiLiberi(st, "schiavonia")).toBe(0);
  });

  it("resta all'hub annulla la scheda e scrive il registro", () => {
    const st = applica(statoIniziale(), { t: "resta_hub", motivo: "preferenza" });
    expect(schedaGiovanni(st).stato).toBe("ANNULLATA");
    expect(vistaRacconto(st).sede).toBe("padova");
    expect(st.registroDemo[0].motivo).toBe("preferenza");
  });

  it("Tempo +1 giorno: la notifica non letta finisce tra le persone da chiamare", () => {
    let st = applica(statoIniziale(), { t: "conferma_sede" }, { t: "spoke_accetta", scheda: "g-riab" });
    expect(daChiamare(st)).toHaveLength(0);
    st = applica(st, { t: "tempo", ore: 24 });
    expect(daChiamare(st).length).toBeGreaterThan(0);
    const id = daChiamare(st)[0].id;
    st = applica(st, { t: "notifica_letta", id });
    expect(daChiamare(st).some((n) => n.id === id)).toBe(false);
  });

  it("Tempo +1 giorno fa scattare escalation e solleciti delle altre schede", () => {
    const st = applica(statoIniziale(), { t: "tempo", ore: 24 });
    expect(st.schede.find((s) => s.id === "s-bruno")!.escalation).toBe(true);
    expect(st.schede.find((s) => s.id === "s-mario")!.solleciti).toBe(1);
  });

  it("parere: serve l'hub porta la scheda al rientro", () => {
    let st = applica(statoIniziale(), { t: "conferma_sede" }, { t: "spoke_accetta", scheda: "g-riab" });
    for (let i = 0; i < 5; i++) st = applica(st, { t: "registra_seduta", scheda: "g-riab" });
    expect(schedaGiovanni(st).stato).toBe("IN_CORSO");
    st = applica(st, { t: "controllo_miglioramento", scheda: "g-riab", esito: "no" }, { t: "chiedi_parere", scheda: "g-riab", quesito: "continenza", testo: "", urgente: false });
    const p = st.pareri[0];
    st = applica(st, { t: "rispondi_parere", id: p.id, risposta: { tipo: "serve_hub", motivo: "valutazione_urologica", dataSlot: "2026-12-02" } });
    expect(schedaGiovanni(st).stato).toBe("RIENTRO");
  });

  it("alla seduta del controllo le sedute si fermano finché non c'è la risposta", () => {
    let st = applica(statoIniziale(), { t: "conferma_sede" }, { t: "spoke_accetta", scheda: "g-riab" });
    for (let i = 0; i < 7; i++) st = applica(st, { t: "registra_seduta", scheda: "g-riab" });
    expect(st.sedute["g-riab"]).toBe(5);
    expect(serveControllo(st, "g-riab")).toBe(true);
    st = applica(st, { t: "controllo_miglioramento", scheda: "g-riab", esito: "no" });
    st = applica(st, { t: "registra_seduta", scheda: "g-riab" });
    expect(st.sedute["g-riab"]).toBe(5);
    st = applica(st, { t: "chiedi_parere", scheda: "g-riab", quesito: "continenza", testo: "", urgente: true });
    st = applica(st, { t: "rispondi_parere", id: st.pareri[0].id, risposta: { tipo: "continua" } });
    st = applica(st, { t: "registra_seduta", scheda: "g-riab" });
    expect(st.sedute["g-riab"]).toBe(6);
  });

  it("posti a zero: si possono ripristinare quelli dichiarati all'inizio", () => {
    let st = applica(statoIniziale(), { t: "posti_dichiarati", struttura: "schiavonia", n: 0 });
    expect(postiLiberi(st, "schiavonia")).toBe(0);
    st = applica(st, { t: "posti_ripristina", struttura: "schiavonia" });
    expect(st.posti.schiavonia.dichiarati).toBe(6);
    expect(postiLiberi(st, "schiavonia")).toBe(4);
  });
});
