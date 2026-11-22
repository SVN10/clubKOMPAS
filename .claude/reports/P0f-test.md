# Testrapport: P0f — Eigen adressen voor live en online test

Getest: ongecommitte wijzigingen in `src/firebase.js`, `src/main.js`, `vite.config.js`, `.env.test.local.voorbeeld`, `README.md`, `CHANGELOG.md` tegen `P0f-adressen.md` en `P0f-ontwerp.md`.
Niet gedaan: inloggen, Firestore, wijzigen van `.env.*.local`, committen. `npm run build` in de repo slaagt.

## Methode
Per geval een lib-build van `src/firebase.js` (Firebase-modules gestubd, `envDir` leeg, geen echte sleutels) buiten de repo, gestart met `env -i` en nep-waarden voor `VERCEL_ENV`, `VITE_OMGEVING` en de zes `VITE_FIREBASE_*`. Daarna is `SOORT`, `OMGEVING_LABEL`, `configFout` en het aantal `console.warn` uitgelezen. DEV-gevallen: `import.meta.env.DEV` op `true` gezet, met een nep `.env.test.local` in de scratchmap. De weergave (balk, tabtitel, foutpagina, M16) is niet in een browser gerenderd; die is beoordeeld in de diff van `src/main.js` (de bouwer meldt jsdom-controles).
Scratch: `/private/tmp/claude-501/-Users-palbregt-Projects-SVN10-clubKOMPAS/15b2fb78-56e4-412e-9c18-640281a8d66f/scratchpad/h/`

## Acceptatiecriteria
| Criterium | Status | Opmerking |
|---|---|---|
| `clubkompas.svn10.nl` live, geen balk, footer Productie, inloggen HCA | Niet testbaar | Vercel/DNS/Firebase, handmatig. Codekant geslaagd: project productie en Production geeft altijd SOORT `productie` (geen balk, label `Productie`). |
| `tst.` volgt branch `test`, testproject, balk "Testomgeving", footer "Test" | Niet testbaar (code geslaagd) | Preview + label Test + testwaarden geeft SOORT `test`, label `Test` (geval P5). Balktekst en tabtitel kloppen met Scherm 1 in `main.js` (`OMGEVINGS_BALK`). |
| `npm run dev`: balk "Ontwikkelomgeving", footer "Ontwikkel", ongeacht `VITE_OMGEVING` | Geslaagd | D1b (label Test), D1c (geen label), D1d (`VERCEL_ENV=production` gelekt): altijd `ontwikkel`, geen configFout. |
| Niet-productiebuild met testlabel + productieproject stopt; Production start altijd | Geslaagd | Zie matrix. Preview/lokaal: `test-met-productie`. Production: nooit een stop behalve `geen-config`. |
| Vercel-variabelen gescheiden | Niet testbaar | Handmatig (stap 3 README). |
| Authorized domains | Niet testbaar | Handmatig. |
| `dev.` 307-doorsturing, opheffingsdatum in backlog | Niet testbaar | Handmatig. Backlog is nog niet bijgewerkt (bewust, zie bouwverslag). |

## Controles uit het ontwerp (7)
| # | Controle | Status | Resultaat |
|---|---|---|---|
| 1 | Preview + Test + productiewaarden | Geslaagd | `configFout=test-met-productie`, `VERCEL_ENV=preview`; code kiest de online tekst (`VERCEL_ENV` gevuld) met link naar clubkompas.svn10.nl. |
| 2 | Production + Test + productiewaarden | Geslaagd | SOORT `productie`, geen configFout, 1 warn. Geen balk (`OMGEVINGS_BALK.productie` bestaat niet). |
| 3 | Production zonder label + productiewaarden | Geslaagd | SOORT `productie`, geen configFout, 1 warn. |
| 4 | Preview + Test + testwaarden | Geslaagd | SOORT `test`, label `Test`, geen configFout, geen warn. |
| 5 | Preview + testwaarden zonder APP_ID | Geslaagd | `gemengde-config` (online variant). |
| 6 | dev met `VITE_OMGEVING=Test` | Geslaagd | SOORT `ontwikkel`, label `Ontwikkel`. |
| 7 | dev:productie (mode productie) | Geslaagd | SOORT `productie-lokaal`, label `Productie (lokaal)`, geen configFout. Oranje balk ongewijzigd. |

## Live breekt nooit (VERCEL_ENV=production)
| Geval | SOORT | configFout | Warn | Status |
|---|---|---|---|---|
| prod-project, label Productie | productie | geen | 0 | ✅ |
| prod-project, label Test | productie | geen | 1 | ✅ |
| prod-project, label Ontwikkel | productie | geen | 1 | ✅ |
| prod-project, label ontbreekt of leeg | productie | geen | 1 | ✅ |
| prod-project, label onzin (`xyz`) | productie | geen | 1 | ✅ |
| prod-project, lege APP_ID (label Productie of Test) | productie | geen | 0/1 | ✅ |
| prod-project, lege API_KEY, geen label | productie | geen | 1 | ✅ |
| prod-project met authDomain van test (gemengd), label Productie/Test | productie | geen | 0/1 | ✅ |
| testproject, label Productie/Test/Ontwikkel | test/test/ontwikkel | geen | 1/0/0 | ✅ (balk zichtbaar, zoals spec) |
| geen PROJECT_ID | – | `geen-config` | 0 | ✅ (ongewijzigd) |

Nergens een balk bij productieproject op Production; `toonOmgevingsBalk` heeft voor `productie` geen variant en keert terug.

## Preview en lokaal
| Geval | Resultaat | Status |
|---|---|---|
| preview, Test + productiewaarden | `test-met-productie` | ✅ |
| preview, Ontwikkel + productiewaarden | `test-met-productie` | ✅ |
| preview, Test + gemengd (prod-ID, test-authDomain) | `test-met-productie` | ✅ |
| preview, Test + productiewaarden met lege APP_ID | `test-met-productie` (voor gemengd) | ✅ |
| `VERCEL_ENV=development` of leeg (lokale build), Test + productiewaarden | `test-met-productie`, lokale tekstvariant bij leeg | ✅ |
| preview, Productie + productiewaarden | start, SOORT `productie` (label zelf zegt productie) | ✅ conform spec |
| preview, geen label + productiewaarden | start, SOORT `productie`, 1 warn | ⚠️ conform spec, zie opmerking |
| preview, geen label of label Productie + testwaarden | SOORT `test`, balk, warn | ✅ |
| preview, Ontwikkel + testwaarden | SOORT `ontwikkel` | ✅ |
| preview, Test + testwaarden, lege APP_ID | `gemengde-config` | ✅ |
| dev, label Test + productiewaarden | `productie-lokaal` stop | ✅ |
| dev, lege APP_ID in `.env.test.local` | `gemengde-config` | ✅ |
| dev:productie met testproject (afwijkend) | `productie-lokaal` SOORT, geen stop (zoals P0e) | ✅ |

## Regressiecheck
- ✅ `npm run build` slaagt.
- ✅ P0e-stops (`productie-lokaal`, lokale `gemengde-config`, `__MODUS_SLEUTELS__`) hangen nog aan `DEV` en werken (D2, D5b).
- ✅ `scripts/`, `package.json`, `.env.test.local`, `.env.productie.local` ongewijzigd (git status).
- ✅ `.env.test.local.voorbeeld`: alleen de VITE_OMGEVING-regel plus commentaar; geen waarden ingevuld.
- ✅ Project-ID's worden met `===` vergeleken.
- ✅ Footer `toonProject = SOORT !== 'productie'`; label uit SOORT.
- ✅ M5, M6 en toonOmgevingsBalk hergebruiken bestaande klassen; geen CSS gewijzigd.
- Niet te testen zonder browser: M16-weergave, footer na inloggen, balkafbreking 400–680px (handmatig, zoals bouwverslag).

## Bevindingen
Geen blokkerende fouten. Aandachtspunten (geen terugstuur-reden):
1. Preview zonder `VITE_OMGEVING` met productiewaarden start zonder balk als productie (alleen een `console.warn`). Dit volgt het ontwerp (regel 5) en is bewust; het slot werkt pas met label Test/Ontwikkel. README-stap 3 (variabelen eerst scheiden) en de tabel "Als `tst.` niet klopt" dekken dit. Wel de reden dat Paul de variabelen vóór het pushen van `test` moet zetten.
2. Production met testproject en label Productie/Test toont een balk "Testomgeving" boven live. Dat is bedoeld (spec §2.3), niet geblokkeerd.
3. `.claude/docs/P0e-technisch.md` en de backlog zijn nog niet bijgewerkt (spec §2.5 vraagt dit); CHANGELOG vermeldt het achterhaalde stuk. Documentatiepunt voor de hoofdsessie.
4. De bouwer vulde zelf de tekst voor `gemengde-config` (lokale build) in; die is consistent met het ontwerp.

## Eindoordeel
✅ Klaar voor beoordelaar (code-acceptatie geslaagd; Vercel-, DNS-, Firebase- en doorsturingscriteria zijn handmatige stappen voor Paul).
