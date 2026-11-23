# App-brede functionele test clubKOMPAS v0.12.1

Branch `test`, commit 01067b1. Methode: code en specs naast elkaar gelegd. Geen browser, geen emulator, geen Firestore-toegang.
Niet opnieuw gedraaid: `npm run build` (slaagt, bundel 659 kB) en `npm run test:regels` (100 van 100).
Bekend en geaccepteerd, niet meegeteld: P0d (geen `isBeheerder` in de regels, geen bestaanscontrole op `bestuursfunctieId`).

## Oordeel

De code doet wat de specs zeggen. Ik vond geen kritieke fout en geen afwijking van een acceptatiecriterium die de gebruiker direct schaadt.
De zwakke plek is foutafhandeling bij het laden: op twee beheerpagina's en op het Domeinenoverzicht zie je bij een Firestore-fout niets of een dode pagina. Verder ontbreken tests voor de veiligheidslogica van de omgeving (P0f) en voor een deel van de P0c-regels.

Aantallen: kritiek 0, hoog 1, middel 5, laag 14.

## Tabel per feature

Legenda: ✅ klopt met de code, ❌ wijkt af, ⚠ niet te controleren zonder browser of console.

| Feature | Oordeel | Opmerking |
|---|---|---|
| P0c Club loskoppelen | ✅ | `clubId` komt uit `gebruikers/{uid}` (main.js:244). Nergens wordt `uid` als clubId gebruikt. Geen club of geen lid geeft het geen-club-scherm zonder reads op `clubs/` (main.js:261-283). Regels staan in `firestore.rules`. ⚠ "Identiek aan de console" en de migratie zelf zijn niet te controleren. Regeltests voor `gebruikers`, `leden` en schrijven op `clubs/{id}` ontbreken (zie M4). |
| P0e Testomgeving | ✅ | Scripts kiezen standaard test. Productie vraagt het intypen van de projectnaam (scripts/lib/omgeving.mjs). `regels:test` en `regels:productie` bestaan. ⚠ Echte runs niet gedaan. |
| P0f Adressen | ✅ | `SOORT` en `configFout` in firebase.js volgen de tabel in de spec. Op Vercel Production start de app altijd. Een preview met productieproject stopt. Login vangt `unauthorized-domain` en `requests-from-referer` af (main.js:703). Productie toont geen balk (besluit 23-11). ⚠ Vercel-variabelen, DNS en authorized domains zijn handmatig. De logica heeft geen test (M4). |
| CK-020 Vermogens beheren | ✅ | Transacties voor naam, domein en teller (vermogens.js). Domeinblokkade en melding met knop. Home toont "n vermogens". Filter, ↑/↓ binnen het domein, verweesde vermogens apart. Regeltests dekken dit breed. ⚠ Lay-out 2x2, scripts-runs. |
| CK-021 De plaat | ✅ | Kruimelpad, lege staten, voetnoot, laadfout met "Opnieuw laden" en testhint (main.js:1055). Bestuursfuncties mislukt: plaat toch zichtbaar met hint. Afwijking van het oude criterium "geen links naar beheer": de kerncijfers zijn nu links, dat is besluit 26 van CK-046. ⚠ Lay-out en thema. |
| CK-023 Meldingen opslaan | ⚠ deels ❌ | Eén helper `metOpslaan` met offline, time-out, `aria-disabled` tegen dubbelklik, atomaire volgorde via `writeBatch`. ❌ Het inlogscherm toont nog `Fout: <code>` (M5). ⚠ Offline-test, contrast. |
| CK-044 Zijmenu | ✅ | Menu als data, `aria-current`, paneel met `inert`, Esc, focus terug naar ☰, localStorage `zijmenu-ingeklapt`, standaard uitgeklapt. Afwijkingen zijn besluiten van Paul (omgevingsbalk onderaan, naam zonder rol). ⚠ Logo-overlap, VoiceOver. |
| CK-046 Projecten en samenwerkingen | ✅ | Velden, status, periode, naam uniek (app), filter, ↑/↓ alleen zonder filter, plaatkaartjes met stippellijn, lege tekst "Er zijn geen projecten.", laadfout toont domeinomschrijving (besluit 17). `bevat` zit niet in het domeinformulier (besluit 15, bewust). ⚠ Lay-out. |
| CK-041 Commissies | ✅ | Menu na Bestuursfuncties met pictogram `groep`. Velden naam, omschrijving, eigenaar. Niet op de plaat (`PLAAT_SOORTEN`). Bestuursfuncties telt commissies in kolom en verwijderblokkade (main.js:2759-2775, 2893-2907). Regels `geldigeSamenwerking`, `bevat` kan niet op commissies. 6 regeltests. ⚠ Testlijst van CK-041.md punt 10 en 11 (lay-out, schermlezer). |

## Bevindingen

### Kritiek
Geen.

### Hoog

**H1. Laadfout op Domeinen en Bestuursfuncties geeft een lege of dode pagina, zonder melding.**
- `src/main.js:1431` (`renderPijlersDomeinenBeheer`): `await laadBestuursfuncties()` staat vóór het tekenen en heeft geen `try/catch`. Bij een fout blijft de vorige pagina staan en er gebeurt niets zichtbaars (de `navigeer`-belofte wordt afgewezen).
- `src/main.js:1558`: `await laadEnRender()` zonder vangnet. Bij een fout blijft `#structuur-lijst` leeg. De luisteraars voor filter, toevoegen en rijacties worden daarna niet gekoppeld, dus "+ Domein toevoegen" doet niets.
- `src/main.js:2813` (Bestuursfuncties): hetzelfde, `laadVerwijzers()` gooit bij een fout in domeinen, en daarna ontbreken alle luisteraars.
- Vermogens en de onderdelenpagina's (Projecten, Samenwerkingen, Commissies) doen dit wel goed: melding met "Opnieuw laden" en testhint (main.js:2019, 2486).

### Middel

**M1. Domeinenoverzicht: bij een fout in de domeinen blijft de pagina leeg.**
`main.js:593` gooit, `main.js:988` roept `renderStructuurGrid()` aan zonder `await` of `catch`. Gevolg: onbehandelde afwijzing, kerncijfers blijven "–", geen melding.

**M2. Regels controleren de velden van domeinen, bestuursfuncties en profiel niet.**
`firestore.rules` rond `structuurelementen` (create en update) en `bestuursfuncties`: geen `hasOnly`, geen controle op type of lengte van `omschrijving`, `hashtag`, `icoon`, `bestuursfunctieId`, `volgorde`. `instellingen/profiel`: alleen `logo` wordt gecontroleerd, `naam`, `afkorting` en `seizoen` niet. Een lid (of een script) kan dus willekeurige velden of zeer lange tekst schrijven. Projecten, samenwerkingen en commissies zijn wel streng. Dit staat los van de geaccepteerde P0d-punten.

**M3. Domeinnaam heeft in de app geen maximum, de regels wel (200).**
`main.js:1647` en de bewerkvariant gebruiken `minFout(naam, 2)`. Een naam langer dan 200 tekens geeft `permission-denied` en dus de tekst "Je hebt geen toestemming om dit op te slaan". Misleidend. Bestuursfuncties en onderdelen controleren de lengte wel.

**M4. Testdekking: belangrijke stukken zijn niet gedekt (zie sectie Testdekking).**
Het zwaarst: de omgevingsguard in `src/firebase.js` (voorkomt dat een test-build productiedata raakt) en de P0c-regels voor `gebruikers`, `leden` en schrijven op `clubs/{id}`.

**M5. Login toont een ruwe foutcode.**
`main.js:707`: bij elke onbekende fout, bijvoorbeeld `auth/network-request-failed`, staat er `Fout: auth/network-request-failed` (of `Fout: undefined`). Dat botst met het CK-023-criterium "geen technische codes in beeld". Er is ook geen aparte verbindingsmelding bij inloggen.

### Laag

**Dode code**
- L1. `src/counter.js` wordt nergens geïmporteerd (Vite-sjabloon). Ook ongebruikt: `src/assets/hero.png`, `javascript.svg`, `vite.svg` en `public/icons.svg`.
- L2. `src/main.js:13`: import `sorteerOnderdelen` wordt niet gebruikt.
- L3. `huidigeRol` (main.js:20, 264, 273) en `laadRol` (main.js:251) worden alleen gevuld, nergens gelezen. Elke login doet er een extra Firestore-read voor. Past bij P0d, maar nu overbodig.
- L4. CSS-selectors zonder gebruik: `.structuur-rij-info` (style.css:469), `.picto-groot` (485), `.volgorde-nr` (488), `.functie-label` (500), `.cel-domein` (1116), `.sectie-voet` (1128). CK-044 vroeg om geen dode CSS.
- L5. `toonOmgevingsBalk()` (main.js:864-870) zet in productie toch de klasse `met-omgeving-balk` op `body`, terwijl er geen balk is. Het effect is alleen een flex-lay-out op het inlogscherm, maar het hoort niet.
- L6. Vaste voorwaarden op een constante: `SUPPORT_EMAIL &&` (main.js:375) en `SUPPORT_EMAIL ?` (main.js:1837). De constante is nooit leeg.

**Dubbele code**
- L7. `sorteerDomeinen` (main.js:136) en `sorteerOnderdelen` (onderdelen.js:107) doen hetzelfde.
- L8. `hoogsteVolgorde` bestaat drie keer: onderdelen.js:112, vermogens.js:87 (andere parameters, zelfde naam) en inline in main.js voor domeinen en bestuursfuncties.
- L9. De ↑/↓-, verwijder- en laad-en-teken-logica staat vier keer in main.js (Domeinen, Vermogens, Onderdelen, Bestuursfuncties), telkens iets anders. Bron van de verschillen hieronder. Ook de opsomming "a, b en c" staat drie keer (`opsomming` in vermogens.js, `enLijst` main.js:2780, inline bij voetnoot).

**Inconsistenties tussen de beheertabellen**
- L10. Naamregels: Vermogens en onderdelen hebben tekenset en normalisatie (spaties, NFC). Bestuursfuncties en Domeinen alleen een lengte (main.js:2832, 1647). Bestuursfuncties vergelijken dubbele namen zonder normalisatie (main.js:2851). Domeinen controleren niet op een dubbele naam.
- L11. Enter in het naamveld slaat op bij Vermogens en onderdelen (main.js:2100, 2556), niet bij Domeinen en Bestuursfuncties.
- L12. Als een rij intussen weg is: onderdelen melden "bestaat niet meer" (main.js:2655). Bij ↑/↓ op Domeinen en Bestuursfuncties gebeurt stil niets (main.js:1689, 2875). "Bewerken" op Bestuursfuncties leest opnieuw zonder vangnet (main.js:2917).
- L13. Teksten: `dubbele-naam` heeft geen punt (main.js:324). De labels van de pijlknoppen verschillen: "Omhoog: X" (Domeinen, Vermogens, Bestuursfuncties) tegenover "X omhoog" (onderdelen). Lege lijst bij Domeinen zonder filter zegt "Geen domeinen van deze soort." (main.js:1516), terwijl er helemaal geen domeinen zijn; Bestuursfuncties geven alleen een zin, onderdelen een blok met uitleg.
- L14. Kerncijfer Projecten op de plaat telt alleen lopend en in voorbereiding, maar linkt naar beheer waar ook afgeronde staan. Het kerncijfer Vermogens op het Domeinenoverzicht linkt naar de plaat (`data-nav="vermogens"`), besluit 26 zegt "doorklikbaar naar beheer". ⚠ Dit kan bedoeld zijn, graag bevestigen.

**Overig (laag, geen actie nodig tenzij gewenst)**
- Uniekheid van namen en `volgorde` zijn "eerst lezen, dan schrijven" (onderdelen.js:130, main.js `controleerDubbel`). Twee gebruikers tegelijk kunnen een dubbele naam of gelijke volgorde maken. Dit is besluit 14 van CK-046 (alleen de app controleert) en het sorteren op naam vangt gelijke volgorde op.
- `failed-precondition` wordt overal als "bestaat niet meer" getoond (main.js:300, 315). Voor een ontbrekende index zou dat misleidend zijn.
- `auth/user-not-found` verraadt of een account bestaat (main.js:697). Firebase stuurt meestal `invalid-credential`, dus theoretisch.
- Lettertype komt via `@import` van Google Fonts (style.css:1): IP-adres naar Google, en een externe afhankelijkheid.
- Bundel 659 kB in één `main.js` van 3274 regels. Splitsen per pagina zou helpen, geen haast.
- Scriptnamen `test:regels` (emulator) en `regels:test` (publiceren naar test) lijken sterk op elkaar en zijn makkelijk te verwisselen.
- Na een time-out (15 s) loopt de schrijfactie in Firestore door. De melding waarschuwt hiervoor; een nieuwe poging kan toch een dubbel item geven.

## Foutafhandeling bij Firestore-fouten (samenvatting)

| Plek | Bij laadfout | Bij schrijffout |
|---|---|---|
| Inloggen en club laden | ✅ foutkaart met "Opnieuw proberen", geen-club bij `permission-denied` | n.v.t. |
| Plaat | ✅ melding + opnieuw laden; deelfouten als hint | n.v.t. |
| Vermogens | ✅ melding + opnieuw laden | ✅ `metOpslaan` |
| Projecten, Samenwerkingen, Commissies | ✅ melding + opnieuw laden | ✅ |
| Domeinen | ❌ leeg, dode knoppen (H1) | ✅ |
| Bestuursfuncties | ❌ leeg, dode knoppen (H1) | ✅ |
| Domeinenoverzicht | ❌ leeg, geen melding (M1) | n.v.t. |
| Club en Mijn account | n.v.t. (data al geladen) | ✅ |

## Lege toestanden

- ✅ Onderdelen (incl. Commissies): "Nog geen commissies" met uitleg, filter zonder treffers.
- ✅ Vermogens: geen domeinen, geen vermogens, verweesde vermogens, per domein "Nog geen vermogens".
- ✅ Plaat: geen domeinen, geen vermogens, blok zonder items.
- ⚠ Domeinen zonder domeinen: zin klopt niet helemaal (L13). Bestuursfuncties: "Nog geen bestuursfuncties." (ok).

## Testdekking (`tests/regels.test.mjs`, 100 tests, alleen Firestore-regels en modellaag)

Goed gedekt: vermogens (transacties, namen, tellers, races, aanvallen), onderdelen en commissies (velden, grenzen, niet-lid), inrichtscript, bevat.

Niet gedekt:
1. `src/firebase.js`: `SOORT`, `configFout`, productie-guard. Pure logica, makkelijk te testen, en dit is de veiligheidslaag van P0e/P0f.
2. P0c-regels: lezen van `gebruikers/{andere uid}` moet falen, schrijven op `gebruikers`, `leden` en `clubs/{id}` moet falen, lezen van `clubs/{id}` door niet-lid. In de test komt alleen de opzet voor (regel 68-70).
3. Regels voor `structuurelementen` en `bestuursfuncties`: alleen type, naam en teller zijn getest. Wat de regels niet controleren (M2) staat dus ook niet vast.
4. Alles in `main.js`: `foutTekst` en `WEG_CODES`, `metOpslaan`, de telling en blokkade bij bestuursfuncties verwijderen, de plaat-filters (`OP_PLAAT`, `bevat`), de lege toestanden. Geen enkele UI- of eenheidstest.
5. Uniekheid van namen in de app en samenloop van twee tabbladen bij onderdelen (alleen voor vermogens getest).
6. `src/keuzelijst.js` (eigen keuzelijst en datumkiezer, 420 regels): geen tests.
7. De scripts voor de omgevingskeuze (`scripts/lib/omgeving.mjs`) hebben alleen de test van `veilig()`.

## Wat ik niet kon controleren (⚠)

Lay-out op 1200, 768 en 375 px, licht en donker, contrast, VoiceOver en toetsenbordvolgorde, offline-gedrag in DevTools, het logo-overlappen, de echte inhoud van de gepubliceerde regels in test en productie, Vercel en DNS (P0f stap 1-7), de run van de inrichtscripts, de migratie van P0c.

## Voorstel: wat eerst

1. **H1 en M1 samen oplossen** (één kleine ronde): dezelfde laadfout-aanpak als Vermogens op Domeinen, Bestuursfuncties en Domeinenoverzicht (`try/catch`, melding met "Opnieuw laden", luisteraars pas koppelen als er iets te tonen is). Eventueel `renderStructuurGrid` en de eerste `await laadEnRender()` omhullen.
2. **M4 punt 1 en 2**: tests voor `firebase.js` (haal de logica in een pure functie) en de P0c-regels. Dit is goedkoop en beschermt productiedata.
3. **M5 en M3**: foutmelding bij inloggen zonder code, en een lengtecontrole bij domeinnamen.
4. **M2**: veldcontrole in de regels voor domeinen, bestuursfuncties en profiel, samen met de regeltests. Hoort bij de eerstvolgende regelronde, vóór P0d.
5. **Opruimen** (L1-L6) in één commit: `counter.js`, `src/assets`, `public/icons.svg`, ongebruikte import, `huidigeRol`, dode CSS.
6. **Gedeelde helper** voor beheertabellen (L7-L13) pas als er een nieuwe tabel bijkomt of bij P0d; nu gaat het om kleine verschillen.
