import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, MessageSquareText, Printer, UserRound } from "lucide-react";
import { ITINERARIO } from "../data/itinerario";
import { GIOVANNI, INFERMIERA } from "../data/persone";
import { dataLunga } from "../engine/date";
import { useDemo } from "../stato/contesto";
import { BadgeResp, Testata } from "../componenti/comuni";
import { Foglio } from "./Foglio";

const LARGHEZZA_A4 = 794;
const ALTEZZA_A4 = 1123;

/** Foglio A4 ridotto in scala per stare nello schermo. */
export function FoglioInScala() {
  const wrap = useRef<HTMLDivElement>(null);
  const interno = useRef<HTMLDivElement>(null);
  const [altezza, setAltezza] = useState(ALTEZZA_A4);
  const [scala, setScala] = useState(0.75);
  useLayoutEffect(() => {
    const misura = () => {
      const el = wrap.current;
      if (!el) return;
      const z = Math.min(1, window.innerWidth / 1920, window.innerHeight / 1080);
      const top = (el.getBoundingClientRect().top + window.scrollY) / z;
      const h = window.innerHeight / z;
      const alto = interno.current?.offsetHeight ?? ALTEZZA_A4;
      setAltezza(alto);
      setScala(Math.max(0.55, Math.min(1, (h - top - 24) / alto)));
    };
    misura();
    window.addEventListener("resize", misura);
    return () => window.removeEventListener("resize", misura);
  }, []);
  return (
    <div ref={wrap} className="foglio-wrap" style={{ height: altezza * scala, width: LARGHEZZA_A4 * scala }}>
      <div ref={interno} className="foglio-scala" style={{ transform: `scale(${scala})` }}>
        <Foglio />
      </div>
    </div>
  );
}

/** Anteprima del telefono con gli SMS. Nessun SMS viene inviato. */
export function TelefonoSms() {
  const { s } = useDemo();
  const allo = s.sede === "schiavonia";
  const it = ITINERARIO;
  return (
    <div className="telefono" aria-label="Anteprima SMS">
      <div className="top">
        <MessageSquareText size={22} style={{ verticalAlign: "-4px" }} aria-hidden="true" /> SMS a {GIOVANNI.sms_a}
        <small>{GIOVANNI.sms_numero} · numero fittizio</small>
      </div>
      <div className="bolla" data-testid="sms">
        <small>Oggi, 10:45</small>
        {allo ? (
          <>
            Giovanni ha la 1ª seduta di riabilitazione {dataLunga(it.sedute[0])} ore {it.ora_sedute} all'Ospedale di Schiavonia, piano terra. Dubbi o
            disdette: {INFERMIERA.nome}, {INFERMIERA.telefono} (lun–ven 8–16). Tutte le date sono sul foglio. Non risponda a questo SMS: telefoni.
          </>
        ) : (
          <>
            Giovanni ha la 1ª seduta di riabilitazione {dataLunga(it.sedute[0])} ore {it.ora_sedute} a Padova. Dubbi: {INFERMIERA.nome},{" "}
            {INFERMIERA.telefono} (lun–ven 8–16).
          </>
        )}
      </div>
      <div className="bolla">
        <small>Il giorno prima, 18:00</small>
        Domani ore {it.ora_sedute} seduta a {allo ? "Schiavonia" : "Padova"}. Per disdire o spostare: {INFERMIERA.nome}, {INFERMIERA.telefono}, domattina
        dalle 8.
      </div>
      <p className="muted" style={{ textAlign: "center", margin: "6px 0 0", fontSize: 18, fontWeight: 700 }}>
        Anteprima: nessun SMS viene inviato
      </p>
    </div>
  );
}

export default function Scena5Foglio({ vai }: { vai: (n: number) => void }) {
  return (
    <section className="scena" data-scena="5">
      <Testata
        chi="Giovanni e la figlia Laura · nessuna app"
        titolo="Promemoria per il paziente: un foglio e un SMS"
        frase="La scelta è sua. Può sempre chiedere di fare tutto all'hub."
        destra={<BadgeResp />}
      />
      <div className="griglia g-foglio">
        <FoglioInScala />
        <div className="non-stampare">
          <TelefonoSms />
          <p style={{ fontWeight: 600, margin: "16px 0" }}>
            <UserRound size={20} style={{ verticalAlign: "-3px" }} aria-hidden="true" /> Copia del promemoria al medico di base:{" "}
            {GIOVANNI.medico_di_base.replace(" (medico di base)", "")}.
          </p>
          <div className="azioni">
            <button className="btn btn-pieno paziente" onClick={() => window.print()} data-testid="stampa">
              <Printer size={22} aria-hidden="true" /> Stampa il promemoria
            </button>
            <button className="btn btn-vuoto" onClick={() => vai(5)} data-testid="avanti-5">
              Serve l'hub <ArrowRight size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
