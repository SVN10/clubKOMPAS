# Specificatie: CK-170 — Activiteit aanmaken

Route **groot** (nieuw datamodel en nieuwe Firestore-regels). Fase 1, intake met gebruikersreis. Versie bij start: 0.13.5, branch `test`.

## Vragen voor Paul

1. **Datum.** Eén datum of een periode?
   *Voorstel:* een **begindatum (verplicht)** en een **einddatum (optioneel)**. Een eendaagse activiteit (clinic, ALV) vul je met één datum in. Een meerdaagse activiteit (toernooi, kamp) krijgt ook een einddatum. De einddatum ligt niet vóór de begindatum. Op het scherm staat "12 mrt 2027" of "12 – 14 mrt 2027". Er zijn geen tijden.
2. **Soort.** Is deze vaste lijst goed?
   *Voorstel:* zeven soorten:
   - Toernooi
   - Clinic of training
   - Evenement (clubdag, feest)
   - Bijeenkomst (ALV, informatieavond)
   - Opleiding (cursus, scheidsrechters)
   - Actie (klusdag, inzameling)
   - Overig

   Sleutels: `toernooi`, `clinic`, `evenement`, `bijeenkomst`, `opleiding`, `actie`, `overig`. Ze staan vast in de code en in de regels. Je kunt ze per club nog niet aanpassen.
3. **Omschrijving.** Krijgt een activiteit een omschrijving, zoals projecten die hebben?
   *Voorstel:* **nu niet.** Vrije tekst is precies de plek waar namen van leden in sluipen. Zonder dat veld blijft CK-170 zonder persoonsgegevens en is er geen compliance-controle nodig. Een omschrijving kan later met een eigen story erbij.
4. **Verwijderen van een vermogen of commissie die nog activiteiten heeft.**
   *Voorstel:* **blokkeren in de app**, zoals bij bestuursfuncties die nog eigenaar zijn. Vóór de bevestiging telt de app vers. Voorbeeld van de melding: "Dit vermogen hoort nog bij 3 activiteiten. Koppel die eerst aan een ander vermogen." Er komt geen teller in de regels (zoals `aantalVermogens`), omdat die bij meerdere vermogens per activiteit veel ingewikkelder wordt. Het restrisico is dat twee beheerders tegelijk werken en er een verwijzing naar een verdwenen vermogen achterblijft. Dat vangt de lijst fail-soft op, zie de randgevallen. Akkoord, of wil je de harde garantie in de regels (een teller op het vermogen en op de commissie, plus transacties)?
5. **Plaats in het zijmenu en volgorde in de lijst.**
   *Voorstel:* Beheer → Activiteiten komt **direct na Vermogens** (Club, Bestuursfuncties, Commissies, Domeinen, Vermogens, **Activiteiten**, Projecten, Samenwerkingen), met een nieuw pictogram "kalender". De lijst staat **op datum** (de eerste bovenaan) en heeft geen knoppen ↑ en ↓. Bij activiteiten bepaalt de datum de volgorde, niet de beheerder.

## Wat wordt er gebouwd?
Een beheerpagina **Beheer → Activiteiten**. Daar voegt een beheerder activiteiten toe, bewerkt ze en verwijdert ze. Een activiteit heeft een naam, een soort uit een vaste lijst, een datum of periode, precies één vermogen (verplicht) en eventueel één commissie. De opslag- en schrijflogica komt in een eigen module `src/activiteiten.js`. Zo kunnen andere schermen (een vermogen, de plaat) die later hergebruiken. In deze story wordt alleen het beheerscherm gebouwd. Er komen geen persoonsgegevens in.

## Gebruikersreis (samenvatting)
1. Een beheerder opent in het zijmenu Beheer → Activiteiten. Iemand die geen beheerder is, ziet het item niet. Gaat die toch naar de pagina, dan komt hij op Home uit (`magNaar`, `geenBeheer`).
2. Zijn er nog geen activiteiten, dan ziet hij de lege staat "Nog geen activiteiten" met een korte uitleg en de knop **+ Activiteit toevoegen**.
3. Hij klikt op toevoegen en vult het formulier in:
   - Naam
   - Soort (keuzelijst, verplicht)
   - Vermogen (keuzelijst, verplicht)
   - Commissie (keuzelijst, "Geen commissie" mag)
   - Begindatum en einddatum (de eigen datumkiezer)
4. Hij klikt op **Opslaan** (primaire knop). Gaat er iets mis, dan staat de fout bij het veld en springt de focus naar het eerste foute veld. Lukt het, dan sluit het formulier, verschijnt de activiteit in de lijst op de juiste plek (op datum) en komt er een melding "Activiteit X toegevoegd."
5. In de tabel ziet hij per rij:
   - het nummer
   - de naam met de datum erachter (zoals de periode bij projecten, besluit 30)
   - de soort als rond label
   - het vermogen
   - de commissie (of een streep)
   - rechts de knoppen bewerken en verwijderen

   Boven de tabel staat een filter op soort ("Alle soorten").
6. Bewerken gebeurt in de rij, met hetzelfde formulier. Verwijderen vraagt om bevestiging met `confirm()`: "Activiteit X verwijderen? Dit kan niet ongedaan worden gemaakt."
7. Hij verwijdert in Beheer → Vermogens een vermogen of in Beheer → Commissies een commissie die nog activiteiten heeft. Dan krijgt hij een melding dat dit niet kan, met het aantal activiteiten (vraag 4).

## Datamodel

Collectie `clubs/{clubId}/activiteiten/{id}`. Het id is automatisch (`addDoc`).

| Veld | Type | Regel |
|---|---|---|
| `naam` | string | Zoals `geldigeOnderdeelnaam`: 2–100 tekens, het eerste teken een letter of cijfer, daarna ook `&'.,()+/-`, getrimd en geen dubbele spaties. Daarmee kunnen er geen onzichtbare tekens in. Uniek alleen in de app (`naamBezet`), niet in de regels, zoals bij projecten. |
| `soort` | string | Een van de 7 sleutels (vraag 2) |
| `begindatum` | string | `JJJJ-MM-DD`, verplicht (niet leeg) |
| `einddatum` | string | `''` of `JJJJ-MM-DD`, niet vóór `begindatum` |
| `vermogenIds` | list | Nu **precies 1** id (string van 1–100 tekens). Het vermogen moet bestaan. |
| `commissieId` | string | `''` of het id van een bestaande commissie (≤ 100) |

Er is geen `volgorde`-veld. De lijst sorteert op `begindatum`, dan `einddatum`, dan `naam` (`localeCompare 'nl'`). Er is ook geen `omschrijving` (vraag 3) en er zijn geen tijdstempels of auteur (die zijn niet nodig en schelen persoonsgegevens).

**Afweging: één of meer vermogens.** Gekozen is een lijst `vermogenIds` die nu precies één element mag hebben, en geen los veld `vermogenId`.
- **Voordeel:** naar meerdere vermogens gaan vraagt dan alleen het verruimen van `size() == 1` in de regels en in de app, en een andere keuzelijst. Er is geen migratie van bestaande documenten nodig. Opvragen per vermogen kan nu al met `where('vermogenIds', 'array-contains', id)`.
- **Nadeel:**
  - De regels kunnen niet over een lijst lopen. Bij meer vermogens komt er per plaats een vaste controle (bijvoorbeeld maximaal 3: `[0]`, `[1]`, `[2]`).
  - Firestore staat per query maar één `array-contains` toe.
  - De dubbele-check moet in de app.

  Dat is aanvaardbaar.

## Firestore-regels (`firestore.rules`)

Een nieuw blok `// ── Activiteiten (CK-170) ──` met hulpfuncties. Hergebruik `geldigeOnderdeelnaam`, `geldigeDatum`, `tekstTot` en `vermogenPad`.

```
function commissiePad(clubId, id) { return /databases/$(database)/documents/clubs/$(clubId)/commissies/$(id); }
function geldigeActiviteit(clubId, d) {
  return d.keys().hasOnly(['naam', 'soort', 'begindatum', 'einddatum', 'vermogenIds', 'commissieId'])
    && d.keys().hasAll(['naam', 'soort', 'begindatum', 'einddatum', 'vermogenIds', 'commissieId'])
    && geldigeOnderdeelnaam(d.naam)
    && d.soort in ['toernooi', 'clinic', 'evenement', 'bijeenkomst', 'opleiding', 'actie', 'overig']
    && geldigeDatum(d.begindatum) && d.begindatum != ''
    && geldigeDatum(d.einddatum)
    && (d.einddatum == '' || d.einddatum >= d.begindatum)
    && d.vermogenIds is list && d.vermogenIds.size() == 1
    && d.vermogenIds[0] is string && d.vermogenIds[0].size() > 0 && d.vermogenIds[0].size() <= 100
    && exists(vermogenPad(clubId, d.vermogenIds[0]))
    && tekstTot(d.commissieId, 100)
    && (d.commissieId == '' || exists(commissiePad(clubId, d.commissieId)));
}
match /activiteiten/{id} {
  allow read: if isLid(clubId);
  allow delete: if isBeheerder(clubId);
  allow create, update: if isBeheerder(clubId) && geldigeActiviteit(clubId, request.resource.data);
}
```

- De `exists()`-controles houden de verwijzingen bij het schrijven heel. Elke schrijfactie kost dan hooguit 3 documentlezingen (het lidmaatschap, het vermogen en de commissie). Dat ligt ruim onder de limiet.
- Een update op een activiteit waarvan het vermogen intussen weg is, wordt geweigerd. De app moet dan eerst om een nieuw vermogen vragen (zie de randgevallen).
- De regels voor vermogens en commissies veranderen niet (vraag 4, voorstel).

**Regeltests** in `tests/regels.test.mjs` (emulator), minimaal deze gevallen:
- Een beheerder maakt een geldige activiteit aan, bewerkt en verwijdert die. Dat lukt.
- Een lid dat geen beheerder is, kan niet aanmaken, bewerken of verwijderen, maar wel lezen.
- Iemand die geen lid is, kan niet lezen.
- Deze gevallen worden geweigerd:
  - een extra veld of een ontbrekend veld
  - een onbekende soort
  - een lege begindatum, een fout datumformaat, of een einddatum vóór de begindatum
  - `vermogenIds` met 0 of 2 elementen, of als string in plaats van lijst
  - een vermogen dat niet bestaat
  - een commissie die niet bestaat
  - een naam met een nul-breedte- of bidi-teken, een naam van 1 teken of van 101 tekens

## Betrokken bestanden
- `src/activiteiten.js` (**nieuw**). Een pure module met `db` en `clubId` als parameter, zoals `onderdelen.js`:
  - `SOORTEN` (een lijst met `[sleutel, label]`) en `SOORT_LABEL`
  - `activiteitVelden()`: alleen de velden die de regels verwachten
  - `geldigeActiviteit()`: een spiegel van de regels
  - `activiteitDatumFout(begin, eind)`: de begindatum is verplicht. Hergebruik daarbij `geldigeDatum` uit `onderdelen.js`.
  - `datumTekst(begin, eind)`: "12 mrt 2027", "12 – 14 mrt 2027" of "30 mrt – 2 apr 2027". Alleen string-splitsen, geen `new Date()`.
  - `sorteerActiviteiten()`
  - `laadActiviteiten(db, clubId)`
  - `laadActiviteitenVanVermogen(db, clubId, vermogenId)` (`array-contains`; voor later en voor de guard)
  - `telActiviteitenVanCommissie(db, clubId, commissieId)`
  - `voegActiviteitToe()`, `bewerkActiviteit()` en `verwijderActiviteit()`: eerst lezen, en bij een verdwenen document de code `activiteit-weg`, zoals `bewerkOnderdeel`.
- `src/main.js`:
  - `ZIJMENU`: een item `{ id: 'activiteiten', naam: 'Activiteiten', ico: 'kalender' }` na Vermogens (vraag 5). Daarmee valt de pagina vanzelf onder `BEHEER_PAGINAS`.
  - `NAV_DOEL`: `['activiteiten', renderActiviteitenBeheer]`.
  - `MENU_ICOON`: een pictogram `kalender` in dezelfde lijnstijl (48×48, lijndikte 3).
  - `renderActiviteitenBeheer(gebruiker)`:
    - Bovenaan de guard `geenBeheer(gebruiker)`.
    - De opbouw is gelijk aan `renderOnderdeelBeheer`: beheerbalk, formulier, `meldingenHTML`, een laadfout met herladen, de lege staat, een tabel met `role="table"`, en `metOpslaan`, `valideerVelden`, `bevestigVerwijderen` en `focusInLijst`.
    - Laden: de activiteiten zijn hard nodig. Vermogens, domeinen en commissies laden fail-soft, elk met een hint als het niet lukt. Zonder vermogens kun je niet toevoegen of opslaan.
    - De keuzelijst Vermogen toont "Vermogensnaam (Domeinnaam)", gesorteerd op domein en daarna op volgorde. De naam staat vooraan, omdat de keuzelijst op de eerste letters zoekt. `keuzelijst.js` kent geen `optgroup`.
  - `WEG_CODES` en de foutteksten: `activiteit-weg` met "Deze activiteit bestaat niet meer." en `dubbele-activiteit` met "Er is al een activiteit met deze naam op deze datum." (zie de randgevallen).
  - **Guard in Beheer → Vermogens** (de tak `actie === 'verwijder'`, ongeveer regel 2386): vóór `bevestigVerwijderen` vers tellen met `laadActiviteitenVanVermogen` (met `metTijdslimiet`). Is het aantal groter dan 0, of mislukt het tellen, dan toon je een melding in `sectieFout` en ga je niet verder. De tekst volgt het patroon van de bestuursfuncties (ongeveer regel 3096).
  - **Guard in Beheer → Commissies** (`renderOnderdeelBeheer`, alleen bij `soort === 'commissies'`, de tak verwijderen): op dezelfde manier met `telActiviteitenVanCommissie`.
- `src/style.css`:
  - een rijlayout `activiteit-rij` (subgrid, kolommen #, Activiteit, Soort, Vermogen, Commissie, acties; besluit 20)
  - een rond label `soort-label` (besluit 23), met bestaande tokens en zonder nieuwe kleuren buiten de huisstijl
- `firestore.rules`: het blok hierboven.
- `tests/regels.test.mjs`: de gevallen hierboven.
- `scripts/seed-testclub.mjs` (optioneel): een paar voorbeeldactiviteiten voor tst.
- `.claude/backlog.md`: CK-170 bijwerken.

## Acceptatiecriteria
- [ ] Beheer → Activiteiten staat in het zijmenu op de plek uit vraag 5, met het pictogram kalender. Het is alleen zichtbaar en bereikbaar voor een beheerder.
- [ ] Lege staat: "Nog geen activiteiten" met uitleg en de knop **+ Activiteit toevoegen**.
- [ ] Toevoegen met naam, soort, vermogen, commissie en datum(s). De soort, het vermogen en de begindatum zijn verplicht. De commissie mag "Geen commissie" zijn. De einddatum is optioneel.
- [ ] Er komt een veldfout (met `aria-describedby` en de focus op het eerste foute veld) bij:
  - een ongeldige naam
  - geen soort
  - geen vermogen
  - geen begindatum of een halve datum
  - een einddatum vóór de begindatum
- [ ] Bij de einddatum mag je in de datumkiezer geen dag vóór de begindatum kiezen (`min`, zoals bij projecten).
- [ ] De tabel volgt besluiten 19–24 en 30–32:
  - witte kaarten met lijnen van 1 px
  - kolommen naast elkaar met 30 px ertussen
  - geen vette waarden
  - de datum achter de naam
  - de soort als rond label
  - de knoppen rechts
  - rijnummers als plaats in de hele lijst
  - geen ↑ en ↓
- [ ] De lijst staat op begindatum. Het filter op soort werkt, met een verborgen label "Toon" en een statusmelding voor schermlezers.
- [ ] Bewerken in de rij en verwijderen met `confirm()` en de vaste tekst (besluit 41). Er is een melding bij succes en de focus gaat naar de buurrij of naar de terugvalknop.
- [ ] Een vermogen of een commissie die nog activiteiten heeft, kan niet worden verwijderd. De melding noemt het aantal. Kan er niet geteld worden, dan wordt verwijderen ook geblokkeerd.
- [ ] Regels: alleen een beheerder schrijft. Elk lid leest. De velden zijn precies volgens het datamodel, met `exists()` op het vermogen en de commissie. Alle regeltests zijn groen en de bestaande tests blijven groen.
- [ ] `src/activiteiten.js` heeft geen DOM-code en importeert niets uit `main.js`. Een ander scherm kan het dus gebruiken.
- [ ] `npm run build` en `npm run test:regels` slagen.

## Wat mag er niet kapotgaan?
- Beheer → Vermogens: toevoegen, hernoemen, verplaatsen, ↑ en ↓, en verwijderen zonder activiteiten. De regels en tellers voor vermogens blijven ongewijzigd.
- Beheer → Commissies, Projecten en Samenwerkingen (de gedeelde `renderOnderdeelBeheer`). De guard alleen bij commissies.
- De verwijderblokkade bij bestuursfuncties (activiteiten hebben geen eigenaar en tellen daar niet mee).
- P0d: `isBeheerder`, `magNaar`, `geenBeheer`, en dat alles wat niet genoemd is dicht blijft in de regels.
- De eigen keuzelijst en datumkiezer (`startEigenVelden`) en het inklappen van het zijmenu.
- Het Vermogensoverzicht en de plaat (nog geen activiteiten erop).

## Architectuurlaag
**Model-laag (M2, activiteiten)** — Activiteiten zijn het onderste niveau van Club → Domein → Vermogen → Activiteiten. Ze verwijzen naar een vermogen (model) en een commissie (platform-masterdata). Het beheerscherm is de eerste afnemer. De module `activiteiten.js` is bewust laag- en scherm-onafhankelijk, zodat feature-schermen (de vermogenskaart en de plaat) haar later hergebruiken.

## Randgevallen en risico's
- **Er verdwijnt een vermogen of commissie terwijl er nog activiteiten zijn** (twee beheerders tegelijk, of oude data). De lijst toont dan "vermogen bestaat niet meer" of "commissie bestaat niet meer" (verborgen tekst bij de streep). Bij bewerken moet je een ander vermogen kiezen. Was de commissie weg, dan zet opslaan die op "Geen commissie". De regels weigeren anders het schrijven. Een verwijderde activiteit heeft geen gevolgen voor iets anders.
- **Er zijn geen vermogens** in de club. Dan staat er een hint "Maak eerst een vermogen aan in Beheer → Vermogens" met een link, en is toevoegen uitgeschakeld.
- **Een dubbele naam.** Dezelfde naam in een ander jaar is normaal (Clubdag 2026, Clubdag 2027). *Voorstel:* blokkeer alleen dezelfde naam op dezelfde begindatum (`dubbele-activiteit`), en alleen in de app.
- **Datum en tijdzone:** nooit `new Date('JJJJ-MM-DD')` voor de weergave, alleen splitsen (zoals `maandJaar`).
- **Lange lijsten** (een seizoen met veel activiteiten): voorlopig geen paginering. Het filter op soort helpt. Komend en afgelopen kan een vervolgstory worden.
- **De lengte van de keuzelijst Vermogen** (tientallen vermogens zonder groepering). Daarom staat de naam vooraan, zodat het zoeken op letters werkt.
- **Kosten van de regels:** de `exists()`-controles tellen als lezingen. Bij een latere uitbreiding naar N vermogens komen er N lezingen bij. Houd N klein (≤ 3).
- **AVG:** er staan geen persoonsgegevens in het model. Komt er later een omschrijving of komen er deelnemers bij, dan is een compliance-controle nodig.
- **Indexen:** `array-contains` op één veld en de query op `commissieId` hebben genoeg aan de automatische enkelveldsindexen. Er is geen `firestore.indexes.json` nodig.

## Besluiten van Paul (25-11-2026)

Paul heeft alle vijf de voorstellen overgenomen:
1. Datum: een begindatum (verplicht) en een einddatum (niet verplicht). De einddatum ligt niet vóór de begindatum.
2. Soort: de vaste lijst zoals voorgesteld (Toernooi, Clinic of training, Evenement, Bijeenkomst, Opleiding, Actie, Overig).
3. Omschrijving: nu niet. Geen vrije tekst, dus geen compliance-controle.
4. Verwijderen van een vermogen of commissie met activiteiten: de app blokkeert dat en telt vlak vóór de bevestiging opnieuw. Er komt geen teller in de regels.
5. Zijmenu: Activiteiten direct na Vermogens, met een kalenderpictogram. De lijst staat op datum, zonder ↑ en ↓.
