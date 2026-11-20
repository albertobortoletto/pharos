import { describe, expect, it } from "vitest";
import { FESTIVI, SECONDA_LINEA, SLOT_HUB } from "../data/casoRenato";
import { pianificaCiclo } from "./infusioni";

const GIORNI = SECONDA_LINEA.giorniHub.map((g) => g.giorno);

describe("pianificazione del primo ciclo all'hub", () => {
  it("scarta l'1 dicembre perché il giorno 8 cadrebbe l'8 dicembre, festivo", () => {
    const p = pianificaCiclo(SLOT_HUB, GIORNI, FESTIVI)!;
    expect(p.date).toEqual(["2026-12-02", "2026-12-09"]);
    expect(p.scartate).toHaveLength(1);
    expect(p.scartate[0].motivo).toContain("8 dicembre");
    expect(p.scartate[0].motivo).toContain("festivo");
  });

  it("scarta anche i fine settimana", () => {
    const p = pianificaCiclo(["2026-11-28", "2026-11-30"], [1, 8], [])!;
    expect(p.date).toEqual(["2026-11-30", "2026-12-07"]);
    expect(p.scartate[0].motivo).toContain("fine settimana");
  });

  it("nessuna data valida: null, mai una data inventata", () => {
    expect(pianificaCiclo(["2026-12-01"], [1, 8], FESTIVI)).toBeNull();
  });
});
