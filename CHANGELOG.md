# Changelog

## [0.4.1] – 2026-11-22

### Toegevoegd
- Aparte testomgeving (P0e): `npm run dev` draait tegen Firebase-project `svn10-clubkompas-test`; omgevingsbalk bij Test en Productie (lokaal); scripts kiezen hun omgeving met `--omgeving=test|productie` (standaard test, productie alleen na het intypen van de projectnaam); `scripts/seed-testclub.mjs`; regels publiceren met `npm run regels:test` en `npm run regels:productie`.
- Beveiliging omgevingen: de lokale app stopt bij een gemengde configuratie (ontbrekende of niet-passende Firebase-waarden) en bij productie zonder `npm run dev:productie`; scripts weigeren een ingevuld `.env.test.local.voorbeeld`; wachtwoordinvoer negeert pijl- en functietoetsen.
- Token `--on-orange` voor tekst op oranje vlakken.

### Gewijzigd
- Alle scripts gebruiken `scripts/lib/omgeving.mjs`; `scripts/import-hca.mjs` en `scripts/opschonen-dubbelen.mjs` kennen geen `--droog` en stoppen erop; `scripts/migrate.mjs` weigert altijd (verouderd).
- `npm run dev` start in modus `test`; productie lokaal kan alleen met `npm run dev:productie`.
- Technische documentatie: `.claude/docs/P0e-technisch.md`.
- Navigatie en vormgeving sinds 0.4.0 (CK-029 t/m CK-037): rustiger dashboard als Domeinenoverzicht met kerncijfers; uitgelijnde beheertabellen; #hashtag per domein (ook op het dashboard); tekstgroottes volgens de huisstijl; titelbalk 30px; omgeving, versie en rol in de footer; Instellingen opgeheven (Club onder Beheer, Mijn account via je naam); zijmenu en kruimelpad; Home als huisje in het hoofdmenu.

## [0.4.0] – 2026-11-20

### Toegevoegd
- Menu "Beheer" met tabbladen Domeinen en Bestuursfuncties (masterdata).
- Bestuursfuncties beheren; een domein kiest zijn eindverantwoordelijke uit deze lijst (`bestuursfunctieId`).
- Soort domein "overkoepelend" (Projecten, Samenwerkingen) en hun pictogrammen.
- Vaste volgorde en pictogram per domein (CK-027); één begrip "domein" met soorten (CK-026).

### Gewijzigd
- `firestore.rules`: collectie `bestuursfuncties` en type `overkoepelend` toegestaan.

## [0.3.1] – 2026-11-19

### Gewijzigd
- Supportadres `support@svn10.nl` ingevuld op de schermen "Geen club gekoppeld" en "Club laden lukt niet" (klikbare mail-link met onderwerp en account).

### Opgelost
- Clublogo wordt als favicon getoond (type volgt het logo; het element wordt vervangen). Bij logo verwijderen en uitloggen komt het kompas-icoon terug. Safari staat dynamische favicons niet toe en blijft het kompas tonen.

## [0.3.0] – 2026-11-19

### Toegevoegd
- Club is een zelfstandige tenant: `clubs/{clubId}` met lidmaatschap in `clubs/{clubId}/leden/{uid}` en een wijzer `gebruikers/{uid}.clubId`.
- `firestore.rules` in de repo, per collectie expliciet (`instellingen`, `structuurelementen`).
- Tussenschermen: laden, "Geen club gekoppeld" en "Club laden lukt niet" (met opnieuw proberen).
- `scripts/migreer-club.mjs` (eenmalig, `--droog` beschikbaar) en `scripts/firestore.rules.migratie` (overgangsregels).

### Gewijzigd
- `huidigClubId` komt uit `gebruikers/{uid}.clubId` in plaats van de Firebase-uid.
- `scripts/import-hca.mjs` en `scripts/opschonen-dubbelen.mjs` lezen het clubId uit `gebruikers/{uid}` en breken af zonder koppeling; `import-hca.mjs` leest het wachtwoord niet meer uit `argv`.
- Logo wordt alleen geaccepteerd als `data:image/`-string, in app én regels.

### Verwijderd
- Niets. De oude data onder `clubs/{oudeUid}` blijft staan als archief.
