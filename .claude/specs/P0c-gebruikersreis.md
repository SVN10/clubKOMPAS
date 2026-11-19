# Gebruikersreis: P0c — Club loskoppelen van gebruiker

Gebaseerd op `P0c-club-loskoppelen.md`, inclusief de Besluiten PO van 19 november 2026.

## Gebruiker
Er zijn drie soorten gebruikers:

- **De bestaande HCA-bestuurder.** Gebruikt clubKOMPAS al en beheert het clubprofiel, het logo en de pijlers en domeinen van Hockey Club Alphen. Wil gewoon verder werken. Merkt idealiter niets van de verandering.
- **Een tweede HCA-bestuurder.** SVN10 heeft een account voor hem of haar aangemaakt en aan HCA gekoppeld. Diegene heeft een e-mailadres en een tijdelijk wachtwoord gekregen en opent clubKOMPAS voor het eerst. Wil direct de eigen club zien en kunnen meewerken.
- **Iemand met een account maar zonder club.** Bijvoorbeeld een account dat SVN10 nog niet heeft gekoppeld, of iemand die zichzelf heeft geregistreerd zolang dat nog kan. Moet snel begrijpen waarom er niets te zien is en wat de volgende stap is.

Alle drie zijn clubmedewerkers zonder technische achtergrond. Woorden als "tenant", "clubId", "Firestore" of "rechten" mogen ze nergens tegenkomen.

## Huidige situatie
- Elk account heeft nu precies één eigen "club". Achter de schermen hangt die aan het account zelf. Een tweede bestuurder kan dus niet met dezelfde clubgegevens werken: met een eigen account krijgt die een lege club en ziet die "Nog geen pijlers of domeinen".
- Na het inloggen gaat de app meteen naar het dashboard. Mislukt het ophalen van de gegevens (bijvoorbeeld geen internet), dan krijgt de gebruiker geen melding. Het scherm blijft hangen of toont een half dashboard.
- Er is geen scherm voor "je hebt wel een account, maar geen club".
- Bij het herladen van de pagina met een actieve sessie ziet de gebruiker kort een leeg scherm voordat het dashboard verschijnt.

## Gedeelde bouwsteen: de tussenkaart
Drie nieuwe toestanden gebruiken dezelfde kaart als het inlogscherm (`.inlog-wrap` / `.inlog-kaart`, kompas-icoon met "clubKOMPAS" erboven): **laden**, **geen club** en **fout**. Daarmee blijft het herkenbaar en bestaat er voor de gebruiker maar één soort tussenscherm: rustig, gecentreerd, zonder top-bar, top-nav of footer.

Het supportadres staat als één constante in de code (PO-besluit 2). In de teksten hieronder heet het `{supportadres}`.

---

## Reis 1: bestaande HCA-bestuurder logt in na de migratie
Doel: het moet voelen alsof er niets veranderd is.

### Stap 1: inloggen
**Situatie:** de bestuurder opent clubKOMPAS en ziet het bekende inlogscherm.
**Actie:** vult e-mailadres en wachtwoord in en klikt op "Inloggen" (of drukt op Enter).
**Resultaat:** de knop toont "Bezig..." en is even niet klikbaar, zoals nu.

### Stap 2: club ophalen
**Situatie:** het inloggen is gelukt. De app zoekt op bij welke club deze bestuurder hoort en haalt het clubprofiel op.
**Actie:** geen, de gebruiker wacht.
**Resultaat:**
- Duurt het kort (de normale situatie), dan ziet de gebruiker niets nieuws: het inlogscherm met "Bezig..." gaat direct over in het dashboard.
- Duurt het langer dan ongeveer een halve seconde (trage verbinding, of de pagina wordt herladen terwijl de gebruiker al ingelogd is), dan verschijnt de laadkaart:
  - Kompas-icoon en "clubKOMPAS"
  - Tekst: **"Je club wordt geladen..."**
  - Geen knoppen.

### Stap 3: dashboard
**Situatie:** de club is gevonden.
**Actie:** geen.
**Resultaat:** het dashboard ziet er precies hetzelfde uit als vóór de migratie:
- Top-bar met "clubKOMPAS · Hockey Club Alphen" en het clublogo, en het logo als browser-icoon
- Sectiekop met clubnaam en "Seizoen 2026–2027" (of wat er is ingevuld)
- Cijfers voor pijlers en domeinen, en de kaarten in "Pijlers & Domeinen"
- Footer met naam of e-mailadres van de bestuurder en "Uitloggen"

### Stap 4: gewoon verder werken
**Situatie:** de bestuurder werkt zoals altijd.
**Actie:** voegt een domein toe, bewerkt een pijler of past het seizoen aan bij Instellingen.
**Resultaat:** alles werkt en wordt bewaard zoals nu. Na het herladen staan de wijzigingen er nog.

### Pijnpunten en randgevallen reis 1
- **Tabblad stond al open tijdens de migratie.** Een tabblad met de oude versie van de app kan na het publiceren van de nieuwe regels niet meer opslaan. Op dit moment geeft opslaan bij Pijlers & Domeinen dan geen foutmelding: de wijziging lijkt gelukt, maar verdwijnt. *Oplossing:* buiten de app. SVN10 vraagt de HCA-bestuurder(s) vooraf om uit te loggen en na de migratie de pagina te herladen, en migreert op een rustig moment (dat staat al in de spec). Zie ook vraag 3 voor de PO.
- **"Mijn data is weg"-gevoel.** Als de club gevonden wordt maar het profiel of de pijlers ontbreken (bijvoorbeeld door een mislukte kopie), ziet de bestuurder de standaardtitel "Verenigingsbeheer voor sportclubs" en "Nog geen pijlers of domeinen". Dat is het engste wat de gebruiker in deze story kan overkomen. *Oplossing:* de controlestap in het migratiescript en de rookproef (stap 4 van de migratie) moeten dit opvangen voordat de bestuurder inlogt. In de app verandert hier niets aan.
- **Extra wachttijd.** Na het inloggen haalt de app één gegeven extra op. Normaal merk je daar niets van. De laadkaart verschijnt pas na een korte vertraging, zodat hij bij een snelle verbinding niet even flitst.
- **Favicon en logo.** Die moeten al in beeld zijn op het moment dat het dashboard verschijnt, en niet een tel later. Daarom eerst het profiel laden en dan pas het dashboard tonen (zoals nu).

---

## Reis 2: tweede bestuurder logt voor het eerst in
Doel: met een eigen account dezelfde HCA-gegevens zien en bewerken.

### Stap 0: buiten de app
**Situatie:** SVN10 heeft het account aangemaakt en aan HCA gekoppeld volgens de README-procedure. De bestuurder heeft van SVN10 (per mail of telefoon) een e-mailadres, een tijdelijk wachtwoord en de link naar clubKOMPAS gekregen.
**Actie:** opent de link.
**Resultaat:** ziet het inlogscherm.

### Stap 1: inloggen met het tijdelijke wachtwoord
**Situatie:** inlogscherm.
**Actie:** vult e-mailadres en tijdelijk wachtwoord in en klikt op "Inloggen".
**Resultaat:** "Bezig...", eventueel gevolgd door de laadkaart "Je club wordt geladen...". Daarna verschijnt het HCA-dashboard met dezelfde naam, hetzelfde logo, seizoen en dezelfde pijlers en domeinen als de eerste bestuurder ziet.

### Stap 2: herkennen dat het klopt
**Situatie:** dashboard.
**Actie:** kijkt rond.
**Resultaat:** rechtsonder in de footer staat het eigen e-mailadres (er is nog geen naam ingesteld). Zo ziet de bestuurder: "dit is mijn account, en dit is mijn club."

### Stap 3: eigen wachtwoord en naam instellen (aanbevolen)
**Situatie:** dashboard.
**Actie:** klikt op "Instellingen" en vult onder "Gebruiker" een naam in ("Naam opslaan"). Vult daarna het huidige (tijdelijke) en een nieuw wachtwoord in en klikt op "Wachtwoord wijzigen".
**Resultaat:** de bekende meldingen "✓ Naam opgeslagen." en "✓ Wachtwoord gewijzigd." verschijnen. In de footer staat nu de naam.

### Stap 4: meewerken
**Situatie:** de bestuurder werkt met de clubgegevens.
**Actie:** voegt een pijler toe.
**Resultaat:** de pijler verschijnt in de lijst. Als de eerste bestuurder daarna de pagina herlaadt, ziet die de nieuwe pijler ook.

### Pijnpunten en randgevallen reis 2
- **Koppeling half gelukt.** SVN10 maakt de koppeling met de hand in twee stappen aan. Is maar één van de twee gelukt, of staat er een typfout in de clubcode, dan ziet de bestuurder het geen-club-scherm (reis 3) en geen foutmelding en geen leeg dashboard. Dat is bewust zo: voor de gebruiker is het één situatie ("je hebt nog geen toegang"). Voor SVN10 is het een signaal om de koppeling na te lopen.
- **Tijdelijk wachtwoord blijft staan.** Niets dwingt de bestuurder om het tijdelijke wachtwoord te wijzigen. *Voorstel:* SVN10 schrijft in de begeleidende mail "Wijzig je wachtwoord via Instellingen". Een verplichte wijziging bij de eerste keer inloggen valt buiten deze story (zie vraag 4 voor de PO).
- **Wachtwoord vergeten.** Er is geen "Wachtwoord vergeten"-link. De bestuurder moet contact opnemen met SVN10. Dat verandert niet in deze story, maar het telt zwaarder nu er meer gebruikers komen.
- **Twee bestuurders tegelijk aan het werk.** Er is geen live bijwerking. Wat de andere bestuurder doet, zie je pas na het herladen of na het wisselen van scherm. Twee gevolgen:
  - Bij Pijlers & Domeinen kan iemand een item bewerken dat de ander net heeft verwijderd. Wat er dan gebeurt is niet goed bekend: waarschijnlijk geen melding, en het item komt niet terug.
  - Bij **Instellingen** bewaart de app het hele clubprofiel in één keer, op basis van wat er bij het inloggen is geladen. Past bestuurder A het seizoen aan en uploadt bestuurder B daarna een logo zonder te herladen, dan zet B het oude seizoen ongemerkt terug. Dat risico bestond niet zolang er maar één gebruiker per club was, en het komt in deze story voor het eerst voor. Zie vraag 2 voor de PO.

---

## Reis 3: ingelogde gebruiker zonder gekoppelde club

### Stap 1: inloggen
**Situatie:** inlogscherm.
**Actie:** de gebruiker logt in met een geldig account.
**Resultaat:** "Bezig...", eventueel de laadkaart.

### Stap 2: geen-club-scherm
**Situatie:** de app vindt geen club bij dit account, of het account mag de club waar het naar verwijst niet openen.
**Actie:** geen.
**Resultaat:** de kaart in inlogstijl:

> **[kompas-icoon] clubKOMPAS**
>
> ## Geen club gekoppeld
>
> Je bent ingelogd als **naam@voorbeeld.nl**, maar je account is nog niet aan een club gekoppeld.
>
> Neem contact op met SVN10 om toegang te krijgen: **{supportadres}**
>
> [ Uitloggen ]

- Het e-mailadres staat er vet in, zodat de gebruiker ziet met welk account hij is ingelogd. Vaak is dat precies het probleem: met het verkeerde adres ingelogd.
- Het supportadres is een klikbare mail-link (`mailto:`). Daarmee is het een duidelijke vervolgactie en geen tekst die de gebruiker moet overtypen.
- "Uitloggen" is de enige knop, in de primaire stijl.
- Er is geen top-bar met clublogo, geen navigatie en geen footer. Er valt niets te klikken dat toch tot een leeg of kapot scherm leidt.

### Stap 3a: uitloggen en opnieuw proberen
**Situatie:** de gebruiker merkt dat hij met het verkeerde e-mailadres is ingelogd.
**Actie:** klikt op "Uitloggen".
**Resultaat:** het inlogscherm verschijnt met lege velden. De gebruiker kan met een ander account inloggen.

### Stap 3b: contact opnemen
**Situatie:** de gebruiker heeft geen ander account.
**Actie:** klikt op het supportadres.
**Resultaat:** het mailprogramma opent met een nieuw bericht aan SVN10. *Voorstel:* vul het onderwerp vooraf in met "Toegang clubKOMPAS" en zet het e-mailadres van het account in de tekst. Dan weet SVN10 meteen welk account gekoppeld moet worden.

### Stap 4: later terugkomen
**Situatie:** de gebruiker sluit het tabblad zonder uit te loggen en komt later terug.
**Actie:** opent clubKOMPAS opnieuw.
**Resultaat:**
- Is het account intussen door SVN10 gekoppeld, dan verschijnt direct het dashboard van de club. De gebruiker hoeft niet opnieuw in te loggen.
- Is het nog niet gekoppeld, dan verschijnt opnieuw het geen-club-scherm.

### Pijnpunten en randgevallen reis 3
- **Koppeling gebeurt terwijl het scherm openstaat.** Het scherm ververst niet vanzelf. De gebruiker moet de pagina herladen, of uitloggen en opnieuw inloggen. *Voorstel:* geen extra knop, om het scherm eenvoudig te houden. SVN10 zegt bij het koppelen "herlaad de pagina". Wil de PO hier een knop "Opnieuw controleren", dan kan die zonder ontwerpwijziging als tweede, rustige knop naast "Uitloggen" (zie vraag 5).
- **Supportadres nog niet bekend.** Zolang de constante leeg is, valt de zin met het adres weg en staat er: "Neem contact op met SVN10 om toegang te krijgen." Er mag nooit een lege link of een placeholder als "{supportadres}" in beeld komen.
- **Zelfregistranten.** Zolang zelfregistratie nog aanstaat (de PO zet die na deze story uit), kan een willekeurig persoon op dit scherm uitkomen. De tekst is daarom neutraal en verraadt niets: geen clubnamen, geen hint over hoe koppelen werkt.
- **Verwijzing naar een club zonder toegang.** Het account verwijst naar een club, maar staat daar niet als lid. Dat is technisch een andere situatie, maar de gebruiker krijgt hetzelfde scherm. Dat is bewust, zie reis 2.

---

## Reis 4: netwerkfout of tijdelijke storing bij het ophalen van de club

### Stap 1: inloggen of pagina openen
**Situatie:** de gebruiker logt in, of opent de app terwijl hij al ingelogd is. De verbinding is weg, of de server reageert tijdelijk niet.
**Actie:** wacht.
**Resultaat:** de laadkaart "Je club wordt geladen..." blijft staan zolang de app probeert verbinding te maken. Bij geen verbinding kan dat enkele seconden duren.

### Stap 2: foutkaart
**Situatie:** het ophalen is mislukt, maar niet omdat er geen club is.
**Actie:** geen.
**Resultaat:**

> **[kompas-icoon] clubKOMPAS**
>
> ## Club laden lukt niet
>
> We konden je clubgegevens niet ophalen. Controleer je internetverbinding en probeer het opnieuw.
>
> [ Opnieuw proberen ]   [ Uitloggen ]

- "Opnieuw proberen" is de primaire knop en "Uitloggen" de gewone knop ernaast.
- Er staat geen technische foutcode in beeld zoals "unavailable" of "Fout: ...". De bestaande gewoonte om `Fout: ${e.code}` te tonen geldt hier niet.
- De gebruiker ziet nooit het geen-club-scherm door een storing. "Je account is niet gekoppeld" terwijl dat wel zo is, zou paniek en onnodige mails naar SVN10 opleveren.

### Stap 3: opnieuw proberen
**Situatie:** foutkaart.
**Actie:** klikt op "Opnieuw proberen".
**Resultaat:** de knop toont "Bezig..." en is niet klikbaar. Daarna zijn er drie mogelijkheden:
- **Gelukt:** het dashboard verschijnt (reis 1, stap 3), of het geen-club-scherm als er echt geen club is (reis 3).
- **Weer mislukt:** dezelfde foutkaart, met één extra regel eronder:
  > Lukt het na een paar pogingen nog steeds niet? Mail naar **{supportadres}**.

  Deze regel verschijnt pas na de tweede mislukte poging (progressief onthullen). Bij de eerste fout is "check je verbinding" het meest waarschijnlijke en meest behulpzame advies. Is het supportadres leeg, dan staat er "Neem contact op met SVN10.".
- **Gebruiker kiest Uitloggen:** terug naar het inlogscherm.

### Pijnpunten en randgevallen reis 4
- **Opnieuw proberen moet alles opnieuw doen.** Het opzoeken van de club én het laden van het profiel worden opnieuw gedaan, niet alleen het laatste deel. Anders kan "Opnieuw proberen" blijven hangen op een half resultaat.
- **Fout na het opzoeken van de club, bij het laden van het profiel.** Voor de gebruiker is dit dezelfde foutkaart. Alleen "geen toegang tot deze club" leidt naar het geen-club-scherm (zie spec). Alle andere fouten leiden naar de foutkaart.
- **Fout tijdens het werken, na het laden.** Valt de verbinding weg terwijl de gebruiker al op het dashboard of bij Pijlers & Domeinen zit, dan valt dat buiten deze story. Het werkt zoals nu: zonder nette melding, waarbij opslaan stil kan mislukken. Dat is wel een bekend gat (zie vraag 3 voor de PO).
- **Sessie verlopen.** Is de gebruiker niet meer ingelogd, dan ziet die gewoon het inlogscherm, net als nu. Dat is geen foutkaart.
- **Lange wachttijd zonder verbinding.** De laadkaart kan een tijdje blijven staan voordat de foutkaart komt. Dat is acceptabel, omdat de gebruiker in de tussentijd wel ziet dat er iets gebeurt. Er komt geen draaiend wieltje. De tekst "Je club wordt geladen..." volstaat, eventueel met een rustige animatie op het kompas als de huisstijl dat toelaat.

---

## Navigatieroute

```
Inlogscherm
  → Inloggen ("Bezig...")
  → [Laadkaart "Je club wordt geladen..." — alleen als het even duurt]
  → één van:
      • Dashboard                (club gevonden)        → normale app
      • Geen-club-kaart          (geen koppeling)       → Uitloggen → Inlogscherm
                                                        → mail-link → mailprogramma
      • Foutkaart                (storing)              → Opnieuw proberen → Laadkaart → ...
                                                        → Uitloggen → Inlogscherm

App openen met actieve sessie
  → Laadkaart → (zelfde drie uitkomsten)

Dashboard/elke pagina → Uitloggen (footer) → Inlogscherm   (ongewijzigd)
```

## Pijnpunten en keuzes (samengevat)
- **Eén tussenscherm-stijl**: laden, geen club en fout gebruiken alle drie de inlogkaart. Dat is herkenbaar, kost geen nieuwe ontwerptaal en er hoeft geen navigatie te verschijnen.
- **Geen club en geen toegang zijn voor de gebruiker hetzelfde**: één boodschap, één vervolgstap (contact met SVN10).
- **Een storing is nooit "geen club"**: een tijdelijk probleem mag de gebruiker niet laten denken dat de toegang weg is.
- **Laadkaart met vertraging**: geen flits bij een snelle verbinding, wel zekerheid bij een trage.
- **Geen technische taal**: geen foutcodes, geen "permission-denied", geen "tenant".
- **Supportadres op één plek**: een lege waarde levert een nette zin zonder adres op, nooit een lege link.
- **Migratiemoment**: het grootste risico op "het werkt niet" ligt buiten de app (een open tabblad met de oude versie). Dat vangen we op met communicatie vooraf, niet met code.

## Wat de Ontwerp-medewerker nodig heeft

### Schermen
1. **Inlogscherm**: bestaat al en blijft ongewijzigd.
2. **Laadkaart** (nieuw): inlogkaart met kompas-icoon, "clubKOMPAS" en de tekst "Je club wordt geladen...". Geen knoppen.
3. **Geen-club-kaart** (nieuw): titel, tekst met het e-mailadres vet, het supportadres als link en de knop "Uitloggen".
4. **Foutkaart** (nieuw): titel, tekst, de knoppen "Opnieuw proberen" (primair) en "Uitloggen" (gewoon), en een extra contactregel na de tweede mislukte poging.
5. **Dashboard, Pijlers & Domeinen en Instellingen**: blijven ongewijzigd.

### Interacties per scherm
| Scherm | Interactie | Gevolg |
|---|---|---|
| Laadkaart | geen | gaat vanzelf over naar dashboard, geen-club-kaart of foutkaart |
| Geen-club-kaart | klik "Uitloggen" | inlogscherm met lege velden |
| Geen-club-kaart | klik supportadres | mailprogramma met onderwerp "Toegang clubKOMPAS" |
| Foutkaart | klik "Opnieuw proberen" | knop wordt "Bezig..." en niet klikbaar, daarna een van de drie uitkomsten |
| Foutkaart | klik "Uitloggen" | inlogscherm |

### Teksten (definitief voorstel)
| Plek | Tekst |
|---|---|
| Laadkaart | Je club wordt geladen... |
| Geen club, titel | Geen club gekoppeld |
| Geen club, tekst | Je bent ingelogd als **{e-mail}**, maar je account is nog niet aan een club gekoppeld. |
| Geen club, contact | Neem contact op met SVN10 om toegang te krijgen: **{supportadres}** (bij leeg adres: zonder dubbele punt en adres) |
| Geen club, knop | Uitloggen |
| Fout, titel | Club laden lukt niet |
| Fout, tekst | We konden je clubgegevens niet ophalen. Controleer je internetverbinding en probeer het opnieuw. |
| Fout, knoppen | Opnieuw proberen · Uitloggen |
| Fout, knop tijdens actie | Bezig... |
| Fout, na 2e poging | Lukt het na een paar pogingen nog steeds niet? Mail naar **{supportadres}**. (bij leeg adres: "Neem contact op met SVN10.") |

### Feedback en toegankelijkheid
- De kop van elke kaart is een `h1`, net als "Inloggen" op het inlogscherm.
- Wisselt de kaart (bijvoorbeeld van laden naar fout), dan moet een schermlezer dat horen. Leg daarvoor een live-regio op de tekst, of zet de focus op de titel.
- Na "Opnieuw proberen" met een nieuwe fout gaat de focus terug naar de knop "Opnieuw proberen".
- Op mobiel moet de kaart even goed werken als het inlogscherm. De twee knoppen op de foutkaart mogen onder elkaar staan.

## Besluiten PO (19 november 2026)
1. **Mail-link naar support:** ja, klikbaar, met onderwerp "Toegang clubKOMPAS" en het account-e-mailadres vooraf ingevuld.
2. **Profiel per ongeluk terugzetten:** geaccepteerd in P0c (er is nu één bestuurder). Wordt een aparte story, CK-019, die af moet zijn voordat een echte tweede bestuurder wordt gekoppeld.
3. **Stil mislukt opslaan bij Pijlers & Domeinen:** aparte story, CK-023; niet in P0c.
4. **Tijdelijk wachtwoord:** een begeleidende mail met het verzoek het wachtwoord te wijzigen volstaat. "Wachtwoord vergeten" staat al op de productbacklog als CK-004.
5. **Knop "Opnieuw controleren" op het geen-club-scherm:** nee, het scherm blijft eenvoudig.
