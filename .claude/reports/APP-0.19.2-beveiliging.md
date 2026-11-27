# Beveiligingsrapport: clubKOMPAS v0.19.2 (app-breed)

Branch `test`, commit 8f54bef, stand 27-11-2026. Dit is een controle van de hele bestaande code, niet van één wijziging.

Gelezen: `firestore.rules` (volledig), `src/main.js` (alle `innerHTML`/`insertAdjacentHTML`-plekken, attributen, `href`/`src`, guards, inloggen, account, logo), `src/venster.js`, `src/keuzelijst.js` (sinks), `src/vermogens.js`, `src/onderdelen.js` en `src/activiteiten.js` (schrijfpaden), `src/firebase.js`, `src/omgeving.js`, `vite.config.js`, `vercel.json`, `index.html`, `.gitignore`, de omgevingstests in `tests/regels.test.mjs`.

Zelf gedraaid:
- `npm run test:regels`: **198/198 geslaagd** (emulator, exit 0).
- `npm audit --omit=dev`: 4x high via `@grpc/grpc-js`, hetzelfde als in v0.13.0 (bekend, L7 daar).

## Oordeel

Er zijn **geen kritieke, hoge of middel-bevindingen**. Ik vond geen XSS, geen lek tussen clubs en geen manier om jezelf beheerder te maken. Er is één nieuw laag punt over de omgevingsguard. Daarnaast staan er nog twee bekende lage punten open.

## Bevindingen

### L1. Lokale build in testmodus met productiewaarden start als "Productie" (nieuw)
**Ernst:** Laag
**Type:** Omgevingsscheiding (fictieve-data-principe)
**Locatie:** `src/omgeving.js:25` (soort) en `src/omgeving.js:37, 41-43` (stops)
**Probleem:** Bij `npm run dev` stopt de app als de Vite-modus niet `productie` is en het project wel productie is (`:41`). Ook controleert hij of de zes sleutels echt in het modusbestand staan (`modusMist`, `:37`). Bij een lokale **build** (`npx vite build --mode test`, geen Vercel) gebeurt geen van beide. Dan beslist alleen het label: met het productieproject en `VITE_OMGEVING` leeg of `Productie` wordt de soort `productie` (`:25`). Er komt geen balk en geen stop, alleen een `console.warn` als het label afwijkt. Dat gaat zo:
- `.env.test.local` is overschreven met een kopie van `.env.productie.local` (met `VITE_OMGEVING=Productie`), of
- `.env.test.local` mist de sleutels en een oude `.env` met productiewaarden vult ze aan.

Dan draait `npx vite preview --mode test`, het pad dat de README (regel 50) en het stopscherm (`src/main.js:928`) aanraden, zonder waarschuwing tegen de echte clubdata. Een aanvaller kan dit niet misbruiken; het gaat om een vergissing. Maar het is precies de vergissing waar de guard voor bedoeld is, en in `dev` wordt hij wel opgevangen. Vercel Preview en Production zijn hier niet bij betrokken: een Preview met productiewaarden stopt altijd (`:43`, getest).
**Aanbeveling:** Laat bij een lokale build ook de modus meetellen, net als in dev. Bijvoorbeeld in `configFout`, vóór de regel van `:43`:
```js
: !dev && vercelEnv === '' && isProd && modus !== 'productie' ? 'test-met-productie'
: !dev && vercelEnv === '' && (modusMist || onvolledig) ? 'gemengde-config'
```
`modusMist` kijkt nu alleen naar `modus === 'test'` en dat werkt hier ook. Voeg twee tests toe aan "lokale build": `modus: 'test'` met het productieproject en `label: 'productie'` geeft `test-met-productie`, en `modus: 'productie'` met het productieproject blijft `productie`. Let op: de bestaande test `g({ label: 'productie', config: config(PRODUCTIE_PROJECT_ID) })` gebruikt `modus: 'production'` (de standaard van `vite build`). Bepaal of een gewone `npm run build` tegen productie lokaal nog mag. Zo niet, dan stopt die test terecht.

### L2. Aparte inlogmelding "Geen account gevonden met dit e-mailadres" (bekend, open sinds v0.12.1)
**Ernst:** Laag
**Type:** Authenticatie (e-mailenumeratie)
**Locatie:** `src/main.js:821`; instelling in de Firebase-console
**Probleem:** Dit is ongewijzigd ten opzichte van APP-0.13.0 L6. Staat "Email enumeration protection" in een project uit, dan kan iedereen met deze melding nagaan of een e-mailadres een account heeft. Of het aan staat, is vanuit de code niet te controleren.
**Aanbeveling:** Zet in test en productie "Email enumeration protection" aan en zelfregistratie uit. Haal daarna de takken voor `auth/user-not-found` en `auth/wrong-password` weg, zodat er alleen "E-mailadres of wachtwoord klopt niet" overblijft.

### L3. Afhankelijkheden: 4x high via `@grpc/grpc-js` (bekend, geaccepteerd)
**Ernst:** Laag
**Type:** Afhankelijkheden
**Locatie:** `package.json` (`firebase`)
**Probleem:** Dit is hetzelfde als in APP-0.13.0 L7. Het gaat om adviezen voor de serverkant van gRPC, en die code zit niet in de browserbundel.
**Aanbeveling:** Draai geen `audit fix --force` (dat is een downgrade). Houd `firebase` bij.

## Gecontroleerd en in orde

**Autorisatie in `firestore.rules`**
- **Jezelf beheerder maken of van club wisselen:** `gebruikers/{uid}` (`:268-271`), `clubs/{clubId}` (`:275`) en `clubs/{clubId}/leden/{uid}` (`:278-281`) hebben `write: if false`. Je eigen `clubId` of `rol` aanpassen kan dus niet. Dit is getest (`tests/regels.test.mjs:1344-1346`).
- **Clubgrens:** elke lees- en schrijfregel gebruikt `isLid(clubId)` of `isBeheerder(clubId)` met de `clubId` uit het pad. Alle `get`/`exists`/`getAfter`-paden (vermogen, naam, domein, commissie, activiteit) staan vast op dezelfde `clubId`. Een id met `../` of `/` wijst naar een document dat niet bestaat, en dat wordt geweigerd. Er zijn geen collection-group- of recursieve wildcardregels. Wat niet genoemd is, is dicht. De tenanttests dekken alle negen collecties, ook activiteiten en uitvoeringen (`:1154`, `:1616-1620`, `:1920-1926`).
- **Velden die de app niet verwacht:** elke collectie heeft `hasOnly` plus `hasAll` of verplichte velden, met type- en lengtecontroles. `matches()` toetst de hele tekst. `icoon` zit nu op de vaste lijst (`:233-236`) en `bevat` mag alleen op een overkoepelend domein staan (`:265`). Daarmee zijn L2a en L3 uit v0.13.0 opgelost. Een nieuwe `omschrijving` wordt geweigerd (`geenNieuweOmschrijving`).
- **Rol:** in de app (`src/main.js:317`) en in de regels wordt `'beheerder'` letterlijk vergeleken. Alle beheerpagina's beginnen met `geenBeheer()`, en `navigeer` stuurt via `magNaar` terug naar Home. Dat is gemak, want de regels blokkeren toch.

**XSS**
- Alle `innerHTML`- en `insertAdjacentHTML`-plekken in `main.js`, `venster.js` en `keuzelijst.js` zijn nagelopen. Data uit Firestore, zoals namen van domeinen, vermogens, functies, commissies, projecten, samenwerkingen en activiteiten, hashtags, het clubprofiel, document-id's en datums, gaat overal door `esc()`. Dat geldt ook in `value`, `aria-label`, `data-*` en `optgroup label`. Wat zonder `esc()` wordt ingevoegd, is een constante, een getal, een vaste lijst (`STATUS_LABEL`, `SOORT_LABEL`, `cfg.*`) of de uitvoer van een helper die zelf escapet. `esc()` escapet ook `'` en `"`.
- Selectors gebruiken `CSS.escape`. De titel van het venster, meldingen, `toonOk`/`toonFout` en de opties van de keuzelijst gaan via `textContent`/`replaceChildren`. `confirm()` krijgt platte tekst. Er is geen `eval`, `new Function` of `document.write`.
- **Logo:** `veiligLogo` (`src/main.js:41-44`) gebruikt dezelfde volledige regex en lengtegrens als `geldigLogo` in de regels. Het wordt gebruikt voor de favicon (`:53`), de topbalk (`:1486`), Club (`:3778`) en het voorbeeld (`:3820`). SVG kan niet, en een upload wordt via canvas opnieuw als PNG opgeslagen.
- **Pictogram:** `pictogramHTML` toetst eerst tegen `PICTOGRAM_SLEUTELS` (`:163`). `data-nav` werkt alleen voor sleutels in `NAV_DOEL`. Filterwaarden komen uit vaste opties of worden getoetst tegen geldige domeinen.
- **Weergavenaam** (zelf in te vullen): overal geëscapet (`:1095, 1453, 3928`), en alleen de gebruiker zelf ziet hem.

**Gevoelige gegevens**
- **Console:** fouten loggen in productie alleen `e.code` en `e.name` (`:601`). Het volledige foutobject gaat alleen in DEV naar de console. Het project-ID staat in de console en de footer, maar dat is geen geheim. Er worden geen e-mailadressen, tokens of wachtwoorden gelogd.
- **mailto:** `supportMailto` (`:352-356`) zet het eigen e-mailadres van de gebruiker in de body van een mail aan het vaste adres `support@svn10.nl`. Het onderwerp en de body worden met `encodeURIComponent` gecodeerd. Er gaat pas iets weg als de gebruiker zelf klikt en verstuurt. Dat is bedoeld (PO-besluit 2) en geen lek.
- **Geheimen:** in git staat alleen `.env.test.local.voorbeeld` (zonder waarden). `.env*.local` staat in `.gitignore`. De Firebase-webconfig in de bundel is publiek bedoeld.

**Omgevingsguard (afgezien van L1)**
- Een Vercel Preview met het productieproject stopt altijd, welk label er ook staat. `npm run dev` tegen productie zonder `--mode productie` stopt. Een gemengde of onvolledige config stopt in dev en in Preview. Vercel Production breekt nooit. Een build op Vercel zonder `VERCEL_ENV` faalt (`vite.config.js:25-27`). Dit is allemaal getest.

**Headers en `index.html`**
- De CSP is streng: `script-src 'self'` en `style-src 'self'` zonder `unsafe-inline`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` en `frame-ancestors 'none'`. Daarnaast staan `nosniff`, `Referrer-Policy`, HSTS en `Permissions-Policy` aan. L4b en L4c uit v0.13.0 zijn opgelost. `index.html` heeft geen inline script.

**Opgelost sinds v0.13.0:** L2a (`icoon`-lijst in de regels), L2b (stuurtekens in namen), L3 (`bevat` alleen op overkoepelend), L4b/c (Permissions-Policy, HSTS), L8 (oude regelbestanden staan nu in `scripts/archief/`), L1 (de tenanttest dekt alle collecties). De punten uit CK-170 en CK-172 zijn laag of info. Ze gaan over integriteit binnen de eigen club en niet over toegang, dus ik heb ze hier niet herhaald.

## Samenvatting
- Kritieke bevindingen: 0
- Hoge bevindingen: 0
- Middel: 0
- Lage bevindingen: 3 (L1 nieuw, L2 en L3 bekend)

## Eindoordeel
Naar TST met aandachtspunten, en ook vrij te geven voor PRD. L1 is klein om op te lossen. Neem het mee bij de volgende wijziging aan `omgeving.js`. L2 vraagt een controle in de Firebase-console.
