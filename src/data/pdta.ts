import type { ParametriPdta, Prestazione } from "./tipi";

export const NOTA_PDTA = "Etichette del PDTA: esempio non clinico, da far approvare al GOM.";

export const PRESTAZIONI: Prestazione[] = [
  { id: "riabilitazione_pavimento_pelvico", nome: "Riabilitazione del pavimento pelvico", etichetta: "spoke" },
  { id: "controllo_urologico_istologico", nome: "Controllo urologico con esito dell'esame istologico", etichetta: "solo_hub" },
  { id: "follow_up_oncologico_uro", nome: "Visita di follow-up oncologico", etichetta: "spoke_con_parere_hub" },
];

/** Parametri del PDTA (esempio). Nessuna vista deve scrivere questi numeri direttamente. */
export const PARAMETRI: ParametriPdta = {
  parere_giorni_lavorativi: 5,
  parere_urgente_ore: 24,
  rientro_priorita_giorni: 7,
  attesa_max_spoke_giorni: 30,
  risposta_spoke_ore: 48,
  conferma_paziente_ore: 24,
  seduta_controllo: 5,
  quesito_max_caratteri: 300,
};

export const prestazione = (id: string): Prestazione => {
  const p = PRESTAZIONI.find((x) => x.id === id);
  if (!p) throw new Error(`Prestazione sconosciuta: ${id}`);
  return p;
};
