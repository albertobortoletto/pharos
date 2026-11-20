// Test di coerenza (§3.9): una sola fonte per numeri, frasi e termini.
// 1. La spiegazione di Giovanni è la stessa in hub, mappa, schermata AI (istantanea + confronto tra componenti).
// 2. Nessun parametro del PDTA o peso del punteggio scritto a mano nelle viste (.tsx).
// 3. Nessuna variante vietata dal glossario, in nessun file sorgente.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GIOVANNI } from "../src/data/persone";
import { PARAMETRI } from "../src/data/pdta";
import { PESI_PREDEFINITI } from "../src/data/pesi";
import { SEDUTE_RIABILITAZIONE } from "../src/data/tratte";
import { abbina, rischioPerStruttura } from "../src/engine/matching";
import { fraseFattore, fraseRischio, nomeValore, percento, punti } from "../src/engine/spiegazioni";
import { SchedaRischio } from "../src/componenti/rischio";
import { StoreCtx } from "../src/stato/contesto";
import { postiLiberi, reducer, statoIniziale, type Stato } from "../src/stato/store";
import { VARIANTI_VIETATE } from "../src/testi/glossario";
import VistaAi from "../src/viste/ai/VistaAi";
import { PropostaSede } from "../src/viste/hub/PropostaSede";

const SRC = join(__dirname, "..", "src");

function file(dir: string, est: RegExp): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? file(p, est) : est.test(n) ? [p] : [];
  });
}

/** Testo visibile di un componente, renderizzato con lo store indicato. */
function testo(el: ReactElement, st: Stato = statoIniziale()): string {
  const html = renderToStaticMarkup(createElement(StoreCtx.Provider, { value: { st, d: () => {} } }, el));
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");
}

/** Toglie i commenti: contano solo i testi che l'utente vede. */
const senzaCommenti = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1").replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");

describe("spiegazione di Giovanni: una sola fonte", () => {
  const st = statoIniziale();
  const abb = abbina({
    prestazione: "riabilitazione_pavimento_pelvico",
    profilo: GIOVANNI.profilo,
    comune: GIOVANNI.comune,
    postiLiberi: (id) => postiLiberi(st, id),
    postiDichiarati: (id) => st.posti[id]?.dichiarati ?? 0,
    pesi: st.pesi,
  });
  const r = rischioPerStruttura(GIOVANNI.profilo, GIOVANNI.comune, "schiavonia");

  it("istantanea del testo generato (cambia solo se cambiano dati o modelli)", () => {
    expect({
      rischio: fraseRischio(r.rischio),
      fattori: r.fattori.map(fraseFattore),
      proposta: abb.ordinate.map((c) => c.frase),
      escluse: abb.escluse.map((e) => `${e.struttura.nome}: ${e.motivo}`),
    }).toMatchSnapshot();
  });

  it("la frase della proposta usa lo stesso rischio della scheda di rischio", () => {
    const schiavonia = abb.ordinate.find((c) => c.struttura.id === "schiavonia")!;
    expect(schiavonia.frase).toContain(fraseRischio(r.rischio));
  });

  const viste: [string, ReactElement][] = [
    ["scheda di rischio (hub, spoke, mappa)", createElement(SchedaRischio, { profilo: GIOVANNI.profilo, comune: GIOVANNI.comune, struttura: "schiavonia" })],
    ["proposta di sede (hub)", createElement(PropostaSede)],
    ["Come ragiona il sistema", createElement(VistaAi)],
  ];

  it.each(viste)("%s: stesso rischio e stessi fattori", (_, el) => {
    const t = testo(el);
    expect(t).toContain(percento(r.rischio));
    for (const f of r.fattori) {
      expect(t).toContain(f.nome);
      expect(t).toContain(nomeValore(f.nodo, f.valore));
      expect(t).toContain(punti(f.punti));
    }
  });

  it("i pesi cambiano la classifica anche nella schermata AI, dallo stesso store", () => {
    const st2 = reducer(st, { t: "pesi", pesi: { ...st.pesi, esperienza: 0 } } as never);
    const a = testo(createElement(VistaAi), st);
    const b = testo(createElement(VistaAi), st2);
    expect(a).not.toBe(b);
  });
});

describe("nessun parametro scritto a mano nelle viste", () => {
  const p = PARAMETRI;
  const pesi = Object.values(PESI_PREDEFINITI);
  /** Numero + unità: se compare in un .tsx, va preso da data/pdta.ts, data/pesi.ts o data/tratte.ts. */
  const vietati: [RegExp, string][] = [
    [new RegExp(`\\b${p.parere_giorni_lavorativi} giorni lavorativi\\b`), "PARAMETRI.parere_giorni_lavorativi"],
    [new RegExp(`\\b${p.parere_urgente_ore} ore\\b(?! su 24)`), "PARAMETRI.parere_urgente_ore / conferma_paziente_ore"],
    [new RegExp(`\\b${p.rientro_priorita_giorni} giorni\\b`), "PARAMETRI.rientro_priorita_giorni"],
    [new RegExp(`\\b${p.attesa_max_spoke_giorni} giorni\\b`), "PARAMETRI.attesa_max_spoke_giorni"],
    [new RegExp(`\\b${p.risposta_spoke_ore} ore\\b`), "PARAMETRI.risposta_spoke_ore"],
    [new RegExp(`\\b${p.quesito_max_caratteri} caratteri\\b`), "PARAMETRI.quesito_max_caratteri"],
    [new RegExp(`\\bseduta ${p.seduta_controllo}\\b|\\b${p.seduta_controllo}ª seduta\\b`), "PARAMETRI.seduta_controllo"],
    [new RegExp(`\\b${SEDUTE_RIABILITAZIONE} sedute\\b`), "SEDUTE_RIABILITAZIONE"],
    [new RegExp(`\\b(${Object.keys(PESI_PREDEFINITI).join("|")})\\s*[:=]\\s*0?\\.\\d`), "PESI_PREDEFINITI"],
    ...pesi.map((w): [RegExp, string] => [new RegExp(`\\b${Math.round(w * 100)} ?%`), "PESI_PREDEFINITI"]),
  ];

  for (const f of file(SRC, /\.tsx$/)) {
    it(relative(SRC, f), () => {
      const s = senzaCommenti(readFileSync(f, "utf8"));
      const trovati = vietati.filter(([re]) => re.test(s)).map(([re, fonte]) => `${re} → usa ${fonte}`);
      expect(trovati).toEqual([]);
    });
  }
});

describe("glossario: nessuna variante vietata", () => {
  const sorgenti = file(SRC, /\.(tsx?|md|css)$/).filter((f) => !f.endsWith("glossario.ts"));
  it("ci sono file da controllare", () => expect(sorgenti.length).toBeGreaterThan(20));
  for (const f of sorgenti) {
    it(relative(SRC, f), () => {
      const s = readFileSync(f, "utf8");
      const trovati = VARIANTI_VIETATE.filter(([re]) => re.test(s)).map(([re, giusto]) => `${re} → «${giusto}»`);
      expect(trovati).toEqual([]);
    });
  }
});
