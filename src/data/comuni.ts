// Comuni usati per generare il dataset sintetico (coordinate approssimate del centro).
// peso = quanti pazienti fittizi vengono da lì (relativo).

export interface Comune {
  nome: string;
  lat: number;
  lng: number;
  peso: number;
}

export const COMUNI: Comune[] = [
  { nome: "Montagnana", lat: 45.233, lng: 11.465, peso: 6 },
  { nome: "Este", lat: 45.227, lng: 11.657, peso: 9 },
  { nome: "Monselice", lat: 45.241, lng: 11.749, peso: 10 },
  { nome: "Conselve", lat: 45.23, lng: 11.873, peso: 5 },
  { nome: "Solesino", lat: 45.18, lng: 11.746, peso: 3 },
  { nome: "Bagnoli di Sopra", lat: 45.188, lng: 11.88, peso: 2 },
  { nome: "Casale di Scodosia", lat: 45.18, lng: 11.465, peso: 2 },
  { nome: "Lozzo Atestino", lat: 45.293, lng: 11.63, peso: 2 },
  { nome: "Battaglia Terme", lat: 45.29, lng: 11.78, peso: 2 },
  { nome: "Piove di Sacco", lat: 45.3, lng: 12.035, peso: 6 },
  { nome: "Abano Terme", lat: 45.36, lng: 11.79, peso: 2 },
  { nome: "Padova", lat: 45.406, lng: 11.876, peso: 6 },
  { nome: "Cadoneghe", lat: 45.44, lng: 11.928, peso: 1 },
  { nome: "Camposampiero", lat: 45.567, lng: 11.932, peso: 1 },
  { nome: "Cittadella", lat: 45.648, lng: 11.784, peso: 1 },
  { nome: "Legnago", lat: 45.193, lng: 11.304, peso: 4 },
  { nome: "Noventa Vicentina", lat: 45.29, lng: 11.54, peso: 2 },
  { nome: "Rovigo", lat: 45.07, lng: 11.79, peso: 3 },
  { nome: "Vicenza", lat: 45.548, lng: 11.546, peso: 2 },
];

/** Fattore strada/linea d'aria usato per le stime di distanza (come nella mappa di partenza). */
export const FATTORE_STRADA = 1.3;

export function kmStrada(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * FATTORE_STRADA;
}
