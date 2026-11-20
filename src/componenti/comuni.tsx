import type { ReactNode } from "react";
import { Building2, Hospital, Ticket } from "lucide-react";
import { useDemo } from "../stato/contesto";
import { SOGLIA_POCHI_DATI } from "../engine/similar";

/** Logo di Pharos: faro con la croce nella lanterna, il paziente al centro e tre raggi di luce (assets/pharos-icona.svg). */
export function Logo({ size = 40, tratto = "#fff", luce = "#5BD0E0" }: { size?: number; tratto?: string; luce?: string }) {
  return (
    <svg className="brand-logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g transform="translate(-7 -1.5)">
        <g fill="none" stroke={tratto} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24.5 25.5 L19.4 57.6 Q19 60 21.4 60 H42.6 Q45 60 44.6 57.6 L39.5 25.5" />
          <rect x="21" y="15" width="22" height="10.5" rx="3.2" />
          <path d="M24.2 43 Q27.4 49.6 32 49.6 Q36.6 49.6 39.8 43" />
        </g>
        <path d="M24.5 15 a7.5 7.5 0 0 1 15 0 z" fill={tratto} />
        <circle cx="32" cy="42.4" r="3.2" fill={tratto} />
        <path d="M28.6 48.4 H35.4 L36.6 60 H33.6 L32 53 L30.4 60 H27.4 Z" fill={tratto} />
        <g fill={luce}>
          <rect x="30.7" y="16.9" width="2.6" height="6.7" rx="0.7" />
          <rect x="28.65" y="18.95" width="6.7" height="2.6" rx="0.7" />
        </g>
        <g stroke={luce} strokeWidth="2.6" strokeLinecap="round">
          <path d="M47 15.5 L58 10.5" />
          <path d="M47.5 20.25 H59.5" />
          <path d="M47 25 L58 30" />
        </g>
      </g>
    </svg>
  );
}

/** Etichetta «stima» / «stime». */
export function Stima({ children = "stima" }: { children?: ReactNode }) {
  return <span className="stima">{children}</span>;
}

/** Badge «simulato»: il dato è inventato per la demo. */
export function Simulato({ titolo = "Dato inventato per la demo" }: { titolo?: string }) {
  return (
    <span className="badge-dato simulato" title={titolo}>
      simulato
    </span>
  );
}

/** Badge «dedotto»: il dato è ricostruito da noi, non scritto in un atto. */
export function Dedotto({ titolo = "Ricostruito da noi, non scritto in un atto ufficiale" }: { titolo?: string }) {
  return (
    <span className="badge-dato dedotto" title={titolo}>
      dedotto
    </span>
  );
}

/** Badge «pochi dati»: meno casi della soglia, il numero è poco affidabile. */
export function PochiDati() {
  return (
    <span className="badge-dato pochi" title={`Meno di ${SOGLIA_POCHI_DATI} casi simili: dato poco affidabile`}>
      pochi dati
    </span>
  );
}

export function Testata({ chi, titolo, frase, destra }: { chi: ReactNode; titolo: ReactNode; frase?: ReactNode; destra?: ReactNode }) {
  return (
    <div className="testata">
      <div>
        <div className="chi">
          <span className="pallino" />
          {chi}
        </div>
        <h1>{titolo}</h1>
        {frase && <p className="frase">{frase}</p>}
      </div>
      {destra}
    </div>
  );
}

/** Badge «in carico a»: chi è responsabile adesso. */
export function BadgeResp({ paziente = "giovanni" }: { paziente?: "giovanni" | "luigi" }) {
  const { s } = useDemo();
  if (paziente === "luigi")
    return (
      <div className="resp" data-testid="badge-resp">
        <span className="ico">
          <Hospital size={22} />
        </span>
        <span>
          <small>Follow-up di Luigi M. in carico a</small>
          <b>Hub Padova</b>
        </span>
      </div>
    );
  const allo = s.sede === "schiavonia" && s.passaggio === "accettato";
  const chi = s.sede === "padova" ? "Hub Padova (resta all’hub)" : allo ? "Spoke Schiavonia" : "Hub Padova";
  return (
    <div className={`resp ${allo ? "spoke" : ""}`} data-testid="badge-resp" aria-live="polite">
      <span className="ico">{allo ? <Building2 size={22} /> : <Ticket size={22} />}</span>
      <span>
        <small>Riabilitazione di Giovanni R. in carico a</small>
        <b>{chi}</b>
      </span>
    </div>
  );
}
