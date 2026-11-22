# Ontwerp: P0e — Aparte testomgeving

Bron: `P0e-testomgeving.md` (incl. antwoorden en bijstellingen) en `P0e-gebruikersreis.md` (meldingen M1–M15).
Weinig UI: één foutpagina, footer-varianten, een smalle omgevingsbalk, twee hints, terminalopmaak.
Geen nieuwe kleuren: alles met bestaande tokens (`--petrol`, `--petrol-dark`, `--on-petrol`, `--orange`, `--surface`, `--border`, `--text`, `--muted`, `--card`) plus de bestaande foutkleur `#c0392b` (`.form-fout`) en de vaste donkere knoptekst `#111212` (`.btn.primary`).

---

## 0. Eén bron voor de omgeving (basis voor alles hieronder)

**`src/firebase.js`** exporteert, naast `auth` en `db`:
- `projectId` — de gelezen `VITE_FIREBASE_PROJECT_ID` (string, mag leeg).
- `configFout` — `null` | `'geen-config'` | `'productie-lokaal'`.
  - `'geen-config'`: `projectId` leeg.
  - `'productie-lokaal'`: `import.meta.env.DEV && projectId === PRODUCTIE_PROJECT_ID && import.meta.env.MODE !== 'productie'`.
  - Bij een `configFout` wordt **niet** geïnitialiseerd: `auth` en `db` zijn `null`.

**`src/main.js`** bepaalt één keer bovenin:
```js
const OMGEVING = (import.meta.env.VITE_OMGEVING || 'Ontwikkel').trim()   // bestaat al
const SOORT = import.meta.env.DEV && import.meta.env.MODE === 'productie' ? 'productie-lokaal'
  : OMGEVING.toLowerCase() === 'test' ? 'test'
  : OMGEVING.toLowerCase() === 'productie' ? 'productie' : 'ontwikkel'
const OMGEVING_LABEL = SOORT === 'productie-lokaal' ? 'Productie (lokaal)' : OMGEVING
```
- Als `configFout` gezet is: `renderConfigFout(configFout)` en **geen** `onAuthStateChanged` registreren (dat zou op `auth === null` crashen). Geen balk tonen.
- Anders: `toonOmgevingsBalk()` (alleen bij `test` en `productie-lokaal`), daarna de bestaande `onAuthStateChanged`.
- Alle beslissingen hieronder gebruiken `SOORT`; nergens opnieuw op strings vergelijken.

---

## Schermen

### Scherm 1: Foutpagina configuratie (M1 / M2)
Verschijnt in plaats van het inlogscherm. Zelfde opbouw als de bestaande tussenkaarten (`renderGeenClub`), zodat het als clubKOMPAS voelt en niet als crash.

**Lay-out** (van boven naar onder, in `.inlog-wrap` > `.inlog-kaart`):
1. `.inlog-logo` (kompas + club**KOMPAS**), zoals nu.
2. `<div role="alert">` met daarin:
   - `h1.inlog-titel#tussen-titel tabindex="-1"` — krijgt focus (gebeurt al via `toonTussenkaart`).
   - eerste `p.tussen-tekst` — wat er aan de hand is.
3. `p.tussen-tekst.config-gerust` — de geruststelling, vet.
4. `p.form-label` "Wat nu?" + `ol.config-stappen` met de stappen.
5. `button.btn.inlog-knop#config-herlaad` "Opnieuw laden" → `location.reload()`. Secundaire knop (petrol rand, geen oranje): de echte oplossing gebeurt in de terminal.

**Variant via klasse op de kaart:**
- M1: `.inlog-kaart` ongewijzigd (petrol bovenrand). Configuratie ontbreekt = geen gevaar.
- M2: `.inlog-kaart.kaart-gestopt` → bovenrand `var(--orange)`. Signaal zit ook in de tekst ("Gestopt:"), niet alleen in de kleur.

Bestands- en commandonamen staan in `<code>` (zie Nieuwe CSS). `document.title` wordt `Gestopt · clubKOMPAS`. Schrijf de titel en eerste alinea ook naar `console.error`, voor wie de devtools open heeft.

**Teksten M1 — lokaal (`import.meta.env.DEV`)**
- Titel: `Geen verbinding ingesteld`
- Alinea: `De app weet niet met welke database hij moet praten: het bestand <code>.env.test.local</code> ontbreekt of is leeg.`
- Gerust: `Er is niets gelezen of opgeslagen.`
- Stappen:
  1. `Zet de zes Firebase-waarden van het testproject in <code>.env.test.local</code> (zie README, “Omgevingen”).`
  2. `Stop de app in de terminal (Ctrl+C) en start opnieuw met <code>npm run dev</code>.`
  3. `Laad deze pagina daarna opnieuw.`

**Teksten M1 — build zonder configuratie (`!import.meta.env.DEV`, bv. lokaal `npm run preview` of een kapotte Vercel-instelling)**
Bezoekers mogen geen bestandsnamen zien.
- Titel: `clubKOMPAS is tijdelijk niet beschikbaar`
- Alinea: `De verbinding met de database is niet ingesteld. Probeer het later opnieuw.`
- Gerust: geen.
- Stappen: geen; in plaats daarvan `p.tussen-hint`: `Blijft dit zo? Mail naar ` + `supportLinkHTML('', 'Storing clubKOMPAS')`.
- Knop: "Opnieuw laden".

**Teksten M2**
- Titel: `Gestopt: deze lokale app wijst naar de echte clubdata`
- Alinea: `Het project in de configuratie is <code>svn10-clubkompas</code> (productie). Lokaal mag dat alleen bewust, met <code>npm run dev:productie</code>.`
- Gerust: `Er is niets gelezen of opgeslagen.`
- Stappen:
  1. `Verwijder het oude bestand <code>.env</code> uit de projectmap, als dat er nog staat.`
  2. `Controleer dat <code>.env.test.local</code> de waarden van het testproject bevat, niet die van productie.`
  3. `Stop de app (Ctrl+C) en start opnieuw met <code>npm run dev</code>.`
- Extra `p.tussen-hint` onder de stappen: `Bewust op productie werken? Gebruik <code>npm run dev:productie</code>.`

**Interacties:**
- Laden → focus op de titel (bestaand gedrag `toonTussenkaart`); schermlezer leest titel en eerste alinea voor via `role="alert"`.
- "Opnieuw laden" → `location.reload()`.

**Klassen:** `.inlog-wrap`, `.inlog-kaart`, `.inlog-logo`, `.inlog-titel`, `.tussen-tekst`, `.tussen-hint`, `.tussen-link`, `.form-label`, `.btn`, `.inlog-knop`; nieuw: `.kaart-gestopt`, `.config-gerust`, `.config-stappen`, `code` binnen `.inlog-kaart`.

---

### Scherm 2: Omgevingsbalk bovenaan

**Keuze: ja, een smalle balk bij Test én bij Productie (lokaal). Nooit op live Productie en niet bij Ontwikkel.**

Reden:
- Het inlogscherm en de tussenkaarten hebben **geen footer**. Zonder balk ziet Paul juist op het moment dat het misgaat (inloggen met zijn HCA-account, M5) nergens dat hij in test zit. De gebruikersreis gaat ervan uit dat de footer daar zichtbaar is; dat klopt niet met de huidige code.
- De footer is 12px en staat onderaan; de balk is de enige plek die op elk scherm in beeld is.
- Twee uitersten met één component: Test is rustig in donker petrol (huisstijl, het veilige standaardgeval, mag niet gaan irriteren); Productie (lokaal) is opvallend oranje (de uitzondering die moet opvallen). Zo houdt oranje zijn betekenis als waarschuwing.
- Live krijgt niets: geen verandering voor HCA-gebruikers, footer blijft "Productie · Versie …".

**Lay-out:** volle breedte, eerste kind van `<body>`, vóór `#app` (zodat het herschrijven van `#app.innerHTML` hem niet weghaalt). Minimaal 28px hoog, tekst gecentreerd, één regel; op smalle schermen mag hij afbreken naar twee regels (geen afkapping).

**Markup** (één keer ingevoegd door `toonOmgevingsBalk()`):
```html
<div class="omgeving-balk omgeving-balk--test" role="note" aria-label="Omgeving">
  <strong>Testomgeving</strong> · project clubkompas-test · fictieve data
</div>
```
```html
<div class="omgeving-balk omgeving-balk--productie" role="note" aria-label="Omgeving">
  <strong>Let op: echte clubdata</strong> · lokaal tegen svn10-clubkompas
</div>
```
- Project-ID komt uit `projectId` (firebase.js), niet hard gecodeerd; gebruik `esc()`.
- `role="note"`, géén `role="alert"`: hij staat er vanaf het laden en hoeft niet bij elk scherm opnieuw voorgelezen te worden.
- `document.body.classList.add('met-omgeving-balk')`.
- `document.title` krijgt een voorvoegsel: `TEST · clubKOMPAS` resp. `PRODUCTIE LOKAAL · clubKOMPAS`. Zo is het ook in de tabbladbalk zichtbaar.

**Stijl:**
- Test: achtergrond `var(--petrol-dark)`, tekst `var(--on-petrol)`. Contrast ≈ 6,5:1 (licht) en ruim in donker (`#2F5658`). Bewust niet petrol-tekst op `--surface`: dat is ≈ 4,5:1, te krap voor 12px.
- Productie (lokaal): achtergrond `var(--orange)`, tekst `#111212` (zelfde als `.btn.primary`), onderrand `1px solid #111212`. Contrast ≈ 9:1. Nooit oranje **tekst** op wit (≈ 2,1:1) of op petrol (≈ 2,4:1).
- Tekst: `--fs-label`, uppercase, `letter-spacing .08em`, `<strong>` gewicht 700, rest 600.

---

### Scherm 3: Footer-varianten
Alleen het middelste `<span>` van `footerHTML()` verandert. Opbouw en klassen blijven.

| Soort | Weergave midden | Stijl |
|---|---|---|
| `ontwikkel` | `ONTWIKKEL · VERSIE 0.x` | ongewijzigd |
| `test` | `TEST · VERSIE 0.x` | ongewijzigd (neutraal wit op petrol) |
| `productie` (live) | `PRODUCTIE · VERSIE 0.x` | **ongewijzigd**, ook geen extra tooltip |
| `productie-lokaal` | `[PRODUCTIE (LOKAAL)] · VERSIE 0.x` | label in oranje vlak met donkere tekst |

- Productie (lokaal): `<span class="omgeving-label--waarschuwing">Productie (lokaal)</span> · Versie ${version}`. **Bewuste afwijking van de spec:** oranje tekst op de petrol footer haalt maar ≈ 2,4:1 contrast (eis 4,5:1). Daarom oranje vlak met donkere tekst (≈ 9:1). De woorden "Productie (lokaal)" dragen de betekenis; kleur is extra.
- Tooltip (`title`) van het middelste span: bij `test` en `productie-lokaal` `Project ${projectId} · Gebouwd op …`; bij live en ontwikkel blijft het `Gebouwd op …`.

---

### Scherm 4: Inlogscherm — hint bij Test (M5)

**Lay-out:** geen nieuwe vaste regel boven het formulier (de balk doet dat al). Alleen bij een mislukte inlog verschijnt de hint, binnen het bestaande foutvak.

**Wijzigingen:**
- `#inlog-algemeen-fout` krijgt `role="alert"` (in alle omgevingen: nu wordt de foutmelding niet voorgelezen; kleine toegankelijkheidswinst, geen gedragswijziging).
- Bij `SOORT === 'test'` én foutcode `auth/invalid-credential`, `auth/user-not-found` of `auth/wrong-password`:
```html
E-mailadres of wachtwoord klopt niet.
<span class="inlog-test-hint">Let op: je zit in de <strong>testomgeving</strong>. Gebruik je testaccount, niet je gewone clubKOMPAS-account.</span>
```
  De eerste zin blijft de bestaande tekst uit `foutcodes`. Zet de foutzin met `textContent` en bouw de hint met `createElement`; geen ruwe `innerHTML` met `e.code`.
- Bij andere codes (te veel pogingen e.d.) geen hint.

**Interacties:** nieuwe poging → `algFout.textContent = ''` (bestaand) wist ook de hint.

**Klassen:** bestaand `.form-fout`; nieuw `.inlog-test-hint`.

---

### Scherm 5: Geen club gekoppeld — extra regel bij Test (M6)

In `renderGeenClub(gebruiker)`, alleen bij `SOORT === 'test'`, na de tweede alinea en vóór de knop:
```html
<p class="tussen-hint">
  <strong>Testomgeving:</strong> controleer in de testconsole (project <code>clubkompas-test</code>)
  of <code>gebruikers/UID</code> bestaat met het veld <code>clubId</code>,
  en of <code>clubs/&lt;clubId&gt;/leden/UID</code> bestaat met <code>rol</code> = <code>beheerder</code>.
</p>
```
- `UID` = de echte `gebruiker.uid` (ge-escaped), zodat Paul hem kan kopiëren in plaats van overtypen. Project-ID uit `projectId`.
- Titel, eerste twee alinea's en knop blijven ongewijzigd.

---

## Terminal (scripts en `scripts/regels.mjs`)

Eén set helpers in `scripts/lib/omgeving.mjs`; `regels.mjs` importeert dezelfde. Geen script schrijft eigen opmaak.

### Helpers
- `kopregel(soort, omgeving, projectId, { droog })` — `soort` is `'DOEL'` of `'REGELS NAAR'`.
- `stop(wat, regels = [], niets = 'geschreven')` — schrijft naar stderr en `process.exit(1)`.
- `waarschuw(tekst, regels = [])` — stderr, script gaat door (M8).
- `gelukt(tekst)` — afsluitende succesregel.

### Kleur
- Alleen kleur als `process.stdout.isTTY` en `NO_COLOR` niet gezet is; anders platte tekst. De tekst is zonder kleur volledig begrijpelijk (de woorden TEST/PRODUCTIE/GESTOPT dragen de betekenis).
- Codes (vast, nergens anders):
  - TEST-kopregel: vet, wit op cyaan `\x1b[1;97;46m` (dichtst bij petrol).
  - PRODUCTIE-kopregel: vet, zwart op geel `\x1b[1;30;43m` (dichtst bij oranje).
  - `GESTOPT` / `AFGEBROKEN`: vet rood `\x1b[1;31m`.
  - `LET OP`: vet geel `\x1b[1;33m`.
  - `KLAAR`: groen `\x1b[32m`.
  - Reset `\x1b[0m` na elk gekleurd stuk.

### Kopregel (altijd de eerste uitvoer, vóór elke vraag)
Lege regel ervoor en erna. De gekleurde balk omvat de hele regel, met één spatie marge links en rechts.
```

 DOEL: TEST — project clubkompas-test 

```
Met `--droog`: ` DOEL: TEST — project clubkompas-test · DROOG (er wordt niets geschreven) `

Productie:
```

 DOEL: PRODUCTIE — project svn10-clubkompas (echte clubdata) 
Dit script schrijft in de echte clubdata.
Typ de projectnaam svn10-clubkompas om door te gaan (iets anders = stoppen): 
```
- Tweede regel vet (zonder achtergrond). Bij `--droog` vervallen regels 2 en 3.

Regels:
```

 REGELS NAAR: TEST — project clubkompas-test 

```
```

 REGELS NAAR: PRODUCTIE — project svn10-clubkompas (echte clubdata) 
Heb je deze regels eerst in test gepubliceerd en gecontroleerd?
Typ de projectnaam svn10-clubkompas om te publiceren (iets anders = stoppen): 
```

### Meldingen
Vaste vorm; teksten M3–M15 letterlijk uit de gebruikersreis, opgeknipt in deze delen:
```

GESTOPT  het bestand .env.test.local ontbreekt.
         Dit script weet daardoor niet met welk project het moet werken.
         Zie README, "Omgevingen".
         Er is niets geschreven.

```
- Regel 1: label in hoofdletters (`GESTOPT`; `AFGEBROKEN` bij M9; `LET OP` bij M8), twee spaties, dan **wat** er aan de hand is (kleine beginletter, eindigt met punt).
- Volgregels: ingesprongen tot onder de tekst (9 spaties), eerst uitleg, dan **wat te doen**.
- Laatste regel bij elke stop: `Er is niets geschreven.` (scripts) of `Er is niets gepubliceerd.` (regels.mjs, M14/M15). Bij M8 (waarschuwing) geen niets-regel.
- Bestandsnamen en commando's zonder aanhalingstekens of backticks; README-sectienamen tussen dubbele aanhalingstekens.
- Omgevingsnamen in meldingen altijd in hoofdletters: `je koos TEST`, `je koos PRODUCTIE`.
- M12 (permission-denied): oorzaken als genummerde volgregels `(1) …` en `(2) …`, elk op een eigen regel.
- Afsluitend succes: `KLAAR  3 toegevoegd, 18 bijgewerkt in clubkompas-test.` (project-ID altijd noemen).

---

## Nieuwe CSS
Toevoegen onderaan `src/style.css` onder kop `/* ── Omgevingen (P0e) ── */`. Alleen bestaande tokens.

```css
.omgeving-balk {
  padding: 6px 16px;
  min-height: 28px;
  text-align: center;
  font-size: var(--fs-label);
  line-height: 16px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.omgeving-balk strong { font-weight: 700; }
.omgeving-balk--test {
  background: var(--petrol-dark);
  color: var(--on-petrol);
}
.omgeving-balk--productie {
  background: var(--orange);
  color: #111212;
  border-bottom: 1px solid #111212;
}
body.met-omgeving-balk .inlog-wrap { min-height: calc(100vh - 28px); }

.omgeving-label--waarschuwing {
  background: var(--orange);
  color: #111212;
  font-weight: 700;
  padding: 1px 6px;
}

.inlog-kaart.kaart-gestopt { border-top-color: var(--orange); }
.config-gerust { font-weight: 700; }
.config-stappen {
  margin: -8px 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--fs-lopend);
  line-height: 21px;
  color: var(--text);
}
.inlog-kaart code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--fs-toelichting);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 0 4px;
  overflow-wrap: anywhere;
}

.inlog-test-hint {
  display: block;
  margin-top: 4px;
  font-size: var(--fs-toelichting);
  line-height: 19px;
  color: var(--text);
}
```
Opmerkingen:
- `#111212` is geen nieuwe kleur: dezelfde vaste waarde als `.btn.primary` (blijft ook in donkere modus donker op oranje).
- `margin-top: -8px` bij `.config-stappen` trekt de lijst dichter onder het label "Wat nu?" binnen de flex-gap van 16px.

## Responsief gedrag
- Balk: één regel vanaf ca. 420px; daaronder breekt hij netjes af (geen `white-space: nowrap`), daarom `min-height` en geen vaste hoogte.
- Foutpagina: erft `.inlog-kaart` (max 400px). Lange paden in `<code>` breken via `overflow-wrap: anywhere`.
- Footer: grid ongewijzigd; het oranje label past in de middenkolom.

## Implementatienotities voor de bouwer
- Volgorde onderaan `main.js`: `if (configFout) { renderConfigFout(configFout) } else { toonOmgevingsBalk(); onAuthStateChanged(...) }`. Geen code mag `auth`/`db` aanraken vóór die check.
- `renderConfigFout` hergebruikt `toonTussenkaart(inhoudHTML)`; geef `toonTussenkaart` een optie `{ gestopt: true }` die `.kaart-gestopt` op de kaart zet.
- `toonOmgevingsBalk()` voegt in met `document.body.prepend(el)`; eerst controleren of `.omgeving-balk` al bestaat (Vite HMR).
- Live (`SOORT === 'productie'`): niets van P0e mag zichtbaar veranderen. Controle na merge: geen balk, footer "Productie · Versie …", tabtitel "clubKOMPAS".
- Teksten exact zoals hierboven; alleen `projectId` en `uid` zijn variabel en gaan door `esc()`.
- Terminal: geen eigen `console.log`-opmaak in de zes scripts, `seed-testclub.mjs` of `regels.mjs`; altijd via de helpers, zodat kleur, inspringing en de niets-regel overal gelijk zijn.
- Geen HTML-prototype gemaakt: de schermen hergebruiken bestaande componenten één-op-één.
