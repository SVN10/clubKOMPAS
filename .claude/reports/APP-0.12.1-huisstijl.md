# Huisstijlanalyse clubKOMPAS v0.12.1 (branch test)

Gelezen: `src/style.css` (alles), `src/main.js`, `src/onderdelen.js`, `src/vermogens.js`, `src/keuzelijst.js` (HTML-opbouw en teksten). Normen: de clubKOMPAS-huisstijlregels en `.claude/specs/CK-046-besluiten.md` besluit 19 t/m 38. Er is niets gebouwd of hersteld en er is geen browser gebruikt. Alle bevindingen komen uit de code.

## Oordeel

De app voldoet **gedeeltelijk**. De basis is goed: lettergroottes lopen via tokens, de kopbalken kloppen, er is één lettertype en de focusringen zijn consistent. Er zijn ook drie echte hiaten:

- De kaartregels (12 px afronding, schaduw) en de regel voor secundaire knoppen (petrol rand) worden nergens gehaald.
- Er staan nog inline styles en hardgecodeerde kleuren.
- De vijf beheertabellen verschillen op kleine punten van elkaar (tekstgrootte, lege-toestand, bevestigingsteksten, pijlknoppen).

Aantallen: **kritiek 0, hoog 8, middel 13, laag 15.**

Eén punt vraagt eerst een besluit van Paul. De app is overal vierkant (afronding 0, 4 of 6 px, pills 999 px) en de knoppen hebben een lichte rand. Dat lijkt de bedoelde stijl, maar het botst met de geschreven regels (H1, H2). Pas dan de regel aan, niet de code.

## Wat goed is

- Alle lettergroottes in `style.css` gebruiken de tokens `--fs-*` (16/14/13, paragraaf 18, hoofdstuk 24, titel 40). De enige uitzondering is de titelbalk (32 px, mobiel 26 px, `style.css:661`, `:816`). Die is bewust, staat in besluit 38 en is in de code toegelicht.
- `.sectie-kop` is correct: petrol vlak en 4 px oranje onderbalk (`style.css:132-142`).
- Het enige webfont is Barlow Semi Condensed (`style.css:1`).
- Zijmenu 192 px, titelbalk 80 px, logo 90 px, kompas 35 px, tekstschaal en filterlabel "Toon" (alleen voor schermlezers) kloppen met besluit 24, 28, 36, 37 en 38.
- Rijen in de beheertabellen zijn witte kaarten met 1 px lijnen. De kolommen staan in een subgrid met 30 px ertussen (besluit 19 en 20) voor Domeinen, Bestuursfuncties, Projecten en Samenwerkingen.
- Zijmarges op mobiel zijn minstens 16 px (`.wrap`, `.kruimelpad`, `.overslaan`).
- Focusringen zijn oranje met een donkere binnenlijn, ook in donker thema.

## Bevindingen

### Hoog

**H1. Kaarten hebben geen 12 px afronding en geen schaduw.**
- `.card` (`style.css:194-198`) heeft alleen een rand. Dat geldt ook voor `.plaat-domein` (`:1157`), `.cijfer` (`:108`) en `.leeg-blok` (`:1023`).
- Afrondingen in de app: 0 px (kaarten, knoppen), 4 px (`:264`, `:279`, `:294`, `:424`, `:1024`, `:1213`), 6 px (`.inlog-kaart`, `:321`) en 999 px (pills). Nergens 12 px.
- Binnen één formulier zijn de velden 4 px afgerond en de knoppen vierkant.
- Voorstel: kies één waarde, zet die in een token `--radius` en pas hem overal toe. Of schrap de 12 px-regel als vierkant de bedoeling is.

**H2. Secundaire knop heeft geen petrol rand.**
- `.btn` gebruikt `border: 1px solid var(--border)` (`style.css:176`). De rand wordt pas bij hover petrol (`:180`).
- `#config-herlaad` krijgt de petrol rand als losse uitzondering (`:882`).
- Voorstel: zet de rand van `.btn` op `var(--petrol)` en haal de uitzondering weg.

**H3. De primaire actie is nergens oranje, behalve op de inlogkaarten.**
- Alle Opslaan-knoppen zijn `.btn` (secundair): `main.js:1483`, `:1765`, `:1883`, `:2085`, `:2535`, `:2564`, `:2736`, `:2993`, `:3116`, `:3136`, `:3155`.
- De toevoegknop is een gestippelde petrol knop (`.btn-toevoegen`, `style.css:258-271`). Die is niet hoofdletter, weight 600 en 1,5 px, dus anders dan `.btn` (500, hoofdletters, 1 px).
- "Uitloggen" is primair op de kaart Geen club (`main.js:894`) en secundair op de kaart Club laden lukt niet (`main.js:904`).
- Voorstel: Opslaan wordt `.btn.primary`. De toevoegknop krijgt dezelfde letterstijl als `.btn`. Leg vast welke "Uitloggen" primair is.

**H4. Inline `style=""` voor een vaste kleur.**
- `main.js:87` (`SOORT_KLEUR`), gebruikt op `:638` (kaart op Domeinenoverzicht) en `:1547` (Domeinen-tabel).
- Het is niet dynamisch: het zijn drie vaste kleuren.
- Voorstel: klassen `.stip.pijler`, `.stip.domein` en `.stip.overkoepelend` in de CSS, en `class` in plaats van `style`.

**H5. Hardgecodeerde kleuren buiten de tokens.**
- Omgevingsbalk: `style.css:858-860` (`#C9CDCD`, `#111212`, `#FF9E16`, `#46797B`, `#FFFFFF`). De opmerking zegt dat vaste kleuren de bedoeling zijn, maar vier daarvan zijn kopieën van bestaande tokenwaarden.
- Chevron-pijltjes als SVG met `%2346797B` en `%237DB1B3` (`:581`, `:589`, `:593`). Dit blok is bovendien dood, zie M12.
- Voorstel: eigen tokens `--omgeving-test-bg` enzovoort in `:root`, met dezelfde waarde in licht en donker.

**H6. Verkeerde tekst: "De volgorde wijzig je bij Toon: Alle soorten."**
- `main.js:1491`. Het woord "Toon" is sinds besluit 24 niet meer zichtbaar. De keuze heet "Alle soorten".
- Voorstel: "Kies Alle soorten om de volgorde te wijzigen." De schermlezertekst op `:1573` is al goed.

**H7. Bevestigingsvragen bij verwijderen verschillen en zijn niet in de stijl van de app.**
- Domeinen: "Item verwijderen? ..." (`main.js:1705`). Bestuursfuncties: "Bestuursfunctie verwijderen? ..." zonder naam (`:2907`). Vermogens en Projecten, Samenwerkingen en Commissies noemen wel de naam (`:2195`, `:2659`).
- Alle vier gebruiken de `confirm()` van de browser. Besluit 34 koos juist voor eigen keuzelijsten en datumkiezers.
- Het logo verwijderen (`main.js:3056-3066`) heeft helemaal geen bevestiging.
- Voorstel: één vorm `"<Soort> <naam> verwijderen? Dit kan niet ongedaan worden gemaakt."` voor alle tabellen en het logo. Een eigen bevestigingsvenster kan later.

**H8. Rijnummers zijn vet.**
- `.cel-nr { font-weight: 700 }` (`style.css:564`). Besluit 21 zegt: geen vette waarden, alleen de koprij is vet.
- Voorstel: weight 400 (`.volgorde-nr` op `:491` is dood, zie M12).

### Middel

**M1. Gewicht 500 wordt niet geladen.**
- `style.css:1` laadt alleen 400, 600, 700 en italic 400. Gewicht 500 staat op `.sectie-kop h2` (`:146`), `.btn` (`:171`) en `.card h3` (`:203`). De browser toont dat als 400.
- Voorstel: laad 500, of gebruik 600.

**M2. Dezelfde soort waarde heeft twee groottes.**
- `.cel-functie` is 14 px (`style.css:567`: Eindverantwoordelijke in Domeinen, de telling in Bestuursfuncties).
- `.cel-eigenaar` heeft geen regel en erft 16 px (`main.js:2451`, Eigenaar in Projecten, Samenwerkingen en Commissies). Op mobiel wordt hij wel 14 px (`style.css:1069`, `:1076`).
- Voorstel: kies één grootte voor de bestuursfunctiekolom. De tekstschaal zegt 16 px voor waarden. Houd `.cel-nr` (14 px, `:564`) apart.

**M3. Gestapelde rijen op mobiel hebben alleen bij Projecten en Samenwerkingen een label.**
- `.cel-label` ("Eigenaar: ") staat alleen in de onderdelen (`style.css:1048`, `:1071`, `:1077`).
- Domeinen en Bestuursfuncties tonen op mobiel kale waarden, zoals "Pijler / Voorzitter / 2 vermogens", zonder kop of label.
- Voorstel: `.cel-label` ook in `domein-rij` en `functie-rij`.

**M4. Pijlknoppen verschillen van de potlood- en prullenbakknoppen.**
- Pijlen (`.btn-volgorde`) hebben geen tooltip, de andere twee wel (`.tip`, `main.js:519` tegenover `:1536`, `:1938`, `:2445`, `:2804`).
- De schermlezertekst is verschillend: "Omhoog: naam" (`main.js:1536`, `:1938`, `:2804`) tegenover "naam omhoog" (`:2445-2446`).
- Voorstel: één helper `pijlKnopHTML()` die ook de tooltip en één tekstvorm geeft.

**M5. Lege-toestand teksten en vorm verschillen per tabel.**
- Domeinen: `<p class="lijst-leeg">Geen domeinen van deze soort.</p>` (`main.js:1516`). Dat staat er ook als er helemaal geen domeinen zijn en er geen filter actief is.
- Bestuursfuncties: "Nog geen bestuursfuncties." (`:2785`), ook platte tekst.
- Vermogens, Projecten, Samenwerkingen en Commissies: een `.leeg-blok` met uitleg (`:2001`, `:2463`).
- Overige varianten: "Nog geen domeinen. Voeg ze toe via Beheer." (`:622`), "Nog geen vermogens" zonder punt (`:636`, `:1033`) en met punt (`:1962`), "Er zijn geen projecten." (`:1009`).
- Voorstel: Domeinen en Bestuursfuncties krijgen ook een `.leeg-blok` met uitleg. Domeinen krijgt aparte teksten voor "geen enkel domein" en "geen domein van deze soort". Kies één vorm met of zonder punt.

**M6. Validatieteksten zijn niet eenduidig.**
- "Verplicht veld" (`main.js:456`, `:684`, `:3221`), "E-mailadres verplicht" en "Wachtwoord verplicht" (`:3189-3190`), "Vul een naam in." (`vermogens.js:41`), "Kies een domein." (`:2112`) tegenover "Kies een bestuursfunctie" (`:1650`).
- Wel of geen punt: "Minimaal 2 tekens" (`:458`) en "Tussen 2 en 100 tekens" (`:2824`) hebben geen punt. "Een naam heeft minimaal 2 tekens." (`vermogens.js:49`) wel.
- Dubbele naam: "Deze bestuursfunctie bestaat al" (`:324`, geen punt) tegenover "Er is al een project met deze naam." (`:327`).
- De naamvelden van Domeinen en Bestuursfuncties worden minder streng gecontroleerd dan die van Vermogens en Projecten.
- Voorstel: één regel voor leeg ("Vul de naam in."), voor lengte en voor dubbel, altijd met punt. Gebruik overal dezelfde naamcontrole.

**M7. Omschrijving is in Domeinen een enkele regel en in Projecten een tekstvak.**
- Domeinen: `<input type="text">`, verplicht (`main.js:1470`, `:1649`). Projecten en Samenwerkingen: `<textarea rows="3">`, niet verplicht (`:2412`).
- Voorstel: gebruik overal dezelfde veldsoort en dezelfde regel (verplicht of niet). Markeer ook overal of een veld optioneel is. Nu staat alleen bij Periode "(optioneel)" (`:2385`).

**M8. Beheerpagina's hebben geen paginatitel (h1).**
- Home, Domeinenoverzicht en Vermogensoverzicht hebben een `.pagina-kop` met h1 (`main.js:953`, `:963`, `:1045`). Beheer-Domeinen, Vermogens, Onderdelen, Bestuursfuncties, Club en Mijn account beginnen meteen met een h2 in de sectiekop (`:1433`, `:1858`, `:2328`, `:2720`, `:2970`, `:3101`).
- Gevolg: kop-niveaus lopen niet door en de pagina's lijken in opmaak niet bij elkaar te horen.
- Voorstel: ook op deze pagina's een `.pagina-kop` met h1.

**M9. Focus in een tekstveld is zwakker dan overal elders.**
- `.form-input:focus { outline: none; border-color: var(--petrol) }` (`style.css:302`). Alleen de randkleur verandert. Knoppen en links krijgen een oranje ring met donkere lijn (`:944`, `:959`, `:1192`, `:1207`). `.tussen-link` heeft een petrol ring (`:390`).
- Voorstel: gebruik overal dezelfde focusstijl.

**M10. Tokenwaarden en primaire knop wijken af van de huisstijltabel.**
- `--text` is `#111212` (`style.css:16`), de tabel zegt `#1A1A2E`. `--muted` is `#6F6E6E` (`:17`), de tabel zegt `#6B7B8D`.
- `.btn.primary` heeft donkere tekst (`--on-orange`, `:15`, `:183`). De regel zegt witte tekst. Wit op `#FF9E16` heeft te weinig contrast, dus de code is hier waarschijnlijk beter dan de regel.
- Voorstel: bevestig dat dit de HCA-huisstijl is en pas de huisstijltabel aan. De code hoeft niet te veranderen.

**M11. Breekpunten voor kerncijfers en kaartengrid.**
- De regel is: 3 kolommen op desktop, 1 kolom onder 480 px. De code gaat naar 2 kolommen onder 900 px en naar 1 kolom onder 600 px (`style.css:519-520`). De plaat wisselt op een containerbreedte van 520 px (`:1184`).
- Kerncijfers: 5 naast elkaar vanaf 901 px viewport (`:1136`). Met het zijmenu is de inhoud dan maar ongeveer 680 px, dus ongeveer 120 px per tegel. Onder 900 px staan ze in 2 kolommen, met een weesje in de laatste rij.
- Voorstel: laat de tegels op `auto-fit` en `minmax` of op een containerbreedte reageren, en zet de grenzen op 480 px.

**M12. Dode en dubbele CSS.**
- Niet gebruikt in de JS:
  - `.volgorde-nr` (`style.css:488-494`)
  - `.picto-groot` (`:485`)
  - `.functie-label` (`:500-506`)
  - `.structuur-rij-info` (`:469-476`)
  - `.cel-domein` (`:1116`)
  - `.sectie-voet` (`:1128`)
  - `.structuur-rij.beheer-rij:first-child` (`:546`)
  - Het blok `select.form-input` met pijl-achtergrond en donkere varianten (`:577-594`): de echte selects zijn verborgen (`.eigen-verborgen`, `:1195`).
- Overschreven of dubbel:
  - `.zijmenu-binnen` staat drie keer (`:680`, `:787`, `:828`; de laatste is overbodig).
  - `.zijmenu-kop` (`:688` en `:790`), `.zijmenu-onder` en `.zijmenu-account` (`:707-708` en `:792-793`), `.naam-sessie` line-clamp 2 en 1 (`:711` en `:794`).
  - `.cijfers` op 700 px staat drie keer (`:480`, `:617`, `:1132`).
  - Het donkere palet staat twee keer volledig (`:34-51` en `:52-67`).
  - Niets in de gelezen JS zet `data-theme`. Controleer `index.html` voordat je het tweede blok weghaalt.
- Lege kopjes: `/* Hero */` (`:165`) en `/* Versie-info */` (`:457`).

**M13. Kleurcodering van de soorten is niet gelijk.**
- De pill kleurt pijler petrol, ondersteunend oranje en overkoepelend grijs (`main.js:87`).
- Op de plaat hebben pijler en ondersteunend dezelfde petrol bovenrand en alleen overkoepelend is grijs (`style.css:1158-1161`).
- Voorstel: kies één kleur per soort en gebruik die op beide plekken.

### Laag

- **L1.** `main.js:1346` zet `--paneel-top` via een inline `setProperty` met altijd `0px`. De CSS valt zelf terug op `0px` (`style.css:821`, `:836`). Verwijder de regel.
- **L2.** `.top-bar` heeft `height: 80px` (`style.css:652`) terwijl `--kop-h: 80px` bestaat (`:632`). Gebruik het token.
- **L3.** Er zijn geen tokens voor ruimte en regelhoogte. Opvulling wisselt tussen 12/14, 14 en 16 (`:197`, `:424`, `:280`, `:1025`, `:1159`). Regelhoogtes zijn 16, 18, 19, 21, 22, 23 en 26 px. Drie bijna gelijke blokken met 4 px linkerrand: `.pijler-form`, `.pijler-bewerk-form`, `.leeg-blok` (`:274`, `:420`, `:1023`).
- **L4.** Drie identieke regels voor "lege tekst" (`.groep-leeg` `:1020`, `.lijst-leeg` `:1127`, `.plaat-leeg` `:1175`) en twee identieke regels voor `.plaat-vermogen` en `.plaat-onderdeel` (`:1171-1181`). `.grid-leeg` (`:1129`) is 16 px zonder cursief, dus afwijkend. Hint- en toelichtingsklassen wisselen tussen `--muted` en `--text` voor dezelfde rol (`:962`, `:1022`, `:1122`).
- **L5.** Lijndikte: `.form-input` en `.btn-toevoegen` zijn 1,5 px (`:260`, `:294`), de rest 1 px. De datumkiezer heeft een 1,5 px veld naast een 1 px knop (`:1232`, `:1235`).
- **L6.** Letterafstand voor labels wisselt: `.form-label` en `.zijmenu-kop` .08em, `.beheer-kop` en `.eigen-groep` .06em (`:289`, `:691`, `:560`, `:1228`).
- **L7.** Streepjes door elkaar: lange streep `—` (`main.js:1548`, `:2374`) en korte streep `–` (`:610`, `:1116`). Domeinen toont `—` zonder verborgen tekst, de onderdelen via `leeg()` wel (`:2374`).
- **L8.** De statusfilter van Projecten heet "Alle projecten" (`main.js:2324`, `:2594`), naast "Alle soorten" en "Alle domeinen". Voorstel: "Alle statussen".
- **L9.** Klassen van de login (`.tussen-link`, `.tussen-hint`) staan in de beheertabel en beheerhints (`main.js:1540`, `:2340`). Commissies gebruiken `.samenwerking-rij` (`:2448`, `style.css:1046`). Hernoem naar neutrale namen.
- **L10.** `Fout: ${e.code}` toont een systeemcode aan de gebruiker (`main.js:707`). `.inlog-kaart code` gebruikt een systeem-monospace (`style.css:893`), dus een tweede lettertype in de technische tussenkaarten.
- **L11.** De font laadt via `@import` in de CSS (`style.css:1`), dat vertraagt het tekenen. Overweeg `<link rel="preconnect">` en `<link rel="stylesheet">` in `index.html`. Dat bestand is niet gelezen.
- **L12.** Mobiel: `.top-bar` links 8 px (`:808`). `.sectie-lijf` houdt 20 px opvulling binnen 16 px marge, dus 36 px per kant (`:159`). `.btn` is ongeveer 37 px hoog terwijl de icoonknoppen 44 px zijn (`:1145`).
- **L13.** Placeholders wisselen: "Naam" (`main.js:1460`), "Bijv. Ledenwerving" (`:1874`), "Bijv. Bestuurslid Hockey" (`:2732`). De bewerkvelden in Domeinen hebben er geen (`:1742`).
- **L14.** Kolomkop "Icon" (`main.js:1523`, besluit 31) staat naast het formulierlabel "Pictogram" (`:1479`). Dat is Pauls besluit; noem het hier alleen als bewuste afwijking.
- **L15.** De Vermogens-tabel heeft geen subgrid zoals de andere vier (`style.css:1085-1113`). Met drie kolommen merk je het niet, maar besluit 20 noemt Vermogens uitdrukkelijk.

## Voorstel: volgorde van aanpak

1. **Eerst een besluit van Paul** over H1, H2 en M10: vierkante stijl of 12 px, petrol rand, tokenwaarden en donkere tekst op oranje. Daarna volgen H3 en M13 daaruit.
2. **Snel en veilig** (klein, geen ontwerpkeuze): H4 (stip-klassen), H6 (tekst), H8 (vet weg), H5 (tokens voor de omgevingsbalk), M1 (gewicht 500), L1, L2.
3. **Tabellen gelijktrekken** (een sessie): H7, M2, M3, M4, M5, M6, M7, L7, L8. Bouw gedeelde helpers voor pijlknoppen, lege-toestand, bevestiging en validatieteksten. Daarmee verdwijnt veel dubbel werk.
4. **Opruimen**: M12, L3, L4, L9. Doe dit na stap 3, want dan staat vast welke klassen blijven.
5. **Daarna**: M8 (h1 op beheerpagina's), M9 (focus), M11 (breekpunten), L-rest.
