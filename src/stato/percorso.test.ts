import { describe, expect, it } from "vitest";
import { reducer, statoIniziale, type Azione, type Stato } from "./store";
import { aChi, daChi, fasiGiovanni, prossimoAppuntamento } from "./percorso";

const applica = (st: Stato, ...azioni: Azione[]) => azioni.reduce(reducer, st);

describe("percorso di Giovanni per paziente e caregiver", () => {
  it("prima della conferma lo segue l'hub; dopo, lo spoke, con la data della 1ª seduta", () => {
    let st = applica(statoIniziale(), { t: "proponi_giovanni", struttura: "schiavonia", seconda: null });
    expect(fasiGiovanni(st)[1].chi).toBe("l'hub di Padova");
    expect(prossimoAppuntamento(st).struttura).toBe("padova");
    st = applica(st, { t: "spoke_accetta", scheda: "g-riab" });
    expect(fasiGiovanni(st)[1].chi).toBe("lo spoke di Schiavonia");
    expect(prossimoAppuntamento(st)).toMatchObject({ data: "2026-11-24", struttura: "schiavonia" });
  });

  it("le fasi sono solo quelle della lettera (più l'intervento già fatto)", () => {
    expect(fasiGiovanni(statoIniziale()).map((f) => f.id)).toEqual(["intervento", "riab", "controllo"]);
  });

  it("preposizioni articolate corrette", () => {
    expect(daChi("l'hub di Padova")).toBe("dall'hub di Padova");
    expect(aChi("lo spoke di Schiavonia")).toBe("allo spoke di Schiavonia");
  });
});
