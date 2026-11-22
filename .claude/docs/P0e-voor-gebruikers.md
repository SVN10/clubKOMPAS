# P0e — Gebruikersdocumentatie: aparte testomgeving

Twee delen. Deel 1 is voor de clubgebruikers van HCA. Deel 2 is voor Paul als beheerder en product owner.

---

## Deel 1 — Voor clubgebruikers (HCA)

### Nieuw in clubKOMPAS
Voor jou verandert er niets. Je logt in zoals altijd. Je ziet dezelfde club, hetzelfde logo, dezelfde pijlers en domeinen. Onderaan staat nog steeds "Productie · Versie …". Er is geen nieuwe balk en geen nieuwe knop.

### Wat is er veranderd?
Niets in wat je ziet of doet. SVN10 heeft achter de schermen een aparte omgeving gekregen om nieuwe dingen uit te proberen. Daar staat alleen verzonnen data. Jullie clubgegevens blijven daar buiten.

### Wat moet ik anders doen?
Niets.

---

## Deel 2 — Voor Paul (beheerder en PO)

### Wat is de testomgeving?
Een tweede, losse kopie van clubKOMPAS met een eigen database en een eigen inlogomgeving. Daarin staat een fictieve club: "Testclub clubKOMPAS". Alles wat je daar doet, raakt de echte HCA-gegevens niet.

- **Test** (project `svn10-clubkompas-test`): hier probeer je dingen uit.
- **Productie** (project `svn10-clubkompas`): de live site met de echte HCA-data.

Let op: de testnaam begint met de naam van productie. Kijk dus altijd naar het stukje `-test` aan het eind.

Je testaccount en je gewone account zijn twee verschillende accounts in twee verschillende omgevingen. Je HCA-account werkt niet in test.

### Alleen fictieve data in test
Dit is de belangrijkste regel.
- Zet nooit echte namen, e-mailadressen, telefoonnummers of gegevens van (jeugd)leden in test.
- Kopieer nooit data van productie naar test.
- Gebruik geen echt HCA-account als testgebruiker. Een verzonnen of functioneel adres is goed, zoals `test-beheerder@svn10.nl`.
- Testdata maak je met de hand of met het seed-script. Dat vult de testclub met 6 bestuursfuncties en 15 domeinen.

### Hoe zie je waar je bent?
Op vier plekken staat het er.

| Waar | Test | Productie (lokaal, bewust) | Live site |
|---|---|---|---|
| Balk bovenaan | Donkere balk "Testomgeving" | Oranje balk "Let op: echte clubdata" | Geen balk |
| Footer onderaan | "Test · Versie …" | "Productie (lokaal) · Versie …" in een oranje vlak | "Productie · Versie …" |
| Tabtitel in je browser | Begint met een voorvoegsel voor Test | Begint met een voorvoegsel voor Productie (lokaal) | "clubKOMPAS" |
| Eerste regel in de terminal bij een script | `DOEL: TEST — project svn10-clubkompas-test` | `DOEL: PRODUCTIE — project svn10-clubkompas (echte clubdata)` | niet van toepassing |

Ook de clubnaam op Home helpt: in test staat daar "Testclub clubKOMPAS". Bij `npm run regels:test` en `npm run regels:productie` staat eerst een regel `REGELS NAAR: TEST` of `REGELS NAAR: PRODUCTIE`.

Zie je oranje? Dan zit je op echte clubdata. Doe alleen wat je bewust wilt doen.

### Dagelijks werken

| Wat je wilt | Wat je typt | Waar het naartoe gaat |
|---|---|---|
| De app lokaal starten | `npm run dev` | Test |
| De app lokaal op de echte data (alleen bewust, bijvoorbeeld om een melding van een HCA-gebruiker na te spelen) | `npm run dev:productie` | Productie |
| Een script draaien | `node scripts/<naam>.mjs` | Test (standaard) |
| Een script op de echte data | `node scripts/<naam>.mjs --omgeving=productie` | Productie, pas na het intypen van `svn10-clubkompas` |
| Alleen kijken wat een script zou doen | `--droog` erbij | Er wordt niets geschreven |

Het seed-script (`seed-testclub.mjs`) draait nooit tegen productie, ook niet met bevestiging.

Je typt zelf het wachtwoord in als een script erom vraagt. Je ziet dan niets op het scherm. Dat is normaal.

### De vaste werkvolgorde: eerst test, dan productie
1. Probeer het nieuwe eerst uit in test (`npm run dev`, inloggen met je testaccount).
2. Bij nieuwe beveiligingsregels: `npm run regels:test`. Controleer daarna in de app en in de Rules Playground van de **testconsole**.
3. Werkt alles zoals bedoeld? Pas dan naar productie: `npm run regels:productie`. Je krijgt de vraag of je eerst in test hebt gecontroleerd. Typ `svn10-clubkompas` om door te gaan. Typ je iets anders, dan stopt het en is er niets gepubliceerd.
4. Controleer daarna in de productieconsole of de publicatietijd klopt.

Experimenteer niet meer in de productieconsole. Dat ging in het verleden al een keer mis.

Werkt het commando voor regels niet? Plak de inhoud van `firestore.rules` in de console. Eerst in test, dan in productie.

### Wat betekenen de meldingen en wat doe je dan?
Elke melding zegt wat er aan de hand is. Er staat ook bij dat er niets is opgeslagen of gepubliceerd. Je kunt dus rustig lezen.

**In de app (in plaats van het inlogscherm)**

| Melding | Wat het betekent | Wat je doet |
|---|---|---|
| "Geen verbinding ingesteld" | Het bestand met de testinstellingen ontbreekt of is leeg. | Zet de zes waarden van het testproject in `.env.test.local` (stappen in de README, onder "Omgevingen"). Start `npm run dev` opnieuw. |
| "Gestopt: deze lokale app wijst naar de echte clubdata" | Er staat nog een oud bestand `.env` met productiewaarden. De app heeft zichzelf tegengehouden. | Verwijder `.env` (pas als de test-app werkt), controleer `.env.test.local` en start opnieuw. Wil je bewust op productie werken? Gebruik `npm run dev:productie`. |
| "Gestopt: de configuratie is onvolledig of gemengd" | Er mist een waarde in `.env.test.local`, of de waarden horen bij verschillende projecten. | Vul alle zes waarden van het testproject in en start opnieuw. |
| Inloggen mislukt, met de hint over de testomgeving | Je gebruikte waarschijnlijk je gewone account. | Log in met je testaccount. |
| "Geen club gekoppeld" (in test met een extra regel) | Je testaccount is nog niet aan de testclub gekoppeld. | Controleer in de testconsole of `gebruikers/<uid>` bestaat met het veld `clubId`, en of `clubs/<clubId>/leden/<uid>` bestaat. |

**In de terminal (scripts)**

| Melding | Wat het betekent | Wat je doet |
|---|---|---|
| "het bestand .env.test.local ontbreekt" | Het script weet niet welk project het moet gebruiken. | Maak het bestand aan (README, stap 2). |
| "je koos TEST, maar .env.test.local wijst naar het productieproject" | Er staan productiewaarden in het testbestand. | Zet de waarden van het testproject erin. |
| "het voorbeeldbestand is ingevuld" | Je hebt waarden in `.env.test.local.voorbeeld` gezet. Dat bestand moet leeg blijven. | Verplaats de waarden naar `.env.test.local` en maak het voorbeeld weer leeg. |
| "onbekende omgeving" of meer dan één `--omgeving=` | Typfout. | Kies `--omgeving=test` of `--omgeving=productie`. |
| "AFGEBROKEN: de projectnaam klopte niet" | Je typte bij de productievraag iets anders dan `svn10-clubkompas`. | Niets aan de hand. Begin opnieuw als je echt naar productie wilt. |
| "het seed-script draait nooit tegen productie" | Je gaf `--omgeving=productie` mee bij het seed-script. | Laat `--omgeving` weg. |
| "geen document gebruikers/<uid> met een clubId" | Je testgebruiker is niet (helemaal) gekoppeld. | Maak de koppeling aan in de testconsole (README, stap 6). |
| "Firestore weigert het schrijven" | Meestal staan de regels nog niet in test, of je testgebruiker is geen beheerder. | Draai `npm run regels:test`. Controleer daarna de rol `beheerder` bij `clubs/<clubId>/leden/<uid>`. |
| "Inloggen mislukt" in een script | Verkeerd e-mailadres of wachtwoord, of je gebruikt je gewone account. | Gebruik je testaccount. |
| "je bent op deze computer nog niet ingelogd bij Firebase" | Je bent nog niet ingelogd bij de Firebase-opdrachtregel. | Draai eenmalig `npx firebase login`. |
| "het Google-account heeft geen toegang tot dit project" | Je bent met een ander Google-account ingelogd. | Kijk met `npx firebase login:list` welk account het is. Wissel met `npx firebase logout` en `npx firebase login`. |
| "LET OP: er staat nog een bestand .env" | Waarschuwing. Het script gaat gewoon door. | Verwijder `.env` zodra je test-app werkt. |

### Wat je zelf nog moet doen
De eenmalige inrichting staat in de README onder "Omgevingen (test en productie)", stappen 1 tot en met 10. Kort samengevat:
1. Waarden van het testproject in `.env.test.local` zetten (kopieer het voorbeeldbestand).
2. Inloggen met e-mail/wachtwoord aanzetten en de database in dezelfde regio als productie maken.
3. `npx firebase login` en `npm run regels:test`.
4. Testgebruiker en de testclub koppelen in de testconsole.
5. Het seed-script draaien (eerst met `--droog`).
6. `npm run dev` en controleren: balk "Testomgeving", 15 domeinen, footer "Test".
7. Pas dan de oude `.env` verwijderen.
8. In Vercel alleen kijken (niets wijzigen) of `VITE_OMGEVING=Productie` en de zes Firebase-waarden er staan, en bij welke omgevingen. Staan ze ook bij Preview, noteer dat.

Zolang dit niet klaar is, toont `npm run dev` de melding over de echte clubdata. Dat is de bedoeling: de app beschermt je.

---

## Status
Klaar voor beoordelaar
