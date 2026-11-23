# Controle CK-021 De plaat (route middel, één ronde)

Basis: `git diff` van src/main.js en src/style.css, spec CK-021, `npm run build` (geslaagd, alleen bekende chunk-waarschuwing). `test:regels` niet gedraaid (geen regelwijziging).

## Oordeel: klaar voor test op tst. Geen bevindingen hoog of middel.

## 1. Spec en acceptatiecriteria (code-controle)
- Menu: `vermogens` (pictogram `tegels`) onder Home, `vermogensbeheer` heet "Vermogens beheren", NAV_DOEL aangevuld. Kruimelpad en titel via `navNaam`. OK.
- Home: kerncijfer is `a.cijfer.cijfer-link[data-nav]`, `#cijfer-vermogens` blijft staan; de bestaande data-nav-handler (main.js r. 1329) doet preventDefault. Andere drie cijfers blijven div. OK.
- Plaat: drie parallelle leesacties, bestuursfuncties via allSettled met statusmelding en zonder eindverantwoordelijke-regel; laadfout met Opnieuw laden, focus volgens afspraak, testhint bij permission-denied; isConnected-controles; clubId vastgelegd. Lege toestanden, voetnoot voor verweesde vermogens en lege secties (niet getekend) kloppen met de spec.
- Alleen leesacties; geen schrijfacties, geen links naar beheer op de plaat.

## 2. Huisstijl
Alleen tokens (--card, --border, --petrol, --orange, --muted, --surface, --text, --fs-*). Geen losse kleuren. Container query op #plaat zoals gespecificeerd.

## 3. Toegankelijkheid
- Eén h1; h2 per sectie; h3 per domein; domeinen en vermogens als `ul role="list"`; geen section/aria-label, dus geen extra landmarks. OK.
- Lege toestand als h2: juist (h1 > h3 zou een niveau overslaan). Afwijking akkoord. CSS `.leeg-blok h2` toegevoegd naast bestaande h3-regel. OK.
- `.cijfer-link` focusring oranje met donkere buitenring, gelijk aan `.btn`/`.kruimel`. Afwijking akkoord (zichtbaar in beide thema's).
- Pijl in Home-link `aria-hidden`; toegankelijke naam "58 Vermogens" / "wordt geladen Vermogens". OK.
- Hashtag niet op overkoepelende kaarten: akkoord (de spec toont die kaart ook zonder hashtag).

## 4. Beveiliging
Alle Firestore-waarden (naam, hashtag, omschrijving, functienaam, vermogensnaam) lopen via `esc()`. De overige innerHTML-delen zijn vaste teksten of aantallen. `plaatSectieHTML` zet `kop`/`toel` ongeëscaped in, maar die zijn vaste strings of uit `vermogensTekst(n)`. Geen nieuwe schrijfacties, geen wijziging in firestore.rules.

## Bevindingen
- Laag: `plaatSectieHTML` escapet `kop` en `toel` niet. Nu veilig; bij hergebruik met data zou dat mis kunnen gaan. Optioneel een opmerking in de code.
- Laag: bij een geslaagde herlaad na fout blijft `#plaat-hint` leeg en verdwijnt de melding. Dat is correct. Niets te doen.
- Niet getest (geen browser): lay-out, 18px-leesbaarheid van `tegels`, tooltip ingeklapt menu, contrast in donker thema.

## Testlijst voor Paul op tst (8 punten)
1. Menu: Vermogens staat onder Home met het raster-pictogram; alleen dat item is actief op de plaat. Ingeklapt menu: pictogram leesbaar, tooltip "Vermogens".
2. Plaat met HCA-data: 3 pijlerkolommen (13 vermogens), 10 ondersteunende domeinen (45), Projecten en Samenwerkingen met omschrijving en "Voorzitter"; eindverantwoordelijken kloppen met de bron; volgorde gelijk aan Vermogens beheren.
3. Home: alleen Vermogens is klikbaar (muis en Enter), met hover en focusring; het totaal op Home is gelijk aan 13 + 45.
4. Beheer: menu, kruimelpad (Home > Beheer > Vermogens beheren), tabtitel en kop heten "Vermogens beheren"; doorklikken vanaf Domeinen werkt nog.
5. Lege en afwijkende toestanden: domein zonder vermogens ("Nog geen vermogens"), verweesd vermogen (voetnoot), namen met & ' ( ) correct.
6. Laadfout: offline openen, melding met Opnieuw laden, na herstel werkt het en de focus staat goed.
7. Lay-out: 1200px (menu open en dicht), 768px, 375px (één kolom, geen horizontale scroll), licht en donker thema; lange namen breken netjes af.
8. Toegankelijkheidsboom of schermlezer: één h1, koppen h1 > h2 > h3, lijsten, geen extra regio's.
