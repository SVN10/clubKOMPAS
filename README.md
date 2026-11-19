# clubKOMPAS
Verenigingsbeheer voor sportclubs

## Firestore-regels

De beveiligingsregels staan in `firestore.rules` in de root van deze repo. De repo is de bron: wijzig de regels hier en plak daarna de volledige inhoud in de Firebase-console (Firestore → Regels → Publiceren). Er is geen Firebase CLI of `firebase.json`.

De regels staan per collectie expliciet toe (`instellingen`, `structuurelementen`). Elke nieuwe collectie (bijv. `vermogens`, CK-020) moet bewust aan `firestore.rules` worden toegevoegd; zonder regel is ze dicht.

Test wijzigingen vóór publicatie in de **Rules Playground** van de console. Minimaal:

| Scenario | Verwacht |
|---|---|
| HCA-lid: lezen `clubs/{hcaClubId}/structuurelementen/x` | toegestaan |
| HCA-lid: schrijven `structuurelementen/x` met `type: "pijler"`, `naam: "Test"` | toegestaan |
| HCA-lid: schrijven `structuurelementen/x` met `type: "anders"` of zonder `naam` | geweigerd |
| HCA-lid: verwijderen `clubs/{hcaClubId}/structuurelementen/x` | toegestaan |
| HCA-lid: lezen `clubs/{hcaClubId}/instellingen/profiel` | toegestaan |
| HCA-lid: schrijven `instellingen/profiel` met `logo: "data:image/png;base64,..."` of zonder `logo` | toegestaan |
| HCA-lid: schrijven `instellingen/profiel` met `logo: "javascript:alert(1)"` of een getal | geweigerd |
| HCA-lid: schrijven `clubs/{hcaClubId}/instellingen/iets-anders` | geweigerd |
| HCA-lid: schrijven `clubs/{hcaClubId}/willekeurig/x` | geweigerd |
| HCA-lid: lezen `clubs/{hcaClubId}/leden/{eigenUid}` | toegestaan |
| HCA-lid: lezen `clubs/{hcaClubId}/leden/{anderUid}` | geweigerd |
| HCA-lid: schrijven `clubs/{hcaClubId}/leden/{anderUid}` | geweigerd |
| HCA-lid: schrijven `gebruikers/{eigenUid}` | geweigerd |
| HCA-lid: lezen `gebruikers/{anderUid}` | geweigerd |
| Ingelogde niet-lid: lezen `clubs/{hcaClubId}/structuurelementen/x` | geweigerd |
| Niet ingelogd: alles | geweigerd |

## Beheer: gebruiker aan club koppelen

Er is (nog) geen uitnodigingsflow in de app. Een extra bestuurder koppel je handmatig in de Firebase-console. Schrijfacties in de console vallen niet onder de beveiligingsregels.

Koppel alleen op verzoek van de club (de verantwoordelijke) en noteer het in het logboek (zie onder).

1. **Authentication** → Gebruiker toevoegen: e-mailadres en een willekeurig, lang wachtwoord dat je niet bewaart of deelt. Noteer de uid van het nieuwe account.
2. **Firestore** → maak document `clubs/{clubId}/leden/{uid}` met:
   - `rol` (string): `beheerder`
   - `email` (string): het e-mailadres
   - `toegevoegdOp` (timestamp): nu
3. **Firestore** → maak document `gebruikers/{uid}` met alleen:
   - `clubId` (string): het clubId (zie `gebruikers/{uid van de eerste bestuurder}.clubId`)
4. **Authentication** → bij de nieuwe gebruiker: menu (⋮) → **Wachtwoord opnieuw instellen**. De bestuurder krijgt een mail met een link en kiest zelf een wachtwoord. SVN10 kent het wachtwoord dus nooit.
5. Laat de bestuurder weten (los van de resetmail) dat de mail eraan komt, met de link naar clubKOMPAS.

Maak altijd **beide** documenten uit stap 2 en 3 aan. Ontbreekt er één, of staat er een typfout in het clubId, dan ziet de gebruiker het scherm "Geen club gekoppeld". Staat dat scherm al open, laat de gebruiker dan de pagina herladen.

Wijzigt een bestuurder zijn e-mailadres via Instellingen, werk dan het veld `email` in `clubs/{clubId}/leden/{uid}` met de hand bij (de app mag dat document niet schrijven).

## Beheer: gebruiker ontkoppelen of verwijderen

Bij een bestuurswisseling of op verzoek van de club. De club geeft vertrek van een bestuurder door aan SVN10.

1. **Firestore** → verwijder `clubs/{clubId}/leden/{uid}`. Hiermee is de toegang tot de clubdata direct ingetrokken.
2. **Firestore** → verwijder `gebruikers/{uid}`.
3. **Authentication** → schakel het account uit, of verwijder het als het niet meer nodig is.
4. Noteer in het logboek: datum, wie het heeft uitgevoerd, op verzoek van wie, welk account (uid/e-mail) en welke club.

Een open sessie van de vertrokken bestuurder krijgt na stap 1 bij elke lees- of schrijfactie een weigering.

## Migratie P0c: club loskoppelen van gebruiker (eenmalig)

Doel: de HCA-data kopiëren van `clubs/{uid}` naar `clubs/{clubId}` en de nieuwe regels publiceren. De oude data blijft staan. Kies een rustig moment en vraag de HCA-bestuurder(s) vooraf uit te loggen en na afloop de pagina te herladen.

### Logboek
Houd tijdens de migratie een kort logboek bij (bijv. in het opleververslag):
- datum en uitvoerder
- tijdstip overgangsregels **aan** en tijdstip **uit** (= nieuwe regels gepubliceerd)
- clubId
- resultaat van het script (`OK` of de gemelde verschillen) en van de rookproef
- of de oude regels (stap 0) open waren (`if true` of alleen `request.auth != null`)

### Stap 0 — Huidige regels veiligstellen (verplicht)
Kopieer de huidige regels uit de console (Firestore → Regels) naar `scripts/firestore.rules.voor-P0c` en commit dat bestand. Zonder deze kopie is terugdraaien van de regels niet mogelijk.

### Stap 1 — Overgangsregels publiceren
Plak de inhoud van `scripts/firestore.rules.migratie` in de console en vervang daar `<HCA-UID>` door de uid van het HCA-account (Authentication → Gebruikers). Publiceer. Zet de echte uid nooit in een gecommit bestand.

### Stap 2 — Migratiescript draaien
```bash
node scripts/migreer-club.mjs --droog   # alleen samenvatting, schrijft niets
node scripts/migreer-club.mjs           # echte run, vraagt bevestiging met "ja"
```
Log in met het HCA-account. Controleer in de samenvatting de clubnaam, het aantal pijlers en domeinen, of er een logo is en eventuele LET OP-meldingen. Na de echte run moet het script eindigen met `OK`, gevolgd door de herinnering om direct stap 3 uit te voeren. Het script schrijft in `gebruikers/{uid}` alleen het `clubId`. Opnieuw draaien is veilig: het hergebruikt het clubId uit `gebruikers/{uid}` en maakt geen duplicaten.

Ga daarna zo snel mogelijk door naar stap 3: de overgangsregels geven het HCA-account toegang tot de hele database.

### Stap 3 — Nieuwe regels en nieuwe app-versie
1. Plak de inhoud van `firestore.rules` in de console en publiceer (dit vervangt de overgangsregels).
2. Zet direct daarna de nieuwe app-versie live.

### Stap 4 — Rookproef
Log in als HCA-bestuurder en controleer: clubnaam, logo, favicon, seizoen en alle pijlers en domeinen zijn zichtbaar. Sla één testwijziging op en draai die terug.

### Terugdraaien
- Zet de vorige app-versie terug en plak `scripts/firestore.rules.voor-P0c` terug in de console. Alles werkt dan weer op `clubs/{uid}`.
- De nieuwe documenten (`clubs/{clubId}`, `gebruikers/{uid}`) mogen blijven staan; ze storen de oude versie niet.
- Wijzigingen die ná de migratie in de nieuwe locatie zijn gedaan, staan niet in de oude locatie en moeten zo nodig met de hand worden nagezet.

De oude data onder `clubs/{oudeUid}` blijft staan. Opruimen gebeurt pas na minimaal één sprint zonder problemen, met een apart script en expliciet akkoord van de PO.
