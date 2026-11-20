// Scheda del rischio di rientro (rete bayesiana). La stessa in vista Hub, vista Spoke e mappa.
import { useState } from "react";
import { Info } from "lucide-react";
import { rischioPerStruttura } from "../engine/matching";
import { livelloRischio } from "../engine/bayes";
import { nomeValore, percento, punti } from "../engine/spiegazioni";
import { MODELLI, type IdModello } from "../testi/ai";
import { G } from "../testi/glossario";
import { Simulato } from "./comuni";

/** Link «Come è calcolato?»: apre la scheda del modello, presa da testi/ai.ts. */
export function ComeCalcolato({ modello }: { modello: IdModello }) {
  const [aperto, setAperto] = useState(false);
  const m = MODELLI[modello];
  return (
    <span className="come-calcolato">
      <button className="btn-link" onClick={() => setAperto((x) => !x)} aria-expanded={aperto}>
        <Info size={16} style={{ verticalAlign: "-2px" }} aria-hidden="true" /> Come è calcolato?
      </button>
      {aperto && (
        <span className="come-pop" role="note">
          <b>{m.nome}</b>
          {m.aCosaServe}
          <span className="muted">
            {m.limiti[0]}. {m.nonFa}
          </span>
        </span>
      )}
    </span>
  );
}

export function SchedaRischio({ profilo, comune, struttura, compatta = false }: { profilo: Record<string, string>; comune: string; struttura: string; compatta?: boolean }) {
  const { rischio, fattori } = rischioPerStruttura(profilo, comune, struttura);
  const livello = livelloRischio(rischio);
  return (
    <div className={`scheda-rischio liv-${livello} ${compatta ? "compatta" : ""}`} data-testid="scheda-rischio">
      <div className="sr-testa">
        <span className="sr-numero">{percento(rischio)}</span>
        <span>
          <b>
            {G.rischio[0].toUpperCase() + G.rischio.slice(1)} {livello}
          </b>
          <small>
            stima della rete bayesiana <Simulato />
          </small>
        </span>
      </div>
      <ul className="sr-fattori">
        {fattori.map((f) => (
          <li key={f.nodo} className={f.punti > 0 ? "alza" : "abbassa"}>
            <span className="sr-punti">{punti(f.punti)}</span>
            <span>
              {f.nome}: <b>{nomeValore(f.nodo, f.valore)}</b>
              <small> rispetto a «{nomeValore(f.nodo, f.confronto)}»</small>
            </span>
          </li>
        ))}
      </ul>
      <ComeCalcolato modello="bayes" />
    </div>
  );
}
