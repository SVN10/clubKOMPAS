# Beveiligingsrapport: clubKOMPAS v0.12.1 (app-breed)

Branch `test`, stand 23-11-2026. Gelezen: `firestore.rules`, `src/firebase.js`, `src/main.js`, `src/onderdelen.js`,
`src/vermogens.js`, `src/keuzelijst.js`, alle `scripts/` (incl. `scripts/lib/`), `tests/regels.test.mjs`, `index.html`,
`vite.config.js`, `firebase.json`, `.firebaserc`, `.gitignore`, `.env.test.local.voorbeeld`.
Al gedraaid door de opdrachtgever: `npm run test:regels` 100/100, `npm run build` slaagt. Zelf gedraaid: `npm audit`.

## Oordeel

🟡 **Naar TST met aandachtspunten.** Geen kritieke bevindingen. De scheiding tussen clubs zit goed in de regels en de
app escapet gebruikersdata overal waar ik keek. Het grootste open punt blijft het bekende P0d (geen beheerdersrol).
Daarnaast: drie collecties zonder strikte veldcontrole in de regels, geen tests voor de koppeling gebruiker → club, en
geen beveiligingsheaders.

## Bevindingen

| # | Ernst | Type | Locatie | Probleem | Aanbeveling |
|---|---|---|---|---|---|
| H1 | Hoog (bekend, geaccepteerd) | Autorisatie | `firestore.rules:11-14`, `src/main.js:1212` | P0d: `isBeheerder` ontbreekt, dus elk lid mag alle masterdata schrijven en verwijderen. De regels controleren ook niet of een `bestuursfunctieId` bestaat. | Harde eis vóór een tweede bestuurder of persoonsgegevens (niet opnieuw onderzocht). |
| M1 | Middel | Invoervalidatie (regels) | `firestore.rules:192-197` (profiel), `:200-206` (bestuursfuncties), `:210-228` (structuurelementen) | Deze drie collecties hebben geen `hasOnly`/`hasAll`. Alleen `naam` (en bij het profiel `logo`) wordt gecontroleerd. Een lid kan via de API dus willekeurige extra velden schrijven, ook persoonsgegevens of grote blobs tot 1 MiB. Velden als `omschrijving`, `hashtag`, `icoon`, `volgorde` en `bestuursfunctieId` hebben geen type- of lengtecontrole. Bij structuurelementen mag `naam` leeg zijn. Bij het profiel hebben `naam`, `afkorting` en `seizoen` geen enkele grens, en `logo` heeft geen maximale lengte. Projecten, samenwerkingen, commissies en vermogens doen dit wel goed. | Zelfde aanpak als `geldigProject` (`:151-159`): per collectie `hasOnly` + `hasAll`, typen en lengtes (bijv. omschrijving ≤ 500, hashtag `^#[^\s#]{1,49}$` zoals `src/main.js:93`, `icoon` in de vaste lijst, `volgorde` int 1-100000, logo bijv. ≤ 200 000 tekens). Voeg tests toe die extra velden weigeren. |
| M2 | Middel | Ontbrekende tests (tenant) | `tests/regels.test.mjs:618-632`; regels `firestore.rules:172-186` | De regels voor de koppeling met de club zijn goed (`write: if false`), maar er is geen enkele test voor: zelf `gebruikers/{uid}` schrijven (clubId omzetten), zelf `clubs/X/leden/{uid}` aanmaken, `clubs/{clubId}` schrijven, en het `gebruikers`- of `leden`-document van een ander lezen. De test voor tenant-isolatie dekt alleen `vermogens`/`vermogensnamen`. Een regressie hier geeft direct toegang tot een andere club, en geen test zou dat opmerken. | Voeg één `describe` toe met `assertFails` voor: `setDoc(gebruikers/jan, {clubId:'club2'})`, `setDoc(clubs/club2/leden/jan, …)`, `setDoc(clubs/CLUB/leden/jan, {rol:'beheerder'})` (eigen rol ophogen), `updateDoc(clubs/CLUB, …)`, `getDoc(gebruikers/piet)`, `getDoc(clubs/CLUB/leden/piet)`. Doe hetzelfde voor club2 bij `instellingen`, `bestuursfuncties`, `structuurelementen`, `projecten`, `samenwerkingen` en `commissies` (lezen + schrijven). Test ook een niet-ingelogde gebruiker. |
| M3 | Middel | Headers / CSP | geen `vercel.json`; `index.html:1-13` | Er worden geen beveiligingsheaders gezet. Er is geen `Content-Security-Policy`, geen `frame-ancestors`/`X-Frame-Options` (clickjacking op Beheer-knoppen mogelijk), geen `X-Content-Type-Options`, geen `Referrer-Policy` en geen `Permissions-Policy`. CSP zou een tweede verdedigingslinie zijn als er ooit één `esc()` wordt vergeten. | Voeg `vercel.json` met `headers` toe. Start met: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`. Zet die eerst als `Content-Security-Policy-Report-Only` op Preview en controleer of inloggen en Firestore werken. Voeg `X-Content-Type-Options: nosniff` en `Referrer-Policy: strict-origin-when-cross-origin` toe. Het `style`-attribuut wordt gebruikt (`src/main.js:638`), daarom is `'unsafe-inline'` voor stijl nodig. |
| L1 | Laag | Terminal-injectie (scripts) | `scripts/opschonen-dubbelen.mjs:48`, `scripts/inrichten-domeinen-hca.mjs:73`, `scripts/inrichten-beheer-hca.mjs:70-71`, `scripts/migreer-club.mjs:110-111,120,201` | Deze oudere scripts tonen namen uit de database met een gewone `console.log`, zonder `veilig()`. Een naam met escape-tekens kan zo de terminaluitvoer opmaken of verbergen, bijvoorbeeld vlak vóór een "Typ ja"-vraag. De nieuwere scripts en `stop`/`waarschuw` doen het al goed (`scripts/lib/omgeving.mjs:35-44`). | Zet ook in deze regels de uitvoer door `veilig(...)`. Je kunt ook de scripts markeren als verouderd, zoals `migrate.mjs`. |
| L2 | Laag | Authenticatie (console-instellingen) | buiten de repo; `src/main.js:695-699` | Dit is niet te controleren vanuit de code. (a) Zelfregistratie (sign-up) staat bij e-mail/wachtwoord standaard aan, dus iedereen met de publieke config kan accounts aanmaken. Zonder `leden`-document krijgen die accounts geen data, maar het is onnodig. (b) De meldingen voor `auth/user-not-found` en `auth/wrong-password` verraden of een account bestaat als de bescherming tegen e-mailenumeratie uit staat. (c) API-key-beperkingen en App Check zijn onbekend. | Controleer in beide projecten: Authentication → Settings → "User actions": sign-up uit; "Email enumeration protection" aan; in de Google Cloud Console de API-key beperken tot de eigen domeinen en tot Identity Toolkit, Token Service en Firestore. Overweeg App Check. In de app kun je beide meldingen gelijk maken aan die van `invalid-credential`. |
| L3 | Laag | Afhankelijkheden | `package.json` | `npm audit --omit=dev` meldt 4× high, allemaal via `@grpc/grpc-js` (firebase → @firebase/firestore). Het gaat om adviezen aan de serverkant (getAuthContext, foutmeldingen van de server). Dit pakket draait alleen in Node, dus in de scripts, en niet in de browserbundel. De voorgestelde "fix" is een downgrade naar firebase 9.14 en is schadelijk. Volledige audit: 19 (14 moderate, 5 high), vooral in firebase-tools (alleen lokaal). | Geen `npm audit fix --force` draaien. Houd `firebase` en `firebase-tools` gewoon up-to-date en controleer de audit opnieuw bij elke release. |
| L4 | Laag | Logo (data-URL) | `firestore.rules:16-19`, `src/main.js:28-30, 3007, 1303` | `data:image/svg+xml` wordt geaccepteerd. Nu is dat veilig, want het logo komt alleen in `<img>` en de favicon, waar SVG geen script uitvoert. Gebruikt iemand het later in `<object>`, `<iframe>` of als HTML, dan wordt het een XSS-vector. | In de regels alleen `data:image/(png|jpeg|webp);base64,` toestaan. De app maakt toch altijd PNG (`src/main.js:63`). Combineer dit met de lengtegrens uit M1. |
| L5 | Laag | Sessie | `src/firebase.js:65` | Firebase Auth gebruikt standaard blijvende sessies (IndexedDB) zonder time-out bij inactiviteit. Op een gedeelde clubcomputer blijft de sessie dus open. | Accepteer dit nu bewust. Overweeg vóór persoonsgegevens `browserSessionPersistence` of een keuze "op deze computer onthouden". |
| L6 | Laag | Scripts / overgangsregels | `scripts/firestore.rules.migratie:7` | De overgangsregels geven één uid lees- en schrijftoegang tot de hele database. Er staat een placeholder in en het bestand is goed beschreven, maar bij hergebruik is het gevaarlijk. | Verplaats het naar een map `archief/` of verwijder het. De tekst staat in de git-geschiedenis. |

## Wat goed is

- **Scheiding tussen clubs**: `isLid(clubId)` kijkt naar `clubs/{clubId}/leden/{uid}`, en dat document kan alleen via console of admin worden aangemaakt (`firestore.rules:183-186`). Ook een vervalst `gebruikers/{uid}.clubId` zou niets opleveren, en dat document is bovendien schrijfdicht (`:172-175`). Alles wat niet genoemd is, is dicht (`setDoc(onbekend)` wordt getest).
- **Strikte regels** voor vermogens, vermogensnamen, projecten, samenwerkingen en commissies: `hasOnly`/`hasAll`, typen, lengtes, regex voor namen en datums, een tellerprotocol met `get`/`getAfter`, en aanvalstests (traversal, kaping van naamdocumenten, dubbele tellerstap).
- **XSS**: alle gebruikersdata in `innerHTML` gaat door `esc()` (`src/main.js:75-77`; escapet `& < > " '`), ook in attributen (`value`, `aria-label`, `data-id`, `id`). Document-ID's gaan door `esc()` en in selectors door `CSS.escape`. `icoon` wordt eerst tegen een vaste lijst gecontroleerd (`:123-127`), het logo alleen als `data:image/` (`:28`). Foutmeldingen en dynamische meldingen gebruiken `textContent`/`replaceChildren`. Geen `eval`, `new Function` of `document.write`.
- **CSRF**: niet van toepassing, want Firebase gebruikt bearer-tokens en geen cookies.
- **Geheimen**: geen service-account, private key of `.env` in git of in de geschiedenis. Alleen het lege `.env.test.local.voorbeeld` is getrackt, en een bewaker in de scripts stopt als het toch ingevuld is (`scripts/lib/omgeving.mjs:121-129`). In de bundel zit alleen de publieke Firebase-webconfig, zoals bedoeld. `.env.productie.local` heeft rechten 600.
- **Scripts**: ze loggen in met de client-SDK en een eigen account, dus zonder admin-rechten en binnen de regels. Het wachtwoord wordt verborgen ingelezen. De standaard is TEST. Voor productie moet je de projectnaam intypen, en er zijn controles of het project echt test of productie is (`scripts/lib/omgeving.mjs:64-108, 223-253`). Het seed-script draait alleen tegen test. Regels publiceren gaat via `.firebaserc`-aliassen met een productiebevestiging. Uitvoer gaat in `stop`/`waarschuw` en in de nieuwe scripts door `veilig()`.
- **Account**: wachtwoord en e-mail wijzigen alleen na opnieuw inloggen, e-mail via `verifyBeforeUpdateEmail`, nieuw wachtwoord minimaal 8 tekens.
- **Omgevingen**: een build stopt bij een gemengde configuratie of bij test met de productieconfig (`src/firebase.js:53-58`, `vite.config.js:24-27`).

## Samenvatting

- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 1 (P0d, bekend en geaccepteerd)
- Middel: 3 (M1 veldvalidatie in 3 collecties, M2 tests voor de koppeling met de club, M3 headers/CSP)
- 🟢 Lage aanbevelingen: 6

## Voorstel: wat eerst

1. **M2 tests voor de koppeling met de club**: klein en goedkoop, en het beschermt de belangrijkste regel tegen regressie. Doe dit vóór het P0d-werk, want P0d raakt precies `leden`.
2. **P0d (`isBeheerder`)**: vóór een tweede bestuurder of persoonsgegevens, zoals afgesproken.
3. **M1 veldvalidatie**: profiel, bestuursfuncties en structuurelementen strak maken zoals bij projecten. Neem L4 mee (alleen PNG/JPEG/WebP en een lengtegrens voor het logo).
4. **M3 `vercel.json` met headers**: eerst als Report-Only op Preview.
5. **L2 console-instellingen** (sign-up uit, bescherming tegen e-mailenumeratie, API-key-beperking) in test en productie. Daarna L1, L5 en L6 als er tijd is.

## Eindoordeel

🟡 Naar TST met aandachtspunten. Vóór PRD met persoonsgegevens of een tweede bestuurder: P0d, M1 en M2 oplossen.
