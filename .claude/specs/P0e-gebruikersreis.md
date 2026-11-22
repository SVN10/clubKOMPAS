# Gebruikersreis: P0e — Aparte testomgeving

## Gebruiker
Paul, product owner van clubKOMPAS en beheerder bij HCA. Geen ontwikkelaar, wel gewend aan de Firebase-console, de terminal (kopiëren en plakken van commando's) en de scripts in `scripts/`. Hij wil nieuwe dingen (straks CK-020) kunnen uitproberen **zonder ooit per ongeluk de echte HCA-data te raken**. En hij wil op elk moment kunnen zien waar hij zit: test of productie.

## Huidige situatie
- Er is maar één Firebase-project (`svn10-clubkompas`). `npm run dev` op de laptop werkt direct op de echte HCA-data.
- De footer toont lokaal "Ontwikkel" of "Productie", maar dat zegt niet tegen welk project de app praat.
- Scripts lezen `.env` en schrijven altijd naar productie. Het enige vangnet is de "ja"-vraag.
- Regels worden in de productieconsole geplakt en daar uitgeprobeerd. Tijdens P0c ging dat al een keer mis (per ongeluk gepubliceerd).

Gevolg: elke proef is een proef op echte clubdata.

---

## Reis A — Eenmalig inrichten (Firebase-console en Vercel)

### Stap A1: Testproject aanmaken
**Situatie:** Paul is ingelogd op console.firebase.google.com en ziet het project `svn10-clubkompas`.
**Actie:** Hij klikt **Project toevoegen**, noemt het `clubkompas-test` en zet Google Analytics uit.
**Resultaat:** Er staat een tweede projectkaart naast de productiekaart. Paul noteert de project-ID die onder de naam staat (kan een achtervoegsel hebben, bv. `clubkompas-test-3f2a1`) en geeft die door aan de bouwer.

> Tip voor herkenbaarheid: in de testconsole staat de projectnaam linksboven. Daar kijkt Paul voortaan altijd eerst naar voordat hij iets wijzigt.

### Stap A2: Web-app registreren
**Situatie:** Projectinstellingen van het testproject.
**Actie:** Paul klikt bij **Je apps** op `</>`, bijnaam `clubKOMPAS test`, Hosting niet aanvinken, Registreren.
**Resultaat:** Hij ziet een blok met zes waarden (`apiKey`, `authDomain`, ...). Die gaan naar `.env.test.local` (door de bouwer of door Paul zelf volgens het voorbeeld in de README).

### Stap A3: Inloggen met e-mail en wachtwoord aanzetten
**Actie:** Authentication → Aanmeldmethode → E-mail/wachtwoord aan → Opslaan.
**Resultaat:** De methode staat op "Ingeschakeld".

### Stap A4: Firestore aanmaken
**Actie:** Firestore Database → Database maken → Standard → **dezelfde locatie als productie** → Starten in productiemodus.
**Resultaat:** Lege database, alles dicht.
**Valkuil:** de locatie is daarna niet meer te wijzigen. Paul zoekt eerst in de productieconsole de locatie op (Projectinstellingen → "Standaardlocatie voor Google Cloud-resources").

### Stap A5: Regels publiceren (en eenmalig inloggen met de CLI)
Zie reis D. Dit moet **vóór** stap A7, anders mag het seed-script niets schrijven.

### Stap A6: Testgebruiker en testclub koppelen
**Situatie:** Testconsole (Paul controleert linksboven: `clubkompas-test`).
**Actie:** Gebruiker `test-beheerder@svn10.nl` aanmaken en de uid noteren. Daarna `clubs` (automatische ID, noteert testclubId) → `leden/{uid}` met `rol: beheerder` → `gebruikers/{uid}` met `clubId`.
**Resultaat:** Drie documenten in Firestore. Het wachtwoord staat alleen in zijn wachtwoordmanager.
**Valkuil:** dit is de foutgevoeligste stap (uid overtypen, veldnaam `clubId` met hoofdletter I, rol als string). Zie de meldingen bij reis C/A7: die moeten precies zeggen welk document ontbreekt.

### Stap A7: Testclub vullen
**Actie:** `node scripts/seed-testclub.mjs --droog`, daarna zonder `--droog`.
**Resultaat:** Paul ziet de kopregel, logt in met de testgebruiker, ziet wat er komt, typt "ja", en ziet in de console 15 domeinen en 6 bestuursfuncties verschijnen. Tweede keer draaien geeft "0 toegevoegd, 21 bijgewerkt" en geen dubbelen.

### Stap A8: Vercel controleren (niets wijzigen)
**Situatie:** vercel.com → project clubKOMPAS → Settings → Environment Variables.
**Actie:** Paul kijkt of `VITE_OMGEVING=Productie` en de zes `VITE_FIREBASE_*`-waarden er staan, en bij welke omgevingen ze aangevinkt zijn (Production / Preview / Development).
**Resultaat:** Hij weet zeker dat de live site haar instellingen uit Vercel haalt en niet uit zijn laptop. Er verandert niets.
**Valkuil:** zie pijnpunt "Vercel-previews" hieronder.

---

## Reis B — Dagelijks lokaal testen

### Stap B1: App starten
**Situatie:** Terminal in de projectmap.
**Actie:** `npm run dev`, browser naar localhost:5173.
**Resultaat:** Het inlogscherm. Onderaan in de footer: **"Test · Versie 0.x"**.

### Stap B2: Inloggen
**Actie:** Paul logt in met de testgebruiker.
**Resultaat:** Home toont "Testclub clubKOMPAS" met 15 domeinen. Clubnaam en footer zeggen allebei "test".
**Valkuil:** Paul typt uit gewoonte zijn HCA-account. Dat bestaat niet in test, dus inloggen mislukt. Zie melding M5.

### Stap B3: Noodgeval: lokaal tegen productie
**Actie:** `npm run dev:productie` (alleen bewust, bijvoorbeeld om een melding van een HCA-gebruiker na te spelen).
**Resultaat:** De footer toont in oranje **"Productie (lokaal) · Versie 0.x"**. Paul ziet in één oogopslag dat hij op echte data zit.

### Wat Paul ziet als het niet klopt
| Situatie | Wat Paul ziet |
|---|---|
| `.env.test.local` ontbreekt of is leeg | M1, in plaats van het inlogscherm |
| Er staat nog een oude `.env` met productiewaarden, of het testbestand bevat per ongeluk productiewaarden | M2, in plaats van het inlogscherm; Firebase start niet |
| Ingelogd, maar er is geen `gebruikers/{uid}` of geen lidmaatschap | M6 |

---

## Reis C — Scripts draaien

### Stap C1: Script tegen test (standaard)
**Actie:** bv. `node scripts/import-hca.mjs --droog`
**Resultaat:** Als allereerste regel, vóór de inlogvraag:
```
DOEL: TEST — project clubkompas-test
```
Daarna gaat alles zoals Paul gewend is: e-mail, verborgen wachtwoord, overzicht, "ja".

### Stap C2: Script tegen productie (bewust)
**Actie:** `node scripts/import-hca.mjs --omgeving=productie`
**Resultaat:**
```
DOEL: PRODUCTIE — project svn10-clubkompas (echte clubdata)
Dit script schrijft in de echte clubdata.
Typ de projectnaam svn10-clubkompas om door te gaan (iets anders = stoppen):
```
Typt Paul iets anders, dan: M9. Typt hij het goed, dan volgt de bekende inlog en "ja"-vraag.
Met `--droog` hoeft hij de projectnaam niet te typen; de kopregel staat er wel.

### Stap C3: Seed-script tegen productie
**Actie:** `node scripts/seed-testclub.mjs --omgeving=productie`
**Resultaat:** M10. Er gebeurt niets, ook niet met bevestiging.

---

## Reis D — Regels publiceren (eerst test, dan productie)

### Stap D1: Eenmalig inloggen bij de Firebase CLI
**Actie:** `npx firebase login`
**Resultaat:** De browser opent, Paul kiest het Google-account waarmee hij in de Firebase-console werkt, en de terminal meldt "Success! Logged in as ...". Eén keer per computer.

### Stap D2: Naar test
**Actie:** `npm run regels:test`
**Resultaat:** Kopregel `REGELS NAAR: TEST — project clubkompas-test`, daarna de Firebase-uitvoer eindigend op **"Deploy complete!"**. Controle: testconsole → Firestore → Regels toont dezelfde tekst en een nieuwe publicatietijd.

### Stap D3: Testen in test
**Actie:** Paul gebruikt de app (reis B) en/of de Rules Playground **in de testconsole**.
**Resultaat:** Hij ziet of de nieuwe regels doen wat ze moeten doen, zonder risico.

### Stap D4: Naar productie
**Actie:** `npm run regels:productie`
**Resultaat (voorstel, zie spec-bijstelling 1):**
```
REGELS NAAR: PRODUCTIE — project svn10-clubkompas (echte clubdata)
Heb je deze regels eerst in test gepubliceerd en gecontroleerd?
Typ de projectnaam svn10-clubkompas om te publiceren (iets anders = stoppen):
```
Daarna "Deploy complete!". Controle in de productieconsole.

### Terugval
Lukt de CLI niet, dan plakt Paul `firestore.rules` in de console (eerst test, dan productie), zoals nu.

---

## Meldingen (concrete teksten)

Algemene regel: elke melding zegt **wat er aan de hand is**, **wat er níet gebeurd is** (geruststelling) en **wat Paul nu moet doen**.

**In de app (pagina in plaats van het inlogscherm)**

- **M1 — Geen configuratie**
  > **Geen verbinding ingesteld.** De app weet niet met welke database hij moet praten: het bestand `.env.test.local` ontbreekt of is leeg. Zet de zes Firebase-waarden van het testproject in dat bestand (zie README, "Omgevingen") en start `npm run dev` opnieuw.

- **M2 — Lokale app wijst naar productie**
  > **Gestopt: deze lokale app wijst naar de echte clubdata (svn10-clubkompas).** Er is niets gelezen of opgeslagen. Waarschijnlijk staat er nog een oud bestand `.env` in de projectmap, of staan er productiewaarden in `.env.test.local`. Verwijder `.env`, controleer `.env.test.local` en start opnieuw met `npm run dev`. Bewust op productie werken? Gebruik `npm run dev:productie`.

- **M5 — Inloggen mislukt in test** (aanvulling op de bestaande foutmelding, alleen als omgeving Test is)
  > E-mailadres of wachtwoord klopt niet. Let op: je zit in de **testomgeving**. Gebruik je testaccount, niet je gewone clubKOMPAS-account.

- **M6 — Ingelogd maar niet gekoppeld aan een club**
  > Je bent ingelogd, maar dit account is nog niet aan een club gekoppeld. Vraag de beheerder om je toe te voegen. *(In Test extra regel:)* Controleer in de testconsole of `gebruikers/{uid}` bestaat met het veld `clubId`, en of `clubs/{clubId}/leden/{uid}` bestaat.

**In de scripts (terminal)**

- **M3 — Omgevingsbestand ontbreekt**
  > Gestopt: het bestand `.env.test.local` ontbreekt. Dit script weet daardoor niet met welk project het moet werken. Er is niets geschreven. Zie README, "Omgevingen". *(Bij productie: `.env.productie.local`.)*

- **M4 — Bestand past niet bij de gekozen omgeving**
  > Gestopt: je koos TEST, maar `.env.test.local` wijst naar het productieproject `svn10-clubkompas`. Er is niets geschreven. Zet de waarden van `clubkompas-test` in dat bestand.
  >
  > Gestopt: je koos PRODUCTIE, maar `.env.productie.local` wijst naar `<project-id>` in plaats van `svn10-clubkompas`. Er is niets geschreven.

- **M7 — Onbekende omgeving**
  > Gestopt: onbekende omgeving "prod". Kies `--omgeving=test` of `--omgeving=productie`. Er is niets geschreven.

- **M8 — Oude `.env` gevonden (waarschuwing, script gaat door)**
  > Let op: er staat nog een bestand `.env` in de projectmap. Scripts gebruiken het niet meer, maar de lokale app kan erdoor in de war raken. Verwijder het of verplaats de inhoud naar `.env.productie.local`.

- **M9 — Productiebevestiging fout**
  > Afgebroken: de projectnaam klopte niet. Er is niets geschreven.

- **M10 — Seed-script tegen productie**
  > Gestopt: het seed-script vult alleen de testclub en draait nooit tegen productie. Er is niets geschreven.

- **M11 — Testgebruiker niet gekoppeld** (seed-script en andere scripts na inloggen)
  > Ingelogd als test-beheerder@svn10.nl, maar er is geen document `gebruikers/<uid>` met een `clubId` in project clubkompas-test. Maak het aan in de testconsole (README, stap 6) en draai het script opnieuw. Er is niets geschreven.

- **M12 — Geen schrijfrechten** (vertaling van `permission-denied`)
  > Firestore weigert het schrijven in clubkompas-test. Er is niets geschreven. Meest waarschijnlijke oorzaken: (1) de regels staan nog niet in test, draai `npm run regels:test`; (2) de testgebruiker is geen beheerder, controleer `clubs/<clubId>/leden/<uid>` met `rol` = `beheerder`.

- **M13 — Inloggen mislukt in een script**
  > Inloggen mislukt bij project clubkompas-test. Controleer e-mail en wachtwoord. Let op: je testaccount en je gewone account zijn verschillende accounts in verschillende projecten.

**Bij regels publiceren**

- **M14 — Niet ingelogd bij de Firebase CLI** (Firebase zelf zegt: "Failed to authenticate, have you run firebase login?")
  > Je bent op deze computer nog niet ingelogd bij Firebase. Draai eenmalig `npx firebase login` en probeer het opnieuw. Er is niets gepubliceerd.

- **M15 — Geen toegang tot het project** (Firebase: "403" / "does not have permission")
  > Het Google-account waarmee je bij de Firebase CLI bent ingelogd heeft geen toegang tot dit project. Controleer met `npx firebase login:list` welk account het is; wissel zo nodig met `npx firebase logout` en `npx firebase login`. Er is niets gepubliceerd.

---

## Navigatieroute
- Inrichten: Firebase-console → Project toevoegen → Projectinstellingen (web-app) → Authentication → Firestore → terminal `npx firebase login` → `npm run regels:test` → console: gebruiker + 3 documenten → terminal `seed-testclub --droog` → `seed-testclub` → Vercel → Settings → Environment Variables (alleen kijken).
- Dagelijks: terminal `npm run dev` → localhost:5173 (footer "Test") → inloggen testaccount → Home testclub.
- Script: terminal → kopregel "DOEL: TEST" → inloggen → overzicht → "ja". Productie: `--omgeving=productie` → kopregel PRODUCTIE → projectnaam typen → inloggen → "ja".
- Regels: `npm run regels:test` → testen in app/Playground (testconsole) → `npm run regels:productie` → projectnaam typen → controle productieconsole.

## Pijnpunten en keuzes
- **Vergeten in te loggen bij de Firebase CLI**: de ruwe Firebase-melding is Engels en cryptisch. Oplossing: README noemt `npx firebase login` als eerste stap; liefst een klein wrapper-script dat M14 toont (zie bijstelling 1).
- **Verkeerd Google-account in de CLI**: komt voor als Paul meerdere Google-accounts heeft. M15 plus `firebase login:list` in de README.
- **Regels naar productie zonder drempel**: in de spec is `npm run regels:productie` één commando zonder bevestiging, terwijl scripts wél een projectnaam-check hebben. Juist regels zijn eerder misgegaan. Oplossing: dezelfde bevestiging (bijstelling 1).
- **Oude `.env` of verkeerde waarden in `.env.test.local`**: M2 in de app, M4/M8 in scripts. Nooit stilletjes doorwerken.
- **Testgebruiker niet gekoppeld aan testclub**: grootste kans op vastlopen bij de eerste keer. Meldingen M6, M11 en M12 noemen het exacte document dat ontbreekt.
- **Volgorde regels vóór seed**: het testproject start "alles dicht". Seed vóór regels geeft `permission-denied`. M12 noemt dit als eerste oorzaak; README zet regels als stap 5, seed als stap 7.
- **HCA-account gebruiken in test**: inloggen faalt. M5/M13 maken duidelijk dat het om twee aparte accounts gaat.
- **Vergeten waar je zit**: footer "Test" is klein. Kopregel in scripts is altijd de eerste regel. In de app is de testclubnaam op Home een tweede herkenningspunt; overweeg een smalle gekleurde balk bovenaan bij Test (keuze voor de Ontwerp-medewerker, niet verplicht).
- **Na `git pull` geen `npm install`**: dan is `firebase-tools` er nog niet en downloadt `npx` hem (traag) of faalt. README: "na het bijwerken eenmalig `npm install`".
- **Vercel-previews**: als de productiewaarden in Vercel ook bij "Preview" zijn aangevinkt, praat elke preview-deploy van een andere branch met de echte data. Valt buiten P0e, maar Paul moet het bij stap A8 zien en noteren.
- **Lokaal `npm run build` / `npm run preview`**: werkt na het verdwijnen van `.env` niet meer tegen een project (toont M1). Geen probleem voor Vercel, maar wel even in de README zetten om verwarring te voorkomen.

## Wat de Ontwerp-medewerker nodig heeft
- **Schermen:** geen nieuwe schermen. Wel één foutpagina-variant (M1/M2) die in plaats van het inlogscherm verschijnt: titel, uitleg, wat te doen; geen knoppen nodig behalve eventueel "Opnieuw laden".
- **Footer:** drie varianten: "Test · Versie …" (neutraal), "Productie · Versie …" (live, ongewijzigd), "Productie (lokaal) · Versie …" in oranje `#FF9E16`.
- **Inlogscherm:** bij Test een korte hint onder de foutmelding (M5). Optioneel een vaste regel "Testomgeving" boven het formulier.
- **Optioneel:** smalle balk bovenaan bij Test/Productie (lokaal). Alleen als het de huisstijl niet verstoort.
- **Terminal-teksten:** kopregels en meldingen M3–M15 zijn tekst, geen ontwerp; graag consistent hoofdletters "TEST"/"PRODUCTIE" en altijd de zin "Er is niets geschreven/gepubliceerd" bij een stop.
