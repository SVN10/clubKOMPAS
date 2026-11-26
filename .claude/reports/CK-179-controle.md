# CK-179 — gecombineerde controle (test, beveiliging, toegankelijkheid, huisstijl)

Datum: 26-11-2026. Alleen de wijzigingen bekeken (`git diff` en de twee nieuwe scripts). Geen code aangepast.

## Uitkomst tests en build
- `npm run test:regels`: 198 van 198 groen (27 suites), ook de 4 nieuwe CK-179-tests.
- `npm run build`: groen. Alleen de bekende melding over de grote chunk (meer dan 500 kB).

## Oordeel
Naar TST met aandachtspunten. Geen kritieke en geen hoge bevindingen.

## Regels: geenNieuweOmschrijving
- Bij create is `resource` null, dus een omschrijving wordt altijd geweigerd (ook `''`). Dat is goed.
- Bij update moet `omschrijving` in het oude document staan en gelijk blijven. Volgorde-writes, tellerwrites (vermogens) en batches op documenten met een oude omschrijving blijven daarom werken. Een test dekt dit.
- Een omweg via `set` (overschrijven) valt onder update, met dezelfde controle. Een omschrijving van het ene document naar het andere kopiëren lukt niet, want de waarde moet gelijk zijn aan die in hetzelfde document. Alleen een beheerder schrijft (P0d). Geen omweg gevonden.
- Schrijfpaden in src/ sturen geen omschrijving meer (`bewerkOnderdeel` en domein bewerken sturen `deleteField()`; toevoegen stuurt het veld niet).

## Bevindingen

### 1. Volgorde van uitrollen: eerst de regels, dan de app (middel)
**Bestand:** `firestore.rules:166-182`, `src/onderdelen.js:130`
**Wat er mis is:** Onder de oude regels eist `hasAll` het veld `omschrijving` bij projecten, samenwerkingen en commissies. De nieuwe app (toevoegen zonder omschrijving, bewerken met `deleteField()`) faalt dan. Omgekeerd faalt een oud, nog open tabblad onder de nieuwe regels: het stuurt `omschrijving: ''` mee bij toevoegen. Het opruimscript werkt ook alleen onder de nieuwe regels.
**Voorstel:** De backlog noemt dit al. Houd de volgorde strikt aan: eerst regels, dan app, dan het opruimscript. Doe dat zowel in test als in productie. Laat gebruikers na de release de pagina herladen.

### 2. Oude scripts schrijven nog een omschrijving (laag)
**Bestand:** `scripts/inrichten-domeinen-hca.mjs:11,52,64` en `scripts/import-hca.mjs:10-15,50`
**Wat er mis is:** Deze scripts zetten bij nieuwe domeinen nog `omschrijving` (en `verantwoordelijke`). Onder de nieuwe regels wordt dat geweigerd. Sinds P0d mislukte dit al door `verantwoordelijke`, dus het zijn in feite verouderde scripts.
**Voorstel:** Verplaats ze naar `scripts/archief/`, of haal `omschrijving` en `verantwoordelijke` eruit, zodat niemand ze per ongeluk draait.

### 3. Dode code en CSS (laag)
- `src/main.js:127` `SOORT_KLEUR` wordt nergens meer gebruikt. Hetzelfde geldt voor `src/style.css:246-253` (`.stip`, `.stip-domein`, `.stip-overkoepelend`).
- `src/style.css:172` `.sectie-kop .toel`: de `toel`-span is uit `plaatSectieHTML` gehaald. Controleer of `.toel` elders nog voorkomt; zo niet, dan kan de regel weg.
- `src/style.css` (rond regel 569): het commentaar "Hashtag op de domeinkaart (CK-032)" staat er nog, maar de regels eronder zijn weg.
- `src/main.js:3780`: het commentaar "Bevestiging na opnieuw tekenen: [melding, tekst, knop ...]" hoorde bij `CLUB_SUCCES`, dat is verwijderd.
- `src/main.js:3793`: `meldingenHTML('club-ok', 'club-fout')`. Fouten gaan naar `club-form-fout` in het venster, dus `club-fout` wordt nooit gevuld. Kan blijven als vangnet; anders `null` meegeven.
- Klasse `cel-vermogens` op de kolom "Bevat" (`src/main.js:1718`): de naam klopt niet meer. Alleen cosmetisch.
- `.profiel-form-wrap` is niet dood: Mijn account (`src/main.js:3928`) gebruikt het nog. `CLUB_SUCCES`, `OMSCHRIJVING_MAX`, `normaliseerOmschrijving`, `omschrijvingFout`, `.pill` en `.status-label` zijn netjes weg.
**Voorstel:** De dode regels en het verweesde commentaar weghalen.

### 4. Club-venster: een logo dat laat binnenkomt (laag)
**Bestand:** `src/main.js` (renderClubBeheer, `input.addEventListener('change', ...)`)
**Wat er mis is:** De logica klopt: `undefined` betekent ongewijzigd, `''` betekent weghalen (`deleteField()`) en een tekst is een nieuw logo. `huidigProfiel` wordt goed bijgewerkt, ook als het logo ongewijzigd blijft, en de favicon verandert alleen als het logo verandert. Een onleesbaar bestand geeft een foutmelding (`bestand-onleesbaar`, `bestand-te-groot`, `logo-te-groot`) en laat de eerdere keuze staan. Eén randgeval: sluit je het venster terwijl een groot bestand nog wordt ingelezen, en open je het direct opnieuw, dan zet de oude leesactie alsnog `nieuwLogo`. Het logo is dan wel zichtbaar in het voorbeeld, dus niet onzichtbaar.
**Voorstel:** Geef elke opening een volgnummer (`const ronde = ++teller`) en negeer het resultaat als `ronde` niet meer de huidige is.

### 5. Club-tabel: lege waarde wordt voorgelezen als streepje (laag, toegankelijkheid)
**Bestand:** `src/main.js` (renderClubBeheer, `leeg('—')` bij afkorting en seizoen)
**Wat er mis is:** Hier staat een kale "—" zonder tekst voor schermlezers. Elders (`renderOnderdeelBeheer`) staat het streepje met `aria-hidden` en een `sr-only`-label. De rollen (`table`/`row`/`columnheader`/`cell`), het `aria-label` "Clubprofiel", de alt-tekst van het logo en de knop "Bewerken: Clubprofiel" zijn in orde.
**Voorstel:** Gebruik hetzelfde patroon: `<span aria-hidden="true">—</span><span class="sr-only">niet ingevuld</span>`.

### 6. Focus op het venster zonder zichtbare focusrand (laag, toegankelijkheid)
**Bestand:** `src/venster.js:28,68`, `src/style.css:1341`
**Wat er mis is:** De keuze is verdedigbaar. Een schermlezer leest bij focus op de `<dialog>` de titel voor (`aria-labelledby`), Tab gaat naar het eerste element en Enter doet niets ongewensts (`enterSlaatOp` reageert alleen op tekstvelden). Wel ziet een toetsenbordgebruiker na het openen nergens een focusrand, door `outline: none`. Dat is in de praktijk aanvaardbaar, want het hele venster is het nieuwe element in beeld.
**Voorstel:** Laten zo, en dit bij CK-177 als bewuste keuze noteren. Of gebruik `:focus-visible` met een subtiele rand op `.venster-kaart`.

### 7. Link "Bevat" zonder naam van het domein (laag, toegankelijkheid)
**Bestand:** `src/main.js:1691`
**Wat er mis is:** De link "3 projecten" heeft geen `aria-label` met de naam van het domein. De vermogenslink in dezelfde kolom heeft die wel. Door de context van de rij in de tabel voldoet het aan WCAG 2.4.4, maar het is ongelijk.
**Voorstel:** Voeg `aria-label="${esc(tekst)} bij ${esc(item.naam)}"` toe.

## XSS
Alle nieuwe HTML is ge-escaped. Dat geldt voor de domeinkaartjes (`esc(item.naam)` en `esc(functie)`), de Bevat-link (`data-nav` is `esc(item.bevat)`, en `bevat` moet in `SOORT_ONDERDEEL` staan) en de club-tabel (naam, afkorting en seizoen via `esc`). Het logo gaat in tabel en venster via `veiligLogo` (strikte data:image-regex) en `esc`. Een nieuw logo komt uit `leesLogoBestand` en wordt bij tonen opnieuw door `veiligLogo` gehaald. In het opruimscript gaat de terminaluitvoer via `veilig()`. Geen bevindingen.

## Samenvatting
- Kritiek: 0
- Hoog: 0
- Middel: 1 (volgorde van uitrollen, staat al in de backlog)
- Laag: 6
