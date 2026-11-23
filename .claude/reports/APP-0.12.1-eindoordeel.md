# Eindoordeel: app-brede kwaliteitsanalyse clubKOMPAS v0.12.1

Datum: 23 november 2026 · Branch: `test` · Scope: `src/`, `firestore.rules`, `scripts/`, `tests/regels.test.mjs`

## Eindoordeel

**De app is goed genoeg voor het huidige gebruik: één bestuurder en alleen organisatiegegevens.** Er is geen kritieke bevinding voor wat de app nu doet. De code volgt de specs van alle features (P0c tot en met CK-041). De scheiding tussen clubs klopt. Er staan geen geheimen in de repo of de bundel. 100 van de 100 regeltests slagen en de build slaagt.

**Er is wel een harde poort vóór persoonsgegevens of een tweede bestuurder.** Naast P0d (bekend) ontbreken nog een privacyverklaring, een verwerkingsregister, verwerkersovereenkomsten en procedures voor inzage, verwijdering, back-up en datalekken.

Er zijn een paar snelle winsten, vooral bij toegankelijkheid (het contrast van de invoervelden, foutmeldingen bij het inloggen) en bij de foutafhandeling (een lege pagina bij een laadfout).

| Check | Oordeel | Kritiek | Hoog | Middel | Laag | Rapport |
|---|---|---|---|---|---|---|
| Test (code doet wat de specs zeggen) | ✅ met aandachtspunten | 0 | 1 | 5 | 14 | `APP-0.12.1-test.md` |
| Huisstijl | 🟡 gedeeltelijk | 0 | 8* | 13 | 15 | `APP-0.12.1-huisstijl.md` |
| Beveiliging | ✅ voor huidig gebruik | 0 | 1 (P0d) | 3 | 6 | `APP-0.12.1-beveiliging.md` |
| Compliance (AVG) | 🟡 nu acceptabel, niet klaar voor ledendata | 2** | 4 | 5+1 | 6+1 | `APP-0.12.1-compliance.md` |
| Toegankelijkheid (WCAG 2.1 AA) | 🟡 kleine tekortkomingen | 0 | 3 | 7 | 9 | `APP-0.12.1-toegankelijkheid.md` |

\* Bij huisstijl botsen drie "hoge" punten met het bewuste, vierkante ontwerp. Het gaat om de afronding en schaduw van kaarten en de rand van knoppen. Die zijn hieronder als **besluit voor Paul** opgenomen en niet als fout.
\** Bij compliance zijn de twee kritieke punten (P0d en het ontbreken van een privacyverklaring en register) alleen blokkerend **vóór ledengegevens**. Voor de huidige stand zijn ze hoog.
De hoofdsessie vond zelf nog één middel punt (Google Fonts) en één laag punt (e-mail in `leden/{uid}`). Die staan als aanvulling in het compliance-rapport.

**Wat de hoofdsessie zelf heeft nagekeken:** de laadfout zonder `try` (`main.js:1558`, `:2813`), de verkeerde hint (`main.js:1491`), `Fout: ${e.code}` (`main.js:707`), de rand-token `#C9D7D7` (`style.css:9`), de ontbrekende `hasOnly` in de regels (`firestore.rules:192-228`), het ontbreken van `vercel.json` en de Google Fonts-import (`style.css:1`). Al deze bevindingen kloppen.

**Niet gecontroleerd:** de app in een browser, met een schermlezer of in een echte Firestore. De instellingen in de Firebase- en Vercel-console staan niet in de repo.

## Poort vóór persoonsgegevens of een tweede bestuurder

Deze punten zijn nu geen fout, maar ze moeten allemaal klaar zijn voordat er ledengegevens in de app komen of een tweede bestuurder toegang krijgt:

1. **P0d**: `isBeheerder` in de regels (bekend en geaccepteerd), `firestore.rules:192-274`.
2. **Privacyverklaring** met een link in de app (`index.html` en de footer hebben die niet), plus een **verwerkingsregister**.
3. **Verwerkersovereenkomst** met HCA, en Google en Vercel als subverwerkers. Vercel Hobby heeft geen DPA.
4. **Procedure voor inzage, export en verwijdering** van een account. Die is er nu niet (`main.js:3169-3242`).
5. **Back-up** van Firestore en een **datalekprocedure**.
6. **Veldcontrole in de regels** (`hasOnly`) op `instellingen`, `bestuursfuncties` en `structuurelementen`. Zonder die controle kan iemand via de API ongemerkt persoonsgegevens in een vrij veld zetten.

## Bevindingen per ernst

### Kritiek
Geen voor het huidige gebruik. Zie de poort hierboven.

### Hoog

| # | Bevinding | Bestand:regel | Bron |
|---|---|---|---|
| H1 | Een laadfout op Domeinen en Bestuursfuncties geeft een lege pagina met knoppen die niets doen en geen melding. Vermogens en Projecten, Samenwerkingen en Commissies doen het wel goed | `src/main.js:1431`, `:1558`, `:2813` | test |
| H2 | De rand van invoervelden heeft een contrast van 1,48:1 (licht) en 1,44:1 (donker). Nodig is 3:1 (WCAG 1.4.11) | `src/style.css:9` (`--border`), `:294` | toeg. |
| H3 | Op het inlogscherm wordt een fout niet aan de schermlezer gemeld. Er is geen `aria-invalid`/`aria-describedby`, geen live-region en geen focus. `zetVeldFout` bestaat al | `src/main.js:667-690` | toeg. |
| H4 | In de datumkiezer raakt de focus kwijt bij een dag buiten min/max: `.focus()` op een `disabled` knop werkt niet. Escape werkt daarna niet meer | `src/keuzelijst.js:183`, `:226-232` | toeg. |
| H5 | Een verkeerde hint: "De volgorde wijzig je bij Toon: Alle soorten". "Toon" bestaat niet meer | `src/main.js:1491` | huisstijl |
| H6 | P0d (bekend): elk lid mag alle masterdata schrijven | `firestore.rules` | beveiliging |

### Middel

| # | Bevinding | Bestand:regel | Bron |
|---|---|---|---|
| M1 | Er is geen veldcontrole (`hasOnly`, typen, lengtes) op profiel, bestuursfuncties en structuurelementen. Het logo heeft geen lengtegrens en de naam van een domein mag leeg zijn | `firestore.rules:192-228` | beveiliging, test |
| M2 | Er zijn geen tests voor de P0c-regels (`gebruikers`, `leden`, de rol ophogen, `clubs/{id}`) en voor de omgevingsguard in `src/firebase.js` | `tests/regels.test.mjs:618-632` | beveiliging, test |
| M3 | Er zijn geen beveiligingsheaders (CSP, `frame-ancestors`, `nosniff`), want `vercel.json` ontbreekt | – | beveiliging |
| M4 | Google Fonts wordt extern geladen, dus het IP-adres van elke bezoeker gaat naar Google. Self-hosten lost dat op. Het gewicht 500 wordt bovendien niet geladen, maar wel gebruikt | `src/style.css:1`, `:146`, `:171` | compliance, huisstijl |
| M5 | Firebase Auth heeft geen EU-regio, terwijl Firestore in eur3 staat. Leg dit vast in het register | – | compliance |
| M6 | Het Domeinenoverzicht blijft leeg zonder melding bij een fout | `src/main.js:593`, `:988` | test |
| M7 | De domeinnaam heeft in de app geen maximum, maar in de regels wel (200). Een te lange naam geeft dus een misleidende melding "geen toestemming" | `src/main.js:1647` | test |
| M8 | Het inlogscherm toont `Fout: <code>`, terwijl het CK-023-criterium "geen technische codes" zegt | `src/main.js:707` | test |
| M9 | Er zijn geen region-landmarks (`.sectie` is een `<div>`) en beheerpagina's hebben geen `h1`. Dit was al bekend en staat nog open | `src/main.js:974`, `:1436`, `:1861`, `:2331`, `:2723`, `:2973`, `:3104` | toeg., huisstijl |
| M10 | `.toel` (wit met opacity .85 op petrol) haalt 4,05:1, terwijl 4,5:1 nodig is | `src/style.css:152` | toeg. |
| M11 | De eigen keuzelijst en de datumkiezer krijgen geen foutrand (`fout`) | `src/keuzelijst.js:50-58` | toeg. |
| M12 | Bij een smalle tabel verdwijnen de kolomkoppen ook voor de schermlezer. De bewerkrij van Domeinen mist `role="cell"` | `src/style.css:1063-1130`, `src/main.js:1727` | toeg. |
| M13 | De vier beheertabellen verschillen onderling: teksten voor verwijderen (`confirm()`), lege toestand en validatie, Enter-gedrag, labels van de pijlknoppen, en invoerveld tegenover tekstvak voor de omschrijving. Het logo verwijderen heeft geen bevestiging | `src/main.js:1470`, `:1536`, `:1705`, `:2195`, `:2412`, `:2445`, `:2659`, `:2907`, `:3056` | huisstijl, test |
| M14 | `.cel-nr` is vet, tegen besluit 21. Eindverantwoordelijke (14 px) en Eigenaar (16 px) verschillen van grootte | `src/style.css:564`, `:567`; `src/main.js:2451` | huisstijl |
| M15 | Kleuren staan inline in `style=` via `SOORT_KLEUR`, niet via klassen of tokens | `src/main.js:87`, `:638`, `:1547` | huisstijl |
| M16 | Bij 320 px en 400 % zoom laat de vaste paginahoogte weinig ruimte over | `src/style.css:781` | toeg. |

### Laag (samengevat; details in de rapporten)

- Oudere scripts tonen namen zonder `veilig()`: `scripts/opschonen-dubbelen.mjs:48`, `inrichten-domeinen-hca.mjs:73`, `inrichten-beheer-hca.mjs:70-71` en `migreer-club.mjs:110-120`.
- `scripts/firestore.rules.migratie` geeft één uid toegang tot de hele database. Verwijder het bestand of zet er een waarschuwing in.
- `npm audit` geeft 4× high via grpc-js, alleen in Node en de scripts. Draai **niet** `npm audit fix --force`, want dat zet firebase terug naar 9.14.
- Het logo mag SVG zijn (`firestore.rules:18`). Sessies blijven onbeperkt open.
- Nakijken in de console: zelfregistratie uit, bescherming tegen e-mailenumeratie aan, API-key beperkt (`src/main.js:695-699`).
- Dode code: `src/counter.js`, `src/assets/*`, `public/icons.svg`, een ongebruikte import (`main.js:13`) en `huidigeRol`/`laadRol`, die bij elke login een overbodige read doen. Verder dode en dubbele CSS (`style.css:485-506`, `:577-594`, `:828`, `.zijmenu-binnen`).
- Een hardgecodeerde hex-kleur in de omgevingsbalk (`style.css:858-860`), alleen op tst.
- De bundel is 659 kB (waarschuwing > 500 kB). Dit sluit aan op "main.js opsplitsen" in `pipeline.md`.
- `scripts/migreer-club.mjs:166` zet het e-mailadres van de beheerder in `leden/{uid}`. Neem dit op in het register.
- Bewaartermijnen staan nergens. De omschrijving is vrije tekst (max 500).

## Besluiten voor Paul (huisstijl)

1. **Kaarten en knoppen:** blijft het bewust vierkant (0–6 px, geen schaduw, lichte rand), of gaat het naar de algemene regel (12 px, schaduw, petrol rand)? Voorstel: vierkant houden en de huisstijlregel daarop aanpassen.
2. **Opslaan:** wordt het een primaire knop (petrol vlak) of blijft het secundair? En krijgt `.btn-toevoegen` dezelfde letterstijl als `.btn`?
3. **Bevestigen bij verwijderen:** blijft het `confirm()` met één vaste tekst ("X verwijderen? Dit kan niet ongedaan worden gemaakt."), of komt er een eigen dialoog?

## Voorstel: wat eerst

1. **Klein fixpakket (route klein, één sessie, geen agents).** Het gaat om H2, H5, M4, M7, M8, M10, M14 en het logo verwijderen met een bevestiging:
   - de token `--border` donkerder;
   - de hint aanpassen;
   - `Fout: code` vervangen door een gewone tekst;
   - een maximum op de domeinnaam;
   - `.toel` zonder opacity;
   - `.cel-nr` niet vet;
   - het lettertype lokaal zetten, inclusief gewicht 500.
2. **Foutafhandeling en formulieren (route middel).** Het gaat om H1, M6, H3, H4 en M11. Gebruik dezelfde aanpak voor een laadfout als bij Vermogens. Gebruik `zetVeldFout` op het inlogscherm. Herstel de focus in de datumkiezer.
3. **Regelronde (route groot), vóór een tweede bestuurder.** Het gaat om P0d samen met M1 (`hasOnly` en een logogrens) en M2 (tests voor de P0c-regels en `firebase.js`). Doe dit in één keer, want het raakt dezelfde blokken.
4. **AVG zonder code (Paul).** Maak het verwerkingsregister, de procedure voor verzoeken en datalekken, de verwerkersovereenkomst met HCA en Vercel Pro of een alternatief. Daarna komt de privacyverklaring met een link in de footer.
5. **`vercel.json` met beveiligingsheaders (klein).** Test de CSP eerst op tst, vanwege Firebase en (tot stap 1) Google Fonts.
6. **Gelijktrekken en opruimen (middel, later).** Het gaat om M9, M12, M13, M15, de dode code en dubbele CSS. Dit gaat het best samen met het opsplitsen van `main.js` in modules per pagina en gedeelde tabelhelpers.

## Voorgestelde backlog-items (nog niet in `.claude/backlog.md`, eerst akkoord van Paul)

- **Fixpakket v0.12.2** (stap 1).
- **Laadfouten en formulier-toegankelijkheid** (stap 2).
- **P0d uitbreiden** met veldcontrole (`hasOnly`), een logogrens en P0c- en `firebase.js`-tests (stap 3).
- **AVG-basis**: register, privacyverklaring, verwerkersovereenkomsten, procedures, back-up (stap 4).
- **Beveiligingsheaders** via `vercel.json` (stap 5).
- **Beheertabellen gelijktrekken en opruimen**, samen met het opsplitsen van `main.js` (stap 6).
- **Huisstijlbesluiten** 1–3 hierboven.
