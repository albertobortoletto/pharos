// Tutti i pazienti della demo (FITTIZI) in un solo formato: Giovanni e gli altri.
import { GIOVANNI } from "./persone";
import { ALTRI_PAZIENTI, type PazienteFittizio } from "./schede";

export const PAZIENTI: PazienteFittizio[] = [
  { id: GIOVANNI.id, nome: GIOVANNI.nome, eta: GIOVANNI.eta, comune: GIOVANNI.comune, profilo: GIOVANNI.profilo },
  ...ALTRI_PAZIENTI,
];

export const pazientePerId = (id: string): PazienteFittizio => {
  const p = PAZIENTI.find((x) => x.id === id);
  if (!p) throw new Error(`Paziente sconosciuto: ${id}`);
  return p;
};
