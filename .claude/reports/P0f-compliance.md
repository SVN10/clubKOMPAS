# Compliancerapport: P0f — Eigen adressen voor live en online test

Getoetst op 22 november 2026 aan de hand van `.claude/specs/P0f-adressen.md`, `.claude/specs/P0f-gebruikersreis.md` (met het conceptbericht aan HCA), `.claude/reports/P0f-bouwverslag.md` en README "Omgevingen". Er is geen code gewijzigd.

## Verwerkte persoonsgegevens

P0f voegt **geen nieuwe gegevenssoorten, doelen of verwerkingen in de app** toe. Wel verandert de route waarlangs gegevens lopen:

| Plek | Gegevens | Wie | Nieuw door P0f? |
|---|---|---|---|
| Live `clubkompas.svn10.nl` (Vercel Production → Firebase `svn10-clubkompas`, eur3) | Accountgegevens HCA-bestuurders (e-mail, uid, wachtwoord-hash bij Google), clubgegevens | HCA-gebruikers | Nee, alleen een ander adres (was `dev.`) |
| Vercel (alle adressen) | Toegangsgegevens: IP-adres, user-agent, opgevraagd pad en tijdstip in request- en runtimelogs. De app is statisch; Firebase-verkeer gaat rechtstreeks van browser naar Google en loopt niet via Vercel. Het `#…`-deel van de URL wordt niet naar Vercel gestuurd. | Alle bezoekers | Nee, Vercel hostte `dev.` al. Wel wordt het gebruik nu breder (Preview + Production + redirect). |
| Online test `tst.clubkompas.svn10.nl` (Vercel Preview → Firebase `svn10-clubkompas-test`, eur3) | Alleen fictieve data, testaccount `test-beheerder@svn10.nl`. Voor de Vercel-login: Pauls Vercel-account. | Paul, later mogelijk een HCA-tester | Ja |
| Hostnet (DNS) | Geen persoonsgegevens (alleen CNAME-records) | – | Ja (nieuwe records) |

Gevolg van P0f voor de privacy: **een duidelijke verbetering**. Tot nu toe gebruikten alle Vercel-previews de productiewaarden en konden ze dus bij de echte HCA-data. Na stap 3 (variabelen scheiden, Preview = test voor alle branches) en met het nieuwe slot `test-met-productie` kan geen enkele preview nog bij productie. Daarmee wordt het fictieve-data-principe ook online technisch afgedwongen.

## Bevindingen

### 1. Geen verwerkersovereenkomst met Vercel op het Hobby-plan
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 28 lid 2 en 4 (subverwerker alleen met toestemming van de verantwoordelijke en een schriftelijke overeenkomst met dezelfde verplichtingen), art. 28 lid 3, art. 44–46 (doorgifte), art. 32 (beveiliging)
**Probleem:** Vercel verwerkt IP-adressen en andere toegangsgegevens van HCA-bestuurders. IP-adressen zijn persoonsgegevens (HvJ EU, *Breyer*, C-582/14), en Vercel erkent dat ook zelf. Daarmee is Vercel een (sub)verwerker van SVN10. De huidige Vercel-DPA (bijgewerkt in maart 2026) geldt volgens de eigen tekst voor klanten op **Pro- en Enterprise-plannen**. Hobby valt daar niet onder. Op Hobby is er dus waarschijnlijk geen verwerkersovereenkomst. Daarnaast staat in de voorwaarden dat Vercel "Your Content" van Hobby- en trial-gebruikers mag gebruiken om AI-modellen te trainen. Vermoedelijk gaat dat om broncode en deployments en niet om bezoekerslogs, maar het is niet uitgesloten.
Over de doorgifte: Vercel is gecertificeerd onder het EU-U.S. Data Privacy Framework, dus de doorgifte naar de VS rust op het adequaatheidsbesluit (art. 45). De logverwerking vindt waarschijnlijk in de VS plaats; een EU-regio voor logs is op Hobby niet in te stellen. Het DPF staat nog juridisch onder druk (hoger beroep tegen het Gerecht-arrest *Latombe*).
Dit risico bestond al vóór P0f (`dev.` draaide al op Vercel Hobby). P0f veroorzaakt het dus niet, maar legt het wel vast in de architectuur. Daarom geldt het niet als blokkade voor deze wijziging.
**Aanbeveling:**
- Besluit vóór een tweede club of een betaalde afspraak (sluit aan bij open vraag 4) om over te stappen op **Vercel Pro**. Accepteer daarna de DPA en sla de geaccepteerde versie en de datum op.
- Tot die tijd: noteer Vercel als subverwerker in de verwerkersovereenkomst of het informatieblad naar HCA (art. 28 lid 2: HCA moet de subverwerker kennen en mag bezwaar maken). Vermeld daarbij welke gegevens (IP, user-agent, paden), waar (VS, DPF) en hoe lang (zie 3).
- Zet geen Log Drains of Web Analytics aan zonder aparte afweging. Komt er een Log Drain, kies dan "IP-adressen niet doorsturen".
- Volg de DPF-uitspraak van het HvJ EU. Bij ongeldigverklaring zijn de SCC's uit de Pro-DPA de terugvaloptie, en dat kan alleen op Pro.

### 2. Hobby-plan: alleen niet-commercieel gebruik toegestaan (contractueel risico en beschikbaarheid)
**Ernst:** 🟡 Aandacht
**Regelgeving:** Vercel Terms of Service (Hobby: "only … for your personal or non-commercial use"), Fair Use Guidelines ("all commercial use requires a Pro or Enterprise plan"); AVG art. 32 lid 1 sub b en c (beschikbaarheid en herstel)
**Probleem:** clubKOMPAS is een product van SVN10 met sportclubs als (toekomstige) klant. Vercel definieert commercieel gebruik ruim: elke deployment die bijdraagt aan financieel gewin van iemand die bij het project betrokken is. Ook een onbetaalde pilot met HCA valt daar waarschijnlijk al onder. Vercel mag Hobby-accounts bij schending opschorten en mag de Hobby-voorwaarden op elk moment wijzigen. Dan vallen live én test tegelijk weg. Met P0f leunt SVN10 zwaarder op Vercel (eigen domeinen, branchdomein, Deployment Protection), dus de impact van zo'n opschorting neemt toe. Een vereniging is geen commerciële partij, maar SVN10 als leverancier is dat wel.
**Aanbeveling:**
- Neem in de backlog een besluitpunt op: "Vercel Pro vóór eerste betaalde afspraak of tweede club". Overweeg Pro al eerder, omdat het ook bevinding 1 oplost.
- Houd een uitwijkroute paraat (bijv. Firebase Hosting in het eigen project, of een andere host). Omdat de DNS bij Hostnet ligt, is een overstap dan een kwestie van een CNAME omzetten. Leg dat in twee regels vast in de README.

### 3. Verwerkingsregister: Vercel, testomgeving en adressen niet vastgelegd
**Ernst:** 🟡 Aandacht
**Regelgeving:** AVG art. 30 lid 1 (register van de verantwoordelijke) en lid 2 (register van de verwerker: categorieën verwerkingen per verantwoordelijke, subverwerkers, doorgiften, beveiligingsmaatregelen)
**Probleem:** in de aangeleverde stukken is geen verwerkingsregister te vinden en wordt er ook niet naar verwezen. P0f voegt toe of maakt zichtbaar: Vercel als hostingpartij met logverwerking in de VS, een tweede Firebase-project (test) en Hostnet als DNS-partij. Ook de bewaartermijn van Vercel-logs is niet vastgelegd. Op Hobby zijn runtimelogs kort beschikbaar; controleer dat in het dashboard en noteer het.
**Aanbeveling:** leg een (eenvoudig) register aan of werk het bij, bijvoorbeeld `.claude/docs/verwerkingsregister.md` of een gedeeld document buiten de repo, met minimaal:
- *Hosting clubKOMPAS (Vercel Inc., VS, DPF)*: IP-adres, user-agent, paden; doel beschikbaarheid en beveiliging; bewaartermijn volgens Vercel-logs; DPA-status (Hobby: geen; actie zie 1).
- *Authenticatie en opslag productie (Google Firebase, `svn10-clubkompas`, eur3)*: bestaande regel, met de datum waarop de verwerkersvoorwaarden zijn geaccepteerd (README stap 1b).
- *Testomgeving (`svn10-clubkompas-test`, eur3, en Vercel Preview)*: uitsluitend fictieve gegevens. Vermeld de borging: README-regel, slot `test-met-productie`, scheiding van Preview-variabelen.
- *DNS (Hostnet)*: geen persoonsgegevens; alleen voor de volledigheid van de keten.

### 4. Conceptbericht aan HCA: juist en duidelijk, op twee punten aanscherpen
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 12 lid 1 (beknopte, begrijpelijke informatie), art. 32 (beveiligingsbewustzijn); geen nieuwe informatieplicht op grond van art. 13/14, omdat doel, gegevens en ontvangers niet veranderen
**Probleem:** inhoudelijk klopt het bericht. Na de redirect is één keer opnieuw inloggen nodig (sessies gelden per adres), de doorsturing duurt 4 weken (307), de gegevens blijven staan en het e-mailadres en wachtwoord blijven gelijk. Twee kanttekeningen:
1. *Phishingpatroon.* Een mail met "nieuw adres, log opnieuw in, je wachtwoordmanager herkent het niet" lijkt sterk op een phishingmail. Bovendien leert hij gebruikers een waarschuwing van hun wachtwoordmanager te negeren.
2. *"Er verandert niets aan de club, de domeinen …"*: in een bericht over een webadres leest "domeinen" als internetdomeinen, terwijl de clubKOMPAS-domeinen bedoeld zijn.
**Aanbeveling:** pas het bericht zo aan:
- Voeg toe: "Typ het adres zelf in of gebruik je bladwijzer. Ik vraag je nooit om je wachtwoord per mail of telefoon. Het adres eindigt altijd op **svn10.nl**."
- Bij de wachtwoordmanager: "Vult je wachtwoordmanager niets in? Controleer dan eerst dat je op https://clubkompas.svn10.nl bent, en sla het daarna op."
- Vervang "de club, de domeinen of wat je hebt ingevuld" door "je clubgegevens, pijlers, domeinen en alles wat je hebt ingevuld".
- Verstuur het bericht via een kanaal dat HCA van Paul kent (het eigen adres, eventueel ook in de bestuursapp). Vul beide datums in voordat je het verstuurt.

### 5. HCA als verantwoordelijke informeren; privacytekst controleren op het oude adres
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 28 lid 3 sub h (verwerker stelt de verantwoordelijke alle informatie ter beschikking), art. 13
**Probleem:** het adres wisselt zonder dat de verwerking verandert. Toch moeten documenten waarin `dev.clubkompas.svn10.nl` staat (privacyverklaring, verwerkersovereenkomst, ledeninformatie van HCA) worden bijgewerkt, anders verwijzen ze naar een adres dat na 4 weken verdwijnt.
**Aanbeveling:** zoek in de afspraken met HCA en in een eventuele privacyverklaring naar het oude adres en vervang het door `clubkompas.svn10.nl`. Neem het meteen mee met de melding uit bevinding 1 (Vercel als subverwerker). Een zin in het bericht aan de bestuurders is voldoende; een aparte formele melding is niet nodig.

### 6. Opheffen van `dev.`: eerst de DNS-regel weg (subdomeinkaping voorkomen)
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 32 lid 1 (passende beveiliging), art. 33 (een gekaapt subdomein waarop een nagemaakt inlogscherm komt, kan tot een datalek leiden)
**Probleem:** in stap 7 staat de volgorde "Vercel-domein verwijderen, daarna Hostnet-CNAME verwijderen". Zolang `dev.clubkompas` nog als CNAME naar Vercel wijst terwijl het domein niet meer aan het project hangt, kan iemand anders het in theorie bij Vercel claimen. Er zou dan een vals inlogscherm kunnen draaien op een adres dat HCA-gebruikers als bladwijzer hebben. Vercel vraagt in zo'n geval vaak om verificatie, maar dat is geen garantie.
**Aanbeveling:** draai de volgorde in stap 7 om. Eerst de CNAME `dev.clubkompas` bij Hostnet verwijderen en met `dig @ns01.hostnet.nl dev.clubkompas.svn10.nl CNAME +short` controleren dat de uitvoer leeg is. Daarna het domein in Vercel verwijderen en het authorized domain in Firebase productie weghalen. Pas README stap 7 en spec §3 stap 7 hierop aan. Dat is documentatie, geen code.

### 7. Online test: Vercel-login als toegangsbeheer; voorwaarden voor openzetten
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 1 sub c en f, art. 25 (privacy by design), art. 32; principe "geen productiedata in DEV/TST"
**Probleem:** de opzet is in orde. Er staat alleen fictieve data in test (README-regel), de Preview-variabelen gelden voor alle branches, het slot `test-met-productie` voorkomt dat een preview bij productie komt, de Firestore-locatie is eur3 en `tst.` staat achter Vercel Authentication. Twee punten verdienen aandacht voor later:
- Op Hobby kun je geen teamleden toevoegen. Een HCA-tester toegang geven betekent in de praktijk dat **Deployment Protection uit** moet, en dan is `tst.` openbaar. Met fictieve data is dat aanvaardbaar (spec, open vraag 3), maar dan is het inlogscherm van het testproject voor iedereen bereikbaar.
- Een HCA-tester krijgt een account in het testproject. Gebeurt dat met zijn echte e-mailadres, dan staat er toch een (klein) persoonsgegeven in test.
**Aanbeveling:** werk bij "tester toevoegen" (README) met deze voorwaarden:
- Testers krijgen een functioneel of verzonnen adres, zoals `tester1@svn10.nl`, en nooit hun HCA-account of een kopie van HCA-data.
- Controleer in het testproject dat zelfregistratie met e-mail en wachtwoord niet mogelijk is (Authentication → Settings → User actions → "Enable create (sign-up)" uit) of dat de Firestore-regels nieuwe accounts zonder lidmaatschap weigeren. Volgens de regels in de README is dat laatste al zo.
- Zet Deployment Protection na de testperiode weer aan en noteer wanneer het open stond.
- Controleer eenmalig dat in de testconsole de verwerkersvoorwaarden zijn geaccepteerd (README stap 1b). Hoewel er alleen fictieve data staat, verwerkt het testproject wel het account van Paul.

## Positieve punten
- Previews kunnen niet meer bij de echte HCA-data. Dat was vóór P0f wel mogelijk, dus hier lag het grootste privacyrisico, en dat is nu weg.
- Het slot `test-met-productie` stopt de app vóór er iets gelezen of opgeslagen wordt. Live breekt nooit, want op Production gelden geen nieuwe stops. Daarmee zijn beschikbaarheid en vertrouwelijkheid goed tegen elkaar afgewogen.
- Melding M16 voorkomt dat gebruikers bij een inrichtingsfout onnodig hun wachtwoord resetten. De melding bevat alleen `location.host` en geen persoonsgegevens, en wordt veilig opgebouwd met `textContent`.
- De redirect is 307 (tijdelijk) met een vaste opheffingstermijn. Zo blijft het oude adres niet onbeperkt bestaan.
- Firebase-projecten staan in eur3 (EU). Google Analytics staat uit in het testproject.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 3 (geen Vercel-DPA op Hobby; Hobby-voorwaarde niet-commercieel; verwerkingsregister)
- 🟢 Aanbevelingen: 4 (conceptbericht aanscherpen; HCA en privacytekst bijwerken; volgorde opheffen `dev.`; voorwaarden voor openzetten van `tst.`)

## Eindoordeel
🟡 **Acceptabel met aandacht.** P0f kan door. De wijziging verlaagt het privacyrisico per saldo, en de aandachtspunten rond Vercel bestonden al vóór P0f. Wel moeten vóór een tweede club of een betaalde afspraak de punten 1 tot en met 3 opgelost zijn (Vercel Pro met DPA, register bijgewerkt). Verwerk de aanpassingen in het conceptbericht (4) vóórdat het naar HCA gaat.

## Bronnen
- Vercel Terms of Service: https://vercel.com/terms
- Vercel Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel Hobby-plan: https://vercel.com/docs/plans/hobby
- Vercel Data Processing Addendum: https://vercel.com/legal/dpa
- Vercel Privacy Notice: https://vercel.com/legal/privacy-notice
- Vercel en DPF: https://vercel.com/kb/guide/is-vercel-certified-under-dpf
- Vercel, IP-zichtbaarheid bij Log Drains: https://vercel.com/changelog/choose-ip-visibility-for-log-drains
