import { SCENE, type StatoRacconto } from "./racconto";

const CHIAVE = "hubspoke-demo-v2";

export function salva(s: StatoRacconto) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify({ ...s, passaggio: s.passaggio === "invio" ? "in_attesa" : s.passaggio }));
  } catch {
    /* localStorage non disponibile: la demo funziona lo stesso */
  }
}

export function caricaSalvataggio(): StatoRacconto | null {
  try {
    const grezzo = localStorage.getItem(CHIAVE);
    if (!grezzo) return null;
    const t = JSON.parse(grezzo);
    const valido =
      t &&
      typeof t === "object" &&
      !Array.isArray(t) &&
      Number.isInteger(t.scena) &&
      t.scena >= 0 &&
      t.scena < SCENE.length &&
      Array.isArray(t.visitate) &&
      Array.isArray(t.confermate) &&
      Array.isArray(t.registroDemo) &&
      (t.sede === "schiavonia" || t.sede === "padova") &&
      ["in_attesa", "invio", "accettato", "rifiutato"].includes(t.passaggio) &&
      typeof t.postiLiberi === "number" &&
      !!t.luigi &&
      typeof t.luigi === "object";
    if (!valido) {
      cancellaSalvataggio();
      return null;
    }
    return { ...t, passaggio: t.passaggio === "invio" ? "in_attesa" : t.passaggio };
  } catch {
    cancellaSalvataggio();
    return null;
  }
}

export function cancellaSalvataggio() {
  try {
    localStorage.removeItem(CHIAVE);
  } catch {
    /* niente */
  }
}
