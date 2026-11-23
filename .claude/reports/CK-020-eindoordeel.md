# Eindoordeel: CK-020 — Vermogens beheren

Fase 7 (beoordelaar), 23 november 2026 · branch `test`, niet gecommit · geen code gewijzigd.
Gelezen: `.claude/specs/CK-020-{besluiten (1–22),vermogens-beheren,gebruikersreis,ontwerp}.md`, `.claude/reports/CK-020-bouwverslag.md` (incl. herstelronde), de vijf kwaliteitsrapporten, `.claude/docs/CK-020-technisch.md`, `.claude/docs/CK-020-voor-gebruikers.md`, `CHANGELOG.md`, `README.md`, `.claude/backlog.md` (CK-020 en de P0d-eis bij "Na CK-044"). Zelf nagekeken: `firestore.rules` (volledig), `src/vermogens.js` (volledig), `src/main.js` (Home, `actieKnopHTML`, `toonVermogensBlokkade`, zijmenu/`NAV_DOEL`/`navigeer`, Domeinen-guard, `renderVermogensBeheer` volledig), `src/style.css` (focusring, CK-020-blok, kerncijfers, donkere chevron), `scripts/lib/omgeving.mjs`, `scripts/inrichten-vermogens-hca.mjs`. Bekend uit de hoofdsessie: `npm run build` slaagt, `npm run test:regels` 71/71.

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen | Na herstelronde |
|-------|-----------|---------|---------------------|-----------------|
| Functioneel testen | Tester | ✅ (logica, emulator) | 0 | 71/71 groen. `schrijfVolgorde` met vastgelegde `clubId` ✅ (main.js r. 170, 1958). Bouwverslag op 58 ✅ |
| Huisstijl | Huisstijl | 🟡 → ✅ (code) | 0 | Inline stijlen weg (op `SOORT_KLEUR` na) ✅, lege-staatknop/`.groep-leeg`/`.groep-picto:empty` ✅, 480px-velden ✅, kerncijfers 2×2 tot 900px ✅, donkere chevron in beide donker-blokken ✅. Oranje hoofdactie en puzzelinkeping → backlog |
| Beveiliging | Beveiliging | ✅ Veilig voor TST | 0 | 2: `volgorde <= 100000` en `geldigLaatste()` ✅ (rules r. 85, 112–123, 173). 3: `veilig()` voor terminaluitvoer ✅. 1 (P0d) staat als harde eis in de backlog, inclusief `vermogens`/`vermogensnamen` ✅. 4 (audit) → backlog |
| Compliance | Compliance | ✅ Compliant | 0 | Geen persoonsgegevens. P0d-eis uitgebreid ✅. Gevoelige vermogens, back-up en "vermogen → bestuursfunctie" staan in de backlog ✅ |
| Toegankelijkheid | Toegankelijkheid | 🟡 → ✅ (code) | 0 | 1: focusring met donkere binnenlijn op `.btn`/`.btn-kaart-actie` ✅ (style.css r. 914–915). 2: focus naar "Naar de vermogens van X" ✅ (main.js r. 1400, bijstelling op besluit 15). Home-hint altijd in de boom ✅, "Omhoog: X"/"Omlaag: X" ✅. Niet gedaan: 13 `region`-landmarks (`<section aria-labelledby>`), `h1` |

Wat ik zelf in de code heb nagekeken:
- **De regels sluiten.** Uniciteit via `sleutelVan()` werkt in beide richtingen (vermogen en naamdocument). De teller kan alleen ±1 veranderen, gekoppeld aan `laatsteVermogenId`. Verwijderen of naar overkoepelend kan alleen bij teller 0. `structuurelementen` is strenger geworden, en de andere blokken zijn niet veranderd.
- **De transacties volgen de spec.** `transactie()` zet `failed-precondition`/`already-exists` om naar `aborted`. Bij hernoemen + verplaatsen controleert de app de naam eerst. De halve uitkomst opent het formulier opnieuw op de nieuwe plek.
- **De scripts zijn veilig.** Het importscript stelt eerst het plan op, schrijft pas na "ja" en stopt bij `--droog`. Het gebruikt hetzelfde protocol als de app. De uitvoer loopt via `veilig()`.

## De twee punten die de hoofdsessie meegaf

- **(a) "Item verwijderen?" bij een leeg domein** (main.js r. 1475). Dit is bestaande tekst die niet in scope was (bouwverslag afwijking 10). Het werkt, maar het is ongelijk aan Vermogens ("Vermogen X verwijderen?…"). Oordeel: 🟢 niet blokkerend. Snel te verhelpen met `` `Domein ${domein.naam} verwijderen? Dit kan niet ongedaan worden gemaakt.` ``. Doe het mee in de volgende ronde of nu als kleine fix, wat jij wilt.
- **(b) `permission-denied` door de teller-guard in Vermogens.** In Vermogens kan de teller-guard alleen weigeren als de teller niet meer klopt met de echte vermogens (schade via de console). Bij gelijktijdige wijzigingen ontstaat geen `permission-denied`: dan probeert de transactie het opnieuw, en anders volgt `aborted` met een eigen tekst. De algemene melding "geen toestemming, herlaad de pagina" is daarom eerlijk. Het controlescript is de oplossing, en die heeft de gebruiker niet zelf in handen. Oordeel: 🟢 niet blokkerend. Vervolgpunt: een specifieke tekst ("De telling bij dit domein klopt niet. Meld het aan SVN10.").

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs | ✅ Klopt met de code (`sleutelVan`, `geldigLaatste`, `transactie()`, `veilig()`, 71 tests, uitrolvolgorde) |
| Gebruikersdocs | ✅ Klopt (focus naar de link, "Omhoog: X", 2×2 tot 900px). Kleinigheid: "Niet toegestaan zijn … aanhalingstekens" kan verwarren, omdat de apostrof `'` wél mag. Beter: "dubbele aanhalingstekens (")" |
| CHANGELOG | ✅ Onder "Ongepubliceerd", inclusief herstelronde en beveiliging |
| README | ✅ Scripts en regels staan erin. Optioneel: de Rules Playground-tabel aanvullen met vermogens-rijen. Niet nodig, want de emulatortests dekken dit |
| Backlog | ⚠ De status van CK-020 zegt nog "herstelronde loopt" en moet worden bijgewerkt. Vervolgpunten toevoegen: (a), (b), 13 `region`-landmarks, tekst over aanhalingstekens |

## Aandachtspunten voor Paul

1. **Nog niets is in een browser bekeken, en de regels draaien nog niet in een echte Firestore.** Alle groene oordelen gaan over code en de emulator. Het belangrijkste open risico is hoe `lower()`, de regex met accenten en de get-limieten zich in echte Firestore gedragen. Testpunt 5 hieronder beslist dat. Gaat het mis, dan weigeren de regels de naam ("fail closed"): dat is onhandig, maar er ontstaat geen dubbele naam.
2. **Volgorde in test: eerst de scenario's, dan opruimen, dan pas importeren.** Testvermogens zoals "Ledenwerving" en "Teamindeling" en de opzettelijke consoleschade (scenario 16) botsen anders met de import. Je krijgt dan "LET OP … ongemoeid" of een tellerafwijking. Laat het controlescript "Alles klopt" zeggen vóór de import.
3. **Volgorde bij live: eerst de regels in productie, dan de app.** De nieuwe app leest `vermogens`. De huidige v0.6.0 werkt met de nieuwe regels (emulator: domein bewerken zonder tellervelden en een leeg domein verwijderen slagen).
4. **Geen back-up (Spark).** Overweeg vóór de import in productie een export van `structuurelementen`. De import schrijft alleen bij (vermogens, naamdocumenten, tellers +1) en verwijdert niets.
5. **P0d blijft een harde eis** vóór een tweede rol. Nu mag elk lid alle vermogens en daarna de domeinen verwijderen.
6. **Niet op 26 november 2026** (CK-024).

## Blokkades

Geen.

## Mijn aanbeveling

### Deel 1: commit op `test`

**🟢 GO: commit op `test`** (alle ongecommitte CK-020-bestanden, ook `tests/`, `scripts/`, `src/vermogens.js`, `.claude/specs|reports|docs/CK-020-*`). Werk eerst de backlogstatus van CK-020 bij. Push pas als je op `tst.` wilt testen. Publiceer de regels in test **vóór** of direct na de push, anders toont Vermogens de laadfout (scenario 14 is dan meteen getest).

### Deel 2: vóór live, 🟠 GO met voorbehoud

Live pas als de stappen hieronder groen zijn.

**A. Regels in test**
1. `npm ci`, en optioneel `npm run test:regels`. Verwacht: `pass 71`, `fail 0`.
2. Testpunt 14 vóór het publiceren: lokaal (`npm run dev`) of op tst. Home werkt, met Vermogens "–". Beheer → Vermogens toont "konden niet worden geladen" plus de testhint over de regels.
3. `npm run regels:test`. Controleer in de testconsole de tekst en de publicatietijd. Daarna werkt Domeinen bewerken en verwijderen nog zoals in v0.6.0.

**B. Testlijst op tst (en lokaal :5173), met de testclub**
1. **Lege start.** Home toont "Vermogens 0" en "Nog geen vermogens" op de pijler- en ondersteunende kaarten, en niets bij Projecten en Samenwerkingen. Beheer → Vermogens toont het blok "Nog geen vermogens" met de knop. Een bestaand domein bewerken en een leeg testdomein verwijderen werken. De vraag is dan nog "Item verwijderen?" (punt a).
2. **Toevoegen.** "Teamindeling" bij #HCASpeelt komt onderaan, met de melding "✓ Vermogen Teamindeling toegevoegd aan …". Home toont 1 en de kaart "1 vermogen". In de console: `aantalVermogens` 1, `laatsteVermogenId`, en `vermogensnamen/teamindeling` wijst naar het id.
3. **Dubbel.** "teamindeling " bij Bestuur geeft onder het naamveld "bestaat al bij #HCASpeelt". De invoer blijft staan.
4. **Twee tabbladen.** In beide tabbladen "Ledenwerving" bij een ander domein invullen en vlak na elkaar opslaan. Eén slaagt. De ander krijgt "bestaat al" of "Iemand anders wijzigde dit tegelijk". In de console: één vermogen, één naamdocument, tellers kloppen.
5. **Accenten en naamregels, het belangrijkste punt.**
   - Toegestaan: "Éénheid", "Öland", "ÉÉN ÇA ÑÜ", "Lief & Leed", "Ver(nieuw)bouw", 2 tekens, 100 tekens.
   - Daarna "één ça ñü" toevoegen. Dat moet "bestaat al" geven.
   - "Éénheid" hernoemen naar "éénheid" (alleen hoofdletters) mag zonder nieuw naamdocument. Kijk in de console of het naamdocument `éénheid` heet.
   - Geweigerd met een veldfout: 1 teken, 101 tekens, `a/b`, `__x__`, een emoji, `İstanbul`, `<b>`, `-Catering`.
   - Geeft een naam met accent "geen toestemming", noteer dat. Dan gedraagt `lower()` of de regex zich in echte Firestore anders dan in de emulator. Dat is een 🔴 voor live, terug naar de bouwer.
6. **Hernoemen.** "Teamindeling" → "Teamsamenstelling": het oude naamdocument is weg en het nieuwe staat erbij. Daarna kan een nieuw "Teamindeling" weer.
7. **Verplaatsen.** Van Leden naar Vrijwilligers: het vermogen komt onderaan en de tellers gaan −1/+1. Hernoemen en verplaatsen tegelijk geeft de melding "opgeslagen en verplaatst naar …". Hernoemen naar een bestaande naam met een ander domein: er wordt niets verplaatst.
8. **Volgorde.** Drie vermogens, ↑/↓, herladen: de volgorde blijft en een andere groep is onaangeroerd. De focus blijft op de pijl.
9. **Domein met vermogens verwijderen.** Er komt geen bevestigingsvraag, wel meteen de melding. De focus staat op "Naar de vermogens van X". Enter brengt je naar Vermogens met dat domein bij Toon. Devtools: `deleteDoc` op dat domein geeft `permission-denied`. Is de teller 0, dan lukt verwijderen.
10. **Naar overkoepelend.** Je krijgt een melding onder Soort, de focus staat op het rondje en er wordt niets opgeslagen. Devtools: `updateDoc(…, { type: 'overkoepelend' })` geeft `permission-denied`. Pijler → ondersteunend lukt.
11. **Teller vervalsen (devtools).** `updateDoc(domein, { aantalVermogens: 0 })`, ook met `laatsteVermogenId`, geeft `permission-denied`.
12. **Buiten het protocol (devtools).** `addDoc(vermogens, {…})` en `updateDoc` op een naamdocument geven allebei `permission-denied`.
13. **Verwijderen.** Er komt een `confirm()` met de naam. Daarna "✓ … verwijderd", het naamdocument is weg en de teller −1. De focus gaat naar het potlood van de buurrij. De naam is daarna weer vrij.
14. *(Zie A2.)*
15. **Offline.** Wifi uit, dan toevoegen: je krijgt de offline-melding en de invoer blijft staan.
16. **Consoleschade.** Verwijder in de testconsole een vermogen direct. Verwijder ook een domein met vermogens direct, of zet `domeinId` op een niet-bestaand id. Draai `npm run vermogens:controle -- --droog`: je ziet de exacte tellerinstructie, het losse naamdocument en het verweesde vermogen. Het verweesde vermogen staat in Beheer onder "Zonder geldig domein" en kun je verplaatsen of verwijderen. Draai daarna de controle zonder `--droog` (naamdocument opruimen) en zet de teller met de hand.
17. **Breedtes.** Bekijk 375, 768 en 1280px, telkens met het zijmenu in- en uitgeklapt, op Vermogens, Domeinen, Bestuursfuncties en Home.
    - 375: de balk staat gestapeld, knoppen zijn 44×44 en de prullenbak staat rechts.
    - 768 uitgeklapt: kerncijfers 2×2. De domeinenlijst stapelt of past zonder horizontaal scrollen. De link "n vermogens" staat in beeld of vervalt netjes.
    - 1280: vier kerncijfers op een rij, de tooltip in de eerste rij wordt niet afgeknipt.
18. **Licht en donker.** Groepkoppen, "n vermogens", de tooltip, de pijl van de keuzelijst (licht in donker) en de focusring (oranje met donkere of lichte binnenlijn) zijn zichtbaar.
19. **Toetsenbord.** De Tab-volgorde is overslaanlink → menu → kruimels → Toon → + Vermogen toevoegen → rijen (↑ ↓ potlood prullenbak). Tooltips verschijnen bij focus, Esc haalt ze weg. Enter in het naamveld slaat op. Na Annuleren staat de focus op de toevoegknop of het potlood. De focus komt nooit op `<body>`.
20. **VoiceOver.** Je hoort "Omhoog: X", "Bewerken: X", "Verwijderen: X" en de groepkop "Financiën, Ondersteunend, 7 vermogens". De statusregel na ↑/↓ en na het filteren wordt voorgelezen. Bij een fout hoor je een alert. Let op: de rotor toont 13 regio's (bekend 🟢).
21. **Home.** Vier kerncijfers en het aantal per kaart. Bij een laadfout (bijv. vóór regels:test) staan "–" en de hint er, en werkt de rest van Home.
22. **Regressie.** Domeinen: toevoegen, bewerken, ↑/↓ bij "Alle soorten", Toon op soort (pijlen weg met de hint). Bestuursfuncties: toevoegen, verwijderen met "nog in gebruik". Club, Mijn account en CK-023-meldingen werken. Mobiel paneel en uitloggen werken.

**C. Import in test** (na B, op een opgeruimde stand: test-vermogens via de app verwijderen, controle "Alles klopt")
1. `npm run vermogens:import -- --droog`. Verwacht: "58 vermogens in de bronlijst: 58 nieuw, 0 al aanwezig, 0 met een opmerking" en het plan per domein, met Parkonderhoud en Parkbeveiliging bij Accommodatie. Stopt het met "het plan klopt niet", lees dan welk domein het noemt.
2. `npm run vermogens:import`, plan bekijken, "ja" typen. Verwacht: "58 vermogens toegevoegd".
3. Tweede run: "0 nieuw, 58 al aanwezig" en "Niets te doen."
4. `npm run vermogens:controle -- --droog` geeft "Alles klopt." (exitcode 0).
5. Op tst: Home toont Vermogens **58** en de kaarten tellen samen 58 (13 bij de pijlers, 45 ondersteunend). Bekijk Beheer → Vermogens met alle 58, ook op 375px.

**D. Live** (niet op 26 november 2026)
1. Werk de backlog bij en kies met de hoofdsessie het versienummer (bv. 0.7.0) en de CHANGELOG-kop.
2. Optioneel: maak een export of schermafdrukken van `structuurelementen` in productie (geen back-up op Spark).
3. `npm run regels:productie`. Controleer de publicatietijd. Rookproef met v0.6.0 live: een domein bewerken lukt.
4. Live zetten: `git checkout main && git merge --ff-only test && git push`. Controleer op `clubkompas.svn10.nl` de footer "Productie · Versie …". Home toont Vermogens 0, Beheer → Vermogens toont de lege staat.
5. Import in productie: `npm run vermogens:import -- --omgeving=productie --droog` (verwacht 58 nieuw), daarna zonder `--droog` (projectnaam intypen, "ja"), daarna `npm run vermogens:controle -- --omgeving=productie --droog` ("Alles klopt").
6. Rookproef live: Home toont 58, één vermogen bekijken. Wijzig niets aan de HCA-data, of draai je wijziging terug.

### Resterende vervolgpunten (naar de backlog)

- (a) Bevestigingsvraag domein: "Domein X verwijderen?…".
- (b) Specifieke melding bij `permission-denied` in Vermogens (de teller klopt niet → SVN10).
- 13 `region`-landmarks: `<section>` → `<div>` in de vermogensgroepen. Eén `h1` per pagina staat al open.
- Gebruikersdocs: "dubbele aanhalingstekens" in plaats van "aanhalingstekens".
- P0d `isBeheerder` (harde eis, staat al open), back-up/export, npm audit en firebase bijwerken, gevoelige vermogens, vermogen → bestuursfunctie (staan al open).
- Huisstijl: oranje hoofdactie, puzzelinkeping, "Nog geen vermogens" als link op Domeinen.
- ↑/↓ via `runTransaction` (CK-023-vervolg). Bij CK-021 twee items "Vermogens" in het menu.
- Optioneel: vermogens-rijen in de Rules Playground-tabel van de README.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
