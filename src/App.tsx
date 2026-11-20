import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Database, Maximize, RotateCcw } from "lucide-react";
import { strutturaPerId } from "./data/strutture";
import { ESTRAZIONE, LETTERA } from "./data/lettera";
import { fraseNellaLettera } from "./engine/frasi";
import { DemoCtx } from "./stato/contesto";
import { SCENE, reducerRacconto, statoInizialeRacconto } from "./stato/racconto";
import { cancellaSalvataggio, caricaSalvataggio, salva } from "./stato/persistenza";
import { Logo } from "./componenti/comuni";
import { Foglio } from "./racconto/Foglio";
import Scena1Dimissione from "./racconto/Scena1Dimissione";
import Scena2Sede from "./racconto/Scena2Sede";
import Scena3Passaggio from "./racconto/Scena3Passaggio";
import Scena4Itinerario from "./racconto/Scena4Itinerario";
import Scena5Foglio from "./racconto/Scena5Foglio";
import Scena6ServeHub from "./racconto/Scena6ServeHub";

const COLORI_RUOLO = {
  hub: ["var(--hub)", "var(--hub-tinta)", "var(--hub-testo)"],
  spoke: ["var(--spoke)", "var(--spoke-tinta)", "var(--spoke-testo)"],
  percorso: ["var(--percorso)", "var(--percorso-tinta)", "var(--percorso-testo)"],
  paziente: ["var(--paziente)", "var(--paziente-tinta)", "var(--paziente-testo)"],
} as const;

const SCENE_COMPONENTI = [Scena1Dimissione, Scena2Sede, Scena3Passaggio, Scena4Itinerario, Scena5Foglio, Scena6ServeHub];

/** Fattore di scala per proiettare il layout 1920×1080 su schermi più piccoli. */
function useScala() {
  const [z, setZ] = useState(1);
  useLayoutEffect(() => {
    const f = () => setZ(Math.min(1, window.innerWidth / 1920, window.innerHeight / 1080));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return z;
}

const postiIniziali = () => strutturaPerId("schiavonia").posti_liberi ?? 0;

function Demo() {
  const [s, d] = useReducer(reducerRacconto, undefined, () => caricaSalvataggio() ?? statoInizialeRacconto(postiIniziali()));
  const [confermaReset, setConfermaReset] = useState(false);
  const z = useScala();
  useEffect(() => {
    salva(s);
  }, [s]);
  const righeValide = useMemo(() => ESTRAZIONE.righe.filter((r) => fraseNellaLettera(r.frase, LETTERA.paragrafi)).map((r) => r.id), []);
  const vai = useCallback((n: number) => d({ t: "vai", scena: n, righeValide }), [righeValide]);

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        vai(s.scena + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        vai(s.scena - 1);
      } else if (e.key === "Home") vai(0);
      else if (e.key === "End") vai(SCENE.length - 1);
      else if (/^[1-6]$/.test(e.key)) vai(Number(e.key) - 1);
    };
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  }, [s.scena, vai]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [s.scena]);
  useEffect(() => {
    if (!confermaReset) return;
    const t = setTimeout(() => setConfermaReset(false), 4000);
    return () => clearTimeout(t);
  }, [confermaReset]);

  const ricomincia = () => {
    if (!confermaReset) {
      setConfermaReset(true);
      return;
    }
    cancellaSalvataggio();
    d({ t: "reset", stato: statoInizialeRacconto(postiIniziali()) });
    setConfermaReset(false);
  };
  const schermoIntero = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  let ruolo: keyof typeof COLORI_RUOLO = SCENE[s.scena].ruolo;
  if (s.scena === 2 && !(s.passaggio === "accettato" && s.sede === "schiavonia")) ruolo = "hub";
  const [c, tinta, testo] = COLORI_RUOLO[ruolo];
  const stile = { "--ruolo": c, "--ruolo-tinta": tinta, "--ruolo-testo": testo, zoom: z < 1 ? z : undefined } as CSSProperties;
  const Scena = SCENE_COMPONENTI[s.scena];

  return (
    <DemoCtx.Provider value={{ s, d, righeValide }}>
      <div className="app" style={stile}>
        <div className="banner" role="status">
          <Database size={18} aria-hidden="true" /> Dati simulati · pazienti inventati · API simulata · esempio non clinico
        </div>
        <header className="header">
          <div className="brand">
            <Logo />
            <span>
              HubSpoke<small>Medical Journey</small>
            </span>
          </div>
          <nav className="nav" aria-label="Scene della demo">
            {SCENE.map((x, i) => (
              <button
                key={x.id}
                className={`${i === s.scena ? "attiva" : ""} ${s.visitate.includes(i) ? "visitata" : ""}`}
                onClick={() => vai(i)}
                aria-current={i === s.scena ? "step" : undefined}
              >
                <span className="n">{i + 1}</span>
                {x.breve}
              </button>
            ))}
          </nav>
          <div className="azioni-header">
            <button className="btn-header" onClick={schermoIntero} title="Schermo intero" aria-label="Schermo intero">
              <Maximize size={20} />
            </button>
            <button className={`btn-header ${confermaReset ? "conferma" : ""}`} onClick={ricomincia} data-testid="ricomincia">
              <RotateCcw size={20} />
              {confermaReset ? (
                "Clic di nuovo per ricominciare"
              ) : (
                <>
                  Ricomincia<span className="lungo"> demo</span>
                </>
              )}
            </button>
          </div>
        </header>
        <div className="fascia-ruolo" aria-hidden="true" />
        <main className="main" key={s.scena}>
          <Scena vai={vai} />
        </main>
        <div className="solo-stampa">
          <Foglio />
        </div>
        <div className="avanzamento" aria-hidden="true">
          {SCENE.map((x, i) => (
            <span key={x.id} className={i <= s.scena ? "pieno" : ""} />
          ))}
        </div>
        <div className="contatore non-stampare">
          <button onClick={() => vai(s.scena - 1)} disabled={s.scena === 0} aria-label="Scena precedente">
            <ChevronLeft size={20} />
          </button>
          <span>
            {s.scena + 1} / {SCENE.length}
          </span>
          <button onClick={() => vai(s.scena + 1)} disabled={s.scena === SCENE.length - 1} aria-label="Scena successiva">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </DemoCtx.Provider>
  );
}

class Protezione extends Component<{ children: ReactNode }, { errore: boolean }> {
  state = { errore: false };
  static getDerivedStateFromError() {
    return { errore: true };
  }
  render() {
    if (!this.state.errore) return this.props.children;
    return (
      <div className="app">
        <div className="banner">Dati simulati · pazienti inventati · API simulata</div>
        <div className="main" style={{ textAlign: "center", paddingTop: 120 }}>
          <h1>La demo si è interrotta</h1>
          <button
            className="btn btn-pieno"
            onClick={() => {
              cancellaSalvataggio();
              location.reload();
            }}
          >
            Ricomincia demo
          </button>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <Protezione>
      <Demo />
    </Protezione>
  );
}

