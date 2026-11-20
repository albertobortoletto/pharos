import type { ReactNode } from "react";
import { Building2, Hospital, Ticket } from "lucide-react";
import { useDemo } from "../stato/contesto";
import { SOGLIA_POCHI_DATI } from "../engine/similar";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="brand-logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M9 28 C 16 10, 24 10, 31 14" stroke="#F8E05C" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="28" r="7" fill="#4474B4" stroke="#fff" strokeWidth="2" />
      <circle cx="31" cy="14" r="5.5" fill="#74B45C" stroke="#fff" strokeWidth="2" />
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
