// Nodi della rete veneta (ospedali). Coordinate: Allegato A del prompt, corrette con OpenStreetMap
// (Nominatim, 20/11/2026): l'elenco delle modifiche è in src/data/FONTI.md. Ruoli: DGR 614/2019 (rete ospedaliera), DGR 4198/2008
// (rete ictus), ROV (rete oncologica). I collegamenti spoke→hub della rete ictus sono DEDOTTI dall'ULSS.

export type RuoloOspedaliero = "hub_eu" | "hub_prov" | "altro";

export interface NodoRete {
  id: string;
  nome: string;
  breve: string;
  lat: number;
  lng: number;
  ulss: string;
  ruolo: RuoloOspedaliero | null;
  ictus?: "hub" | "spoke";
  onco?: "hub" | "spoke_pilota";
  /** Struttura del percorso della prostata collegata (src/data/strutture.ts). */
  struttura?: string;
}

export const NODI: NodoRete[] = [
  { id: "PD", nome: "Azienda Ospedale-Università Padova", breve: "Padova", lat: 45.4030, lng: 11.8870, ulss: "AO Padova", ruolo: "hub_eu", ictus: "hub", struttura: "padova" },
  { id: "VR", nome: "AOUI Verona (Borgo Trento)", breve: "Verona", lat: 45.4529, lng: 10.9841, ulss: "AOUI Verona", ruolo: "hub_eu", ictus: "hub" },
  { id: "TV", nome: "Treviso – Ca' Foncello", breve: "Treviso", lat: 45.6599, lng: 12.2576, ulss: "ULSS 2", ruolo: "hub_prov", ictus: "hub" },
  { id: "ME", nome: "Mestre – Ospedale dell'Angelo", breve: "Mestre", lat: 45.5090, lng: 12.2240, ulss: "ULSS 3", ruolo: "hub_prov", ictus: "hub" },
  { id: "VI", nome: "Vicenza – San Bortolo", breve: "Vicenza", lat: 45.5560, lng: 11.5430, ulss: "ULSS 8", ruolo: "hub_prov", ictus: "hub" },
  { id: "RO", nome: "Rovigo – Santa Maria della Misericordia", breve: "Rovigo", lat: 45.0725, lng: 11.8162, ulss: "ULSS 5", ruolo: "hub_prov", ictus: "hub" },
  { id: "BL", nome: "Belluno – San Martino", breve: "Belluno", lat: 46.1386, lng: 12.2001, ulss: "ULSS 1", ruolo: "hub_prov", ictus: "spoke" },
  { id: "FE", nome: "Feltre", breve: "Feltre", lat: 46.0227, lng: 11.9069, ulss: "ULSS 1", ruolo: "altro", ictus: "spoke" },
  { id: "CF", nome: "Castelfranco Veneto", breve: "Castelfranco", lat: 45.6764, lng: 11.9309, ulss: "ULSS 2", ruolo: "altro", ictus: "spoke" },
  { id: "CO", nome: "Conegliano", breve: "Conegliano", lat: 45.8819, lng: 12.2893, ulss: "ULSS 2", ruolo: "altro", ictus: "spoke" },
  { id: "MI", nome: "Mirano", breve: "Mirano", lat: 45.4974, lng: 12.1152, ulss: "ULSS 3", ruolo: "altro", ictus: "spoke" },
  { id: "VE", nome: "Venezia – SS. Giovanni e Paolo", breve: "Venezia", lat: 45.4400, lng: 12.3420, ulss: "ULSS 3", ruolo: "altro", ictus: "spoke" },
  { id: "PO", nome: "Portogruaro", breve: "Portogruaro", lat: 45.7710, lng: 12.8419, ulss: "ULSS 4", ruolo: "altro", ictus: "spoke" },
  { id: "CI", nome: "Cittadella", breve: "Cittadella", lat: 45.6472, lng: 11.7888, ulss: "ULSS 6", ruolo: "altro", ictus: "spoke" },
  { id: "PS", nome: "Piove di Sacco", breve: "Piove di Sacco", lat: 45.2922, lng: 12.0313, ulss: "ULSS 6", ruolo: "altro", ictus: "spoke", struttura: "piove" },
  { id: "SA", nome: "Padova – Sant'Antonio", breve: "Sant'Antonio", lat: 45.3932, lng: 11.8926, ulss: "ULSS 6", ruolo: "altro", ictus: "spoke" },
  { id: "SC", nome: "Schiavonia (Monselice)", breve: "Schiavonia", lat: 45.2067, lng: 11.7227, ulss: "ULSS 6", ruolo: "altro", ictus: "spoke", onco: "spoke_pilota", struttura: "schiavonia" },
  { id: "BA", nome: "Bassano del Grappa", breve: "Bassano", lat: 45.7467, lng: 11.7444, ulss: "ULSS 7", ruolo: "altro", ictus: "spoke" },
  { id: "ST", nome: "Santorso", breve: "Santorso", lat: 45.7271, lng: 11.4137, ulss: "ULSS 7", ruolo: "altro", ictus: "spoke" },
  { id: "AR", nome: "Arzignano", breve: "Arzignano", lat: 45.5260, lng: 11.3314, ulss: "ULSS 8", ruolo: "altro", ictus: "spoke" },
  { id: "LE", nome: "Legnago", breve: "Legnago", lat: 45.1856, lng: 11.3163, ulss: "ULSS 9", ruolo: "altro", ictus: "spoke", struttura: "legnago" },
  { id: "NE", nome: "Negrar – Sacro Cuore", breve: "Negrar", lat: 45.5280, lng: 10.9370, ulss: "ULSS 9", ruolo: "altro", ictus: "spoke" },
  { id: "PE", nome: "Peschiera del Garda", breve: "Peschiera", lat: 45.4438, lng: 10.7067, ulss: "ULSS 9", ruolo: "altro", ictus: "spoke" },
  { id: "IOV", nome: "IOV – Istituto Oncologico Veneto (Padova)", breve: "IOV", lat: 45.4017, lng: 11.8932, ulss: "IRCCS", ruolo: null, onco: "hub" },
];

/** Domicilio di Giovanni (fittizio: solo il comune). */
export const CASA_GIOVANNI = { nome: "Montagnana (domicilio di Giovanni)", lat: 45.2330, lng: 11.4650 };

/** Macro-aree della rete ictus: ULSS → hub (fonte: Neurological Sciences 2023, PMC9905755). */
export const MACRO_ICTUS: Record<string, string> = {
  "ULSS 1": "TV",
  "ULSS 2": "TV",
  "ULSS 3": "ME",
  "ULSS 4": "ME",
  "ULSS 5": "RO",
  "ULSS 6": "PD",
  "AO Padova": "PD",
  "ULSS 7": "VI",
  "ULSS 8": "VI",
  "ULSS 9": "VR",
  "AOUI Verona": "VR",
};

/** Collegamenti oncologici: solo il pilota della prostata. */
export const LINK_ONCO = [
  { da: "IOV", a: "PD", nota: "Polo oncologico di Padova: IOV e AOU (da verificare)", pilota: false },
  { da: "PD", a: "SC", nota: "Pilota prostata: riabilitazione delegata allo spoke (ipotesi del team)", pilota: true },
];

/** Altri poli della ROV: struttura pronta, DA COMPLETARE con il Decreto 82/2024. */
export const POLI_ROV_DA_COMPLETARE: { nodo: string; patologia: string }[] = [];

export const nodoPerId = (id: string) => NODI.find((n) => n.id === id)!;
