// Finta API: nessuna chiamata di rete (la CSP le blocca comunque). Simula solo un ritardo.
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const api = {
  async invia(_cosa?: string, _dati?: unknown, ms = 350): Promise<{ ok: true }> {
    await pausa(ms);
    return { ok: true };
  },
};
