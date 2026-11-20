import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BookOpen, BrainCircuit, Building2, ChevronDown, ChevronLeft, ChevronRight, Clock, Database, Hospital, Map as MapIcon, Maximize, RotateCcw, Route, Smartphone } from "lucide-react";
import { ESTRAZIONE, LETTERA } from "./data/lettera";
import { fraseNellaLettera } from "./engine/frasi";
import { etichettaOra, etichettaOraBreve } from "./engine/orologio";
import { DemoCtx, StoreCtx } from "./stato/contesto";
import { SCENE } from "./stato/racconto";
import { reducer, statoIniziale, vistaRacconto, type Vista } from "./stato/store";
import { cancellaSalvataggio, caricaSalvataggio, salva } from "./stato/persistenza";
import { Logo } from "./componenti/comuni";
import { Foglio } from "./racconto/Foglio";
import Scena1Dimissione from "./racconto/Scena1Dimissione";
import Scena2Sede from "./racconto/Scena2Sede";
import Scena3Passaggio from "./racconto/Scena3Passaggio";
import Scena4Itinerario from "./racconto/Scena4Itinerario";
import Scena5Foglio from "./racconto/Scena5Foglio";
import Scena6ServeHub from "./racconto/Scena6ServeHub";
import VistaMappa from "./viste/mappa/VistaMappa";
import VistaHub from "./viste/hub/VistaHub";
import VistaSpoke from "./viste/spoke/VistaSpoke";
import VistaPaziente from "./viste/paziente/VistaPaziente";
import VistaAi from "./viste/ai/VistaAi";
import VistaCaso from "./viste/caso/VistaCaso";

const COLORI_RUOLO = {
  hub: ["var(--hub)", "var(--hub-tinta)", "var(--hub-testo)"],
  spoke: ["var(--spoke)", "var(--spoke-tinta)", "var(--spoke-testo)"],
  percorso: ["var(--percorso)", "var(--percorso-tinta)", "var(--percorso-testo)"],
  paziente: ["var(--paziente)", "var(--paziente-tinta)", "var(--paziente-testo)"],
  ai: ["var(--accento)", "var(--accento-tinta)", "var(--accento-testo)"],
} as const;

const VISTE: { id: Vista; nome: string; ruolo: keyof typeof COLORI_RUOLO; ico: ReactNode; extra?: boolean }[] = [
  { id: "mappa", nome: "Mappa", ruolo: "percorso", ico: <MapIcon size={20} aria-hidden="true" /> },
  { id: "hub", nome: "Hub", ruolo: "hub", ico: <Hospital size={20} aria-hidden="true" /> },
  { id: "spoke", nome: "Spoke", ruolo: "spoke", ico: <Building2 size={20} aria-hidden="true" /> },
  { id: "paziente", nome: "Paziente/Caregiver", ruolo: "paziente", ico: <Smartphone size={20} aria-hidden="true" /> },
  { id: "caso", nome: "Caso: Renato", ruolo: "percorso", ico: <Route size={20} aria-hidden="true" /> },
  // Approfondimenti: fuori dal percorso principale della demo, nel menu a tendina.
  { id: "ai", nome: "Come ragiona il sistema", ruolo: "ai", ico: <BrainCircuit size={20} aria-hidden="true" />, extra: true },
  { id: "racconto", nome: "Racconto (6 scene)", ruolo: "hub", ico: <BookOpen size={20} aria-hidden="true" />, extra: true },
];

/** Menu «Approfondimenti»: le viste extra, da aprire dopo la demo. Si chiude con Esc o con un clic fuori. */
function MenuApprofondimenti({ vista, vai }: { vista: Vista; vai: (v: Vista) => void }) {
  const [aperto, setAperto] = useState(false);
  const rif = useRef<HTMLDivElement>(null);
  const extra = VISTE.filter((v) => v.extra);
  const attiva = extra.find((v) => v.id === vista);
  useEffect(() => {
    if (!aperto) return;
    const fuori = (e: MouseEvent) => !rif.current?.contains(e.target as Node) && setAperto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAperto(false);
    document.addEventListener("mousedown", fuori);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuori);
      document.removeEventListener("keydown", esc);
    };
  }, [aperto]);
  return (
    <div className="menu-extra" ref={rif}>
      <button className={attiva ? "attiva" : ""} aria-expanded={aperto} aria-haspopup="menu" onClick={() => setAperto(!aperto)} data-testid="menu-approfondimenti">
        {attiva ? attiva.ico : null}
        {attiva ? attiva.nome : "Approfondimenti"} <ChevronDown size={18} aria-hidden="true" />
      </button>
      {aperto && (
        <div className="menu-extra-elenco" role="menu">
          {extra.map((v) => (
            <button
              key={v.id}
              role="menuitem"
              className={v.id === vista ? "attiva" : ""}
              onClick={() => {
                vai(v.id);
                setAperto(false);
              }}
            >
              {v.ico}
              {v.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

const inCampo = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

function Demo() {
  const [st, d] = useReducer(reducer, undefined, () => caricaSalvataggio() ?? statoIniziale());
  const [confermaReset, setConfermaReset] = useState(false);
  const z = useScala();
  useEffect(() => {
    salva(st);
  }, [st]);
  const s = useMemo(() => vistaRacconto(st), [st]);
  const righeValide = useMemo(() => ESTRAZIONE.righe.filter((r) => fraseNellaLettera(r.frase, LETTERA.paragrafi)).map((r) => r.id), []);
  const vai = useCallback((n: number) => d({ t: "vai", scena: n, righeValide }), [righeValide]);
  const racconto = st.vista === "racconto";

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || inCampo(e.target)) return;
      if (e.key === "+") {
        d({ t: "tempo", ore: 24 });
        return;
      }
      if (!racconto) return;
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
  }, [s.scena, vai, racconto]);

  useEffect(() => {
    // Aperta da «Come è calcolato?»: la schermata AI scorre da sola al modello, non in cima.
    if (st.vista === "ai" && st.ai.modello) return;
    window.scrollTo({ top: 0 });
  }, [s.scena, st.vista]);
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
    d({ t: "reset_tutto" });
    setConfermaReset(false);
  };
  const schermoIntero = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const vista = VISTE.find((v) => v.id === st.vista)!;
  let ruolo: keyof typeof COLORI_RUOLO = racconto ? SCENE[s.scena].ruolo : vista.ruolo;
  if (racconto && s.scena === 2 && !(s.passaggio === "accettato" && s.sede === "schiavonia")) ruolo = "hub";
  const [c, tinta, testo] = COLORI_RUOLO[ruolo];
  const stile = { "--ruolo": c, "--ruolo-tinta": tinta, "--ruolo-testo": testo, zoom: z < 1 ? z : undefined } as CSSProperties;
  const Scena = SCENE_COMPONENTI[s.scena];

  return (
    <StoreCtx.Provider value={{ st, d }}>
      <DemoCtx.Provider value={{ s, d, righeValide }}>
        <div className={`app vista-${st.vista}`} style={stile}>
          <div className="banner" role="status">
            <Database size={18} aria-hidden="true" /> Dati simulati · pazienti inventati · API simulata · esempio non clinico
          </div>
          <header className="header">
            <div className="brand">
              <Logo />
              <span>
                Pharos<small>Percorsi di cura connessi</small>
              </span>
            </div>
            <nav className="nav nav-ruoli" aria-label="Viste per ruolo">
              {VISTE.filter((v) => !v.extra).map((v) => (
                <button key={v.id} className={st.vista === v.id ? "attiva" : ""} onClick={() => d({ t: "vista", vista: v.id })} aria-current={st.vista === v.id ? "page" : undefined}>
                  {v.ico}
                  {v.nome}
                </button>
              ))}
              <MenuApprofondimenti vista={st.vista} vai={(v) => d({ t: "vista", vista: v })} />
            </nav>
            <div className="azioni-header">
              <span className="orologio" title={`Data simulata della demo: ${etichettaOra(st.ora)}`}>
                <Clock size={18} aria-hidden="true" /> {etichettaOraBreve(st.ora)}
                <button className="tempo-piu" onClick={() => d({ t: "tempo", ore: 24 })} title="Tempo +1 giorno (demo, tasto +)" aria-label="Tempo più un giorno" data-testid="tempo-piu">
                  +1 g
                </button>
              </span>
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
          {racconto && (
            <nav className="sottonav" aria-label="Scene del racconto">
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
          )}
          <main className="main" key={racconto ? `r${s.scena}` : st.vista}>
            {racconto && <Scena vai={vai} />}
            {st.vista === "mappa" && <VistaMappa />}
            {st.vista === "hub" && <VistaHub />}
            {st.vista === "spoke" && <VistaSpoke />}
            {st.vista === "paziente" && <VistaPaziente />}
            {st.vista === "caso" && <VistaCaso />}
            {st.vista === "ai" && <VistaAi />}
          </main>
          <div className="solo-stampa">
            <Foglio />
          </div>
          {racconto && (
            <>
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
            </>
          )}
        </div>
      </DemoCtx.Provider>
    </StoreCtx.Provider>
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
