export const NOTA_PERSONE = "Persone e numeri di telefono inventati.";

export const GIOVANNI = {
  id: "giovanni",
  nome: "Giovanni R.",
  eta: 70,
  comune: "Montagnana",
  condizioni: { non_guida: true, serve_accompagnatore: true, difficolta_movimento: false },
  accompagnatore: "Laura, la figlia",
  caregiver: { nome: "Laura", relazione: "figlia" },
  sms_a: "Laura (figlia)",
  sms_numero: "333 000 0101",
  medico_di_base: "Dott.ssa Bianchi (medico di base)",
  /**
   * Evidenza per la rete bayesiana (fittizia). Le chiavi sono i nodi di bn_cpt.json.
   * Le domande del case manager completano ciò che manca nel FSE.
   */
  profilo: {
    eta: "65-75",
    comorbidita: "1",
    stadio: "localizzato",
    tipo_intervento: "robotica",
    complicanza_postop: "no",
    stato_funzionale: "parziale",
    accompagnatore: "si",
  } as Record<string, string>,
};

export const LUIGI = {
  id: "luigi",
  nome: "Luigi M.",
  eta: 66,
  comune: "Este",
  condizioni: { non_guida: false, serve_accompagnatore: false, difficolta_movimento: false },
};

export const INFERMIERA = {
  nome: "Marta",
  ruolo: "infermiera di percorso",
  telefono: "049 000 1234",
  orari: "lunedì–venerdì, 8:00–16:00",
};

export const UROLOGIA_HUB = { nome: "Urologia – hub di Padova", telefono: "049 000 5678" };
export const RIABILITAZIONE_SPOKE = { nome: "Medicina riabilitativa – spoke di Schiavonia" };
