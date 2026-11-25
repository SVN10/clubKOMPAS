# Controle CK-170: Beheer → Activiteiten (test, huisstijl, toegankelijkheid)

Datum 25-11-2026, branch `test`, niet gecommit. Alleen code gelezen; niet in de browser gekeken en geen code gewijzigd.

## 1. Test
- `npm run build`: geslaagd (alleen de bekende waarschuwing over chunkgrootte).
- `npm run test:regels`: 148 van 148 groen, waarvan 10 nieuwe in "CK-170 activiteiten: regels". `npm run lint` bestaat niet.
- `firestore.rules` (r. 182-201, 361-367) komt overeen met de spec. Het blok bevat `hasOnly` en `hasAll`, de naamregel, de soortenlijst, de datums, `vermogenIds` met precies 1 element, `exists()` op vermogen en commissie, alleen een beheerder schrijft, elk lid leest.

| Acceptatiecriterium | Status | Opmerking |
|---|---|---|
| Menu na Vermogens, pictogram kalender, alleen beheerder | gedekt | `ZIJMENU` r. 1384, `NAV_DOEL` r. 1404, `MENU_ICOON.kalender` r. 1363, guard `geenBeheer` r. 2551. Zichtbaarheid en bereikbaarheid voor een niet-beheerder niet in de browser geprobeerd. |
| Lege staat met uitleg | gedekt, met afwijking | Tekst staat er (r. 2713-2716). De knop zit conform ontwerp in de balk, niet in het lege blok. De spec zegt "met de knop", het ontwerp wint. |
| Toevoegen met alle velden, verplichte velden, "Geen commissie" | gedekt | r. 2821-2863, `leesVelden` r. 2664. |
| Veldfouten met `aria-describedby`, focus op eerste fout (naam, soort, vermogen, begindatum/halve datum, einddatum vóór begindatum) | gedekt | `valideerVelden` en `zetVeldFout`; de volgorde is naam, soort, vermogen, begin, eind. Halve datum via `validity.badInput`. |
| Einddatum `min` = begindatum | gedekt | `bijBegin` r. 2810 voor `form` en `lijstEl`, plus `min` bij het openen van het bewerkformulier (r. 2656). |
| Tabel volgens besluiten 19-24 en 30-32 | gedekt | Zie punt 2. |
| Lijst op begindatum, filter met verborgen label "Toon" en statusmelding | gedekt | `sorteerActiviteiten`, label `sr-only` (r. 2560), `meldFilter` met `zetStatus`. |
| Bewerken in de rij, `confirm()` met vaste tekst, melding, focus naar buurrij of terugvalknop | gedekt | r. 2897-2951, `bevestigVerwijderen` (besluit 41). Er is geen schrijfactie als er niets is gewijzigd. |
| Vermogen/commissie met activiteiten niet te verwijderen, aantal in de melding, blokkade ook bij een tellfout | gedekt | Vermogens r. 2408-2426, Commissies r. 3300-3319 (alleen bij `soort === 'commissies'`). Beide tellen vóór `confirm()` en met `metTijdslimiet`. De blokkade zelf (UI) heeft geen geautomatiseerde test. |
| Regels en regeltests | gedekt | Zie hierboven. De tests dekken alle gevallen uit de spec, plus een andere club. |
| `activiteiten.js` zonder DOM, geen import uit `main.js` | gedekt | Importeert alleen `firebase/firestore` en `onderdelen.js`. |
| Build en regeltests slagen | gedekt | |

Randgevallen uit de spec die in de code zitten: een verdwenen vermogen (veldfout bij het openen, opslaan geblokkeerd), een verdwenen commissie (hint en bij opslaan `''`), vermogens, domeinen of commissies niet geladen (fail-soft, commissie blijft ongewijzigd), geen vermogens (hint met link, knop uit), dubbele naam op dezelfde begindatum, datum alleen via splitsen. Onbekende soort telt als Overig. Nog niet door tests gedekt: `activiteitBezet`, `sorteerActiviteiten` en `geldigeActiviteit` (client-spiegel) hebben geen eigen unittest; `datumTekst` en `activiteitDatumFout` wel.

### Bevindingen test
- **Laag:** na een geblokkeerde verwijdering (Vermogens r. 2417/2423, Commissies r. 3309/3315) wordt een eerdere groene sectiemelding niet gewist. Er kunnen dan "✓ ... verwijderd" en de foutmelding tegelijk staan. Gebruik `wisMeldingen` voor het zetten van de fout, zoals `metOpslaan` doet.
- **Laag:** in `renderActiviteitenBeheer` is de opslagknop in het bewerkformulier `disabled` zonder vermogens (r. 2793). Dat is een andere aanpak dan elders (`aria-disabled`). Zie ook de toegankelijkheid.
- **Laag:** geen unittests voor `activiteitBezet`, `sorteerActiviteiten` (einddatum leeg eerst) en `geldigeActiviteit`.

## 2. Huisstijl (CK-046 besluiten 19-41)
Geen afwijkingen van betekenis. Alle tokens bestaan al (`--muted`, `--fs-toelichting`, `--border`), er zijn geen nieuwe kleuren of lettergroottes.
- 19 witte kaarten met lijnen van 1 px, 20 kolommen via subgrid met 30 px ertussen en acties rechts (r. 1144-1146 in `style.css`), 21 geen vette waarden en niets onder elkaar (domein bij het vermogen staat er niet), 22 geen omschrijving, 23 ronde `status-label` zonder kleur per soort, 24 verborgen "Toon", 30 datum achter de naam in `.cel-periode`, 32 rijnummer is de plaats in de hele lijst (`activiteiten.indexOf(x) + 1`) en er zijn geen pijlen, 39 vierkante knoppen, 40 `btn opslaan` als primaire knop, 41 vaste `confirm()`-tekst.
- **Laag:** in het smalle raster (container ≤ 760 px) geldt `column-gap: 10px` niet. De regel `#activiteit-lijst .beheer-rij { column-gap: 30px }` (r. 1126) heeft meer specificiteit dan `.activiteit-rij` in de `@container`-regel. Het raster van 24 px, auto en 1fr krijgt dus 30 px tussenruimte. Dit is hetzelfde patroon als in het ontwerp, maar het effect is niet in de browser gezien. Controleer dit op 320-400 px.
- **Laag:** `.btn.opslaan:disabled` en `.btn-toevoegen:disabled` zijn nieuwe, globale regels (r. 1096-1097). Ze zijn geldig, maar de verschillende uitgeschakelde knoppen in de app zijn niet gelijk (`aria-disabled` elders, `disabled` hier).
- **Laag:** de lege `p#activiteit-hint.tussen-hint` krijgt via `.tussen-hint:empty` een `margin-top: -16px`. Die regel is bedoeld voor de inlogkaart. Controleer in de browser dat de balk of lijst niet te dicht tegen elkaar komt te staan.
- **Info:** besluit 33 (menuvolgorde zonder Activiteiten) is achterhaald door de spec van CK-170. Dat is geen afwijking.

## 3. Toegankelijkheid (WCAG 2.1 AA)
Sterk in orde, afgezien van onderstaande punten.
- Eén `h1` "Activiteiten" in een `region` met `aria-labelledby`. De kruimelpad en de pagina volgen het patroon van Projecten.
- Elk veld heeft een zichtbaar `label` (de datumvelden `label` plus `fieldset/legend`) en een `span.form-fout` met `aria-describedby`. `zetVeldFout` zet `aria-invalid` en de klasse `fout`. De eigen keuzelijst neemt dat over (MutationObserver in `keuzelijst.js` r. 52).
- Focus: bij een fout op het eerste foute veld, bij openen op Naam, na toevoegen op het potlood van de nieuwe rij, na bewerken op het potlood, na verwijderen op de buurrij of de terugvalknop, na Annuleren op de aanleiding. Sectiemeldingen zijn `role="status"` en `role="alert"` en staan er vanaf het tekenen. De filterstatus gebruikt `zetStatus`.
- Tabel met `role="table"`, `row`, `columnheader` en `cell`. Actieknoppen hebben een naam per rij ("Bewerken: Naam"). De datum heeft verborgen tekst ", datum ". De lege commissie leest "geen commissie" voor. De `cel-label`-voorvoegsels zijn `aria-hidden` omdat de kolomkop in de smalle weergave alleen verborgen is.
- Contrast: `--muted` op wit is voldoende (circa 5:1).

Bevindingen:
- **Laag (advies):** de verplichte velden (naam, soort, vermogen, begindatum) hebben geen `aria-required` of zichtbare markering. Elders in de app is dat ook niet zo (0 treffers in `main.js`), dus het is consistent en de foutmelding dekt het af. Overweeg het app-breed (WCAG 3.3.2).
- **Laag:** de uitgeschakelde "+ Activiteit toevoegen" (r. 2733) kan geen focus krijgen. De reden staat in `p#activiteit-hint`, maar de knop verwijst er niet naar met `aria-describedby`. Een toetsenbordgebruiker kan de hint wel lezen, maar de koppeling ontbreekt.
- **Laag:** `aria-invalid` en de foutmelding van een veld blijven staan tot de volgende keer opslaan (gelijk aan de rest van de app, dus geen regressie).
- **Laag:** de melding bij een verdwenen vermogen (r. 2798) wordt bij het openen van het bewerkformulier gezet zonder focus. Een schermlezer hoort die tekst pas bij het bereiken van het veld, niet via een live region. Dat is acceptabel, omdat de focus daarna op Naam gaat en het veld `aria-describedby` heeft. Bij het vermogenveld staat de fout wel in het veld zelf.
- Niet te testen zonder browser: toetsenbordbediening van de eigen keuzelijst en datumkiezer binnen de nieuwe formulieren, de zichtbaarheid van de focusrand en het gedrag bij 200% zoom en 320 px.

## Eindoordeel
Geen hoge bevindingen. Geen blokkades voor de beoordelaar. Open punten zijn laag,.
Alle acceptatiecriteria zijn gedekt in code en tests, behalve wat alleen in de browser te zien is.

Ernst in totaal: hoog 0, middel 0, laag 9.
