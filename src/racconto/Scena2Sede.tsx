import { useState, type CSSProperties } from "react";
import { ArrowRight, Check, CircleSlash, Hospital, MapPin, Undo2, X } from "lucide-react";
import { GIOVANNI } from "../data/persone";
import { prestazione } from "../data/pdta";
import { STRUTTURE, strutturaPerId } from "../data/strutture";
import { SEDUTE_RIABILITAZIONE } from "../data/tratte";
import { MOTIVI_HUB } from "../data/motivi";
import { propostaPdta } from "../engine/propostaPdta";
import { contoViaggio } from "../engine/viaggio";
import { dataLunga } from "../engine/date";
import { useDemo } from "../stato/contesto";
import { BadgeResp, Stima, Testata } from "../componenti/comuni";

const num = (n: number) => n.toLocaleString("it-IT");

/** Tabella del conto del viaggio (10 sedute). La usano scena 2, vista Hub e mappa. */
export function ContoViaggioTabella() {
  const c = contoViaggio(GIOVANNI.comune, SEDUTE_RIABILITAZIONE);
  const kmH = c.tuttoHub.km / c.tuttoHub.viaggi;
  const kmS = c.misto.km / c.misto.viaggi;
  const oreH = c.tuttoHub.ore / c.tuttoHub.viaggi;
  const oreS = c.misto.ore / c.misto.viaggi;
  return (
    <div className="conto" role="table" aria-label={`Conto del viaggio per ${SEDUTE_RIABILITAZIONE} sedute`}>
      <div className="th" role="columnheader">
        A confronto <Stima />
      </div>
      <div className="th col-hub voce" role="columnheader" style={{ color: "var(--hub-testo)" }}>
        Tutto all'hub<small>{SEDUTE_RIABILITAZIONE} sedute a Padova</small>
      </div>
      <div className="th col-misto voce" role="columnheader" style={{ color: "var(--spoke-testo)" }}>
        Misto<small>sedute a Schiavonia</small>
      </div>
      <div className="voce">
        Viaggi<small>andata e ritorno</small>
      </div>
      <div className="col-hub">
        <span className="num">
          {c.tuttoHub.viaggi}
          <small>a Padova</small>
        </span>
      </div>
      <div className="col-misto">
        <span className="num">
          {c.misto.viaggi}
          <small>a Schiavonia</small>
        </span>
      </div>
      <div className="voce">
        Chilometri<small>~{kmH} contro ~{kmS} a viaggio</small>
      </div>
      <div className="col-hub">
        <span className="num">~{num(c.tuttoHub.km)}</span>
      </div>
      <div className="col-misto">
        <span className="num">~{num(c.misto.km)}</span>
      </div>
      <div className="voce">
        Ore di strada<small>~{oreH} contro ~{oreS} a viaggio</small>
      </div>
      <div className="col-hub">
        <span className="num">~{c.tuttoHub.ore}</span>
      </div>
      <div className="col-misto">
        <span className="num">~{c.misto.ore}</span>
      </div>
      <div className="voce ultima">
        Giornate della figlia<small>accompagnatrice</small>
      </div>
      <div className="col-hub ultima">
        <span className="num">
          {c.tuttoHub.giornate}
          <small>intere</small>
        </span>
      </div>
      <div className="col-misto ultima voce">
        <span className="num">
          {c.misto.mezze}
          <small>mezze</small>
        </span>
        <small>(~{c.misto.mezze / 2} giornate)</small>
      </div>
    </div>
  );
}

export function RisparmioViaggio() {
  const c = contoViaggio(GIOVANNI.comune, SEDUTE_RIABILITAZIONE);
  return (
    <div className="risparmio grande">
      <span>
        Con il misto Giovanni evita <b>~{c.risparmio.km} km</b> e <b>~{c.risparmio.ore} ore</b> di strada
      </span>
      <Stima>stime</Stima>
    </div>
  );
}

export default function Scena2Sede({ vai }: { vai: (n: number) => void }) {
  const { s, d } = useDemo();
  const [chiediMotivo, setChiediMotivo] = useState(false);
  const p = prestazione("riabilitazione_pavimento_pelvico");
  const proposta = propostaPdta(p.id, p.etichetta, GIOVANNI.condizioni, STRUTTURE, (x) =>
    x.id === "schiavonia" ? s.postiLiberi : (x.posti_liberi ?? 0),
  );
  const sc = strutturaPerId("schiavonia");
  const motivoTesto = MOTIVI_HUB.find((m) => m.id === s.restaHubMotivo)?.testo;

  return (
    <section className="scena" data-scena="2">
      <Testata
        chi="Urologo · Hub di Padova · scelta della sede, prima della prenotazione"
        titolo="Dove fare la riabilitazione? Si parte da vicino a casa"
        frase="Il sistema propone e spiega, il medico decide, il paziente sceglie."
        destra={<BadgeResp />}
      />
      <div className="griglia g-5-7">
        <div className="card bordo" style={{ "--c": "var(--hub)" } as CSSProperties}>
          <h2>Riabilitazione del pavimento pelvico · 10 sedute</h2>
          <p className="muted" style={{ margin: "-6px 0 14px", fontWeight: 600 }}>
            Entro 30 giorni dalla dimissione · Giovanni R., 70 anni, Montagnana
          </p>
          <button
            className={`opzione ${s.sede === "schiavonia" ? "scelta" : ""}`}
            style={{ "--c": "var(--spoke-testo)" } as CSSProperties}
            onClick={() => !s.sedeConfermata && d({ t: "scegli_sede", sede: "schiavonia" })}
            aria-pressed={s.sede === "schiavonia"}
          >
            <span className="radio" aria-hidden="true" />
            <span>
              <span className="nome">Schiavonia · spoke</span>
              <br />
              <span className="muted" style={{ fontWeight: 600, fontSize: 18 }}>
                Vicino a casa · prima data utile {dataLunga(sc.prima_data_utile!)}
              </span>
            </span>
            <span className="etichetta spoke maiusc">Proposta</span>
          </button>
          <button
            className={`opzione ${s.sede === "padova" ? "scelta" : ""}`}
            style={{ "--c": "var(--hub-testo)" } as CSSProperties}
            onClick={() => {
              if (!s.sedeConfermata) setChiediMotivo(true);
            }}
            aria-pressed={s.sede === "padova"}
          >
            <span className="radio" aria-hidden="true" />
            <span>
              <span className="nome">Padova · hub</span>
              <br />
              <span className="muted" style={{ fontWeight: 600, fontSize: 18 }}>
                Sempre possibile, indicando un motivo
              </span>
            </span>
            <Hospital size={26} color="var(--hub-testo)" aria-hidden="true" />
          </button>
          <h3 style={{ marginTop: 14 }}>Perché è nata questa proposta</h3>
          <ul className="perche-lista">
            {proposta.motivi.map((m) => (
              <li key={m.testo}>
                <Check size={22} color="var(--spoke-testo)" strokeWidth={3} aria-hidden="true" />
                {m.testo}
              </li>
            ))}
            {proposta.scartate.map((x) => (
              <li key={x.nome} className="muted">
                <CircleSlash size={22} aria-hidden="true" />
                {x.nome}: {x.perche}, nessuna proposta
              </li>
            ))}
          </ul>
          <p className="muted" style={{ margin: "12px 0 0", fontSize: 18, fontWeight: 600 }}>
            <MapPin size={18} style={{ verticalAlign: "-3px" }} aria-hidden="true" /> Il controllo urologico tra 6 settimane resta a
            Padova: il PDTA lo prevede solo all'hub.
          </p>
        </div>
        <div>
          <RisparmioViaggio />
          <ContoViaggioTabella />
          <div style={{ marginTop: 16 }}>
            {!s.sedeConfermata && !chiediMotivo && (
              <div className="azioni destra">
                <button className="btn btn-vuoto" onClick={() => setChiediMotivo(true)} data-testid="resta-hub">
                  Resta all'hub (motivo)
                </button>
                <button className="btn btn-pieno spoke" onClick={() => d({ t: "conferma_sede" })} data-testid="conferma-sede">
                  <Check size={22} aria-hidden="true" /> Confermo Schiavonia
                </button>
              </div>
            )}
            {!s.sedeConfermata && chiediMotivo && (
              <div className="motivi tre" ref={(el) => el?.scrollIntoView({ block: "nearest" })} role="dialog" aria-label="Motivo per restare all'hub">
                <p>Perché Giovanni resta all'hub? Il motivo viene registrato.</p>
                <ul>
                  {MOTIVI_HUB.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => {
                          d({ t: "resta_hub", motivo: m.id });
                          setChiediMotivo(false);
                        }}
                      >
                        {m.testo}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className="btn-link"
                  onClick={() => {
                    setChiediMotivo(false);
                    d({ t: "scegli_sede", sede: "schiavonia" });
                  }}
                >
                  <X size={18} style={{ verticalAlign: "-3px" }} /> Annulla: resta la proposta Schiavonia
                </button>
              </div>
            )}
            {s.sedeConfermata && s.sede === "schiavonia" && (
              <div className="esito spoke" data-testid="esito-sede">
                <Check size={30} color="var(--spoke-testo)" strokeWidth={3} aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <b>Schiavonia confermata. Ora tocca allo spoke accettare.</b>
                  Fino ad allora Giovanni resta in carico all'hub. Proposta a Giovanni e alla figlia Laura: sono d'accordo, e possono cambiare
                  idea in ogni momento.
                  <div className="azioni" style={{ marginTop: 10 }}>
                    <button className="btn btn-pieno" onClick={() => vai(2)} data-testid="avanti-2">
                      Presa in carico <ArrowRight size={22} aria-hidden="true" />
                    </button>
                    <button className="btn-link" onClick={() => d({ t: "annulla_sede" })}>
                      <Undo2 size={18} style={{ verticalAlign: "-3px" }} /> Annulla la scelta
                    </button>
                  </div>
                </div>
              </div>
            )}
            {s.sedeConfermata && s.sede === "padova" && (
              <div className="esito hub" data-testid="esito-sede">
                <Hospital size={30} color="var(--hub-testo)" aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <b>Giovanni resta all'hub.</b>
                  Motivo registrato: «{motivoTesto}». Va tra i motivi di rifiuto.
                  <div className="azioni" style={{ marginTop: 10 }}>
                    <button className="btn-link" onClick={() => d({ t: "annulla_sede" })}>
                      <Undo2 size={18} style={{ verticalAlign: "-3px" }} /> Annulla la scelta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
