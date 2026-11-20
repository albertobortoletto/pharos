# Fonti dei dati

Questa demo usa **solo dati fittizi**. Qui sotto, per ogni gruppo di dati: da dove viene, e se è **pubblico**, **dedotto** o **simulato**.

## Pubblici (da fonti ufficiali)

| Dato | Fonte | File |
|---|---|---|
| Ruolo degli ospedali nella rete ospedaliera (hub di riferimento europeo, hub provinciali) | DGR 614/2019, schede ospedaliere (PSSR 2019-2023, LR 48/2018) | `rete/nodi.ts` |
| Rete ictus: 6 hub, 17 spoke, macro-aree per ULSS | DGR 4198/2008; elenco in *Neurological Sciences* 2023, PMC9905755 | `rete/nodi.ts` |
| Rete Oncologica Veneta (ROV), IOV hub regionale | DGR 2067/2013, DGR 1711/2022 (CRAO), Decreto 82/2024 | `rete/nodi.ts` |
| Agende dedicate ai PDTA | Piano Nazionale di Governo delle Liste d'Attesa | testi delle viste |
| Confini del Veneto e delle 7 province | ISTAT, confini amministrativi generalizzati, tramite il repository `openpolis/geojson-italy` (licenza CC BY 4.0). Semplificati con `strumenti/semplifica_confini.mjs` | `rete/veneto.geo.json` |

## Dedotti (ricostruiti da noi)

- **Collegamento spoke→hub della rete ictus**: dedotto dall'ULSS di appartenenza dello spoke e dalla macro-area (vedi `MACRO_ICTUS`). Sulla mappa porta il badge *dedotto*.
- **Coordinate degli ospedali**: approssimate (Allegato A del brief). Le modifiche fatte dopo il controllo su OpenStreetMap sono elencate più sotto.
- **Collegamento oncologico Padova → Schiavonia per la prostata**: ipotesi del pilota, non scritta in alcun atto.
- **Altri poli ROV**: da completare con il Decreto 82/2024. La struttura dati (`POLI_ROV_DA_COMPLETARE`) è pronta ma vuota.
- **Sede dello IOV**: indicata a Padova. Lo IOV ha anche la sede di Castelfranco Veneto, non disegnata: da verificare.

## Simulati (inventati per la demo, da sostituire con dati reali)

- Pazienti, telefoni, lettera di dimissione, date: tutti inventati (`persone.ts`, `lettera.ts`, `itinerario.ts`).
- Posti dichiarati, attese, servizi degli spoke diversi da Schiavonia (`strutture.ts`). In un pilota: open data del Ministero della Salute per i posti letto per disciplina.
- Distanze e tempi delle tratte (`tratte.ts`): stime da ricontrollare con la matrice ISTAT.
- Probabilità della rete bayesiana (`bn_cpt.json`): stime iniziali **illustrative**, generate da `strumenti/genera_cpt.mjs`. In un pilota: prior epidemiologiche (es. Registro Tumori del Veneto), stime dei clinici del GOM, casi chiusi.
- Dataset sintetico di 284 pazienti (`engine/synth.ts`, parametri in `sintetico.ts`), generato con seed fisso dalla rete bayesiana stessa.
- Caso di studio di Renato (`casoRenato.ts`): persona, date, telefoni, distanze, date libere del day hospital dell'IOV e hub abilitati sono inventati. Lo schema del farmaco (giorno 1 e giorno 8 all'hub) è un esempio: da verificare su scheda tecnica, determina AIFA e con il GOM.
- Volumi e casi simili: in un pilota, PNE Agenas e casi chiusi della rete.
- Pesi del punteggio di abbinamento (`pesi.ts`): da concordare con i clinici.

## Coordinate controllate

Controllo fatto il 20/11/2026 cercando il nome di ogni ospedale su OpenStreetMap (Nominatim). Le differenze sotto i 300 m non sono state corrette, perché alla scala della mappa non si vedono: Padova (AOU), Vicenza, Venezia, Negrar. Mestre è rimasta com'era: OSM restituiva solo la fermata dell'autobus «Ospedale dell'Angelo», a 440 m.

| Nodo | Prima (Allegato A) | Dopo (OSM) | Elemento OSM usato |
|---|---|---|---|
| VR | 45.4500, 10.9900 | 45.4529, 10.9841 | Ospedale Civile Maggiore |
| TV | 45.6730, 12.2560 | 45.6599, 12.2576 | Ca' Foncello |
| RO | 45.0700, 11.7900 | 45.0725, 11.8162 | Santa Maria della Misericordia |
| BL | 46.1350, 12.2130 | 46.1386, 12.2001 | San Martino |
| FE | 46.0180, 11.9050 | 46.0227, 11.9069 | Santa Maria del Prato |
| CF | 45.6700, 11.9300 | 45.6764, 11.9309 | San Giacomo Apostolo |
| CO | 45.8870, 12.2970 | 45.8819, 12.2893 | Presidio ospedaliero di Conegliano |
| MI | 45.4950, 12.1080 | 45.4974, 12.1152 | parcheggio dell'ospedale |
| PO | 45.7760, 12.8370 | 45.7710, 12.8419 | Ospedale di Portogruaro |
| CI | 45.6460, 11.7830 | 45.6472, 11.7888 | Ospedale di Cittadella |
| PS | 45.2990, 12.0320 | 45.2922, 12.0313 | chiesa dell'ospedale |
| SA | 45.3960, 11.8990 | 45.3932, 11.8926 | Ospedale Sant'Antonio |
| SC | 45.2360, 11.7280 | 45.2067, 11.7227 | Ospedale Madre Teresa di Calcutta |
| BA | 45.7720, 11.7300 | 45.7467, 11.7444 | Ospedale San Bassiano |
| ST | 45.7330, 11.4000 | 45.7271, 11.4137 | Ospedale Alto Vicentino |
| AR | 45.5180, 11.3300 | 45.5260, 11.3314 | Ospedale di Arzignano |
| LE | 45.1950, 11.3070 | 45.1856, 11.3163 | Ospedale Mater Salutis |
| PE | 45.4400, 10.6950 | 45.4438, 10.7067 | Ospedale Pederzoli |
| IOV | 45.4048, 11.8905 | 45.4017, 11.8932 | Istituto Oncologico Veneto |

Schiavonia (3,3 km) e Bassano (3 km) erano gli scostamenti più grandi. Con le nuove coordinate cambiano un po' le distanze del dataset sintetico: i numeri della demo sono stati ricontrollati dopo la modifica.
