// Pazienti con fasi in corso: chi è responsabile adesso e quanto tempo ha.
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { prestazione } from "../../data/pdta";
import { strutturaPerId } from "../../data/strutture";
import { pazientePerId } from "../../data/pazienti";
import { ETICHETTA_TIMER, NOME_STATO, RESPONSABILE, STATI_ATTIVI, type Scheda } from "../../engine/scheda";
import { NOMI_RESPONSABILI } from "../../testi/glossario";
import { useStore } from "../../stato/contesto";
import { ID_SCHEDA_GIOVANNI, type Stato } from "../../stato/store";
import { Timer } from "../../componenti/timer";

type Filtro = "tutti" | "attesa" | "ritardo" | "esiti";

const FILTRI: { id: Filtro; nome: string; test: (s: Scheda, st: Stato) => boolean }[] = [
  { id: "tutti", nome: "Tutti", test: () => true },
  { id: "attesa", nome: "In attesa", test: (s) => ["BOZZA", "INVIATA", "RIFIUTATA", "ACCETTATA"].includes(s.stato) },
  { id: "ritardo", nome: "In ritardo", test: (s, st) => inRitardo(s, st) },
  { id: "esiti", nome: "Esiti in arrivo", test: (s) => ["ESITO_ATTESO", "ESITO_RICEVUTO"].includes(s.stato) },
];

/** In ritardo: timer scaduto (tranne la prima seduta, che è un appuntamento) o parere scaduto. */
export function inRitardo(s: Scheda, st: Stato): boolean {
  const timerScaduto = s.scadenza !== null && s.stato !== "PRENOTATA" && st.ora >= s.scadenza;
  const parereScaduto = st.pareri.some((p) => p.scheda === s.id && p.risposta === null && st.ora >= p.scadenza);
  return timerScaduto || s.escalation || parereScaduto;
}

/** «lo spoke di Schiavonia», «l'hub di Padova (urologo)»… */
export function responsabileDi(s: Scheda): string {
  const r = RESPONSABILE[s.stato];
  if (r === "spoke") return `lo spoke di ${strutturaPerId(s.struttura).nome}`;
  return NOMI_RESPONSABILI[r];
}

export function TabellaPazienti() {
  const { st, d } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("tutti");
  const attive = st.schede.filter((s) => STATI_ATTIVI.includes(s.stato));
  const f = FILTRI.find((x) => x.id === filtro)!;
  const righe = attive.filter((s) => f.test(s, st)).sort((a, b) => Number(inRitardo(b, st)) - Number(inRitardo(a, st)) || (a.scadenza ?? 1e9) - (b.scadenza ?? 1e9));
  return (
    <div className="card tabella-card" data-testid="tabella-pazienti">
      <div className="filtri" role="tablist" aria-label="Filtri">
        {FILTRI.map((x) => (
          <button key={x.id} role="tab" aria-selected={filtro === x.id} className={filtro === x.id ? "attivo" : ""} onClick={() => setFiltro(x.id)} data-testid={`filtro-${x.id}`}>
            {x.nome} <span className="conta">{attive.filter((s) => x.test(s, st)).length}</span>
          </button>
        ))}
      </div>
      <table className="tabella">
        <thead>
          <tr>
            <th>Paziente</th>
            <th>Fase</th>
            <th>Struttura</th>
            <th>Stato della scheda</th>
            <th>Responsabile adesso</th>
            <th>Tempo</th>
            <th aria-label="Apri" />
          </tr>
        </thead>
        <tbody>
          {righe.map((s) => {
            const p = pazientePerId(s.paziente);
            const ritardo = inRitardo(s, st);
            const parere = st.pareri.find((x) => x.scheda === s.id && x.risposta === null);
            const apribile = s.id === ID_SCHEDA_GIOVANNI;
            return (
              <tr key={s.id} className={`${ritardo ? "ritardo" : ""} ${apribile ? "apribile" : ""}`} onClick={apribile ? () => d({ t: "sezione_hub", sezione: "proposta" }) : undefined} data-testid={`riga-${s.paziente}`}>
                <td>
                  <b>{p.nome}</b>
                  <small>
                    {p.eta} anni · {p.comune}
                  </small>
                </td>
                <td>{prestazione(s.prestazione).nome}</td>
                <td>{strutturaPerId(s.struttura).nome}</td>
                <td>
                  <span className={`stato-scheda st-${s.stato.toLowerCase()}`}>{NOME_STATO[s.stato]}</span>
                  {parere && (
                    <small className="con-parere" title="Parere chiesto dallo spoke">
                      parere in attesa
                    </small>
                  )}
                </td>
                <td className="resp-cella">{responsabileDi(s)}</td>
                <td>
                  {s.scadenza !== null && (
                    <span className="tempo-cella">
                      <small>{ETICHETTA_TIMER[s.stato]}</small>
                      <Timer scadenza={s.scadenza} ora={st.ora} prima={s.stato === "PRENOTATA" ? "tra" : "entro"} />
                    </span>
                  )}
                  {ritardo && <span className="badge-dato pochi">{s.escalation ? "al coordinatore del GOM" : "in ritardo"}</span>}
                </td>
                <td>{apribile && <ChevronRight size={22} aria-hidden="true" />}</td>
              </tr>
            );
          })}
          {righe.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                Nessun paziente con questo filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
