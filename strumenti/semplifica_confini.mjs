// Semplifica i confini del Veneto e delle 7 province per la mappa offline.
// Fonte: ISTAT, confini amministrativi generalizzati, via openpolis/geojson-italy (CC BY 4.0).
// Uso: node strumenti/semplifica_confini.mjs <limits_IT_provinces.geojson> <limits_IT_regions.geojson> [tolleranza_gradi]
// Scrive src/data/rete/veneto.geo.json. Nessuna dipendenza esterna: Douglas-Peucker + scarto delle isole minuscole.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const [, , fileProvince, fileRegioni, tolArg] = process.argv;
if (!fileProvince || !fileRegioni) {
  console.error("Uso: node strumenti/semplifica_confini.mjs <province.geojson> <regioni.geojson> [tolleranza]");
  process.exit(1);
}
const TOL = Number(tolArg ?? 0.004);
const AREA_MIN = 0.0004; // gradi²: scarta isolette e barene della laguna
const DECIMALI = 4;

const VENETO = 5;
const leggi = (f) => JSON.parse(readFileSync(f, "utf8"));

function distSeg(p, a, b) {
  const [x, y] = p;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((x - x1) * dx + (y - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function douglasPeucker(punti, tol) {
  if (punti.length < 3) return punti;
  const tieni = new Uint8Array(punti.length);
  tieni[0] = tieni[punti.length - 1] = 1;
  const pila = [[0, punti.length - 1]];
  while (pila.length) {
    const [i, j] = pila.pop();
    let max = 0;
    let k = -1;
    for (let m = i + 1; m < j; m++) {
      const d = distSeg(punti[m], punti[i], punti[j]);
      if (d > max) {
        max = d;
        k = m;
      }
    }
    if (max > tol && k > 0) {
      tieni[k] = 1;
      pila.push([i, k], [k, j]);
    }
  }
  return punti.filter((_, i) => tieni[i]);
}

const area = (anello) => {
  let s = 0;
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) s += (anello[j][0] + anello[i][0]) * (anello[j][1] - anello[i][1]);
  return Math.abs(s / 2);
};
const arrotonda = (p) => p.map((x) => Number(x.toFixed(DECIMALI)));

/** Area con segno (shoelace): positiva se antioraria. */
const areaConSegno = (a) => {
  let s = 0;
  for (let i = 0; i < a.length - 1; i++) s += a[i][0] * a[i + 1][1] - a[i + 1][0] * a[i][1];
  return s / 2;
};

/** d3-geo vuole l'anello esterno in senso ORARIO e i buchi in senso antiorario (al contrario di RFC 7946). */
function semplificaAnello(anello, esterno) {
  const s = douglasPeucker(anello, TOL).map(arrotonda);
  if (s.length < 4) return null;
  s[s.length - 1] = s[0];
  const antiorario = areaConSegno(s) > 0;
  if (esterno === antiorario) s.reverse();
  return s;
}

function semplificaGeometria(g) {
  const poligoni = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const out = [];
  for (const pol of poligoni) {
    if (area(pol[0]) < AREA_MIN) continue;
    const esterno = semplificaAnello(pol[0], true);
    if (!esterno) continue;
    const buchi = pol.slice(1).filter((h) => area(h) >= AREA_MIN).map((h) => semplificaAnello(h, false)).filter(Boolean);
    out.push([esterno, ...buchi]);
  }
  return out.length === 1 ? { type: "Polygon", coordinates: out[0] } : { type: "MultiPolygon", coordinates: out };
}

const province = leggi(fileProvince)
  .features.filter((f) => f.properties.reg_istat_code_num === VENETO)
  .map((f) => ({ type: "Feature", properties: { nome: f.properties.prov_name, sigla: f.properties.prov_acr }, geometry: semplificaGeometria(f.geometry) }));
const regione = leggi(fileRegioni)
  .features.filter((f) => f.properties.reg_istat_code_num === VENETO)
  .map((f) => ({ type: "Feature", properties: { nome: "Veneto", sigla: "VEN" }, geometry: semplificaGeometria(f.geometry) }));

const out = {
  type: "FeatureCollection",
  fonte: "ISTAT, confini amministrativi generalizzati, via openpolis/geojson-italy (CC BY 4.0). Semplificati con strumenti/semplifica_confini.mjs",
  tolleranza_gradi: TOL,
  features: [...regione, ...province],
};
const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "rete", "veneto.geo.json");
const testo = JSON.stringify(out);
writeFileSync(dest, testo);
console.log(`Scritto ${dest}: ${(testo.length / 1024).toFixed(1)} KB, ${province.length} province`);
