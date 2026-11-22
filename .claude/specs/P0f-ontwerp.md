# Ontwerp: P0f — Eigen adressen voor live en online test

Bron: `P0f-adressen.md` (incl. antwoorden en bijstellingen) en `P0f-gebruikersreis.md` (reis B, D1, D2). Bouwt voort op `P0e-ontwerp.md`.
Geen nieuwe schermen, geen nieuwe kleuren, **geen nieuwe CSS**. Alles hergebruikt P0e-componenten: `.omgeving-balk--test`, `.omgeving-balk--productie`, `.omgeving-label--waarschuwing`, `.kaart-gestopt`, `.config-gerust`, `.config-stappen`, `.inlog-kaart code`, `.inlog-test-hint`, `.tussen-hint`, `.tussen-link`.

---

## 0. Eén bron voor de omgeving (`src/firebase.js`)

`OMGEVING`, `SOORT` en `OMGEVING_LABEL` verhuizen van `main.js` naar `firebase.js` en worden geëxporteerd, samen met `VERCEL_ENV`. `main.js` verwijdert zijn eigen drie constanten en importeert:
```js
import { auth, db, projectId, configFout, SOORT, OMGEVING_LABEL, VERCEL_ENV, PRODUCTIE_PROJECT_ID } from './firebase.js'
```

**`vite.config.js`**, in het bestaande `define`-blok (naast `__APP_BUILD__`, `__MODUS_SLEUTELS__`):
```js
__VERCEL_ENV__: JSON.stringify(process.env.VERCEL_ENV || ''),
```
Voeg `__VERCEL_ENV__` toe aan de globals van ESLint als `__APP_BUILD__` daar ook staat.

**SOORT-bepaling** (exact deze volgorde; eerste die past wint):

| # | Voorwaarde | SOORT | `console.warn` |
|---|---|---|---|
| 1 | `DEV` en `MODE === 'productie'` | `productie-lokaal` | – |
| 2 | `DEV` (elke andere modus) | `ontwikkel` | – |
| 3 | build, `projectId === PRODUCTIE_PROJECT_ID`, `VERCEL_ENV === 'production'` | `productie` | als label ≠ `productie` |
| 4 | build, `projectId === PRODUCTIE_PROJECT_ID`, label `test` of `ontwikkel` | dat label | – (configFout volgt, zie hieronder) |
| 5 | build, `projectId === PRODUCTIE_PROJECT_ID`, label leeg/onbekend/`productie` | `productie` | als label ≠ `productie` |
| 6 | build, ander project, label `ontwikkel` | `ontwikkel` | – |
| 7 | build, ander project, elk ander label (ook `productie`, leeg) | `test` | als label ≠ `test` |

- "label" = `(import.meta.env.VITE_OMGEVING || '').trim().toLowerCase()`. Project-ID's altijd met `===`.
- Regel 3 voorkomt dat live met een verkeerd label (`Test`) een balk "fictieve data" boven echte data toont.
- Regel 7 is het principe: **elke build die niet naar het productieproject wijst, toont een balk** (ook live met een testproject).

```js
const DEV = import.meta.env.DEV
const MODUS = import.meta.env.MODE
export const VERCEL_ENV = __VERCEL_ENV__
const label = (import.meta.env.VITE_OMGEVING || '').trim().toLowerCase()
const isProd = projectId === PRODUCTIE_PROJECT_ID

export const SOORT = DEV ? (MODUS === 'productie' ? 'productie-lokaal' : 'ontwikkel')
  : isProd ? (VERCEL_ENV !== 'production' && (label === 'test' || label === 'ontwikkel') ? label : 'productie')
  : label === 'ontwikkel' ? 'ontwikkel' : 'test'

export const OMGEVING_LABEL = {
  'productie-lokaal': 'Productie (lokaal)', ontwikkel: 'Ontwikkel', test: 'Test', productie: 'Productie',
}[SOORT]

const verwacht = { productie: 'productie', test: 'test', ontwikkel: 'ontwikkel' }[SOORT]
if (!DEV && projectId && label !== verwacht) {
  console.warn(`[clubKOMPAS] VITE_OMGEVING is "${label || '(leeg)'}"; omgeving bepaald als "${OMGEVING_LABEL}" op basis van project ${projectId}.`)
}
```
Het footerlabel komt dus altijd uit SOORT, nooit meer rechtstreeks uit `VITE_OMGEVING` (lokaal toont "Ontwikkel", ook met `VITE_OMGEVING=Test` in `.env.test.local`).

**configFout** (volgorde):
```js
const onvolledig = Object.values(firebaseConfig).some(w => !w)
  || !firebaseConfig.authDomain.startsWith(`${projectId}.`)
const modusMist = MODUS === 'test' && FIREBASE_SLEUTELS.some(s => !__MODUS_SLEUTELS__.includes(s))
const nietLive = !DEV && VERCEL_ENV !== 'production'

export const configFout = !projectId ? 'geen-config'
  : DEV && isProd && MODUS !== 'productie' ? 'productie-lokaal'
  : DEV && (onvolledig || modusMist) ? 'gemengde-config'
  : nietLive && isProd && (SOORT === 'test' || SOORT === 'ontwikkel') ? 'test-met-productie'
  : nietLive && onvolledig ? 'gemengde-config'
  : null
```
`modusMist` (de `__MODUS_SLEUTELS__`-controle) blijft alleen voor DEV.

**Live breekt nooit:** bij `VERCEL_ENV === 'production'` kan `configFout` alleen `'geen-config'` zijn (ongewijzigd uit P0e). Alle nieuwe stops hangen aan `nietLive`, alle P0e-stops aan `DEV`. Afwijkingen op live geven alleen `console.warn`.

---

## Schermen

### Scherm 1: Omgevingsbalk — vier toestanden

**Keuze: Ontwikkel en Test krijgen allebei `.omgeving-balk--test` (petrol-dark). Het onderscheid zit in de tekst en de tabtitel, niet in kleur of vorm.**
Reden: beide praten met hetzelfde testproject met fictieve data, dus het risico is gelijk; de enige grens die visueel moet schreeuwen is "echte data" (oranje) tegenover "geen balk = live". Een tweede vormvariant (rand, icoon) zou de balk drukker maken zonder extra veiligheid. Het eerste woord plus "op deze computer" / "online" zegt het wél, en de tabtitel herhaalt het.

| SOORT | Klasse | Inhoud (HTML; CSS zet hoofdletters) | Tabtitel |
|---|---|---|---|
| `ontwikkel` | `omgeving-balk omgeving-balk--test` | `<strong>Ontwikkelomgeving</strong> · op deze computer · project ${esc(projectId)} · fictieve data` | `ONTWIKKEL · clubKOMPAS` |
| `test` | `omgeving-balk omgeving-balk--test` | `<strong>Testomgeving</strong> · online · project ${esc(projectId)} · fictieve data` | `TEST · clubKOMPAS` |
| `productie-lokaal` | `omgeving-balk omgeving-balk--productie` | ongewijzigd: `<strong>Let op: echte clubdata</strong> · lokaal tegen ${esc(projectId)}` | `PRODUCTIE LOKAAL · clubKOMPAS` |
| `productie` | geen balk | – | ongewijzigd `clubKOMPAS` |

- Zet daarnaast `data-soort="${SOORT}"` op de balk (alleen voor controle/tests; geen CSS op dit attribuut).
- Markup, `role="note"`, `aria-label="Omgeving"`, `prepend`, HMR-controle en `body.met-omgeving-balk`: ongewijzigd uit P0e.
- Bij een `configFout` geen balk (zoals P0e); tabtitel `Gestopt · clubKOMPAS`.

### Scherm 2: Footer
Alleen het middelste `<span>` van `footerHTML()`.

| SOORT | Weergave midden | Tooltip (`title`) |
|---|---|---|
| `ontwikkel` | `ONTWIKKEL · VERSIE 0.x` | `Project ${projectId} · Gebouwd op …` |
| `test` | `TEST · VERSIE 0.x` | `Project ${projectId} · Gebouwd op …` |
| `productie-lokaal` | oranje vlak `PRODUCTIE (LOKAAL)` · `VERSIE 0.x` (ongewijzigd) | `Project ${projectId} · Gebouwd op …` |
| `productie` | `PRODUCTIE · VERSIE 0.x` (ongewijzigd) | `Gebouwd op …` (ongewijzigd) |

`toonProject = SOORT !== 'productie'`.

### Scherm 3: Foutpagina's online (`renderConfigFout`)
Zelfde opbouw en stijl als M2 (`toonTussenkaart(…, { gestopt: true })`, oranje bovenrand, `role="alert"`, focus op titel, knop "Opnieuw laden", `console.error`).

**Afweging technische hints:** deze twee pagina's verschijnen nooit op live (`nietLive`). Ze zijn alleen te zien op `tst.` of een andere preview (achter de Vercel-login) of in een lokale build, dus alleen voor Paul. Daarom mogen variabelenamen, project-ID's en Vercel-menu's erin. Bestandsnamen tonen we alleen in de lokale variant (`VERCEL_ENV === ''`).

**`test-met-productie`, online (`VERCEL_ENV !== ''`)**
- Titel: `Gestopt: deze testomgeving wijst naar de echte clubdata`
- Alinea: `Het project in de configuratie is <code>${esc(projectId)}</code> (productie). Waarschijnlijk staan bij Vercel onder <strong>Preview</strong> nog de productiewaarden.`
- Gerust: `Er is niets gelezen of opgeslagen.`
- Stappen:
  1. `Open in Vercel: Settings → Environment Variables.`
  2. `Zorg dat elke <code>VITE_FIREBASE_*</code> onder Preview de waarden van <code>svn10-clubkompas-test</code> heeft.`
  3. `Doe daarna een Redeploy van de branch <code>test</code>.`
- Hint: `Je wilde de echte clubdata? Ga naar <a class="tussen-link" href="https://clubkompas.svn10.nl">clubkompas.svn10.nl</a>.`

**`test-met-productie`, lokale build (`VERCEL_ENV === ''`)**
- Titel: `Gestopt: deze testbuild wijst naar de echte clubdata`
- Alinea: `Het project in de configuratie is <code>${esc(projectId)}</code> (productie), terwijl het label een testomgeving aangeeft.`
- Gerust: idem.
- Stappen:
  1. `Controleer dat <code>.env.${esc(import.meta.env.MODE)}.local</code> de waarden van het testproject bevat.`
  2. `Bouw opnieuw (<code>npx vite build --mode test</code>) en laad deze pagina opnieuw.`

**`gemengde-config`, online (`!DEV`, `VERCEL_ENV !== ''`)**
- Titel: `Gestopt: de instellingen van deze testomgeving zijn onvolledig of passen niet bij elkaar`
- Alinea: `Een van de zes Firebase-waarden ontbreekt, of de waarden horen niet bij hetzelfde project (<code>${esc(projectId)}</code>).`
- Gerust: idem.
- Stappen:
  1. `Controleer in Vercel (Settings → Environment Variables, Preview) of alle zes <code>VITE_FIREBASE_*</code> gevuld zijn en bij hetzelfde project horen; <code>VITE_FIREBASE_AUTH_DOMAIN</code> begint met de project-ID.`
  2. `Doe daarna een Redeploy van de branch <code>test</code>.`

**`gemengde-config`, lokale build (`!DEV`, `VERCEL_ENV === ''`)**
- Titel: `Gestopt: de configuratie is onvolledig of gemengd`
- Alinea: `In <code>.env.${esc(import.meta.env.MODE)}.local</code> ontbreekt een van de zes Firebase-waarden, of de waarden horen niet bij hetzelfde project (<code>${esc(projectId)}</code>).`
- Stappen: 1 als de online variant maar met dat bestand; 2 `Bouw opnieuw en laad deze pagina opnieuw.`

De bestaande DEV-teksten (`productie-lokaal`, `gemengde-config` lokaal, `geen-config` lokaal en build) blijven letterlijk staan. Volgorde in `renderConfigFout`: `productie-lokaal` → `test-met-productie` → `gemengde-config && DEV` → `gemengde-config` (build) → `DEV` (geen-config) → anders (geen-config build).

### Scherm 4: Inlogscherm — M16 en hint M5

**M16 — Adres niet toegestaan** (alle omgevingen), in het bestaande `#inlog-algemeen-fout` (`role="alert"`), bij:
`e.code === 'auth/unauthorized-domain' || e.code === 'auth/unauthorized-continue-uri' || String(e.code).startsWith('auth/requests-from-referer')`

Opbouw (alles met `textContent`/`createElement`, adres = `location.host`):
```html
<div class="form-fout" id="inlog-algemeen-fout" role="alert">
  Inloggen is op dit adres (<strong>clubkompas.svn10.nl</strong>) nog niet toegestaan.
  <span class="inlog-test-hint">Dit ligt niet aan je e-mailadres of wachtwoord; er is niets gewijzigd. Probeer het later opnieuw of meld het aan de beheerder.</span>
  <!-- alleen bij SOORT ontwikkel of test: -->
  <span class="inlog-test-hint">Voeg <code>tst.clubkompas.svn10.nl</code> toe in de Firebase-console van <strong>svn10-clubkompas-test</strong> (Authentication → Settings → Authorized domains) en, als die er is, aan de websitebeperking van de API-key in Google Cloud Console.</span>
</div>
```
- Bewuste kleine afwijking van D2: "Je gegevens zijn in orde" wordt "Dit ligt niet aan je e-mailadres of wachtwoord". Bij een geblokkeerd adres controleert Firebase de gegevens niet, dus "in orde" kunnen we niet beloven; de bedoeling (niet gaan resetten) blijft.
- Eerste zin rood (`.form-fout`), de `span`s in `--text` (bestaande `.inlog-test-hint`). `code` krijgt de bestaande `.inlog-kaart code`-stijl.
- Geen M5-hint tegelijk met M16.

**Hint M5:** voorwaarde wordt `(SOORT === 'test' || SOORT === 'ontwikkel')` met de drie bestaande foutcodes. Het vette woord volgt de omgeving: `ontwikkelomgeving` resp. `testomgeving`. Rest van de zin ongewijzigd.

### Scherm 5: Geen club gekoppeld (M6)
Voorwaarde `(SOORT === 'test' || SOORT === 'ontwikkel')`. Voorvoegsel `<strong>Ontwikkelomgeving:</strong>` resp. `<strong>Testomgeving:</strong>`; rest ongewijzigd.

---

## Nieuwe CSS
Geen. Ontwikkel en Test gebruiken `.omgeving-balk--test`; M16 hergebruikt `.form-fout`, `.inlog-test-hint` en `.inlog-kaart code`; de foutpagina's hergebruiken de P0e-klassen.

## Responsief gedrag
- De langste balktekst (Ontwikkel, ca. 85 tekens) is één regel vanaf ca. 680px en breekt daaronder af naar twee regels (rond 400px). Geen afkapping, geen `nowrap`; `min-height` uit P0e vangt dit op. Woorden niet weglaten op smal scherm: "op deze computer"/"online" is juist het onderscheid.
- M16: lange hostnamen in `<code>` breken via de bestaande `overflow-wrap: anywhere`.

## Toegankelijkheid (zoals P0e)
- Balk `role="note"`, niet voorgelezen bij elke schermwissel; de betekenis zit in woorden, kleur is extra. Contrast petrol-dark/on-petrol ≈ 6,5:1.
- Foutpagina's: `role="alert"`, focus op `#tussen-titel`, "Gestopt:" in de titel naast de oranje rand.
- M16 wordt voorgelezen via het bestaande `role="alert"` op `#inlog-algemeen-fout`. De link in de foutpagina is een echte `<a>` met zichtbare hostnaam.

## Implementatienotities voor de bouwer
- Verwijder `OMGEVING`, `SOORT`, `OMGEVING_LABEL` uit `main.js`; nergens anders meer op `VITE_OMGEVING` vergelijken.
- `toonOmgevingsBalk()`: `return` als `SOORT === 'productie'`; klasse `--productie` alleen voor `productie-lokaal`, anders `--test`; tekst en tabtitel uit de tabel in Scherm 1.
- Onderaan `main.js` blijft `if (configFout) … else { toonOmgevingsBalk(); onAuthStateChanged(…) }` ongewijzigd.
- Teksten exact zoals hierboven; variabel zijn alleen `projectId`, `location.host`, `MODE` en `uid`, altijd via `esc()` of `textContent`.
- Controle met nep-env (process-env wint van `.env`-bestanden in Vite), telkens `npx vite build && npx vite preview`:
  1. `VERCEL_ENV=preview VITE_OMGEVING=Test` + productiewaarden → foutpagina `test-met-productie` (online variant).
  2. `VERCEL_ENV=production VITE_OMGEVING=Test` + productiewaarden → app start, geen balk, footer "Productie", `console.warn`.
  3. `VERCEL_ENV=production` zonder `VITE_OMGEVING` + productiewaarden → app start, geen balk, `console.warn`.
  4. `VERCEL_ENV=preview VITE_OMGEVING=Test` + testwaarden → balk "Testomgeving · online …", footer "Test", tabtitel "TEST · clubKOMPAS".
  5. `VERCEL_ENV=preview` + testwaarden met lege `VITE_FIREBASE_APP_ID` → `gemengde-config` (online variant).
  6. `npm run dev` met `VITE_OMGEVING=Test` in `.env.test.local` → balk "Ontwikkelomgeving · op deze computer …", footer "Ontwikkel".
  7. `npm run dev:productie` → oranje balk en footer ongewijzigd.
- Geen HTML-prototype: alles hergebruikt bestaande componenten één-op-één.
