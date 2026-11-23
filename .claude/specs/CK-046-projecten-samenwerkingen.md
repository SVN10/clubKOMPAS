# Specificatie: CK-046 Projecten en samenwerkingen

Route **groot**, maar zonder aparte ervaring-fase: de gebruikersreis staat in deze spec. Leidend: `CK-046-besluiten.md` (Paul, 23-11-2026). Patronen: `CK-020-vermogens-beheren.md` (beheerpagina, naamregels, regels, emulatortests), `CK-021-de-plaat.md` (de plaat). Regelnummers: `src/main.js` op commit 6279af6 (v0.9.0).

## Wat wordt er gebouwd?
Twee nieuwe beheerpagina's onder Beheer: **Projecten** (tijdelijke trajecten, met status en periode) en **Samenwerkingen** (externe partners). Beide hebben een naam, een omschrijving en een eigenaar (bestuursfunctie). Ze verschijnen als kaartjes op het **Vermogensoverzicht (de plaat)**, in het blok van het overkoepelende domein Projecten of Samenwerkingen. Een project in voorbereiding is gestippeld; een afgerond project staat niet op de plaat. Home en het Domeinenoverzicht blijven zoals ze zijn.

## Scope

**In scope**
- Collecties `clubs/{clubId}/projecten` en `clubs/{clubId}/samenwerkingen`, plus het optionele veld `bevat` op een overkoepelend domein.
- Firestore-regels voor beide collecties en voor `bevat`; regeltests in `tests/regels.test.mjs`.
- Nieuwe module `src/onderdelen.js` (naamregels, laden, schrijven) voor beide soorten.
- Eén generieke beheerpagina met twee configuraties (menu-id's `projecten` en `samenwerkingen`), in het zijmenu onder Beheer.
- De plaat: kaartjes in het juiste overkoepelende blok.
- Bestuursfuncties: de verwijderguard en de kolom "Eindverantwoordelijk voor" tellen ook projecten en samenwerkingen.
- Inrichtscript `scripts/inrichten-projecten-samenwerkingen-hca.mjs` en npm-script `projecten:import`.
- Documentatie: `.claude/docs/` (technisch blad CK-046), CHANGELOG en backlog.

**Niet in scope**
- Geen contactpersoon, geen soort partner, geen koppeling aan domeinen of vermogens (besluiten 5 en 6).
- Geen status bij samenwerkingen (besluit 7).
- Geen wijziging aan Home, de kerncijfers of het Domeinenoverzicht (besluit 9).
- Geen keuze voor `bevat` in het domeinformulier (zie Plaat en open vraag 5). Alleen via het inrichtscript.
- Geen doorklikken van de plaat naar beheer.
- **P0d (`isBeheerder`) niet.** Elk lid mag alles wat de regels toestaan (zie Restrisico).

## User stories
1. Als bestuurder wil ik de projecten van de club bijhouden met status en periode, zodat iedereen ziet wat er loopt en wat eraan komt.
2. Als bestuurder wil ik de externe partners van de club bijhouden, met wie er eigenaar van is.
3. Als lid wil ik op de plaat zien welke projecten lopen of in voorbereiding zijn, en met wie de club samenwerkt.
4. Als bestuurder wil ik een afgerond project bewaren zonder dat het nog op de plaat staat.
5. Als bestuurder wil ik geen bestuursfunctie kunnen verwijderen die nog eigenaar is van een project of samenwerking.

## Gebruikersreis (samenvatting)
1. Bestuurder opent **Beheer → Projecten** en ziet de lijst (of de lege staat) met bovenaan een filter op status en **+ Project toevoegen**.
2. Hij voegt een project toe (naam, status, periode, eigenaar, omschrijving), zet het met ↑/↓ op de juiste plek en zet de status later op Lopend of Afgerond.
3. Bij **Beheer → Samenwerkingen** werkt het hetzelfde, zonder status en periode en zonder filter.
4. Een lid opent **Vermogensoverzicht** en ziet in het blok Projecten de lopende projecten en gestippeld de projecten in voorbereiding, en in het blok Samenwerkingen de partners.

## Datamodel

**`clubs/{clubId}/projecten/{id}`** (automatisch id, `addDoc`)

| Veld | Type | Verplicht | Regel |
|---|---|---|---|
| `naam` | string | ja | 2–100 tekens, zie Naamregels. Uniek binnen de projecten van de club (alleen in de app) |
| `omschrijving` | string | nee | 0–500 tekens, getrimd. Leeg = `''` |
| `bestuursfunctieId` | string | nee | id uit `bestuursfuncties`, of `''` (nog niet gekozen). Max. 100 tekens |
| `status` | string | ja | `in-voorbereiding` \| `lopend` \| `afgerond` |
| `periode` | string | nee | vrije tekst 0–50 tekens, bijv. "seizoen 27/28" of "2026–2028" (open vraag 1). Leeg = `''` |
| `volgorde` | int | ja | 1 t/m n over alle projecten van de club |

**`clubs/{clubId}/samenwerkingen/{id}`**: `naam`, `omschrijving`, `bestuursfunctieId`, `volgorde`, met dezelfde regels. Geen `status`, geen `periode`.

**`clubs/{clubId}/structuurelementen/{id}`**, nieuw optioneel veld:

| Veld | Type | Regel |
|---|---|---|
| `bevat` | string | alleen zinvol bij `type: 'overkoepelend'`: `projecten` of `samenwerkingen`. Ontbreekt = alleen de omschrijving, zoals nu |

De app schrijft altijd alle velden (ook lege strings), zodat de regels met `hasAll` kunnen werken en de lijst geen `undefined` kent.

### Waarom een veld `bevat` op het domein
De plaat moet weten in welk overkoepelend blok de kaartjes komen. Afgewogen:
- **Op naam zoeken** ("Projecten") is het simpelst, maar breekt stil bij hernoemen ("Trajecten", "Partners") en is per tenant niet te sturen.
- **Een eigen blok los van `structuurelementen`** geeft een dubbel blok naast het bestaande domein Projecten, en de eindverantwoordelijke van het domein valt weg.
- **Veld `bevat`** (gekozen): één expliciete verwijzing, robuust bij hernoemen, generiek voor elke club, geen migratie (ontbreekt = gedrag van nu). De domeinformulieren gebruiken `updateDoc` met vaste velden en laten `bevat` dus staan. Het inrichtscript zet het voor HCA. Een keuze in het domeinformulier is een klein vervolgpunt (open vraag 5).
- Hebben twee overkoepelende domeinen dezelfde `bevat`, dan toont de plaat de kaartjes bij het **eerste** (domeinvolgorde) en negeert hij het tweede. Een domein met `bevat` dat geen `overkoepelend` (meer) is, wordt genegeerd (de app kijkt alleen naar `type === 'overkoepelend'`).

### Uniek of niet
Naam uniek per collectie, hoofdletterongevoelig (sleutel = `naamSleutel()` uit `vermogens.js`), **alleen in de app** zoals bij bestuursfuncties: vlak vóór opslaan de lijst vers laden en vergelijken. Geen naamdocumenten zoals bij vermogens: de lijsten zijn klein, niemand verwijst op naam naar een project, en een dubbele naam is onschuldig (zichtbaar en zelf te herstellen). Een project en een samenwerking mogen dezelfde naam hebben.

### Bestuursfunctie verwijderen die eigenaar is
De bestaande guard (`renderBestuursfunctiesBeheer`, r. 2384–2391) is app-only en telt alleen domeinen via `data-aantal` uit de render. Uitbreiden:
- `laadEnRender` (r. 2291) laadt ook `laadOnderdelen('projecten')` en `laadOnderdelen('samenwerkingen')`. Mislukt een van beide, dan geldt de bestaande laadfout van de pagina (verwijderen zonder volledige telling is onveilig).
- Bij **Verwijderen** opnieuw tellen (vers lezen van de drie collecties), niet alleen `data-aantal`. Is het totaal > 0: melding, geen `confirm()`.
- Kolom "Eindverantwoordelijk voor" (r. 2297–2302): opsomming van wat > 0 is, bijv. "2 domeinen, 3 projecten", "1 samenwerking", of "Niets". Kolomkop blijft.
- Tekst blokkade: "Deze bestuursfunctie is nog eindverantwoordelijke of eigenaar van 2 domeinen en 1 project. Kies daar eerst een andere bestuursfunctie."
- Geen regel-guard (de regels kunnen niet goedkoop tellen). Ontstaat via de console toch een verwijzing naar een verdwenen functie, dan toont de app "nog niet gekozen" (zelfde als bij domeinen).

## Naamregels (in app en regels gelijk)
- Normaliseren zoals vermogens: `normaliseerVermogensnaam()` (NFC, trim, enkele spaties). Hergebruiken, eventueel hernoemen naar `normaliseerNaam` met een alias.
- Toegestane tekens: de vermogensset **plus `/`**, omdat "Hoofdsponsoring 27/28+" en "Kledinglijn 27/28+" die nodig hebben. `/` mag hier, want de naam wordt geen document-id. JS: `/^[a-zA-Z0-9À-ÖØ-öø-ÿ][a-zA-Z0-9À-ÖØ-öø-ÿ &'.,()+\/-]*$/`. Regels: dezelfde klasse met `/` erbij.
- Lengte 2–100, geen dubbele spatie, `naam == naam.trim()`.
- Veldfouten: hergebruik de opbouw van `vermogensnaamFout()` met de tekenset uitgebreid ("... en & ' - . , ( ) + /"). Maak in `vermogens.js` een geparametriseerde variant of zet de gedeelde stukken in `onderdelen.js`; de vermogensfoutteksten mogen niet veranderen (bestaande test r. 90).
- Omschrijving en periode: vrije tekst, alleen trim en lengte; geen tekenfilter. Weergave altijd via `esc()`.

## Nieuwe module `src/onderdelen.js`
Zelfde opbouw als `src/vermogens.js` (pure functies met `db` en `clubId` als parameter, bruikbaar in app, script en tests).

```js
export const SOORT_ONDERDEEL = {
  projecten:      { enkel: 'project', meer: 'projecten', status: true },
  samenwerkingen: { enkel: 'samenwerking', meer: 'samenwerkingen', status: false },
}
export const STATUSSEN = [['in-voorbereiding', 'In voorbereiding'], ['lopend', 'Lopend'], ['afgerond', 'Afgerond']]
export const OP_PLAAT = new Set(['in-voorbereiding', 'lopend'])
export function onderdeelnaamFout(naam)            // '' of veldfout
export function geldigOnderdeel(soort, data)       // spiegel van de regels, voor script en tests
export async function laadOnderdelen(db, clubId, soort)   // gesorteerd met volgorde, dan naam (nl)
export async function voegOnderdeelToe(db, clubId, soort, data)  // volgorde = hoogste + 1
export async function bewerkOnderdeel(db, clubId, soort, id, data)
export async function verwijderOnderdeel(db, clubId, soort, id)
```
- Geen transacties nodig (geen teller, geen naamdocument). Bewerken: `updateDoc` (geeft `not-found` als het intussen weg is: bestaande `WEG_CODES`).
- ↑/↓: bestaande `schrijfVolgorde(soort, lijst, clubId)` (r. 170).
- Dubbele naam: eigen codes `dubbel-project` en `dubbele-samenwerking` in `FOUTTEKSTEN`, want `dubbele-naam` (r. 318) heeft de tekst "Deze bestuursfunctie bestaat al". Koppelen aan het naamveld via `veldFouten` in `metOpslaan`, zoals bij Bestuursfuncties (r. 2353).

## Firestore-regels
Binnen `match /clubs/{clubId}`, naast `vermogens`. Hulpfuncties op het niveau van `isLid`.

```
function geldigeOnderdeelnaam(n) {
  return n is string && n.size() >= 2 && n.size() <= 100
    && n.matches("[a-zA-Z0-9À-ÖØ-öø-ÿ][a-zA-Z0-9À-ÖØ-öø-ÿ &'.,()+/-]*")
    && n == n.trim() && !n.matches('.*  .*');
}
function tekstTot(v, max) { return v is string && v.size() <= max; }
function geldigeBasis(d) {
  return geldigeOnderdeelnaam(d.naam)
    && tekstTot(d.omschrijving, 500)
    && tekstTot(d.bestuursfunctieId, 100)
    && d.volgorde is int && d.volgorde >= 1 && d.volgorde <= 100000;
}
function geldigProject(d) {
  return d.keys().hasOnly(['naam', 'omschrijving', 'bestuursfunctieId', 'status', 'periode', 'volgorde'])
    && d.keys().hasAll(['naam', 'omschrijving', 'bestuursfunctieId', 'status', 'periode', 'volgorde'])
    && geldigeBasis(d)
    && d.status in ['in-voorbereiding', 'lopend', 'afgerond']
    && tekstTot(d.periode, 50);
}
function geldigeSamenwerking(d) {
  return d.keys().hasOnly(['naam', 'omschrijving', 'bestuursfunctieId', 'volgorde'])
    && d.keys().hasAll(['naam', 'omschrijving', 'bestuursfunctieId', 'volgorde'])
    && geldigeBasis(d);
}

match /projecten/{id} {
  allow read, delete: if isLid(clubId);
  allow create, update: if isLid(clubId) && geldigProject(request.resource.data);
}
match /samenwerkingen/{id} {
  allow read, delete: if isLid(clubId);
  allow create, update: if isLid(clubId) && geldigeSamenwerking(request.resource.data);
}
```
- `structuurelementen` create en update: extra `&& (!('bevat' in request.resource.data) || request.resource.data.bevat in ['projecten', 'samenwerkingen'])`. Bestaande domeinen hebben het veld niet: geen migratie.
- Geen `exists()` op `bestuursfunctieId`: domeinen doen dat ook niet, en een ↑/↓-batch zou anders per document extra leesacties kosten. Leesacties per document: alleen `isLid` = 1. Ruim binnen de limieten, ook bij ↑/↓ over de hele lijst.
- Regex: in de emulator controleren dat `/` binnen een tekenklasse in `matches()` (RE2) goed werkt en dat Latin-1 slaagt; zelfde aanpak als CK-020.

### Regeltests (`tests/regels.test.mjs`, `npm run test:regels`)
Nieuwe `describe`-blokken, zelfde hulpfuncties als de vermogenstests:
1. **App-functies**: `onderdeelnaamFout` voor leeg, 1 teken, 101 tekens, eerste teken `-`, `/` midden in, emoji; alle 10 HCA-namen uit het inrichtscript voldoen.
2. **Slaagt**: project toevoegen (alle velden, lege omschrijving/periode/eigenaar), status wijzigen, ↑/↓ als batch over alle HCA-projecten, verwijderen; idem samenwerking; domein bijwerken zonder `bevat` blijft slagen; `bevat: 'projecten'` zetten slaagt.
3. **Weigert**: niet-lid lezen en schrijven; extra veld; ontbrekend veld (bijv. geen `omschrijving`); status `bezig`; samenwerking met `status` of `periode`; naam 1 teken, 101 tekens, met voorloopspatie, dubbele spatie, `_` of emoji; omschrijving 501 tekens; periode 51 tekens; `volgorde` 0, 1.5 of string; `bestuursfunctieId` geen string; `bevat: 'vermogens'`.
4. Bestaande tests blijven ongewijzigd groen.

### Restrisico
1. **Geen rollen (P0d):** elk lid mag alle projecten en samenwerkingen wijzigen en verwijderen. Acceptabel zolang alle leden bestuurders zijn. Voeg `projecten` en `samenwerkingen` toe aan de harde eis van P0d in de backlog ("schrijven alleen `isBeheerder`").
2. **Unieke naam en eigenaar-guard** zitten alleen in de app. Via de console of twee tabbladen tegelijk kan een dubbele naam of een verwijzing naar een verdwenen functie ontstaan; beide onschuldig en zichtbaar.
3. Console en Admin-SDK omzeilen de regels (alleen Paul).

## Zijmenu en navigatie
- `ZIJMENU` (r. 1141), groep Beheer, na `vermogensbeheer`:
  `{ id: 'projecten', naam: 'Projecten', ico: 'klembord' }`, `{ id: 'samenwerkingen', naam: 'Samenwerkingen', ico: 'schakels' }`. Volgorde: Domeinen, Vermogens, Projecten, Samenwerkingen, Bestuursfuncties, Club.
- `NAV_DOEL` (r. 1158): `['projecten', g => renderOnderdeelBeheer(g, 'projecten')]`, idem `samenwerkingen`.
- `MENU_ICOON` (r. 1120), voorstel (48×48, lijndikte 3; op 18px controleren):
  - `klembord`: `'<rect x="10" y="9" width="28" height="33" rx="2"/><path d="M18 9 V6 H30 V9"/><path d="M17 21 H31"/><path d="M17 28 H31"/><path d="M17 35 H25"/>'`
  - `schakels` (twee schakels): `'<rect x="5" y="17" width="22" height="14" rx="7"/><rect x="21" y="17" width="22" height="14" rx="7"/>'`
- Kruimelpad: Home › Beheer › Projecten. Documenttitel via `paginaTitel(navNaam(id))`.

## Gebruikersreis per pagina

Eén functie `renderOnderdeelBeheer(gebruiker, soort)` met `SOORT_ONDERDEEL[soort]`; opbouw als `renderVermogensBeheer` (r. 1785): `.sectie[data-meldblok]`, `h2` "Projecten" / "Samenwerkingen", `.beheer-balk`, formulier, `meldingenHTML`, `sr-only` statusregels, lijst. `clubId` vastleggen bij openen.

### Balk
- **Projecten:** links keuzelijst "Toon" met **Alle projecten** (standaard), **In voorbereiding**, **Lopend**, **Afgerond**; rechts **+ Project toevoegen**.
- **Samenwerkingen:** alleen **+ Samenwerking toevoegen** (geen filter, zoals Bestuursfuncties, besluit 21).
- De balk is verborgen tijdens het laden en bij een laadfout (zoals bij vermogens).
- Filterwissel: lijst opnieuw tekenen, statusregel "3 projecten getoond" / "Geen projecten met status Afgerond".

### Lijst (tabelrollen als Bestuursfuncties)
- Projecten: `#` · **Project** (naam, daaronder de omschrijving in kleine grijze tekst als die er is) · **Status** · **Periode** (leeg = "—") · **Eigenaar** ("—" bij geen of onbekende functie) · acties (↑, ↓, Bewerken, Verwijderen als pictogramknoppen via `actieKnopHTML`).
- Samenwerkingen: `#` · **Samenwerking** (met omschrijving) · **Eigenaar** · acties.
- Status als tekst, geen kleur als enige drager. Afgerond mag `color: var(--muted)` krijgen.
- Volgorde: `volgorde`, daarna naam (`sorteerDomeinen`). Status bepaalt de volgorde niet.
- ↑/↓ met filter actief: wisselt met het vorige/volgende **zichtbare** item en hernummert de hele lijst 1 t/m n via `schrijfVolgorde`. Eerste/laatste zichtbare: knop `disabled`. Statusregel: "LED-scorebord staat nu op plaats 3 van 5."

### Toevoegen
1. **+ Project toevoegen** verbergt de knop en opent het formulier bovenaan; focus op Naam.
2. Velden (labels): **Naam** (verplicht, placeholder "Bijv. LED-scorebord"), **Status** (keuzelijst, standaard **In voorbereiding**), **Periode** (optioneel, placeholder "Bijv. seizoen 27/28"), **Eigenaar** (`bestuursfunctieKeuzeHTML`, eerste optie "Kies een bestuursfunctie" = leeg), **Omschrijving** (optioneel, `textarea`, 3 regels). Samenwerking: Naam (placeholder "Bijv. KNHB"), Eigenaar, Omschrijving.
3. **Opslaan** via `metOpslaan`: valideren, lijst vers laden, dubbele naam controleren, `voegOnderdeelToe` (onderaan, volgorde hoogste + 1).
4. Succes: formulier dicht, knop terug, lijst ververst, melding "Project LED-scorebord toegevoegd." Valt het nieuwe project buiten het filter, dan springt het filter naar **Alle projecten** en zegt de melding dat erbij ("... Het filter staat weer op Alle projecten.").
5. **Annuleren**: formulier dicht en leeg, focus op de knop.

### Bewerken
- Pictogramknop Bewerken vervangt de rij door het formulier (zelfde velden, ingevuld), zoals bij Bestuursfuncties. Focus op Naam.
- Opslaan: zelfde validatie en dubbele-naamcontrole (eigen id uitgezonderd, hoofdletterwijziging van de eigen naam mag).
- Succes: "Project X opgeslagen." Bij status naar **Afgerond** extra: "X is afgerond en staat niet meer op de plaat." Valt het item na de wijziging buiten het filter, dan verdwijnt het uit de lijst en gaat de focus naar de terugval (`zichtbareTerugval`).
- Eigenaar verwijst naar een verdwenen functie: keuzelijst staat op "Kies een bestuursfunctie".

### Verwijderen
- `confirm('Project X verwijderen? Dit kan niet ongedaan worden gemaakt.')`. Bij afgeronde projecten dezelfde vraag (Afgerond is het alternatief voor verwijderen; geen extra tekst).
- Succes: "Project X verwijderd.", focus naar terugval. Al weg (`WEG_CODES`): lijst verversen, melding "Dit project bestaat niet meer.".

### Lege staat (`.leeg-blok`, knop + Toevoegen blijft zichtbaar in de balk)
- Projecten: **Nog geen projecten** — "Een project is een tijdelijk traject van de club, zoals een verbouwing, een nieuw scorebord of een sponsortraject."
- Samenwerkingen: **Nog geen samenwerkingen** — "Een samenwerking is een vaste partner buiten de club, zoals de bond, de gemeente of scholen."
- Filter zonder treffers: `p.lijst-leeg` "Geen projecten met status Afgerond."
- Staat er geen overkoepelend domein met `bevat` voor deze soort, dan onder de balk een `p.tussen-hint`: "Deze projecten staan nog niet op de plaat: geen overkoepelend domein toont projecten." (geen link).

### Foutmeldingen
| Situatie | Tekst |
|---|---|
| Naam leeg | Verplicht veld |
| Naam te kort/lang | Tussen 2 en 100 tekens |
| Ongeldige tekens | via `onderdeelnaamFout` ("Gebruik letters ..., cijfers, spaties en & ' - . , ( ) + /") |
| Periode > 50 | Maximaal 50 tekens |
| Omschrijving > 500 | Maximaal 500 tekens |
| Dubbele naam | Er is al een project met deze naam. / Er is al een samenwerking met deze naam. (onder het naamveld) |
| Offline, geen rechten, intussen weg | bestaande `FOUTTEKSTEN` via `metOpslaan` |
| Laadfout | "De projecten konden niet worden geladen. Controleer je verbinding en probeer het opnieuw." [Opnieuw laden]; test/ontwikkel bij `permission-denied`: "Testomgeving: zijn de Firestore-regels voor projecten en samenwerkingen al gepubliceerd?" |

Bestuursfuncties laden mislukt op deze pagina: lijst toont "—" bij eigenaar en het formulier toont alleen "Kies een bestuursfunctie", plus `p.vermogens-hint[role=status]` "De bestuursfuncties konden niet worden geladen. Herlaad de pagina om een eigenaar te kiezen." Opslaan behoudt bij bewerken de bestaande `bestuursfunctieId` (niet leegmaken).

## Plaat (Vermogensoverzicht)
Wijzigingen in `renderPlaat` (r. 1022) en `plaatKaartHTML` (r. 1001).
- **Laden:** projecten en samenwerkingen via `Promise.allSettled`, net als bestuursfuncties. Mislukt het, dan de plaat zoals nu (alleen omschrijving) plus in `#plaat-hint` "De projecten en samenwerkingen konden niet worden geladen. Herlaad de pagina om het opnieuw te proberen." (beide hints samen als tweede zin).
- **Welk blok:** per soort het eerste domein met `type === 'overkoepelend'` en `bevat === soort` (domeinvolgorde).
- **Kaart van het overkoepelende domein:** kop, eindverantwoordelijke, omschrijving (blijft, zie open vraag 3), daaronder `ul.plaat-onderdelen[role=list]` met `li.plaat-onderdeel` per item.
  - Projecten: alleen `in-voorbereiding` en `lopend` (`OP_PLAAT`), in beheervolgorde. Inhoud: naam; periode in `span.plaat-onderdeel-sub` als die er is.
  - In voorbereiding: klasse `voorbereiding` (gestippelde rand, `border-style: dashed`, `border-color: var(--muted)`) **plus** zichtbaar label "In voorbereiding" in `span.plaat-onderdeel-sub` (niet alleen een rand: toegankelijk en zonder legenda te begrijpen).
  - Samenwerkingen: naam per tegel.
  - Omschrijving en eigenaar van een project of samenwerking staan niet op de plaat (open vraag 4).
- **Lege staat in het blok:** "Nog geen projecten" / "Nog geen samenwerkingen" (`p.plaat-leeg`). Zijn er wel projecten maar allemaal afgerond: "Geen lopende projecten".
- **Sectietoelichting** "zonder vermogens" blijft.
- **CSS** (sectie "De plaat (CK-021)", alleen tokens): `.plaat-onderdelen` als `.plaat-vermogens`; `.plaat-onderdeel` als `.plaat-vermogen`; `.plaat-onderdeel.voorbereiding { border-style: dashed; border-color: var(--muted); background: transparent }`; `.plaat-onderdeel-sub { display: block; font-size: var(--fs-label); color: var(--muted) }`. Overkoepelende kaarten blijven `.plaat-domein.over` zonder gestippelde rand. Licht en donker controleren (gestippelde rand ≥ 3:1 tegen `--card`).

## Inrichtscript `scripts/inrichten-projecten-samenwerkingen-hca.mjs`
Stijl van `scripts/inrichten-vermogens-hca.mjs`: `--help`, `startScript()` uit `scripts/lib/omgeving.mjs` (`--omgeving=test|productie`, productie vraagt de projectnaam), `--droog`, `vraag`, `inloggen`, `zoekClubId`, `geweigerd(e, { gedeeltelijk })`, `gelukt`, `waarschuw`, `stop`. Schrijft via de functies uit `src/onderdelen.js`. npm-script: `"projecten:import": "node scripts/inrichten-projecten-samenwerkingen-hca.mjs"`.

Bron (`CK-020-bron-vermogensoverzicht.md`, Overkoepelende domeinen), in deze volgorde:

| Soort | Naam | Status |
|---|---|---|
| project | Ver(nieuw)bouw | lopend |
| project | Hoofdsponsoring 27/28+ | lopend |
| project | Kledinglijn 27/28+ | lopend |
| project | LED-scorebord | in-voorbereiding |
| project | Buitenopslag (blaashal) | in-voorbereiding |
| samenwerking | KNHB | — |
| samenwerking | Gemeente | — |
| samenwerking | Junis | — |
| samenwerking | Scholen | — |
| samenwerking | Hulpdiensten | — |

Omschrijving en periode leeg. Eigenaar: de `bestuursfunctieId` van het overkoepelende domein (HCA: Voorzitter), zie open vraag 2.

Werking:
1. **Eerst het hele plan.** Lees `structuurelementen`, `projecten`, `samenwerkingen`. Zoek de overkoepelende domeinen **Projecten** en **Samenwerkingen** op `bevat`, anders op naam (hoofdletterongevoelig). Stop zonder te schrijven als een domein ontbreekt, dubbel is of niet overkoepelend, of als een naam niet aan `onderdeelnaamFout` voldoet.
2. **Idempotent:** bestaat de naam al (sleutel) in de collectie, dan overslaan; wijkt de status af, dan "LET OP Buitenopslag (blaashal) staat er al met status lopend, ongemoeid." Het script wijzigt en verwijdert nooit bestaande items en past geen omschrijving van een domein aan.
3. `bevat` zetten op het domein als het ontbreekt (`updateDoc` met alleen `{ bevat }`); staat er al een andere waarde: stoppen.
4. Plan tonen (`+ project LED-scorebord (in voorbereiding, volgorde 4)`, `+ bevat=projecten op Projecten`), dan "ja" typen. Schrijven in één `writeBatch` (≤ 12 schrijfacties); volgorde = hoogste + 1 in bronvolgorde. Gedeeltelijk mislukt kan dan niet; opnieuw draaien is veilig.
5. Agents draaien het script niet (ook niet `--droog`); Paul doet dat na het publiceren van de regels in test.

## Betrokken bestanden
- `src/onderdelen.js` — nieuw (zie module).
- `src/vermogens.js` — gedeelde naamhulp beschikbaar maken zonder de vermogensteksten te wijzigen.
- `src/main.js` — `MENU_ICOON`, `ZIJMENU`, `NAV_DOEL`; nieuwe `renderOnderdeelBeheer`; `renderPlaat`/`plaatKaartHTML`; `renderBestuursfunctiesBeheer` (telling en guard); eventueel `FOUTTEKSTEN`.
- `src/style.css` — beheerkolommen projecten/samenwerkingen (grid zoals `.functie-rij`, smal scherm gestapeld), plaatklassen.
- `firestore.rules` — twee collecties, `bevat`.
- `tests/regels.test.mjs` — nieuwe blokken.
- `scripts/inrichten-projecten-samenwerkingen-hca.mjs` — nieuw; `package.json` — npm-script.
- `.claude/docs/`, `CHANGELOG.md`, backlog (P0d-eis aanvullen).

## Acceptatiecriteria
- [ ] Zijmenu Beheer: Domeinen, Vermogens, Projecten, Samenwerkingen, Bestuursfuncties, Club; nieuwe pictogrammen leesbaar op 18px met tooltip; één `aria-current`.
- [ ] Project toevoegen, bewerken (ook status), ↑/↓ en verwijderen werken; idem samenwerking (zonder status en periode).
- [ ] Filter op status bij projecten; ↑/↓ met filter wisselt met het zichtbare buur-item; nieuw item buiten filter zet filter op Alle.
- [ ] Dubbele naam (andere hoofdletters, extra spaties) geweigerd met veldfout; "Hoofdsponsoring 27/28+" en "Ver(nieuw)bouw" toegestaan.
- [ ] Lege staat, filter zonder treffers, laadfout met Opnieuw laden en testhint zoals beschreven.
- [ ] Bestuursfunctie die eigenaar is van een project of samenwerking is niet te verwijderen; kolom toont de opsomming.
- [ ] Plaat: in het blok met `bevat: 'projecten'` lopende projecten als tegel, in voorbereiding gestippeld met label, afgerond niet; samenwerkingen in hun blok; volgorde gelijk aan beheer; lege staten; zonder `bevat` het gedrag van nu.
- [ ] Laden van projecten/samenwerkingen mislukt: plaat verschijnt toch, met hint.
- [ ] Home en Domeinenoverzicht ongewijzigd.
- [ ] Namen en omschrijvingen met `& ' ( ) / <` worden veilig getoond.
- [ ] `npm run test:regels` groen, inclusief de nieuwe tests; `npm run build` slaagt.
- [ ] Lay-out op ≥ 1200px, 768px en 375px, licht en donker; toetsenbord en schermlezer (tabelrollen, statusregels, focus na acties).

## Wat mag er niet kapotgaan?
- Vermogens beheren en alle vermogensregels/-tests (naamregels en foutteksten van vermogens ongewijzigd).
- Domeinen beheren: bewerken van een overkoepelend domein laat `bevat` staan; de tellerregels blijven kloppen.
- Bestuursfuncties: toevoegen, bewerken, volgorde.
- De plaat voor pijlers en ondersteunende domeinen; het Home-kerncijfer en de verweesd-voetnoot.
- Zijmenu (in-/uitklappen, paneel ≤ 700px), kruimelpad, documenttitel.
- Bestaande inrichtscripts en `seed-testclub.mjs` (schrijft domeinen met `merge: true`, raakt `bevat` niet).

## Architectuurlaag
**Model-laag (M1)** — projecten en samenwerkingen zijn de inhoud van overkoepelende domeinen, een generiek onderdeel van het pijler/domein-model van elke tenant. Via `bevat` bepaalt de club zelf welk overkoepelend domein wat toont; niets HCA-specifieks in de app (alleen in het inrichtscript). Zijmenu-items volgen het P0-shellpatroon van CK-044.

## Randgevallen en risico's
- **Twee domeinen met dezelfde `bevat`**: alleen het eerste toont kaartjes. Acceptabel; geen regel-guard.
- **Overkoepelend domein verwijderd**: projecten blijven in beheer, de hint "staan nog niet op de plaat" verschijnt. Geen guard nodig (geen koppeling, besluit 6).
- **Domein van overkoepelend naar pijler**: `bevat` blijft staan maar wordt genegeerd; terugzetten herstelt het.
- **Veel projecten** (20+): lange kolom in het blok; acceptabel.
- **Gelijke `volgorde`** na gelijktijdig toevoegen: sorteren op naam als tweede sleutel (bekend vervolgpunt CK-023).
- **Uitrol**: regels test → testen in tst → script in test → regels productie → app → script productie. Niet op 26 november 2026. Agents publiceren geen regels, loggen niet in en schrijven niet naar Firestore. Zolang de regels niet gepubliceerd zijn, geeft de beheerpagina `permission-denied` (testhint) en blijft de plaat werken (allSettled). Let op: ook de pagina Bestuursfuncties laadt dan niet (Promise.all); daarom regels altijd vóór de app.
- **Kosten**: twee extra `getDocs` op de plaat en op Bestuursfuncties (~10 documenten). Verwaarloosbaar.

## Open vragen voor Paul
1. **Periode: vrij tekstveld, seizoen of datums?** Advies: vrij tekstveld, optioneel, max. 50 tekens (bijv. "seizoen 27/28", "2026–2028", "voorjaar 2027"). Datums vragen een datumkiezer en dwingen precisie af die er bij een plan vaak niet is; een seizoenkeuze past niet bij meerjarige trajecten.
2. **Eigenaar verplicht?** Advies: nee, net als de eindverantwoordelijke bij een domein ("nog niet gekozen"). Het inrichtscript zet bij HCA de eindverantwoordelijke van het overkoepelende domein (Voorzitter) als eigenaar; jij past het daarna per project aan. Of liever leeg laten?
3. **Omschrijving van het overkoepelende domein op de plaat**: nu staan daar voorbeelden ("Tijdelijke trajecten, zoals verbouw, LED-scorebord..."), die straks dubbel zijn met de kaartjes. Advies: de omschrijving blijft staan (het is clubtekst); jij past de tekst bij Projecten en Samenwerkingen zelf in Beheer → Domeinen aan naar iets algemeens. Alternatief: omschrijving verbergen zodra er kaartjes zijn.
4. **Wat staat er op een kaartje op de plaat?** Advies: alleen de naam, met de periode en "In voorbereiding" als kleine regel eronder; geen omschrijving en geen eigenaar (houdt de plaat rustig, zoals de vermogenstegels).
5. **Keuze `bevat` in het domeinformulier** ("Toont op de plaat: projecten / samenwerkingen") nu meebouwen of later? Advies: later (vervolgpunt). Voor HCA zet het inrichtscript het; andere clubs zijn er nog niet.
6. **Naam uniek?** Advies: ja, per lijst en hoofdletterongevoelig, alleen gecontroleerd in de app (zoals bij bestuursfuncties), niet in de regels. Een project en een samenwerking mogen wel dezelfde naam hebben.
