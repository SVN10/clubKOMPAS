# Analyse clubKOMPAS v0.13.3 (gericht op CK-056)

Datum: 24 november 2026 · Branch: `test` (gelijk aan `main`, commit `50c739d`) · Bron: de diff sinds v0.13.0, gerichte lezing van de code en de emulator.

**Gedraaid:**
- `npm run test:regels`: 131 van 131 geslaagd.
- `npm run build`: geslaagd. Bundel 712,76 kB (bekende waarschuwing over de grootte).
- Twee tijdelijke verkenningstests in de emulator, voor randgevallen in de regels. Ze zijn daarna verwijderd en de werkmap is schoon.

**Niet gecontroleerd:** de app in een browser of met een schermlezer, de Firebase- en Vercel-console, en de echte data. Volgens de backlog (`.claude/backlog.md:614`) zijn de regels nog niet in productie gepubliceerd.

## Status bevindingen v0.13.0

| Nr | Status | Bewijs |
|---|---|---|
| T-1 | Opgelost | `src/main.js:728`, `:1247`, `:1253`: de tekst hangt af van `isBeheerder()` |
| T-2 | Deels | `src/main.js:1741` en `:3018` geven geen TypeError meer bij wegnavigeren. Ga je wel snel weg en terug (A→B→A), dan vindt `getElementById` de lijst van de nieuwe render, en dan bindt de oude render zijn listeners er ook op. Zie N-3. |
| T-3 | Opgelost | `src/main.js:1135`. Valt terug op `#inhoud`, en dat element heeft `tabindex="-1"` (`:1478`) |
| T-5 | Opgelost | `src/main.js:2383`, `:2846`, `:3266`. Er staat nog maar één `confirm(` in de code, in `bevestigVerwijderen` (`:522`) |
| A-1 | Opgelost (code) | `src/main.js:838-841`. Het element heeft `role="alert"` (`:773`), de timer controleert op `null`. Met VoiceOver nog handmatig te bevestigen |
| A-2 | Opgelost | `src/keuzelijst.js:40-52`, `:263`. De knop volgt alleen `disabled` |
| HS-1 | Opgelost | `src/main.js:3325`, `:3345`, `:3364`. `.btn.opslaan` bestaat (`src/style.css:202`) |
| HS-4 | Opgelost | Geen `--paneel-top` meer in `src/`. `src/style.css:831` heeft `top: 0` en `:845` heeft `inset: 0`. De omgevingsbalk is in de app-shell verborgen (`:871`) en staat in `PANEEL_INERT` (`main.js:1491`), dus `0` klopt |
| L1 | Opgelost, test kan sterker | `tests/regels.test.mjs:1144-1166`: 8 collecties, elk met toevoegen, wijzigen en verwijderen. Er is geen positieve controle. Zie N-6. |
| L2a | Opgelost | `firestore.rules:193-196`. De lijst is gelijk aan `src/main.js:136-151` en `scripts/lib/p0d-velden.mjs:20`. `null` en een andere tekst dan in de lijst worden geweigerd |
| L2b | Deels | `firestore.rules:188-191`. Regeleinden, C0 en bidi worden geweigerd, ook `a\nb\nc` (getest). Er blijven gaten: zie N-1. |
| L3 | Opgelost, met een bijwerking | `firestore.rules:233`, `p0d-velden.mjs:65`, tests `:1234`. Bijwerking: zie N-2. |
| L4b/c | Opgelost | `vercel.json:19-26`: HSTS `max-age=63072000; includeSubDomains` (zonder preload) en `Permissions-Policy`. Geldige JSON. L4a (`frame-src` en `firebaseio`) staat bewust open tot er een test is gedaan |
| L8 | Opgelost | `scripts/archief/` heeft de drie bestanden en een README met een waarschuwing. README.md (`:289`, `:292`, `:312`), `.claude/docs/P0d.md` (`:9`, `:70`) en `P0c-technisch.md:88` gebruiken het nieuwe pad. Oude paden staan alleen nog in historische tekst (CHANGELOG `:43`, `:260` en de P0c-spec) |
| L9 | Opgelost | `scripts/migreer-club.mjs:126`, `:145`, `:201` via `veilig()`. Rest: `:125` toont `clubId` uit `gebruikers/{uid}` zonder `veilig()`. Dat veld kan via de app niet worden geschreven, dus geen actie |

## Nieuwe bevindingen

### N-1: `geenStuurtekens` laat nog onzichtbare tekens door
**Ernst:** 🟢 Laag · **Type:** Invoervalidatie
**Locatie:** `firestore.rules:190`, `src/main.js:505`, `scripts/lib/p0d-velden.mjs:18`

**Probleem:** de regex zelf klopt. `[^…]*` met `matches()` dekt de hele tekst, ook regeleinden. RE2 werkt per codepunt, dus emoji en é, ë, &, –, ', NBSP en 's-Hertogenbosch komen erdoor (getest in de emulator). Toch laat de lijst deze tekens door, wat in de emulator is bevestigd:
- U+2028 en U+2029: regel- en alineascheiding;
- U+FEFF: BOM, komt vaak mee bij kopiëren en plakken;
- U+0080-009F: C1-stuurtekens;
- U+00AD: zachte afbreking;
- U+2060-2064: onder meer word joiner;
- U+061C: Arabische letterteken-markering, ook een bidi-teken.

Het terminalfilter `veilig()` (`scripts/lib/omgeving.mjs:35`) en de vermogensnamen (`src/vermogens.js:13`, `\p{Cf}\p{Cc}`) zijn strenger. De drie nieuwe plekken (regels, app en controlescript) zijn wel precies gelijk aan elkaar.

**Aanbeveling:** gebruik op alle drie de plekken Unicode-klassen in plaats van bereiken.
- Regels: `v.matches('[^\\p{Cc}\\p{Cf}\\p{Zl}\\p{Zp}]*')`. Getest in de emulator: dit weigert alle gaten hierboven en laat de gewone namen en emoji door.
- JS: `/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u`.

Voeg tests toe met ` `, `﻿` en `­`, en een positieve test met een emoji.

### N-2: van type wisselen bij een overkoepelend domein met `bevat` wordt geweigerd, met een algemene foutmelding
**Ernst:** 🟢 Laag (functioneel, niet beveiliging) · **Type:** Regressie of integriteit
**Locatie:** `src/main.js:1925` (soortkeuze ook bij `bevat`), `:1985` en `:182` (`updateDoc` houdt `bevat`), `firestore.rules:233`

**Probleem:** een beheerder bewerkt het blok "Projecten" (`overkoepelend`, `bevat: 'projecten'`) en kiest de soort Pijler of Ondersteunend. Met `updateDoc` blijft `bevat` in het samengevoegde document staan, dus de regel weigert (in de emulator bevestigd: `permission-denied`). De gebruiker ziet alleen de algemene opslagfout. Vóór CK-056 lukte dit wel.

**Aanbeveling:** kies één van deze twee.
- Zet bij een typewissel weg van `overkoepelend` ook `bevat: deleteField()` in `data`. Let op: dan verdwijnt het blok van de plaat, dus vraag om bevestiging.
- Of schakel in het bewerkformulier de soortkeuze uit voor een domein met `bevat`, met een korte uitleg.

Voeg er een regeltest bij.

### N-3: de `isConnected`-guard dekt het geval weg en terug niet (T-2, deels)
**Ernst:** 🟢 Laag · **Type:** Robuustheid
**Locatie:** `src/main.js:1740-1741` en `:1665`, `:3017-3018`

**Probleem:** de guard zoekt de lijst ná de `await` opnieuw op met `getElementById`. Navigeert de gebruiker tijdens het laden naar een andere pagina en weer terug, dan staat er een nieuwe, verbonden lijst. De oude render bindt dan alle listeners er ook op: herladen, filter, formulier, Enter en acties. Gevolg: een dubbele klikafhandeling, zoals twee bevestigvragen of twee keer toevoegen. Daarnaast schrijft `toonLaadfout` (`:1664-1673`) een laadfout van de oude render in de lijst van de nieuwe render. Dit is geen regressie, want het gat bestond al. CK-056 sluit alleen het geval zonder terugkeer.

**Aanbeveling:** onthoud het lijst-element meteen na het tekenen van de shell, vóór de eerste `await`. Controleer daarna `ditElement.isConnected`, en niet een nieuwe opzoeking. Een algemenere oplossing is een navigatieteller per render.

### N-4: oude documenten zijn na het publiceren in productie niet meer te wijzigen
**Ernst:** 🟡 Hoog, maar alleen procedureel: het moet vóór `regels:productie` gebeuren · **Type:** Regressie (data)
**Locatie:** `firestore.rules:225`, `:229`, `:282-284` en `tellerWijzigingKlopt`

**Probleem:** de regels toetsen het hele document na de wijziging. In de emulator bevestigd: bij een domein met `icoon: 'stick'` of een naam met U+200B wordt ook een update van alleen `volgorde` geweigerd. Daarmee mislukken ook de tellerupdates bij het toevoegen en verwijderen van vermogens. Met bewerken via de app herstelt `icoon` zich wel, want het formulier stuurt `''`.

**Aanbeveling:** draai `npm run p0d:controle -- --omgeving=productie --droog` vóór het publiceren, zoals de backlog al zegt. Herstel elke afwijking bij `icoon` of `naam` handmatig, want het script ruimt alleen onbekende velden op (`p0d-velden.mjs:80`). Als N-1 wordt overgenomen, moet de controle daarna opnieuw.

### N-5: een ZWJ-emoji (familie of beroep) geeft de melding "onzichtbaar teken"
**Ernst:** 🟢 Laag · **Type:** Gebruiksvriendelijkheid
**Locatie:** `src/main.js:506`, `firestore.rules:190`

**Probleem:** U+200D wordt geweigerd. Daardoor worden 👨‍👩‍👧 en 🧑‍🏫 geweigerd, met een melding die de gebruiker niet begrijpt. Enkele emoji, vlaggen en huidskleuren werken wel.

**Aanbeveling:** dit is acceptabel, want het komt niet voor in HCA-namen. Maak de melding eventueel iets ruimer: "… of een samengestelde emoji".

### N-6: de L1-test heeft geen positieve controle
**Ernst:** 🟢 Laag · **Type:** Testkwaliteit
**Locatie:** `tests/regels.test.mjs:1155-1164`

**Probleem:** `assertFails` voor `vermogens` en `vermogensnamen` (toevoegen) faalt ook bij de eigen beheerder, want de tellerbatch ontbreekt. Een regressie in het tenant-deel van die blokken laat de test dus niet falen.

**Aanbeveling:** voer per geval dezelfde schrijfactie ook uit als `jan` (beheerder club1) met `assertSucceeds`. Gebruik voor vermogens `rauwToevoegen`.

### N-7: kleine documentatiepunten
**Ernst:** 🟢 Laag
- `.claude/docs/CK-044-technisch.md:55` en `:72` noemen nog `--paneel-top`. Werk die tekst bij.
- `src/keuzelijst.js:38`: de comment noemt `fout` als iets dat altijd wordt doorgegeven. Voor de knop is dat nu niet zo. Er is geen visueel effect, want `.fout` geldt alleen voor `.form-input` (`style.css:330`). Pas de comment aan.

## Overige controles (in orde)

- **Vroege `return`s** (`main.js:1741`, `:3018`): zonder terugkeer slaan ze alleen listeners over op een los knooppunt. In de foutstaat blijft de lijst bestaan, dus "Opnieuw laden" blijft werken. Herladen via `alsNog` heeft een eigen guard (`:1590`).
- **`volgAttributen(..., false)`**: `disabled` wordt vóór de `return` gezet en de MutationObserver blijft actief. `aria-describedby` en `aria-invalid` komen niet op de knop.
- **Uitlogmelding**: een timer van 150 ms en een `null`-controle. Theoretisch kan de timer een inlogfout overschrijven die binnen 150 ms ontstaat, maar dat is verwaarloosbaar.
- **`vercel.json`**: geldige JSON, één `source: "/(.*)"`, vijf headers en een ongewijzigde CSP. Controleer dat alle subdomeinen https hebben, vanwege `includeSubDomains`.

## Samenvatting

- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 1 (N-4, een procedurestap vóór publiceren in productie)
- 🟢 Lage aanbevelingen: 6 (N-1, N-2, N-3, N-5, N-6, N-7)

## Eindoordeel

🟡 **Naar TST met aandachtspunten.** CK-056 lost 12 van de 15 punten volledig op. T-2 en L2b zijn deels opgelost. L1 is opgelost, maar de test kan sterker. Er zijn geen nieuwe beveiligingsgaten met impact: alle resterende tekens zijn alleen door een beheerder te zetten en worden overal geëscaped. Er zijn ook geen geldige HCA-namen die ten onrechte worden geweigerd. Vóór `regels:productie` moet eerst `p0d:controle` in productie schoon zijn (N-4). Neem bij voorkeur N-1 en N-2 mee in hetzelfde kleine fixpakket, zodat de regels maar één keer opnieuw gepubliceerd hoeven te worden.
