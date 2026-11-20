// «Come ragiona il sistema»: cosa fa l'intelligenza artificiale, con quali dati e cosa non fa.
// Testi da src/testi/ai.ts; esempi calcolati dal motore in questo momento, con lo stato dello store.
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, Ban, Database, Sparkles } from "lucide-react";
import { GIOVANNI } from "../../data/persone";
import { strutturaPerId } from "../../data/strutture";
import { OGGI_DEMO } from "../../data/itinerario";
import { aggiungiMesi, nomeMese } from "../../engine/date";
import { esperienzaPerStruttura } from "../../engine/similar";
import { MESI_PREVISIONE, postiMese, probSuperamento } from "../../engine/markov";
import { fraseFattore, fraseRischio, percento } from "../../engine/spiegazioni";
import { rischioPerStruttura } from "../../engine/matching";
import { useStore } from "../../stato/contesto";
import { EVOLUZIONE, FLUSSO, FLUSSO_LATERALE, MODELLI, MOTTO, NON_FA_MAI, ORIGINE_NUMERI, TITOLI_SCHEDA_MODELLO as T, type IdModello } from "../../testi/ai";
import { G } from "../../testi/glossario";
import { PochiDati, Simulato, Testata } from "../../componenti/comuni";
import { BarraPunteggio, PannelloPesi, useAbbinamentoGiovanni } from "../hub/PropostaSede";
import { GrafoBayes } from "./GrafoBayes";

const NOMI_VISTE = { mappa: "alla mappa", hub: "alla vista Hub", spoke: "alla vista Spoke", paziente: "alla vista Paziente", ai: "", racconto: "al racconto" } as const;

/** Schema del flusso: riquadri cliccabili, ramo laterale (Markov) e ciclo di ritorno (esito → modelli). */
function Flusso() {
  const { st, d } = useStore();
  const BW = 196;
  const BH = 86;
  const GAP = 26;
  const x = (i: number) => 10 + i * (BW + GAP);
  const Y1 = 14;
  const Y2 = 150;
  const Y3 = 270;
  const W = x(FLUSSO.length - 1) + BW + 10;
  const box = (key: string, bx: number, by: number, testo: string, modello: IdModello | null, cls = "") => (
    <g
      key={key}
      transform={`translate(${bx} ${by})`}
      className={`box-flusso ${cls} ${modello ? "cliccabile" : ""} ${modello && st.ai.modello === modello ? "attivo" : ""}`}
      onClick={modello ? () => d({ t: "ai", patch: { modello } }) : undefined}
      role={modello ? "button" : undefined}
      tabIndex={modello ? 0 : undefined}
      onKeyDown={modello ? (e) => (e.key === "Enter" || e.key === " ") && d({ t: "ai", patch: { modello } }) : undefined}
      data-testid={`flusso-${key}`}
    >
      <rect width={BW} height={BH} rx={12} />
      <foreignObject x={8} y={6} width={BW - 16} height={BH - 12}>
        <div className="testo-box">{testo}</div>
      </foreignObject>
    </g>
  );
  const cx = (i: number) => x(i) + BW / 2;
  return (
    <svg viewBox={`0 0 ${W} ${Y3 + BH + 10}`} className="flusso" role="img" aria-label="Schema del flusso del sistema" data-testid="flusso">
      <defs>
        <marker id="fr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#5a6b80" />
        </marker>
      </defs>
      {FLUSSO.slice(0, -1).map((_, i) => (
        <line key={i} x1={x(i) + BW} y1={Y1 + BH / 2} x2={x(i + 1) - 3} y2={Y1 + BH / 2} className="freccia" markerEnd="url(#fr)" />
      ))}
      {/* ramo laterale: Markov → rapidità di accesso (punteggio) e mappa */}
      <line x1={cx(4)} y1={Y2} x2={cx(4)} y2={Y1 + BH + 3} className="freccia laterale" markerEnd="url(#fr)" />
      <line x1={x(4) + BW} y1={Y2 + BH / 2} x2={x(5) - 3} y2={Y2 + BH / 2} className="freccia laterale" markerEnd="url(#fr)" />
      <text x={cx(4) + 8} y={Y1 + BH + 30} className="nota-freccia">
        rapidità di accesso
      </text>
      {/* ciclo di ritorno: scelta → esito → aggiorna i modelli → bayes e simili */}
      <path d={`M${cx(7)},${Y1 + BH} L${cx(7)},${Y3 - 3}`} className="freccia ritorno" markerEnd="url(#fr)" />
      <path d={`M${x(7)},${Y3 + BH / 2} L${x(1) + 2 * BW + GAP + 3},${Y3 + BH / 2}`} className="freccia ritorno" markerEnd="url(#fr)" />
      <path d={`M${cx(1)},${Y3} L${cx(1)},${Y1 + BH + 3}`} className="freccia ritorno" markerEnd="url(#fr)" />
      <path d={`M${cx(2)},${Y3} L${cx(2)},${Y1 + BH + 3}`} className="freccia ritorno" markerEnd="url(#fr)" />
      {FLUSSO.map((f, i) => box(f.id, x(i), Y1, f.testo, f.modello, i >= 5 ? "umano" : ""))}
      {box("markov", x(4), Y2, FLUSSO_LATERALE.markov, "markov", "laterale")}
      {box("mappa", x(5), Y2, FLUSSO_LATERALE.mappa, null, "laterale")}
      {box("esito", x(7), Y3, FLUSSO_LATERALE.esito, null, "ritorno")}
      <g transform={`translate(${x(1)} ${Y3})`} className="box-flusso ritorno largo">
        <rect width={2 * BW + GAP} height={BH} rx={12} />
        <foreignObject x={8} y={6} width={2 * BW + GAP - 16} height={BH - 12}>
          <div className="testo-box">{FLUSSO_LATERALE.aggiorna}</div>
        </foreignObject>
      </g>
    </svg>
  );
}

function SchedaModello({ id, esempio }: { id: IdModello; esempio: ReactNode }) {
  const { st } = useStore();
  const m = MODELLI[id];
  const rif = useRef<HTMLElement>(null);
  const attivo = st.ai.modello === id;
  useEffect(() => {
    if (attivo) rif.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [attivo]);
  return (
    <article ref={rif} className={`card scheda-modello ${attivo ? "attivo" : ""}`} data-testid={`modello-${id}`}>
      <h2>{m.nome}</h2>
      <dl>
        <dt>{T.aCosaServe}</dt>
        <dd>{m.aCosaServe}</dd>
        <dt>{T.ingressi}</dt>
        <dd>
          <ul>
            {m.ingressi.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </dd>
        <dt>{T.restituisce}</dt>
        <dd>{m.restituisce}</dd>
        <dt>{T.chiLoVede}</dt>
        <dd>{m.chiLoVede}</dd>
        <dt>{T.nonFa}</dt>
        <dd className="non-fa">{m.nonFa}</dd>
        <dt>{T.limiti}</dt>
        <dd>
          <ul>
            {m.limiti.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </dd>
      </dl>
      <div className="esempio" data-testid={`esempio-${id}`}>
        <b>
          {T.esempio} <Simulato />
        </b>
        {esempio}
      </div>
    </article>
  );
}

export default function VistaAi() {
  const { st, d } = useStore();
  const abb = useAbbinamentoGiovanni();
  const prima = abb.ordinate[0];
  const struttura = prima?.struttura.id ?? "schiavonia";
  const r = rischioPerStruttura(GIOVANNI.profilo, GIOVANNI.comune, struttura);
  const esp = esperienzaPerStruttura(GIOVANNI.profilo);
  const ritorno = st.ai.ritorno;

  return (
    <section className="scena vista-ruolo vista-ai" data-vista="ai">
      <Testata
        chi="Come ragiona il sistema · per la giuria e i clinici"
        titolo={MOTTO}
        frase="Cosa fa l'intelligenza artificiale, con quali dati, e cosa non fa."
        destra={
          ritorno ? (
            <button className="btn btn-pieno" onClick={() => d({ t: "torna" })} data-testid="torna">
              <ArrowLeft size={22} aria-hidden="true" /> Torna {NOMI_VISTE[ritorno.vista]}
            </button>
          ) : undefined
        }
      />

      <div className="card">
        <h2>Il flusso, dal profilo alla scelta del paziente</h2>
        <Flusso />
        <p className="muted piccolo" style={{ margin: "4px 0 0" }}>
          Clic su un riquadro colorato: si apre la scheda del modello. I riquadri a destra sono persone: il sistema si ferma alla proposta.
        </p>
      </div>

      <div className="griglia g-6-6 schede-modelli">
        <SchedaModello
          id="bayes"
          esempio={
            <>
              <span>
                A {strutturaPerId(struttura).nome}: {fraseRischio(r.rischio)}
              </span>
              <ul>
                {r.fattori.map((f) => (
                  <li key={f.nodo}>{fraseFattore(f)}</li>
                ))}
              </ul>
            </>
          }
        />
        <SchedaModello
          id="simili"
          esempio={
            <ul>
              {esp.map((e) => (
                <li key={e.struttura}>
                  {strutturaPerId(e.struttura).nome}: {e.n} {G.simili}, senza rientro {percento(e.senzaRientro)}
                  {e.pochiDati && <PochiDati />}
                </li>
              ))}
            </ul>
          }
        />
        <SchedaModello id="abbinamento" esempio={<span data-testid="frase-abbinamento">{prima ? prima.frase : "Nessuna struttura con requisiti e posti."}</span>} />
        <SchedaModello
          id="markov"
          esempio={
            <ul>
              {["schiavonia", "piove"].map((s) => (
                <li key={s}>
                  {strutturaPerId(s).nome}:{" "}
                  {Array.from({ length: MESI_PREVISIONE }, (_, i) => i + 1)
                    .map((m) => `${nomeMese(aggiungiMesi(OGGI_DEMO, m))} ${percento(probSuperamento(s, postiMese(st.posti[s]?.dichiarati ?? 0), m))}`)
                    .join(" · ")}
                </li>
              ))}
            </ul>
          }
        />
      </div>

      <div className={`card ${st.ai.modello === "bayes" ? "attivo-bordo" : ""}`}>
        <h2>La rete bayesiana, disegnata dalla stessa struttura dati del calcolo</h2>
        <GrafoBayes struttura={struttura} />
      </div>

      <div className="griglia g-6-6">
        <PannelloPesi />
        <div className="card" data-testid="classifica-esempio">
          <h2>Classifica d'esempio per Giovanni, dal vivo</h2>
          <ol className="classifica-mini">
            {abb.ordinate.map((c) => (
              <li key={c.struttura.id}>
                <span className="nome">{c.struttura.nome}</span>
                <BarraPunteggio c={c} />
                <b>{Math.round(c.punteggio * 100)}</b>
              </li>
            ))}
          </ol>
          {abb.escluse.length > 0 && <p className="muted piccolo">Escluse con motivo: {abb.escluse.map((e) => `${e.struttura.nome} (${e.motivo})`).join("; ")}.</p>}
        </div>
      </div>

      <div className="griglia g-6-6">
        <div className="card">
          <h2>
            <Ban size={22} aria-hidden="true" /> Cosa il sistema non fa mai
          </h2>
          <ul className="lista-forte">
            {NON_FA_MAI.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2>
            <Database size={22} aria-hidden="true" /> Da dove vengono i numeri
          </h2>
          <p>
            <b>{ORIGINE_NUMERI.demo}</b>
          </p>
          <p style={{ margin: "6px 0 4px" }}>In un pilota verrebbero da:</p>
          <ul>
            {ORIGINE_NUMERI.pilota.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card evoluzione">
        <h2>
          <Sparkles size={22} aria-hidden="true" /> Evoluzione <span className="badge-dato dedotto">futura, non in questa demo</span>
        </h2>
        <ul>
          {EVOLUZIONE.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
