import { createContext, useContext, type Dispatch } from "react";
import type { StatoRacconto } from "./racconto";
import type { Azione, Stato } from "./store";

/** Contesto delle 6 scene: stato "vista racconto" derivato dallo store unico. */
export interface ValoreDemo {
  s: StatoRacconto;
  d: Dispatch<Azione>;
  righeValide: string[];
}

export const DemoCtx = createContext<ValoreDemo | null>(null);

export function useDemo(): ValoreDemo {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("DemoCtx mancante");
  return v;
}

/** Contesto delle viste per ruolo: lo store completo. */
export interface ValoreStore {
  st: Stato;
  d: Dispatch<Azione>;
}

export const StoreCtx = createContext<ValoreStore | null>(null);

export function useStore(): ValoreStore {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("StoreCtx mancante");
  return v;
}
