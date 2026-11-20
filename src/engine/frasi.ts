// Verifica della frase d'origine: una fase estratta vale solo se la sua frase è nella lettera.
// Senza frase, la fase viene scartata. Il sistema non inventa.

const normalizza = (s: string) => s.replace(/\s+/g, " ").trim();

export function fraseNellaLettera(frase: string, paragrafi: string[]): boolean {
  const testo = normalizza(paragrafi.join(" "));
  return frase.length > 0 && testo.includes(normalizza(frase));
}
