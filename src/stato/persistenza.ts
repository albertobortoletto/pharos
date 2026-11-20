import type { Stato } from "./store";

const CHIAVE = "pharos-demo-v3";

export function salva(s: Stato) {
  try {
    const daSalvare: Stato = { ...s, giovanni: { ...s.giovanni, invioInCorso: false } };
    localStorage.setItem(CHIAVE, JSON.stringify(daSalvare));
  } catch {
    /* localStorage non disponibile: la demo funziona lo stesso */
  }
}

export function caricaSalvataggio(): Stato | null {
  try {
    const grezzo = localStorage.getItem(CHIAVE);
    if (!grezzo) return null;
    const t = JSON.parse(grezzo);
    const valido =
      t &&
      typeof t === "object" &&
      t.versione === 3 &&
      typeof t.ora === "number" &&
      Array.isArray(t.schede) &&
      t.schede.some((x: { id?: string }) => x.id === "g-riab") &&
      t.racconto &&
      Array.isArray(t.racconto.confermate) &&
      t.giovanni &&
      t.posti &&
      t.mappa &&
      t.pesi &&
      Array.isArray(t.notifiche) &&
      Array.isArray(t.pareri);
    if (!valido) {
      cancellaSalvataggio();
      return null;
    }
    return t as Stato;
  } catch {
    cancellaSalvataggio();
    return null;
  }
}

export function cancellaSalvataggio() {
  try {
    localStorage.removeItem(CHIAVE);
    localStorage.removeItem("hubspoke-demo-v2");
  } catch {
    /* niente */
  }
}
