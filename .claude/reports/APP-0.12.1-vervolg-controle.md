# Vervolgcontrole APP 0.12.1 (CK-048, CK-050, CK-052)

Methode: diff gelezen, `npm run build` gedraaid, gericht gegrept in `src/main.js`, `src/keuzelijst.js`, `src/style.css`. De emulatortests zijn niet gedraaid (regels ongewijzigd). Er is niets in een browser uitgeprobeerd; dit is een code-review.

Build: geslaagd (28 modules, alleen de bekende waarschuwing over chunkgrootte). Geen blokkerende fouten gevonden.

## Wat gecontroleerd is en klopt
- Returnwaarde `laadEnRender`: alleen `bindHerlaad` in Beheer → Bestuursfuncties (`main.js:2974`) gebruikt `!== false`. De andere aanroepers (`await laadEnRender()` en `.catch`) negeren de waarde. De vroegere `return` zonder waarde in de lege-lijst-tak telt daar als gelukt. Goed.
- Dubbele listener na "Opnieuw laden" in Domeinen (`main.js:1699`): geen dubbele binding. Het herladen rendert `#app` en de lijst helemaal opnieuw, dus de listeners zitten op nieuwe elementen. `enterSlaatOp` en `bindHerlaad` zitten steeds op het nieuwe `structuur-form` en de nieuwe `structuur-lijst`.
- Domeinenoverzicht (`main.js:1083`): `bindHerlaad` zit één keer op `grid`, dat blijft bestaan. `renderStructuurGrid` (`:669`) verwijdert zelf eerst alle `.structuur-dyn`, en `laadGrid` gooit de oude fout ook weg. Goed.
- Enter: `enterSlaatOp` raakt alleen `input.form-input[type=text]` (zonder `.eigen-datum-tekst`) en inputs zonder type. Een textarea, radio, de eigen keuzelijst (knop) en een datumveld vallen er niet onder. In de domeinenlijst, het domeinformulier en de bestuursfunctie-bewerkrij is geen bestaande Enter-handler. Het gebruikt `knop.click()`; de klikhandlers hebben een `aria-disabled`/`aria-busy`-guard (`:1787`, `:1824`, `:3002`, `:3025`), dus een dubbele Enter slaat niet dubbel op.
- Verwijderde CSS: geen gebruik meer in `src/*.js` of `index.html` van `structuur-rij-info`, `picto-groot`, `volgorde-nr`, `functie-label`, `cel-domein`, `sectie-voet`. De `.zijmenu-binnen`-regel in de media-query was een duplicaat van de basisregel. Geen regressie gevonden.
- Datumkiezer: `binnenGrens` met vangnet `kalender.focus()` en `tabindex=-1`. Min na max leidt tot focus op de kalender, Escape blijft werken. De Vandaag-knop is disabled buiten min/max, een disabled knop vuurt geen click.
- Inlogfouten: `invalid-credential` zet beide velden op invalid en de tekst in de algemene live-region. `valideerVelden` wist ze bij de volgende poging. `aria-disabled` vervangt `disabled`, met een guard in de klikhandler.
- Automatisch uitloggen:
  - Eerste keer inloggen (geen key): `laatstActief = Date.now()`, dus geen onterechte uitlog.
  - Oude key van een vorige sessie: de `pointerdown`/`keydown` op het inlogscherm vernieuwt die voor `onAuthStateChanged` draait. Een verse login wordt dus niet meteen uitgelogd.
  - Meerdere tabbladen: `Math.max(laatstActief, localStorage)`; activiteit in een ander tabblad telt mee, met maximaal 60 s vertraging.
  - Zonder localStorage: try/catch rond lezen en schrijven; alleen het eigen tabblad telt. Een herladen na 8 uur logt dan niet uit, zoals in de code is toegelicht.
  - `onAuthStateChanged` vuurt niet bij een token-refresh, dus geen vals alarm.

## Bevindingen

### 1. Laag: laadfout op het Domeinenoverzicht staat in een flex-container
`src/style.css:525` `.structuur-dyn { display: flex; }` geldt ook voor `div.structuur-dyn.grid-fout` (`main.js:1093`). De melding en de testhint komen dan naast elkaar en de melding krijgt geen volle breedte. `.grid-fout` (`style.css` nieuwe regel) heeft alleen `grid-column: 1 / -1`.
Voorstel: `.grid-fout { grid-column: 1 / -1; display: block; }`, of `flex-direction: column`.

### 2. Laag: race bij "Opnieuw laden" in Beheer → Domeinen
`main.js:1699`: de retry roept `renderPijlersDomeinenBeheer` aan, en die schrijft na `await laadBestuursfuncties()` zonder controle `#app.innerHTML` (`:1553`). Navigeert de gebruiker tijdens het laden naar een andere pagina, dan wordt die pagina overschreven door het Domeinenbeheer. Het eerste renderen had hetzelfde risico, maar de retry maakt het zichtbaarder (een trage verbinding is net de reden voor een retry).
Voorstel: geef een `huidigeWeergave`-teller of token mee en breek af als die intussen veranderd is. Of controleer na de await of `knop.isConnected` nog klopt.

### 3. Laag: domein-omschrijving heeft geen maximum
`main.js:1589` en `:1899`: de textarea heeft geen `maxlength`. `omschrijvingVerplichtFout` controleert alleen het minimum, en `firestore.rules:208-226` begrenst de omschrijving van een domein niet (de naam wel, op 200). Bij de onderdelen is er wel een grens (500, `tekstTot`). Regeleinden in de textarea worden bovendien op de kaart (`main.js:712`) en op de plaat (`:1143`) samengevouwen, zonder `white-space: pre-line`.
Voorstel: `maxlength="500"` plus een maximumcontrole in `omschrijvingVerplichtFout(tekst, max)`, en een regel voor de domeinen in de rules. Daarna `white-space: pre-line` op `.kaart-omschrijving` en `.plaat-omschrijving`, of de textarea terug naar enkele regel.

### 4. Laag: inactiviteit telt alleen `pointerdown` en `keydown`
`main.js:98`. Een schermlezer of spraakbesturing die een knop activeert met een synthetische `click` zonder pointer- of toetsgebeurtenis telt niet als activiteit. Zo iemand wordt na 8 uur sneller uitgelogd dan bedoeld. Het risico is klein, want de meeste schermlezers sturen wel muis- of toetsevents.
Voorstel: ook `click` (en eventueel `touchstart`) in de lijst opnemen. Dat kost niets.

### 5. Laag: `signOut` mislukt, vlag blijft staan
`main.js:90-93`: `stilUitgelogd` wordt gezet vóór `uitloggen()`. Mislukt `signOut` (alleen `console.error`), dan blijft de gebruiker ingelogd en de vlag `true`. Bij een latere gewone uitlog verschijnt dan ten onrechte de melding "8 uur niets gedaan". `signOut` faalt zelden.
Voorstel: reset de vlag in de `catch` van `uitloggen`, of zet hem pas na het succes van `signOut`.

### 6. Laag (observatie): focusring op de kalenderdialoog
`keuzelijst.js` `kalender.tabIndex = -1`. Alleen in het vangnet (min na max) krijgt de dialoog zichtbaar focus. Controleer of een `outline: none` op `.eigen-kalender:focus` ontbreekt of juist wenselijk is. Niet in de browser bekeken.

## Eindoordeel
Geen hoge of middelzware bevindingen. Er zijn zes lage punten. Punt 3 (omschrijvinglengte) verdient een besluit vóór release, de rest kan mee in een later fixpakket. Niet getest in een echte browser: focusvolgorde na "Opnieuw laden", het scherm bij een lage viewport (`max-height: 500px`) en de weergave van de visueel verborgen kolomkoppen.
