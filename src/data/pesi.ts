// Pesi del punteggio di abbinamento. Impostazioni predefinite: DA CONCORDARE CON I CLINICI.

export interface Pesi {
  rischio: number;
  esperienza: number;
  vicinanza: number;
  rapidita: number;
}

export const PESI_PREDEFINITI: Pesi = {
  rischio: 0.35,
  esperienza: 0.25,
  vicinanza: 0.25,
  rapidita: 0.15,
};

export const NOMI_PESI: Record<keyof Pesi, string> = {
  rischio: "Rischio di rientro (basso è meglio)",
  esperienza: "Esperienza su casi simili",
  vicinanza: "Vicinanza a casa",
  rapidita: "Rapidità di accesso",
};

/** Distanza (km di sola andata) oltre la quale la vicinanza vale zero. */
export const KM_VICINANZA_ZERO = 80;
/** Attesa (giorni) oltre la quale la rapidità vale zero: l'attesa massima allo spoke del PDTA. */
export const NOTA_PESI = "Impostazioni predefinite da concordare con i clinici.";
