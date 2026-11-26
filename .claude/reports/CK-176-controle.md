# Controle CK-176 (venster) inclusief CK-175, branch test, niet gecommit

Uitgevoerd: `npm run build` slaagt (alleen de bekende waarschuwing over chunkgrootte). `npm run test:regels` slaagt: 194 van 194, 0 fouten. `firestore.rules` is niet gewijzigd. Alles hieronder is op de code gecontroleerd. Niets is in een browser getest, behalve wat de hoofdsessie al zag.

## Acceptatiecriteria
| Criterium | Status | Plek |
|---|---|---|
| Op alle vijf de schermen openen "+ toevoegen" en het potlood een venster, en er staat geen formulier meer in de tabel | geslaagd | Domeinen main.js:1841 en 2015. Vermogens 2237 en 2257. Activiteiten 2923 en 3059. Onderdelen 3364 en 3388. Bestuursfuncties 3664 en 3776. `form.hidden` en `bewerken`-rijen zijn uit de diff verdwenen. |
| Esc, ✕ en Annuleren sluiten zonder op te slaan en de focus gaat terug naar de opener | geslaagd | venster.js:65-92. `terug()` zoekt het potlood opnieuw op, want de rij is intussen opnieuw getekend. |
| Een klik op de achtergrond sluit niet | geslaagd | venster.js:66. Het `<dialog>` vult het hele scherm, en een klik op de dialoog zelf zonder `data-venster` wordt genegeerd. |
| Tijdens het opslaan blijft het venster open | geslaagd | venster.js:69, 85 en 90. `bezig` blokkeert ✕, Annuleren en Esc. Het `close`-event opent het venster weer bij een tweede Esc. |
| Na een geslaagde opslag sluit het venster, de melding staat in de sectie en de focus staat op de rij | geslaagd | In alle bewaarfuncties: `venster.sluit()`, dan `laadEnRender`, dan `focusInLijst` of `potlood().focus()`, dan `toonOk`. Voorbeeld: Domeinen 1946-1952, Functies 3711. |
| Bij een fout blijft het venster open, staat de fout bij het veld en staat de focus op het eerste foute veld | geslaagd | `valideerVelden` en `metOpslaan` zijn ongewijzigd. Bij `uitkomst === 'fout'` wordt niet gesloten (Vermogens 2418, Onderdelen 3434, Functies 3706, Activiteiten 2999). |
| Telefoon: het venster vult het scherm en de knoppen staan onderaan | geslaagd (code) | style.css `@media (max-width: 700px)`: padding 0, kaart `min-height:100%`, `.venster-lijf` met `flex:1 0 auto`. Door de hoofdsessie bevestigd op 375px. |
| Keuzelijst en datumkiezer worden niet afgesneden | geslaagd voor de keuzelijst (hoofdsessie). Datumkiezer niet te controleren | De kaart heeft geen `overflow`, de scroll zit op de dialoog zelf. De datumkiezer heb ik niet in een browser gezien. |
| Ongebruikte CSS en code voor bewerken in de rij zijn opgeruimd | geslaagd | Zie de greps hieronder. |
| Build en regels slagen, de regels zijn niet veranderd | geslaagd | Zie boven. |

## Regressie
- Validatie en focus op het eerste foute veld: `valideerVelden` ongewijzigd (main.js:523). Het venster blijft open.
- "Bezig..." en Esc of ✕ tijdens het opslaan: `zetBezig` in main.js:489 zet `aria-disabled` op de knoppen in `.form-rij`. Het venster heeft daarnaast een eigen `bezig`-vlag (venster.js:34). In Domeinen is `bezig` ook al aan tijdens de tel van de vermogens vóór `metOpslaan`.
- Enter slaat op: `enterSlaatOp(venster.el, …)` in main.js:577. Dat werkt alleen op tekstvelden, niet in de datumtekst en de textarea. Tijdens "Bezig" wordt het klikken genegeerd (venster.js:72).
- Soortkeuze Domeinen: de radiogroep blijft werken en `bevat` wordt weggehaald bij een andere soort (1929). Er is in de oude code geen veld dat de soort toont of verbergt. De diff verwijdert zo'n logica niet, dus niets kapot. De blokkade "overkoepelend met vermogens" werkt in het venster (1855-1868, 1920).
- ↑/↓ en verplaatsen bij Vermogens: de delegatie op `lijstEl` is ongewijzigd. Verplaatsen met halve uitkomst opent het venster opnieuw via `openBewerk(id, waarden)` (2450 en 2467). `open()` vervangt dan alleen de inhoud en houdt `terug` vast (venster.js:45).
- Uitvoeringen (CK-174): `uvBlokKlik` en `uvWijzig` hangen aan `venster.el` (3067-3069). `uvStaat` wordt opgeruimd via `opSluiten`. Het `confirm()` bij weghalen en de lege regel als fout zijn ongewijzigd. De melding bij een nieuwe activiteit blijft in het venster staan.
- Blokkades bij verwijderen (domein, vermogen, functie, commissie): de verwijderpaden in de rij zijn ongewijzigd.
- `geenBeheer`: niet in de diff geraakt.
- Laadfouten: elke `toonLaadfout` roept `venster.sluit()` aan (1667, 2200, 2879, 3331, enz.) en `bindHerlaad` blijft werken.

## Greps op opgeruimde code
- `zichtbareTerugval`, `resetForm`, `sluitForm`, `bewerk-opslaan`, `enterIsOpslaan`, `data-naamveld`: geen treffers in `src/`.
- `bewerken` in src/style.css: alleen nog in de kopcommentaren. De regels `.structuur-rij.beheer-rij.bewerken` en `:not(.bewerken)` zijn weg.
- `bewerken` in main.js: alleen nog in titels ("Domein bewerken: …") en commentaar.
- De ids `structuur-form`, `vermogen-form`, `activiteit-form`, `onderdeel-form` en `functie-form` komen alleen nog voor als `…-form-fout`-meldingsvelden.
- `toevoegKnop.hidden = …`: geen treffers meer.

## Beveiliging
- De titel gaat via `titel.textContent` (venster.js:41), dus namen zijn veilig. De inhoud van het venster is HTML van de aanroepers. Daar gaan namen via `esc()` (gecontroleerd bij Vermogens, Functies en Domeinen).
- Geen inline `style=` en geen inline handlers in `venster.js` of in de nieuwe CSS. De CSP blijft dus geldig.

## Toegankelijkheid
- `aria-labelledby` naar de h2 (venster.js:12 en 16): goed.
- Focus bij openen: het eerste veld krijgt de focus (bijvoorbeeld 1842). Bij sluiten gaat de focus naar de opener.
- De ✕ is 44×44 px, heeft `aria-label="Sluiten"` en een eigen focusring.
- `inert`: er is geen eigen `inert`, maar `showModal()` maakt de rest van de pagina vanzelf inert.
- Sectiemelding na sluiten: bij een geslaagde opslag wordt `toonOk` ná `sluit()` en `laadEnRender()` gezet, dus de melding kan worden voorgelezen. Zie bevinding 1 voor de "weg"-meldingen.

## Huisstijl
- De CSS gebruikt alleen bestaande tokens: `--card`, `--border`, `--petrol`, `--text`, `--orange`, `--fs-bloknaam`. De focusring volgt `.kruimel`.
- Backdrop: `.beheer-venster` is zelf een doorzichtige laag over het hele scherm (`position: fixed; inset: 0`) met `overflow-y: auto`. De kaart `.venster-kaart` ligt erin, 960px breed, met `margin: auto`. De grijze achtergrond is `::backdrop` met `rgb(0 0 0 / .4)`.

## Bevindingen
1. **Middel.** De "weg"-melding (`weg: sectieFout`) wordt gezet terwijl het venster nog modaal is, en het venster sluit pas daarna.
   - Plek: Domeinen 1938-1947, Vermogens 2292-2300, Onderdelen 3434-3437, Functies 3706-3710, Activiteiten 3021-3029.
   - Gevolg: een `role="alert"` die in een inerte sectie verschijnt, wordt door sommige schermlezers niet voorgelezen.
   - Voorstel: na `venster.sluit()` en `laadEnRender()` de tekst opnieuw zetten, bijvoorbeeld met `zetStatus`, of de melding pas na het sluiten laten tonen.
2. **Laag.** De backdrop gebruikt `rgb(0 0 0 / .4)` terwijl er al een token `--dimlaag` (`rgba(0,0,0,.45)`) is (style.css:37 en 1336). Gebruik het token.
3. **Laag.** Afwijking van de spec bij de afmetingen: de spec zegt `max-height: calc(100dvh - 32px)` met scroll binnen de kaart. De bouwer heeft de scroll op de laag gezet, zodat de keuzelijst en de datumkiezer niet worden afgesneden. Dat is bewust en gedocumenteerd in de CSS, en het levert hetzelfde op. Wel een lange kaart op desktop die buiten beeld uitsteekt in plaats van binnenin te scrollen. Alleen vermelden.
4. **Laag.** De dialoog staat in `lijstEl.parentElement` en niet binnen het element met de click-delegatie. Daardoor heeft elk scherm een eigen `venster.el.addEventListener`. Dat werkt, maar zorg dat nieuwe schermen dit ook doen.
5. **Laag.** Vermogens `bewaarBewerk` (main.js:2401) doet `if (!v) return` zonder te sluiten als het vermogen intussen weg is uit de lokale lijst. Het venster blijft dan met een stil Opslaan open. Annuleren werkt wel.
6. **Laag.** Dode selectors in style.css:999 en 1005-1008 (`.pijler-form:not([hidden])`, `> [hidden]`) kunnen blijven, maar het `:not([hidden])` is overbodig geworden.
7. **Laag.** `.claude/backlog.md` heeft CK-175 maar nog geen item CK-176. Dat is alleen administratie.
8. **Niet te controleren zonder browser:**
   - de datumkiezer in het venster;
   - focus bij Back-knop terwijl het venster open staat;
   - de weergave op iOS Safari (`position: fixed` plus `showModal`);
   - de leesvolgorde in een schermlezer.

## Eindoordeel
Geen hoge bevindingen. Klaar voor beoordelaar, met bevinding 1 als aanbeveling voor de toegankelijkheid.
