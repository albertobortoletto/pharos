# pharos · HubSpoke Medical Journey

Demo offline di una rete hub-spoke in Veneto: l'hub di Padova, lo spoke di Schiavonia e il percorso di un paziente dopo la prostatectomia. Il sistema propone e spiega, il medico decide, il paziente sceglie. **Solo dati fittizi.**

## Cosa contiene

Un solo file HTML, che si apre con un doppio clic e non fa chiamate di rete. La CSP è inserita nel file: niente CDN, niente tile esterne. Font e confini sono incorporati.

| Vista | Per chi | Cosa mostra |
|---|---|---|
| **Mappa** | apertura del pitch | Le reti ospedaliera, ictus e oncologica, il percorso di Giovanni, «Perché Schiavonia?» e la previsione dei posti (catena di Markov) |
| **Hub** | urologo e infermiera di percorso | I pazienti con fasi in corso, dalla lettera alle fasi, la proposta di sede, i pareri, l'elenco «da chiamare» e i motivi di rifiuto |
| **Spoke** | fisiatra di Schiavonia | Le richieste con il timer, «Prendo in carico», le sedute, il controllo di metà percorso e i posti dichiarati |
| **Paziente/Caregiver** | Giovanni, Laura, medico di base | SMS e foglio stampabile, l'app di Laura (timeline e «Ho un problema») e la copia in sola lettura |
| **Come ragiona il sistema** | giuria e clinici | Il flusso, le quattro schede dei modelli, il grafo della rete bayesiana, i pesi e cosa il sistema non fa mai |
| **Racconto** | — | Le 6 scene della demo originale |

Tutte le viste leggono lo **stesso store**: un'azione in una vista si vede subito nelle altre. Il tasto **+1 g** fa avanzare il tempo simulato. **Ricomincia demo** riporta tutto allo stato iniziale.

## Come avviare

Servono Node.js 18 o successivo e npm.

```powershell
npm install
```

```powershell
npm run dev
```

Poi si apre <http://localhost:5173>. In sviluppo la CSP non si applica, perché Vite usa script esterni e HMR.

## Come compilare

```powershell
npm run build
```

Il risultato è un unico file, `dist/index.html` (circa 670 kB), con la CSP. Si apre con un doppio clic, anche senza rete. Per provarlo come in proiezione:

```powershell
npm run preview
```

Gli altri comandi:

```powershell
npm test
```

```powershell
npm run typecheck
```

`npm test` esegue i test del motore, della macchina a stati e dello store, e i **test di coerenza** (`test/coerenza.test.ts`). Quei test controllano tre cose:

- la spiegazione di Giovanni è identica nella scheda di rischio, nella proposta di sede e nella schermata AI;
- nessun parametro del PDTA e nessun peso è scritto a mano nei `.tsx`;
- nei sorgenti non compare nessuna variante vietata dal glossario.

## Dove si modificano dati, pesi e testi

Ogni numero e ogni frase ha **una sola fonte**. Le viste non scrivono numeri a mano: i test di coerenza lo impediscono.

| Cosa | File |
|---|---|
| Parametri del PDTA (giorni per il parere, ore per la risposta, seduta del controllo…) | `src/data/pdta.ts` |
| Pesi del punteggio di abbinamento (predefiniti, da concordare con i clinici) | `src/data/pesi.ts` |
| Strutture, posti dichiarati, attese, requisiti | `src/data/strutture.ts` |
| Distanze, tempi e numero di sedute | `src/data/tratte.ts` |
| Pazienti, persone, lettera di dimissione, itinerario | `src/data/persone.ts`, `pazienti.ts`, `schede.ts`, `lettera.ts`, `itinerario.ts` |
| Motivi di rifiuto, condizioni di rientro, problemi del caregiver | `src/data/motivi.ts` |
| Nodi e collegamenti delle reti, confini | `src/data/rete/` |
| Probabilità della rete bayesiana | `src/data/bn_cpt.json` (rigenerate da `strumenti/genera_cpt.mjs`) |
| Parametri del dataset sintetico | `src/data/sintetico.ts` |
| Termini fissi e varianti vietate | `src/testi/glossario.ts` |
| Descrizioni dei modelli («Come ragiona il sistema», «Come è calcolato?») | `src/testi/ai.ts` |
| Testi della mappa | `src/testi/mappa.ts` |

I pesi si possono cambiare anche dal vivo, dal pannello «Pesi del punteggio di abbinamento» (vista Hub o schermata AI). Le modifiche restano nel browser fino a «Ricomincia demo».

I confini si rigenerano dai file openpolis con `node strumenti/semplifica_confini.mjs <province.geojson> <regioni.geojson> [tolleranza]`.

## Dati simulati e dati dedotti

Tutto è fittizio. Nell'interfaccia i dati simulati e dedotti portano un badge:

- **Pubblici:** ruoli degli ospedali (DGR 614/2019), rete ictus (DGR 4198/2008), ROV, confini ISTAT via openpolis (CC BY 4.0).
- **Dedotti:** collegamenti spoke→hub della rete ictus (dall'ULSS di appartenenza), coordinate degli ospedali (controllate su OpenStreetMap) e il collegamento oncologico Padova → Schiavonia del pilota.
- **Simulati:** pazienti, posti, attese, distanze, probabilità della rete bayesiana (stime iniziali illustrative), il dataset sintetico di 284 pazienti e la previsione dei posti.

L'elenco completo, con le fonti e le coordinate corrette, è in [`src/data/FONTI.md`](src/data/FONTI.md).

## Struttura

```
src/
  data/        dati fittizi e parametri (una sola fonte)
  engine/      motore: rete bayesiana, pazienti simili, abbinamento, catena di Markov, scheda di fase
  stato/       store condiviso, persistenza, percorso del paziente
  testi/       glossario, testi dei modelli e della mappa
  viste/       mappa, hub, spoke, paziente, come ragiona il sistema
  racconto/    le 6 scene della demo originale
  componenti/  scheda di rischio, timer, badge
test/          test di coerenza
strumenti/     script per i confini e le probabilità
riferimenti/   la demo originale e la mappa di partenza (sola consultazione)
```
