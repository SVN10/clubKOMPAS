# Testrapport: P0e — Aparte testomgeving

Getest op de ongecommitte werkboom (22 november 2026). Niet ingelogd, niets naar Firestore geschreven, `.env` en `.env.productie.local` niet gewijzigd, niets gecommit.

## Acceptatiecriteria
| Criterium | Status | Opmerking |
|-----------|--------|-----------|
| `npm run dev` start tegen test, footer "Test · Versie …", testclub met 15 domeinen en 6 functies | Niet te testen (code ok) | Geen testproject/.env.test.local aanwezig. Code: `dev` = `vite --mode test` (package.json); footer toont `OMGEVING_LABEL` (main.js); seed bevat 6 functies en 15 domeinen (10 domein, 3 pijler, 2 overkoepelend) correct. Handmatig te controleren nadat Paul het project heeft ingericht. |
| Elk script gaat zonder `--omgeving` naar test en toont vóór het inloggen een kopregel | Geslaagd (deels runtime) | `kiesOmgeving` geeft `test` zonder argument (getest). Alle 6 scripts + seed roepen `startScript()` aan vóór `initializeApp`/vraag. Zonder `.env.test.local` stoppen ze met M3 (getest voor alle zes + seed). Kopregel-uitvoer voor TEST bevestigd via het bouwverslag en code (`kopregel` in startScript vóór enige vraag); echte TEST-kopregel niet zelf gezien omdat het testbestand ontbreekt. `migrate.mjs` weigert altijd (bewust, afwijking 3). |
| `--omgeving=productie` schrijft pas na intypen van `svn10-clubkompas`; ander antwoord breekt af; seed weigert productie altijd | Geslaagd | Getest met antwoord "nee" op alle 6 scripts + `regels.mjs`: kopregel PRODUCTIE, prompt, `AFGEBROKEN`, "Er is niets geschreven/gepubliceerd.", exit 1, geen login. Seed + productie: direct GESTOPT (ook vóór de env-lezing, dus ook met `--droog`). Onbekende waarde (`prod`, `Prod`, leeg) stopt; `--omgeving=TEST` wordt genormaliseerd. Bij dubbele `--omgeving` telt de eerste (veilig voor als eerste test is; bij eerste=productie volgt de bevestiging). `import-hca` en `opschonen-dubbelen` stoppen bij `--droog` zodat de bevestiging niet omzeild kan worden. De juiste-antwoord-route (daarna inloggen) niet uitgevoerd (zou om wachtwoord vragen). |
| Lokale app wijst naar `svn10-clubkompas` (dev, niet mode productie) → Firebase initialiseert niet + duidelijke melding (M2) | Geslaagd (code) | `firebase.js`: `configFout='productie-lokaal'` bij DEV && projectId===PRODUCTIE && MODE!=='productie'; dan `app=null`, `auth=db=null`. Scenario's: `vite` (development) met oud `.env`, `vite --mode test` met ontbrekend testbestand en `.env` aanwezig (valt terug op .env → M2), `vite --mode test` met productiewaarden in `.env.test.local` → M2. Alle drie leiden tot M2. Melding zelf niet in browser bekeken (geen browser). |
| `npm run regels:test` publiceert naar test zonder productie te raken; README beschrijft test → controleren → productie | Geslaagd (code) / niet uitgevoerd | `regels.mjs` roept `firebase deploy --only firestore:rules --project test` aan; `.firebaserc` heeft geen `default`; consistentiecheck test≠productie-ID; productie vraagt projectnaam (getest). `firebase.json` bevat alleen firestore. Deploy zelf niet uitgevoerd (zou inloggen vereisen). README volgorde aanwezig. |
| Live app (Vercel, mode production) ongewijzigd | Geslaagd (code + build) | Productiebuild: `DEV` is false → `configFout` kan alleen `geen-config` zijn (niet bij gevulde env). `SOORT='productie'` bij `VITE_OMGEVING=Productie`: geen balk (`toonOmgevingsBalk` retourneert), geen tabtitel-voorvoegsel, footerlabel "Productie · Versie …", tooltip ongewijzigd, geen M5/M6. Enige zichtbare verschillen live: `role="alert"` op foutvak (onzichtbaar) en nieuwe CSS-klassen die alleen bij balk/fouten worden gebruikt. `npm run build` slaagt; nep-env builds (production, test, test met productie-ID) in scratch slagen. In de browser niet bekeken. |

## Regressiecheck
- ✅ `node --check` op alle 9 `.mjs`-bestanden.
- ✅ `npm run build` slaagt (alleen bestaande chunkgrootte-waarschuwing).
- ✅ `firestore.rules`: alleen kopcommentaar gewijzigd (git diff).
- ✅ Alle top-level `auth`/`db`-gebruik in `main.js`: `onAuthStateChanged` staat nu in de `else` van `if (configFout)`; overige gebruik zit in functies die alleen na een ingelogde sessie draaien. Geen aanraking van `auth`/`db` bij configFout gevonden.
- ✅ `--droog`, "ja"-bevestiging en verborgen wachtwoordinvoer zijn in de code behouden (`vraag(..., true)`, `Typ "ja"`).
- ✅ `.env.productie.local` en `.env.test.local` vallen onder `.gitignore` (`.env.*.local`); `.env` ook. `.env.test.local.voorbeeld` is wel commitbaar en bevat lege waarden.
- ✅ `.env` onaangeroerd aanwezig (bewuste afwijking van spec; Paul verwijdert hem in README-stap 9). Scripts waarschuwen (M8).
- Niet getest: inloggen, echte Firestore-lees/schrijfacties, M11–M15 in de praktijk, schermen in browser.

## Randgevallen
| Geval | Status | Detail |
|-------|--------|--------|
| Achtergebleven `.env` | ✅ | App: M2; scripts: M8 waarschuwing en gebruiken `.env` niet. |
| `.env.test.local` met productie-ID (scripts) | ✅ | "je koos TEST, maar … wijst naar het productieproject" (getest met nep-env). |
| `.env.productie.local` met ander ID | ✅ | Stopt (getest). |
| Env zonder `VITE_FIREBASE_PROJECT_ID` / bestand ontbreekt | ✅ | Beide stoppen met uitleg (getest). |
| Project-ID leeg in app | ✅ (code) | `configFout='geen-config'` → M1; build zonder bestandsnamen buiten DEV. |
| Regels naar verkeerd project | ✅ | Geen `default` in `.firebaserc`; `--project` altijd expliciet; ID-controle. |
| Seed idempotent (op naam, merge, niets verwijderd) | ✅ (code) | Bestaande items hergebruikt via naam, `batch.set(..., {merge:true})`; onbekende items alleen gemeld. Niet gedraaid. |
| Seed schrijft geen clubs/leden/gebruikers | ✅ | Alleen `instellingen/profiel`, `bestuursfuncties`, `structuurelementen`. |
| HTML-injectie in meldingen/hint | ✅ | `esc()` voor projectId/uid; M5-hint via createElement/append. |

## Bevindingen voor de bouwer
Geen blokkerende fouten. Kleine opmerkingen (niet verplicht):
1. `scripts/lib/omgeving.mjs` `kiesOmgeving`: bij twee `--omgeving=`-argumenten wint de eerste zonder melding. Veilig, maar een duidelijke stop bij dubbele opgave zou verwarring voorkomen.
2. Uitlijning volgregels na `AFGEBROKEN` (10 tekens) springt 1 teken te weinig in (al genoemd in afwijking 6).
3. Productie-pad na het juiste antwoord, de kopregel TEST en M11–M15 zijn niet end-to-end verifieerbaar zonder inloggen; dit is een handmatige controle voor Paul.

## Handmatig te controleren (Paul, na inrichten testproject)
- Browser: M2 (nu, met `.env`), M1, balk/footer bij Test en `dev:productie`, M5, M6, donkere modus, smal scherm.
- `npm run dev` met `.env.test.local` gevuld: 15 domeinen, 6 functies, footer "Test".
- Seed `--droog` en echt; `npm run regels:test`.
- Na merge op Vercel: geen balk, footer "Productie · Versie …", tabtitel "clubKOMPAS"; Vercel Preview-variabelen noteren.

## Eindoordeel
✅ Klaar voor beoordelaar
