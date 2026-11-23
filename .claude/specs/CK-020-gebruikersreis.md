# Gebruikersreis: CK-020 — Vermogens beheren

Fase 2 (ervaring), 23 november 2026 · Spec: `.claude/specs/CK-020-vermogens-beheren.md` (leidend) · Besluiten: `.claude/specs/CK-020-besluiten.md` (1–12) · Bron: `.claude/specs/CK-020-bron-vermogensoverzicht.md`
Bouwt voort op de shell van CK-044 (`CK-044-gebruikersreis.md`, `CK-044-ontwerp.md`) en de meldingen van CK-023 (`CK-023-gebruikersreis.md`).

## Gebruiker

Een bestuurder van Hockey Club Alphen met de rol beheerder, in de voorbeelden "Jan de Vries · beheerder", bijvoorbeeld de secretaris. Hij kent zijn club in domeinen: "bij Leden hoort ledenwerving, bij Financiën de kascontrole". Het woord "vermogen" is nieuw voor hem. Hij werkt 's avonds op de laptop en kijkt tussendoor op de telefoon, soms in de kantine op wisselend wifi. Hij wil:
- zien wat de club per domein moet kunnen (de 58 vermogens na de import);
- een vermogen toevoegen, hernoemen, naar een ander domein verplaatsen, in een andere volgorde zetten of weghalen;
- er zeker van zijn dat er geen dubbele vermogens ontstaan en dat hij niet per ongeluk een domein weggooit waar nog vermogens onder hangen.

Sommige bestuurders werken met het toetsenbord of VoiceOver.

## Huidige situatie

- Vermogens bestaan alleen op de plaat (het artifact "Vermogensoverzicht HCA v1.4") en in hoofden. In clubKOMPAS houdt het op bij de domeinen.
- Wie wil weten "wat doet Financiën eigenlijk allemaal", moet het PDF-overzicht openen. Daar kan hij niets wijzigen.
- Een domein verwijderen kan nu altijd na één bevestigingsvraag. Zodra er vermogens onder hangen, zou dat stilletjes gegevens laten verdwijnen. Dat mag niet.
- Home toont drie kerncijfers en de domeinkaarten, zonder iets over wat een domein inhoudt.

## Vaste teksten en labels

| Element | Zichtbare tekst | Voor VoiceOver / opmerking |
|---|---|---|
| Zijmenu-item (groep Beheer, tussen Domeinen en Bestuursfuncties) | Vermogens | ingeklapt: tooltip "Vermogens"; eigen pictogram, **niet** het plaat-pictogram van Domeinen |
| Kruimelpad | Home › Beheer › Vermogens | laatste deel `aria-current="page"` |
| Paginatitel (tab) | Vermogens · clubKOMPAS (met omgevingsvoorvoegsel op Test) | |
| Sectiekop | Vermogens | |
| Korte uitleg onder de kop | "Wat moet de club kunnen? Per pijler en ondersteunend domein de vermogens, in de volgorde van de plaat." | één zin, altijd zichtbaar |
| Filter | label "Toon", keuzelijst "Alle domeinen" + de pijlers en ondersteunende domeinen | `<label>` gekoppeld; geen knoppenrij (13 domeinen) |
| Toevoegknop | + Vermogen toevoegen | |
| Groepskop | "#HCASpeelt" + pill "Pijler" + "7 vermogens" | kop (h3); de groepslijst heet "Vermogens bij #HCASpeelt" |
| Rijknoppen | ↑ ↓ Bewerken Verwijderen | ↑: "Teamindeling omhoog", ↓: "Teamindeling omlaag"; Bewerken/Verwijderen: "Teamindeling bewerken" / "Teamindeling verwijderen" (zie bijstelling 6) |
| Formuliervelden | Naam, Domein | Domein: keuzelijst met groepen "Pijlers" en "Ondersteunende domeinen", eerste optie "Kies een domein" |
| Formulierknoppen | Opslaan, Annuleren | tijdens opslaan "Bezig..." |

---

## Reis A: desktop, Beheer → Vermogens (na de import, 58 vermogens)

### Stap 1: Naar Vermogens
**Situatie:** Jan staat op Home of op Beheer → Domeinen.
**Actie:** hij klikt in het zijmenu onder **Beheer** op **Vermogens**.
**Resultaat:** alleen de inhoud wisselt. "Vermogens" wordt het actieve item (wit, oranje linkerrand, vet). Het kruimelpad wordt "Home › Beheer › Vermogens". Bovenaan de inhoud:
- de sectiekop **Vermogens** met de korte uitleg;
- een regel met links het filter **Toon: [Alle domeinen ▾]** en rechts de knop **+ Vermogen toevoegen**;
- daaronder de lijst.

Tijdens het laden staat er "Vermogens worden geladen..." op de plek van de lijst (niet leeg, anders denkt Jan dat er niets is).

### Stap 2: De lijst lezen
**Wat hij ziet:** per domein een groep, in de volgorde van Beheer → Domeinen: eerst de drie pijlers (#HCASpeelt, #HCAGroeit, #HCADoet), dan de tien ondersteunende domeinen (Bestuur t/m Digitaal).
- **Groepskop:** pictogram van het domein (als dat er is), naam, pill "Pijler" of "Ondersteunend", en rechts het aantal ("7 vermogens", "1 vermogen").
- **Rijen:** volgnummer binnen de groep (1 t/m n), de naam van het vermogen, en de knoppen ↑ ↓ Bewerken Verwijderen. Geen kolom "Domein": dat staat al in de kop.
- **Domein zonder vermogens:** de groep staat er wel, met één grijze regel "Nog geen vermogens." Zo ziet Jan meteen welk domein nog leeg is.
- **Onderaan, klein en grijs:** "Projecten en Samenwerkingen zijn overkoepelende domeinen. Die hebben geen vermogens." (alleen als er overkoepelende domeinen zijn; namen uit de data). Dat beantwoordt de vraag "waar zijn die gebleven?" voordat hij die stelt.

58 vermogens en 13 koppen is een lange pagina. Het zijmenu blijft staan (sticky), het filter helpt om in één domein te werken.

**VoiceOver:** met de kopnavigatie (VO+Cmd+H) springt Jan van domein naar domein: "#HCASpeelt, Pijler, 7 vermogens, kop niveau 3". In een groep: "Vermogens bij #HCASpeelt, tabel, 7 rijen".

### Stap 3: Filteren op één domein
**Actie:** Jan kiest in **Toon** het domein **Financiën**.
**Resultaat:** alleen de groep Financiën blijft staan (7 vermogens). Voor de schermlezer meldt een verborgen statusregel: "7 vermogens bij Financiën." Bij "Alle domeinen": "58 vermogens bij 13 domeinen."
- **↑/↓ werken ook gefilterd.** Anders dan bij Domeinen verschuift een vermogen alleen binnen zijn eigen domein, en dat domein staat volledig in beeld.
- Het filter blijft staan na toevoegen, bewerken, ↑/↓ en verwijderen. Naar een andere pagina gaan zet het terug op "Alle domeinen".
- Het filter kan ook vooraf gekozen zijn als Jan vanuit Domeinen komt (zie Reis E).

### Stap 4: Vermogen toevoegen
**Situatie:** filter op Financiën (of Alle domeinen).
**Actie:** Jan klikt op **+ Vermogen toevoegen**.
**Resultaat:** direct onder de filterregel klapt een formulier open (de knop verdwijnt zolang het open is, zoals bij Domeinen). De focus staat in **Naam**.
- **Naam:** leeg tekstveld, voorbeeldtekst "Bijv. Ledenwerving".
- **Domein:** keuzelijst met twee groepen, "Pijlers" en "Ondersteunende domeinen". Overkoepelende domeinen staan er niet in. Staat het filter op een domein, dan is dat domein al gekozen. Bij "Alle domeinen" staat er "Kies een domein": het formulier kiest niet stilletjes het eerste domein voor hem.
- Knoppen **Opslaan** en **Annuleren**.

**Actie:** hij typt "Kascontrole 2027" en klikt **Opslaan**.
**Resultaat:**
- *Bezig:* de knop heet "Bezig...", een tweede klik doet niets, de focus blijft op de knop.
- *Gelukt:* het formulier sluit, het vermogen staat onderaan bij Financiën, en onder de lijst staat "✓ Vermogen Kascontrole 2027 toegevoegd aan Financiën." De focus gaat naar **+ Vermogen toevoegen**. De naam in de melding is de opgeschoonde naam: dubbele spaties en spaties aan het begin of eind zijn weg, zonder dat Jan daar iets over hoort.
- *Ander domein dan het filter:* kiest Jan bij filter Financiën toch "Leden", dan springt het filter na opslaan naar **Leden**. Zo ziet hij het nieuwe vermogen staan.
- *Fout:* zie "Foutsituaties en meldingen". Het formulier blijft open en alles wat hij heeft ingevuld blijft staan.

**Annuleren:** het formulier sluit en wordt leeggemaakt. De focus gaat naar **+ Vermogen toevoegen**.

### Stap 5: Volgorde wijzigen (↑/↓)
**Actie:** Jan klikt bij "Kascontrole 2027" (plaats 8 van 8 bij Financiën) op **↑**.
**Resultaat:** het vermogen schuift één plek omhoog binnen Financiën. De andere groepen bewegen niet. De focus blijft op dezelfde ↑-knop. Staat het vermogen nu bovenaan (↑ uitgeschakeld), dan gaat de focus naar **Bewerken** van dat vermogen. Er komt geen zichtbare melding: de verschuiving is de bevestiging (afspraak CK-023). De schermlezer hoort: "Vermogen Kascontrole 2027 staat nu op plaats 7 van 8 in Financiën."
- Het eerste vermogen van een groep heeft geen werkende ↑, het laatste geen werkende ↓. Een vermogen kan met ↑/↓ niet naar een ander domein: daarvoor is Bewerken.
- *Fout:* de volgorde blijft precies zoals hij was, met onder de lijst bijvoorbeeld "Geen verbinding met de server. Controleer je internet en probeer het opnieuw. De lijst is niet gewijzigd."

### Stap 6: Bewerken: hernoemen
**Actie:** Jan klikt bij "Kascontrole 2027" op **Bewerken**.
**Resultaat:** de rij klapt open tot een formulier met **Naam** (ingevuld) en **Domein** (huidig domein gekozen), plus **Opslaan** en **Annuleren**. De focus staat in Naam. Andere rijen blijven bruikbaar.
**Actie:** hij maakt er "Kascontrole" van... en krijgt "Dit vermogen bestaat al bij Financiën." onder het naamveld (zie foutsituaties). Hij kiest "Kascommissie" en klikt **Opslaan**.
**Resultaat:** de rij sluit, de nieuwe naam staat op dezelfde plek, "✓ Vermogen Kascommissie opgeslagen." De focus staat op **Bewerken** van die rij.
- **Alleen hoofdletters wijzigen** ("kascommissie" → "Kascommissie") mag gewoon en geeft geen dubbel-melding.
- **Niets gewijzigd en Opslaan:** het formulier sluit, zonder melding en zonder opslaan.
- **Annuleren:** de rij sluit ongewijzigd en de focus gaat naar Bewerken van die rij.

### Stap 7: Bewerken: verplaatsen naar een ander domein
**Actie:** Jan opent **Bewerken** bij "Kledingpartnerschap" (Relaties), kiest bij Domein **Materiaal** en klikt **Opslaan**.
**Resultaat:** het vermogen verdwijnt bij Relaties en staat onderaan bij Materiaal. Het aantal in beide groepskoppen loopt mee. Melding: "✓ Vermogen Kledingpartnerschap verplaatst naar Materiaal."
- *Filter op Relaties:* het vermogen verdwijnt uit beeld, dat is de bedoeling. De melding zegt waar het heen is. De focus gaat naar **Bewerken** van het vermogen dat nu op die plek staat, of naar **+ Vermogen toevoegen** als de groep leeg is. Nooit naar de pagina zelf.
- *Filter op Alle domeinen:* de focus gaat naar **Bewerken** van het verplaatste vermogen, op zijn nieuwe plek.

### Stap 8: Bewerken: hernoemen én verplaatsen tegelijk
**Actie:** Jan verandert de naam in "Kledingafspraken" én het domein in Materiaal, en klikt één keer **Opslaan**.
**Resultaat (normaal):** voor Jan is dit één handeling. Achter de schermen gebeurt het in twee stappen (spec: eerst verplaatsen, dan hernoemen), maar dat ziet hij niet. Melding: "✓ Vermogen Kledingafspraken opgeslagen en verplaatst naar Materiaal."
**Resultaat (de tweede stap mislukt):** het vermogen staat al bij Materiaal, maar heet nog "Kledingpartnerschap". De app doet dan het volgende:
- de lijst wordt bijgewerkt en het bewerkformulier gaat **opnieuw open bij het vermogen op zijn nieuwe plek**, met Domein = Materiaal en in Naam nog steeds "Kledingafspraken" (zijn invoer blijft staan);
- onder de knoppen van dat formulier staat: "Het vermogen is verplaatst naar Materiaal, maar de nieuwe naam is niet opgeslagen. [reden, bijv. Geen verbinding met de server.] Klik nog eens op Opslaan om de naam te wijzigen.";
- komt het door een dubbele naam, dan staat de reden onder het naamveld: "Dit vermogen bestaat al bij Communicatie.";
- de focus staat op **Opslaan** (bij een dubbele naam: in het naamveld).

Zie bijstelling 1: controleer de nieuwe naam vóórdat er iets verplaatst wordt. Dan komt deze halve uitkomst bijna nooit voor.

### Stap 9: Verwijderen
**Actie:** Jan klikt bij "Kascommissie" op **Verwijderen**.
**Resultaat:** de vraag "Vermogen Kascommissie verwijderen? Dit kan niet ongedaan worden gemaakt." met **OK** / **Annuleren**.
- *Annuleren:* er gebeurt niets en de focus blijft op Verwijderen.
- *OK, gelukt:* het vermogen is weg, het aantal in de groepskop loopt terug, "✓ Vermogen Kascommissie verwijderd." De focus gaat naar Bewerken van het volgende vermogen in die groep (of het vorige als het de laatste was), anders naar **+ Vermogen toevoegen**. Nooit naar de pagina zelf. De naam is daarna meteen weer vrij voor een nieuw vermogen.
- *OK, mislukt:* het vermogen blijft staan, met de melding plus "De lijst is niet gewijzigd." De focus blijft op Verwijderen.

Er is geen extra waarschuwing over activiteiten: die bestaan nog niet (M2). Zie pijnpunt "Verwijderen na M2".

---

## Foutsituaties en meldingen (mensentaal)

Plek en vorm volgens CK-023. Een veldfout staat onder het veld, met rode rand, `aria-invalid` en focus op het veld. Een algemene fout staat onder de knoppen van het formulier, of onder de lijst bij ↑/↓ en Verwijderen. De invoer blijft altijd staan.

### Naam
De app schoont de naam eerst op (spaties aan het begin of eind en dubbele spaties weg) en controleert daarna. Een spatie te veel is dus nooit een fout.

| Situatie | Tekst onder het veld Naam |
|---|---|
| Leeg | "Vul een naam in." |
| 1 teken | "Een naam heeft minimaal 2 tekens." |
| Meer dan 100 tekens | "Een naam heeft maximaal 100 tekens. Nu zijn het er 104." (geen `maxlength` op het veld: dan kapt plakken de tekst stilletjes af) |
| Begint met een leesteken (bijv. "-Catering" of "(Oud)leden") | "Begin de naam met een letter of cijfer." |
| Ongeldig teken (`/`, `_`, `#`, `@`, `:`, `"`, `<`, emoji, İ, ẞ ...) | "Het teken / kan niet in een naam. Gebruik letters (ook met accent, zoals é, ë of ç), cijfers, spaties en & ' - . , ( ) +" |
| Meerdere ongeldige tekens | "De tekens / en _ kunnen niet in een naam. Gebruik ..." (zelfde staart, maximaal drie tekens genoemd) |
| Teken dat niet goed te tonen is (emoji, onzichtbaar teken) | "Er staat een teken in de naam dat niet kan, bijvoorbeeld een emoji. Gebruik letters (ook met accent, zoals é, ë of ç), cijfers, spaties en & ' - . , ( ) +" |

Toelichting op de tekenset (besluit 12), zoals Jan die moet begrijpen:
- **Mag:** gewone letters, letters met accent die je in Nederlands, Frans, Duits en Spaans tegenkomt (é, è, ë, ï, ü, ö, ç, ñ, ß, ø, å ...), cijfers, spaties en & ' - . , ( ) +. Dus "Lief & Leed", "Bar- en keukenbeheer", "G-hockey", "Ver(nieuw)bouw" en "Hoofdsponsoring 27+" mogen.
- **Mag niet:** schuine streep, liggend streepje, hekje, apenstaartje, aanhalingstekens, dubbele punt, emoji en een paar zeldzame letters (zoals de Turkse İ).
- De foutmelding noemt **het teken dat fout is**. Een lijst met verboden tekens alleen werkt niet: Jan ziet dan niet wat er mis is met "Social media / pers".
- Geen vaste hulptekst onder het veld: bijna elke naam voldoet, de uitleg komt pas als het nodig is (progressief onthullen). De voorbeeldtekst in het veld ("Bijv. Ledenwerving") blijft kort.

### Dubbele naam
Namen zijn uniek in de hele club, niet per domein. Hoofdletters en spaties maken geen verschil.

| Situatie | Tekst | Waar |
|---|---|---|
| Naam bestaat bij een ander domein | "Dit vermogen bestaat al bij Financiën. Kies een andere naam, of verplaats het bestaande vermogen via Bewerken." | onder Naam |
| Naam bestaat al bij het gekozen domein | "Dit vermogen staat al bij Financiën. Misschien is een eerdere poging toch gelukt: kijk in de lijst." | onder Naam |
| Ander tabblad of andere bestuurder sloeg tegelijk dezelfde naam op | dezelfde tekst als hierboven (met het domein van het vermogen dat het won). De lijst wordt op de achtergrond bijgewerkt, zodat het andere vermogen meteen zichtbaar is. Het formulier blijft open. | onder Naam |
| Naam geblokkeerd maar geen vermogen te vinden (los naamdocument na consolewerk) | "Deze naam is al in gebruik, maar het vermogen is niet te vinden. Kies voorlopig een andere naam en meld het aan SVN10: [support-adres]." | onder Naam |

De tweede regel maakt de veilige herhaling uit de spec ("na een time-out geeft opnieuw proberen 'bestaat al'") begrijpelijk. Jan schrikt dan niet van "bestaat al" terwijl hij dacht dat het mislukt was.

### Domein

| Situatie | Tekst | Waar |
|---|---|---|
| Geen domein gekozen | "Kies een domein." | onder Domein |
| Gekozen domein is intussen verwijderd | "Het domein Leden bestaat niet meer. Kies een ander domein." De keuzelijst wordt bijgewerkt, de keuze gaat terug naar "Kies een domein". | onder Domein |
| Gekozen domein is intussen overkoepelend gemaakt | "Leden is nu een overkoepelend domein en kan geen vermogens hebben. Kies een ander domein." Keuzelijst bijgewerkt. | onder Domein |

### Gelijktijdig, verbinding, rechten (statusregel)
De bestaande CK-023-teksten, met bij formulieren "Wat je hebt ingevuld, staat er nog." en bij ↑/↓ en Verwijderen "De lijst is niet gewijzigd."

| Situatie | Tekst |
|---|---|
| Iemand wijzigde tegelijk (`aborted`) | "Iemand anders wijzigde dit tegelijk. De lijst is bijgewerkt. Kijk of je wijziging nodig is en probeer het zo nodig opnieuw." De lijst wordt meteen opnieuw geladen. |
| Vermogen bestaat niet meer (bij Bewerken, Verwijderen of ↑/↓) | "Dit vermogen bestaat niet meer, misschien is het net door iemand anders verwijderd. De lijst is bijgewerkt." Bij Verwijderen is dat voor Jan ook goed: het is weg. |
| Offline | "Je bent niet verbonden met internet. ..." (CK-023) |
| Geen verbinding met de server | "Geen verbinding met de server. ..." (CK-023) |
| Time-out (15 s) | "Opslaan duurt te lang. Controleer je verbinding en kijk daarna of je wijziging in de lijst staat, voordat je het opnieuw probeert." (CK-023). Probeert hij toch opnieuw, dan voorkomt de dubbel-melding een tweede vermogen. |
| Geen rechten (`permission-denied`) | "Je hebt geen toestemming om dit op te slaan. Herlaad de pagina. Lukt het dan nog niet, neem contact op met SVN10: [adres]." |
| Sessie verlopen | CK-023-tekst + knop **Opnieuw inloggen** |
| Onbekend | "Opslaan is niet gelukt. Probeer het opnieuw. Blijft dit gebeuren, neem dan contact op met SVN10: [adres]." |

### Laden mislukt
Lukt het niet om de vermogens of de domeinen op te halen, dan staat er op de plek van de lijst: "De vermogens konden niet worden geladen. Controleer je verbinding en probeer het opnieuw." met de knop **Opnieuw laden**. Filter en **+ Vermogen toevoegen** zijn dan verborgen: toevoegen zonder lijst kan alleen fout gaan. Zijn de regels nog niet gepubliceerd (testscenario 14, `permission-denied` bij lezen), dan staat er dezelfde tekst, met in de testomgeving een grijze hint "Testomgeving: zijn de Firestore-regels voor vermogens al gepubliceerd?"

---

## Reis B: lege staat (vóór de import)

### Stap 1: Eerste bezoek
**Situatie:** de regels zijn gepubliceerd, er zijn nog geen vermogens.
**Resultaat:** geen 13 lege groepen, maar één blok:
> **Nog geen vermogens**
> Een vermogen is iets wat de club moet kunnen om een domein te laten werken, bijvoorbeeld *Ledenwerving* bij Leden of *Kascontrole* bij Financiën. Voeg het eerste vermogen toe.
> **[+ Vermogen toevoegen]**

Het filter is verborgen (er valt niets te filteren).

### Stap 2: Eerste vermogen
**Actie:** Jan voegt "Teamindeling" toe bij #HCASpeelt.
**Resultaat:** de gewone lijst verschijnt. #HCASpeelt heeft 1 vermogen, de andere twaalf groepen tonen "Nog geen vermogens." Het filter verschijnt.

### Variant: er zijn geen pijlers of ondersteunende domeinen
"Er zijn nog geen pijlers of ondersteunende domeinen. Een vermogen hoort altijd bij zo'n domein. **Ga naar Domeinen** om er een toe te voegen." De link gaat naar Beheer → Domeinen. Er is geen toevoegknop.

### Variant: vermogen zonder geldig domein (alleen na consolewerk)
Onderaan staat een extra groep **"Zonder geldig domein"**, met de uitleg "Deze vermogens horen bij een domein dat niet meer bestaat of overkoepelend is. Kies via Bewerken een ander domein, of verwijder ze." Zonder ↑/↓, met Bewerken (Domein staat op "Kies een domein") en Verwijderen. Deze vermogens tellen op Home niet mee.

---

## Reis C: telefoon (≤700px)

### Stap 1: Openen
Via ☰ → Beheer → **Vermogens** (het paneel sluit vanzelf, CK-044). Het kruimelpad is "Home › Beheer › Vermogens".

### Stap 2: Lijst
- Filter en toevoegknop staan **onder elkaar**, elk over de volle breedte (filter eerst).
- Groepskop op één regel: naam + aantal. De pill mag naar de tweede regel.
- Rij: regel 1 het nummer en de naam (een lange naam loopt door naar een volgende regel, nooit afgekapt), regel 2 de knoppen ↑ ↓ Bewerken Verwijderen. Elke knop is minstens 44×44px, Verwijderen staat het verst van ↑/↓ af.
- Met 58 vermogens is de pagina op de telefoon lang. Advies: **filter op domein** is de gewone manier van werken. Er is geen extra "naar boven"-knop nodig; het kruimelpad en ☰ staan bovenaan.

### Stap 3: Toevoegen en bewerken
- Het formulier staat over de volle breedte. Naam en Domein staan onder elkaar, Opslaan en Annuleren naast elkaar (of onder elkaar als het niet past).
- Het naamveld krijgt `autocapitalize="sentences"` en geen autocorrectie die woorden vervangt (`autocorrect="off"`). Anders wordt "Kascontrole" zomaar "Kas controle".
- De domeinkeuze is de gewone keuzelijst van het toestel (iOS-draaiwiel met groepskoppen).
- Na Opslaan scrolt de pagina naar de melding als die buiten beeld valt.

### Stap 4: Verwijderen
De bevestigingsvraag is de systeemdialoog van het toestel, met de naam van het vermogen erin.

---

## Reis D: Home

### Stap 1: Kerncijfers
**Wat Jan ziet:** vier kerncijfers: **Pijlers 3**, **Ondersteunende domeinen 10**, **Overkoepelende domeinen 2**, **Vermogens 58**. Op desktop naast elkaar, op ≤700px in een raster van 2×2.
- Het cijfer Vermogens telt alleen vermogens bij een bestaande pijler of een bestaand ondersteunend domein (geen "zonder geldig domein").
- Advies: het kerncijfer is nu **geen link**. De plaat (CK-021) wordt de natuurlijke plek om erheen te klikken. Een link naar Beheer zou daar later mee botsen.

### Stap 2: Domeinkaarten
- Pijler of ondersteunend domein met vermogens: een regel "7 vermogens" (bij 1: "1 vermogen"), in de kaart boven de voetregel met pill en hashtag.
- Zonder vermogens: "Nog geen vermogens" (besluit 9), in grijs.
- Overkoepelend domein: geen regel.
- De regel is gewone tekst, geen link (zie pijnpunt CK-021).

### Stap 3: Vermogens laden niet
**Situatie:** de domeinen laden wel, de vermogens niet (geen verbinding, regels nog niet gepubliceerd).
**Resultaat:**
- Kerncijfer Vermogens: "–". Voor VoiceOver: "Vermogens: niet geladen" (en tijdens het laden "Vermogens: wordt geladen").
- Op de domeinkaarten staat **géén** aantal en ook **niet** "Nog geen vermogens". Dat zou onwaar zijn: Jan zou denken dat alles weg is.
- Eén grijze regel boven de kaarten: "Het aantal vermogens kon niet worden geladen. Herlaad de pagina om het opnieuw te proberen."
- De rest van Home werkt zoals nu.

### Stap 4: Lege staat
Vóór de import: "Vermogens 0" en op elke pijler- en ondersteunende kaart "Nog geen vermogens".

---

## Reis E: Beheer → Domeinen, domein met vermogens

### Stap 1: Domein met vermogens verwijderen
**Actie:** Jan klikt bij **Leden** (5 vermogens) op **Verwijderen**.
**Resultaat:** **geen** bevestigingsvraag (die zou suggereren dat het kan). Onder de lijst staat meteen een foutmelding, die direct wordt voorgelezen:
> "Leden heeft nog 5 vermogens. Een domein met vermogens kan niet weg. Verplaats of verwijder die vermogens eerst." **[Naar de vermogens van Leden]**

- De knop in de melding opent Beheer → Vermogens met het filter op **Leden**. Daar kan Jan ze verplaatsen (Bewerken → ander domein) of verwijderen. Daarna komt hij via het zijmenu terug bij Domeinen.
- De focus blijft op **Verwijderen**. Met Tab bereikt hij de knop in de melding.
- Het aantal wordt op het moment van klikken vers opgehaald. Heeft een andere bestuurder de vermogens net verplaatst (teller 0), dan krijgt Jan gewoon de bevestigingsvraag.
- **Race:** weigert de database toch (een ander voegde net een vermogen toe), dan haalt de app het aantal opnieuw op en toont dezelfde melding, en niet "Je hebt geen toestemming".

### Stap 2: Domein met vermogens overkoepelend maken
**Actie:** Jan opent **Bewerken** bij Leden, kiest bij Soort **Overkoepelend domein** en klikt **Opslaan**.
**Resultaat:** niets opgeslagen, ook de andere velden niet. Onder de soortkeuze staat:
> "Een overkoepelend domein heeft geen vermogens, en Leden heeft er nog 5. Verplaats of verwijder die eerst, of kies Pijler of Ondersteunend domein." **[Naar de vermogens van Leden]**

De focus gaat naar de gekozen soort (het rondje "Overkoepelend domein"), zodat de schermlezer de melding hoort via de koppeling met het veld. Zijn andere wijzigingen (bijvoorbeeld de omschrijving) blijven in het formulier staan. Kiest hij Ondersteunend en klikt hij Opslaan, dan gaat het gewoon. Race: zoals in stap 1.

### Stap 3: Pijler ↔ ondersteunend
Mag altijd. De vermogens blijven en houden hun volgorde. In Beheer → Vermogens verschuift de groep naar zijn nieuwe plek (de pill wordt "Ondersteunend").

### Stap 4 (Could): aantal in de domeinenlijst
Advies: in de rij van een pijler of ondersteunend domein een korte link "5 vermogens" of "Nog geen" (bij overkoepelend "—"), die naar Vermogens met filter gaat. Dat is dezelfde route als de knop in de melding, maar dan ook zonder fout. Alleen als het past in de container query (760px). Anders vervalt het: de melding geeft de route ook.

---

## Toegankelijkheid

**Toetsenbord (Tab-volgorde op Vermogens):** Direct naar inhoud → zijmenu (CK-044) → kruimelpad → **Toon** (filter) → **+ Vermogen toevoegen** → per groep, per rij: ↑ → ↓ → Bewerken → Verwijderen. Uitgeschakelde ↑ of ↓ wordt overgeslagen. Met 58 rijen zijn dat ruim 200 tabstops. Daarom staan filter en toevoegknop **boven** de lijst, en is de groepskop een echte kop voor schermlezers.
- Het filter is een gewone keuzelijst: pijltjestoetsen kiezen, de lijst ververst bij een wijziging (geen aparte knop "Toepassen").
- In het formulier: Tab van Naam → Domein → Opslaan → Annuleren. Enter in het naamveld klikt op Opslaan (advies; wijkt af van Domeinen, maar is bij een formulier van twee velden wat men verwacht). Esc in een open formulier doet niets (geen verrassingen met half ingevulde tekst).
- Focusafspraken: zie de stappen. Hoofdregel: de focus komt nooit op `<body>` terecht en staat na een actie op iets wat bij die actie hoort.

**Schermlezer:**
- Groepskop als kop niveau 3 onder de sectiekop (h2), met naam, soort en aantal in één kop.
- Elke groep is een eigen tabel (of lijst) met de naam "Vermogens bij [domein]". Kolomkoppen alleen voor de schermlezer: "Nr.", "Vermogen", "Acties".
- ↑/↓: verborgen statusregel (`role="status"`), leeg vóór elke klik: "Vermogen Teamindeling staat nu op plaats 2 van 7 in #HCASpeelt."
- Filter: verborgen statusregel: "7 vermogens bij Financiën." / "58 vermogens bij 13 domeinen."
- Veldfouten met `aria-describedby` aan het veld gekoppeld en `aria-invalid="true"`, met de focus op het eerste foute veld. De fout bij de soortkeuze in Domeinen hoort bij de radiogroep.
- Succes `role="status"`, fout `role="alert"` (CK-023). Het vinkje wordt niet voorgelezen.
- Rijknoppen hebben een naam met het vermogen erin ("Teamindeling bewerken"). Anders hoort Jan bij kopnavigatie of in het rotormenu 58 keer "Bewerken" zonder te weten welke.
- Lange namen worden nooit afgekapt met "...". Er is geen tooltip nodig.

**Mobiel:** knoppen ≥44px, filter en toevoegknop over de volle breedte, systeemkeuzelijst en systeemdialoog, licht en donker leesbaar (bestaande tokens).

---

## Navigatieroute

- Home → zijmenu Beheer → **Vermogens** → [Toon: domein] → [+ Vermogen toevoegen] → formulier → [Opslaan] → "Bezig..." → lijst + "✓ ..." óf formulier + fout → [Opslaan] opnieuw
- Vermogens → [Bewerken] in de rij → naam en/of domein → [Opslaan] → lijst (vermogen op dezelfde of op de nieuwe plek) + "✓ ..."
- Vermogens → [↑]/[↓] → rij schuift binnen het domein (statusmelding voor de schermlezer)
- Vermogens → [Verwijderen] → bevestiging met naam → lijst + "✓ ... verwijderd."
- Beheer → Domeinen → [Verwijderen] of soort Overkoepelend bij een domein met vermogens → melding → [Naar de vermogens van X] → Vermogens (filter X) → verplaatsen/verwijderen → zijmenu → Domeinen → [Verwijderen] lukt
- Home → kerncijfer en kaarten (alleen lezen)
- Telefoon: dezelfde routes, steeds via ☰ → item

## Pijnpunten en keuzes

- **Het woord "vermogen" is nieuw.** Bestuurders zeggen eerder "taak" of "wat we doen". *Oplossing:* één vaste uitleg onder de sectiekop, en in de lege staat een voorbeeld uit hun eigen club. Geen begrip "capability" of uitleg over het datamodel.
- **Toevoegknop bovenaan in plaats van onderaan** (bij Domeinen en Bestuursfuncties staat hij onder de lijst). Onder 58 rijen is hij onvindbaar, en het formulier zou ver van het filter staan. *Advies:* bovenaan, naast het filter. Bewuste afwijking (open vraag 1).
- **Toevoegen buiten het filter.** Een vermogen toevoegen aan een ander domein dan het filter zou uit beeld verdwijnen. *Oplossing:* het domein is vooraf gekozen volgens het filter, en het filter volgt het gekozen domein na opslaan.
- **Verplaatsen uit het filter** laat het vermogen uit beeld verdwijnen. *Oplossing:* de melding noemt het nieuwe domein, de focus gaat naar een buurrij. Het filter springt hier **niet** mee: wie een domein aan het opruimen is, wil daar blijven.
- **Hernoemen en verplaatsen in twee stappen** kan halverwege stoppen. *Oplossing:* het formulier gaat opnieuw open op de nieuwe plek met de getypte naam, met een melding die zegt wat wel en niet gelukt is. Daarnaast bijstelling 1 (eerst de naam controleren).
- **"Bestaat al" na een time-out** kan verwarren. *Oplossing:* een eigen tekst als het bestaande vermogen in hetzelfde domein staat ("Misschien is een eerdere poging toch gelukt").
- **Uniek in de hele club, niet per domein.** Jan kan verwachten dat "Evenementen" bij Hospitality én bij Communicatie mag. *Oplossing:* de dubbel-melding noemt het domein waar het al staat en wijst op verplaatsen. Twee varianten onderscheiden met een woord erbij ("Evenementen communicatie") kan ook.
- **Tekenset** voelt willekeurig ("waarom geen /?"). *Oplossing:* de melding noemt het foute teken en wat wel mag, met accenten als voorbeeld. Geen technische uitleg.
- **Domein verwijderen met vermogens:** de bestuurder moet eerst elders aan de slag. *Oplossing:* geen bevestigingsvraag, wel een melding met een directe knop naar de vermogens van dat domein (filter vooraf gekozen).
- **Lange lijst** (58 rijen, 13 koppen, ruim 200 tabstops). *Oplossing:* filter, koppen voor kopnavigatie, overslaglink, knoppen met de naam erin. Geen inklapbare groepen: dat is een extra klik per domein en het filter doet hetzelfde.
- **Lege groepen tonen of niet.** *Advies:* wel tonen met "Nog geen vermogens." (overzicht: welk domein is nog leeg), behalve als er helemaal niets is (dan één lege-staat-blok).
- **Home met mislukte vermogens** mag geen "Nog geen vermogens" tonen. *Oplossing:* "–" en een grijze regel, geen aantallen op de kaarten.
- **Twee keer "Vermogens" in het zijmenu zodra CK-021 er is** (Overzicht: de plaat; Beheer: beheren). Uitgeklapt geeft het groepskopje context, ingeklapt zijn er twee gelijke tooltips. *Nu:* het beheertabblad krijgt een eigen pictogram (geen plaat-pictogram, dat hoort bij Domeinen, en de plaat krijgt straks een eigen). *Bij CK-021:* tooltip of naam van het beheeritem eventueel "Vermogens beheren". Houd het kruimelpad uniek: "Home › Beheer › Vermogens" tegenover "Home › Vermogens".
- **CK-021 wil straks naar deze pagina linken** ("bewerk de vermogens van dit domein"). *Oplossing nu:* het filter kan bij het openen vooraf gekozen worden (zoals vanuit Domeinen). Dezelfde ingang dient later de plaat.
- **Verwijderen na M2:** zodra activiteiten aan een vermogen hangen, is een gewone bevestigingsvraag te licht. Buiten scope; de vraag met de naam erin is daar een begin van.
- **Dubbele volgordenummers** bij gelijktijdig werken (spec: onschuldig). Jan ziet altijd 1 t/m n in de lijst, omdat de app nummert op positie en niet het opgeslagen getal toont.

## Bijstellingen voor de spec (voorstel)

1. **Naam vooraf controleren bij hernoemen + verplaatsen.** Lees vóór de eerste transactie het naamdocument van de nieuwe naam. Bestaat het (en is het niet van dit vermogen), meld dan de dubbele naam en verplaats niets. De halve uitkomst blijft zo beperkt tot een echte race of een verbindingsfout.
2. **Halve uitkomst:** bewerkformulier opnieuw openen op de nieuwe plek met de getypte naam (stap 8), in plaats van alleen een melding.
3. **Dubbel-melding in twee varianten:** ander domein ("bestaat al bij X. Kies een andere naam, of verplaats ...") en hetzelfde domein ("staat al bij X. Misschien is een eerdere poging toch gelukt ..."). Bij een dubbel-fout de lijst op de achtergrond verversen.
4. **Veldfout ongeldig teken noemt het foute teken** (maximaal drie), met de staart "Gebruik letters (ook met accent, zoals é, ë of ç), cijfers, spaties en & ' - . , ( ) +". Een aparte melding als het eerste teken geen letter of cijfer is. Te lang: met het aantal tekens. Geen `maxlength`.
5. **Domein-veldfouten** (verwijderd of overkoepelend geworden) onder de keuzelijst, met de keuzelijst bijgewerkt.
6. **Toegankelijke namen voor Bewerken en Verwijderen** met de naam van het vermogen ("Teamindeling bewerken"), zoals ↑/↓ al hebben.
7. **Filter-statusmelding** voor de schermlezer, en het filter vooraf te kiezen bij het openen (vanuit Domeinen, later vanuit de plaat).
8. **Toevoegknop en formulier bovenaan** de lijst (afwijking van Domeinen en Bestuursfuncties).
9. **Domeinen:** bij verwijderen met vermogens geen `confirm()` maar meteen de melding, met de knop **Naar de vermogens van X**. Bij overkoepelend de melding onder de soortkeuze, met dezelfde knop.
10. **Home:** bij mislukte vermogens geen regel op de kaarten (ook niet "Nog geen vermogens"), wel één grijze regel boven de kaarten. Kerncijfer "–" met een toegankelijke naam.
11. **Opslaan zonder wijziging** in het bewerkformulier: sluiten zonder schrijfactie en zonder melding.
12. **Bevestigingsvraag met naam:** "Vermogen X verwijderen? Dit kan niet ongedaan worden gemaakt."

## Wat de Ontwerp-medewerker nodig heeft

**Schermen**
- Beheer → Vermogens: (a) lege staat, (b) gevuld met 58, alle domeinen, (c) gefilterd op één domein, (d) toevoegformulier open bovenaan, (e) bewerkformulier open in een rij, (f) groep "Zonder geldig domein", (g) laden mislukt, (h) geen pijlers of ondersteunende domeinen.
- Elk op desktop uitgeklapt, desktop ingeklapt, ~768px uitgeklapt (lijst naast het zijmenu, container query) en ~400px.
- Beheer → Domeinen: foutmelding bij verwijderen met de knop "Naar de vermogens van X"; bewerkformulier met de fout onder de soortkeuze; eventueel de kolom "n vermogens" (Could), getoetst op 760px.
- Home: vier kerncijfers (desktop op een rij, ≤700px 2×2), domeinkaart met "7 vermogens", "1 vermogen", "Nog geen vermogens", overkoepelende kaart zonder regel, en de staat "vermogens niet geladen".

**Interacties per scherm**
- Vermogens: filter kiezen; + Vermogen toevoegen → Naam, Domein (keuzelijst met groepen), Opslaan/Annuleren; per rij ↑ ↓ Bewerken Verwijderen; Bewerken → Naam en Domein, Opslaan/Annuleren; Opnieuw laden.
- Domeinen: Verwijderen (geblokkeerd), Bewerken → soort Overkoepelend (geblokkeerd), knop in de melding.
- Home: alleen lezen.

**Feedback**
- CK-023-statusregel onder de knoppen en de lijst (succes petrol met vinkje, fout `--fout`), "Bezig..." op de knop, veldfouten onder Naam, Domein en de soortkeuze, verborgen statusregels voor ↑/↓ en het filter.
- Toestanden om te tekenen: groepskop (pictogram, naam, pill, aantal), lege groep ("Nog geen vermogens."), uitgeschakelde ↑/↓, rij met een lange naam die over twee regels loopt, bewerkrij, halve uitkomst (formulier opnieuw open met melding), focusrand op alle knoppen, licht en donker.

**Ontwerpvragen**
1. Groepskop en rijen: één tabel met tussenkoppen, of per groep een eigen tabel onder een h3? (Advies: per groep een h3 met eigen tabel, voor kopnavigatie; visueel mag het één doorlopend blok zijn.)
2. Waar staat het aantal op de domeinkaart: eigen regel boven de voetregel, of in de voetregel naast pill en hashtag? Let op smalle kaarten en lange hashtags.
3. Pictogram voor Beheer → Vermogens in de lijnstijl van het menu (48×48, lijn 3), duidelijk anders dan "plaat" (Domeinen) en vrij te houden van wat CK-021 nodig heeft. Bijvoorbeeld een lijst met blokjes of een puzzelstuk.
4. Rijbreedte op ~768px uitgeklapt: nummer, naam en vier knoppen naast elkaar, of de knoppen naar een tweede regel (zoals bij Domeinen via de container query)?
5. De link in de domeinenlijst (Could): als tekstlink in een eigen kolom, of onder de naam van het domein?
