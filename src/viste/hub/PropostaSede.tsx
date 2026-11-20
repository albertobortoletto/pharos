// Proposta di sede (evoluzione della scena 2): strutture ordinate con punteggio scomposto, esclusioni con motivo,
// rischio di rientro, conto del viaggio e decisione dell'urologo. Il sistema propone, il medico decide.
import { useMemo, useState } from "react";
import { Check, CircleSlash, Hospital, ListChecks, RotateCcw, SlidersHorizontal, Undo2, X } from "lucide-react";
import { ESTRAZIONE } from "../../data/lettera";
import { prestazione } from "../../data/pdta";
import { GIOVANNI } from "../../data/persone";
import { strutturaPerId } from "../../data/strutture";
import { CONDIZIONI_RIENTRO, MOTIVI_HUB, MOTIVI_SPOKE } from "../../data/motivi";
import { NOMI_PESI, PESI_PREDEFINITI, NOTA_PESI, type Pesi } from "../../data/pesi";
import { abbina, type Abbinamento, type Candidato } from "../../engine/matching";
import { livelloSaturazione } from "../../engine/markov";
import { percento } from "../../engine/spiegazioni";
import { NOME_STATO, STATI_PRESA_IN_CARICO } from "../../engine/scheda";
import { useStore } from "../../stato/contesto";
import { postiLiberi, schedaGiovanni } from "../../stato/store";
import { G } from "../../testi/glossario";
import { MOTTO } from "../../testi/ai";
import { PochiDati, Simulato } from "../../componenti/comuni";
import { ComeCalcolato, SchedaRischio } from "../../componenti/rischio";
import { Timer } from "../../componenti/timer";
import { ContoViaggioTabella } from "../../racconto/Scena2Sede";

const VOCI = ["rischio", "esperienza", "vicinanza", "rapidita"] as const;
const testo = (elenco: { id: string; testo: string }[], id: string | null) => elenco.find((m) => m.id === id)?.testo ?? id ?? "";
const FASI = ESTRAZIONE.righe.filter((r) => r.tipo === "fase" && r.prestazione);
const ETICHETTE_PDTA = { spoke: "delegabile allo spoke", solo_hub: "solo all'hub", spoke_con_parere_hub: "allo spoke con parere dell'hub" } as const;

/** L'abbinamento di Giovanni con i posti e i pesi dello store: lo usano anche la mappa e la vista Paziente. */
export function useAbbinamentoGiovanni() {
  const { st } = useStore();
  return useMemo(
    () =>
      abbina({
        prestazione: "riabilitazione_pavimento_pelvico",
        profilo: GIOVANNI.profilo,
        comune: GIOVANNI.comune,
        postiLiberi: (id) => postiLiberi(st, id),
        postiDichiarati: (id) => st.posti[id]?.dichiarati ?? 0,
        pesi: st.pesi,
      }),
    [st.posti, st.pesi],
  );
}

export function BarraPunteggio({ c }: { c: Candidato }) {
  return (
    <div className="barra-punteggio" role="img" aria-label={`Punteggio ${Math.round(c.punteggio * 100)} su 100`}>
      {VOCI.map((v) => (
        <i key={v} className={`voce-${v}`} style={{ width: `${c.contributi[v] * 100}%` }} title={`${NOMI_PESI[v]}: ${Math.round(c.contributi[v] * 100)} punti`} />
      ))}
    </div>
  );
}

function CartaCandidato({ c, i }: { c: Candidato; i: number }) {
  const sat = livelloSaturazione(c.saturazione);
  return (
    <li className={`candidato ${i === 0 ? "primo" : ""}`} data-testid={`candidato-${c.struttura.id}`}>
      <span className="rango">{i + 1}</span>
      <div className="cand-corpo">
        <div className="cand-testa">
          <h3>
            {c.struttura.nome}
            {i === 0 && <span className="etichetta-prima">1ª scelta proposta</span>}
          </h3>
          <span className="punteggio">
            {Math.round(c.punteggio * 100)}
            <small>/100</small>
          </span>
        </div>
        <BarraPunteggio c={c} />
        <p className="frase-dati">{c.frase}</p>
        <div className="cand-dettagli">
          {c.esperienza ? (
            <span>
              Senza rientro {percento(c.esperienza.senzaRientro)} dei {G.simili}
              {c.esperienza.pochiDati && <PochiDati />}
            </span>
          ) : (
            <span>
              Nessun caso simile trattato <PochiDati />
            </span>
          )}
          <span className={`sat sat-${sat}`}>
            {G.previsione}: {percento(c.saturazione)} di superare i posti il mese prossimo
          </span>
        </div>
      </div>
    </li>
  );
}

export function PannelloPesi() {
  const { st, d } = useStore();
  const cambia = (k: keyof Pesi, v: number) => d({ t: "pesi", pesi: { ...st.pesi, [k]: v } });
  const predefiniti = VOCI.every((v) => st.pesi[v] === PESI_PREDEFINITI[v]);
  return (
    <div className="card pesi-card" data-testid="pannello-pesi">
      <h2>
        <SlidersHorizontal size={22} aria-hidden="true" /> Pesi del {G.punteggio}
      </h2>
      <p className="nota-pesi">{NOTA_PESI}</p>
      {VOCI.map((v) => (
        <label key={v} className="peso">
          <span>
            <i className={`pallino-voce voce-${v}`} /> {NOMI_PESI[v]}
          </span>
          <input type="range" min={0} max={1} step={0.05} value={st.pesi[v]} onChange={(e) => cambia(v, Number(e.target.value))} data-testid={`peso-${v}`} />
          <b>{Math.round(st.pesi[v] * 100)}</b>
        </label>
      ))}
      <div className="azioni" style={{ justifyContent: "space-between" }}>
        <ComeCalcolato modello="abbinamento" />
        {!predefiniti && (
          <button className="btn-link" onClick={() => d({ t: "pesi", pesi: PESI_PREDEFINITI })}>
            <RotateCcw size={16} style={{ verticalAlign: "-2px" }} /> Pesi predefiniti
          </button>
        )}
      </div>
    </div>
  );
}

function Decisione({ ordinate }: { ordinate: Candidato[] }) {
  const { st, d } = useStore();
  const [pannello, setPannello] = useState<null | "resta" | "condizioni">(null);
  const prima = ordinate[0];
  const altre = ordinate.slice(1);
  const [seconda, setSeconda] = useState<string | null>(altre[0]?.struttura.id ?? null);
  const secondaValida = altre.some((c) => c.struttura.id === seconda) ? seconda : null;
  const cond = st.giovanni.condizioniRientro;
  return (
    <div className="card decisione" data-testid="decisione">
      <h2>Decisione dell'urologo</h2>
      <p className="motto">{MOTTO}</p>
      {prima ? (
        <>
          <div className="seconda">
            <span>Seconda opzione, se la prima non può:</span>
            {altre.map((c) => (
              <button key={c.struttura.id} className={`scelta ${secondaValida === c.struttura.id ? "scelto" : ""}`} onClick={() => setSeconda(c.struttura.id)} aria-pressed={secondaValida === c.struttura.id}>
                {c.struttura.nome}
              </button>
            ))}
            <button className={`scelta ${secondaValida === null ? "scelto" : ""}`} onClick={() => setSeconda(null)} aria-pressed={secondaValida === null}>
              nessuna
            </button>
          </div>
          <div className="azioni">
            <button className="btn btn-pieno" onClick={() => d({ t: "proponi_giovanni", struttura: prima.struttura.id, seconda: secondaValida })} data-testid="approva-prima">
              <Check size={22} aria-hidden="true" /> Approva: {prima.struttura.nome}
              {secondaValida && <small className="sotto-btn">2ª: {strutturaPerId(secondaValida).nome}</small>}
            </button>
            <button className="btn btn-vuoto" onClick={() => setPannello(pannello === "resta" ? null : "resta")} data-testid="resta-hub">
              <Hospital size={20} aria-hidden="true" /> Resta all'hub (motivo)
            </button>
            <button className="btn-link" onClick={() => setPannello(pannello === "condizioni" ? null : "condizioni")} data-testid="modifica-condizioni">
              <ListChecks size={18} style={{ verticalAlign: "-3px" }} /> Modifica le condizioni di rientro ({cond.length})
            </button>
          </div>
        </>
      ) : (
        <p className="avviso-posti">Nessuna struttura ha requisiti e posti questa settimana: la fase resta all'hub o si aspetta che uno spoke dichiari posti.</p>
      )}
      {pannello === "resta" && (
        <div className="motivi tre" role="dialog" aria-label="Motivo per restare all'hub">
          <p>Perché resta all'hub? Il motivo viene registrato.</p>
          <ul>
            {MOTIVI_HUB.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => {
                    d({ t: "resta_hub", motivo: m.id });
                    setPannello(null);
                  }}
                >
                  {m.testo}
                </button>
              </li>
            ))}
          </ul>
          <button className="btn-link" onClick={() => setPannello(null)}>
            <X size={18} style={{ verticalAlign: "-3px" }} /> Annulla
          </button>
        </div>
      )}
      {pannello === "condizioni" && (
        <div className="motivi" role="dialog" aria-label="Condizioni di rientro">
          <p>Condizioni di rientro all'hub (le vede lo spoke nella scheda)</p>
          <ul>
            {CONDIZIONI_RIENTRO.map((c) => {
              const on = cond.includes(c.id);
              return (
                <li key={c.id}>
                  <button className={on ? "scelto" : ""} aria-pressed={on} onClick={() => d({ t: "condizioni_rientro", lista: on ? cond.filter((x) => x !== c.id) : [...cond, c.id] })}>
                    {on ? "✓ " : ""}
                    {c.testo}
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="btn-link" onClick={() => setPannello(null)}>
            Fatto
          </button>
        </div>
      )}
    </div>
  );
}

function StatoProposta() {
  const { st, d } = useStore();
  const s = schedaGiovanni(st);
  const nome = strutturaPerId(s.struttura).nome;
  if (s.stato === "BOZZA") return null;
  const annulla = (
    <button className="btn-link" onClick={() => d({ t: "annulla_sede" })} data-testid="annulla-proposta">
      <Undo2 size={16} style={{ verticalAlign: "-2px" }} /> Annulla la scelta (demo)
    </button>
  );
  if (s.stato === "INVIATA")
    return (
      <div className="esito hub stato-proposta" data-testid="stato-proposta">
        <div>
          <b>Proposta inviata a {nome}. Ora tocca allo spoke accettare.</b>
          Fino ad allora Giovanni resta in carico all'hub. <Timer scadenza={s.scadenza} ora={st.ora} />
          {st.giovanni.seconda && <> · 2ª opzione pronta: {strutturaPerId(st.giovanni.seconda).nome}</>}
          <div>{annulla}</div>
        </div>
      </div>
    );
  if (s.stato === "RIFIUTATA")
    return (
      <div className="esito allarme stato-proposta" data-testid="stato-proposta">
        <div>
          <b>
            {nome} non può: «{testo(MOTIVI_SPOKE, s.motivo)}».
          </b>
          Giovanni resta in carico all'hub. Il motivo è registrato.
          <div className="azioni" style={{ marginTop: 8 }}>
            {st.giovanni.seconda && (
              <button className="btn btn-pieno" onClick={() => d({ t: "invia_seconda" })} data-testid="invia-seconda">
                Invia alla 2ª opzione: {strutturaPerId(st.giovanni.seconda).nome}
              </button>
            )}
            {annulla}
          </div>
        </div>
      </div>
    );
  if (s.stato === "ANNULLATA")
    return (
      <div className="esito hub stato-proposta" data-testid="stato-proposta">
        <div>
          <b>La riabilitazione resta all'hub di Padova.</b>
          Motivo: {testo(MOTIVI_HUB, st.giovanni.restaHubMotivo)}. È tra i motivi di rifiuto.
          <div>{annulla}</div>
        </div>
      </div>
    );
  return (
    <div className={`esito ${STATI_PRESA_IN_CARICO.includes(s.stato) ? "spoke" : "hub"} stato-proposta`} data-testid="stato-proposta">
      <div>
        <b>
          {NOME_STATO[s.stato]}: {s.stato === "RIENTRO" ? "Giovanni torna all'hub con priorità." : `ora risponde lo spoke di ${nome}.`}
        </b>
        Controllo urologico e percorso oncologico restano all'hub.
        <div>{annulla}</div>
      </div>
    </div>
  );
}

/** Elenco ordinato + escluse: la stessa scheda di spiegazione in vista Hub e sulla mappa («Perché Schiavonia?»). */
export function ElencoStrutture({ ordinate, escluse }: Abbinamento) {
  return (
    <>
      <h2 className="titolo-col">
        Strutture con requisiti e posti, ordinate <Simulato />
      </h2>
      <div className="legenda-voci">
        {VOCI.map((v) => (
          <span key={v}>
            <i className={`pallino-voce voce-${v}`} /> {NOMI_PESI[v]}
          </span>
        ))}
      </div>
      <ol className="candidati">
        {ordinate.map((c, i) => (
          <CartaCandidato key={c.struttura.id} c={c} i={i} />
        ))}
      </ol>
      {escluse.length > 0 && (
        <div className="escluse" data-testid="escluse">
          <h3>Escluse, con il motivo</h3>
          <ul>
            {escluse.map((e) => (
              <li key={e.struttura.id} data-testid={`esclusa-${e.struttura.id}`}>
                <CircleSlash size={18} aria-hidden="true" /> <b>{e.struttura.nome}</b>: {e.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** Solo per la demo: se uno spoke escluso ha cambiato i posti dichiarati, si ripristinano da qui senza cambiare vista. */
function PostiCambiati({ escluse }: Pick<Abbinamento, "escluse">) {
  const { st, d } = useStore();
  const cambiate = escluse.filter((e) => st.posti[e.struttura.id] && st.posti[e.struttura.id].dichiarati !== e.struttura.posti_settimana);
  if (!cambiate.length) return null;
  return (
    <p className="azioni" style={{ marginTop: 8 }}>
      {cambiate.map((e) => (
        <button key={e.struttura.id} className="btn-link" onClick={() => d({ t: "posti_ripristina", struttura: e.struttura.id })} data-testid={`hub-ripristina-${e.struttura.id}`}>
          <RotateCcw size={16} style={{ verticalAlign: "-2px" }} aria-hidden="true" /> Ripristina i {G.posti} di {e.struttura.nome} ({e.struttura.posti_settimana}) (demo)
        </button>
      ))}
    </p>
  );
}

export function PropostaSede() {
  const { st } = useStore();
  const { ordinate, escluse } = useAbbinamentoGiovanni();
  const s = schedaGiovanni(st);
  const bozza = s.stato === "BOZZA";
  const rischioDi = ordinate[0]?.struttura.id ?? s.struttura;
  return (
    <div className="proposta" data-testid="proposta-sede">
      <div className="fasi-giovanni">
        <span className="muted">Fasi di Giovanni R. dalla lettera:</span>
        {FASI.map((f) => {
          const p = prestazione(f.prestazione!);
          return (
            <span key={f.id} className={`fase-chip ${p.etichetta} ${p.id === s.prestazione ? "attiva" : ""}`}>
              {f.azione} <small>{ETICHETTE_PDTA[p.etichetta]}</small>
            </span>
          );
        })}
      </div>
      <StatoProposta />
      <div className="griglia g-7-5">
        <div className="colonna">
          <ElencoStrutture ordinate={ordinate} escluse={escluse} />
          <PostiCambiati escluse={escluse} />
          {bozza && <Decisione ordinate={ordinate} />}
        </div>
        <div className="colonna">
          <div className="card">
            <h2>
              {G.rischio[0].toUpperCase() + G.rischio.slice(1)} a {strutturaPerId(rischioDi).nome}
            </h2>
            <SchedaRischio profilo={GIOVANNI.profilo} comune={GIOVANNI.comune} struttura={rischioDi} />
          </div>
          <PannelloPesi />
          <div className="card">
            <h2>
              {G.conto[0].toUpperCase() + G.conto.slice(1)} <Simulato />
            </h2>
            <ContoViaggioTabella />
          </div>
        </div>
      </div>
    </div>
  );
}
