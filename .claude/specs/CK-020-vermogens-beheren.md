# Specificatie: CK-020 — Vermogens beheren

Fase 1 (intake), 23 november 2026, herzien dezelfde dag: uniciteit en domein-guard worden door de Firestore-regels afgedwongen (besluit Paul). Leidend: `.claude/specs/CK-020-besluiten.md`. Bron voor de namen: `.claude/specs/CK-020-bron-vermogensoverzicht.md`.
Scope (Paul, 23 november 2026): alleen CK-020. De plaat (CK-021) komt in een volgende ronde; het datamodel houdt er rekening mee, maar zij wordt hier niet gespecificeerd. Er zijn geen Cloud Functions (Spark-plan): alles wat moet kloppen, loopt via transacties in de app plus Firestore-regels.

## Wat wordt er gebouwd?

Een bestuurder kan per pijler of ondersteunend domein de **vermogens** van de club vastleggen, wijzigen, ordenen en verwijderen (nieuwe collectie `clubs/{clubId}/vermogens`). Een vermogen heeft alleen een naam, een domein en een volgorde. Twee hulpmiddelen maken de regels afdwingbaar: per naam een **naamdocument** (`vermogensnamen`), zodat de naam uniek is, en een **teller** `aantalVermogens` op het domein, zodat een domein met vermogens niet verwijderd of overkoepelend kan worden. Home toont een vierde kerncijfer en per domeinkaart het aantal. Een importscript zet de 58 HCA-vermogens neer en een controlescript toetst en herstelt naamdocumenten en tellers.

## Gebruikersreis (samenvatting)

1. Bestuurder opent **Beheer → Vermogens** in het zijmenu (advies hieronder).
2. Ziet alle vermogens gegroepeerd per domein, in de volgorde van de domeinen; per groep een kop met domeinnaam en soort.
3. Kiest **+ Toevoegen**: vult naam in, kiest het domein (alleen pijlers en ondersteunende domeinen), slaat op. Het vermogen komt onderaan in dat domein.
4. **Bewerken**: naam wijzigen en/of ander domein kiezen. **↑/↓**: volgorde binnen het domein. **Verwijderen**: met bevestiging.
5. Op **Home** ziet hij het totaal en per domeinkaart "n vermogens".
6. Probeert hij in **Beheer → Domeinen** een domein met vermogens te verwijderen of naar overkoepelend te zetten, dan krijgt hij een melding met wat hij eerst moet doen. Ook via de API of een oud tabblad lukt het niet: de regels weigeren.

### Advies: waar beheren? Eigen tabblad Beheer → Vermogens

| | Eigen tabblad | Binnen een domein (in het bewerkformulier van Domeinen) |
|---|---|---|
| Past bij besluit | Ja: besluiten noemen "CK-020 Vermogens beheren (Beheer → Vermogens)" | Nee |
| Overzicht | 58 vermogens in één lijst, gegroepeerd, met filter | Per domein openklappen; geen totaalbeeld |
| Verplaatsen naar ander domein | Eén keuzelijst | Omslachtig (verwijderen en elders opnieuw) |
| Complexiteit | Nieuwe render-functie volgens het bestaande patroon (Bestuursfuncties) | Bewerkformulier en rijen van Domeinen worden nog groter; lijst staat al krap naast het zijmenu (CK-044) |
| P0d | Eén item in de groep Beheer, zelfde guard | Zelfde |

**Advies: eigen tabblad.** Zijmenu Beheer: Domeinen, **Vermogens**, Bestuursfuncties, Club. Lijst gegroepeerd per domein met een filter (keuzelijst "Alle domeinen" + de 13 domeinen; geen knoppenrij, dat zijn er te veel). Optioneel (Could): in de domeinenlijst een tekst "n vermogens" die naar Vermogens navigeert met het filter op dat domein. De ervaring-medewerker werkt indeling, teksten en mobiel gedrag uit.

## Datamodel

**`clubs/{clubId}/vermogens/{id}`** (automatisch id, vooraf aangemaakt met `doc(collection(...))` zodat het in de transactie bekend is):

| Veld | Type | Regel |
|---|---|---|
| `naam` | string | 2–100 tekens, toegestane tekens (zie Naamregels), uniek binnen de club |
| `domeinId` | string | id van een `structuurelementen`-document met `type` `pijler` of `domein` |
| `volgorde` | int ≥ 1 | 1 t/m n **binnen het domein** |

**`clubs/{clubId}/vermogensnamen/{sleutel}`** (nieuw, technisch):

| Veld | Type | Regel |
|---|---|---|
| (document-id) | | `sleutel` = `naam.toLowerCase()` (regels: `naam.lower()`) |
| `vermogenId` | string | id van het vermogen dat deze naam heeft |

**`clubs/{clubId}/structuurelementen/{id}`**, twee nieuwe velden:

| Veld | Type | Regel |
|---|---|---|
| `aantalVermogens` | int ≥ 0 | aantal vermogens met dit `domeinId`. **Ontbreekt = 0** (alle bestaande domeinen) |
| `laatsteVermogenId` | string | id van het vermogen waardoor de teller het laatst veranderde; nodig zodat de regels kunnen controleren dat een tellerwijziging bij een echte vermogenswijziging hoort |

De domeinformulieren in de app schrijven deze velden nooit; `updateDoc` laat ze staan.

Rekening houden met later:
- **CK-021 (plaat)** leest `vermogens`, groepeert op `domeinId` en sorteert op domein-`volgorde`, daarna vermogen-`volgorde`. Geen extra veld nodig.
- **CK-038/CK-039** voegen velden toe (`status`, bijv. `bovenId`): `hasOnly` in de regels moet dan worden uitgebreid. Bewust.
- **M2 (activiteiten)** verwijst naar het vermogen-id; dat verandert nooit (ook niet bij hernoemen of verplaatsen). Daarom is de naam níet het id van het vermogen, maar van een apart naamdocument.
- **Menu-id:** reserveer `vermogens` voor CK-021 (Overzicht, zoals in `.claude/docs/CK-044-technisch.md`). Het beheertabblad krijgt id `vermogensbeheer` (naam "Vermogens").

## Naamregels (in app en regels gelijk)

De sleutel van het naamdocument moet in de regels exact na te rekenen zijn. Regels kennen `trim()`, `lower()`, `matches()` en `size()`, maar geen Unicode-normalisatie. Daarom:

1. **App normaliseert vóór valideren:** `naam.normalize('NFC').trim().replace(/\s+/g, ' ')`. Zo bewaard.
2. **Toegestane tekens:** eerste teken een letter of cijfer; daarna letters, cijfers, spatie en `& ' - . , ( ) +`. Letters = `a–z`, `A–Z` en de Latijnse letters met accent uit Latin-1 (`À–Ö`, `Ø–ö`, `ø–ÿ`). JS: `/^[a-zA-Z0-9À-ÖØ-öø-ÿ][a-zA-Z0-9À-ÖØ-öø-ÿ &'.,()+-]*$/`.
   - Hiermee kan een naam geen `/` bevatten, niet `.` of `..` zijn en niet op `__…__` lijken: altijd een geldig document-id. 100 tekens × max. 2 bytes blijft ver onder de 1500 bytes.
   - Latin-1 omdat `toLowerCase()` in JS en `lower()` in de regels daar gegarandeerd hetzelfde uitkomen. Bij exotische tekens (Turkse İ, ẞ) zou dat niet zeker zijn. Wijkt het toch af, dan weigeren de regels (fail closed, nooit een dubbele naam).
   - De 58 HCA-namen voldoen (o.a. "Lief & Leed", "Bar- en keukenbeheer", "Social-mediabeheer", "G-hockey").
3. **Regels toetsen:** dezelfde regex, `naam == naam.trim()`, geen dubbele spatie, lengte 2–100.
4. **Sleutel:** app `naam.toLowerCase()`, regels `naam.lower()`. Hoofdletters en extra spaties maken dus geen andere naam.
5. Veldfout bij ongeldige tekens: "Gebruik alleen letters, cijfers, spaties en & ' - . , ( ) +" (tekst: ervaring-medewerker).

## Schrijfacties in de app (transacties)

Alle wijzigingen die naam, domein of teller raken gaan via `runTransaction`. Eerst lezen, dan schrijven, **één vermogen per transactie**. Firestore probeert de transactie opnieuw als iemand tegelijk hetzelfde document wijzigt. Daarom krijgen twee bestuurders tegelijk geen dubbele naam en geen verkeerde teller.

| Actie | Leest in de transactie | Schrijft in dezelfde transactie |
|---|---|---|
| **Toevoegen** | domein D (bestaat, type pijler/domein), naamdocument N | `set` vermogen V; `set` N `{ vermogenId }`; `update` D `{ aantalVermogens: oud + 1, laatsteVermogenId: V.id }` |
| **Hernoemen** (sleutel verandert) | V, N-nieuw | `update` V `{ naam }`; `delete` N-oud; `set` N-nieuw |
| **Hernoemen** (alleen hoofdletters) | V | `update` V `{ naam }` (zelfde sleutel, naamdocument blijft) |
| **Verplaatsen** | V, D-oud, D-nieuw | `update` V `{ domeinId, volgorde }`; D-oud −1; D-nieuw +1 (beide met `laatsteVermogenId: V.id`) |
| **Verwijderen** | V, D | `delete` V; `delete` N; D −1 |
| **↑/↓** | — | `schrijfVolgorde('vermogens', vermogensVanDitDomein)` (`writeBatch`, alleen `volgorde`) |

- Hernoemen én verplaatsen in één keer: **twee transacties** (eerst verplaatsen, dan hernoemen), vanwege de limiet van 10 leesacties per document (zie Limieten). Lukt de tweede niet, dan meldt de app dat het domein wel gewijzigd is en de naam niet (tekst: ervaring-medewerker).
- Bestaat N al: `throw { code: 'dubbel-vermogen' }`, met in de melding het domein van het bestaande vermogen ("Dit vermogen bestaat al bij Financiën."). Lees dat vermogen en domein daarvoor in dezelfde transactie.
- `volgorde` bij toevoegen en verplaatsen = hoogste in het doeldomein + 1. Dat bepaalt de app met een query vlak vóór de transactie (een transactie in de web-SDK kan geen query doen). Bij gelijktijdig toevoegen kan een volgordenummer dubbel worden. Dat is onschuldig: er wordt daarna op naam gesorteerd en het is het bekende vervolgpunt uit CK-023.
- Een nieuw `FOUTTEKSTEN`-item voor `aborted`: dat geeft een transactie die na herhaalde pogingen opgeeft. Tekst ongeveer: "Iemand anders wijzigde dit tegelijk. Kijk in de lijst en probeer het zo nodig opnieuw." Let op: `failed-precondition` staat in `WEG_CODES`. Controleer of een mislukte transactie in deze SDK-versie (`firebase` 13) die code kan geven, en vang dat af.
- **Bijkomend voordeel bij een time-out:** is de eerste poging toch geland, dan geeft een nieuwe poging "bestaat al" in plaats van een dubbel vermogen.
- Leg club-id en refs vast bij de klik, vóór het eerste lezen (vervolgpunt uit CK-023, hier meteen goed doen).

## Firestore-regels

Voorstel. De bouwer verfijnt het, maar houdt de logica gelijk. Alles staat binnen `match /clubs/{clubId}`. Hulpfuncties staan op het niveau van `isLid`, omdat ze `database` gebruiken.

```
// ── Vermogens (CK-020) ──
function vermogenPad(clubId, id) { return /databases/$(database)/documents/clubs/$(clubId)/vermogens/$(id); }
function naamPad(clubId, naam)   { return /databases/$(database)/documents/clubs/$(clubId)/vermogensnamen/$(naam.lower()); }
function domeinPad(clubId, id)   { return /databases/$(database)/documents/clubs/$(clubId)/structuurelementen/$(id); }
function teller(d)               { return d.get('aantalVermogens', 0); }

function geldigeVermogensnaam(n) {
  return n is string && n.size() >= 2 && n.size() <= 100
    && n.matches("[a-zA-Z0-9À-ÖØ-öø-ÿ][a-zA-Z0-9À-ÖØ-öø-ÿ &'.,()+-]*")
    && n == n.trim()
    && !n.matches('.*  .*');
}
function geldigVermogen(d) {
  return d.keys().hasOnly(['naam', 'domeinId', 'volgorde'])
    && d.keys().hasAll(['naam', 'domeinId', 'volgorde'])
    && geldigeVermogensnaam(d.naam)
    && d.domeinId is string && d.domeinId.size() > 0 && d.domeinId.size() <= 100
    && d.volgorde is int && d.volgorde >= 1;
}
// Teller van domein `domeinId` verandert in deze schrijfactie met precies `stap`, toegeschreven aan vermogen `id`
function tellerStap(clubId, domeinId, id, stap) {
  let voor = get(domeinPad(clubId, domeinId)).data;
  let na = getAfter(domeinPad(clubId, domeinId)).data;
  return teller(na) == teller(voor) + stap && na.get('laatsteVermogenId', '') == id;
}
function naamHoortNaBij(clubId, naam, id) {
  return getAfter(naamPad(clubId, naam)).data.vermogenId == id;
}
function oudeNaamLos(clubId, naam, id) {
  return !existsAfter(naamPad(clubId, naam)) || getAfter(naamPad(clubId, naam)).data.vermogenId != id;
}
function vermogenKomtBij(clubId, domeinId, v) {
  return getAfter(vermogenPad(clubId, v)).data.domeinId == domeinId
    && (!exists(vermogenPad(clubId, v)) || get(vermogenPad(clubId, v)).data.domeinId != domeinId);
}
function vermogenGaatWeg(clubId, domeinId, v) {
  return get(vermogenPad(clubId, v)).data.domeinId == domeinId
    && (!existsAfter(vermogenPad(clubId, v)) || getAfter(vermogenPad(clubId, v)).data.domeinId != domeinId);
}
function tellerWijzigingKlopt(clubId, domeinId) {
  let oud = teller(resource.data);
  let nieuw = teller(request.resource.data);
  let v = request.resource.data.get('laatsteVermogenId', '');
  return nieuw is int && nieuw >= 0 && (
    nieuw == oud
    || (nieuw == oud + 1 && vermogenKomtBij(clubId, domeinId, v))
    || (nieuw == oud - 1 && vermogenGaatWeg(clubId, domeinId, v)));
}
```

```
match /vermogens/{id} {
  allow read: if isLid(clubId);
  allow create: if isLid(clubId)
    && geldigVermogen(request.resource.data)
    && getAfter(domeinPad(clubId, request.resource.data.domeinId)).data.type in ['pijler', 'domein']
    && tellerStap(clubId, request.resource.data.domeinId, id, 1)
    && naamHoortNaBij(clubId, request.resource.data.naam, id);
  allow update: if isLid(clubId)
    && geldigVermogen(request.resource.data)
    // naam: zelfde sleutel, of nieuw naamdocument van mij en het oude los
    && (request.resource.data.naam.lower() == resource.data.naam.lower()
        || (naamHoortNaBij(clubId, request.resource.data.naam, id)
            && oudeNaamLos(clubId, resource.data.naam, id)))
    // domein: ongewijzigd, of verplaatst met beide tellers ±1
    && (request.resource.data.domeinId == resource.data.domeinId
        || (getAfter(domeinPad(clubId, request.resource.data.domeinId)).data.type in ['pijler', 'domein']
            && tellerStap(clubId, request.resource.data.domeinId, id, 1)
            && (!exists(domeinPad(clubId, resource.data.domeinId))
                || tellerStap(clubId, resource.data.domeinId, id, -1))));
  allow delete: if isLid(clubId)
    && oudeNaamLos(clubId, resource.data.naam, id)
    && (!exists(domeinPad(clubId, resource.data.domeinId))
        || tellerStap(clubId, resource.data.domeinId, id, -1));
}

// Naamdocumenten: alleen aanmaken (nooit wijzigen), alleen weg als de naam niet meer bij dat vermogen hoort
match /vermogensnamen/{sleutel} {
  allow read: if isLid(clubId);
  allow create: if isLid(clubId)
    && request.resource.data.keys().hasOnly(['vermogenId'])
    && request.resource.data.vermogenId is string
    && getAfter(vermogenPad(clubId, request.resource.data.vermogenId)).data.naam.lower() == sleutel;
  allow update: if false;
  allow delete: if isLid(clubId)
    && (!existsAfter(vermogenPad(clubId, resource.data.vermogenId))
        || getAfter(vermogenPad(clubId, resource.data.vermogenId)).data.naam.lower() != sleutel);
}
```

Aanpassing van het bestaande blok `structuurelementen`:

```
match /structuurelementen/{id} {
  allow read: if isLid(clubId);
  allow create: if isLid(clubId)
    && request.resource.data.type in ['pijler', 'domein', 'overkoepelend']
    && request.resource.data.naam is string
    && request.resource.data.naam.size() <= 200
    && teller(request.resource.data) == 0;
  allow update: if isLid(clubId)
    && request.resource.data.type in ['pijler', 'domein', 'overkoepelend']
    && request.resource.data.naam is string
    && request.resource.data.naam.size() <= 200
    && tellerWijzigingKlopt(clubId, id)
    // naar overkoepelend alleen zonder vermogens
    && (request.resource.data.type != 'overkoepelend' || resource.data.type == 'overkoepelend'
        || teller(request.resource.data) == 0);
  allow delete: if isLid(clubId) && teller(resource.data) == 0;
}
```

### Waarom dit sluitend is (via de API, zonder de console)

- **Uniciteit:** een naamdocument mag alleen worden *aangemaakt*. Een `set` op een bestaand document is een update, en `update` is altijd verboden. Een vermogen mag alleen een naam hebben (bij aanmaken of hernoemen) als het naamdocument van die sleutel ná de schrijfactie naar dit vermogen wijst. Een tweede vermogen met dezelfde sleutel kan dus niet. Een naamdocument weghalen kan alleen als het vermogen weg is of anders heet.
- **Teller:** elk vermogen dat bij een domein komt of eruit gaat, vraagt in dezelfde schrijfactie een teller ±1 met `laatsteVermogenId` = dat vermogen. Omgekeerd mag een teller alleen ±1 veranderen als het genoemde vermogen echt bij dit domein komt of eruit gaat. Twee vermogens in één schrijfactie bij hetzelfde domein kunnen niet allebei `laatsteVermogenId` zijn, dus één tellerstap per domein per schrijfactie. Gevolg: de teller is altijd gelijk aan het echte aantal, zolang niemand de regels omzeilt.
- **Guard:** een domein met teller > 0 kan niet weg en niet naar overkoepelend. Een vermogen kan alleen bij een pijler of ondersteunend domein komen.
- **Bestaande domeinen** hebben geen teller (= 0) en er bestaan nog geen vermogens, dus de beginstand klopt. Er is geen migratie nodig. Het importscript zet de tellers mee door hetzelfde protocol te volgen.
- **Bestaande app-code en scripts:** domein bewerken (`updateDoc` zonder tellervelden) houdt de teller gelijk en kost geen extra lezen. `seed-testclub.mjs` schrijft domeinen met `merge: true` en raakt de teller niet. `opschonen-dubbelen.mjs` en de oude scripts kunnen een domein met vermogens niet meer verwijderen. Dat is gewenst.

### Vermogen bij een verdwenen of overkoepelend domein

Dat kan alleen nog ontstaan via de console of de Admin-SDK. Daarom: verwijderen en verplaatsen mogen als het oude domein niet meer bestaat (`!exists(...)`, dan geen tellercontrole). Bij een domein dat via de console overkoepelend is geworden, mag de teller dalen; de overkoepelend-regel geldt alleen bij de *overgang* naar overkoepelend.

### Restrisico (eerlijk)

1. **Console en Admin-SDK omzeilen de regels.** Alleen Paul heeft daar toegang. Een verkeerde teller of een los naamdocument ontstaat alleen zo. Het controlescript vindt en herstelt dat.
2. **Elk lid mag alles wat de regels toestaan:** alle vermogens verwijderen en daarna het domein. Dat is geen fout in de regels maar een kwestie van rechten. Dat is acceptabel nu alle leden bestuurders zijn (één echte gebruiker). Het wordt opgelost in **P0d** (`isBeheerder(clubId)` voor schrijven op `vermogens`, `vermogensnamen` en `structuurelementen`). Voeg `vermogens` en `vermogensnamen` toe aan die harde eis in de backlog ("Na CK-044").
3. **`laatsteVermogenId`** kan een lid los wijzigen zonder tellerwijziging. Dat is onschuldig: de regels gebruiken het veld alleen als de teller verandert.
4. **Regels zijn niet automatisch getest** (er is geen emulatortest). Of de regex met niet-ASCII-tekens werkt en hoe de leesacties worden geteld, moet in de testomgeving blijken, of met de emulator (zie Vragen).
5. Een transactie heeft verbinding nodig. Offline geeft `metOpslaan` al de melding `offline`.

## Limieten van de regels (na te rekenen)

Firestore staat max. **10** `get`/`exists`/`getAfter`/`existsAfter` toe per beoordeeld document en max. **20** per verzoek (batch of transactie). Herhaalde aanroepen op hetzelfde document worden binnen één verzoek in de cache gehouden. Hieronder telt `x` en `x-na` als twee aanroepen (voorzichtig geteld). `isLid` = 1 (`leden/{uid}`).

| Verzoek | Zwaarste document | Totaal verschillend | Binnen limiet |
|---|---|---|---|
| Toevoegen (V, N, D) | V: leden, D, D-na, N-na = 4 | leden, D, D-na, N-na, V, V-na = 6 | ja |
| Verwijderen (V, N, D) | V: leden, N-na (exists+get), D (exists+get), D-na = 6 | ≈ 7 | ja |
| Verplaatsen (V, D1, D2) | V: leden, D2, D2-na, D1 (exists+get), D1-na = 6 | ≈ 8 | ja |
| Hernoemen (V, N-oud, N-nieuw) | V: leden, N-nieuw-na, N-oud-na (exists+get) = 4 | ≈ 6 | ja |
| Hernoemen + verplaatsen in één | V: ≈ 9–10 | ≈ 12 | **te krap**: daarom twee transacties |
| ↑/↓, k vermogens (alleen `volgorde`) | V: leden = 1 | 1 | ja, ook bij een groot domein (batch max. 500 schrijfacties) |
| Domein bewerken zonder tellerwijziging | D: leden = 1 | 1 | ja |
| Importscript | 1 vermogen per transactie = als Toevoegen | 6 | ja |

De regels lezen bij ↑/↓ niets extra, omdat naam en domein dan gelijk blijven (de `||`-takken sluiten kort). Leesacties van de transactie zelf (`tx.get`) zijn aparte verzoeken met alleen `isLid`.

## Regels voor domeinen met vermogens (in de app)

| Situatie | App | Regels |
|---|---|---|
| Domein verwijderen, teller > 0 | Geweigerd vóór `confirm()`: "Dit domein heeft nog n vermogens. Verplaats of verwijder ze eerst bij Beheer → Vermogens." Teller vers lezen (`getDoc`) in de actie. | `delete` alleen bij teller 0 |
| Domein naar overkoepelend, teller > 0 | Geweigerd bij Opslaan, melding onder de soortkeuze | weigert |
| Pijler ↔ ondersteunend | Mag; vermogens blijven met dezelfde volgorde | toegestaan |
| Regels weigeren toch (race met een ander tabblad) | Na `permission-denied` de teller opnieuw lezen; is die > 0, dan dezelfde vriendelijke melding in plaats van "geen toestemming" | — |

## Volgorde binnen een domein

- Nieuw vermogen en verplaatsen: hoogste in het doeldomein + 1.
- ↑/↓ alleen binnen het domein (geen ↑ bij de eerste, geen ↓ bij de laatste); `schrijfVolgorde` hernummert 1 t/m n van dat domein in één batch.
- Na verwijderen of verplaatsen niet hernummeren: gaten zijn onschuldig, `sorteerDomeinen` vangt ze op.
- Groepen volgen de domeinvolgorde uit Beheer → Domeinen.

## Betrokken bestanden

- `firestore.rules` — blokken `vermogens` en `vermogensnamen`, hulpfuncties, aangepast blok `structuurelementen`. **Paul publiceert zelf**, eerst `npm run regels:test`.
- `src/main.js`
  - Import `runTransaction` uit `firebase/firestore`.
  - Datalaag: `laadVermogens()`, `normaliseerVermogensnaam()`, `vermogensnaamFout()`, `naamSleutel()`, en transactiefuncties `voegVermogenToe`, `hernoemVermogen`, `verplaatsVermogen`, `verwijderVermogen`.
  - `renderVermogensBeheer(gebruiker)` volgens het patroon van `renderBestuursfunctiesBeheer` (meldblok, `metOpslaan`, `valideerVelden`, `focusInLijst`, `zichtbareTerugval`, verborgen `role="status"` bij ↑/↓, bijv. "Vermogen X staat nu op plaats 2 van 7 in Financiën.").
  - `ZIJMENU` (groep Beheer, tweede item), `NAV_DOEL` (`['vermogensbeheer', renderVermogensBeheer]`), nieuwe sleutel in `MENU_ICOON`.
  - `FOUTTEKSTEN`: `dubbel-vermogen`, `aborted`; veldfout voor ongeldige tekens.
  - `renderPijlersDomeinenBeheer`: guards op teller (verwijderen, naar overkoepelend). Nieuwe domeinen krijgen geen tellervelden.
  - `renderDashboard` / `renderStructuurGrid`: vierde kerncijfer en aantallen per kaart.
- `src/style.css` — variant voor vier kerncijfers (bijv. `.cijfers-4`, 2×2 op ≤700px), groepkop in de vermogenslijst, `#vermogen-lijst` in de container-query-aanpak van `#structuur-lijst`/`#functie-lijst`. Alleen bestaande tokens.
- `scripts/inrichten-vermogens-hca.mjs` — import (nieuw).
- `scripts/controleer-vermogens.mjs` — controle en herstel (nieuw).
- Na de bouw: `.claude/backlog.md` (CK-020, P0d-eis uitbreiden), `CHANGELOG.md`, `.claude/docs/CK-020-*`, README (nieuwe scripts).

## Home

- Vier kerncijfers: Pijlers, Ondersteunende domeinen, Overkoepelende domeinen, **Vermogens**.
- Kerncijfer = aantal vermogensdocumenten met een bestaand domein van type `pijler`/`domein`; per kaart geteld uit dezelfde documenten (bron van waarheid). De teller op het domein is voor de regels; het controlescript bewaakt dat beide gelijk zijn.
- Kaart van een pijler of ondersteunend domein: "1 vermogen" / "n vermogens" / bij 0 (advies) "Nog geen vermogens". Overkoepelend: niets.
- Domeinen en vermogens parallel laden; **mislukt het laden van vermogens, dan blijft Home werken** (kaarten zoals nu, kerncijfer "–").

## Importscript `scripts/inrichten-vermogens-hca.mjs`

- Patroon `scripts/inrichten-domeinen-hca.mjs` + `scripts/lib/omgeving.mjs`: `startScript()`, `--omgeving=test|productie` (standaard test, productie vraagt de projectnaam), `--droog`.
- **Namen (namencontrole afgerond, Paul 23 november 2026, besluiten punt 6):** de 58 vermogens uit de bronlijst, met twee wijzigingen: bij Accommodatie heten Onderhoud en Beveiliging **Parkonderhoud** en **Parkbeveiliging**. De bronlijst zelf blijft ongewijzigd. Kledingpartnerschap (Relaties) en Kledingbeheer (Materiaal) blijven allebei, Evenementen blijft bij Hospitality.
- **Domein vinden:** eerst op `hashtag`, dan op `naam`, hoofdletterongevoelig. In de testclub heet de pijler `#HCASpeelt` zonder hashtagveld; in productie kan de hashtag in een apart veld staan. Beide moeten werken.
- **Eerst het hele plan, dan pas schrijven.** Het script stopt zonder te schrijven als een domein ontbreekt, dubbel gevonden wordt of overkoepelend is, of als een naam niet aan de naamregels voldoet.
- **Idempotent:** per naam het naamdocument lezen. Wijst het naar een vermogen in hetzelfde domein, dan overslaan. Wijst het naar een ander domein, dan melden "LET OP ... ongemoeid" (niet verplaatsen). Een los naamdocument zonder vermogen: melden en doorverwijzen naar het controlescript. Het script verwijdert en hernoemt nooit iets.
- **Schrijven: één transactie per vermogen**, via hetzelfde protocol als de app (V + N + teller +1). De teller gaat zo vanzelf mee. Volgorde = hoogste in het domein + 1, oplopend in de volgorde van de bron.
- Plan tonen (`+ Naam → Domein (volgorde)`), dan "ja" typen. Bij een fout `geweigerd(e, { gedeeltelijk: gedaan > 0 })`. Opnieuw draaien maakt het af.

## Controlescript `scripts/controleer-vermogens.mjs`

- Zelfde patroon (`--omgeving`, `--droog`, productiebevestiging, "ja" vóór schrijven).
- **Controleert** voor de club:
  1. teller per domein tegenover het echte aantal vermogens;
  2. vermogens zonder naamdocument, of met een naamdocument dat naar een ander vermogen wijst;
  3. naamdocumenten zonder (passend) vermogen;
  4. twee vermogens met dezelfde sleutel;
  5. vermogens met ongeldige velden, een ontbrekend domein of een overkoepelend domein;
  6. domeinen van type overkoepelend met een teller > 0.
- **Herstelt wat de regels toestaan:** een ontbrekend naamdocument aanmaken (mag alleen als de sleutel klopt), een los naamdocument verwijderen (mag als het vermogen weg is of anders heet).
- **Herstelt bewust niet:** tellers, dubbele namen, vermogens bij een verdwenen domein. De regels staan geen vrije tellerwijziging toe, en dat is precies de beveiliging. Het script print per afwijking wat Paul in de Firebase-console moet zetten (bijv. "structuurelementen/abc: aantalVermogens 3 → 2"), of welke app-actie nodig is (vermogen verwijderen of verplaatsen in Beheer).
- Eindigt met "Alles klopt" of een lijst met afwijkingen, en exitcode ≠ 0 bij afwijkingen.

## Acceptatiecriteria

Beheer
- [ ] Zijmenu Beheer heeft **Vermogens** (tussen Domeinen en Bestuursfuncties) met eigen pictogram; kruimelpad Home › Beheer › Vermogens; `document.title` klopt; één `aria-current="page"`.
- [ ] Lijst gegroepeerd per domein (domeinvolgorde), per groep op `volgorde`; filter op domein werkt.
- [ ] Toevoegen: naam (na normaliseren 2–100 tekens, toegestane tekens) en domein verplicht; keuzelijst alleen pijlers en ondersteunende domeinen; nieuw vermogen onderaan zijn domein; "✓ Vermogen X toegevoegd.".
- [ ] Dubbele naam (andere hoofdletters, extra spaties, ander domein) geweigerd onder het naamveld, met het domein van het bestaande vermogen; invoer blijft staan.
- [ ] Bewerken: naam en/of domein; verplaatst vermogen onderaan het nieuwe domein; alleen hoofdletters wijzigen mag.
- [ ] ↑/↓ alleen binnen het domein, met schermlezermelding; focus blijft op de knop of de terugval.
- [ ] Verwijderen met `confirm()`; "✓ Vermogen X verwijderd."; focus nooit op `<body>`.
- [ ] Alle schrijfacties via `metOpslaan` met de CK-023-meldingen; naam/domein/teller via `runTransaction`.

Domeinen
- [ ] Domein met vermogens niet te verwijderen en niet naar overkoepelend, met een duidelijke melding (ook als de regels het weigeren door een race).
- [ ] Pijler ↔ ondersteunend mag; vermogens blijven.
- [ ] Domein zonder vermogens (ook zonder tellerveld) verwijderen en bewerken werkt zoals nu.

Regels (afgedwongen, ook buiten de app om)
- [ ] Vermogen aanmaken zonder naamdocument, zonder teller +1, met een teller +2, bij een overkoepelend of niet-bestaand domein, met ongeldige naam, extra velden of geen int-`volgorde`: `permission-denied`.
- [ ] Tweede vermogen met een bestaande sleutel: `permission-denied`, ook als het via twee tabbladen tegelijk gebeurt.
- [ ] Naamdocument wijzigen: altijd `permission-denied`. Verwijderen terwijl het vermogen die naam nog heeft: `permission-denied`.
- [ ] Domein met teller > 0 verwijderen of naar overkoepelend: `permission-denied`. Teller los wijzigen zonder bijbehorende vermogenswijziging: `permission-denied`. Teller onder 0: `permission-denied`.
- [ ] Bestaande app-acties op domeinen, bestuursfuncties en clubprofiel blijven werken.

Home
- [ ] Vierde kerncijfer met de juiste telling; 2×2 op ≤700px.
- [ ] "n vermogens" per kaart (enkelvoud bij 1), niets bij overkoepelend.
- [ ] Mislukt het laden van vermogens, dan toont Home nog steeds de domeinen.

Scripts
- [ ] Import `--droog` in test: 58 nieuwe vermogens over 13 domeinen, niets geschreven. Echte run: tellers kloppen. Tweede run: 0 wijzigingen.
- [ ] Controlescript na de import: "Alles klopt". Na een opzettelijke afwijking in de testconsole meldt het die precies.

## Testscenario's

Lokaal (`npm run dev`, wijst naar test) en op tst., met de testclub. Regels eerst door Paul gepubliceerd met `npm run regels:test`. Scenario's met devtools of de console voert **Paul** uit.

1. **Lege start:** Home "Vermogens 0"; Beheer → Vermogens toont de lege stand; bestaande domeinen bewerken en een leeg testdomein verwijderen werken nog (geen teller = 0).
2. **Toevoegen** "Teamindeling" bij #HCASpeelt → onderaan, melding, Home 1, kaart "1 vermogen", in de console `aantalVermogens` 1 en `vermogensnamen/teamindeling` → id.
3. **Dubbel:** "teamindeling " bij Bestuur → geweigerd onder het naamveld met "bij #HCASpeelt".
4. **Dubbel via twee tabbladen tegelijk:** in beide tabbladen "Ledenwerving" invullen bij een ander domein en vlak na elkaar opslaan → één lukt, de ander krijgt "bestaat al" (of "tegelijk gewijzigd"); console: één vermogen, één naamdocument, tellers kloppen.
5. **Naamregels:** 1 en 101 tekens geweigerd; 2 en 100 toegestaan; `a/b`, `__x__`, emoji en `İstanbul` geweigerd met de veldfout; "Lief & Leed" toegestaan; `<b>` kan niet (teken niet toegestaan).
6. **Hernoemen:** "Teamindeling" → "teamindeling" (alleen hoofdletters) lukt zonder nieuw naamdocument; → "Teamsamenstelling": oud naamdocument weg, nieuw erbij; daarna kan een nieuw vermogen "Teamindeling" weer.
7. **Verplaatsen:** een vermogen van Leden naar Vrijwilligers → onderaan daar; tellers: Leden −1, Vrijwilligers +1; controlescript "Alles klopt". Hernoemen en verplaatsen tegelijk → beide doorgevoerd (twee transacties).
8. **Volgorde:** drie vermogens, ↑/↓, herladen → volgorde blijft; andere groep onaangeroerd.
9. **Domein verwijderen** met vermogens → melding in de app; via devtools `deleteDoc` op dat domein → `permission-denied`; na verplaatsen van alle vermogens (teller 0) → verwijderen lukt.
10. **Domein naar overkoepelend** met vermogens → melding; via devtools `updateDoc(..., { type: 'overkoepelend' })` → `permission-denied`; pijler → ondersteunend → lukt.
11. **Teller vervalsen via devtools:** `updateDoc(domein, { aantalVermogens: 0 })` → `permission-denied`; ook met `laatsteVermogenId` erbij → `permission-denied`.
12. **Vermogen buiten het protocol via devtools:** `addDoc(vermogens, {...})` zonder naamdocument/teller → `permission-denied`; naamdocument `updateDoc` → `permission-denied`.
13. **Verwijderen** → vermogen, naamdocument weg, teller −1; naam daarna opnieuw te gebruiken.
14. **Regels nog niet gepubliceerd** (lokaal, vóór `regels:test`): Home werkt, Beheer → Vermogens toont een nette fout.
15. **Offline / time-out** bij toevoegen: CK-023-meldingen; nieuwe poging na een time-out geeft "bestaat al", nooit een dubbel vermogen.
16. **Console-schade (Paul, testconsole):** een vermogen direct verwijderen (teller blijft te hoog) en een domein met vermogens direct verwijderen → het controlescript meldt beide met de exacte herstelinstructie; het verweesde vermogen verschijnt in Beheer als "zonder geldig domein" en is te verwijderen of te verplaatsen.
17. **Import:** `--droog`, echte run, tweede run (0), controlescript (alles klopt), Home 58.
18. **Breedtes en toegankelijkheid:** ~400px, ~768px met uitgeklapt menu, desktop; licht en donker; toetsenbord en schermlezer bij toevoegen, ↑/↓ en verwijderen.

## Uitrolvolgorde

1. Bouw op `test`: app, regels, beide scripts.
2. **Paul:** `npm run regels:test`. De nieuwe regels werken ook met de huidige app (v0.6.0): domeinen zonder teller = 0, dus bewerken en verwijderen werken zoals nu.
3. Testscenario's lokaal en op tst. Daarna import in test (`--droog`, echt, nog eens) en het controlescript.
4. **Paul:** `npm run regels:productie` (vóór de app, omdat de nieuwe app `vermogens` leest).
5. App naar productie.
6. **Paul:** import in productie met `--droog`, dan echt, dan het controlescript.
7. Niet op 26 november 2026 (dan loopt CK-024).

## Wat mag er niet kapotgaan?

- Beheer → Domeinen (bewerken, toevoegen, ↑/↓, filter, verwijderen van lege domeinen) en Bestuursfuncties; container queries uit CK-044.
- Bestaande scripts die domeinen bijwerken (`inrichten-*`, `seed-testclub.mjs` met `merge: true`).
- CK-023-meldingen en focusafspraken; `bindMeldblokken`, `metOpslaan`, `schrijfVolgorde`.
- CK-044-shell: `NAV_DOEL` als enige navigatietabel, paneel op mobiel, ingeklapt menu, kruimelpad, clublogo.
- Home-domeinkaarten (pictogram, omschrijving, pill, hashtag).
- Regels voor `instellingen`, `bestuursfuncties`, `leden`, `gebruikers` (ongewijzigd).
- Omgevingsscheiding (P0e/P0f): omgevingsbalk, scripts standaard op test.

## Architectuurlaag

**Model-laag (M1)**: vermogens zijn het derde niveau van het configureerbare model Club → Pijlers/Domeinen → Vermogens en gelden generiek voor elke club. Het naamdocument en de teller zijn modelinfrastructuur, geen HCA-specifieke logica. De HCA-namen komen alleen via het importscript binnen.

## Randgevallen en risico's

- **Verweesd vermogen** (alleen via de console): niet crashen; in Beheer apart tonen ("Zonder geldig domein") met Verwijderen en Bewerken (domein kiezen); niet meetellen op Home. De regels laten verwijderen en verplaatsen toe als het oude domein niet bestaat.
- **Los naamdocument** (vermogen via de console verwijderd) blokkeert die naam: de app meldt "bestaat al" zonder domein, met een verwijzing naar SVN10. Het controlescript ruimt het op.
- **Teller wijkt af** (console): verwijderen of verplaatsen kan dan geweigerd worden (bijv. een teller van 0 kan niet −1). Het controlescript geeft de juiste waarde. Paul zet die in de console.
- **Hernoemen + verplaatsen** is niet atomair (twee transacties). Mislukt de tweede, dan is het vermogen wel verplaatst maar niet hernoemd, met een duidelijke melding.
- **Dubbele volgordenummers** bij gelijktijdig toevoegen of ↑/↓: onschuldig (sortering op naam), bekend vervolgpunt (`runTransaction` voor ↑/↓).
- **Regex en tekenset:** niet-ASCII in de regels is nog niet getest. Werkt `À-ÿ` in de regels anders dan verwacht, dan weigeren de regels namen met accenten (fail closed). Moet blijken uit scenario 5.
- **Limieten** zijn voorzichtig geteld (tabel). Als Firebase anders telt, blijft er genoeg marge, behalve bij hernoemen + verplaatsen, en dat is daarom gesplitst.
- **Twee items "Vermogens"** in het zijmenu zodra CK-021 er is. Oplossen bij CK-021 (tooltip); de id's zijn al gescheiden.
- **P0d:** het tabblad en de twee nieuwe collecties vallen onder de harde eis (verbergen is geen beveiliging).
- **Domeinenlijst** wordt breder als er een kolom "vermogens" bij komt: controleer de container query (760px).
- Namen alleen via `esc()`/`textContent` in beeld; meldingen met een naam via `toonOk`.

## Buiten scope

- De plaat (CK-021) en een menu-item Vermogens onder Overzicht.
- Status (CK-038), omschrijving, onderliggende vermogens (CK-039), eindverantwoordelijke per vermogen.
- Vermogens bij overkoepelende domeinen; "Hoofdsponsor #HCA…"-blokken; projecten en samenwerkingen als eigen begrip.
- Activiteiten (M2).
- Rolafhankelijk beheer (P0d); `runTransaction` voor ↑/↓ van domeinen en bestuursfuncties.
- Uniciteit van namen van domeinen en bestuursfuncties in de regels.
- Vermogens in `seed-testclub.mjs` (het importscript werkt ook op de testclub).

## Veiligheidsregels voor deze en latere fases

- Agents **loggen niet in** bij Firebase (niet via `firebase login`, niet via de scripts).
- Agents **publiceren geen regels**. Paul publiceert zelf: eerst `npm run regels:test`, testen, dan `npm run regels:productie`.
- Agents **schrijven niet naar Firestore** en draaien de scripts niet, ook niet met `--droog` (dat logt ook in). Ze schrijven de scripts; Paul draait ze.
- Agents **wijzigen geen `.env*.local`** en nemen er geen waarden uit over in rapporten.
- Commit en push alleen op verzoek van Paul.

## Vragen aan Paul

1. **Beheerplek:** eigen tabblad Beheer → Vermogens (tussen Domeinen en Bestuursfuncties), gegroepeerd per domein met filter? *Advies: ja (zie afweging).*
2. **Domein zonder vermogens op Home:** "Nog geen vermogens" of "0 vermogens" op de domeinkaart? *Advies: "Nog geen vermogens".*
3. **Uitrol:** eerst regels in test, testen en importeren in test, dan regels in productie, daarna de app en de import (niet op 26 november 2026)? *Advies: ja.*
4. **Regeltests met de Firestore-emulator:** de regels zijn nu complex genoeg voor automatische tests (`@firebase/rules-unit-testing` als devDependency, `firebase emulators:exec`). Dat draait volledig lokaal, zonder inloggen en zonder echte Firestore, maar vraagt Java op deze Mac. Mogen agents de emulator in de bouwfase lokaal starten en een testbestand toevoegen? *Advies: ja. Dat dekt de regex, de limieten en de weigerscenario's 9–12 vóórdat jij de regels publiceert. De handmatige scenario's in tst blijven.*
5. **Tekenset van vermogensnamen:** alleen letters (incl. Latin-1-accenten), cijfers, spatie en `& ' - . , ( ) +`. Geen `/`, `_`, emoji of andere tekens. Akkoord? *Advies: ja. Alle 58 namen passen en het maakt de uniciteit in de regels exact na te rekenen. Verruimen kan later.*
