// Vista HUB: urologo e infermiera di percorso di Padova.
import type { ReactNode } from "react";
import { BellRing, Check, ClipboardList, FileText, Inbox, MessageSquareWarning, PhoneCall, Stethoscope, Users } from "lucide-react";
import { PARAMETRI } from "../../data/pdta";
import { GIOVANNI } from "../../data/persone";
import { PROBLEMI_CAREGIVER } from "../../data/motivi";
import { etichettaOraBreve } from "../../engine/orologio";
import { formattaOre } from "../../engine/date";
import { STATI_ATTIVI } from "../../engine/scheda";
import { useStore } from "../../stato/contesto";
import { daChiamare, type SezioneHub } from "../../stato/store";
import { G } from "../../testi/glossario";
import { Testata } from "../../componenti/comuni";
import { DallaLettera } from "../../racconto/Scena1Dimissione";
import { Monitoraggio } from "../../racconto/Scena4Itinerario";
import { RegistroMotivi } from "../../racconto/Scena6ServeHub";
import { TabellaPazienti, inRitardo } from "./TabellaPazienti";
import { PropostaSede } from "./PropostaSede";
import { Pareri } from "./Pareri";

/** In cima al monitoraggio: notifiche non confermate da più di 24 ore e segnalazioni del caregiver. */
function DaChiamare() {
  const { st, d } = useStore();
  const notifiche = daChiamare(st);
  const segnalazioni = st.segnalazioni.filter((x) => !x.gestita);
  return (
    <div className="card da-chiamare" data-testid="da-chiamare">
      <h2>
        <BellRing size={24} aria-hidden="true" /> Notifiche non confermate da più di {PARAMETRI.conferma_paziente_ore} ore → da chiamare
        <span className="conta">{notifiche.length + segnalazioni.length}</span>
      </h2>
      {notifiche.length + segnalazioni.length === 0 && <p className="muted" style={{ margin: 0 }}>Nessuno da chiamare adesso.</p>}
      <ul className="lista-chiamate">
        {segnalazioni.map((x) => (
          <li key={x.id} className="segnalazione" data-testid="segnalazione">
            <MessageSquareWarning size={22} aria-hidden="true" />
            <span>
              <b>
                {GIOVANNI.caregiver.nome} ({GIOVANNI.caregiver.relazione} di {GIOVANNI.nome}): {PROBLEMI_CAREGIVER.find((m) => m.id === x.motivo)?.testo ?? x.motivo}
              </b>
              <small>
                dall'app · {etichettaOraBreve(x.ora)}
                {x.richiamatemi && " · chiede di essere richiamata"}
              </small>
            </span>
            <button className="btn btn-vuoto" onClick={() => d({ t: "segnalazione_gestita", id: x.id })}>
              <Check size={18} aria-hidden="true" /> Gestita
            </button>
          </li>
        ))}
        {notifiche.map((n) => (
          <li key={n.id} data-testid="notifica-da-chiamare">
            <PhoneCall size={22} aria-hidden="true" />
            <span>
              <b>
                {GIOVANNI.caregiver.nome}, per {GIOVANNI.nome}: non ha letto da {formattaOre(st.ora - n.ora)}
              </b>
              <small>«{n.testo}»</small>
            </span>
            <button className="btn btn-vuoto" onClick={() => d({ t: "chiamata_fatta", id: n.id })}>
              <Check size={18} aria-hidden="true" /> Chiamata fatta
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VistaHub() {
  const { st, d } = useStore();
  const ritardi = st.schede.filter((s) => STATI_ATTIVI.includes(s.stato) && inRitardo(s, st)).length;
  const pareri = st.pareri.filter((p) => p.risposta === null).length;
  const chiamate = daChiamare(st).length + st.segnalazioni.filter((x) => !x.gestita).length;
  const SEZIONI: { id: SezioneHub; nome: string; ico: ReactNode; conta?: number; allarme?: boolean }[] = [
    { id: "pazienti", nome: "Pazienti con fasi in corso", ico: <Users size={20} />, conta: ritardi || undefined, allarme: ritardi > 0 },
    { id: "lettera", nome: "Dalla lettera alle fasi", ico: <FileText size={20} /> },
    { id: "proposta", nome: "Proposta di sede", ico: <Stethoscope size={20} /> },
    { id: "pareri", nome: "Pareri in arrivo", ico: <Inbox size={20} />, conta: pareri || undefined },
    { id: "infermiera", nome: "Infermiera di percorso", ico: <PhoneCall size={20} />, conta: chiamate || undefined, allarme: chiamate > 0 },
    { id: "motivi", nome: "Motivi di rifiuto", ico: <ClipboardList size={20} /> },
  ];
  const sez = st.sezioneHub;
  const vai = (x: SezioneHub) => d({ t: "sezione_hub", sezione: x });
  return (
    <section className="scena vista-ruolo" data-vista="hub">
      <Testata chi={`Urologo e ${G.infermieraPrima} · Hub di Padova`} titolo="Il percorso dei pazienti, fase per fase" />
      <nav className="sezioni" aria-label="Sezioni della vista Hub">
        {SEZIONI.map((x) => (
          <button key={x.id} className={sez === x.id ? "attiva" : ""} aria-current={sez === x.id ? "page" : undefined} onClick={() => vai(x.id)} data-testid={`sezione-${x.id}`}>
            {x.ico}
            {x.nome}
            {x.conta !== undefined && <span className={`conta ${x.allarme ? "allarme" : ""}`}>{x.conta}</span>}
          </button>
        ))}
      </nav>
      {sez === "pazienti" && <TabellaPazienti />}
      {sez === "lettera" && <DallaLettera avanti={() => vai("proposta")} />}
      {sez === "proposta" && <PropostaSede />}
      {sez === "pareri" && <Pareri />}
      {sez === "infermiera" && <Monitoraggio inCima={<DaChiamare />} />}
      {sez === "motivi" && (
        <div className="griglia g-7-5">
          <RegistroMotivi />
        </div>
      )}
    </section>
  );
}
