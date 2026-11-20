import type { ReactNode } from "react";
import { ArrowRight, CalendarClock, Check, CircleHelp, ClipboardList, Eye, EyeOff, Phone, PhoneOff, RefreshCw, Undo2 } from "lucide-react";
import { RIGHE_INFERMIERA, ZONE } from "../data/infermiera";
import type { RigaInfermiera } from "../data/tipi";
import { ITINERARIO } from "../data/itinerario";
import { dataBreve } from "../engine/date";
import { useDemo } from "../stato/contesto";
import type { EsitoRichiamo } from "../stato/racconto";
import { BadgeResp, Testata } from "../componenti/comuni";

export type StatoVoce = "fatta" | "referto_arrivato" | "non_verificabile" | "da_richiamare" | "programmata" | "attesa" | "ripian" | "richiamato";

const STATI: Record<StatoVoce, { cls: string; testo: string; ico: ReactNode }> = {
  fatta: { cls: "fatta", testo: "Fatta", ico: <Check size={20} strokeWidth={3} /> },
  referto_arrivato: { cls: "referto", testo: "Referto arrivato", ico: <ClipboardList size={20} /> },
  non_verificabile: { cls: "nonver", testo: "Non verificabile", ico: <CircleHelp size={20} /> },
  da_richiamare: { cls: "richiamare", testo: "Da richiamare", ico: <Phone size={20} /> },
  programmata: { cls: "programmata", testo: "Programmata", ico: <CalendarClock size={20} /> },
  attesa: { cls: "attesa", testo: "In attesa dello spoke", ico: <CalendarClock size={20} /> },
  ripian: { cls: "ripian", testo: "Da ripianificare", ico: <RefreshCw size={20} /> },
  richiamato: { cls: "programmata", testo: "Richiamato", ico: <Check size={20} /> },
};

export function StatoBadge({ k }: { k: StatoVoce }) {
  const x = STATI[k];
  return (
    <span className={`stato ${x.cls}`} data-stato={k}>
      {x.ico}
      {x.testo}
    </span>
  );
}

const NOMI_SEDE: Record<string, string> = { schiavonia: "Schiavonia", padova: "Padova", privato: "Struttura privata" };

const ESITI: Record<EsitoRichiamo, { testo: string; ico: ReactNode; stato: StatoVoce; nota: string }> = {
  fatta: {
    testo: "Fatta: la registra lo spoke",
    ico: <Check size={20} />,
    stato: "richiamato",
    nota: "Seduta fatta secondo il paziente: chiedo io allo spoke di registrarla entro lunedì 23/11.",
  },
  saltata: {
    testo: "Saltata: nuova data",
    ico: <RefreshCw size={20} />,
    stato: "ripian",
    nota: "Seduta saltata: concordo io la nuova data con lo spoke entro 2 giorni lavorativi, poi ristampo il promemoria.",
  },
  non_risponde: {
    testo: "Non risponde: riprovo lunedì",
    ico: <PhoneOff size={20} />,
    stato: "da_richiamare",
    nota: "Non ha risposto alle 10:15: resta in elenco, nuovo tentativo lunedì 23/11.",
  },
};

const ORDINE: RigaInfermiera["stato"][] = ["da_richiamare", "giovanni", "non_verificabile", "referto_arrivato", "fatta"];

/** Elenco del monitoraggio e riquadro «cosa vedo / cosa non vedo». Usato dalla scena 4 e dalla vista Hub. */
export function Monitoraggio({ avanti, inCima }: { avanti?: () => void; inCima?: ReactNode }) {
  const { s, d } = useDemo();
  const statoGiovanni: StatoVoce = s.sede === "padova" || s.passaggio === "accettato" ? "programmata" : "attesa";
  const notaGiovanni =
    s.sede === "padova"
      ? "Resta all’hub: sedute a Padova."
      : s.passaggio === "accettato"
        ? `Presa in carico dallo spoke. Prima seduta il ${dataBreve(ITINERARIO.sedute[0])}.`
        : "Responsabilità ancora dell’hub: lo spoke non ha ancora risposto.";
  const righe = [...RIGHE_INFERMIERA].sort((a, b) => ORDINE.indexOf(a.stato) - ORDINE.indexOf(b.stato));
  const nonVerificabili = RIGHE_INFERMIERA.filter((r) => r.stato === "non_verificabile").length;
  const daRichiamare = s.richiamo && s.richiamo !== "non_risponde" ? 0 : 1;

  return (
    <div className="griglia g-8-4">
      <div>
        {inCima}
        <div className="elenco" role="list">
          {righe.map((r) => {
            const sede = NOMI_SEDE[r.sede] ?? r.sede;
            if (r.stato === "da_richiamare") {
              const esito = s.richiamo ? ESITI[s.richiamo] : null;
              return (
                <div key={r.id} className={`voce-el ${!esito || s.richiamo === "non_risponde" ? "richiamo" : ""}`} role="listitem" data-testid="riga-richiamo">
                  <div className="paz">
                    {r.paziente}
                    <small>
                      {r.eta} anni · {r.comune}
                    </small>
                  </div>
                  <div className="fase">
                    {r.fase}
                    <small>
                      {sede} · {dataBreve(r.data)} · {r.spiegazione}
                    </small>
                  </div>
                  <StatoBadge k={esito ? esito.stato : "da_richiamare"} />
                  {esito ? (
                    <div className="pannello-chiamata" style={{ background: "var(--grigio-chiaro)", gridTemplateColumns: "1fr auto" }}>
                      <span style={{ fontWeight: 700 }}>{esito.nota}</span>
                      <button className="btn-link" onClick={() => d({ t: "annulla_richiamo" })}>
                        <Undo2 size={18} style={{ verticalAlign: "-3px" }} /> Annulla (demo)
                      </button>
                    </div>
                  ) : (
                    <div className="pannello-chiamata">
                      <span className="tel">
                        <Phone size={26} style={{ verticalAlign: "-4px" }} aria-hidden="true" /> {r.contatto!.numero}
                      </span>
                      <div>
                        <b>Chiama {r.contatto!.chi}</b>{" "}
                        <span className="muted" style={{ fontSize: 18 }}>
                          (numero fittizio)
                        </span>
                        <ol className="script">
                          <li>«Buongiorno, sono Marta, l'infermiera dell'ospedale di Padova.»</li>
                          <li>«La seduta del 18 a Schiavonia non risulta: è riuscito ad andare?»</li>
                          <li>«Se è saltata, fissiamo una nuova data e le rimando il promemoria.»</li>
                        </ol>
                      </div>
                      <div className="esiti" role="group" aria-label="Esito della chiamata">
                        {(Object.keys(ESITI) as EsitoRichiamo[]).map((k) => (
                          <button key={k} className={k === "saltata" ? "principale" : ""} onClick={() => d({ t: "richiamo", esito: k })} data-testid={`esito-${k}`}>
                            {ESITI[k].ico}
                            {ESITI[k].testo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            if (r.stato === "giovanni")
              return (
                <div key={r.id} className="voce-el" role="listitem" style={{ borderLeft: "8px solid var(--paziente)" }}>
                  <div className="paz">
                    {r.paziente}
                    <small>
                      {r.eta} anni · {r.comune}
                    </small>
                  </div>
                  <div className="fase">
                    {r.fase}
                    <small>
                      {s.sede === "padova" ? "Padova" : sede} · {notaGiovanni}
                    </small>
                  </div>
                  <StatoBadge k={statoGiovanni} />
                </div>
              );
            return (
              <div key={r.id} className="voce-el" role="listitem">
                <div className="paz">
                  {r.paziente}
                  <small>
                    {r.eta} anni · {r.comune}
                  </small>
                </div>
                <div className="fase">
                  {r.fase}
                  <small>
                    {sede} · {dataBreve(r.data)} · {r.spiegazione}
                  </small>
                </div>
                <StatoBadge k={r.stato as StatoVoce} />
              </div>
            );
          })}
        </div>
      </div>
      <aside className="zone" aria-label="Fonti che il sistema non legge">
        <h2>
          <EyeOff size={26} aria-hidden="true" /> Cosa legge il sistema
        </h2>
        <h3 style={{ margin: 0 }}>Fonti che legge</h3>
        <ul>
          {ZONE.vedo.map((z) => (
            <li key={z}>
              <Eye size={20} color="var(--percorso-testo)" aria-hidden="true" />
              {z}
            </li>
          ))}
        </ul>
        <h3 style={{ margin: 0 }}>Fonti che non legge</h3>
        <ul>
          {ZONE.non_vedo.map((z) => (
            <li key={z}>
              <EyeOff size={20} color="var(--grigio)" aria-hidden="true" />
              {z}
            </li>
          ))}
        </ul>
        <p style={{ margin: "0 0 12px", fontWeight: 700 }} data-testid="riepilogo-zone">
          Nelle fonti lette: {daRichiamare} {daRichiamare === 1 ? "fase da richiamare" : "fasi da richiamare"}
          {s.richiamo === "saltata" ? ", 1 da ripianificare" : s.richiamo === "fatta" ? ", 1 in attesa di registrazione" : ""}, {nonVerificabili} non
          verificabile.
        </p>
        <p className="motto">Il sistema non dice mai «tutto a posto»: dice cosa vede e cosa no.</p>
        {avanti && (
          <div className="azioni non-stampare" style={{ marginTop: 14 }}>
            <button className={`btn ${s.richiamo ? "btn-pieno" : "btn-vuoto"}`} onClick={avanti} data-testid="avanti-4">
              Promemoria <ArrowRight size={22} aria-hidden="true" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function Scena4Itinerario({ vai }: { vai: (n: number) => void }) {
  return (
    <section className="scena" data-scena="4">
      <Testata
        chi="Infermiera di percorso · Marta"
        titolo="Monitoraggio: prima chi va richiamato"
        frase="Lo schermo non dice mai «tutto a posto»: dice cosa vede e cosa no."
        destra={<BadgeResp />}
      />
      <Monitoraggio avanti={() => vai(4)} />
    </section>
  );
}
