import type { CSSProperties } from "react";
import { ITINERARIO } from "../data/itinerario";
import { GIOVANNI, INFERMIERA, UROLOGIA_HUB } from "../data/persone";
import { dataBreve, dataLunga } from "../engine/date";
import { useDemo } from "../stato/contesto";
import { SEDUTE_RIABILITAZIONE } from "../data/tratte";

/** Foglio stampabile per Giovanni (A4). Stesso componente a schermo e in stampa. */
export function Foglio() {
  const { s } = useDemo();
  const it = ITINERARIO;
  const allo = s.sede === "schiavonia";
  const bozza = allo && s.passaggio !== "accettato";
  const rifiutato = allo && s.passaggio === "rifiutato";
  return (
    <article className="foglio" data-testid="foglio" aria-label="Promemoria per Giovanni">
      <h1>Il suo percorso di cura, signor Giovanni</h1>
      <p className="sottotitolo">Date, sedi e chi chiamare</p>
      <div className="meta">
        <span>Stampato il 20 novembre 2026. Se cambia qualcosa le diamo un foglio nuovo: butti questo.</span>
        <span>Esempio · dati inventati</span>
      </div>
      {bozza && (
        <p className="bozza">
          {rifiutato
            ? "BOZZA: Schiavonia non può accoglierla. La sede è da ridefinire: non stampare."
            : "BOZZA: lo spoke di Schiavonia non ha ancora confermato. Non stampare."}
        </p>
      )}
      <section className="sez" style={{ "--c": allo ? "var(--spoke)" : "var(--hub)" } as CSSProperties}>
        <h2>{allo ? `Vicino a casa: ${SEDUTE_RIABILITAZIONE} sedute a Schiavonia` : `${SEDUTE_RIABILITAZIONE} sedute a Padova`}</h2>
        <p>
          {allo ? it.luogo_spoke : "Ospedale di Padova – Medicina riabilitativa"} · ore {it.ora_sedute} · martedì e venerdì
        </p>
        <div className="date">
          {it.sedute.map((d) => (
            <span key={d}>
              {dataLunga(d).slice(0, 3)} {dataBreve(d)}
            </span>
          ))}
        </div>
        <p>
          Dal {dataLunga(it.sedute[0])} al {dataLunga(it.sedute[it.sedute.length - 1])} 2027. Niente sedute nei giorni di festa (8 e 25
          dicembre, 1 gennaio). La accompagna {GIOVANNI.accompagnatore}.
        </p>
      </section>
      <section className="sez" style={{ "--c": "var(--hub)" } as CSSProperties}>
        <h2>{allo ? "A Padova, quando serve" : "Il controllo a Padova"}</h2>
        <p>
          <b>
            {dataLunga(it.controllo_hub.data)}, ore {it.controllo_hub.ora}
          </b>
          : controllo urologico, con il risultato dell'esame fatto dopo l'operazione (istologico). {it.controllo_hub.luogo}.
        </p>
      </section>
      <section className="chiamare">
        <div>
          <h2 style={{ margin: 0 }}>Per qualsiasi dubbio, o se non può venire, chiami {INFERMIERA.nome}</h2>
          <p>
            {INFERMIERA.ruolo}, {INFERMIERA.orari}. {INFERMIERA.nome} la conosce già: sarà lei a telefonarle.
          </p>
        </div>
        <span className="tel">{INFERMIERA.telefono}</span>
      </section>
      <section style={{ marginTop: 14 }}>
        <h2>Se una seduta viene annullata</h2>
        <p>Non deve fare nulla: la chiamiamo noi entro 2 giorni lavorativi con la nuova data. Se non la chiamiamo, chiami {INFERMIERA.nome}.</p>
      </section>
      <section>
        <h2>Se si sente peggio</h2>
        <p>
          Febbre che non passa o difficoltà a urinare: chiami l'Urologia dell'ospedale di Padova al <b className="tel-num">{UROLOGIA_HUB.telefono}</b>,
          risponde 24 ore su 24.
          {allo ? " Se serve, la vedono a Padova senza rimetterla in lista d'attesa." : ""} Se è un'urgenza chiami il <b className="tel-num">112</b>.
        </p>
      </section>
      <div className="scelta">
        {allo ? (
          <p data-testid="frase-scelta">La scelta è sua. Può sempre chiedere di fare tutto all'hub (l'ospedale di Padova).</p>
        ) : (
          <p data-testid="frase-scelta">La scelta è sua. Può sempre chiedere di fare le sedute più vicino a casa.</p>
        )}
        <small>Basta dirlo a {INFERMIERA.nome}, anche dopo aver iniziato.</small>
      </div>
      <div className="piede">
        <span>Copia al medico di base: {GIOVANNI.medico_di_base.replace(" (medico di base)", "")}</span>
        <span>Pharos · percorsi di cura connessi</span>
      </div>
    </article>
  );
}
