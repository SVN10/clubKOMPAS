# Toegankelijkheidsrapport: P0f — Eigen adressen voor live en online test

Methode: code-analyse van `src/main.js` (diff P0f), `src/style.css`, `index.html` en `.claude/specs/P0f-ontwerp.md`; contrastberekening met Python. Niet ingelogd, geen code gewijzigd, niet in een echte browser/schermlezer getest.

## Contrastberekeningen

| Combinatie | Verhouding | Eis | Oordeel |
|---|---|---|---|
| Wit op petrol-dark `#3A6567` (balk Ontwikkel/Test, licht) | 6,49:1 | 4,5:1 | voldoet |
| Wit op `#2F5658` (donker thema) | hoger dan 6,5:1 | 4,5:1 | voldoet |
| Rood `#c0392b` op wit (M16 eerste zin) | 5,44:1 | 4,5:1 | voldoet |
| Rood `#c0392b` op `#F6F8F8` | 5,10:1 | 4,5:1 | voldoet |
| Petrol `#46797B` op wit (`.tussen-link`) | 4,90:1 | 4,5:1 | voldoet |
| `--text` op wit (`.inlog-test-hint`, `code`) | 18,8:1 | 4,5:1 | voldoet |

## Bevindingen

### 1. Ontwikkel en Test delen kleur: onderscheid zit in tekst en tabtitel
**Ernst:** 🟢 Suggestie (geen tekortkoming)
**WCAG-criterium:** 1.4.1 Gebruik van kleur
**Locatie:** `src/main.js` (`OMGEVINGS_BALK`, ca. regel 544-548)
**Probleem:** Beide varianten gebruiken `.omgeving-balk--test`. Het onderscheid is tekstueel: "Ontwikkelomgeving · op deze computer" tegenover "Testomgeving · online". Dat voldoet: kleur is hier niet de informatiedrager. Het eerste woord is vet en verschilt, het tweede onderscheidende element ("op deze computer" / "online") staat direct erachter, en de tabtitel begint met `ONTWIKKEL` of `TEST`. Voor schermlezers, kleurenblinden en bij 400% zoom is de tekst voldoende onderscheidend. De verwarringskans is klein omdat beide omgevingen hetzelfde testproject met fictieve data gebruiken.
**Aanbeveling:** Geen actie nodig. Optioneel: `data-soort` staat al op de balk; dat blijft bewust onzichtbaar voor gebruikers, wat goed is.

### 2. Balk `role="note"` met `aria-label="Omgeving"`
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 4.1.2 Naam, rol, waarde; 1.3.1 Info en relaties
**Locatie:** `src/main.js:556-558`
**Probleem:** Geen. `role="note"` wordt niet bij elke schermwissel voorgelezen (geen live region), de betekenis staat in de tekst, de balk staat als eerste element in de DOM (leesvolgorde klopt). `text-transform: uppercase` verandert de toegankelijke naam niet, dus schermlezers lezen "Ontwikkelomgeving" gewoon als woord. De `·`-scheidingstekens worden door sommige schermlezers als "middelpunt" voorgelezen; dat is hinderlijk maar niet fout.
**Aanbeveling:** Optioneel scheidingstekens met `<span aria-hidden="true">·</span>` omgeven en een komma of spatie als tekstuele scheiding laten staan. Niet verplicht.

### 3. Tabtitels
**Ernst:** 🟢 Suggestie (geen tekortkoming)
**WCAG-criterium:** 2.4.2 Paginatitel
**Locatie:** `src/main.js:539, 562`
**Probleem:** Titels `ONTWIKKEL · clubKOMPAS`, `TEST · clubKOMPAS`, `PRODUCTIE LOKAAL · clubKOMPAS` en `Gestopt · clubKOMPAS` beginnen met het onderscheidende deel; dat is goed voor tabbladen en schermlezers. Kanttekening (bestond al voor P0f): de titel wijzigt niet per scherm of pagina binnen de app, dus de pagina's zijn onderling alleen onderscheidbaar via de kop.
**Aanbeveling:** Buiten scope P0f. Overweeg later `document.title = '<pagina> · ' + prefix`.

### 4. Nieuwe foutpagina's online (`test-met-productie`, `gemengde-config`)
**Ernst:** 🟢 Suggestie
**WCAG-criterium:** 1.3.1, 2.4.3 Focusvolgorde, 4.1.3 Statusberichten, 2.4.4 Linkdoel, 1.4.1
**Locatie:** `src/main.js:476-514, 527-538`
**Probleem:** Opbouw hergebruikt P0e: `<h1>` met `tabindex="-1"` en focus, "Gestopt:" in de titel naast de oranje rand (kleur is dus niet de enige indicator), genummerde lijst `<ol>` voor stappen, echte `<button>` voor "Opnieuw laden", echte `<a class="tussen-link">` met zichtbare hostnaam en onderstreping (contrast 4,9:1, focusring 2px petrol, 4,9:1 tegen wit, ruim boven 3:1). Alle teksten zijn leesbaar en herstelbaar (concrete stappen). Twee kanttekeningen, beide al aanwezig in P0e: (a) `role="alert"` op de wrapper plus `focus()` op de titel plus `aria-describedby` kan tot dubbel voorlezen leiden; (b) de lange titel ("...zijn onvolledig of passen niet bij elkaar", ca. 85 tekens) is voor schermlezers een lange kop maar wel begrijpelijk.
**Aanbeveling:** Geen actie voor P0f. Eventueel later `aria-describedby` laten vervallen als het dubbel voorlezen bij een test hinderlijk blijkt.

### 5. M16 in `#inlog-algemeen-fout` (`role="alert"`)
**Ernst:** 🟡 Aandacht (best practice)
**WCAG-criterium:** 4.1.3 Statusberichten; 3.3.1 Foutidentificatie; 3.3.3 Foutsuggestie
**Locatie:** `src/main.js:429-448` (`toonAdresNietToegestaan`), `src/main.js:380-390`
**Probleem:** Positief: de melding verschijnt in de bestaande live region; die wordt bij elke poging eerst geleegd (`algFout.textContent = ''`, regel 388) en daarna gevuld, dus ook een tweede identieke poging wordt opnieuw voorgelezen. De melding wordt met `textContent`/`createElement` opgebouwd, dus geen injectie. De eerste zin is rood (5,44:1) en bevat tekst, dus niet alleen kleur. Hint-`span`s hebben `display: block` en `--text` (18,8:1). De `<code>` met hostnaam breekt via `overflow-wrap: anywhere`. Aandachtspunt: bij ontwikkel/test is de volledige melding lang (drie zinnen, waaronder technische Firebase-uitleg) en wordt dat in één keer als alert voorgelezen. Dat is voor de beoogde lezer (de beheerder) acceptabel. Ook: het invoerveld is niet aan de foutmelding gekoppeld (`aria-describedby`), maar dat geldt voor alle algemene fouten en hoort bij dit scherm sinds voorheen.
**Aanbeveling:** Geen blokkade. Overweeg bij gewone gebruikers (productie, `testProject === false`) de melding zo kort te houden als nu (twee zinnen), wat al het geval is. Voor de technische hint (alleen ontwikkel/test) kan eventueel `aria-live` buiten beschouwing blijven door die `span` los te zetten, maar dat is niet nodig.

### 6. M5/M6 in Ontwikkel (hint en "Geen club gekoppeld")
**Ernst:** 🟢 Suggestie (geen tekortkoming)
**WCAG-criterium:** 1.4.1, 1.4.3, 1.3.1
**Locatie:** `src/main.js:416-422, 581-586`
**Probleem:** Het voorvoegsel `Ontwikkelomgeving:` resp. `Testomgeving:` staat als vette tekst; er is geen kleur-afhankelijkheid. `.tussen-hint` is `--muted` `#6F6E6E` op wit (ca. 5,0:1; voldoet), 13px. De M5-hint staat binnen `#inlog-algemeen-fout` (alert) en wordt dus meegelezen. Taalgebruik is Nederlands; de technische termen (`gebruikers/<uid>`) staan in `<code>`.
**Aanbeveling:** Geen actie.

### 7. Reflow bij 320 px met de langere balktekst
**Ernst:** 🟡 Aandacht (best practice)
**WCAG-criterium:** 1.4.10 Reflow; 1.4.4 Tekst vergroten; 1.4.12 Tekstafstand
**Locatie:** `src/style.css:761-771`
**Probleem:** De balk heeft geen `white-space: nowrap`, geen vaste hoogte (alleen `min-height: 28px`) en geen afkapping, dus er is geen horizontaal scrollen en geen tekstverlies. Schatting bij 320 px (padding 16px, 12px uppercase met `letter-spacing: .08em`, ca. 8,5 px per teken, ca. 34 tekens per regel): Ontwikkel (ca. 85 tekens) komt op ca. 3 regels, niet de 2 die het ontwerp noemt bij 400 px; Test (ca. 65 tekens) op 2 tot 3 regels. Het langste ondeelbare woord ("svn10-clubkompas-test" ca. 21 tekens, ca. 180 px, of "ONTWIKKELOMGEVING" ca. 17 tekens) past ruim binnen 288 px. De foutpagina-kaart heeft `max-width: 400px; width: 100%` met 24px padding in `.inlog-wrap`, en `code`/`.tussen-tekst`/`.tussen-hint` hebben `overflow-wrap: anywhere`, dus lange project-ID's, hostnamen en `.env.<modus>.local` breken netjes. De `.config-stappen`-lijst heeft `margin-left: 20px` en `<li>` bevat `code` met `overflow-wrap: anywhere`; geen overloop te verwachten. Niet visueel in een browser gecontroleerd; 3 regels balk kosten ca. 58 px verticale ruimte, wat op 320 px acceptabel is omdat de balk niet sticky is.
**Aanbeveling:** Geen codewijziging nodig. Controleer handmatig in DevTools op 320 px en bij 200% tekstvergroting dat de balk niet over de rest heen schuift (de balk staat in de normale flow, dus verwacht wordt van niet). Pas eventueel de zin in het ontwerp aan ("breekt naar twee regels" wordt op 320 px drie regels).

### 8. Focusindicator op invoervelden (bestaand, niet door P0f)
**Ernst:** 🟡 Aandacht (best practice)
**WCAG-criterium:** 2.4.7 Focus zichtbaar; 1.4.11 Contrast van niet-tekstuele elementen
**Locatie:** `src/style.css:340`
**Probleem:** `.form-input:focus { outline: none; border-color: var(--petrol); }`: de focus is alleen zichtbaar via een petrol rand (4,9:1 tegen wit, voldoet aan 3:1) naast de standaardrand `#C9D7D7`. Dit is bestaand gedrag, maar M16 verschijnt op ditzelfde scherm. De knop "Inloggen" en "Opnieuw laden" hebben geen eigen focusstijl, dus de browser-standaardring blijft zichtbaar (voldoet).
**Aanbeveling:** Buiten scope P0f; voeg bij gelegenheid toe: `.form-input:focus-visible { outline: 2px solid var(--petrol); outline-offset: 1px; }`.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 3 (M16 lengte voor schermlezer, reflow op 320 px handmatig bevestigen, bestaande focusstijl invoerveld)
- 🟢 Suggesties: 5

Specifiek antwoord op de vraag "Ontwikkel en Test delen kleur, is de tekst voldoende onderscheidend?": ja. Het onderscheid wordt gedragen door vet eerste woord, "op deze computer" versus "online" en de tabtitel; kleur is niet nodig om de omgevingen te begrijpen (1.4.1 voldaan).

## Eindoordeel
✅ Voldoet aan WCAG 2.1 AA (met drie niet-blokkerende aandachtspunten; geen terugkoppeling naar de bouwer nodig)
