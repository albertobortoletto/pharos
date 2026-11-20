import { describe, expect, it } from "vitest";
import { GIOVANNI } from "../data/persone";
import { PESI_PREDEFINITI } from "../data/pesi";
import { aggiornaCPT, posteriori, pRientro, RETE_INIZIALE, spiegaRischio, ordineTopologico } from "./bayes";
import { abbina, ungherese } from "./matching";
import { modelloDemo, postiMese, probSuperamento, simula, stimaModello } from "./markov";
import { esperienzaPerStruttura, K_VICINI } from "./similar";
import { casiChiusi, generaDataset } from "./synth";

const somma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("rete bayesiana", () => {
  it("ogni riga di ogni CPT somma a 1", () => {
    for (const n of RETE_INIZIALE.nodi)
      for (const [k, riga] of Object.entries(RETE_INIZIALE.cpt[n.id])) {
        expect(riga).toHaveLength(n.stati.length);
        expect(somma(riga), `${n.id}[${k}]`).toBeCloseTo(1, 9);
      }
  });

  it("le CPT coprono tutte le combinazioni dei genitori", () => {
    for (const n of RETE_INIZIALE.nodi) {
      const attese = n.genitori.reduce((a, g) => a * RETE_INIZIALE.nodi.find((x) => x.id === g)!.stati.length, 1);
      expect(Object.keys(RETE_INIZIALE.cpt[n.id])).toHaveLength(attese);
    }
    expect(ordineTopologico(RETE_INIZIALE)).toHaveLength(RETE_INIZIALE.nodi.length);
  });

  it("le probabilità a posteriori sommano a 1", () => {
    for (const q of ["rientro_hub", "aderenza", "stato_funzionale"]) expect(somma(Object.values(posteriori(RETE_INIZIALE, q, GIOVANNI.profilo)))).toBeCloseTo(1, 9);
  });

  it("peggiorare un fattore non abbassa mai il rischio", () => {
    const base = { ...GIOVANNI.profilo, distanza: "medio" };
    for (const [id, valore] of Object.entries(base)) {
      const stati = RETE_INIZIALE.nodi.find((n) => n.id === id)!.stati;
      const i = stati.indexOf(valore!);
      for (let j = i + 1; j < stati.length; j++) expect(pRientro({ ...base, [id]: stati[j] }), `${id}=${stati[j]}`).toBeGreaterThanOrEqual(pRientro(base) - 1e-12);
    }
  });

  it("la spiegazione è coerente con il segno dei fattori", () => {
    const ev = { ...GIOVANNI.profilo, distanza: "medio" };
    const f = spiegaRischio(ev);
    expect(f.length).toBeGreaterThan(0);
    expect(f.length).toBeLessThanOrEqual(3);
    for (const x of f) {
      const conAlternativa = pRientro({ ...ev, [x.nodo]: x.confronto });
      expect(Math.sign(pRientro(ev) - conAlternativa)).toBe(Math.sign(x.punti));
    }
  });

  it("aggiornaCPT con Laplace dà righe che sommano a 1 e usa i casi chiusi", () => {
    const casi = casiChiusi();
    expect(casi.length).toBeGreaterThan(30);
    const nuova = aggiornaCPT(casi);
    for (const n of nuova.nodi) for (const riga of Object.values(nuova.cpt[n.id])) expect(somma(riga)).toBeCloseTo(1, 9);
    const r = pRientro({ ...GIOVANNI.profilo, distanza: "medio" }, nuova);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1);
  });
});

describe("dataset sintetico", () => {
  it("è deterministico e ha 200–300 pazienti", () => {
    const a = generaDataset(7);
    const b = generaDataset(7);
    expect(a).toEqual(b);
    const d = generaDataset();
    expect(d.length).toBeGreaterThanOrEqual(200);
    expect(d.length).toBeLessThanOrEqual(300);
    expect(d.some((p) => p.chiuso)).toBe(true);
  });
});

describe("pazienti simili", () => {
  it("usa al massimo k casi e segnala i pochi dati", () => {
    const e = esperienzaPerStruttura(GIOVANNI.profilo);
    expect(somma(e.map((x) => x.n))).toBeLessThanOrEqual(K_VICINI);
    for (const x of e) expect(x.pochiDati).toBe(x.n < 10);
  });
});

describe("abbinamento", () => {
  const ctx = {
    prestazione: "riabilitazione_pavimento_pelvico",
    profilo: GIOVANNI.profilo,
    comune: GIOVANNI.comune,
    postiDichiarati: () => 6,
    pesi: PESI_PREDEFINITI,
  };

  it("il filtro esclude le strutture senza posti, con il motivo", () => {
    const r = abbina({ ...ctx, postiLiberi: (id) => (id === "schiavonia" ? 0 : 3) });
    expect(r.ordinate.some((c) => c.struttura.id === "schiavonia")).toBe(false);
    expect(r.escluse.find((e) => e.struttura.id === "schiavonia")?.motivo).toMatch(/posti esauriti/);
    expect(r.escluse.find((e) => e.struttura.id === "spoke_x")?.motivo).toMatch(/requisito/);
  });

  it("con i posti, Schiavonia è la prima scelta per Giovanni e il punteggio è la somma delle voci", () => {
    const r = abbina({ ...ctx, postiLiberi: () => 3 });
    expect(r.ordinate[0].struttura.id).toBe("schiavonia");
    for (const c of r.ordinate) expect(somma(Object.values(c.contributi))).toBeCloseTo(c.punteggio, 9);
    expect(r.ordinate[0].frase).toMatch(/^Schiavonia: \d+ casi simili trattati, 22 km da casa, rischio di rientro basso \(12%\), 3 posti liberi questa settimana$/);
  });

  it("algoritmo ungherese: trova l'assegnamento di costo minimo", () => {
    const costo = [
      [4, 1, 3],
      [2, 0, 5],
      [3, 2, 2],
    ];
    const a = ungherese(costo);
    expect(somma(a.map((j, i) => costo[i][j]))).toBe(5);
    expect(new Set(a).size).toBe(3);
  });
});

describe("catena di Markov", () => {
  it("ogni riga della matrice di transizione somma a 1", () => {
    const m = stimaModello();
    for (const riga of m.P) expect(somma(riga)).toBeCloseTo(1, 9);
    expect(m.passaggi).toBeGreaterThan(100);
  });

  it("Monte Carlo: stesso seed, stesso risultato", () => {
    const a = simula(2, 200, 42);
    const b = simula(2, 200, 42);
    expect(a.ingressi.map((t) => Array.from(t[2]))).toEqual(b.ingressi.map((t) => Array.from(t[2])));
    expect(probSuperamento("schiavonia", postiMese(6), 2, 300, 9)).toBe(probSuperamento("schiavonia", postiMese(6), 2, 300, 9));
  });

  it("previsione della demo: Schiavonia diventa arancione al secondo mese", () => {
    expect(modelloDemo().tendenza).toBeGreaterThan(0);
    expect(probSuperamento("schiavonia", postiMese(6), 1)).toBeLessThan(0.25);
    expect(probSuperamento("schiavonia", postiMese(6), 2)).toBeGreaterThanOrEqual(0.25);
  });
});
