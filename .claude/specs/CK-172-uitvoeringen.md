# Specificatie: CK-172 — Uitvoeringen van een activiteit

Route **groot** (ander datamodel, nieuwe Firestore-regels, omzetscript voor test). Fase 1, intake met gebruikersreis. Versie bij start: 0.14.0, branch `test`. Bouwt voort op CK-170 (`.claude/docs/CK-170.md`).

## Vragen voor Paul

1. **Een activiteit met uitvoeringen verwijderen.** Blokkeren of de uitvoeringen mee verwijderen?
   *Voorstel:* **mee verwijderen**, in één keer (een batch). De bevestiging noemt het aantal: "Activiteit ALV en 3 uitvoeringen verwijderen? Dit kan niet ongedaan worden gemaakt." De app telt vers vlak vóór `confirm()`. Waarom niet blokkeren zoals bij vermogens: een uitvoering hoort helemaal bij die ene activiteit en kan nergens anders heen. Blokkeren betekent dat de beheerder eerst elke uitvoering los moet weghalen. Bij een vermogen is dat anders: de activiteiten kun je aan een ander vermogen koppelen. Wil je de geschiedenis (afgelopen uitvoeringen) beschermen, kies dan blokkeren.
2. **Nieuwe activiteit: meteen een eerste uitvoering?**
   *Voorstel:* **ja.** Het toevoegformulier houdt de velden begindatum (verplicht) en einddatum (niet verplicht), net als nu. Opslaan maakt de activiteit en de eerste uitvoering samen aan. Bij bewerken staan de datums niet meer in het formulier; die beheer je bij de uitvoeringen. Een activiteit zonder uitvoering mag wel bestaan (bijvoorbeeld als je de laatste uitvoering weghaalt). De lijst toont dan "Nog geen uitvoering".
3. **Volgorde van de activiteitenlijst** (er is geen begindatum meer op de activiteit).
   *Voorstel:* in drie groepen, zonder kopjes:
   - eerst de activiteiten met een uitvoering die nog komt of nu bezig is, op die eerstvolgende datum (de eerste bovenaan);
   - dan de activiteiten waarvan alles voorbij is, op de laatste datum (de meest recente bovenaan);
   - dan de activiteiten zonder uitvoering, op naam.

   Bij gelijke datum op naam. Het alternatief is gewoon alfabetisch op naam; dat is rustiger, maar je ziet dan niet wat eraan komt.
4. **Dubbele namen bij het omzetten in test.** Activiteitnamen worden uniek in de club. In test kunnen al twee activiteiten met dezelfde naam staan (bijvoorbeeld twee keer "ALV" op verschillende datums).
   *Voorstel:* het omzetscript **meldt** die dubbelen alleen en voegt ze niet zelf samen. Je ruimt ze daarna in de app op: één activiteit houden, daar een uitvoering bijzetten en de andere verwijderen. Automatisch samenvoegen kan, maar maakt het script groter voor een paar testdocumenten.

## Wat wordt er gebouwd?
Een activiteit (CK-170) krijgt meerdere **uitvoeringen**: de keren dat de activiteit plaatsvindt, zoals de ALV een paar keer per jaar of de open dag elk seizoen. Een uitvoering heeft alleen een begindatum (verplicht) en een einddatum (niet verplicht). Naam, soort, vermogen en commissie blijven bij de activiteit; de datums gaan van de activiteit af. In Beheer → Activiteiten zie je per activiteit het aantal uitvoeringen en de eerstvolgende datum, en klap je de uitvoeringen uit om ze toe te voegen, te bewerken en te verwijderen. In test zet een script de bestaande activiteiten om (elke oude datum wordt één uitvoering).

## Gebruikersreis (samenvatting)
1. Een beheerder opent Beheer → Activiteiten. Niet-beheerders zien het item niet en komen via een directe link op Home uit (ongewijzigd).
2. De lijst staat in de volgorde uit vraag 3. Per rij:
   - het nummer
   - de naam, met daarachter de eerstvolgende datum ("12 mrt 2027"), of "bezig: 12 – 14 mrt 2027", of "laatst: 3 feb 2026" (gedempt), of "Nog geen uitvoering"
   - de soort als label, het vermogen, de commissie (zoals nu)
   - een knop **"3 uitvoeringen"** (`aria-expanded`, `aria-controls`) die de uitvoeringen onder de rij uitklapt
   - rechts bewerken en verwijderen

   Het filter op soort blijft.
3. Hij klikt op **+ Activiteit toevoegen** en vult naam, soort, vermogen, commissie, begindatum en eventueel einddatum in (vraag 2). Opslaan maakt de activiteit en de eerste uitvoering aan. Melding: "Activiteit ALV toegevoegd."
4. Hij klapt bij ALV de uitvoeringen uit. Hij ziet ze op datum (de oudste bovenaan), de afgelopen met het label "voorbij". Onderaan staat **+ Uitvoering toevoegen**.
5. Hij voegt een uitvoering toe met de eigen datumkiezer (begindatum verplicht, einddatum niet vóór begindatum, `min` gezet). Lukt het, dan staat de uitvoering op de goede plek, werken het aantal en de eerstvolgende datum in de rij bij, en komt er een melding "Uitvoering 12 mrt 2027 toegevoegd aan ALV."
6. Bewerken gebeurt in de regel van de uitvoering (zelfde twee datumvelden). Verwijderen vraagt `confirm()`: "Uitvoering 12 mrt 2027 van ALV verwijderen? Dit kan niet ongedaan worden gemaakt." De focus gaat naar de buurregel of naar "+ Uitvoering toevoegen".
7. Bij bewerken van de activiteit zelf staan alleen naam, soort, vermogen en commissie in het formulier.
8. Verwijderen van de activiteit: zie vraag 1.
9. Een vermogen of commissie met activiteiten verwijderen blijft geblokkeerd, zoals nu.

## Datamodel

**Afwijking van het voorstel: een platte collectie in plaats van een subcollectie.**

`clubs/{clubId}/uitvoeringen/{uid}` (automatisch id), met een verwijzing `activiteitId`. Dus niet `clubs/{clubId}/activiteiten/{id}/uitvoeringen/{uid}`.

Waarom:
- **De seizoensplanner (CK-160)** wil alle uitvoeringen van een club in een periode. Plat is dat één gewone query: `where('begindatum', '>=', van), where('begindatum', '<=', tot)`. Daarvoor is de automatische enkelveldsindex genoeg. Met een subcollectie is een collectionGroup-query nodig. Die vraagt:
  - een regel `match /{path=**}/uitvoeringen/{uid}`, waarin de `clubId` niet uit het pad te halen is;
  - dus een veld `clubId` in elk document, een `where('clubId', '==', …)` in elke query en een regel die daarop controleert;
  - een samengestelde index met bereik "collection group" (`clubId` + `begindatum`) in een nieuw `firestore.indexes.json`. `scripts/regels.mjs` publiceert nu alleen `firestore:rules`, dus ook dat moet erbij.
- **Het beheerscherm** laadt alle uitvoeringen van de club in één query en groepeert ze in de app op `activiteitId`. Met een subcollectie is dat één query per activiteit, of ook weer de collectionGroup.
- **Tellen en mee verwijderen** gaat even makkelijk: `where('activiteitId', '==', id)`. Firestore verwijdert subcollecties ook niet vanzelf mee, dus de subcollectie geeft daar geen voordeel.
- **Nadeel:** het pad laat niet meer zien bij welke activiteit een uitvoering hoort; dat staat in een veld. Een verwijzing naar een verdwenen activiteit kan blijven bestaan (zie de randgevallen). Bij een subcollectie kan dat ook.

**Uitvoering** `clubs/{clubId}/uitvoeringen/{uid}`, altijd alle drie de velden:

| Veld | Type | Regel |
|---|---|---|
| `activiteitId` | string | 1–100 tekens. De activiteit moet bestaan in dezelfde club. Wijzigt nooit: een uitvoering verhuist niet naar een andere activiteit. |
| `begindatum` | string | `JJJJ-MM-DD`, verplicht (niet leeg) |
| `einddatum` | string | `''` of `JJJJ-MM-DD`, niet vóór `begindatum` |

Geen status, geen locatie, geen omschrijving, geen auteur of tijdstempels (Paul, besluit 3; geen persoonsgegevens).

**Activiteit** `clubs/{clubId}/activiteiten/{id}`, nu altijd vier velden: `naam`, `soort`, `vermogenIds`, `commissieId`. `begindatum` en `einddatum` vervallen.

**Uniek:**
- De naam van een activiteit is uniek in de club (hoofdletters en spaties tellen niet mee, `naamBezet`). Alleen in de app, zoals bij projecten en CK-170. In de regels kan het niet zonder naamdocumenten zoals bij vermogens (`vermogensnamen`). Dat vraagt extra schrijfacties en tellers. Het risico (twee beheerders tegelijk, of via devtools) is klein en blijft binnen de eigen club.
- Twee uitvoeringen van dezelfde activiteit op dezelfde begindatum blokkeert de app (`dubbele-uitvoering`). Overlap van periodes wordt niet gecontroleerd.

**"Eerstvolgende"** ten opzichte van vandaag (de lokale datum als `JJJJ-MM-DD`, uit `getFullYear`/`getMonth`/`getDate`, nooit `toISOString()`, want dat is UTC):
- **bezig**: `begindatum <= vandaag <= (einddatum || begindatum)`. Die telt als eerstvolgende.
- anders **komend**: de vroegste uitvoering met `begindatum > vandaag`.
- anders **voorbij**: de laatste uitvoering ("laatst: …").
- anders **geen**: "Nog geen uitvoering".

**Voor later (niet nu bouwen):**
- CK-160 seizoensplanner: query op `begindatum` in `uitvoeringen`, de activiteitnamen uit één `laadActiviteiten`. Filter je ook op `activiteitId` plus een datumbereik, dan is pas een samengestelde index nodig.
- CK-161 "herhaal in het volgende seizoen": een nieuwe uitvoering met verschoven datums. Het model past daar al bij.

## Firestore-regels (`firestore.rules`)

Het blok `// ── Activiteiten (CK-170) ──` wordt `// ── Activiteiten en uitvoeringen (CK-170, CK-172) ──`. Hergebruik `geldigeDatum` en `tekstTot`.

```
function activiteitPad(clubId, id) {
  return /databases/$(database)/documents/clubs/$(clubId)/activiteiten/$(id);
}
function geldigeActiviteit(clubId, d) {
  return d.keys().hasOnly(['naam', 'soort', 'vermogenIds', 'commissieId'])
    && d.keys().hasAll(['naam', 'soort', 'vermogenIds', 'commissieId'])
    && geldigeOnderdeelnaam(d.naam)
    && d.soort in ['toernooi', 'clinic', 'evenement', 'bijeenkomst', 'opleiding', 'actie', 'overig']
    && d.vermogenIds is list && d.vermogenIds.size() == 1
    && d.vermogenIds[0] is string && d.vermogenIds[0].size() > 0 && d.vermogenIds[0].size() <= 100
    && exists(vermogenPad(clubId, d.vermogenIds[0]))
    && tekstTot(d.commissieId, 100)
    && (d.commissieId == '' || exists(commissiePad(clubId, d.commissieId)));
}
// existsAfter: een nieuwe activiteit en haar eerste uitvoering gaan samen in één batch
function geldigeUitvoering(clubId, d) {
  return d.keys().hasOnly(['activiteitId', 'begindatum', 'einddatum'])
    && d.keys().hasAll(['activiteitId', 'begindatum', 'einddatum'])
    && d.activiteitId is string && d.activiteitId.size() > 0 && d.activiteitId.size() <= 100
    && geldigeDatum(d.begindatum) && d.begindatum != ''
    && geldigeDatum(d.einddatum)
    && (d.einddatum == '' || d.einddatum >= d.begindatum)
    && existsAfter(activiteitPad(clubId, d.activiteitId));
}

match /activiteiten/{id} {            // ongewijzigd, behalve de velden
  allow read: if isLid(clubId);
  allow delete: if isBeheerder(clubId);
  allow create, update: if isBeheerder(clubId) && geldigeActiviteit(clubId, request.resource.data);
}
match /uitvoeringen/{uid} {
  allow read: if isLid(clubId);
  allow delete: if isBeheerder(clubId);
  allow create: if isBeheerder(clubId) && geldigeUitvoering(clubId, request.resource.data);
  allow update: if isBeheerder(clubId) && geldigeUitvoering(clubId, request.resource.data)
    && request.resource.data.activiteitId == resource.data.activiteitId;
}
```

- **`existsAfter` en niet `exists`:** in een batch ziet `exists()` de toestand vóór de batch. De eerste uitvoering van een nieuwe activiteit zou dan geweigerd worden. `existsAfter` weigert bovendien een uitvoering die in dezelfde batch als het verwijderen van haar activiteit wordt aangemaakt.
- **Kosten:** een uitvoering schrijven kost 2 documentlezingen (lidmaatschap en activiteit). De batch "activiteit + eerste uitvoering" komt op hooguit 3 + 2, en dezelfde lezing telt in één request maar één keer. Dat ligt ruim onder de limiet.
- **Oude velden op de activiteit: meteen strak, geen overgangsregel.** Lezen controleert geen velden, dus oude documenten blijven leesbaar. Alleen schrijven moet de nieuwe vorm hebben. Het omzetscript schrijft al in de nieuwe vorm, dus een tijdelijke uitzondering is niet nodig. Gevolg: tussen het publiceren van de regels en het uitrollen van de app kan de oude app (0.14.0) geen activiteit toevoegen of bewerken. In productie staan geen echte activiteiten en in test is dat even, dus dat is acceptabel. Zie de uitrolvolgorde.
- Het verwijderen van een activiteit wordt in de regels **niet** geblokkeerd als er nog uitvoeringen zijn, en ook niet afgedwongen dat ze mee gaan (dan is een teller nodig, net als bij CK-170 besluit 4). De app regelt het (vraag 1).

**Regeltests** in `tests/regels.test.mjs` (emulator). Pas de suite "CK-170 activiteiten: regels" aan (`ACTIVITEIT` zonder datums) en voeg een suite "CK-172 uitvoeringen: regels" toe:
- Activiteit:
  - met `begindatum` of `einddatum` erbij: geweigerd (extra veld)
  - zonder datums, verder geldig: lukt
  - de bestaande gevallen (soort, vermogen, commissie, naam) blijven groen
- Uitvoering, als beheerder:
  - aanmaken, bewerken en verwijderen via de app-functies: lukt
  - batch met een nieuwe activiteit en de eerste uitvoering: lukt
  - batch met het verwijderen van een activiteit en het aanmaken van een uitvoering daarvoor: geweigerd
  - mee verwijderen in een batch (activiteit en alle uitvoeringen): lukt
- Uitvoering, rechten: een lid zonder beheerrol leest maar schrijft niet (create, update, delete); een niet-lid leest niet en schrijft niet.
- Uitvoering, deze gevallen worden geweigerd:
  - een extra veld (bijvoorbeeld `status`, `locatie`, `clubId`) of een ontbrekend veld
  - een activiteit die niet bestaat, of een activiteit uit een andere club
  - `activiteitId` leeg, 101 tekens of geen string
  - een update die `activiteitId` wijzigt
  - een lege begindatum, een fout datumformaat (`2027-3-1`, `12-03-2027`), een einddatum vóór de begindatum
- Unittests (zonder emulator) voor de nieuwe pure functies: `eerstvolgendeUitvoering` (bezig, komend, voorbij, geen; de grens op vandaag), `sorteerActiviteiten` (de drie groepen), `uitvoeringBezet`, `activiteitBezet` (nu op de hele club), `vandaagTekst` (met een vaste `Date`), en de planfunctie van het omzetscript.

## Betrokken bestanden
- `src/activiteiten.js` (pure module, geen DOM, geen import uit `main.js`):
  - `VELDEN` zonder datums; `activiteitVelden()` en `geldigeActiviteit()` (spiegel van de regels) aangepast
  - nieuw: `uitvoeringVelden()`, `geldigeUitvoering()` (spiegel, zonder `existsAfter`), `uitvoeringDatumFout` (= de huidige `activiteitDatumFout`, hernoemen of een alias), `datumTekst` ongewijzigd
  - nieuw: `vandaagTekst(nu = new Date())`, `sorteerUitvoeringen(lijst)` (op begindatum, einddatum, id), `uitvoeringenPerActiviteit(lijst)` (Map op `activiteitId`), `eerstvolgendeUitvoering(lijst, vandaag)` → `{ stand: 'bezig' | 'komend' | 'voorbij' | 'geen', uitvoering }`
  - `sorteerActiviteiten(lijst, perActiviteit, vandaag)`: de nieuwe volgorde (vraag 3). Zonder uitvoeringen erbij: op naam (voor `laadActiviteitenVanVermogen`).
  - `activiteitBezet(lijst, naam, eigenId)`: zonder begindatum, op de hele club
  - nieuw: `uitvoeringBezet(uitvoeringen, begindatum, eigenId)`
  - nieuw: `laadUitvoeringen(db, clubId)`, `laadUitvoeringenVanActiviteit(db, clubId, activiteitId)`, `telUitvoeringenVanActiviteit(db, clubId, activiteitId)` (`getCountFromServer`)
  - `voegActiviteitToe(db, clubId, data, eersteUitvoering)`: `writeBatch` met `doc(collection(...))` voor het id van de activiteit
  - nieuw: `voegUitvoeringToe` (leest eerst of de activiteit bestaat, anders de code `activiteit-weg`), `bewerkUitvoering` en `verwijderUitvoering` (lezen eerst, anders de code `uitvoering-weg`)
  - `verwijderActiviteit`: volgens vraag 1. Bij mee verwijderen: lees de uitvoeringen en verwijder ze samen met de activiteit in één `writeBatch` (max. 500 writes; meer dan 499 uitvoeringen is niet realistisch, maar weiger dan netjes met een foutcode).
- `src/main.js`:
  - `renderActiviteitenBeheer`: uitvoeringen laden naast de activiteiten. Mislukt dat, dan fail-soft: een hint, de lijst op naam en geen uitklapknop. Verder: de nieuwe rij (eerstvolgende en uitklapknop), het uitklappaneel met de uitvoeringen en hun formulier, het toevoegformulier met de eerste uitvoering, het bewerkformulier zonder datums, `controleerDubbel` op naam in de club, de verwijdertekst met het aantal (vers tellen met `metTijdslimiet`), en welke panelen open zijn na opnieuw tekenen.
  - `WEG_CODES` en de foutteksten: `uitvoering-weg` "Deze uitvoering bestaat niet meer.", `dubbele-uitvoering` "Deze activiteit heeft al een uitvoering op deze datum.", `dubbele-activiteit` wordt "Er is al een activiteit met deze naam."
  - De blokkades in Beheer → Vermogens (~r. 2410) en Beheer → Commissies (~r. 3305): ongewijzigd. Ze tellen activiteiten, geen uitvoeringen.
- `src/style.css`: de rij krijgt een kolom voor de uitklapknop, plus een paneel `.uitvoering-lijst` en `.uitvoering-rij` met de bestaande tokens. Een gedempte stijl voor "voorbij" en "laatst: …" (contrast minstens 4,5:1). De container query voor smalle schermen bijwerken. De vormgeving werkt de Ervaring-medewerker uit.
- `firestore.rules`: het blok hierboven.
- `tests/regels.test.mjs`: de CK-170-suites aanpassen en de nieuwe suite erbij.
- `scripts/zet-uitvoeringen-om.mjs` (**nieuw**), met de pure logica in `scripts/lib/uitvoeringen-omzetten.mjs`, zoals `controleer-vermogens.mjs` en `lib/vermogens-hca.mjs`:
  - `startScript`, `vraag`, `inloggen` en `zoekClubId` uit `lib/omgeving.mjs`; standaard test; productie vraagt de projectnaam (behalve bij `--droog`); `--help`; namen door `veilig()`.
  - Leest `activiteiten` en `uitvoeringen`. Planfunctie `planOmzetting({ activiteiten, uitvoeringen })` → `{ omzetten, afwijkingen }`.
  - Per activiteit met een veld `begindatum` of `einddatum`: één uitvoering met **id = het activiteit-id** (dan kan een tweede keer draaien geen dubbele maken) en `{ activiteitId, begindatum, einddatum }`. Daarna `updateDoc` met `deleteField()` voor de twee velden, beide in één `writeBatch` per activiteit. Bestaat die uitvoering al, dan alleen de velden weghalen.
  - Meldt zonder te schrijven: een ongeldige of lege oude begindatum, een einddatum vóór de begindatum, dubbele namen (vraag 4), en een activiteit die ook na het omzetten niet aan de regels voldoet (bijvoorbeeld een verdwenen vermogen). Die laatste wordt overgeslagen, met een tip om ze in de app te herstellen.
  - `--droog`: toont het aantal activiteiten, hoeveel nog oude velden hebben, per activiteit "naam: 12 mrt 2027 → 1 uitvoering", en de afwijkingen. Er wordt niets geschreven. Zonder `--droog`: dezelfde lijst, dan `Typ "ja"`. Exitcode 0 als alles is omgezet of er niets te doen is, anders 1.
  - `package.json`: `"uitvoeringen:omzetten": "node scripts/zet-uitvoeringen-om.mjs"`.
- `scripts/seed-testclub.mjs`: alleen aanpassen als het activiteiten aanmaakt (nu niet).
- `.claude/backlog.md`: CK-172 opnemen en bijwerken. `.claude/docs/CK-172.md` na de bouw.

## Uitrolvolgorde
1. `npm run test:regels` groen.
2. `npm run regels:test` (Paul).
3. `npm run uitvoeringen:omzetten -- --droog` op test, de uitvoer bekijken, daarna zonder `--droog` (Paul).
4. De app op tst controleren.
5. Productie: `npm run regels:productie` vóór de merge naar `main`. Eventueel `npm run uitvoeringen:omzetten -- --droog --omgeving=productie` ter controle (verwacht: niets te doen).

## Acceptatiecriteria
- [ ] Een activiteit heeft geen datums meer. Uitvoeringen staan in `clubs/{clubId}/uitvoeringen` met precies `activiteitId`, `begindatum` en `einddatum`.
- [ ] Een nieuwe activiteit krijgt in hetzelfde formulier een eerste uitvoering (vraag 2). Activiteit en uitvoering worden samen opgeslagen, of geen van beide.
- [ ] Het bewerkformulier van een activiteit heeft geen datumvelden.
- [ ] Een activiteitnaam die al in de club bestaat, geeft een veldfout bij de naam (ook in een ander jaar).
- [ ] Per rij staan het aantal uitvoeringen en de eerstvolgende datum, met de standen bezig, komend, voorbij ("laatst: …") en geen ("Nog geen uitvoering").
- [ ] De lijst staat in de volgorde uit vraag 3. Het filter op soort werkt nog. De rijnummers zijn de plaats in de hele lijst.
- [ ] Uitklappen (`aria-expanded`, met toetsenbord) toont de uitvoeringen op datum, de afgelopen met "voorbij", en de knop "+ Uitvoering toevoegen".
- [ ] Een uitvoering toevoegen, bewerken en verwijderen. Er komen veldfouten bij een lege of halve begindatum, een einddatum vóór de begindatum en een tweede uitvoering op dezelfde begindatum. Bij de einddatum staat `min`. Er is een melding bij succes en de focus gaat naar de buurregel of naar de toevoegknop.
- [ ] Een activiteit verwijderen volgens vraag 1. Het aantal uitvoeringen wordt vers geteld; mislukt het tellen, dan wordt er niet verwijderd.
- [ ] Een activiteit of uitvoering die intussen weg is, geeft "bestaat niet meer" en de lijst wordt opnieuw geladen.
- [ ] Regels: alleen een beheerder schrijft, elk lid leest. Velden precies volgens het datamodel, `existsAfter` op de activiteit, `activiteitId` niet te wijzigen. Alle regeltests en unittests groen.
- [ ] Het omzetscript: `--droog` meldt wat er staat en schrijft niets. De echte run zet elke oude datum om naar één uitvoering, en een tweede keer draaien verandert niets meer.
- [ ] `src/activiteiten.js` heeft nog steeds geen DOM-code en geen import uit `main.js`.
- [ ] `npm run build` en `npm run test:regels` slagen.

## Wat mag er niet kapotgaan?
- De verwijderblokkades bij Beheer → Vermogens en Beheer → Commissies (die tellen activiteiten) en bij bestuursfuncties.
- `laadActiviteitenVanVermogen` en `telActiviteitenVanCommissie` (voor de blokkades en CK-171).
- Beheer → Commissies, Projecten en Samenwerkingen (de gedeelde `renderOnderdeelBeheer`), en de datumvelden van projecten (`geldigeDatum` en `geldigePeriode` blijven gelijk).
- P0d: `isBeheerder`, `magNaar`, `geenBeheer`; alles wat niet genoemd is, blijft dicht in de regels.
- De eigen datumkiezer en keuzelijst (`startEigenVelden`), ook in een uitgeklapt paneel en na opnieuw tekenen.
- `datumTekst` zonder `new Date()` op een datum.
- De bestaande regeltests (152) buiten CK-170.

## Architectuurlaag
**Model-laag (M2, activiteiten)** — Een uitvoering is een onderdeel van de activiteit in Club → Domein → Vermogen → Activiteit → Uitvoeringen. De platte collectie en de pure module houden de weg vrij voor de seizoensplanner (P9, CK-160) en de seizoensoverdracht (P8, CK-161), zonder dat daar nu iets voor gebouwd wordt.

## Randgevallen en risico's
- **Een uitvoering bij een verdwenen activiteit** (twee beheerders tegelijk, of een batch die half mislukt bij meer dan 500): die uitvoering komt in geen enkele lijst. Ze is onschadelijk, maar wordt meegeteld als CK-160 alleen `uitvoeringen` opvraagt. De planner moet uitvoeringen zonder bekende activiteit dus overslaan. Het omzetscript kan die wezen ook melden.
- **Een uitvoering toevoegen terwijl een andere beheerder de activiteit verwijdert:** `existsAfter` weigert. De app leest eerst (`activiteit-weg`).
- **Een oud document met datums in test, als de app eerder uitrolt dan het script draait:** de app negeert `begindatum` en `einddatum` op de activiteit en toont "Nog geen uitvoering". Bewerken schrijft de vier velden, en dan is de oude datum weg. Daarom het script vóór de app (de uitrolvolgorde).
- **Vandaag en tijdzone:** "vandaag" is de lokale datum van de gebruiker. Rond middernacht kan een uitvoering een minuut te vroeg of te laat "voorbij" zijn; dat is acceptabel.
- **Veel uitvoeringen per activiteit** (een wekelijkse training): het paneel toont ze allemaal. Er is geen paginering. Voor een training is CK-161 of een herhaalfunctie later de oplossing; noteer het als vervolg.
- **Kosten:** één extra query bij het laden van het beheerscherm (alle uitvoeringen van de club). Bij honderden documenten is dat nog prima.
- **Indexen:** `where('activiteitId', '==')` en een bereik op `begindatum` gebruiken de automatische enkelveldsindexen. Er is geen `firestore.indexes.json` nodig.
- **AVG:** er komen geen persoonsgegevens bij. Er zijn geen vrije tekstvelden.
- **Bekende beperking blijft:** `geldigeDatum` controleert alleen het patroon (`2027-02-31` komt erdoor).

## Besluiten van Paul

Al besloten (25-11-2026):
1. Het begrip heet **uitvoering**.
2. Vermogen en commissie blijven bij de activiteit. Een uitvoering heeft alleen `begindatum` (verplicht) en `einddatum` (niet verplicht, niet vóór de begindatum).
3. Geen status en geen locatie per uitvoering.
4. In productie niets omzetten. In test een omzetscript met `--droog`, dat Paul zelf draait.

Besloten door Paul (25-11-2026, na de intake), alle voorstellen overgenomen:
5. **Datamodel:** een eigen lijst `clubs/{clubId}/uitvoeringen/{uid}` met `activiteitId`, `begindatum` en `einddatum` (geen subcollectie).
6. **Verwijderen:** een activiteit met uitvoeringen wordt samen met haar uitvoeringen verwijderd, na één bevestiging met het aantal.
7. **Formulier:** een nieuwe activiteit krijgt meteen haar eerste uitvoering in hetzelfde formulier (samen opgeslagen). Bewerken van de activiteit toont geen datums. Een activiteit zonder uitvoering mag ("Nog geen uitvoering").
8. **Volgorde:** eerst bezig of komend op eerstvolgende datum, dan voorbij (meest recente eerst, "laatst: …"), dan zonder uitvoering op naam.
9. **Dubbele namen bij omzetten:** het script meldt ze alleen; Paul voegt ze in de app samen.
10. **Volgorde in het uitklappaneel:** met een keuzeknop "Nieuwste eerst" of "Oudste eerst". Standaard staat de oudste bovenaan. De keuze wordt bewaard (zie het ontwerp).
11. **Bij 0 uitvoeringen** staat er "Geen uitvoeringen" op de knop. De meldingen over uitvoeringen staan in het paneel.
