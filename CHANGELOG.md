# Changelog

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
