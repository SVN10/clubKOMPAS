# Specificatie: P0a — Firebase Authentication

## Wat wordt er gebouwd?

Een volledige authenticatielaag op basis van Firebase Authentication (e-mail +
wachtwoord). Niet-ingelogde gebruikers zien alleen een inlogscherm. Na inloggen
komt de gebruiker op het bestaande dashboard. Firebase wordt toegevoegd als
dependency; er is nog geen Firebase-project geconfigureerd — dat wordt als
eerste stap opgezet.

## Gebruikersreis (samenvatting)

1. Gebruiker opent de app → ziet inlogscherm (niet het dashboard)
2. Gebruiker vult e-mail + wachtwoord in → klikt op "Inloggen"
3. Bij succes: dashboard geladen, uitlogknop zichtbaar in de topbalk
4. Bij fout: foutmelding onder het formulier, geen redirect
5. Gebruiker klikt op "Uitloggen" → terug naar inlogscherm, sessie gewist

## Betrokken bestanden

- `package.json` — Firebase toevoegen als dependency
- `src/main.js` — auth-state listener toevoegen; dashboard alleen renderen als ingelogd
- `src/style.css` — stijl voor inlogscherm (formulier, foutmelding)
- `src/firebase.js` — **nieuw**: Firebase initialisatie + auth-exports
- `.env` — **nieuw**: Firebase config-keys (worden niet gecommit)

## Acceptatiecriteria

- [ ] Niet-ingelogde gebruiker ziet alleen het inlogscherm, nooit het dashboard
- [ ] Inloggen met geldig e-mail + wachtwoord werkt
- [ ] Foutmelding verschijnt bij ongeldig e-mail, verkeerd wachtwoord of leeg veld
- [ ] Uitlogknop is zichtbaar na inloggen en logt de gebruiker correct uit
- [ ] Pagina herladen terwijl ingelogd → gebruiker blijft ingelogd (sessie persistent)

## Wat mag er niet kapotgaan?

- Bestaande pijler-functionaliteit (CK-010): aanmaken, weergeven, localStorage
- Huisstijl en responsive layout
- Build (`npm run build`) slaagt zonder fouten

## Architectuurlaag

**Platform-laag P0** — authenticatie is generieke infrastructuur, niet
clubspecifiek. Elke tenant (club) gebruikt dezelfde auth-laag.

## Randgevallen en risico's

- Firebase-project bestaat nog niet: bouwer moet dit als eerste aanmaken en de
  config-keys aanleveren (of Paul doet dit handmatig in de Firebase Console)
- `.env` met API-keys mag niet in git terechtkomen → `.gitignore` controleren
- Firebase SDK bundle-grootte: Vite tree-shaking houdt dit beperkt als we
  alleen `firebase/auth` importeren
- Wachtwoord vergeten-flow: **buiten scope** voor P0a, kan later als P0a-bis
