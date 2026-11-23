# Build-rapport: CK-020 — Vermogens beheren

Fase 4 (bouw), 23 november 2026, branch `test`. Niets gecommit, niets gepubliceerd, niet ingelogd bij Firebase, niet naar een echte Firestore geschreven. Alleen de lokale emulator (`demo-clubkompas`) is gebruikt.

## Wat is gebouwd

- **Beheer → Vermogens** (menu-id `vermogensbeheer`, puzzelpictogram, tussen Domeinen en Bestuursfuncties). Vermogens gegroepeerd per pijler/ondersteunend domein in domeinvolgorde (`h3` + eigen `role="table"` per groep), balk met **Toon** en **+ Vermogen toevoegen**, formulier bovenaan, ↑/↓ binnen het domein, potlood/prullenbak, bewerken in de rij (naam en/of domein), verwijderen met `confirm()`. Lege staat, "geen pijlers of ondersteunende domeinen", groep "Zonder geldig domein", voetnoot over overkoepelende domeinen, laadfout met **Opnieuw laden** (en de testhint bij `permission-denied` in test/ontwikkel). Filter vooraf te kiezen via `data-nav="vermogensbeheer" data-filter="{id}"`.
- **Transacties** volgens de spec, één vermogen per transactie: toevoegen, hernoemen (alleen hoofdletters = geen nieuw naamdocument), verplaatsen, verwijderen. Hernoemen + verplaatsen: eerst de naamcheck (besluit 14), dan verplaatsen, dan hernoemen; bij een halve uitkomst gaat het formulier opnieuw open op de nieuwe plek met de getypte naam en de melding uit het ontwerp.
- **Domeinen**: beheerbalk met keuzelijst op soort en **+ Domein toevoegen**, formulier en sectiemelding boven de lijst, verborgen filterstatus, hint "De volgorde wijzig je bij Toon: Alle soorten.", lege uitkomst "Geen domeinen van deze soort.", link "n vermogens" / "Nog geen vermogens" onder de naam, pictogramknoppen. Guard: verwijderen leest eerst vers het aantal (geen `confirm()` bij > 0, meteen melding met **Naar de vermogens van X**, focus blijft op de prullenbak met `aria-describedby`); naar overkoepelend wordt vóór opslaan gecontroleerd, melding onder de soortkeuze, radiogroep `aria-invalid`, focus op het rondje. Race (`permission-denied`) → aantal opnieuw lezen → dezelfde melding.
- **Bestuursfuncties**: balk met alleen **+ Bestuursfunctie toevoegen**, formulier en melding boven de lijst, pictogramknoppen (prullenbak houdt `data-aantal`).
- **Alle beheerlijsten**: `actieKnopHTML` (aria-label "Bewerken: X" / "Verwijderen: X", tooltip, Esc verbergt via `.tip-uit` op `#inhoud`), `bezig: null` bij alle `metOpslaan`-aanroepen vanaf een pictogramknop, 44×44px op ≤700px, `meldingInBeeld` na rijacties, Annuleren/niets gewijzigd → focus op het potlood.
- **Home**: vier kerncijfers (`cijfers-3` weg), "n vermogens" / "Nog geen vermogens" per pijler- en ondersteunende kaart, `Promise.allSettled`; mislukt het laden van vermogens → "–" met sr-tekst "niet geladen", geen regels op de kaarten, grijze hint.
- **Firestore-regels**: blokken `vermogens` en `vermogensnamen`, hulpfuncties, aangepast `structuurelementen` (create alleen met teller 0, update via `tellerWijzigingKlopt`, niet naar overkoepelend met teller > 0, delete alleen bij teller 0).
- **Scripts**: `scripts/inrichten-vermogens-hca.mjs` en `scripts/controleer-vermogens.mjs` via `scripts/lib/omgeving.mjs` (standaard test, productie vraagt de projectnaam, `--droog`, "ja" vóór schrijven, `--help`).
- **Regeltests**: `tests/regels.test.mjs` met `@firebase/rules-unit-testing`, `npm run test:regels`.

## Gewijzigde bestanden

- `firestore.rules`: vermogensblok, naamdocumenten, teller op domeinen, `sleutelVan()` (zie afwijking 2).
- `src/vermogens.js` (nieuw, modellaag): naamregels (`normaliseerVermogensnaam`, `vermogensnaamFout`, `naamSleutel`, `geldigeVermogensnaam`), `laadVermogens`, `hoogsteVolgorde`, `leesAantalVermogens`, `controleerNaamVrij`, en de transacties `voegVermogenToe`, `hernoemVermogen`, `verplaatsVermogen`, `verwijderVermogen`. Gedeeld door app, scripts en tests.
- `src/main.js`: import uit `vermogens.js`; `domeinOptiesHTML`, `vermogensTekst`, `meldingInBeeld`, `actieKnopHTML`, `zetStatus`, `toonVermogensBlokkade`; `FOUTTEKSTEN` (`aborted`, `vermogen-weg`), `WEG_CODES` + `vermogen-weg`; `metOpslaan` gebruikt `e.tekst` bij veldfouten; `MENU_ICOON` (puzzel, potlood, prullenbak), `ZIJMENU`, `NAV_DOEL`, `navigeer(id, gebruiker, opties)`, `data-filter` in `bindAppShell`, Esc-tak voor pictogramtooltips; `renderStructuurGrid`/`renderDashboard`; `renderPijlersDomeinenBeheer` herschreven (zelfde gedrag + CK-020); `renderVermogensBeheer` (nieuw); `renderBestuursfunctiesBeheer` aangepast.
- `src/style.css`: blok "Beheer en vermogens (CK-020)" volgens het ontwerp; de oude rasters (240px) en container queries (760/590px) vervangen door 152px en 660/500px; `.filter-tabs`, `.filter-knop.active`, `.cijfers.cijfers-3` verwijderd; `.beheer-balk[hidden]`.
- `scripts/inrichten-vermogens-hca.mjs`, `scripts/controleer-vermogens.mjs` (nieuw).
- `scripts/lib/vermogens-hca.mjs` (nieuw): namenlijst, `zoekDomeinen`, `maakImportplan`, `controleerVermogens` (zonder Firestore, daardoor testbaar).
- `tests/regels.test.mjs` (nieuw).
- `package.json` / `package-lock.json`: devDependency `@firebase/rules-unit-testing@^6.0.0` (peer `firebase ^13`); scripts `test:regels`, `vermogens:import`, `vermogens:controle`.
- `firebase.json`: blok `emulators` (Firestore op 8080, geen UI, `singleProjectMode`). Raakt `firebase deploy --only firestore:rules` niet.
- `README.md`: drie regels in de tabel "Dagelijks gebruik", alinea over vermogens bij "Firestore-regels".
- `CHANGELOG.md`: onder "Ongepubliceerd".

## Afwijkingen van spec en ontwerp

1. **58 vermogens in plaats van 63 (besloten, besluit 22).** De bronlijst noemde 13 + 50 = 63, maar telt 13 bij de pijlers en 45 bij de ondersteunende domeinen. Paul heeft vastgesteld dat het HCA-overzicht v1.4 58 vermogens bevat. Het script importeert die 58 (met Parkonderhoud/Parkbeveiliging); specs, scripts en tests staan op 58 (`BRON_AANTAL`).
2. **`sleutelVan(naam)` in de regels in plaats van `naam.lower()`.** In de emulator zet `lower()` alleen A–Z om: `'ÀB'.lower()` geeft `'Àb'`, terwijl JavaScript `'àb'` geeft. Volgens de spec zou dat "fail closed" zijn, maar dan zou elke naam met een hoofdletter met accent (bijv. "Éénheid", "Öland") altijd met "geen toestemming" geweigerd worden. `sleutelVan` doet `lower()` en zet daarna de 30 Latin-1-hoofdletters (À–Ö, Ø–Þ) met `replace()` om. Werkt `lower()` in productie wél met Unicode, dan doen de `replace`-stappen niets en is de uitkomst gelijk. Getest: zie "Testresultaten".
3. **Transacties in `src/vermogens.js` in plaats van in `main.js`.** De spec noemt de functies in `main.js`. Ze staan nu in een eigen modellaagmodule, zodat het importscript precies hetzelfde protocol gebruikt (spec: "via hetzelfde protocol als de app") en de emulatortests de echte app-code toetsen. `runTransaction` wordt dus daar geïmporteerd, niet in `main.js`. De functies krijgen `db` en de club-id mee (club-id vastgelegd bij het openen van de pagina, vervolgpunt CK-023). `schrijfVolgorde` voor ↑/↓ gebruikt nog de globale club-id (ongewijzigde bestaande helper).
4. **`failed-precondition`/`already-exists` uit een transactie → `aborted`.** De web-SDK probeert een transactie opnieuw bij `aborted`, `failed-precondition` en `already-exists` en geeft na de laatste poging die code door. `failed-precondition` staat in `WEG_CODES` ("bestaat niet meer"). Daarom zet `vermogens.js` die twee codes om naar `aborted` ("Iemand anders wijzigde dit tegelijk…").
5. **Actiekolom op ≤700px 200px in plaats van 152px** (Bestuursfuncties en Vermogens). Met vier knoppen van 44px past de rij niet in 152px bij een venster tussen ~430 en 700px, omdat die lijsten pas onder 500/400px stapelen. De regel staat vóór de container queries, zodat stapelen blijft winnen. Domeinen stapelt op ≤700px altijd (≤660px), daar verandert niets.
6. **Halve uitkomst met het filter op het oude domein:** het filter springt naar het nieuwe domein, anders is het opnieuw geopende formulier niet te zien. Het ontwerp beschrijft dat geval niet. Bij een gewone verplaatsing springt het filter niet mee (zoals in het ontwerp).
7. **Fout bij bewerken in de rij die de lijst ververst** (dubbele naam, domein weg/overkoepelend, `aborted`): de lijst wordt bijgewerkt en het bewerkformulier gaat opnieuw open met de invoer en de fout. Zo ziet de bestuurder het winnende vermogen en blijft zijn invoer staan.
8. **Regels iets strenger dan het voorstel:** `laatsteVermogenId` moet een niet-lege string zijn bij een tellerstap; de teller bij een nieuw domein moet een int zijn; `vermogenId` in een naamdocument heeft 1–100 tekens. De logica is gelijk.
9. **Hernoemen leest ook het oude naamdocument** in de transactie (spec: alleen V en N-nieuw). Zo wordt het oude alleen verwijderd als het echt naar dit vermogen wijst. Dat beschermt tegen consoleschade.
10. Kleine punten: id's van veldfouten in de rij zijn `vn-{id}-fout` en `vd-{id}-fout` (ontwerp: `vn-fout-{id}`), niet zichtbaar voor de gebruiker. De bevestigingsvraag bij een domein blijft "Item verwijderen?…" (ongewijzigd, niet in scope). Annuleren in de bewerkrij van Domeinen en Bestuursfuncties zet de focus nu op het potlood (ontwerp), voorheen nergens.

## Testresultaten emulator (`npm run test:regels`)

**51 tests, 51 geslaagd** (Firestore-emulator via `firebase-tools` 15.37, Java 27, project `demo-clubkompas`, ±5 s).

- **Naamregels app:** normaliseren (NFC, spaties), alle veldfouten uit het ontwerp (leeg, 1 teken, 104 tekens, eerste teken, één en meerdere foute tekens, emoji, İ, `<b>`), grenzen 2 en 100, alle 58 HCA-namen.
- **Protocol slaagt:** toevoegen (vermogen, naamdocument, teller, volgorde), accenten en hoofdletters met accent (ook dubbel herkend: "ÉÉN ÇA ÑÜ" ↔ "één ça ñü"), alle 58 HCA-namen door de regels, dubbele naam met domeinnaam en `zelfdeDomein`, los naamdocument → `naam-bezet`, domein weg/overkoepelend, hernoemen (hoofdletters, andere naam, oude naam weer vrij), verplaatsen (tellers −1/+1, onderaan), hernoemen + verplaatsen met naamcheck vooraf, verwijderen (naam weer vrij, `vermogen-weg`), ↑/↓ van 58 vermogens in één batch, verweesd vermogen verplaatsen en verwijderen, **twee tabbladen tegelijk dezelfde naam → precies één wint, tellers kloppen**.
- **Regels weigeren:** `addDoc` zonder protocol, zonder teller, zonder naamdocument, teller +2, teller aan een ander vermogen toegeschreven, naamdocument naar een ander vermogen of met een andere sleutel, overkoepelend en niet-bestaand domein, extra velden, volgorde 1.5/0/"1", 15 ongeldige namen (o.a. `a_b`, emoji, `İstanbul`, `<b>`, spatie voor/achter, dubbele spatie, `-Catering`, tab, `µ`, `×`, `Œ`), tweede vermogen met bestaande sleutel, naamdocument wijzigen/overschrijven/te vroeg verwijderen/aanmaken voor een vermogen met een andere naam, hernoemen zonder het oude naamdocument op te ruimen, verwijderen zonder teller −1 of met naamdocument, verplaatsen met één teller, niet-lid lezen/schrijven.
- **Domeinen en teller:** met vermogens niet verwijderen en niet naar overkoepelend; pijler ↔ ondersteunend mag; na leegmaken wel; teller vervalsen (0, 0 + `laatsteVermogenId`, +1 zonder echte wijziging, 1.5, onder 0, ander domein) geweigerd; `laatsteVermogenId` los wijzigen mag (onschuldig, spec); nieuw domein alleen met teller 0.
- **Bestaande bewerkingen blijven werken:** domein bewerken zoals de v0.6.0-app (`updateDoc` zonder tellervelden, ook bij teller > 0), domein toevoegen en leeg domein verwijderen, `schrijfVolgorde` van domeinen, `seed-testclub` (`batch.set` met `merge`), bestuursfuncties aanmaken/bewerken/verwijderen, clubprofiel.
- **Limieten:** toevoegen, verplaatsen, hernoemen en verwijderen slagen (binnen de get-limieten). Ter informatie: hernoemen + verplaatsen in **één** schrijfactie werd door de emulator **toegestaan**. Of de emulator de limiet van 10/20 calls precies zo telt als productie, kan ik niet vaststellen; de app splitst het volgens de spec in twee transacties.
- **Scripts (logica):** import op 13 HCA-domeinen geeft 58 nieuw, tweede keer 0 (58 overgeslagen) en de controle daarna "alles klopt"; pijler gevonden op hashtag; stopt bij een ontbrekend of overkoepelend domein; vermogen in een ander domein en los naamdocument blijven ongemoeid; controle meldt na consoleschade precies `structuurelementen/leden (Leden): aantalVermogens 2 → 1` en het verweesde vermogen, en herstelt naamdocumenten (aanmaken en opruimen) binnen de regels.

Overige controles: `npm run build` slaagt (de bestaande waarschuwing over chunkgrootte blijft); `node --check` op alle nieuwe scripts en modules; `--help` van beide scripts (start geen login).

## Wat niet getest is

- **De UI in een browser.** Er draait geen dev-server tegen de emulator: daarvoor zou `src/firebase.js` een emulatorkoppeling nodig hebben, en `npm run dev` wijst naar het echte testproject (inloggen mag niet). De UI-code is nagelopen op gebruikte namen en logica, maar niet geklikt. Dus niet getest: lay-out op 375/768/≥1200px (in- en uitgeklapt menu), licht/donker, tooltips (muis, Tab, Esc), VoiceOver, focusafspraken, halve uitkomst, laadfout, Home met en zonder vermogens.
- De scripts tegen een echt project (`--droog` logt ook in, dus niet gedraaid).
- Gedrag van `lower()`, regex en limieten in **productie-Firestore**. De emulator geeft een sterke aanwijzing, maar testscenario 5 in tst blijft nodig.

## Handmatig te controleren (tester)

- Testscenario's 1–18 uit de spec in tst, vooral: 5 (naamregels, ook een naam met een hoofdletter met accent zoals "Éénheid"), 4 (twee tabbladen), 9–12 (devtools), 14 (regels nog niet gepubliceerd: Home werkt, Vermogens toont de laadfout met testhint), 16 (consoleschade + controlescript).
- Domeinen: keuzelijst op soort (pijlen weg + hint), link "n vermogens" → Vermogens met filter, blokkade bij verwijderen en bij overkoepelend (focus, knop in de melding), container query bij 652px en 524px.
- Bestuursfuncties: balk bovenaan, verwijderen met "Bezig" (pictogram blijft staan), blokkade "nog in gebruik".
- Pictogramknoppen en tooltips op alle drie de lijsten, 44px op de telefoon, prullenbak rechts.
- Halve uitkomst (verplaatst, naam niet): in de praktijk moeilijk op te wekken, omdat de naam vooraf wordt gecontroleerd. Vooral via codereview te beoordelen (`bewerk-opslaan` in `renderVermogensBeheer`).

## Instructies voor Paul

1. `npm ci` (nieuwe devDependency `@firebase/rules-unit-testing`).
2. Optioneel: `npm run test:regels` (geen login, alleen Java). Verwacht na de herstelronde: `ℹ pass 71`, `ℹ fail 0`.
3. (Vervallen: 58 vermogens is besloten, besluit 22.)
4. **Regels naar test:** `npm run regels:test`. Controleer in de testconsole de tekst en de publicatietijd. De huidige app (v0.6.0) blijft daarmee werken.
5. Lokaal testen: `npm run dev`, testscenario's 1–16 en 18.
6. **Import in test, droog:** `npm run vermogens:import -- --droog` → verwacht "58 vermogens in de bronlijst: 58 nieuw, 0 al aanwezig" en het plan per domein. Stopt het met "het plan klopt niet", dan staat erbij welk domein ontbreekt of overkoepelend is.
7. **Import in test, echt:** `npm run vermogens:import`, plan bekijken, "ja" typen. Daarna nog eens: verwacht "0 nieuw, 58 al aanwezig" en "Niets te doen."
8. **Controle:** `npm run vermogens:controle -- --droog` → "Alles klopt." (exitcode 0). Wil je scenario 16 testen: verwijder in de testconsole een vermogen, draai de controle opnieuw (verwacht een tellerafwijking met de juiste waarde en een los naamdocument), en daarna zonder `--droog` om het naamdocument op te ruimen. De teller zet je zelf in de console.
9. Daarna volgens de uitrol: `npm run regels:productie` (vóór de app), app live, import in productie met `-- --omgeving=productie --droog`, dan echt, dan de controle. Niet op 26 november 2026.

## Status

Klaar na de herstelronde (zie hieronder). Geen open beslispunten; 58 vermogens is besloten (besluit 22). De UI is niet in een browser getest (zie "Wat niet getest is").

## Herstelronde (na de kwaliteitscontroles, 23 november 2026)

Bronnen: `CK-020-test.md`, `-huisstijl.md`, `-beveiliging.md`, `-compliance.md`, `-toegankelijkheid.md` en besluit 22. De regeltests die tester en beveiliging hebben toegevoegd, zijn blijven staan. Eén informatieve test van de beveiliging is aangepast (zie punt 8).

| # | Punt | Status | Toelichting |
|---|---|---|---|
| 1 | Focusring `.btn` en `.btn-kaart-actie` (toegankelijkheid 🟡1, huisstijl 5) | Gedaan | `box-shadow: 0 0 0 2px var(--text)` naast de oranje outline. In licht een donkere lijn (18,8:1). In donker wordt `--text` licht (#E8EEEE) op een donkere achtergrond, dus de lijn blijft zichtbaar; oranje haalt daar al 7,2:1. Zelfde patroon als `.btn-toevoegen` en het kruimelpad. |
| 2 | Domeinen: focus naar de link in de melding (toegankelijkheid 🟡2) | Gedaan | Bij verwijderen met vermogens (ook na een race) gaat de focus naar **Naar de vermogens van X**. Dat is een **kleine bijstelling op het ontwerp bij besluit 15**, dat de focus op de prullenbak liet. Het `aria-describedby` op de prullenbak is weg (overbodig). Bij de soortkeuze blijft de focus op het rondje Overkoepelend: de link volgt daar direct. |
| 3 | Home-hint en knopnamen (🟢) | Gedaan | De hint staat altijd in de boom (`role="status"`, zonder `hidden`); `.vermogens-hint:empty { display:none }`. ↑/↓ heten nu "Omhoog: X" / "Omlaag: X", gelijk aan "Bewerken: X" / "Verwijderen: X", op alle drie de lijsten. Bevinding 3 (13 `region`-landmarks) en 7 (`h1`) niet gedaan: niet gevraagd. |
| 4 | Inline `style=""` (huisstijl 1) | Gedaan, met één uitzondering | `style="margin-top:0"` op `.sectie` weg (deed niets door de reset). `width:100%` op de bewerkformulieren weg (blok in een blokrij). Pill in de domeinrij via `.domein-rij .pill`. "Geen domeinen van deze soort." en "Nog geen bestuursfuncties." krijgen `.lijst-leeg`. Radiolabels krijgen `.soort-optie`. "Beheer →" op Home krijgt `.sectie-voet`. De leegtekst op Home krijgt `.grid-leeg` (alleen de muted kleur), niet `.lijst-leeg`, omdat cursief en kleiner een zichtbare wijziging zou zijn. Blijft inline: de kleur van het soortstipje (`SOORT_KLEUR`, data-gestuurd). |
| 5 | Huisstijl 2, 3, 8, 10 | Gedaan | Knop in de lege staat: `margin-top:0`, 44px op ≤700px. `.groep-leeg` padding-left 36px onder 400px. `.groep-picto:empty { display:none }`. Donkere chevron `%237DB1B3` voor `select.form-input` in beide donker-blokken (systeemvoorkeur en `data-theme="dark"`). |
| 6 | Eén breedte voor beheerformulieren (huisstijl 4) | Gedaan | `max-width: 480px` op de velden in alle beheerformulieren, gelijk aan het clubprofiel. Het Domeinen-formulier breekt niet: de soortkeuze (drie rondjes, ~460px) heeft al `flex-wrap`, en de knoppen en meldingen houden de volle breedte. |
| 7 | Kerncijfers 2×2 tot 900px (huisstijl 9) | Gedaan | Rekenwerk: op 768px met uitgeklapt menu is de inhoud 768 − 172 − 32 = 564px, dus vier kaarten van ±133px met ±105px tekstbreedte. "Ondersteunende domeinen" past dan niet op één regel. Op 701px is de tekstbreedte ±89px, krap voor het woord "Ondersteunende". Daarom 2×2 tot en met 900px (`@media (max-width: 900px)`). Gevolg: ook op 768–900px met ingeklapt menu 2×2, wat ruim past. |
| 8 | Regels: `volgorde ≤ 100000`, `laatsteVermogenId` string ≤ 100 (beveiliging 2); stuurtekens in scriptuitvoer (beveiliging 3) | Gedaan | `geldigVermogen` heeft `volgorde <= 100000`. `geldigLaatste()` geldt bij elke update van een domein (ook bij een gelijke teller) en bij aanmaken. De informatieve test "volgorde heeft geen bovengrens" (`assertSucceeds`) faalt daardoor en is vervangen door "volgorde boven 100000 geweigerd, 100000 toegestaan". Nieuw: test `laatsteVermogenId` (100 tekens ok, 101, getal en map geweigerd). `veilig()` in `scripts/lib/omgeving.mjs` maakt stuurtekens (C0/C1, regeleinden, richtingstekens, zero-width, BOM) zichtbaar als `\u{..}`. `stop`/`waarschuw`/`gelukt` passen dat toe op alle regels; de planregels en herstelregels in beide scripts gaan er ook doorheen. Test toegevoegd. |
| 9 | `schrijfVolgorde` met vastgelegde club-id (tester); bouwverslag op 58 | Gedaan | `schrijfVolgorde(subcollectie, items, clubId = huidigClubId)`. Vermogens geeft de bij het openen vastgelegde `clubId` mee; Domeinen en Bestuursfuncties houden de standaard, dus hun aanroepen werken als voorheen. Verslag: afwijking 1 als besloten, instructies op 58. |
| 10 | P0d `isBeheerder`, npm audit/firebase-tools, oranje hoofdactie, puzzelstuk-inkeping, gevoelige vermogens | Niet gedaan | Op verzoek; gaat via de hoofdsessie naar de backlog. |

**Na de herstelronde:** `npm run test:regels` geeft 71 tests, 71 geslaagd (69 van de vorige ronde, waarvan één aangepast, plus 2 nieuw). `npm run build` slaagt. `node --check` op beide scripts slaagt. De UI is nog steeds niet in een browser bekeken. Handmatig controleren: de focusring in licht en donker, de focus op de link in de Domeinen-melding, de kerncijfers tussen 700 en 900px, en de chevron in donker.
