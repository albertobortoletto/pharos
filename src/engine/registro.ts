import type { Motivo, VoceRegistro } from "../data/tipi";

/** Conta le voci del registro per motivo, in ordine decrescente. */
export function contaMotivi(voci: VoceRegistro[], motivi: Motivo[]): (Motivo & { n: number })[] {
  const conta = new Map<string, number>();
  for (const v of voci) conta.set(v.motivo, (conta.get(v.motivo) ?? 0) + 1);
  return motivi
    .map((m) => ({ ...m, n: conta.get(m.id) ?? 0 }))
    .filter((m) => m.n > 0)
    .sort((a, b) => b.n - a.n);
}
