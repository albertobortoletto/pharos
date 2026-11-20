import { useState } from "react";
import { ArrowRight, Building2, Check, Hospital, Lock, Phone, ShieldCheck, Ticket, Undo2, X } from "lucide-react";
import { PARAMETRI } from "../data/pdta";
import { ESTRAZIONE } from "../data/lettera";
import { MOTIVI_SPOKE } from "../data/motivi";
import { ITINERARIO } from "../data/itinerario";
import { UROLOGIA_HUB } from "../data/persone";
import { strutturaPerId } from "../data/strutture";
import { api } from "../data/api";
import { dataBreve } from "../engine/date";
import { useDemo } from "../stato/contesto";
import { BadgeResp, Testata } from "../componenti/comuni";
import { SEDUTE_RIABILITAZIONE } from "../data/tratte";

const frase = (id: string) => ESTRAZIONE.righe.find((r) => r.id === id)!.frase;

export default function Scena3Passaggio({ vai }: { vai: (n: number) => void }) {
  const { s, d } = useDemo();
  const [animato, setAnimato] = useState(false);
  const [chiediMotivo, setChiediMotivo] = useState(false);
  const accettato = s.passaggio === "accettato";
  const motivoTesto = MOTIVI_SPOKE.find((m) => m.id === s.rifiutoMotivo)?.testo;
  const controllo = dataBreve(ITINERARIO.controllo_hub.data);
  const postiSettimana = strutturaPerId("schiavonia").posti_settimana;

  if (s.sede === "padova")
    return (
      <section className="scena" data-scena="3">
        <Testata chi="Urologo · Hub di Padova" titolo="Nessun trasferimento: Giovanni resta all'hub" destra={<BadgeResp />} />
        <div className="esito hub">
          <Hospital size={30} aria-hidden="true" />
          <div>
            <b>La riabilitazione resta a Padova.</b>
            Il motivo è tra i motivi di rifiuto. Per vedere la presa in carico dello spoke, annulla la scelta nella scena 2.
          </div>
        </div>
      </section>
    );

  const prendo = async () => {
    d({ t: "invio_passaggio" });
    await api.invia();
    setAnimato(true);
    window.setTimeout(() => d({ t: "accetta" }), 1400);
  };
  const inCorso = s.passaggio === "invio" || (animato && !accettato);

  return (
    <section className={`scena ${accettato ? "passato-ok" : ""}`} data-scena="3">
      <Testata
        chi={accettato ? "Fisiatra · Spoke di Schiavonia" : "Urologo hub → fisiatra spoke"}
        titolo="Presa in carico, con il rientro già garantito"
        frase="La riabilitazione passa allo spoke solo quando lo spoke accetta."
        destra={<BadgeResp />}
      />
      <div className="binario-wrap">
        <div className="binario-capi">
          <span className={`capo h ${accettato ? "" : "attivo"}`}>
            <Hospital size={30} aria-hidden="true" />
            <span>
              Hub di Padova<small>Urologia</small>
            </span>
          </span>
          <span className={`capo s ${accettato ? "attivo" : ""}`}>
            <span style={{ textAlign: "right" }}>
              Spoke di Schiavonia<small>Medicina riabilitativa</small>
            </span>
            <Building2 size={30} aria-hidden="true" />
          </span>
        </div>
        <div
          className={`binario ${accettato || animato ? "passato" : ""} ${animato ? "anima" : ""} ${s.passaggio === "rifiutato" ? "rifiutato" : ""}`}
          data-testid="binario"
        >
          <div className="linea" />
          <div className="piena" />
          <div className="anello" />
          <div className="testimone" data-testid="testimone">
            <span className="ico">{accettato ? <Building2 size={34} /> : <Ticket size={34} />}</span>
            <span key={accettato ? "s" : "h"} className="etichetta-testimone">
              <small>In carico a</small>
              {accettato ? "Spoke Schiavonia" : "Hub Padova"}
            </span>
          </div>
        </div>
        {accettato ? (
          <div className={`banner-resp spoke ${animato ? "anima" : ""}`} role="status" data-testid="banner-resp">
            <ShieldCheck size={36} aria-hidden="true" style={{ flex: "none" }} />
            <span>
              Riabilitazione: ora risponde lo spoke di Schiavonia
              <small>Il controllo del {controllo} e il percorso oncologico restano all'hub. Il rientro è garantito.</small>
            </span>
          </div>
        ) : (
          <div className="banner-resp" role="status" data-testid="banner-resp">
            <Lock size={34} aria-hidden="true" style={{ flex: "none" }} />
            <span>
              Responsabilità: ancora dell'hub finché lo spoke non accetta
              <small>Riguarda la riabilitazione. Il controllo del {controllo} e il percorso oncologico restano sempre all'hub.</small>
            </span>
          </div>
        )}
      </div>
      <div className="griglia g-6-6">
        <div>
          <h2 className="titolo-col">Il rientro garantito, scritto dall'urologo</h2>
          <div className="garanzie">
            <div className="garanzia">
              <span className="num">1</span>
              <div>
                <h3>Condizioni di rientro all'hub</h3>
                <p>Febbre persistente o difficoltà a urinare: lo spoke chiama l'hub in giornata. Urgenze: 112 o pronto soccorso.</p>
                <q>{frase("r3")}</q>
              </div>
            </div>
            <div className="garanzia">
              <span className="num">2</span>
              <div>
                <h3>Parere dell'hub entro {PARAMETRI.parere_giorni_lavorativi} giorni lavorativi</h3>
                <p>
                  Lo chiede la fisiatra se la continenza non migliora dopo {PARAMETRI.seduta_controllo} sedute; risposta entro{" "}
                  {PARAMETRI.parere_giorni_lavorativi} giorni lavorativi dalla richiesta. Termine fissato nel PDTA (esempio).
                </p>
                <q>{frase("r4")}</q>
              </div>
            </div>
            <div className="garanzia">
              <span className="num">3</span>
              <div>
                <h3>Rientro a Padova con priorità, entro {PARAMETRI.rientro_priorita_giorni} giorni</h3>
                <p>Per i casi non urgenti che richiedono l'hub. Termine fissato nel PDTA (esempio).</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card vista-spoke" data-testid="vista-spoke">
          <div className="chi" style={{ color: "var(--spoke-testo)", marginBottom: 2 }}>
            <span className="pallino" style={{ background: "var(--spoke)" }} />
            Vista della fisiatra · Spoke di Schiavonia
          </div>
          <h2 style={{ marginBottom: 4 }}>Richiesta di presa in carico: riabilitazione</h2>
          <ul className={`mandato ${chiediMotivo ? "compatto" : ""}`}>
            <li>
              <Check size={22} color="var(--spoke-testo)" strokeWidth={3} aria-hidden="true" />
              <span>
                <b>{SEDUTE_RIABILITAZIONE} sedute di riabilitazione del pavimento pelvico</b> dal {dataBreve(ITINERARIO.sedute[0])}, ore {ITINERARIO.ora_sedute}
              </span>
            </li>
            <li>
              <Check size={22} color="var(--spoke-testo)" strokeWidth={3} aria-hidden="true" />
              <span>Giovanni R., 70 anni · prostatectomia radicale il 3/11 · non guida</span>
            </li>
            <li>
              <Phone size={22} color="var(--spoke-testo)" aria-hidden="true" />
              <span>
                Parere o rientro: Urologia dell'hub, <b>{UROLOGIA_HUB.telefono}</b> (fittizio)
              </span>
            </li>
          </ul>
          {!chiediMotivo && s.passaggio !== "rifiutato" && (
            <div className="confini">
              <div>
                <b>Diventa dello spoke</b>Le {SEDUTE_RIABILITAZIONE} sedute e la segnalazione delle condizioni di rientro
              </div>
              <div>
                <b>Resta all'hub</b>Controllo del {controllo}, percorso oncologico, parere e rientro
              </div>
            </div>
          )}
          {!chiediMotivo && s.passaggio !== "rifiutato" && (
            <div className="riga-azioni">
              <span className="posti">
                Posti liberi nella settimana del {dataBreve(ITINERARIO.sedute[0])}:{" "}
                <b key={s.postiLiberi} className={animato ? "cambia" : ""} data-testid="posti">
                  {s.postiLiberi}
                </b>{" "}
                su {postiSettimana}
              </span>
              {s.passaggio === "in_attesa" && (
                <div className="azioni">
                  <button className="btn btn-vuoto" onClick={() => setChiediMotivo(true)} data-testid="non-posso">
                    Non posso (motivo)
                  </button>
                  <button className="btn btn-pieno spoke" onClick={prendo} data-testid="prendo-in-carico">
                    <Check size={22} aria-hidden="true" /> Prendo in carico
                  </button>
                </div>
              )}
              {inCorso && (
                <button className="btn btn-pieno spoke" disabled>
                  Presa in carico in corso…
                </button>
              )}
              {accettato && (
                <button className="btn btn-pieno" onClick={() => vai(3)} data-testid="avanti-3">
                  Monitoraggio <ArrowRight size={22} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {s.passaggio === "in_attesa" && chiediMotivo && (
            <div className="motivi tre" ref={(el) => el?.scrollIntoView({ block: "nearest" })} role="dialog" aria-label="Motivo del rifiuto">
              <p>Perché lo spoke non può? Il motivo viene registrato.</p>
              <ul>
                {MOTIVI_SPOKE.filter((m) => !(m.id === "posti_esauriti" && s.postiLiberi > 0)).map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => {
                        d({ t: "rifiuta", motivo: m.id });
                        setChiediMotivo(false);
                      }}
                    >
                      {m.testo}
                    </button>
                  </li>
                ))}
              </ul>
              <button className="btn-link" onClick={() => setChiediMotivo(false)}>
                <X size={18} style={{ verticalAlign: "-3px" }} /> Annulla
              </button>
            </div>
          )}
          {s.passaggio === "rifiutato" && (
            <div className="esito allarme" style={{ marginTop: 14 }}>
              <X size={30} color="var(--allarme)" aria-hidden="true" />
              <div>
                <b>Schiavonia non può: «{motivoTesto}».</b>
                Giovanni resta in carico all'hub. Il motivo è registrato e l'infermiera di percorso cerca un'altra soluzione.
                <div>
                  <button className="btn-link" onClick={() => d({ t: "annulla_rifiuto" })}>
                    <Undo2 size={18} style={{ verticalAlign: "-3px" }} /> Annulla (demo)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
