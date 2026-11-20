import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, Check, FileText, ShieldAlert, Sparkles } from "lucide-react";
import { LETTERA, ESTRAZIONE } from "../data/lettera";
import type { RigaEstratta } from "../data/tipi";
import { fraseNellaLettera } from "../engine/frasi";
import { useDemo } from "../stato/contesto";
import { Testata } from "../componenti/comuni";

const COLORE_TIPO: Record<RigaEstratta["tipo"], string> = {
  fase: "var(--hub)",
  segnale: "var(--accento)",
  parere: "var(--accento)",
  condizione: "var(--paziente)",
};

function Paragrafo({ testo, frasi, attiva, onClick }: { testo: string; frasi: RigaEstratta[]; attiva: string; onClick: (id: string) => void }) {
  const trovate = frasi.filter((f) => testo.includes(f.frase));
  if (!trovate.length) return <p>{testo}</p>;
  const f = trovate[0];
  const i = testo.indexOf(f.frase);
  return (
    <p>
      {testo.slice(0, i)}
      <mark id={`frase-${f.id}`} className={attiva === f.id ? "attiva" : ""} onClick={() => onClick(f.id)}>
        {f.frase}
      </mark>
      {testo.slice(i + f.frase.length)}
    </p>
  );
}

/** Righe estratte con l'esito della verifica della frase d'origine (dal vivo). */
export function righeVerificate() {
  return ESTRAZIONE.righe.map((r) => ({ ...r, valida: fraseNellaLettera(r.frase, LETTERA.paragrafi) }));
}

/** Pannello «dalla lettera alle fasi». Usato dalla scena 1 e dalla vista Hub. */
export function DallaLettera({ avanti }: { avanti?: () => void }) {
  const { s, d, righeValide } = useDemo();
  const [attiva, setAttiva] = useState("r1");
  const righe = righeVerificate();
  const valide = righe.filter((r) => r.valida);
  const tutte = valide.every((r) => s.confermate.includes(r.id));

  useEffect(() => {
    if (attiva) document.getElementById(`frase-${attiva}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [attiva]);

  return (
    <div className="griglia g-11-10">
      <article className="card bordo lettera" style={{ "--c": "var(--hub)" } as CSSProperties} aria-label="Lettera di dimissione">
        <div className="intest">
          <span>
            <FileText size={22} style={{ verticalAlign: "-4px", marginRight: 8 }} aria-hidden="true" />
            <b>{LETTERA.titolo}</b> · {LETTERA.reparto}
          </span>
          <span className="etichetta allarme maiusc">Esempio non clinico</span>
        </div>
        {LETTERA.paragrafi.map((p, i) => (
          <Paragrafo key={i} testo={p} frasi={valide} attiva={attiva} onClick={setAttiva} />
        ))}
        <p className="muted" style={{ fontFamily: "var(--font-ui)", fontSize: 18, margin: 0 }}>
          {LETTERA.etichetta}
        </p>
      </article>
      <div>
        <div className="striscia" style={{ marginBottom: 12 }}>
          <Sparkles size={24} aria-hidden="true" />
          <span>
            Estratto automatico da verificare: decide il medico
            <br />
            <small>Righe preparate prima della demo · il controllo delle frasi gira ora</small>
          </span>
        </div>
        <div className="righe" role="list">
          {righe.map((r) => {
            if (!r.valida)
              return (
                <div key={r.id} className="riga scartata" role="listitem" data-testid="riga-scartata">
                  <div>
                    <div className="titolo">
                      {r.azione} {r.dettaglio}, {r.quando}
                    </div>
                    <div className="sotto">«{r.frase}»</div>
                  </div>
                  <span className="etichetta allarme maiusc">Scartata</span>
                  <div className="perche">
                    <ShieldAlert size={22} aria-hidden="true" /> Frase non presente nella lettera: riga scartata. Il sistema non inventa.
                  </div>
                </div>
              );
            const ok = s.confermate.includes(r.id);
            return (
              <div
                key={r.id}
                role="listitem"
                className={`riga ${attiva === r.id ? "attiva" : ""}`}
                style={{ "--c": COLORE_TIPO[r.tipo] } as CSSProperties}
                onMouseEnter={() => setAttiva(r.id)}
                onClick={() => setAttiva(r.id)}
              >
                <div>
                  <div className="titolo">
                    {r.azione}
                    {r.tipo === "fase" ? ` · ${r.dettaglio}` : ""}
                  </div>
                  <div className="sotto">
                    {r.tipo === "fase" ? r.quando : r.tipo === "condizione" ? r.dettaglio : `${r.dettaglio} · ${r.quando}`}
                  </div>
                </div>
                <button
                  className={`conferma ${ok ? "si" : ""}`}
                  aria-pressed={ok}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttiva(r.id);
                    d({ t: "conferma_riga", id: r.id });
                  }}
                  data-testid={`conferma-${r.id}`}
                >
                  {ok ? (
                    <>
                      <Check size={20} aria-hidden="true" /> Confermata
                    </>
                  ) : (
                    "Confermo"
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div className="piede-scena">
          {tutte ? (
            <span style={{ fontWeight: 700, color: "var(--spoke-testo)" }}>
              <Check size={20} style={{ verticalAlign: "-3px" }} /> {valide.length} righe confermate
            </span>
          ) : (
            <button className="btn-link" onClick={() => d({ t: "conferma_tutte", ids: righeValide })}>
              {s.confermate.length} di {valide.length} confermate · (demo) conferma le altre
            </button>
          )}
          {avanti && (
            <button className="btn btn-pieno" disabled={!tutte} onClick={avanti} data-testid="avanti-1">
              Scelta della sede <ArrowRight size={22} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Scena1Dimissione({ vai }: { vai: (n: number) => void }) {
  return (
    <section className="scena" data-scena="1">
      <Testata
        chi="Urologo · Hub di Padova · dalla lettera di dimissione"
        titolo="Dalla lettera alle fasi: ogni riga ha la sua frase"
        frase="Ogni riga mostra la frase della lettera da cui nasce. Senza frase, la riga è scartata. Decide il medico."
      />
      <DallaLettera avanti={() => vai(1)} />
    </section>
  );
}
