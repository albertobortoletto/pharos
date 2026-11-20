// Vista SPOKE: la fisiatra di Schiavonia. Richieste in arrivo, posti dichiarati, pazienti in carico, parere, esito.
import { useState } from "react";
import { Check, FileText, Minus, Plus, RotateCcw, Send, X } from "lucide-react";
import { PARAMETRI, prestazione } from "../../data/pdta";
import { strutturaPerId } from "../../data/strutture";
import { SEDUTE_RIABILITAZIONE } from "../../data/tratte";
import { CONDIZIONI_RIENTRO, DOCUMENTI_FSE, MOTIVI_SERVE_HUB, MOTIVI_SPOKE, QUESITI_PARERE } from "../../data/motivi";
import { UROLOGIA_HUB } from "../../data/persone";
import { pazientePerId } from "../../data/pazienti";
import { dataBreve } from "../../engine/date";
import { dataDaOra } from "../../engine/orologio";
import { NOME_STATO, type Scheda } from "../../engine/scheda";
import { useStore } from "../../stato/contesto";
import { CONDIZIONI_RIENTRO_PREDEFINITE, ID_SCHEDA_GIOVANNI, postiLiberi, puoRegistrareSeduta, serveControllo } from "../../stato/store";
import { Simulato, Testata } from "../../componenti/comuni";
import { SchedaRischio } from "../../componenti/rischio";
import { Timer } from "../../componenti/timer";
import { G } from "../../testi/glossario";

const SPOKE = "schiavonia";
const IN_CARICO = ["ACCETTATA", "PRENOTATA", "IN_CORSO", "ESITO_ATTESO", "ESITO_RICEVUTO", "RIENTRO"];
const testoMotivo = (elenco: { id: string; testo: string }[], id: string | null) => elenco.find((m) => m.id === id)?.testo ?? id ?? "";

function Richiesta({ s }: { s: Scheda }) {
  const { st, d } = useStore();
  const [motivo, setMotivo] = useState(false);
  const p = pazientePerId(s.paziente);
  const struttura = strutturaPerId(s.struttura);
  const liberi = postiLiberi(st, s.struttura);
  const condizioni = s.id === ID_SCHEDA_GIOVANNI ? st.giovanni.condizioniRientro : CONDIZIONI_RIENTRO_PREDEFINITE;
  const inizio = s.dataPrenotata ?? struttura.prima_data_utile ?? dataDaOra(st.ora);
  return (
    <article className="card richiesta" data-testid={`richiesta-${s.paziente}`}>
      <header className="ric-testa">
        <div>
          <h3>
            {p.nome}, {p.eta} anni · {p.comune}
          </h3>
          <span className="muted">{prestazione(s.prestazione).nome}</span>
        </div>
        <div className="ric-timer">
          <small>Lo spoke deve rispondere</small>
          <Timer scadenza={s.scadenza} ora={st.ora} />
          {s.escalation && <span className="badge-dato pochi">al coordinatore del GOM</span>}
        </div>
      </header>
      <div className="ric-corpo">
        <dl className="scheda-minima">
          <dt>Sedute</dt>
          <dd>{SEDUTE_RIABILITAZIONE}</dd>
          <dt>Inizio</dt>
          <dd>
            dal {dataBreve(inizio)}, entro {PARAMETRI.attesa_max_spoke_giorni} giorni
          </dd>
          <dt>Rientro all'hub se</dt>
          <dd>
            <ul>
              {condizioni.map((c) => (
                <li key={c}>{testoMotivo(CONDIZIONI_RIENTRO, c)}</li>
              ))}
            </ul>
            <small className="muted">scritte dall'urologo · parere o rientro: {UROLOGIA_HUB.telefono} (fittizio)</small>
          </dd>
          <dt>Documenti</dt>
          <dd className="documenti">
            {DOCUMENTI_FSE.map((x) => (
              <span key={x} className="doc">
                <FileText size={16} aria-hidden="true" /> {x} <small>documento nel FSE</small>
              </span>
            ))}
          </dd>
        </dl>
        <div>
          <SchedaRischio profilo={p.profilo} comune={p.comune} struttura={s.struttura} compatta />
          <small className="muted">Questo numero lo vede anche l'hub. Il paziente no.</small>
        </div>
      </div>
      {!motivo ? (
        <div className="azioni destra">
          <button className="btn btn-vuoto" onClick={() => setMotivo(true)} data-testid="spoke-non-posso">
            Non posso (motivo)
          </button>
          <button className="btn btn-pieno spoke" disabled={liberi <= 0} onClick={() => d({ t: "spoke_accetta", scheda: s.id })} data-testid="spoke-prendo">
            <Check size={22} aria-hidden="true" /> Prendo in carico
          </button>
        </div>
      ) : (
        <div className="motivi tre" role="dialog" aria-label="Motivo del rifiuto">
          <p>Perché lo spoke non può? Il motivo viene registrato.</p>
          <ul>
            {MOTIVI_SPOKE.filter((m) => !(m.id === "posti_esauriti" && liberi > 0)).map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => {
                    d({ t: "spoke_rifiuta", scheda: s.id, motivo: m.id });
                    setMotivo(false);
                  }}
                >
                  {m.testo}
                </button>
              </li>
            ))}
          </ul>
          <button className="btn-link" onClick={() => setMotivo(false)}>
            <X size={18} style={{ verticalAlign: "-3px" }} /> Annulla
          </button>
        </div>
      )}
      {liberi <= 0 && !motivo && <p className="avviso-posti">Posti della settimana esauriti: aumenta i {G.posti} o rispondi «Non posso».</p>}
    </article>
  );
}

function RichiestaParere({ s, chiudi }: { s: Scheda; chiudi: () => void }) {
  const { d } = useStore();
  const [quesito, setQuesito] = useState(QUESITI_PARERE[0].id);
  const [testo, setTesto] = useState("");
  const [urgente, setUrgente] = useState(false);
  const max = PARAMETRI.quesito_max_caratteri;
  return (
    <div className="motivi parere-form" role="dialog" aria-label="Richiesta di parere all'hub">
      <p>Richiedi il {G.parere}</p>
      <ul>
        {QUESITI_PARERE.map((q) => (
          <li key={q.id}>
            <button className={quesito === q.id ? "scelto" : ""} onClick={() => setQuesito(q.id)} aria-pressed={quesito === q.id}>
              {q.testo}
            </button>
          </li>
        ))}
      </ul>
      <label className="campo">
        <span>
          Nota breve (facoltativa) · {testo.length}/{max}
        </span>
        <textarea value={testo} maxLength={max} rows={2} onChange={(e) => setTesto(e.target.value.slice(0, max))} />
      </label>
      <label className="spunta">
        <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} /> Urgente: risposta entro {PARAMETRI.parere_urgente_ore} ore
        (altrimenti {PARAMETRI.parere_giorni_lavorativi} giorni lavorativi)
      </label>
      <div className="azioni destra">
        <button className="btn-link" onClick={chiudi}>
          Annulla
        </button>
        <button
          className="btn btn-pieno spoke"
          onClick={() => {
            d({ t: "chiedi_parere", scheda: s.id, quesito, testo, urgente });
            chiudi();
          }}
          data-testid="invia-parere"
        >
          <Send size={20} aria-hidden="true" /> Invia all'hub
        </button>
      </div>
    </div>
  );
}

function InCarico({ s }: { s: Scheda }) {
  const { st, d } = useStore();
  const [parere, setParere] = useState(false);
  const p = pazientePerId(s.paziente);
  const n = st.sedute[s.id] ?? 0;
  const controllo = serveControllo(st, s.id);
  const pareri = st.pareri.filter((x) => x.scheda === s.id);
  const aperto = pareri.find((x) => x.risposta === null);
  const puoSeduta = (s.stato === "PRENOTATA" || s.stato === "IN_CORSO") && puoRegistrareSeduta(st, s.id);
  const bloccato = st.controlli[s.id] === "no" && !aperto;
  return (
    <article className={`card in-carico stato-${s.stato.toLowerCase()}`} data-testid={`in-carico-${s.paziente}`}>
      <header className="ric-testa">
        <div>
          <h3>
            {p.nome} · {p.comune}
          </h3>
          <span className="stato-scheda">{NOME_STATO[s.stato]}</span>
          {s.dataPrenotata && s.stato === "PRENOTATA" && <span className="muted"> · 1ª seduta {dataBreve(s.dataPrenotata)}</span>}
        </div>
        {s.stato === "ESITO_ATTESO" && (
          <div className="ric-timer">
            <small>Esito da inviare</small>
            <Timer scadenza={s.scadenza} ora={st.ora} />
          </div>
        )}
      </header>
      <div className="sedute" aria-label={`Sedute: ${n} di ${SEDUTE_RIABILITAZIONE}`}>
        {Array.from({ length: SEDUTE_RIABILITAZIONE }, (_, i) => (
          <span key={i} className={`${i < n ? "fatta" : ""} ${i + 1 === PARAMETRI.seduta_controllo ? "controllo" : ""}`} title={i + 1 === PARAMETRI.seduta_controllo ? "Controllo obbligatorio" : undefined}>
            {i + 1}
          </span>
        ))}
        <b>
          {n}/{SEDUTE_RIABILITAZIONE}
        </b>
      </div>

      {controllo && (
        <div className="controllo-box" data-testid="controllo">
          <b>Seduta {PARAMETRI.seduta_controllo}: c'è miglioramento?</b>
          <div className="azioni">
            <button className="btn btn-pieno spoke" onClick={() => d({ t: "controllo_miglioramento", scheda: s.id, esito: "si" })} data-testid="controllo-si">
              Sì, si continua
            </button>
            <button
              className="btn btn-vuoto"
              onClick={() => {
                d({ t: "controllo_miglioramento", scheda: s.id, esito: "no" });
                setParere(true);
              }}
              data-testid="controllo-no"
            >
              No: chiedo il parere
            </button>
          </div>
        </div>
      )}
      {(parere || bloccato) && !aperto && <RichiestaParere s={s} chiudi={() => setParere(false)} />}

      {pareri.map((x) => (
        <div key={x.id} className={`parere-riga ${x.risposta ? "risposto" : ""}`}>
          <span>
            <b>Parere:</b> {testoMotivo(QUESITI_PARERE, x.quesito)}
            {x.urgente && <span className="badge-dato pochi">urgente</span>}
          </span>
          {x.risposta === null ? (
            <span>
              Risposta dell'hub <Timer scadenza={x.scadenza} ora={st.ora} />
              {x.escalation && <span className="badge-dato pochi">al coordinatore del GOM</span>}
            </span>
          ) : (
            <span className="risposta">
              {x.risposta.tipo === "continua" && "L'hub risponde: continua"}
              {x.risposta.tipo === "continua_modifiche" && `L'hub risponde: continua con modifiche («${x.risposta.testo}»)`}
              {x.risposta.tipo === "serve_hub" && `Serve l'hub: ${testoMotivo(MOTIVI_SERVE_HUB, x.risposta.motivo)}, ${dataBreve(x.risposta.dataSlot)}`}
            </span>
          )}
        </div>
      ))}

      {s.stato === "RIENTRO" && <p className="esito-riga hub">Rientro all'hub con priorità: la fase non è più dello spoke.</p>}
      {s.stato === "ESITO_RICEVUTO" && <p className="esito-riga">Esito inviato all'hub. La fase si chiude all'hub.</p>}
      {s.solleciti > 0 && s.stato === "ESITO_ATTESO" && (
        <p className="esito-riga allarme" data-testid="sollecito">
          Sollecito automatico: l'esito era atteso. {s.escalation ? "Avvisato il coordinatore del GOM." : ""}
        </p>
      )}

      <div className="azioni destra">
        {aperto && st.controlli[s.id] === "no" && <p className="attesa-parere">Le sedute riprendono quando l'hub risponde.</p>}
        {!aperto && (s.stato === "IN_CORSO" || s.stato === "PRENOTATA") && !controllo && !bloccato && (
          <button className="btn-link" onClick={() => setParere(true)}>
            Richiedi parere all'hub
          </button>
        )}
        {(s.stato === "PRENOTATA" || s.stato === "IN_CORSO") && (
          <button className="btn btn-vuoto" disabled={!puoSeduta} onClick={() => d({ t: "registra_seduta", scheda: s.id })} data-testid={`seduta-${s.paziente}`}>
            <Plus size={20} aria-hidden="true" /> Registra seduta {Math.min(n + 1, SEDUTE_RIABILITAZIONE)}
          </button>
        )}
        {s.stato === "ESITO_ATTESO" && (
          <button className="btn btn-pieno spoke" onClick={() => d({ t: "invia_esito", scheda: s.id })} data-testid={`esito-${s.paziente}`}>
            <Send size={20} aria-hidden="true" /> Invia esito all'hub
          </button>
        )}
      </div>
    </article>
  );
}

function PostiDichiarati() {
  const { st, d } = useStore();
  const p = st.posti[SPOKE];
  const iniziali = strutturaPerId(SPOKE).posti_settimana ?? 0;
  const liberi = postiLiberi(st, SPOKE);
  return (
    <div className={`card posti-card ${liberi <= 0 ? "esauriti" : ""}`} data-testid="posti-card">
      <h2>
        {G.posti[0].toUpperCase() + G.posti.slice(1)} <Simulato />
      </h2>
      <p className="muted" style={{ margin: "0 0 10px" }}>
        {prestazione("riabilitazione_pavimento_pelvico").nome}, posti a settimana
      </p>
      <div className="contatore-posti">
        <button className="btn btn-vuoto tondo" onClick={() => d({ t: "posti_dichiarati", struttura: SPOKE, n: p.dichiarati - 1 })} aria-label="Un posto in meno" data-testid="posti-meno">
          <Minus size={22} />
        </button>
        <label>
          <input
            type="number"
            min={0}
            max={30}
            value={p.dichiarati}
            onChange={(e) => d({ t: "posti_dichiarati", struttura: SPOKE, n: Number(e.target.value) })}
            aria-label="Posti dichiarati a settimana"
            data-testid="posti-input"
          />
          <small>dichiarati</small>
        </label>
        <button className="btn btn-vuoto tondo" onClick={() => d({ t: "posti_dichiarati", struttura: SPOKE, n: p.dichiarati + 1 })} aria-label="Un posto in più" data-testid="posti-piu">
          <Plus size={22} />
        </button>
      </div>
      <div className="posti-conti">
        <span>
          Presi in carico <b>{p.occupati}</b>
        </span>
        <span>
          Liberi{" "}
          <b data-testid="posti-liberi-spoke" key={liberi} className="cambia">
            {liberi}
          </b>
        </span>
      </div>
      {liberi <= 0 ? (
        <p className="avviso-posti">Posti esauriti: Schiavonia non compare più nelle proposte dell'hub.</p>
      ) : (
        <p className="muted piccolo">Il contatore scende a ogni presa in carico. A zero, Schiavonia sparisce dalle proposte dell'hub.</p>
      )}
      {p.dichiarati !== iniziali && (
        <button className="btn-link" onClick={() => d({ t: "posti_ripristina", struttura: SPOKE })} data-testid="posti-ripristina">
          <RotateCcw size={16} style={{ verticalAlign: "-2px" }} /> Ripristina i posti dichiarati ({iniziali})
        </button>
      )}
    </div>
  );
}

export default function VistaSpoke() {
  const { st } = useStore();
  const mie = st.schede.filter((s) => s.struttura === SPOKE);
  const richieste = mie.filter((s) => s.stato === "INVIATA").sort((a, b) => (a.scadenza ?? 0) - (b.scadenza ?? 0));
  const inCarico = mie.filter((s) => IN_CARICO.includes(s.stato)).sort((a, b) => Number(b.id === ID_SCHEDA_GIOVANNI) - Number(a.id === ID_SCHEDA_GIOVANNI));
  return (
    <section className="scena vista-ruolo" data-vista="spoke">
      <Testata
        chi="Fisiatra · Spoke di Schiavonia"
        titolo="Richieste e pazienti in carico"
        frase={`Ogni richiesta ha ${PARAMETRI.risposta_spoke_ore} ore per una risposta. La fase diventa dello spoke solo con «Prendo in carico».`}
      />
      <div className="griglia g-8-4">
        <div className="colonna">
          <h2 className="titolo-col">
            Richieste di {G.presaInCarico} in arrivo <span className="conta">{richieste.length}</span>
          </h2>
          {richieste.length === 0 && <p className="vuoto">Nessuna richiesta in attesa.</p>}
          {richieste.map((s) => (
            <Richiesta key={s.id} s={s} />
          ))}
          <h2 className="titolo-col">
            Pazienti in carico <span className="conta">{inCarico.length}</span>
          </h2>
          {inCarico.map((s) => (
            <InCarico key={s.id} s={s} />
          ))}
        </div>
        <div className="colonna">
          <PostiDichiarati />
          <div className="card nota-spoke">
            <h2>Cosa resta all'hub</h2>
            <p>Controllo urologico con l'esame istologico, percorso oncologico, {G.parere} e {G.rientro}.</p>
            <p className="muted piccolo">
              Parere: entro {PARAMETRI.parere_giorni_lavorativi} giorni lavorativi, {PARAMETRI.parere_urgente_ore} ore se urgente. Rientro con priorità entro{" "}
              {PARAMETRI.rientro_priorita_giorni} giorni.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
