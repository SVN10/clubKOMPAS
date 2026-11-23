# Testrapport: CK-020 — Vermogens beheren

Fase 5a (tester), 23 november 2026, branch `test`, ongecommitte wijzigingen. Niet ingelogd, geen regels gepubliceerd, niets naar een echte Firestore geschreven, scripts niet tegen een project gedraaid, `.env*.local` niet aangeraakt, niets gecommit. Productiecode niet gewijzigd; alleen `tests/regels.test.mjs` is aangevuld.

Legenda dekking: **[T]** geautomatiseerde test (emulator), **[C]** gecontroleerd in code, **[H]** alleen handmatig in tst te testen.

## Uitgevoerde controles

| Controle | Uitkomst |
|---|---|
| `npm run build` | ✅ slaagt (alleen de bekende chunkgrootte-waarschuwing) |
| `npm run test:regels` | ✅ 59 tests, 59 geslaagd (51 van de bouwer + 8 nieuwe van de tester) |
| `node --check` op `src/vermogens.js`, `scripts/inrichten-vermogens-hca.mjs`, `scripts/controleer-vermogens.mjs`, `scripts/lib/vermogens-hca.mjs` | ✅ |
| `--help` van beide scripts | ✅ beide tonen hulp, exit 0, geen login |
| `npm run lint` | n.v.t. (geen lint-script) |
| Namen in code en bron | ✅ 58 (13 + 45); `CK-020-bron-vermogensoverzicht.md` zegt zelf 58; `BRON_AANTAL = 58` |

## Acceptatiecriteria

### Beheer
| Criterium | Status | Dekking | Opmerking |
|---|---|---|---|
| Zijmenu Beheer: Vermogens tussen Domeinen en Bestuursfuncties, eigen pictogram, kruimelpad, titel, één `aria-current` | ✅ | [C] | `ZIJMENU` (main.js r. 994-999), `NAV_DOEL` r. 1009, pictogram `puzzel`, kruimels `Home › Beheer › Vermogens` (r. 1632), `actief: 'vermogensbeheer'`; titel via `navNaam` in `navigeer`. Visueel [H]. |
| Lijst gegroepeerd per domein (domeinvolgorde), per groep op volgorde; filter werkt | ✅ | [C] | `geldigeDomeinen()` (volgorde uit `laadStructuurelementen`), `vanDomein` → `sorteerDomeinen`; filter `tekenLijst`; ongeldig filter valt terug op "alle". |
| Toevoegen: naam 2–100 en tekens, domein verplicht, keuzelijst alleen pijler/ondersteunend, onderaan, melding | ✅ | [T]+[C] | Naamregels, onderaan (`hoogsteVolgorde`+1) en protocol [T]; keuzelijst `domeinOptiesHTML(geldigeDomeinen())` [C]. Meldtekst "toegevoegd aan {domein}" volgt het ontwerp (r. 179/423), niet de korte AC-tekst. |
| Dubbele naam (hoofdletters, spaties, ander domein) geweigerd onder het naamveld met domein; invoer blijft | ✅ | [T]+[C] | `dubbel-vermogen` met `domeinNaam` [T]; veldfout via `vermogenVeldFouten` en `e.tekst` [C]; invoer blijft (geen reset bij fout). |
| Bewerken: naam en/of domein; verplaatst onderaan; alleen hoofdletters mag | ✅ | [T]+[C] | [T] hernoemen, verplaatsen, hoofdletters (ook rechtstreeks, nieuw). Rij-formulier [C]. |
| ↑/↓ alleen binnen het domein, schermlezermelding, focus blijft | ✅ | [T]+[C] | Batch met alleen `volgorde` [T]; `vers` per domein, `zetStatus`, `focusInLijst` [C]. |
| Verwijderen met `confirm()`, melding, focus nooit op `<body>` | ✅ | [T]+[C] | Transactie [T]; focus: buur-potlood of `terugval()` [C]. |
| Alle schrijfacties via `metOpslaan` met CK-023-meldingen; naam/domein/teller via `runTransaction` | ✅ | [C] | Alle vermogensacties lopen via `metOpslaan`; transacties in `src/vermogens.js`. ↑/↓ via `schrijfVolgorde` (batch, conform spec). |

### Domeinen
| Criterium | Status | Dekking | Opmerking |
|---|---|---|---|
| Domein met vermogens niet te verwijderen en niet naar overkoepelend, melding (ook bij race) | ✅ | [T]+[C] | Regels [T]; app: vers aantal vóór `confirm()` (r. 1476-1478), vóór opslaan bij overkoepelend (r. 1562-1567), na `permission-denied` opnieuw tellen (r. 1485, 1576). Geen `confirm()` bij > 0 (besluit 15). |
| Pijler ↔ ondersteunend mag, vermogens blijven | ✅ | [T] | |
| Domein zonder vermogens (ook zonder tellerveld) verwijderen en bewerken zoals nu | ✅ | [T] | Nieuw: bewerken/verwijderen zonder tellerveld, ongeldig type/naam blijft geweigerd. |

### Regels (afgedwongen)
| Criterium | Status | Dekking | Opmerking |
|---|---|---|---|
| Aanmaken zonder naamdocument, zonder teller +1, teller +2, overkoepelend/niet-bestaand domein, ongeldige naam, extra velden, geen int-volgorde: weigeren | ✅ | [T] | |
| Tweede vermogen met bestaande sleutel: weigeren, ook bij twee tabbladen | ✅ | [T] | Twee tabbladen: precies één wint, tellers kloppen. |
| Naamdocument wijzigen: altijd weigeren; verwijderen terwijl in gebruik: weigeren | ✅ | [T] | |
| Domein met teller > 0 verwijderen / overkoepelend; teller los wijzigen; teller onder 0 | ✅ | [T] | Teller onder 0 op twee manieren getest (los en als verwijderprotocol). |
| Bestaande acties op domeinen, bestuursfuncties, clubprofiel blijven werken | ✅ | [T] | Nieuw: grenzen bestuursfunctie (2–100), profiel (docId, logo `data:image/`), niet-lid, onbekende collectie dicht. |

### Home
| Criterium | Status | Dekking | Opmerking |
|---|---|---|---|
| Vierde kerncijfer juist; 2×2 op ≤700px | ✅/[H] | [C] | Telling uit vermogensdocumenten met geldig domein (r. 589-592). CSS 2×2: niet getest, [H]. |
| "n vermogens" per kaart, enkelvoud, niets bij overkoepelend | ✅ | [C] | r. 624-626; "Nog geen vermogens" bij 0. |
| Laden van vermogens mislukt: Home toont nog steeds de domeinen | ✅ | [C] | `Promise.allSettled`, "–" + sr-tekst + hint. |

### Scripts
| Criterium | Status | Dekking | Opmerking |
|---|---|---|---|
| Import `--droog`: 58 nieuw over 13 domeinen, niets geschreven; echte run: tellers kloppen; tweede run 0 | ✅ | [T] logica, [C] script | `maakImportplan` + `voegVermogenToe` getest op de emulator (58 nieuw, tweede keer 0, controle "klopt"). Script zelf (login, prompt "ja", `--droog`-tak) alleen gelezen: schrijft pas na "ja", `--droog` stopt vóór schrijven. Draaien tegen test: [H] (Paul). |
| Controlescript na import "Alles klopt"; na afwijking precies melding | ✅ | [T] logica, [C] script | `controleerVermogens` getest (teller, verweesd vermogen, naamdocumenten). Exitcode 1 bij afwijkingen [C]. |

## Testscenario's (spec 1–18)

| # | Scenario | Dekking |
|---|---|---|
| 1 | Lege start, bestaande domeinen bewerken/leeg domein verwijderen | [T] regels, [C] lege staat (`leeg-blok`); [H] visueel |
| 2 | Toevoegen: onderaan, melding, teller, naamdocument | [T] data; [C] melding; Home/kaart [C] |
| 3 | Dubbel met spatie/hoofdletters, "bij #HCASpeelt" | [T] |
| 4 | Twee tabbladen tegelijk | [T] (emulator); in tst [H] |
| 5 | Naamregels (1/101, 2/100, `a/b`, `__x__`, emoji, İstanbul, `Lief & Leed`, `<b>`) | [T] app én regels (`a/b`, `__x__` vallen onder tekens-niet-toegestaan; getest als `a_b`, `a:b`). Gedrag van `lower()`/regex in productie-Firestore: [H] (zie risico 1) |
| 6 | Hernoemen (hoofdletters, andere naam, naam weer vrij) | [T] |
| 7 | Verplaatsen + tellers; hernoemen+verplaatsen | [T]; halve uitkomst [C] |
| 8 | Volgorde ↑/↓ | [T] data, [C] UI; herladen [H] |
| 9 | Domein verwijderen met vermogens; devtools `deleteDoc` | [T] regels, [C] melding; devtools [H] |
| 10 | Naar overkoepelend; pijler → ondersteunend | [T], [C] |
| 11 | Teller vervalsen | [T] |
| 12 | Buiten het protocol (devtools) | [T] |
| 13 | Verwijderen: naamdocument weg, teller −1, naam hergebruik | [T] |
| 14 | Regels nog niet gepubliceerd: nette fout | [C] `toonLaadfout` met testhint; Home blijft werken [C]; [H] |
| 15 | Offline/time-out, nieuwe poging geeft "bestaat al" | [C] (`metOpslaan` offline/tijd-op; `dubbel-vermogen` met `zelfdeDomein`-tekst); [H] |
| 16 | Consoleschade + controlescript | [T] logica; [H] in testconsole |
| 17 | Import droog/echt/tweede/controle/Home 58 | [T] logica; [H] scripts tegen test |
| 18 | Breedtes, licht/donker, toetsenbord, schermlezer | [H] volledig (niet te testen zonder browser) |

## Regressiecheck
- ✅ Domein bewerken zoals de v0.6.0-app (`updateDoc` zonder tellervelden), ook met teller > 0 [T].
- ✅ Domein toevoegen (zonder tellerveld, of 0), leeg domein verwijderen, `schrijfVolgorde` van domeinen [T].
- ✅ `seed-testclub`-patroon (`set` met `merge`) laat teller staan [T].
- ✅ Bestuursfuncties en clubprofiel (CRUD en bestaande grenzen) [T].
- ✅ Build slaagt; alle in `main.js` gebruikte nieuwe helpers zijn gedefinieerd/geïmporteerd (gecontroleerd: `KAN_VERMOGENS`, `STAART_INVOER`, `SUPPORT_EMAIL`, `sorteerDomeinen`, `domeinOptiesHTML`, `vermogensTekst`, enz.).
- ✅ Bestuursfuncties-lijst: alle `metOpslaan`-aanroepen vanaf een pictogramknop hebben `bezig: null` (↑/↓, verwijderen); zelfde in Domeinen en Vermogens. Bewerken-opslaan in rij gebruikt tekstknop met 'Bezig...' (bedoeld).
- [H] CSS-regressie (container queries 660/500px, kaartraster 152px, 44px-knoppen), mobiel paneel, ingeklapt menu, licht/donker.

## UI-logica in `src/main.js` (code review)

| Onderdeel | Status | Detail |
|---|---|---|
| Filter Domeinen (keuzelijst op soort) | ✅ | `laadEnRender` filtert op `actiefFilter`; lege uitkomst "Geen domeinen van deze soort."; sr-status. |
| ↑/↓ alleen bij "Alle soorten" | ✅ | `kanVerplaatsen = actiefFilter === 'alle'`; anders `onzichtbaar` + `disabled` + `tabindex=-1` + `aria-hidden`; nummer `#` leeg; hint "De volgorde wijzig je bij Toon: Alle soorten." Het attribuut-inject-patroon in `verborgen` (r. 1307) levert geldige HTML op. `focusInLijst` slaat `.onzichtbaar` over. |
| Halve uitkomst hernoemen+verplaatsen | ✅ | r. 2039-2058: `verplaatst` blijft true bij fout in `hernoemVermogen`; formulier opnieuw open op de nieuwe plek met getypte naam, melding en veldfout bij naamcodes; filter springt mee. Naamcheck vooraf (`controleerNaamVrij`) voorkomt verplaatsen bij dubbele naam (besluit 14). Lastig op te wekken; alleen code. |
| Guard bij Domeinen (verwijderen, overkoepelend) | ✅ | Zie Domeinen-criteria; melding met "Naar de vermogens van X" (`toonVermogensBlokkade`), `aria-describedby`, focus blijft op knop/rondje; bij mislukte telling (`catch → 0`) beschermen de regels. |
| Home-fallback | ✅ | `renderStructuurGrid`: domeinen falen → fout bubbelt (zoals voorheen); vermogens falen → "–", sr-tekst, hint, geen regels op kaarten. |
| Pictogramknoppen met `bezig: null` | ✅ | `zetBezig` vervangt tekst alleen `if (bezig)`; `null` omzeilt de default `'Bezig...'` (default geldt alleen bij `undefined`). Pictogram blijft staan. |
| Lege staten/toevoegknop verplaatsen | ✅ | `toevoegKnop` wordt vóór `innerHTML` naar `balk` verplaatst, of na de vervanging weer toegevoegd (referentie blijft geldig); geen verloren knop gevonden. |
| Verweesd vermogen | ✅ | Groep "Zonder geldig domein", zonder ↑/↓, wel bewerken/verwijderen; telt niet mee op Home. |
| Namen in beeld | ✅ | Overal `esc()`/`textContent`/`toonOk`. |

## Randgevallen
| Geval | Status | Detail |
|-------|--------|--------|
| Hoofdletter met accent ("Éénheid") | ✅ [T] | `sleutelVan()` in de regels compenseert `lower()` dat in de emulator alleen A–Z omzet. In productie is `lower()` mogelijk Unicode-bewust; dan zijn de `replace`-stappen een no-op. Moet in tst (scenario 5) bevestigd worden. |
| Hernoemen + verplaatsen in één schrijfactie door de emulator toegestaan | ℹ️ | Emulator telt de get-limiet mogelijk anders dan productie; app splitst toch in twee transacties. Geen actie. |
| `failed-precondition`/`already-exists` uit transactie | ✅ [C] | Omgezet naar `aborted` in `vermogens.js` r. 108-115. |
| Los naamdocument, domein weg/overkoepelend, verweesd vermogen | ✅ [T] | |
| Dubbele volgordenummers | ✅ [C] | Onschuldig; sortering op naam (`sorteerDomeinen`). |

## Bevindingen voor de bouwer (geen blokkades)

1. **Bouwverslag is verouderd (documentatie):** `.claude/reports/CK-020-bouwverslag.md`, afwijking 1 en "Instructies voor Paul" punt 3 en Status vragen nog om een beslissing over 58/63 en noemen "63 nieuwe vermogens". Besluit 22 en de bronlijst zeggen inmiddels 58. Bijwerken zodat Paul niet op een gesloten vraag wordt gewezen.
2. **`schrijfVolgorde('vermogens', …)` gebruikt de globale `huidigClubId`** (main.js r. 170-176), terwijl de rest van de vermogensacties de bij het openen vastgelegde `clubId` gebruikt (spec: "Leg club-id en refs vast bij de klik"). Alleen relevant bij een clubwissel midden in een actie; bouwer heeft dit zelf als bekend genoteerd (afwijking 3). Laag risico.
3. **Handmatig, geen code-bug:** `lower()`-gedrag in productie-Firestore (zie Randgevallen), CSS/breedtes, tooltips en toegankelijkheid zijn niet in deze fase te testen.

Geen enkel ❌ in functionaliteit gevonden.

## Toegevoegde tests (`tests/regels.test.mjs`, nieuw blok "aanvullend…")
1. Hernoemen rechtstreeks volgens protocol slaagt; hoofdletters-alleen zonder naamdocument.
2. Hernoemen naar naam van een ander vermogen of zonder naamdocument: geweigerd.
3. Update met extra veld / ongeldige naam / ongeldige volgorde geweigerd; alleen `volgorde` slaagt.
4. Verplaatsen rechtstreeks naar overkoepelend of niet-bestaand domein geweigerd (ook met kloppende tellers).
5. Verplaatsen rechtstreeks volgens protocol slaagt; twee vermogens met één tellerstap geweigerd.
6. Verwijderen rechtstreeks volgens protocol slaagt; teller onder 0 geweigerd.
7. Domein zonder tellerveld: bewerken/verwijderen als voorheen; ongeldig type/naam geweigerd.
8. Bestuursfuncties en clubprofiel: bestaande grenzen, niet-lid, onbekende collectie dicht.

## Eindoordeel
✅ Klaar voor beoordelaar (met handmatige tst-controle door Paul: scenario's 4, 5 (accenten in productie-`lower()`), 9–12, 14–18 en alle visuele/toegankelijkheidspunten).
