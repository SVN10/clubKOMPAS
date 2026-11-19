# P0c — Club loskoppelen van gebruiker: technische documentatie

Beheer- en migratieprocedures (koppelen, ontkoppelen, migratie, terugdraaien, Rules Playground-scenario's) staan in `README.md`. Dit document legt het model en de keuzes uit. De changelog staat in `CHANGELOG.md`.

## Datamodel

```
gebruikers/{uid}                      wijzer: bij welke club hoor ik?
  clubId: string                      (verder niets: dataminimalisatie)

clubs/{clubId}                        clubdocument; clubId = willekeurig Firestore-ID
  naam, aangemaaktOp, gemigreerdVan   (gemigreerdVan alleen bij HCA)

clubs/{clubId}/leden/{uid}            bron van waarheid voor toegang
  rol: 'beheerder', email, toegevoegdOp   (rol wordt opgeslagen, nog niet afgedwongen)

clubs/{clubId}/instellingen/profiel   naam, afkorting, seizoen, logo (data:image/-string)
clubs/{clubId}/structuurelementen/{id}  type 'pijler' | 'domein', naam, ...
```

- Waarom twee documenten: `leden/{uid}` maakt de regel eenvoudig (`exists()`) en biedt plek voor rollen en later meerdere clubs. `gebruikers/{uid}` is nodig om na het inloggen met één `getDoc` het clubId te kennen; zonder dat is een collection-group-query nodig.
- Beide documenten zijn voor de app alleen-lezen (`write: if false`). Ze worden aangemaakt door het migratiescript of handmatig in de console, altijd allebei.
- clubId is bewust niet de uid en geen leesbare naam: naam kan wijzigen of botsen, en de naam staat in `clubs/{clubId}.naam`.
- `leden/{uid}` is alleen door de eigen gebruiker leesbaar (geen ledenlijst voor andere leden).

## Hoe `huidigClubId` bepaald wordt

`onAuthStateChanged` (`src/main.js`) roept `laadClub(gebruiker)` aan; die zet `huidigClubId` en `huidigProfiel` en geeft `{ status }` terug. `bepaalClubId` leest `gebruikers/{uid}.clubId` (leeg of niet-string wordt `null`). Nergens anders mag de uid als clubId dienen; alle data-functies gebruiken `huidigClubId`.

| status | wanneer | scherm |
|---|---|---|
| `ok` | clubId gevonden en profiel te lezen (ook als profiel nog niet bestaat) | dashboard, favicon uit logo |
| `geen-club` | geen gebruikersdoc of geen `clubId`, of `permission-denied` bij het profiel (wijzer wijst naar club zonder ledendoc) | "Geen club gekoppeld" |
| `fout` | alle andere fouten (netwerk e.d.) | "Club laden lukt niet" |
| `afgebroken` | tijdens het laden is de gebruiker gewisseld of uitgelogd | niets tonen; de nieuwere aanroep wint |

Bij `geen-club` en `fout` blijft `huidigClubId` `null`. Het vergelijken van `huidigGebruiker?.uid` na elke `await` voorkomt dat een trage oude aanroep state van een nieuwe sessie overschrijft.

## Tussenschermen

Alle drie gebruiken `toonTussenkaart(html, { laden })`, in de stijl van het inlogscherm (`.inlog-wrap`/`.inlog-kaart`) met extra klassen `.tussen-laad-titel`, `.tussen-tekst`, `.tussen-hint`, `.tussen-link` in `src/style.css`. De h1 (`#tussen-titel`) krijgt focus voor schermlezers.

- `renderLaadkaart`: pas na 500 ms getoond (`laadTimer`), zodat snelle laadtijden niet flitsen.
- `renderGeenClub`: toont e-mail en uitlogknop; geen navigatie en geen reads op `clubs/...`.
- `renderFoutkaart`: "Opnieuw proberen" roept `laadClub` opnieuw aan en gaat via `toonUitkomst`. Vanaf de tweede mislukte poging verschijnt een hint met contact.
- `toonUitkomst(gebruiker, status)` is de enige plek die status naar scherm vertaalt.

Contactadres: constante `SUPPORT_EMAIL` bovenaan `src/main.js`. Ingevuld met `support@svn10.nl` (v0.3.1). Leeg zou een zin zonder adres betekenen, nooit een lege link.

## firestore.rules

Het bestand in de repo-root is de bron; publiceren via de console (zie README). Principe: **niets is toegestaan tenzij expliciet genoemd** (default deny). Er is bewust geen wildcard onder `clubs/{clubId}`: een wildcard zou leden automatisch schrijfrechten geven op elke toekomstige collectie.

Per pad:

| Pad | Lezen | Schrijven |
|---|---|---|
| `gebruikers/{uid}` | alleen eigen uid | nooit |
| `clubs/{clubId}` | lid | nooit |
| `clubs/{clubId}/leden/{uid}` | alleen eigen uid | nooit |
| `clubs/{clubId}/instellingen/{docId}` | lid | create/update alleen `docId == 'profiel'` en geldig logo; geen delete |
| `clubs/{clubId}/structuurelementen/{id}` | lid (ook delete) | create/update: `type` in `['pijler','domein']`, `naam` string van max 200 tekens |

Hulpfuncties: `isLid(clubId)` (bestaat `leden/{auth.uid}`; kost één `exists()` per request), `geldigLogo(data)` (logo afwezig, of string die met `data:image/` begint).

### Nieuwe collectie toevoegen

1. Voeg in `firestore.rules` binnen `match /clubs/{clubId}` een eigen `match /{naam}/{id}`-blok toe met `isLid(clubId)` in elke `allow`.
2. Valideer bij `create, update` minimaal type en verplichte velden via `request.resource.data`; geef `delete` alleen als de app het nodig heeft.
3. Zet het blok niet onder `leden` en maak geen wildcard (`{pad=**}`) zonder uitzondering.
4. Voeg scenario's (toegestaan en geweigerd) toe aan de tabel in README, test in de Rules Playground en publiceer.
5. Zonder dit blok geeft de app `permission-denied` op de nieuwe collectie; dat is de bedoeling.

De validatie van het logo staat zowel in de app (`veiligLogo` in `src/main.js`) als in de regels; wijzig ze samen.

## Migratiescript

`scripts/migreer-club.mjs` kopieert `clubs/{uid}` (profiel incl. logo en alle structuurelementen, met dezelfde document-ID's) naar `clubs/{clubId}` en maakt `clubs/{clubId}`, `leden/{uid}` (rol `beheerder`) en `gebruikers/{uid}` aan. Procedure en terugdraaien: zie README.

Ontwerpkeuzes:
- Eén `writeBatch`: alles of niets. `MAX_DOCS = 450`, onder de limiet van 500 per batch.
- `gebruikers/{uid}` staat in dezelfde batch; omdat de batch atomair is, wijst de app nooit naar een half gevulde club.
- Idempotent: bestaat `gebruikers/{uid}.clubId` al, dan wordt dat clubId hergebruikt en blijven `aangemaaktOp` en `toegevoegdOp` behouden. Is het doel al gelijk aan de bron en de koppeling compleet, dan stopt het script met "Niets te doen". Wijkt het doel af, dan volgt een waarschuwing (doorgaan overschrijft met de bronversie).
- Na het schrijven leest het script het doel terug en vergelijkt het met de bron (`gelijk`/`vergelijkClubdata`, diepe vergelijking incl. Firestore-types). Ook de bron wordt opnieuw gelezen: een gewijzigde bron geeft "BRON GEWIJZIGD". Eindigt met `OK` (exitcode 0) of de verschillen (exitcode 1).
- Waarschuwt (kopieert niet) bij onbekende documenten in `instellingen` en bij de oude collecties `pijlers`/`domeinen`.
- `--droog` leest en toont alleen de samenvatting.
- Wachtwoord wordt verborgen ingevoerd en niet via argumenten meegegeven (zichtbaar in proceslijst/shell-history). `scripts/import-hca.mjs` doet dit nu ook zo.
- Overgangsregels in `scripts/firestore.rules.migratie` bevatten de placeholder `<HCA-UID>`; de echte uid hoort nooit in de repo. Ze geven dat ene account toegang tot de hele database en moeten direct na de migratie vervangen worden door `firestore.rules`.

Andere scripts: `import-hca.mjs` en `opschonen-dubbelen.mjs` zoeken het clubId op via `gebruikers/{uid}` en stoppen zonder koppeling. `migrate.mjs` is verouderd (oude uid-structuur) en gemarkeerd als niet meer te gebruiken.

## Openstaand (buiten deze story)
- Rollen afdwingen en uitnodigen via de app (P0d); nu wordt `rol` alleen opgeslagen.
- Zelfregistratie in Firebase Auth uitzetten (console, PO).
- Oude data onder `clubs/{oudeUid}` opruimen: na minimaal één sprint, apart script, expliciet akkoord PO.
- Regels zijn niet met emulator getest; alleen via Rules Playground.
