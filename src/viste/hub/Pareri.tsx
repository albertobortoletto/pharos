// Pareri in arrivo dallo spoke: coda con conto alla rovescia e risposta in un clic.
import { useState } from "react";
import { Check, Hospital, PenLine } from "lucide-react";
import { PARAMETRI } from "../../data/pdta";
import { strutturaPerId } from "../../data/strutture";
import { pazientePerId } from "../../data/pazienti";
import { MOTIVI_SERVE_HUB, QUESITI_PARERE } from "../../data/motivi";
import { dataBreve, dataLunga } from "../../engine/date";
import { etichettaOraBreve } from "../../engine/orologio";
import { slotRientri, type Parere } from "../../engine/pareri";
import { useStore } from "../../stato/contesto";
import { G } from "../../testi/glossario";
import { Timer } from "../../componenti/timer";

const testo = (elenco: { id: string; testo: string }[], id: string) => elenco.find((m) => m.id === id)?.testo ?? id;
const MAX_MODIFICHE = 120;

function Risposta({ p }: { p: Parere }) {
  const { st, d } = useStore();
  const [modo, setModo] = useState<null | "modifiche" | "serve_hub">(null);
  const [nota, setNota] = useState("");
  const [motivo, setMotivo] = useState<string | null>(null);
  const slot = slotRientri(st.ora, PARAMETRI);
  return (
    <div className="risposta-parere">
      <div className="azioni">
        <button className="btn btn-pieno spoke" onClick={() => d({ t: "rispondi_parere", id: p.id, risposta: { tipo: "continua" } })} data-testid={`continua-${p.paziente}`}>
          <Check size={20} aria-hidden="true" /> Continua
        </button>
        <button className={`btn btn-vuoto ${modo === "modifiche" ? "scelto" : ""}`} onClick={() => setModo(modo === "modifiche" ? null : "modifiche")}>
          <PenLine size={20} aria-hidden="true" /> Continua con modifiche
        </button>
        <button className={`btn btn-vuoto ${modo === "serve_hub" ? "scelto" : ""}`} onClick={() => setModo(modo === "serve_hub" ? null : "serve_hub")} data-testid={`serve-hub-${p.paziente}`}>
          <Hospital size={20} aria-hidden="true" /> Serve l'hub
        </button>
      </div>
      {modo === "modifiche" && (
        <div className="motivi">
          <label className="campo">
            <span>
              Modifica in breve · {nota.length}/{MAX_MODIFICHE}
            </span>
            <input value={nota} maxLength={MAX_MODIFICHE} onChange={(e) => setNota(e.target.value)} placeholder="es. sedute più brevi, rivalutare alla 8ª" />
          </label>
          <button
            className="btn btn-pieno spoke"
            disabled={!nota.trim()}
            onClick={() => d({ t: "rispondi_parere", id: p.id, risposta: { tipo: "continua_modifiche", testo: nota.trim() } })}
          >
            Invia
          </button>
        </div>
      )}
      {modo === "serve_hub" && (
        <div className="motivi" role="dialog" aria-label="Serve l'hub">
          <p>Motivo (elenco chiuso)</p>
          <ul>
            {MOTIVI_SERVE_HUB.map((m) => (
              <li key={m.id}>
                <button className={motivo === m.id ? "scelto" : ""} aria-pressed={motivo === m.id} onClick={() => setMotivo(m.id)}>
                  {m.testo}
                </button>
              </li>
            ))}
          </ul>
          <p>
            Slot riservato ai rientri (entro {PARAMETRI.rientro_priorita_giorni} giorni) <span className="muted">— un clic invia</span>
          </p>
          <div className="azioni">
            {slot.map((x) => (
              <button
                key={x}
                className="btn btn-pieno"
                disabled={!motivo}
                onClick={() => motivo && d({ t: "rispondi_parere", id: p.id, risposta: { tipo: "serve_hub", motivo, dataSlot: x } })}
                data-testid="slot-rientro"
              >
                {dataLunga(x)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Pareri() {
  const { st } = useStore();
  const aperti = st.pareri.filter((p) => p.risposta === null).sort((a, b) => a.scadenza - b.scadenza);
  const chiusi = st.pareri.filter((p) => p.risposta !== null);
  return (
    <div className="griglia g-8-4">
      <div className="colonna">
        <h2 className="titolo-col">
          Pareri in arrivo dallo spoke <span className="conta">{aperti.length}</span>
        </h2>
        {aperti.length === 0 && <p className="vuoto">Nessun parere in attesa di risposta.</p>}
        {aperti.map((p) => {
          const paz = pazientePerId(p.paziente);
          return (
            <article key={p.id} className={`card parere-card ${st.ora >= p.scadenza ? "scaduto" : ""}`} data-testid={`parere-${p.paziente}`}>
              <header className="ric-testa">
                <div>
                  <h3>
                    {paz.nome} · {strutturaPerId(p.struttura).nome}
                    {p.urgente && <span className="badge-dato pochi">urgente</span>}
                  </h3>
                  <span className="muted">
                    Chiesto {etichettaOraBreve(p.ora)} · sedute fatte: {st.sedute[p.scheda] ?? 0}
                  </span>
                </div>
                <div className="ric-timer">
                  <small>L'hub deve rispondere</small>
                  <Timer scadenza={p.scadenza} ora={st.ora} />
                  {p.escalation && <span className="badge-dato pochi">al coordinatore del GOM</span>}
                </div>
              </header>
              <p className="quesito">
                <b>{testo(QUESITI_PARERE, p.quesito)}</b>
                {p.testo && <q>{p.testo}</q>}
              </p>
              <Risposta p={p} />
            </article>
          );
        })}
      </div>
      <div className="colonna">
        <div className="card">
          <h2>Le regole del {G.parere}</h2>
          <p>
            Risposta entro <b>{PARAMETRI.parere_giorni_lavorativi} giorni lavorativi</b>, <b>{PARAMETRI.parere_urgente_ore} ore</b> se urgente. Termine fissato nel PDTA (esempio).
          </p>
          <p className="muted piccolo">Se il termine passa, il parere va al coordinatore del GOM. Nessuna risposta automatica: decide sempre l'urologo.</p>
        </div>
        {chiusi.length > 0 && (
          <div className="card">
            <h2>Risposte date</h2>
            <ul className="lista-semplice">
              {chiusi.map((p) => (
                <li key={p.id}>
                  <b>{pazientePerId(p.paziente).nome}</b>:{" "}
                  {p.risposta!.tipo === "continua"
                    ? "continua"
                    : p.risposta!.tipo === "continua_modifiche"
                      ? `continua con modifiche («${p.risposta!.testo}»)`
                      : `serve l'hub, ${dataBreve(p.risposta!.dataSlot)}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
