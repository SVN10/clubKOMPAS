# Controle CK-046 Projecten en samenwerkingen (test, huisstijl, toegankelijkheid)

Methode: `npm run build` (geslaagd, alleen bekende chunkwaarschuwing), `npm run test:regels` (93 van 93 groen), statische code-review van `git diff` en `src/onderdelen.js`. Geen browser, niet ingelogd. `npm run lint` bestaat niet.

## Oordeel
Klaar voor beoordelaar. Geen bevindingen van ernst middel of hoger; vier lage bevindingen. Visuele punten (lay-out, pictogrammen op 18px, schermlezer) zijn niet te toetsen zonder browser.

## Besluiten
| # | Besluit | Status | Plek |
|---|---|---|---|
| 2-3 | Twee beheerpagina's, naam/omschrijving/eigenaar | ok | main.js ZIJMENU, NAV_DOEL, renderOnderdeelBeheer |
| 4-6 | Periode bij project; geen contactpersoon, soort of koppeling | ok | onderdeelVelden: samenwerking zonder status/datums |
| 7 | Drie statussen, samenwerking geen status | ok | STATUSSEN, cfg.status |
| 8 | Alleen op plaat; in voorbereiding gestippeld; afgerond niet | ok | OP_PLAAT-filter in teken(); CSS `.voorbereiding` dashed; label "In voorbereiding" in subregel |
| 9 | Domeinenoverzicht ongewijzigd | ok | geen diff daar |
| 10 | Datums optioneel, einde >= begin, JJJJ-MM-DD of '' | ok | datumFout, leesVelden (badInput apart), regels geldigeDatum |
| 10 | periodeTekst-notaties | ok | alle 5 rijen, met unittests (regels.test.mjs r. 757) |
| 11 | Kaartje: naam + kleine regel, geen omschrijving/eigenaar | ok | plaatOnderdelenHTML |
| 12 | Geen domeinomschrijving bij `bevat`; lege teksten | ok | plaatKaartHTML; "Er zijn geen projecten/samenwerkingen." ook als alles afgerond |
| 13 | Eigenaar niet verplicht; script vult Voorzitter | ok | onderdeelVelden default ''; script-plantest groen |
| 14 | Naam uniek, hoofdletterongevoelig, alleen app | ok | naamBezet (naamSleutel + normaliseer), eigen id uitgezonderd, `/` toegestaan |
| 15 | Geen `bevat`-keuze in domeinformulier | ok | alleen regels + script |
| 16 | #-kolom = plaats in hele lijst | ok | `onderdelen.indexOf(x) + 1` |
| 17 | Laadfout plaat: omschrijving + melding | ok | onderdelen[soort] = null -> geen blokVan -> fallback + hint |
| 18 | Lopend zonder datums: alleen naam | ok | sub = '' -> geen span |

## Gebruikersreis
- Knop verborgen bij open formulier, terug na opslaan/annuleren: ok (toevoegKnop.hidden in click/sluitForm).
- Filter: "Alle" standaard; filter hidden bij lege lijst; Status = filterwaarde bij toevoegen; nieuw item buiten filter zet filter op Alle + staartzin: ok.
- ↑/↓ met filter: wisselt met zichtbare buur in de verse volledige lijst, hernummert 1..n, statusregel "plaats b+1 van n" klopt na de swap; eerste/laatste zichtbare disabled: ok.
- Bewerken (in de rij), ongewijzigd = geen schrijfactie, afgerond-staartzin, focus op potlood of terugval: ok.
- Verwijderen: confirm, "al weg" via project-weg/samenwerking-weg: ok.
- Lege staat zonder eigen knop, filter zonder treffers, tussen-hint, laadfout met Opnieuw laden en testhint: ok.
- Bestuursfunctie-blokkade: vers tellen uit drie collecties, tekst past rol aan, geen confirm, kolom "Niets"/opsomming: ok. Domeinen-alleen-tekst blijft als vroeger.
- Regels: `bevat` alleen projecten/samenwerkingen; extra/ontbrekend veld, status, datums getest in emulator.

## Huisstijl
Alleen tokens (`--petrol`, `--muted`, `--border`, `--surface`, `--text`, `--card`, `--fs-label`, `--fs-toelichting`), geen losse kleuren of hex in de nieuwe CSS. Bestaande klassen (`structuur-rij`, `beheer-rij`, `btn-kaart-actie`, `actieKnopHTML`, `meldingenHTML`, `.leeg-blok`, `.plaat-leeg`) hergebruikt. Contrast berekend op de tokenwaarden: muted op surface licht circa 4,6:1, petrol op card circa 4,9:1, gestippelde rand muted op card >= 3:1 (licht en donker): ok.

## Toegankelijkheid (WCAG 2.1 AA)
- Labels: alle velden `label for`; datums in fieldset/legend; ok.
- Foutkoppeling: `aria-describedby` op alle velden, `aria-invalid` en focus op eerste fout via `valideerVelden` (volgorde naam, begin, eind, omschrijving); dubbele naam via veldFouten: ok.
- Focus: opslaan toevoegen -> toevoegknop; annuleren -> knop of potlood; bewerken -> potlood/terugval; verwijderen -> buur/terugval: ok.
- Status niet alleen via kleur: woord in beheer ("Lopend" enz.), "In voorbereiding" in plaat-subregel; rand is extra: ok.
- Pictogramknoppen: `actieKnopHTML` (naam met item) en `aria-label` "{naam} omhoog/omlaag": ok. Plaatlijst `role="list"` + `aria-label`: ok.

## Bevindingen
1. **Laag** - `leeg-streep` met `aria-label` op een `<span>` (main.js, `const leeg = ...`). Een label op een generiek element wordt door schermlezers niet betrouwbaar voorgelezen; "—" kan als "streepje" of niets klinken. Herstel: `<span class="leeg-streep"><span aria-hidden="true">—</span><span class="sr-only">geen periode</span></span>`, of `role="img"` op het span.
2. **Laag** - Pagina Bestuursfuncties (`laadVerwijzers` in `laadEnRender`, `Promise.all`) laadt niet als projecten/samenwerkingen niet te lezen zijn (regels nog niet gepubliceerd) en heeft geen laadfout; de lijst blijft op "laden". Bewust gedocumenteerd (afwijking 9, uitrolvolgorde regels eerst). Herstel (optioneel): de verwijzers met `allSettled` laden en alleen de kolom/verwijderknop bij mislukken uitschakelen met melding, of een laadfout tonen.
3. **Laag** - ↑/↓ op een intussen verplaatste eerste/laatste zichtbare rij (main.js, `if (j < 0 || j >= zichtbaarVers.length) return`) geeft `uitkomst === 'ok'` met lege `plaats`, waarna `meldingInBeeld(sectieFout)` een lege foutmelding in beeld brengt. Zeldzaam (alleen na gelijktijdige wijziging). Herstel: bij die return een statusregel zetten of het `meldingInBeeld` alleen bij `uitkomst !== 'ok'`.
4. **Laag** - Regels en `geldigeDatum` accepteren `2026-13-45` (alleen vorm). De kiezer levert dit niet; `periodeTekst` valt terug op "13 2026". Herstel (optioneel): maand 01-12 en dag 01-31 in de regex.

## Niet getoetst (handmatig, zoals in het bouwverslag)
Lay-out op 1200/768/375px licht en donker; pictogrammen op 18px; datumkiezer met half ingevulde datum in Safari/Firefox; schermlezer; focus op echte apparaten; domein bewerken laat `bevat` staan (regels laten het toe, app-gedrag niet in browser gezien).
