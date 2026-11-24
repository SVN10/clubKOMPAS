# Beveiligingsrapport: clubKOMPAS v0.13.0 (app-breed, herhaling van v0.12.1)

Branch `test` (gelijk aan `main`, commit 4bb42cb), stand 24-11-2026.
Gericht gelezen: `firestore.rules` (volledig), `src/main.js` (alle HTML-sinks, guards, logo, automatisch uitloggen, inloggen),
`src/firebase.js`, `src/omgeving.js`, `src/keuzelijst.js` (sinks), `src/onderdelen.js` en `src/vermogens.js` (sinks), `scripts/`
(uitvoer, `regels.mjs`, `lib/omgeving.mjs`, `controleer-p0d.mjs`), `tests/regels.test.mjs` (P0d en P0c), `vercel.json`, `index.html`,
`dist/index.html`, `.gitignore`.

Zelf gedraaid:
- `npm run test:regels`: **130/130 geslaagd** (emulator, exit 0).
- `npm run build`: slaagt. Er zijn geen inline scripts of stijlen in `dist/index.html`. De bundel bevat geen config-waarden (lokale build zonder `.env`), alleen sleutelnamen.
- `npm audit --omit=dev`: 4x high, alle via `@grpc/grpc-js`. Dit is ongewijzigd ten opzichte van v0.12.1. `audit fix --force` is niet gedraaid.

## Oordeel

**Naar TST met aandachtspunten. Ook vrij te geven voor PRD.** Er zijn geen kritieke en geen hoge bevindingen. Alle middel-punten en de hoge bevinding
uit v0.12.1 zijn opgelost. Wat overblijft, zijn lage punten: verdediging in de diepte, testdekking en instellingen in de console.

## Gecontroleerde aanvalspaden (geen gat gevonden)

- **Je eigen rol ophogen**: `clubs/{clubId}/leden/{uid}` heeft `write: if false` (`firestore.rules:237-240`). `gebruikers/{uid}` en `clubs/{clubId}` zijn ook schrijfdicht (`:226-234`). Dit wordt getest (`tests/regels.test.mjs`, describe "P0c").
- **Een beheerder van club A schrijft in club B**: `isBeheerder(clubId)` gebruikt de `clubId` uit het pad en leest `clubs/{clubId}/leden/{uid}` (`:18-21`). Alle `get`/`getAfter`-paden (`vermogenPad`, `naamPad`, `domeinPad`) staan ook vast op dezelfde `clubId`. Een ontbrekend ledendocument geeft een fout, en dat betekent weigeren.
- **Velden buiten `hasOnly`**: profiel, bestuursfuncties, domeinen, vermogens, projecten, samenwerkingen, commissies en vermogensnamen hebben allemaal `hasOnly`. Een verplicht veld dat ontbreekt (`naam`, `type`) laat de regel fouten en wordt dus geweigerd. `matches()` toetst de hele string.
- **`bevat`**: alleen een beheerder kan dit veld zetten of weghalen, en alleen met de waarde `projecten` of `samenwerkingen` (`:178-180`). Dit wordt getest. Zie L3 voor een kleine aantekening.
- **Traversal via `domeinId`/`laatsteVermogenId`**: de paden blijven binnen `clubs/{clubId}`. Een id met `/` wijst naar een subdocument zonder regel, dus naar een niet-bestaand document, en dat wordt geweigerd. Voor `domeinId` is dit getest (`tests/regels.test.mjs:634-643`).
- **App-guards tegenover regels**: `isBeheerder()` in de app (`src/main.js:297`) vergelijkt precies `=== 'beheerder'` zonder trim, net als de regels. `laadRol` trimt niet meer (`:288-295`). `navigeer` stuurt via `magNaar` naar Home (`:1388`). Alle vijf beheer-renders beginnen met `geenBeheer()` (`:1577, 2042, 2502, 2902, 3169`). `BEHEER_PAGINAS` komt uit `ZIJMENU` (`:1365`). Lezen mag voor elk lid, in de regels en in de app.
- **XSS**: alle 45 `innerHTML`/`insertAdjacentHTML`-plekken zijn nagelopen. Alle interpolaties zonder `esc()` zijn constanten, getallen, ternaries met vaste tekst, of uitvoer van helpers die zelf escapen (`actieKnopHTML`, `meldingenHTML`, `tabelHTML`, `pictogramKeuzeHTML`, `bestuursfunctieKeuzeHTML`, `laadfoutHTML`, `domeinOptiesHTML`). Document-id's gaan door `esc()`, en in selectors door `CSS.escape`. `icoon` wordt eerst tegen een vaste lijst getoetst (`:156`). `x.status` in een class komt alleen voor na `Object.hasOwn(STATUS_LABEL, …)` (`:2626`). Meldingen gebruiken `textContent`/`replaceChildren`. In `keuzelijst.js` gaan optieteksten via `textContent` (`:90, 116, 127`). Er is geen `eval`, `new Function` of `document.write`.
- **Logo**: `veiligLogo` gebruikt nu de volledige regex van de regels plus een lengtegrens (`src/main.js:31-34`). Het wordt overal gebruikt waar het logo wordt getoond (`:44, 1463, 3170`). Uploaden kan alleen als PNG, JPEG of WebP (`:267`) en wordt via canvas opnieuw opgeslagen als PNG (`:66`). Dat verwijdert eventuele ingebedde inhoud.
- **Geheimen**: alleen `.env.test.local.voorbeeld` is getrackt (zonder waarden). Er zijn geen API-keys, private keys of service-accounts in git, ook niet in de geschiedenis. `.env*.local` staat in `.gitignore`.
- **Scripts**: `regels.mjs` start `firebase deploy` via `spawn`, zonder shell en met een omgeving uit een vaste lijst (`scripts/regels.mjs:40`, `lib/omgeving.mjs:64-75`). Voor productie is een bevestiging nodig. `controleer-p0d.mjs` geeft nu `{ id, data }` apart door (`:42`).

## Bevindingen

| # | Ernst | Type | Locatie | Probleem | Voorstel |
|---|---|---|---|---|---|
| L1 | Laag | Ontbrekende tests (tenant) | `tests/regels.test.mjs:1135-1141` | De test "beheerder van een andere club" dekt alleen `bestuursfuncties` en `instellingen`. Voor `structuurelementen`, `vermogens`, `vermogensnamen`, `projecten`, `samenwerkingen` en `commissies` toetst geen test dat een beheerder van club2 hier niet mag schrijven of verwijderen. De regel is nu goed (overal dezelfde `isBeheerder(clubId)`), maar een regressie in één `match`-blok zou geen test laten falen. | Zet de test in een lus over alle zeven collecties. Laat `piet` (beheerder in club2) per collectie een `setDoc`, een `updateDoc` op een bestaand document en een `deleteDoc` doen, elk met `assertFails`. |
| L2 | Laag | Invoervalidatie (regels) | `firestore.rules:219` (`icoon`), `:201-205`, `:194-200`, `:215` | (a) `icoon` is in de regels elke string van hooguit 50 tekens. Alleen de app toetst tegen de vaste lijst (`src/main.js:156`). (b) Namen van het profiel, bestuursfuncties en domeinen hebben geen tekenklasse. Een beheerder kan dus regeleindes, nul-breedte-tekens of bidi-tekens (U+202E) opslaan. Dat is geen XSS, want alles gaat door `esc()`, maar het kan wel worden gebruikt om namen te vervalsen of om de uitvoer van scripts op te maken. (c) Of `bestuursfunctieId` echt bestaat, wordt niet gecontroleerd. | (a) In `geldigDomein`: `(!('icoon' in d) \|\| d.icoon in ['', 'hcaspeelt', …])`, met dezelfde lijst als `PICTOGRAMMEN`. (b) Een eenvoudige uitsluiting zoals `!n.matches('.*[\\u0000-\\u001F\\u200B-\\u200F\\u202A-\\u202E].*')`, of de aanpak van `geldigeOnderdeelnaam`. (c) Is optioneel, want het kost een `exists()` per schrijfactie. Alleen een beheerder kan dit misbruiken, dus de impact is klein. |
| L3 | Laag | Integriteit (regels) | `firestore.rules:178-180, 222` | `bevat` mag ook op een pijler of ondersteunend domein staan, en op meerdere domeinen tegelijk. De app kiest het eerste overkoepelende domein met `bevat` (`src/main.js:1209`), dus dit is geen lek, wel inconsistente data. | In `geldigDomein`: `(!('bevat' in d) \|\| d.type == 'overkoepelend')`, plus een test. Uniek maken is niet nodig. |
| L4 | Laag | Headers / CSP | `vercel.json:9-12` | De CSP is goed en strenger dan voorgesteld: `style-src 'self'` zonder `'unsafe-inline'`, `object-src 'none'` en `frame-ancestors 'none'`. Kleine verbeterpunten: (a) `frame-src` voor de twee `firebaseapp.com`-domeinen en `*.firebaseio.com` in `connect-src` zijn niet nodig bij inloggen met e-mail en wachtwoord zonder Realtime Database. (b) Er is geen `Permissions-Policy`. (c) HSTS is afhankelijk van de standaard van Vercel. | (a) Haal ze weg als test bevestigt dat inloggen, wachtwoord wijzigen en e-mail wijzigen (`verifyBeforeUpdateEmail`) zonder iframe werken. Laat ze anders staan en schrijf erbij waarom. (b) Voeg `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` toe. (c) Zet expliciet `Strict-Transport-Security: max-age=63072000; includeSubDomains`. |
| L5 | Laag | Sessie | `src/main.js:80-103, 3458` | Automatisch uitloggen na 8 uur werkt in de client. Bij het laden wordt gecontroleerd, daarna elke minuut, en de tabbladen delen de tijd via `localStorage`. Dit beschermt de gedeelde clubcomputer, en dat is het doel. Beperkingen: het refresh-token wordt niet aan de serverkant ingetrokken, en wie toegang heeft tot het apparaat kan de `localStorage`-waarde aanpassen. Dat is aanvaardbaar zolang er geen persoonsgegevens zijn. | Dit is nu een bewuste keuze. Kies vóór persoonsgegevens voor `browserSessionPersistence` of een optie "op deze computer onthouden", en zet in de Firebase-console eventueel een maximale sessieduur (Identity Platform). |
| L6 | Laag | Authenticatie (console) | buiten de repo; `src/main.js:798-802` | Dit staat nog open sinds v0.12.1 (L2) en is niet vanuit de code te controleren. Gaat het om zelfregistratie, de bescherming tegen e-mailenumeratie (de app toont nog een aparte melding voor `auth/user-not-found` en `auth/wrong-password`) en de beperkingen van de API-key en App Check? | Controleer in beide projecten: sign-up uit, "Email enumeration protection" aan, de API-key beperkt tot de Vercel-domeinen en localhost. Daarna kunnen de twee aparte meldingen weg, want Firebase geeft dan alleen `auth/invalid-credential`. |
| L7 | Laag | Afhankelijkheden | `package.json` | Dit is ongewijzigd ten opzichte van v0.12.1 (L3). Er zijn 4x high via `@grpc/grpc-js` (firebase → @firebase/firestore), met adviezen aan de serverkant. Dit draait alleen in Node (scripts), niet in de browserbundel. De voorgestelde "fix" is een downgrade naar firebase 9.14. | Draai geen `audit fix --force`. Houd `firebase` bij en controleer bij elke update opnieuw. |
| L8 | Laag | Scripts / overgangsregels | `scripts/firestore.rules.migratie:9` | Dit staat nog open sinds v0.12.1 (L6). Dit bestand geeft één uid lees- en schrijfrecht op de hele database. Er staat een duidelijke waarschuwing en een placeholder in, maar bij hergebruik is het gevaarlijk. | Verwijder het (de tekst blijft in de git-geschiedenis staan) of verplaats het naar `archief/`. Doe hetzelfde met de oude `firestore.rules.voor-P0c` en `firestore.rules.voor-P0d`, zodat niemand per ongeluk een oude, lossere versie publiceert. |
| L9 | Laag | Terminal-injectie (scripts) | `scripts/migreer-club.mjs:126, 145, 201` | Dit is grotendeels opgelost sinds v0.12.1 (L1). Alleen in `migreer-club.mjs` gaan de waarschuwingen en verschillen (met document-id's en namen uit de database) nog via een gewone `console.log`. Het is een eenmalig migratiescript. | Zet ook deze drie regels door `veilig(…)`, of archiveer het script samen met L8. |

## Opgelost sinds v0.12.1

| v0.12.1 | Ernst toen | Onderwerp | Status in v0.13.0 | Bewijs |
|---|---|---|---|---|
| H1 | Hoog | P0d: elk lid mag masterdata schrijven | **Opgelost** | `isBeheerder` op elke `create`/`update`/`delete` (`firestore.rules:18-21, 249-341`), getest in describe "P0d: alleen een beheerder schrijft" |
| M1 | Middel | Geen `hasOnly` op profiel, bestuursfuncties en structuurelementen | **Opgelost** | `geldigProfiel`, `geldigeBestuursfunctie`, `geldigDomein` (`:194-223`) met typen en lengtes, hashtag-regex en `nietLeeg`. Getest, ook met extra velden |
| M2 | Middel | Geen tests voor de koppeling gebruiker → club | **Opgelost** | describe "P0c: gebruikers, leden en het clubdocument": zelf schrijven, rol ophogen, een ander lezen, niet ingelogd |
| M3 | Middel | Geen beveiligingsheaders of CSP | **Opgelost** | `vercel.json`: CSP (ook `frame-ancestors 'none'` en `object-src 'none'`), `nosniff`, `Referrer-Policy`. Restpunten in L4 |
| L1 | Laag | Terminal-injectie in oudere scripts | **Grotendeels opgelost** | `veilig()` in `opschonen-dubbelen`, `inrichten-domeinen-hca`, `inrichten-beheer-hca` en `migreer-club:120`. Rest in L9 |
| L2 | Laag | Console-instellingen voor Auth | Open | Zie L6 |
| L3 | Laag | `npm audit` via grpc-js | Open (geaccepteerd) | Zie L7 |
| L4 | Laag | SVG-logo toegestaan | **Opgelost** | Regels alleen `png\|jpeg\|webp` en max. 700.000 tekens (`:25-30`). App: dezelfde regex in `veiligLogo` en `accept` |
| L5 | Laag | Geen time-out van de sessie | **Deels opgelost** | Automatisch uitloggen na 8 uur (CK-052). Rest in L5 |
| L6 | Laag | Overgangsregels in `scripts/` | Open | Zie L8 |
| P0d-1 | Laag | App trimt de rol, regels niet | **Opgelost** | `laadRol` trimt niet meer (`src/main.js:292`) |
| P0d-2 | Laag | Naam van een bestuursfunctie mag alleen uit spaties bestaan | **Opgelost** | `d.naam.trim().size() >= 2` (`firestore.rules:203`) |
| P0d-3 | Laag | `veiligLogo` controleert alleen het begin | **Opgelost** | Volledige regex plus lengtegrens (`src/main.js:31-34`) |
| P0d-4 | Laag | Veld `id` overschrijft het document-id in het script | **Opgelost** | `{ id: d.id, data: d.data() }` (`scripts/controleer-p0d.mjs:42`, `lib/p0d-velden.mjs:77-78`) |

## Samenvatting
- Kritieke bevindingen: 0
- Hoge bevindingen: 0
- Middel: 0
- Lage aanbevelingen: 9 (L1-L9)

## Voorstel: wat eerst
1. **L1**: de test voor club A en club B uitbreiden naar alle collecties. Dat is klein en beschermt de belangrijkste regel.
2. **L6**: de console-instellingen in test en productie (sign-up uit, bescherming tegen enumeratie, API-key-beperking).
3. **L2a + L3**: `icoon`-lijst en `bevat` alleen op een overkoepelend domein in de regels, samen met tests en de spiegel in `p0d-velden.mjs`.
4. **L8 + L9**: oude regelbestanden en het migratiescript archiveren.
5. **L4, L5**: bij gelegenheid, en L5 in elk geval vóór persoonsgegevens.

## Eindoordeel
Naar TST met aandachtspunten. Geen blokkade voor PRD.
