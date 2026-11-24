# App-brede analyse clubKOMPAS v0.13.0 (test, huisstijl, toegankelijkheid, AVG)

Datum: 24 november 2026 · Branch `test` (gelijk aan main, commit 4bb42cb) · Herhaling van de analyse van v0.12.1.
Methode: de zes rapporten van v0.12.1 gelezen, `CHANGELOG.md` (0.12.2, 0.13.0), `firestore.rules`, `vercel.json`, `index.html`, `src/style.css`, `src/keuzelijst.js` en gerichte delen van `src/main.js` (helpers, login, auto-uitloggen, Domeinen, Bestuursfuncties, Club, plaat, kerncijfers). `npm run build` slaagt (29 modules, bundel 712 kB, was 659 kB; alleen de bekende chunkwaarschuwing).
**Niet gedaan:** de app in een browser of met een schermlezer geprobeerd (alles is code-review), de emulatortests (doet de andere agent), beveiliging (andere agent), de consoleinstellingen van Firebase en Vercel. Contrastwaarden zijn berekend. De CSP is niet in een browser getoetst; wel is er geen enkel inline `style=`-attribuut meer in `src/*.js` en `index.html`.

## Eindoordeel

De code doet wat de specs zeggen. De bevindingen van v0.12.1 zijn bijna allemaal echt opgelost. Er is geen kritieke en geen hoge bevinding. Er zijn 3 middelpunten (twee zijn AVG-poorten die zonder code opgelost worden) en 17 lage punten. De nieuwe punten komen vooral uit P0d: teksten die een lid naar Beheer sturen, en een kleine fout in de keuzelijst. De AVG-basis (CK-049) is nog niet begonnen; P0d zelf is wel klaar.

| Onderdeel | Oordeel | Hoog | Middel | Laag |
|---|---|---|---|---|
| Test | ✅ | 0 | 1 | 7 |
| Huisstijl | ✅ met kleine afwijkingen | 0 | 0 | 6 |
| Toegankelijkheid (WCAG 2.1 AA) | ✅ geen AA-blokkade gevonden | 0 | 0 | 6 |
| AVG/compliance | 🟡 acceptabel voor één beheerder, niet klaar voor ledendata | 0 | 2 | 3 |

## Opgelost sinds v0.12.1 (gecontroleerd in de code)

| Oude bevinding | Status | Bewijs |
|---|---|---|
| Test H1: lege pagina bij laadfout op Domeinen en Bestuursfuncties | ✅ | `laadfoutHTML`/`bindHerlaad` `main.js:624-640`, gebruikt op `:1669`, `:1737`, `:2974`, `:3014` |
| Test M1: Domeinenoverzicht leeg bij fout | ✅ | `main.js:1110-1130`, `laadGrid` met `grid-herlaad` |
| Test M2 / compliance: geen veldcontrole in de regels | ✅ | `firestore.rules` `geldigProfiel`, `geldigeBestuursfunctie`, `geldigDomein`, `geldigLogo` |
| Test M3: domeinnaam zonder maximum | ✅ | `naamFout(naam, 200)` `main.js:1831`, `:1965` |
| Test M4: geen tests voor P0c en omgevingsguard | ✅ (niet gedraaid) | `tests/regels.test.mjs:1272` (P0c), `:1326` (guard), `src/omgeving.js`; 130 tests volgens changelog |
| Test M5 / huisstijl L10: `Fout: <code>` op het inlogscherm | ✅ | `main.js:~812`: vaste tekst "Inloggen is niet gelukt. Probeer het opnieuw." |
| Test L1-L3: dode code (`counter.js`, assets, ongebruikte import, `huidigeRol`) | ✅ | bestanden weg; `huidigeRol` wordt nu gebruikt door `isBeheerder` |
| Test L11/L13: Enter, pijlknop-labels, punt achter validatieteksten | ✅ | `enterSlaatOp` `main.js:521`, "Omhoog: X" overal |
| Vervolgcontrole 1: `.grid-fout` in een flex-container | ✅ | `style.css:1138` `display: block` (staat na `:525`) |
| Vervolgcontrole 2: race bij "Opnieuw laden" in Domeinen | ✅ | `alsNog` `main.js:1577`, `:1738` |
| Vervolgcontrole 3: omschrijving domein zonder maximum | ✅ | tekstvak, `omschrijvingVerplichtFout`, regels 500 |
| Vervolgcontrole 4: alleen `pointerdown`/`keydown` telt als activiteit | ✅ | `click` toegevoegd `main.js:98` |
| Vervolgcontrole 5: vlag `stilUitgelogd` blijft staan bij mislukte `signOut` | ✅ | reset in `catch` `main.js:98` |
| Toegankelijkheid H1: veldfouten inlogscherm | ✅ | `valideerVelden`, `zetVeldFout`, `aria-describedby` `main.js:760-815` |
| Toegankelijkheid H2: focus kwijt in datumkiezer | ✅ | `binnenGrens`, vangnet `kalender.focus()` `keuzelijst.js:~226-245` |
| Toegankelijkheid H3: rand invoervelden 1,48:1 | ✅ | `--rand-invoer` `style.css:15`; berekend: licht 3,38:1 op wit en 3,10:1 op `--surface`; donker 3,69:1 op kaart en 4,13:1 op surface |
| Toegankelijkheid M1/M2: geen regio's en geen h1 | ✅ (zie N-A11-4) | `role="region" aria-labelledby` op alle `.sectie` behalve de plaat; h1 op elke pagina |
| Toegankelijkheid M3: `.toel` 4,05:1 | ✅ | `style.css:167` zonder `opacity` (4,90:1) |
| Toegankelijkheid M4: foutrand eigen keuzelijst en datum | ✅ | `volgAttributen` zet de klasse `fout` `keuzelijst.js:40-50` |
| Toegankelijkheid M5: reflow bij 400 % | ✅ | `style.css:793` `@media (max-height: 500px)` |
| Toegankelijkheid M6/M7: kolomkoppen en `role="cell"` | ✅ | koprij `sr-only` `style.css:1002-1084`; `role="cell"` in de bewerkrij |
| Huisstijl H1/H2: afronding, schaduw, rand knop | ✅ besluit | besluit 39: vierkant blijft |
| Huisstijl H3: Opslaan primair | ✅ deels | `.btn.opslaan` `style.css:202`, 9 plaatsen; account niet (zie N-HS-1) |
| Huisstijl H4/H5: inline kleur, hardgecodeerde hex | ✅ | `stip-*`-klassen `style.css:254-261`; geen `style=` meer; geen losse hex buiten tokens |
| Huisstijl H6: hint "Toon: Alle soorten" | ✅ | zin in `main.js:~1760` "bij Alle soorten" |
| Huisstijl H8: rijnummers vet | ✅ | `.cel-nr` `style.css:568` niet vet |
| Huisstijl M1: gewicht 500 niet geladen | ✅ | `@font-face` 500 `style.css:4` |
| Huisstijl M4-M7: tabellen onderling gelijk | ✅ grotendeels | gedeelde helpers; zie N-HS-3 |
| Huisstijl M12: dode CSS | ✅ | geen gebruik meer van de oude klassen |
| Compliance K1 / test M2: P0d | ✅ | `isBeheerder` `firestore.rules:17-20`, schrijven overal alleen voor beheerder |
| Compliance M4: Google Fonts | ✅ | lettertypen lokaal `public/fonts/`; geen externe URL meer in `src/` en `index.html` |
| Compliance L3: logo zonder groottegrens, SVG | ✅ | `geldigLogo` max 700.000, alleen PNG/JPG/WebP; `veiligLogo` `main.js:28-31` |
| Sessies onbeperkt open (laag) | ✅ | auto-uitloggen na 8 uur `main.js:86-103` |

## Nog open (uit v0.12.1) en nieuw

| Nr | Onderdeel | Ernst | Kort | Bestand:regel |
|---|---|---|---|---|
| C-1 | Compliance | middel | Geen privacyverklaring, link in app, register, verwerkersovereenkomst, procedures (CK-049) | `index.html`, `main.js:~940` (footer) |
| C-2 | Compliance | middel | Geen procedure voor het toekennen en intrekken van de rol `beheerder` (nieuw door P0d) | `scripts/migreer-club.mjs:165` |
| C-3 | Compliance | laag | Geen hulptekst "geen namen of contactgegevens" bij omschrijvingen | `main.js:~1620`, `:~2746` |
| C-4 | Compliance | laag | `auth/user-not-found` verraadt of een account bestaat | `main.js:799` |
| C-5 | Compliance | laag | Nieuwe localStorage-sleutel `clubkompas-laatst-actief` ontbreekt in het register | `main.js:88` |
| T-1 | Test | middel | Teksten sturen een lid naar Beheer, dat hij niet heeft (nieuw door P0d) | `main.js:724`, `:1242`, `:1248` |
| T-2 | Test | laag | `bindHerlaad` en `enterSlaatOp` krijgen `null` als de gebruiker tijdens het eerste laden wegnavigeert | `main.js:1733-1744`, `:3010-3016` |
| T-3 | Test | laag | Focus gaat verloren na "Opnieuw laden" voor een lid (geen `.cijfer-link`) | `main.js:1130` |
| T-4 | Test | laag | Mislukt `laadRol`, dan is Beheer stil verborgen (bewust, in `P0d.md`) | `main.js:285-294` |
| T-5 | Test | laag | `bevestigVerwijderen` wordt maar op 2 van 5 plaatsen gebruikt | `main.js:2378`, `:2841`, `:3260` |
| T-6 | Test | laag | `failed-precondition` wordt overal "bestaat niet meer" | `main.js:345`, `:360` |
| T-7 | Test | laag | Domeinen controleren niet op een dubbele naam; de kerncijfers linken niet gelijk (`vermogens` tegenover `vermogensbeheer`) | `main.js:1095`, `:1266` |
| T-8 | Test | laag | Bundel 712 kB | `vite build` |
| HS-1 | Huisstijl | laag | Mijn account: drie knoppen blijven secundair, besluit 40 zegt elk formulier | `main.js:3319`, `:3339`, `:3358` |
| HS-2 | Huisstijl | laag | `.cijfers`-label zonder rol; kleine resten uit v0.12.1 | `main.js:1091`, `:1263` |
| HS-3 | Huisstijl | laag | Beheertabellen: "Alle projecten" als statusfilter, streepjes `—`/`–`, Vermogens zonder subgrid, labels bij gestapelde rijen alleen bij Projecten en Samenwerkingen | `main.js:2508`, `:1723`; `style.css:1100-1125` |
| HS-4 | Huisstijl | laag | `--paneel-top` wordt nog inline gezet (altijd `0px`) | `main.js:1491` |
| HS-5 | Huisstijl | laag | Club heeft een `sr-only` h1, de andere beheerpagina's een zichtbare h1 in de kop | `main.js:3172` |
| HS-6 | Huisstijl | laag | Klassennamen `.tussen-link`/`.tussen-hint` buiten de tussenkaarten; geen tokens voor ruimte | `main.js:1715`, `:2524` |
| A-1 | Toegankelijkheid | laag | De uitlogmelding wordt tegelijk met de live-region getekend, dus mogelijk niet aangekondigd (nieuw) | `main.js:833-836` |
| A-2 | Toegankelijkheid | laag | De datumknop krijgt na een fout `aria-describedby` en `aria-invalid` terug (nieuw) | `keuzelijst.js:40-50` en `:261-262` |
| A-3 | Toegankelijkheid | laag | `.form-input:focus` zonder oranje ring, geen `::placeholder`-kleur, formaat `dd-mm-jjjj` alleen als placeholder | `style.css:329`; `keuzelijst.js:~209` |
| A-4 | Toegankelijkheid | laag | De plaatsecties zijn geen regio; `role="presentation"` bij groepskoppen; `aria-live` op de maandtitel | `main.js:1139`; `keuzelijst.js:115`, `:326` |
| A-5 | Toegankelijkheid | laag | Vaste hoogtes (`height: 44px`, `38px`) en `line-clamp` bij tekstafstand | `style.css:577`, `:801` |
| A-6 | Toegankelijkheid | laag | Na paginawissel gaat de focus naar `<main>`, niet naar de h1 | `main.js:1393` |

## 1. Test (doet de code wat de specs zeggen)

**Hoog:** geen.

**Middel**
- **T-1. Een lid leest dat hij naar Beheer moet.** Een lid heeft sinds P0d geen Beheer. Drie teksten verwijzen er toch naar: `main.js:724` ("Nog geen domeinen. Voeg ze toe via Beheer."), `:1242` en `:1248` (lege plaat: "…toegevoegd via Beheer"). Voorstel: kies de tekst met `isBeheerder()`: een beheerder krijgt de huidige zin, een lid "Er zijn nog geen domeinen. Vraag een beheerder ze toe te voegen."

**Laag**
- **T-2.** Na `await laadEnRender()` zoekt `main.js:1735-1744` (Domeinen) en `:3012-3016` (Bestuursfuncties) de lijst en het filter opnieuw op. Navigeert de gebruiker intussen weg, dan is `lijstNu` `null` en geeft `bindHerlaad(null, …)` een TypeError in de console (geen schade, wel een onbehandelde afwijzing). Voorstel: `if (!lijstNu?.isConnected) return` na de eerste await.
- **T-3.** `bindHerlaad(grid, …, () => document.querySelector('.cijfer-link'))` (`main.js:1130`) geeft `null` voor een lid, want zijn kerncijfers zijn geen link. Na een gelukte herlaad staat de focus dan op `<body>`. Voorstel: val terug op `document.getElementById('inhoud')`.
- **T-4.** `laadRol` (`main.js:285-294`) vangt elke fout op en geeft `null`. Een beheerder zonder rol ziet Beheer niet en krijgt geen uitleg. Dit staat in `P0d.md` als bewust. Voorstel: laat het zo, of toon bij een leesfout op `leden/{uid}` de foutkaart met "Opnieuw proberen".
- **T-5.** Vermogens (`:2378`), onderdelen (`:2841`) en het logo (`:3260`) roepen `confirm()` los aan met dezelfde tekst. De tekst klopt, maar de helper `bevestigVerwijderen` wordt alleen bij Domeinen en Bestuursfuncties gebruikt. Voorstel: overal de helper.
- **T-6.** `failed-precondition` hoort bij een ontbrekende index, niet bij een weggehaald item (`main.js:345`, `:360`). Voorstel: uit `WEG_CODES` halen als er een index nodig kan zijn.
- **T-7.** Domeinen controleren niet op een dubbele naam (Bestuursfuncties wel, `main.js:3047`, `:3139`). Kerncijfer Vermogens op het Domeinenoverzicht linkt naar de plaat (`:1095`), op de plaat naar Beheer (`:1266`). Voorstel: besluit van Paul (de eerste was al bedoeld, besluit 26).
- **T-8.** Bundel 712 kB. Past bij "main.js opsplitsen" in `pipeline.md`.

**Gecontroleerd en in orde (P0d en nieuwe helpers)**
- Regels: `isBeheerder(clubId)` leest `leden/{uid}.rol` met `get(...).data.get('rol', '')`. Ontbreekt het document, dan wordt geweigerd. Alle schrijfacties (instellingen, bestuursfuncties, structuurelementen, vermogens, vermogensnamen, projecten, samenwerkingen, commissies) vragen `isBeheerder`. `gebruikers`, `leden` en `clubs/{id}` zijn niet te schrijven. De veldcontroles komen overeen met de app (naam 200/100, omschrijving 500, logo 700.000).
- App: `magNaar` in `navigeer` (`main.js:1388`), `geenBeheer` bovenaan de vijf beheer-renders, zijmenu `zichtbaar: () => isBeheerder()`, `cijferHTML` geeft een lid een vak zonder link. De kruimel "Beheer" (`data-nav="beheer"`) bestaat alleen op beheerpagina's.
- Auto-uitloggen: verse login met oude sleutel werkt (de `pointerdown`/`keydown`/`click` op het inlogscherm vernieuwt de sleutel vóór `onAuthStateChanged`), meerdere tabbladen via `Math.max`, geen localStorage via try/catch, en een herladen pagina na 8 uur logt uit (`main.js:3459`).
- `enterSlaatOp` raakt alleen tekstinvoer zonder `.eigen-datum-tekst`; geen dubbel opslaan door de `aria-disabled`-guard.
- CSP in `vercel.json` (`style-src 'self'`): geen inline `style=`, alleen `setProperty` via CSSOM (`main.js:1491`, toegestaan). Niet in een browser getoetst.
- Niet gedraaid: `npm run test:regels` (andere agent), `npm run p0d:controle`.

## 2. Huisstijl (besluiten 1-41 van CK-046)

**Hoog en middel:** geen. De afwijkingen van v0.12.1 zijn besluiten (39: vierkant, 40: Opslaan primair, 41: `confirm()`) of opgelost.

**Laag**
- **HS-1.** Besluit 40 zegt dat Opslaan in elk formulier primair is. Op Mijn account zijn "Naam opslaan", "E-mailadres wijzigen" en "Wachtwoord wijzigen" gewone `.btn` (`main.js:3319`, `:3339`, `:3358`). Voorstel: `btn opslaan`, of leg vast dat drie acties op één pagina secundair blijven.
- **HS-2.** `<div class="cijfers" aria-label="Kerncijfers">` (`main.js:1091`, `:1263`): `aria-label` zonder rol wordt genegeerd. Voorstel: `role="group"`.
- **HS-3.** Kleine verschillen tussen de beheertabellen: statusfilter "Alle projecten" (`main.js:2508`, nog steeds; "Alle statussen"), Domeinen toont `'—'` zonder verborgen tekst (`:1723`), Vermogens heeft geen subgrid (`style.css:1100-1125`), en de label bij gestapelde rijen alleen bij Projecten en Samenwerkingen (`.cel-label`, `style.css:1058`).
- **HS-4.** `main.js:1491` zet `--paneel-top: 0px` inline, terwijl de CSS zelf `0px` als terugval heeft. Voorstel: de regel weghalen.
- **HS-5.** Club gebruikt een onzichtbare h1 (`main.js:3172`), de andere beheerpagina's een h1 in de petrol kop. Voorstel: de kop "Clubprofiel" als h1, of leg het vast.
- **HS-6.** `.tussen-link` en `.tussen-hint` worden buiten de tussenkaarten gebruikt (`main.js:1715`, `:2524`); geen tokens voor ruimte en regelhoogte. Voorstel: neutrale namen bij de volgende opruimronde.

Goed: één lettertype, lokaal, met alle gebruikte gewichten; geen inline kleuren; kleuren van de omgevingsbalk als tokens; teksten bij verwijderen, validatie en lege lijsten gelijk.

## 3. Toegankelijkheid (WCAG 2.1 AA)

**Hoog en middel:** geen. De drie AA-tekortkomingen van v0.12.1 (veldrand, loginfouten, datumkiezer) zijn weg.

**Laag**
- **A-1.** `main.js:833-836`: `STIL_MELDING` wordt direct na het tekenen in `#inlog-algemeen-fout` gezet. Een live-region die met zijn inhoud tegelijk verschijnt, wordt door sommige schermlezers niet voorgelezen (niet getest). Voorstel: `zetStatus`-achtig, eerst leeg en na 100 ms vullen, of de melding in de h1-beschrijving zetten.
- **A-2.** `keuzelijst.js:261-262`: `knop.removeAttribute('aria-describedby')` werkt eenmalig, maar de `MutationObserver` in `volgAttributen` (`:40-50`) zet bij de eerste fout `aria-describedby` en `aria-invalid` terug op de kalenderknop. De fout wordt dan op tekstveld én knop aangekondigd, en `aria-invalid` is niet toegestaan op een knop. Voorstel: `volgAttributen` een lijst van attributen meegeven (voor de knop alleen `disabled` en `fout`).
- **A-3.** Nog open uit v0.12.1: `.form-input:focus { outline: none }` (`style.css:329`, rand wordt petrol, 4,5:1, voldoet), geen `::placeholder`-kleur, het datumformaat staat alleen als placeholder (`keuzelijst.js:~209`).
- **A-4.** De plaatsecties (`main.js:1139`) hebben een h2 maar geen regio; groepskoppen in de keuzelijst zijn `role="presentation"` (`keuzelijst.js:115`); `aria-live` op de maandtitel wordt bij elke `teken()` vervangen (`:326`).
- **A-5.** Vaste hoogtes (`style.css:577`, `:801`) en `line-clamp` (`:532`) kunnen bij tekstafstand tekst afkappen (WCAG 1.4.12). Voorstel: `min-height`.
- **A-6.** `navigeer` zet de focus op `<main>` (`main.js:1393`); dat is acceptabel nu elke pagina een h1 en een `document.title` heeft. Voorstel: de focus op de h1.

Gecontroleerd en in orde: contrast van de veldrand (berekend, zie boven), `.toel` 4,90:1, `aria-disabled` op de inlogknop met guard, `role="alert"` bij laadfouten, `role="table"`-structuur met `role="cell"`, `sr-only` koprij bij smalle tabellen, regio's met `aria-labelledby` op de overige 9 secties, één h1 per pagina. Niet getest met een schermlezer.

## 4. AVG en compliance (CK-049)

De harde poort P0d is gesloten. De rest van CK-049 is nog niet gedaan. Dat blokkeert niets voor één beheerder met alleen organisatiegegevens, maar wel een tweede bestuurder of ledengegevens.

**Middel**
- **C-1. CK-049 is volledig open.** Geen privacyverklaring of link (`index.html`, footer `main.js:~940`), geen register, geen verwerkersovereenkomst (HCA, Google, Vercel), geen procedure voor inzage/export/verwijdering, geen datalekprocedure, geen back-up, geen bewaartermijnen, geen DPIA-afweging, regio van Firebase Auth niet genoteerd. Voorstel: de checklist van `.claude/backlog.md` onder CK-049, door Paul; de privacyverklaring als laatste.
- **C-2. Rolbeheer.** De rol `beheerder` wordt alleen door `scripts/migreer-club.mjs:165` of in de console gezet. Er is geen beschreven procedure voor toekennen, controleren en intrekken (uitgetreden bestuurder), terwijl de regels er nu volledig op steunen (AVG art. 32 toegangsbeperking, bewaartermijn). Voorstel: een alinea in het register en in `P0d.md`: wie kent de rol toe, hoe wordt ze ingetrokken, en na hoeveel dagen wordt het account verwijderd.

**Laag**
- **C-3.** Omschrijvingen (max 500 tekens, vrije tekst) hebben geen hulptekst "geen namen of contactgegevens". Voorstel: één regel onder het veld, nu alleen bestuurders het zien, maar vóór ledengegevens.
- **C-4.** `auth/user-not-found` toont "Geen account gevonden met dit e-mailadres" (`main.js:799`). Firebase geeft dit bij bescherming tegen enumeratie meestal niet; zet die in de console aan en maak de tekst algemeen.
- **C-5.** Register aanvullen met `clubkompas-laatst-actief` (tijdstempel, localStorage, strikt functioneel) naast `zijmenu-ingeklapt` en de Firebase-sessie. `leden/{uid}.email` (door `migreer-club.mjs:166`) hoort er ook in.

Verbeterd sinds v0.12.1: Google Fonts weg (geen IP-adres meer naar Google), logo beperkt tot PNG/JPG/WebP met grens, schrijven alleen voor de beheerder, veldcontrole voorkomt vrije velden, sessies sluiten na 8 uur, `vercel.json` met CSP en `frame-ancestors`. Logging bevat nog alleen foutcodes (in `DEV` het volledige foutobject, `main.js:~560`). `scripts/firestore.rules.migratie` heeft nu een waarschuwing. De oude regelbestanden `voor-P0c` en `voor-P0d` zijn terugdraaibestanden met de oude, ruimere regels; zet er een waarschuwing in zoals bij `.migratie`.

## Voorstel: wat eerst

1. **Klein fixpakket (geen agents nodig):** T-1 (teksten voor een lid), T-2 en T-3 (null-guards), A-2 (aria op de datumknop), A-1 (uitlogmelding), HS-1 en HS-4.
2. **Zonder code (Paul):** C-1 en C-2, in de volgorde van CK-049.
3. **Later, bij het opsplitsen van `main.js`:** T-5, T-8, HS-3, HS-6, A-3 tot A-5, gelijke ids en `bindHerlaad` ook voor Vermogens, plaat en onderdelen.
