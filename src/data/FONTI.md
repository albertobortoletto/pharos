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
- Volumi e casi simili: in un pilota, PNE Agenas e casi chiusi della rete.
- Pesi del punteggio di abbinamento (`pesi.ts`): da concordare con i clinici.

## Coordinate controllate

Il controllo è stato fatto sui nomi degli ospedali in OpenStreetMap. Variazioni sotto i 300 m non sono state riportate: alla scala della mappa non si vedono.

| Nodo | Prima | Dopo | Nota |
|---|---|---|---|
| — | — | — | vedi lo storico git del file `rete/nodi.ts` |
