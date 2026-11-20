export const NOTA_LUIGI = "Secondo paziente fittizio. Esempio non clinico.";

export const CASO_LUIGI = {
  paziente: "luigi",
  fase: {
    prestazione: "follow_up_oncologico_uro",
    nome: "Visita di follow-up oncologico a 12 mesi",
    etichetta: "spoke_con_parere_hub" as const,
    data_hub: "2026-12-10",
    data_spoke: "2026-12-03",
  },
  estratto_gom:
    "Follow-up dopo prostatectomia. L'urologo vuole rivedere gli esami recenti con il GOM, il gruppo oncologico multidisciplinare.",
  frase_origine: "Follow-up a 12 mesi secondo il PDTA, con esami recenti da valutare.",
};
