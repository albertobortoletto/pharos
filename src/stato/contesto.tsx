import { createContext, useContext, type Dispatch } from "react";
import type { AzioneRacconto, StatoRacconto } from "./racconto";

export interface ValoreDemo {
  s: StatoRacconto;
  d: Dispatch<AzioneRacconto>;
  righeValide: string[];
}

export const DemoCtx = createContext<ValoreDemo | null>(null);

export function useDemo(): ValoreDemo {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("DemoCtx mancante");
  return v;
}
