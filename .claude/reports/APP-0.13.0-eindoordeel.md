# Eindoordeel: app-brede kwaliteitsanalyse clubKOMPAS v0.13.0

Datum: 24 november 2026 · Branch: `test` (gelijk aan `main`) · Opzet: zuinig, met twee agents.
- Beveiliging, op het sterkste model: `APP-0.13.0-beveiliging.md`.
- Test, huisstijl, toegankelijkheid en AVG samen, op Sonnet: `APP-0.13.0-analyse.md`.

## Eindoordeel

**v0.13.0 is duidelijk beter dan v0.12.1 en is goed voor het huidige gebruik: één of meer bestuurders en alleen organisatiegegevens.** Er zijn geen kritieke en geen hoge bevindingen. Alle hoge en middelzware punten van v0.12.1 zijn in de code opgelost. Daarnaast:
- 130 van de 130 regeltests slagen en de build slaagt;
- er staan geen geheimen in de repo, de git-geschiedenis of de bundel;
- bij alle 45 `innerHTML`-plekken wordt gebruikersdata geëscaped;
- P0d sluit goed: je eigen rol ophogen en schrijven in een andere club kan niet, en de app-guards komen overeen met de regels.

**De poort vóór ledengegevens staat nog dicht.** Die is nu vooral werk zonder code voor Paul: CK-049 (AVG-basis) en een procedure voor het toekennen en intrekken van de rol `beheerder`.

| Onderdeel | Oordeel | Kritiek | Hoog | Middel | Laag |
|---|---|---|---|---|---|
| Beveiliging | ✅ geen blokkade voor productie | 0 | 0 | 0 | 9 |
| Test | ✅ | 0 | 0 | 1 | 7 |
| Huisstijl | ✅ kleine afwijkingen | 0 | 0 | 0 | 6 |
| Toegankelijkheid (WCAG 2.1 AA) | ✅ geen AA-blokkade gevonden | 0 | 0 | 0 | 6 |
| AVG | 🟡 niet klaar voor ledendata | 0 | 0 | 2 | 3 |

Vergelijking met v0.12.1: toen waren er 0 kritiek, 17 hoog en 34 middel. Nu zijn er 0 hoog en 3 middel.

**Wat de hoofdsessie zelf heeft nagekeken:** T-1 (teksten "via Beheer" voor een lid: `main.js:724`, `:1242`, `:1248`), T-2 (`bindHerlaad` met `null` na wegnavigeren), A-1 (de uitlogmelding wordt meteen bij het tekenen in de live-region gezet), A-2 (`volgAttributen(veld, knop)` zet `aria-describedby` terug) en HS-1 (drie knoppen in Mijn account met `class="btn"`). Al deze bevindingen kloppen.

**Niet gecontroleerd:** de app in een browser of met een schermlezer, de instellingen in de Firebase- en Vercel-console, en de echte data.

## Middel (3)

| Nr | Bevinding | Bestand:regel |
|---|---|---|
| T-1 | Teksten sturen een lid naar Beheer, terwijl een lid sinds P0d geen Beheer heeft | `src/main.js:724`, `:1242`, `:1248` |
| C-1 | CK-049 staat volledig open: geen privacyverklaring of link in de app, geen register, geen verwerkersovereenkomst, geen procedures en geen back-up | – |
| C-2 | Er is geen procedure voor het toekennen en intrekken van de rol `beheerder`. Dat gaat nu alleen via de console of een script (nieuw door P0d) | – |

## Laag (belangrijkste)

- **Code, klein:**
  - T-2: TypeError na wegnavigeren tijdens het laden.
  - T-3: focus kwijt na "Opnieuw laden" voor een lid.
  - A-1: de uitlogmelding wordt mogelijk niet voorgelezen.
  - A-2: de datumknop erft `aria-describedby`.
  - HS-1: Opslaan in Mijn account is niet primair.
  - HS-4: `--paneel-top` wordt nog inline gezet.
  - T-5: `bevestigVerwijderen` wordt op 3 plekken nog niet gebruikt.
- **Regels en tests:**
  - L1: de test "beheerder van een andere club" voor alle collecties.
  - L2: een vaste lijst voor `icoon` en geen stuur- of bidi-tekens in namen.
  - L3: `bevat` alleen op een overkoepelend domein.
- **Headers:** L4: `Permissions-Policy` en HSTS toevoegen; `frame-src` en `firebaseio` alleen weghalen na een test.
- **Scripts:**
  - L8: oude regelbestanden (`migratie`, `voor-P0c`, `voor-P0d`) archiveren.
  - L9: drie regels in `migreer-club.mjs` via `veilig()`.
- **Console (Paul):** L6: zelfregistratie uit, bescherming tegen e-mailenumeratie aan en de API-key beperken. Daarna kan de aparte melding voor `auth/user-not-found` weg (C-4).
- **AVG, laag:**
  - C-3: een hulptekst "geen namen of contactgegevens" bij omschrijvingen.
  - C-5: de localStorage-sleutel `clubkompas-laatst-actief` in het register opnemen.
- **Later, bij het opsplitsen van `main.js`:** de bundel (712 kB), HS-2/3/5/6, A-3 t/m A-6, T-6 en T-7.

## Voorstel: wat eerst

1. **Fixpakket v0.13.1 (route klein of middel, één sessie).** Het gaat om T-1, T-2, T-3, A-1, A-2, HS-1, HS-4 en T-5, plus de regelpunten L1, L2a, L2b en L3 met tests. Daarbij komen L4b/c (headers), L8 en L9. Omdat de regels veranderen, moet `npm run regels:test` en daarna `regels:productie` worden gedraaid door Paul.
2. **Paul, zonder code:**
   - CK-049;
   - een procedure voor de rol `beheerder` (C-2);
   - de console-instellingen (L6).
3. **Later:** het opsplitsen van `main.js`, samen met de lage restpunten.

Backlog: CK-056 (fixpakket v0.13.1). CK-049 wordt uitgebreid met C-2, C-3 en C-5.
