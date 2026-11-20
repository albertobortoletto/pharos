// Caso di studio: Renato, microcitoma polmonare. Entra nella rete dal pronto soccorso di uno spoke (Belluno),
// fa la prima linea vicino a casa e, alla progressione, passa all'hub (IOV) per un farmaco «solo hub».
// Ogni passo si conferma con un clic della persona responsabile: il sistema prepara, le persone decidono.
import type { ReactNode } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { Ambulance, Building2, Check, CircleDot, FileText, Hospital, MessageSquareText, RotateCcw, Route, Stethoscope, UserRound, Users } from "lucide-react";
import confini from "../../data/rete/veneto.geo.json";
import { nodoPerId } from "../../data/rete/nodi";
import {
  CASA_RENATO,
  DOCUMENTI_RENATO,
  FESTIVI,
  HUB_CASO,
  INFERMIERA_HUB,
  NOTA_CASO,
  ORARI_INFUSIONE,
  RENATO,
  SECONDA_LINEA,
  SLOT_HUB,
  SPOKE_CASO,
  STORIA_RENATO,
  TRATTE_RENATO,
} from "../../data/casoRenato";
import { OGGI_DEMO } from "../../data/itinerario";
import { aggiungiGiorni, dataBreve, dataLunga } from "../../engine/date";
import { pianificaCiclo } from "../../engine/infusioni";
import { useStore } from "../../stato/contesto";
import { PASSI_CASO } from "../../stato/store";
import { G } from "../../testi/glossario";
import { Simulato, Stima, Testata } from "../../componenti/comuni";

const GIORNI_HUB = SECONDA_LINEA.giorniHub.map((g) => g.giorno);
const PIANO = pianificaCiclo(SLOT_HUB, GIORNI_HUB, FESTIVI);
const ESAMI_SPOKE = PIANO ? aggiungiGiorni(PIANO.date[0], STORIA_RENATO.esamiTraG1G8) : null;
const giornoHub = (i: number) => SECONDA_LINEA.giorniHub[i];
const oreMin = (m: number) => (m < 60 ? `~${m} min` : `~${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`);

interface Passo {
  titolo: string;
  quando: string;
  chi: string;
  azione: string;
  ico: ReactNode;
  /** Cosa prepara il sistema prima del clic. */
  proposta: ReactNode;
  /** Cosa resta scritto dopo il clic. */
  esito: string;
}

const PASSI: Passo[] = [
  {
    titolo: "Pronto soccorso di Belluno",
    quando: dataBreve(STORIA_RENATO.prontoSoccorso),
    chi: "Medico del pronto soccorso",
    azione: "Apri la scheda di percorso",
    ico: <Ambulance size={22} aria-hidden="true" />,
    proposta: <p>Tosse e dispnea. Ricovero per accertamenti a Belluno.</p>,
    esito: "Renato entra nella rete: da qui ogni fase ha un responsabile.",
  },
  {
    titolo: "Diagnosi e prima linea a Belluno",
    quando: dataBreve(STORIA_RENATO.diagnosi),
    chi: "Oncologo di Belluno",
    azione: `Prendo in carico a ${SPOKE_CASO.breve}`,
    ico: <Building2 size={22} aria-hidden="true" />,
    proposta: (
      <p>
        Microcitoma polmonare. La prima linea si può fare allo spoke, a {TRATTE_RENATO.spoke.km} km da casa.
      </p>
    ),
    esito: `Microcitoma. Prima linea a ${SPOKE_CASO.breve}, dal ${dataBreve(STORIA_RENATO.primaLinea)}.`,
  },
  {
    titolo: "Progressione: decide il GOM",
    quando: dataBreve(STORIA_RENATO.gom),
    chi: "GOM (oncologo, pneumologo, radiologo)",
    azione: "Confermo la seconda linea",
    ico: <Users size={22} aria-hidden="true" />,
    proposta: (
      <>
        <p>
          TC del {dataBreve(STORIA_RENATO.progressione)}: progressione. Seconda linea con <b>{SECONDA_LINEA.farmaco}</b>.
        </p>
        <p className="caso-pdta">
          <Hospital size={18} aria-hidden="true" /> PDTA: <b>solo hub</b>. Hub abilitati, dal più vicino a casa:{" "}
          {SECONDA_LINEA.hubAbilitati.map((h) => `${h.nome} (${h.km} km)`).join(" · ")} <Stima />
        </p>
      </>
    ),
    esito: `Seconda linea con ${SECONDA_LINEA.farmaco}: solo all'hub. Proposto ${HUB_CASO.breve}, il più vicino.`,
  },
  {
    titolo: "Richiesta all'hub",
    quando: dataBreve(OGGI_DEMO),
    chi: "Oncologo di Belluno",
    azione: `Invia la richiesta all'${HUB_CASO.nodo}`,
    ico: <FileText size={22} aria-hidden="true" />,
    proposta: (
      <>
        <p>La richiesta parte con i documenti del FSE:</p>
        <ul className="caso-doc">
          {DOCUMENTI_RENATO.map((d) => (
            <li key={d}>
              <FileText size={16} aria-hidden="true" /> {d}
            </li>
          ))}
        </ul>
      </>
    ),
    esito: "Richiesta inviata con i documenti. Nessuno deve rispiegare il caso al telefono.",
  },
  {
    titolo: `L'${HUB_CASO.nodo} prende in carico`,
    quando: dataBreve(OGGI_DEMO),
    chi: "Oncologo dell'IOV",
    azione: "Prendo in carico e confermo le date",
    ico: <Hospital size={22} aria-hidden="true" />,
    proposta: PIANO ? (
      <>
        <ul className="caso-date">
          {PIANO.date.map((d, i) => (
            <li key={d}>
              <b>
                Giorno {giornoHub(i).giorno} · {dataLunga(d)}
              </b>
              <span>{giornoHub(i).nome} all'hub</span>
            </li>
          ))}
        </ul>
        {PIANO.scartate.map((x) => (
          <p key={x.inizio} className="caso-scartata">
            Scartato il {dataBreve(x.inizio)}: {x.motivo}.
          </p>
        ))}
        <p className="muted piccolo">
          {SECONDA_LINEA.osservazione} Esami del sangue a {SPOKE_CASO.breve} {ESAMI_SPOKE && dataLunga(ESAMI_SPOKE)}, visibili all'hub.
        </p>
      </>
    ) : (
      <p>Nessuna data libera adatta: l'infermiera di percorso chiede nuove date all'hub.</p>
    ),
    esito: PIANO ? `Prenotati il ${dataBreve(PIANO.date[0])} e il ${dataBreve(PIANO.date[1])}. Trasporto organizzato: Carla non guida.` : "",
  },
  {
    titolo: "Giorno 1 e giorno 8 all'hub",
    quando: PIANO ? `${dataBreve(PIANO.date[0])} e ${dataBreve(PIANO.date[1])}` : "",
    chi: "Renato e Carla",
    azione: "Abbiamo letto: confermiamo",
    ico: <UserRound size={22} aria-hidden="true" />,
    proposta: <p>Arrivano l'SMS con date e orari e il promemoria stampato.</p>,
    esito: `Renato arriva all'${HUB_CASO.nodo} senza problemi, entrambe le volte. ${SECONDA_LINEA.dopo}`,
  },
];

/** Chi è responsabile dopo `passo` passi confermati. */
function responsabile(passo: number): string {
  if (passo === 0) return "nessuno: Renato non è ancora nella rete";
  if (passo === 1) return "il pronto soccorso di Belluno";
  if (passo <= 3) return "l'oncologia di Belluno (spoke)";
  if (passo === 4) return "l'oncologia di Belluno, finché l'IOV non risponde";
  return "l'IOV di Padova (hub)";
}

export default function VistaCaso() {
  const { st, d } = useStore();
  const passo = st.caso.passo;
  const finito = passo >= PASSI_CASO;
  return (
    <section className="scena vista-ruolo vista-caso" data-vista="caso">
      <Testata
        chi="Caso di studio · oncologia polmonare"
        titolo="Renato: da Belluno all'hub, senza perdersi"
        frase={`Uno spoke, un farmaco solo hub, due infusioni a ${TRATTE_RENATO.hub.km} km da casa.`}
        destra={
          passo > 0 ? (
            <button className="btn btn-vuoto" onClick={() => d({ t: "caso_reset" })} data-testid="caso-reset">
              <RotateCcw size={20} aria-hidden="true" /> Ricomincia il caso
            </button>
          ) : undefined
        }
      />
      <div className="griglia g-caso">
        <div className="colonna">
          <Persona />
          <MiniMappa passo={passo} />
        </div>

        <div className="card">
          <h2>
            <Route size={22} aria-hidden="true" /> Il percorso, passo per passo
          </h2>
          <p className="caso-resp" data-testid="caso-responsabile">
            In carico a: <b>{responsabile(passo)}</b>
          </p>
          <ol className="caso-passi">
            {PASSI.map((p, i) => {
              const fatto = i < passo;
              const prossimo = i === passo;
              return (
                <li key={p.titolo} className={fatto ? "fatto" : prossimo ? "prossimo" : "dopo"} data-testid={`caso-passo-${i + 1}`}>
                  <span className="caso-n">{fatto ? <Check size={18} aria-hidden="true" /> : i + 1}</span>
                  <div>
                    <div className="caso-titolo">
                      {p.ico}
                      <b>{p.titolo}</b>
                      <small>{p.quando}</small>
                    </div>
                    {fatto && <p className="caso-esito">{p.esito}</p>}
                    {prossimo && (
                      <div className="caso-proposta">
                        {p.proposta}
                        <div className="azioni">
                          <button className="btn btn-pieno" onClick={() => d({ t: "caso_avanza", passo: i + 1 })} data-testid="caso-avanti">
                            <Check size={20} aria-hidden="true" /> {p.azione}
                          </button>
                          <span className="muted piccolo">
                            <Stethoscope size={16} aria-hidden="true" /> {p.chi}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {finito && <Bilancio />}
        </div>

        <div className="colonna">
          <PerRenato passo={passo} />
          <p className="muted piccolo">
            {NOTA_CASO} <Simulato />
          </p>
        </div>
      </div>
    </section>
  );
}

function Persona() {
  return (
    <div className="card persona" data-testid="persona-renato">
      <div className="persona-testa">
        <span className="persona-avatar" aria-hidden="true">
          {RENATO.nome[0]}
        </span>
        <div>
          <b>
            {RENATO.nome}, {RENATO.eta} anni
          </b>
          <small>
            {RENATO.comune} · persona inventata
          </small>
        </div>
      </div>
      <p>{RENATO.famiglia}</p>
      <dl>
        <dt>Gli serve</dt>
        <dd>
          <ul>
            {RENATO.bisogni.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </dd>
        <dt>Lo preoccupa</dt>
        <dd>
          <ul>
            {RENATO.timori.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </div>
  );
}

// ——— Mini-mappa: stessi confini e stessi nodi della mappa della rete ———

const MW = 460;
const MH = 400;
const geo = confini as unknown as FeatureCollection<Geometry, { nome: string; sigla: string }>;
const REGIONE = geo.features[0] as Feature<Geometry>;
const proiezione = geoMercator().fitExtent(
  [
    [14, 14],
    [MW - 14, MH - 14],
  ],
  REGIONE,
);
const percorso = geoPath(proiezione);
const xy = (lng: number, lat: number) => proiezione([lng, lat]) as [number, number];

function MiniMappa({ passo }: { passo: number }) {
  const casa = xy(CASA_RENATO.lng, CASA_RENATO.lat);
  const bl = xy(nodoPerId(SPOKE_CASO.nodo).lng, nodoPerId(SPOKE_CASO.nodo).lat);
  const iov = xy(nodoPerId(HUB_CASO.nodo).lng, nodoPerId(HUB_CASO.nodo).lat);
  const vr = xy(nodoPerId("VR").lng, nodoPerId("VR").lat);
  return (
    <div className="card minimappa" data-testid="minimappa-renato">
      <svg viewBox={`0 0 ${MW} ${MH}`} role="img" aria-label="Percorso di Renato: Agordo, Belluno, IOV di Padova">
        {geo.features.slice(1).map((p) => (
          <path key={p.properties.sigla} d={percorso(p) ?? ""} className="provincia" />
        ))}
        <path d={percorso(REGIONE) ?? ""} className="regione" />
        {passo >= 2 && <line x1={casa[0]} y1={casa[1]} x2={bl[0]} y2={bl[1]} className="mm-spoke" />}
        {passo >= 3 && passo < 5 && <line x1={bl[0]} y1={bl[1]} x2={iov[0]} y2={iov[1]} className="mm-richiesta" />}
        {passo >= 3 && passo < 5 && <line x1={bl[0]} y1={bl[1]} x2={vr[0]} y2={vr[1]} className="mm-alternativa" />}
        {passo >= 5 && <line x1={casa[0]} y1={casa[1]} x2={iov[0]} y2={iov[1]} className="mm-viaggio" />}
        {passo >= 3 && <circle cx={vr[0]} cy={vr[1]} r={6} className="mm-nodo altro" />}
        <circle cx={bl[0]} cy={bl[1]} r={9} className={`mm-nodo spoke ${passo >= 1 && passo < 5 ? "attivo" : ""}`} />
        <circle cx={iov[0]} cy={iov[1]} r={10} className={`mm-nodo hub ${passo >= 5 ? "attivo" : ""}`} />
        <circle cx={casa[0]} cy={casa[1]} r={7} className="mm-casa" />
        <text x={casa[0] - 12} y={casa[1] - 10} className="mm-etichetta" textAnchor="end">
          Agordo · casa
        </text>
        <text x={bl[0] + 14} y={bl[1] + 5} className="mm-etichetta">
          Belluno · spoke
        </text>
        <text x={iov[0] + 14} y={iov[1] + 5} className="mm-etichetta">
          IOV Padova · hub
        </text>
        {passo >= 3 && (
          <text x={vr[0]} y={vr[1] + 22} className="mm-etichetta piccola" textAnchor="middle">
            Verona
          </text>
        )}
      </svg>
      <p className="mm-legenda">
        {passo >= 5 ? (
          <>
            Casa → {HUB_CASO.breve}: {TRATTE_RENATO.hub.km} km, {oreMin(TRATTE_RENATO.hub.minuti)} <Stima />
          </>
        ) : (
          <>
            Casa → {SPOKE_CASO.breve}: {TRATTE_RENATO.spoke.km} km, {oreMin(TRATTE_RENATO.spoke.minuti)} <Stima />
          </>
        )}
      </p>
    </div>
  );
}

function PerRenato({ passo }: { passo: number }) {
  return (
    <div className="card per-renato" data-testid="per-renato">
      <h2>
        <MessageSquareText size={22} aria-hidden="true" /> Per Renato e Carla
      </h2>
      {passo < 5 || !PIANO ? (
        <p className="muted">{passo < 1 ? "Ancora niente: Renato non è nella rete." : `Lo segue l'oncologia di ${SPOKE_CASO.breve}. I messaggi arrivano quando l'hub conferma le date.`}</p>
      ) : (
        <>
          <div className="bolla" data-testid="sms-renato">
            <small>SMS a Carla · numero fittizio</small>
            {HUB_CASO.breve}: {giornoHub(0).nome.toLowerCase()} {dataLunga(PIANO.date[0])}, {giornoHub(1).nome.toLowerCase()} {dataLunga(PIANO.date[1])}, ore{" "}
            {ORARI_INFUSIONE.arrivo}. Il trasporto passa da casa alle {ORARI_INFUSIONE.partenzaDaCasa}. Dubbi: {INFERMIERA_HUB.nome}, {INFERMIERA_HUB.telefono}.
          </div>
          <ul className="caso-promemoria">
            <li>
              <CircleDot size={18} aria-hidden="true" /> {ORARI_INFUSIONE.luogo}
            </li>
            {ESAMI_SPOKE && (
              <li>
                <CircleDot size={18} aria-hidden="true" /> Esami del sangue a {SPOKE_CASO.breve}: {dataLunga(ESAMI_SPOKE)}
              </li>
            )}
            <li>
              <CircleDot size={18} aria-hidden="true" /> Riferimento: {INFERMIERA_HUB.nome}, {INFERMIERA_HUB.ruolo} ({INFERMIERA_HUB.orari})
            </li>
          </ul>
          {passo >= PASSI_CASO && <p className="caso-ok">Confermato da Carla. {G.presaInCarico[0].toUpperCase() + G.presaInCarico.slice(1)} dell'hub attiva.</p>}
        </>
      )}
    </div>
  );
}

/** Alla fine: cosa ha fatto la rete, in poche righe. */
function Bilancio() {
  return (
    <div className="caso-bilancio" data-testid="caso-bilancio">
      <h3>Cosa ha fatto la rete</h3>
      <ul>
        <li>Prima linea vicino a casa, a {SPOKE_CASO.breve}.</li>
        <li>Il farmaco solo hub trovato e prenotato senza telefonate tra ospedali.</li>
        <li>Date controllate sui festivi prima di arrivare a Renato.</li>
        <li>Viaggi, esami e riferimenti organizzati: Carla sa cosa fare e chi chiamare.</li>
      </ul>
    </div>
  );
}
