import { AlarmClock } from "lucide-react";
import { formattaOre } from "../engine/date";

/** Timer leggibile: «entro 1 g 6 h»; giallo se mancano meno di 12 ore, rosso se scaduto. */
export function Timer({ scadenza, ora, prima = "entro" }: { scadenza: number | null; ora: number; prima?: string }) {
  if (scadenza === null) return null;
  const resto = scadenza - ora;
  return (
    <span className={`timer ${resto <= 0 ? "scaduto" : resto <= 12 ? "vicino" : ""}`} data-testid="timer">
      <AlarmClock size={16} aria-hidden="true" /> {resto <= 0 ? formattaOre(resto) : `${prima} ${formattaOre(resto)}`}
    </span>
  );
}
