// Vista PAZIENTE / CAREGIVER: Laura (app), Giovanni (SMS e foglio), medico di base (sola lettura).
// Qui non compaiono mai il rischio di rientro, la rete bayesiana o dati clinici.
import { useState } from "react";
import { Bell, BellRing, Check, CheckCircle2, Circle, CircleDot, Eye, MapPin, MessageSquareText, Phone, PhoneCall, Printer, Smartphone, Stethoscope, UserRound } from "lucide-react";
import { GIOVANNI, INFERMIERA } from "../../data/persone";
import { PROBLEMI_CAREGIVER } from "../../data/motivi";
import { strutturaPerId } from "../../data/strutture";
import { dataLunga } from "../../engine/date";
import { etichettaOraBreve } from "../../engine/orologio";
import { kmRisparmiatiAViaggio } from "../../engine/viaggio";
import { useStore } from "../../stato/contesto";
import { aChi, daChi, fasiGiovanni, prossimoAppuntamento, type FasePercorso } from "../../stato/percorso";
import { G } from "../../testi/glossario";
import { Testata } from "../../componenti/comuni";
import { FoglioInScala } from "../../racconto/Scena5Foglio";

type Chi = "laura" | "giovanni" | "medico";

const ICONA = { fatta: CheckCircle2, in_corso: CircleDot, prossima: Circle } as const;
const NOME_STATO_FASE = { fatta: "fatta", in_corso: "in corso", prossima: "prossima" } as const;

function Timeline({ fasi, persona }: { fasi: FasePercorso[]; persona: "tu" | "lui" }) {
  return (
    <ol className="timeline" data-testid="timeline">
      {fasi.map((f, i) => {
        const Ico = ICONA[f.stato];
        const attuale = i === fasi.findIndex((x) => x.stato !== "fatta");
        return (
          <li key={f.id} className={`tl-${f.stato} ${attuale ? "tl-attuale" : ""}`}>
            <Ico size={28} aria-hidden="true" className="tl-ico" />
            <div>
              <b>{f.nome}</b>
              <small>
                {NOME_STATO_FASE[f.stato]} · {f.quando}
              </small>
              <span className="tl-chi">
                {f.stato === "fatta"
                  ? `Seguita ${daChi(f.chi)}`
                  : attuale
                    ? persona === "tu"
                      ? `Ora vi segue ${f.chi}`
                      : `In carico ${aChi(f.chi)}`
                    : persona === "tu"
                      ? `Poi vi seguirà ${f.chi}`
                      : `Poi: ${f.chi}`}
              </span>
              {f.nota && <span className="tl-nota">{f.nota}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ProssimoAppuntamento() {
  const { st } = useStore();
  const a = prossimoAppuntamento(st);
  const km = a.struttura !== "padova" ? kmRisparmiatiAViaggio(GIOVANNI.comune, a.struttura) : 0;
  const s = a.struttura !== "padova" ? strutturaPerId(a.struttura) : null;
  return (
    <div className="app-box" data-testid="prossimo-appuntamento">
      <h3>Prossimo appuntamento</h3>
      <p className="app-data">
        {dataLunga(a.data)}, ore {a.ora}
      </p>
      <p>{a.cosa}</p>
      <p className="app-luogo">
        <MapPin size={18} aria-hidden="true" /> {a.luogo}
        {a.indirizzo && <small>{a.indirizzo}</small>}
      </p>
      <p className="app-portare">
        <b>Cosa portare:</b> {a.cosaPortare.join(", ")}
      </p>
      {s && (
        <div className="perche-qui" data-testid="perche-qui">
          <b>Perché qui</b>
          più vicino a casa, ha la riabilitazione specializzata{km > 0 ? `, ${km} km in meno a viaggio` : ""}.
        </div>
      )}
    </div>
  );
}

function Riferimento() {
  const [chiamata, setChiamata] = useState(false);
  return (
    <div className="app-box riferimento" data-testid="riferimento">
      <h3>Il vostro riferimento</h3>
      <p>
        <b>{INFERMIERA.nome}</b>, {G.infermieraPrima}
        <small>{INFERMIERA.orari}</small>
      </p>
      <button className="btn btn-pieno paziente" onClick={() => setChiamata(true)} data-testid="chiama">
        <Phone size={20} aria-hidden="true" /> Chiama {INFERMIERA.telefono}
      </button>
      {chiamata && <p className="muted piccolo">Demo: nessuna chiamata parte davvero.</p>}
    </div>
  );
}

function HoUnProblema() {
  const { st, d } = useStore();
  const [motivo, setMotivo] = useState<string | null>(null);
  const [richiamatemi, setRichiamatemi] = useState(true);
  const mie = st.segnalazioni.slice(0, 2);
  return (
    <div className="app-box problema" data-testid="ho-un-problema">
      <h3>Ho un problema</h3>
      <div className="motivi-app">
        {PROBLEMI_CAREGIVER.map((m) => (
          <button key={m.id} className={motivo === m.id ? "scelto" : ""} aria-pressed={motivo === m.id} onClick={() => setMotivo(m.id)}>
            {m.testo}
          </button>
        ))}
      </div>
      <label className="spunta">
        <input type="checkbox" checked={richiamatemi} onChange={(e) => setRichiamatemi(e.target.checked)} /> Richiamatemi
      </label>
      <button
        className="btn btn-pieno paziente"
        disabled={!motivo}
        onClick={() => {
          if (!motivo) return;
          d({ t: "segnala_problema", motivo, richiamatemi });
          setMotivo(null);
        }}
        data-testid="invia-problema"
      >
        Invia a {INFERMIERA.nome}
      </button>
      {mie.map((x) => (
        <p key={x.id} className={`inviata ${x.gestita ? "gestita" : ""}`}>
          <Check size={16} aria-hidden="true" /> «{PROBLEMI_CAREGIVER.find((m) => m.id === x.motivo)?.testo}» inviato {etichettaOraBreve(x.ora)}
          {x.gestita ? " · gestito" : x.richiamatemi ? ` · ${INFERMIERA.nome} vi richiama` : ""}
        </p>
      ))}
    </div>
  );
}

function Notifiche() {
  const { st, d } = useStore();
  const app = st.notifiche.filter((n) => n.canale === "app");
  return (
    <div className="app-box notifiche" data-testid="notifiche">
      <h3>
        <Bell size={20} aria-hidden="true" /> Notifiche <span className="conta">{app.filter((n) => !n.letta).length}</span>
      </h3>
      {app.length === 0 && <p className="muted">Nessun avviso per ora.</p>}
      <ul>
        {app.map((n) => (
          <li key={n.id} className={n.letta ? "letta" : "nuova"}>
            <small>{etichettaOraBreve(n.ora)}</small>
            <span>{n.testo}</span>
            {n.letta ? (
              <small className="ok">
                <Check size={14} aria-hidden="true" /> letta {n.oraLettura !== null ? etichettaOraBreve(n.oraLettura) : ""}
              </small>
            ) : (
              <button className="btn btn-vuoto piccolo-btn" onClick={() => d({ t: "notifica_letta", id: n.id })} data-testid="ho-letto">
                Ho letto
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AppLaura() {
  const { st } = useStore();
  return (
    <div className="app-laura" data-testid="app-laura">
      <div className="app-barra">
        <Smartphone size={20} aria-hidden="true" /> App · {GIOVANNI.caregiver.nome}, {GIOVANNI.caregiver.relazione} di {GIOVANNI.nome}
        <span className="muted">dati fittizi</span>
      </div>
      <div className="app-griglia">
        <div className="app-box">
          <h3>Il percorso di {GIOVANNI.nome.split(" ")[0]}</h3>
          <Timeline fasi={fasiGiovanni(st)} persona="tu" />
        </div>
        <div className="app-col">
          <ProssimoAppuntamento />
          <Riferimento />
        </div>
        <div className="app-col">
          <HoUnProblema />
          <Notifiche />
        </div>
      </div>
    </div>
  );
}

function SmsGiovanni() {
  const { st } = useStore();
  const sms = st.notifiche.filter((n) => n.canale === "sms");
  return (
    <div className="griglia g-foglio">
      <FoglioInScala />
      <div className="non-stampare">
        <div className="telefono" aria-label="SMS ricevuti" data-testid="telefono-sms">
          <div className="top">
            <MessageSquareText size={22} style={{ verticalAlign: "-4px" }} aria-hidden="true" /> SMS a {GIOVANNI.sms_a}
            <small>{GIOVANNI.sms_numero} · numero fittizio</small>
          </div>
          {sms.length === 0 && <div className="bolla vuota">Nessun SMS ancora: arriva quando lo spoke conferma la prima seduta.</div>}
          {sms.map((n) => (
            <div key={n.id} className="bolla" data-testid="sms-live">
              <small>{etichettaOraBreve(n.ora)}</small>
              {n.testo}
            </div>
          ))}
          <p className="muted" style={{ textAlign: "center", margin: "6px 0 0", fontSize: 18, fontWeight: 700 }}>
            Data, luogo e numero da chiamare. Nessun dato clinico.
          </p>
        </div>
        <p style={{ fontWeight: 600, margin: "16px 0" }}>
          <PhoneCall size={20} style={{ verticalAlign: "-3px" }} aria-hidden="true" /> Giovanni non usa app: ha il foglio, gli SMS e il numero di {INFERMIERA.nome}.
        </p>
        <button className="btn btn-pieno paziente" onClick={() => window.print()} data-testid="stampa-paziente">
          <Printer size={22} aria-hidden="true" /> Stampa il promemoria
        </button>
      </div>
    </div>
  );
}

function MedicoDiBase() {
  const { st } = useStore();
  const a = prossimoAppuntamento(st);
  return (
    <div className="griglia g-7-5">
      <div className="card" data-testid="medico-di-base">
        <h2>
          <Eye size={22} aria-hidden="true" /> Percorso di {GIOVANNI.nome} · sola lettura
        </h2>
        <Timeline fasi={fasiGiovanni(st)} persona="lui" />
        <p className="app-data" style={{ marginTop: 12 }}>
          Prossimo: {dataLunga(a.data)}, ore {a.ora} — {a.cosa}, {a.luogo}
        </p>
      </div>
      <div className="card">
        <h2>
          <Stethoscope size={22} aria-hidden="true" /> {GIOVANNI.medico_di_base}
        </h2>
        <p className="muted">
          Sola lettura, con copia del promemoria. Per dubbi: {INFERMIERA.nome}, {INFERMIERA.telefono}.
        </p>
      </div>
    </div>
  );
}

export default function VistaPaziente() {
  const [chi, setChi] = useState<Chi>("laura");
  const { st } = useStore();
  const nuove = st.notifiche.filter((n) => n.canale === "app" && !n.letta).length;
  const SCELTE: { id: Chi; nome: string; ico: typeof Smartphone }[] = [
    { id: "giovanni", nome: "Giovanni (SMS e telefono)", ico: MessageSquareText },
    { id: "laura", nome: `${GIOVANNI.caregiver.nome}, ${GIOVANNI.caregiver.relazione} (app)`, ico: Smartphone },
    { id: "medico", nome: "Medico di base (sola lettura)", ico: UserRound },
  ];
  return (
    <section className="scena vista-ruolo" data-vista="paziente">
      <Testata
        chi="Paziente e caregiver"
        titolo="Il percorso visto da casa"
        frase="Chi vi segue, il prossimo appuntamento, chi chiamare."
        destra={
          nuove > 0 ? (
            <span className="avviso-nuove">
              <BellRing size={20} aria-hidden="true" /> {nuove} {nuove === 1 ? "avviso nuovo" : "avvisi nuovi"}
            </span>
          ) : undefined
        }
      />
      <div className="interruttore" role="tablist" aria-label="Chi guarda">
        {SCELTE.map((x) => (
          <button key={x.id} role="tab" aria-selected={chi === x.id} className={chi === x.id ? "attivo" : ""} onClick={() => setChi(x.id)} data-testid={`chi-${x.id}`}>
            <x.ico size={20} aria-hidden="true" /> {x.nome}
          </button>
        ))}
      </div>
      {chi === "laura" && <AppLaura />}
      {chi === "giovanni" && <SmsGiovanni />}
      {chi === "medico" && <MedicoDiBase />}
    </section>
  );
}
