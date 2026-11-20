import { useState, type CSSProperties } from "react";
import { Building2, Check, ClipboardList, Hospital, Lightbulb, Undo2, X } from "lucide-react";
import { CASO_LUIGI } from "../data/casoLuigi";
import { LUIGI } from "../data/persone";
import { MOTIVI_HUB, MOTIVI_SPOKE, REGISTRO_VOCI } from "../data/motivi";
import type { VoceRegistro } from "../data/tipi";
import { contaMotivi } from "../engine/registro";
import { contoViaggio } from "../engine/viaggio";
import { dataBreve, dataLunga } from "../engine/date";
import { useDemo } from "../stato/contesto";
import { BadgeResp, Stima, Testata } from "../componenti/comuni";

const TIPI: Record<VoceRegistro["tipo"], string> = { resta_hub: "Resta all’hub", spoke_non_puo: "Lo spoke non può", serve_hub: "Serve l’hub" };
const TUTTI_I_MOTIVI = [...MOTIVI_HUB, ...MOTIVI_SPOKE.filter((m) => !MOTIVI_HUB.some((h) => h.id === m.id))];
const testoMotivo = (id: string) => TUTTI_I_MOTIVI.find((m) => m.id === id)?.testo ?? id;

/** Registro dei motivi di rifiuto. Usato dalla scena 6 e dalla vista Hub. */
export function RegistroMotivi({ evidenzia }: { evidenzia?: string | null }) {
  const { s } = useDemo();
  const voci = [...s.registroDemo, ...REGISTRO_VOCI];
  const barre = contaMotivi(voci, TUTTI_I_MOTIVI);
  const max = Math.max(...barre.map((b) => b.n));
  return (
    <div className="card bordo" style={{ "--c": "var(--notte)" } as CSSProperties} data-testid="registro-no">
      <div className="azioni" style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>
          <ClipboardList size={26} aria-hidden="true" /> Motivi di rifiuto
        </h2>
        <span className="etichetta allarme maiusc">Simulazione · pazienti fittizi</span>
      </div>
      <p className="muted" style={{ margin: "0 0 10px", fontWeight: 600, fontSize: 18 }}>
        Ultimi 30 giorni: chi resta all'hub, gli spoke che non possono, «serve l'hub». Elenco chiuso, nessun testo libero.
      </p>
      <div className="barre">
        {barre.map((b) => (
          <div key={b.id} className={`barra ${b.id === evidenzia ? "nuova" : ""}`} data-motivo={b.id}>
            <span className="t">{b.testo}</span>
            <span className="n">{b.n}</span>
            <span className="b">
              <i style={{ width: `${(b.n / max) * 100}%` }} />
            </span>
          </div>
        ))}
      </div>
      <h3 style={{ margin: "12px 0 6px" }}>Ultime voci</h3>
      <ul className="voci">
        {voci.slice(0, 2).map((v, i) => (
          <li key={`${v.data}-${v.tipo}-${i}`} className={v.demo ? "nuova" : ""}>
            <span>{dataBreve(v.data)}</span>
            <span className={`etichetta ${v.chi === "Spoke" ? "spoke" : "hub"}`}>{TIPI[v.tipo]}</span>
            <span>
              {v.fase} · {testoMotivo(v.motivo)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Scena6ServeHub() {
  const { s, d } = useDemo();
  const [chiedi, setChiedi] = useState(false);
  const [scelto, setScelto] = useState("clinico");
  const caso = CASO_LUIGI;
  const conto = contoViaggio(LUIGI.comune, 1);
  const voci = [...s.registroDemo, ...REGISTRO_VOCI];
  const evidenzia = s.luigi.esito === "serve_hub" ? s.luigi.motivo : null;
  const clinici = voci.filter((v) => v.motivo === "clinico").length;
  const mancanoPosti = voci.filter((v) => v.motivo === "agenda_oltre" || v.motivo === "posti_esauriti").length;

  return (
    <section className="scena" data-scena="6">
      <Testata
        chi="Urologo · Hub di Padova · secondo paziente"
        titolo="Quando serve l'hub: ogni rifiuto ha il suo motivo"
        frase="Il medico può sempre dire no. Basta dire perché."
        destra={<BadgeResp paziente="luigi" />}
      />
      <div className="griglia g-6-6">
        <div className="card bordo" style={{ "--c": "var(--hub)" } as CSSProperties}>
          <div className="azioni" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>
              {LUIGI.nome}, {LUIGI.eta} anni · {LUIGI.comune}
            </h2>
            <span className="etichetta accento maiusc">Spoke con parere dell'hub</span>
          </div>
          <p style={{ margin: "0 0 6px" }}>
            <b>{caso.fase.nome}</b>
          </p>
          <p className="muted" style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 18 }}>
            {caso.estratto_gom} Esempio non clinico.
          </p>
          <div className="esito spoke" style={{ marginBottom: 14 }}>
            <Building2 size={30} color="var(--spoke-testo)" aria-hidden="true" />
            <div>
              <b>Proposta: Schiavonia, {dataLunga(caso.fase.data_spoke)}</b>A Padova la prima data è il {dataBreve(caso.fase.data_hub)}. Evita ~
              {conto.risparmio.km} km e ~{conto.risparmio.ore} ora a viaggio <Stima />. Con parere dell'hub sugli esiti.
            </div>
          </div>
          {s.luigi.esito === null && !chiedi && (
            <div className="azioni">
              <button className="btn btn-pieno" onClick={() => setChiedi(true)} data-testid="serve-hub">
                <Hospital size={22} aria-hidden="true" /> Serve l'hub (motivo)
              </button>
              <button className="btn btn-vuoto" onClick={() => d({ t: "luigi_spoke" })} data-testid="luigi-spoke">
                Confermo Schiavonia
              </button>
            </div>
          )}
          {s.luigi.esito === null && chiedi && (
            <div className="motivi" ref={(el) => el?.scrollIntoView({ block: "nearest" })} role="dialog" aria-label="Motivo per cui serve l'hub">
              <p>Perché serve l'hub? Elenco chiuso, nessun testo clinico libero.</p>
              <ul>
                {MOTIVI_HUB.map((m) => (
                  <li key={m.id}>
                    <button className={scelto === m.id ? "scelto" : ""} aria-pressed={scelto === m.id} onClick={() => setScelto(m.id)} data-testid={`motivo-${m.id}`}>
                      {scelto === m.id ? <Check size={20} aria-hidden="true" /> : <span style={{ width: 20 }} />}
                      {m.testo}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="azioni">
                <button
                  className="btn btn-pieno"
                  onClick={() => {
                    d({ t: "luigi_serve_hub", motivo: scelto });
                    setChiedi(false);
                  }}
                  data-testid="registra-motivo"
                >
                  <ClipboardList size={22} aria-hidden="true" /> Registra: serve l'hub
                </button>
                <button className="btn-link" onClick={() => setChiedi(false)}>
                  <X size={18} style={{ verticalAlign: "-3px" }} /> Annulla
                </button>
              </div>
            </div>
          )}
          {s.luigi.esito === "serve_hub" && (
            <div className="esito hub" data-testid="esito-luigi">
              <Hospital size={30} color="var(--hub-testo)" aria-hidden="true" />
              <div>
                <b>Luigi resta all'hub: visita a Padova il {dataBreve(caso.fase.data_hub)}.</b>
                Motivo registrato: «{testoMotivo(s.luigi.motivo!)}». Si aggiunge ai motivi di rifiuto, a destra.
                <div>
                  <button className="btn-link" onClick={() => d({ t: "annulla_luigi" })}>
                    <Undo2 size={18} style={{ verticalAlign: "-3px" }} /> Annulla (demo)
                  </button>
                </div>
              </div>
            </div>
          )}
          {!chiedi && (
            <div className="segnale">
              <Lightbulb size={24} aria-hidden="true" style={{ flex: "none" }} />
              <span>
                Cosa dicono i motivi alla Rete oncologica: <b>{mancanoPosti} volte</b> in 30 giorni mancavano posti o date a Schiavonia, lì servono posti di
                riabilitazione.
                {evidenzia === "clinico" && (
                  <>
                    {" "}
                    E <b>{clinici} volte</b> serviva una competenza dell'hub: lì il trasferimento non va forzato.
                  </>
                )}
              </span>
            </div>
          )}
          {s.luigi.esito === "spoke" && (
            <div className="esito spoke">
              <Check size={30} color="var(--spoke-testo)" aria-hidden="true" />
              <div>
                <b>Schiavonia confermata, con parere dell'hub.</b>
                Parte il passaggio protetto, come per Giovanni.
                <div>
                  <button className="btn-link" onClick={() => d({ t: "annulla_luigi" })}>
                    <Undo2 size={18} style={{ verticalAlign: "-3px" }} /> Annulla (demo)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <RegistroMotivi evidenzia={evidenzia} />
      </div>
    </section>
  );
}
