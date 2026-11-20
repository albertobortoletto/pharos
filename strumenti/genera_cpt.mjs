// Genera src/data/bn_cpt.json: stime iniziali ILLUSTRATIVE (inventate ma plausibili).
// Le probabilità condizionate nascono da un modello logistico con effetti monotoni,
// così "peggiorare un fattore non abbassa il rischio". Da far validare ai clinici.
import { writeFileSync } from "node:fs";

const sig = (x) => 1 / (1 + Math.exp(-x));
const r2 = (x) => Math.round(x * 1000) / 1000;
const bin = (p) => { const a = r2(p); return [a, r2(1 - a)]; };

const nodi = {
  eta: { nome: "Età", stati: ["<65", "65-75", ">75"], genitori: [], prior: [0.3, 0.45, 0.25] },
  comorbidita: { nome: "Comorbidità", stati: ["0", "1", "2+"], genitori: [], prior: [0.35, 0.4, 0.25] },
  stadio: { nome: "Stadio", stati: ["localizzato", "localmente_avanzato"], genitori: [], prior: [0.75, 0.25] },
  tipo_intervento: { nome: "Tipo di intervento", stati: ["robotica", "aperta"], genitori: [], prior: [0.7, 0.3] },
  complicanza_postop: { nome: "Complicanza post-operatoria", stati: ["no", "si"], genitori: ["eta", "comorbidita", "tipo_intervento"] },
  stato_funzionale: { nome: "Stato funzionale (continenza)", stati: ["buona", "parziale", "scarsa"], genitori: ["complicanza_postop", "eta"] },
  distanza: { nome: "Distanza da casa", stati: ["vicino", "medio", "lontano"], genitori: [], prior: [0.35, 0.4, 0.25] },
  accompagnatore: { nome: "Accompagnatore", stati: ["si", "no"], genitori: [], prior: [0.7, 0.3] },
  aderenza: { nome: "Aderenza alle sedute", stati: ["alta", "bassa"], genitori: ["distanza", "accompagnatore"] },
  rientro_hub: { nome: "Rientro all'hub", stati: ["no", "si"], genitori: ["complicanza_postop", "stato_funzionale", "stadio", "aderenza"] },
};

// Prodotto cartesiano degli stati dei genitori, nell'ordine dei genitori.
function combinazioni(genitori) {
  let out = [[]];
  for (const g of genitori) out = out.flatMap((c) => nodi[g].stati.map((_, i) => [...c, i]));
  return out;
}

const cpt = {};
for (const [id, n] of Object.entries(nodi)) {
  if (!n.genitori.length) { cpt[id] = { "": n.prior }; continue; }
  cpt[id] = {};
  for (const c of combinazioni(n.genitori)) {
    const k = c.map((i, j) => nodi[n.genitori[j]].stati[i]).join("|");
    const v = Object.fromEntries(n.genitori.map((g, j) => [g, c[j]]));
    let riga;
    if (id === "complicanza_postop") {
      const p = sig(-2.2 + [0, 0.3, 0.7][v.eta] + [0, 0.4, 0.9][v.comorbidita] + [0, 0.6][v.tipo_intervento]);
      riga = [r2(1 - p), r2(p)];
    } else if (id === "stato_funzionale") {
      // modello ordinale: soglie su un punteggio latente
      const z = [0, 1.2][v.complicanza_postop] + [0, 0.3, 0.7][v.eta];
      const pBuona = sig(0.6 - z), pAlmenoParziale = sig(2.4 - z);
      riga = [r2(pBuona), r2(pAlmenoParziale - pBuona), r2(1 - pAlmenoParziale)];
    } else if (id === "aderenza") {
      const p = sig(-1.6 + [0, 0.4, 1.0][v.distanza] + [0, 1.2][v.accompagnatore]);
      riga = [r2(1 - p), r2(p)];
    } else if (id === "rientro_hub") {
      const p = sig(-2.8 + [0, 1.1][v.complicanza_postop] + [0, 0.6, 1.3][v.stato_funzionale] + [0, 0.9][v.stadio] + [0, 0.8][v.aderenza]);
      riga = [r2(1 - p), r2(p)];
    }
    // correzione dell'arrotondamento: la riga somma esattamente a 1
    const s = riga.reduce((a, b) => a + b, 0);
    riga[riga.length - 1] = r2(riga[riga.length - 1] + 1 - s);
    cpt[id][k] = riga;
  }
}

const out = {
  _nota: "Stime iniziali illustrative, da far validare ai clinici e aggiornare con i dati osservati; le prior possono venire da dati epidemiologici (es. Registro Tumori del Veneto). Numeri INVENTATI.",
  _ordine: "Per ogni nodo gli stati vanno dal più favorevole al meno favorevole per il rischio di rientro.",
  nodi: Object.fromEntries(Object.entries(nodi).map(([id, n]) => [id, { nome: n.nome, stati: n.stati, genitori: n.genitori }])),
  cpt,
};
writeFileSync(new URL("../src/data/bn_cpt.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log("ok", Object.keys(cpt).length, "nodi");
