// La rete bayesiana disegnata DALLA STESSA struttura dati usata per il calcolo (RETE_INIZIALE).
// Clic su un nodo: la sua tabella di probabilità. Interruttore: evidenza di Giovanni.
import { useMemo } from "react";
import { GIOVANNI } from "../../data/persone";
import { NODO_RISCHIO, RETE_INIZIALE, ordineTopologico, posteriori, type Evidenza, type Nodo } from "../../engine/bayes";
import { rischioPerStruttura } from "../../engine/matching";
import { fraseRischio, nomeValore, percento } from "../../engine/spiegazioni";
import { useStore } from "../../stato/contesto";
import { NOTA_CPT } from "../../testi/ai";
import { Simulato } from "../../componenti/comuni";

const W = 1240;
const H = 470;
const BW = 186;
/** Larghezza del riquadro: cresce con il nome del nodo. */
const larghezza = (n: Nodo) => Math.max(BW, n.nome.length * 10 + 28);
const BH = 64;

/** Profondità di ogni nodo (0 = senza genitori): da qui le righe del disegno. */
function layout(nodi: Nodo[]) {
  const prof: Record<string, number> = {};
  for (const n of ordineTopologico(RETE_INIZIALE)) prof[n.id] = n.genitori.length ? 1 + Math.max(...n.genitori.map((g) => prof[g])) : 0;
  const livelli = Math.max(...Object.values(prof)) + 1;
  const pos: Record<string, { x: number; y: number }> = {};
  for (let l = 0; l < livelli; l++) {
    const riga = nodi.filter((n) => prof[n.id] === l);
    riga.forEach((n, i) => {
      pos[n.id] = { x: ((i + 0.5) * W) / riga.length, y: 50 + (l * (H - 100)) / Math.max(1, livelli - 1) };
    });
  }
  return pos;
}

export function GrafoBayes({ struttura }: { struttura: string }) {
  const { st, d } = useStore();
  const { evidenza: ev, nodo } = st.ai;
  const nodi = RETE_INIZIALE.nodi;
  const pos = useMemo(() => layout(nodi), [nodi]);
  const evidenza: Evidenza = ev ? rischioPerStruttura(GIOVANNI.profilo, GIOVANNI.comune, struttura).evidenza : {};
  const post = useMemo(() => Object.fromEntries(nodi.filter((n) => evidenza[n.id] === undefined).map((n) => [n.id, posteriori(RETE_INIZIALE, n.id, evidenza)])), [ev, struttura]);
  const pR = post[NODO_RISCHIO]?.si ?? 0;
  const sel = nodi.find((n) => n.id === nodo) ?? null;

  return (
    <div className="grafo-bayes" data-testid="grafo-bayes">
      <div className="azioni" style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <label className="spunta interruttore-evidenza">
          <input type="checkbox" checked={ev} onChange={(e) => d({ t: "ai", patch: { evidenza: e.target.checked } })} data-testid="evidenza-giovanni" /> Evidenza di Giovanni
          (distanza: a {struttura === "schiavonia" ? "Schiavonia" : struttura})
        </label>
        <span className="p-rientro" data-testid="p-rientro">
          P(rientro all'hub) = <b>{percento(pR)}</b> {ev ? `· ${fraseRischio(pR)}` : "· senza evidenza (prior)"} <Simulato />
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafo della rete bayesiana">
        <defs>
          <marker id="freccia" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#8aa0b8" />
          </marker>
        </defs>
        {nodi.flatMap((n) =>
          n.genitori.map((g) => {
            const a = pos[g];
            const b = pos[n.id];
            const y1 = a.y + BH / 2;
            const y2 = b.y - BH / 2 - 2;
            const my = (y1 + y2) / 2;
            return <path key={`${g}-${n.id}`} d={`M${a.x},${y1} C${a.x},${my} ${b.x},${my} ${b.x},${y2}`} className="arco" markerEnd="url(#freccia)" />;
          }),
        )}
        {nodi.map((n) => {
          const p = pos[n.id];
          const oss = evidenza[n.id];
          const rischio = n.id === NODO_RISCHIO;
          const dist = post[n.id];
          const piu = dist ? n.stati.reduce((a, s) => (dist[s] > dist[a] ? s : a), n.stati[0]) : null;
          return (
            <g
              key={n.id}
              transform={`translate(${p.x - larghezza(n) / 2} ${p.y - BH / 2})`}
              className={`nodo-bn ${oss ? "osservato" : ""} ${rischio ? "rischio" : ""} ${nodo === n.id ? "sel" : ""}`}
              onClick={() => d({ t: "ai", patch: { nodo: n.id } })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && d({ t: "ai", patch: { nodo: n.id } })}
              data-testid={`bn-${n.id}`}
            >
              <rect width={larghezza(n)} height={BH} rx={12} />
              <text x={larghezza(n) / 2} y={25} className="nome">
                {n.nome}
              </text>
              <text x={larghezza(n) / 2} y={48} className="valore">
                {oss ? nomeValore(n.id, oss) : rischio ? `sì: ${percento(pR)}` : piu ? `${nomeValore(n.id, piu)} ${percento(dist![piu])}` : ""}
              </text>
            </g>
          );
        })}
      </svg>
      {sel && <TabellaCpt n={sel} />}
    </div>
  );
}

function TabellaCpt({ n }: { n: Nodo }) {
  const righe = Object.entries(RETE_INIZIALE.cpt[n.id]);
  return (
    <div className="tabella-cpt" data-testid="tabella-cpt">
      <h3>
        Tabella di probabilità: {n.nome} <span className="badge-dato simulato">{NOTA_CPT}</span>
      </h3>
      <div className="cpt-scroll">
        <table className="tabella">
          <thead>
            <tr>
              {n.genitori.map((g) => (
                <th key={g}>{RETE_INIZIALE.nodi.find((x) => x.id === g)!.nome}</th>
              ))}
              {n.stati.map((s) => (
                <th key={s} className="num">
                  P({nomeValore(n.id, s)})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {righe.map(([k, dist]) => (
              <tr key={k || "prior"}>
                {n.genitori.length === 0 ? null : k.split("|").map((v, i) => <td key={i}>{nomeValore(n.genitori[i], v)}</td>)}
                {dist.map((p, i) => (
                  <td key={i} className="num">
                    {percento(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
