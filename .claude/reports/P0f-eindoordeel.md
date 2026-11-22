# Eindoordeel: P0f — Eigen adressen voor live en online test

Beoordeeld op 22 november 2026. Gelezen: spec `P0f-adressen.md` met alle bijstellingen, `P0f-gebruikersreis.md`, `P0f-ontwerp.md`, `P0f-bouwverslag.md` met de herstelronde, de vijf kwaliteitsrapporten, README "Omgevingen" en de P0f-sectie in `.claude/docs/P0e-technisch.md`. Daarnaast heb ik zelf `src/firebase.js`, `vite.config.js` en de bijbehorende delen van `src/main.js` nagelopen. Er is geen code gewijzigd.

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen | Na de herstelronde |
|-------|-----------|---------|---------------------|--------------------|
| Functioneel testen | Tester | ✅ | 0 | Aandachtspunt 1 (preview zonder label start als productie) is opgelost: zo'n preview stopt nu. Punt 3 (technische docs) is ook gedaan. |
| Huisstijl | Huisstijl | ✅ | 0 | Er was niets te verwerken. Geen CSS gewijzigd. |
| Beveiliging | Beveiliging | ✅ | 0 | Het 🟡 punt (bevinding 1) is opgelost. Bevindingen 3, 4, 5, 7 en 8 zijn verwerkt. Bevinding 2 (API-keybeperking) is bewust uitgesteld naar de backlog. Bevinding 6 is een controlepunt in README stap 1. |
| Compliance | Compliance | ✅ | 0 | De punten 4 (bericht aan HCA) en 6 (volgorde bij opheffen) zijn verwerkt, punt 2 deels (uitwijkroute). De drie 🟡 punten over Vercel bestonden al vóór P0f en zijn door Paul geaccepteerd tot een tweede club of een betaalde afspraak. |
| Toegankelijkheid | Toegankelijkheid | ✅ | 0 | Geen actie nodig. Twee punten zijn alleen in de browser te controleren (balk op 320 px, M16). |

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs (`.claude/docs/P0e-technisch.md`, sectie P0f) | ✅ Klopt met de code (SOORT-tabel regels 1–7, configFout, `__VERCEL_ENV__`, buildstop, beperking). |
| Gebruikersdocs (README "Omgevingen" en "Online test en werkwijze branch `test`") | ✅ Stappen 0–7 staan in de juiste volgorde, met controles, met de tabel "Als `tst.` niet klopt" en met de uitwijkroute. |
| CHANGELOG | ✅ Onder "Ongepubliceerd". |
| Kleine restpunten | Spec §3 stap 7 en gebruikersreis A7/D3 rij 2 noemen nog de oude volgorde en het oude gedrag. De bijstelling onderaan de spec dekt dat, en de README is leidend. Dit blokkeert niets. |

## Kernpunt zelf gecontroleerd (`src/firebase.js`, `vite.config.js`)

- **Live breekt nooit en toont geen balk.** Bij `VERCEL_ENV === 'production'` is `nietLive` onwaar. Daardoor kunnen `test-met-productie` en de online `gemengde-config` daar nooit optreden. Alleen `geen-config` blijft mogelijk: dat is ongewijzigd gedrag en treedt alleen op zonder project-ID. Met het productieproject wordt SOORT altijd `productie` (regel 28). `OMGEVINGS_BALK` heeft geen variant voor `productie`, dus er komt geen balk. Een afwijkend label of een niet-passende configuratie geeft alleen een `console.warn`.
- **Een preview met het productieproject stopt altijd.** Bij `VERCEL_ENV` `preview` of `development` en het productieproject wordt SOORT `test` of `ontwikkel` (regel 29). Dat maakt de configFout `test-met-productie`, welk label er ook staat (leeg, `Test`, `Productie` of onzin). Firebase start dan niet.
- **Vangnet:** draait de build op Vercel zonder `VERCEL_ENV`, dan faalt de build (`vite.config.js` regel 25). Vercel houdt in dat geval de vorige deploy actief, dus live blijft draaien, alleen de nieuwe versie komt dan niet online.
- Project-ID's worden overal exact vergeleken (`===`). De P0e-sloten voor lokaal werk zijn ongewijzigd.

## Aandachtspunten voor Paul

1. **Commit alleen P0f.** In `git status` staan ook `CK-020-besluiten.md` en `CK-020-bron-vermogensoverzicht.md`. Die horen niet bij P0f. Laat ze buiten deze commit, of commit ze apart.
2. **Hoe zie je of de nieuwe code live staat?** Het versienummer blijft 0.4.1, en live toont geen buildtijd. Er zijn twee mogelijkheden:
   - verhoog vóór de commit de versie naar 0.4.2 en zet de CHANGELOG-kop op die versie (zoals bij 0.4.1);
   - of kijk in Vercel → Deployments of de Production-deploy van deze commit "Ready" en "Current" is.
3. **Het eerste risico na de push is een mislukte build, geen kapotte site.** Faalt de build met "[clubKOMPAS] Build gestopt: VERCEL is gezet maar VERCEL_ENV is leeg", dan blijft live gewoon op de oude versie draaien. Controleer dan de systeemvariabelen (README stap 3, laatste punt) en doe een Redeploy.
4. **Push naar `main` mag vóór stap 3.** Een push naar `main` maakt geen preview aan. Pas de branch `test` moet wachten tot de Preview-variabelen gescheiden zijn. De nieuwe code is ook juist veiliger zolang Preview nog productiewaarden heeft: elke preview die nu per ongeluk ontstaat, stopt.
5. **Stap 1 afronden:** heb je in beide Firebase-projecten ook gecontroleerd dat zelfregistratie uit staat? Dat staat in README stap 1, tweede punt.
6. **Backlog (hoofdsessie):** de P0f-stand bijwerken, plus de API-keybeperking (de README verwijst ernaar), het besluit over Vercel Pro en de DPA vóór een tweede club, het verwerkingsregister, en straks de opheffingsdatum van `dev.`.

## Blokkades

Geen.

## Checklist

### A. Vóór commit (5 minuten)
- [ ] `git status`: alleen de P0f-bestanden (`src/firebase.js`, `src/main.js`, `vite.config.js`, `.env.test.local.voorbeeld`, `README.md`, `CHANGELOG.md`, `.claude/docs/P0e-technisch.md`, `.claude/specs/P0e-gebruikersreis.md` als dat bewust is, de P0f-specs en -rapporten, en de backlog). Geen CK-020-bestanden en geen `.env*.local`.
- [ ] Besluit: versie naar 0.4.2, of controleren via Vercel Deployments (aandachtspunt 2).
- [ ] Backlog P0f bijgewerkt (aandachtspunt 6).
- [ ] Optioneel, 1 minuut: `npm run dev`. Je ziet de petrol balk "Ontwikkelomgeving · op deze computer · project svn10-clubkompas-test · fictieve data" en de footer "Ontwikkel · Versie …".
- [ ] Stap 0 gedaan: schermafdruk van Vercel → Settings → Environment Variables.

### B. Volgorde van de handmatige stappen, met controles

**Stap 1 — Authorized domains (gedaan)**
- [ ] Je hebt het domein onder het juiste project gecontroleerd (`clubkompas.svn10.nl` in `svn10-clubkompas`, `tst.clubkompas.svn10.nl` in `svn10-clubkompas-test`).
- [ ] In beide projecten staat "Enable create (sign-up)" uit.

**Stap 2 — Live-domein en Hostnet (bezig)**
- [ ] Vercel → Domains toont bij `clubkompas.svn10.nl` "Valid Configuration" en een certificaat. Open het adres pas daarna.
- [ ] Terminal: `dig @ns01.hostnet.nl clubkompas.svn10.nl CNAME +short` toont precies de waarde die Vercel aangeeft, zonder `.svn10.nl` erachter.
- [ ] Browser: zie C1.

**Commit en push naar `main` (Claude, als jij "Commit and push" zegt)**
Dit kan vóór, tijdens of na stap 2, want het domein en de code staan los van elkaar.
- [ ] Vercel → Deployments: de Production-deploy van deze commit staat op "Ready" (niet "Error").
- [ ] Browser: zie C2, op `dev.clubkompas.svn10.nl` en, zodra stap 2 groen is, ook op `clubkompas.svn10.nl`.
- [ ] Klopt er iets niet: Vercel → Deployments → vorige Production-deploy → "Instant Rollback" of "Promote to Production". Daarna melden.

**Stap 3 — Vercel-variabelen scheiden (vóór de branch `test`)**
- [ ] Bij de zes `VITE_FIREBASE_*` en `VITE_OMGEVING=Productie` zijn Preview en Development uitgevinkt, alleen Production blijft aan.
- [ ] De zes `VITE_FIREBASE_*` zijn opnieuw toegevoegd met de testwaarden, en `VITE_OMGEVING=Test` is toegevoegd. Alles alleen voor Preview en voor alle branches. Kijk vóór Save of Production niet aangevinkt staat.
- [ ] In de lijst staat elk van de zeven sleutels twee keer: één regel Production, één regel Preview. Nergens staan er twee omgevingen op één regel.
- [ ] Production niet opnieuw deployen. Live blijft zoals het is, want de Production-waarden zijn niet aangeraakt.

**Branch `test` aanmaken en pushen (Claude, op jouw verzoek)**
- [ ] Vercel → Deployments: de Preview-build van `test` staat op "Ready".
- [ ] Browser: zie C3, op het `…vercel.app`-adres van die deploy.

**Stap 5 — Testdomein en Deployment Protection**
- [ ] Vercel → Domains: `tst.clubkompas.svn10.nl` staat op **Preview**, Git branch **`test`** (niet Production), met "Valid Configuration" en een certificaat.
- [ ] Terminal: `dig @ns01.hostnet.nl tst.clubkompas.svn10.nl CNAME +short` toont de Vercel-waarde.
- [ ] Browser: zie C4.

**Stap 6 — HCA informeren, daarna `dev.` doorsturen**
- [ ] Het bericht aan HCA is verstuurd, met beide datums ingevuld (concept in `P0f-gebruikersreis.md`, reis C).
- [ ] In Vercel staat bij `dev.clubkompas.svn10.nl` een Redirect naar `clubkompas.svn10.nl` met **307**.
- [ ] Browser: zie C5.
- [ ] De opheffingsdatum (4 weken na het bericht) staat in de backlog.

**Stap 7 — Opheffen na 4 weken, in deze volgorde**
- [ ] Eerst de CNAME `dev.clubkompas` bij Hostnet weghalen. Controleer daarna dat `dig @ns01.hostnet.nl dev.clubkompas.svn10.nl CNAME +short` leeg is.
- [ ] Daarna in Vercel het domein `dev.` verwijderen, in Firebase productie het authorized domain `dev.clubkompas.svn10.nl` weghalen, en eventueel de API-keybeperking aanpassen.

### C. Wat je in de browser checkt (altijd met een harde herlaadactie: Cmd+Shift+R)

- **C1 — `https://clubkompas.svn10.nl` na stap 2:** geen balk, tabtitel "clubKOMPAS", footer "Productie · Versie 0.4.x". Inloggen met je eigen account lukt en de HCA-data is zichtbaar. `dev.clubkompas.svn10.nl` werkt nog.
- **C2 — live na de push (beide adressen):** dezelfde punten als C1, en daarnaast:
  - geen pagina die met "Gestopt" begint;
  - het nieuwe versienummer staat er (als je de versie hebt verhoogd);
  - DevTools → Console toont **geen** regel die begint met `[clubKOMPAS]`. Staat er toch zo'n regel, dan is het label of de configuratie in Vercel Production niet helemaal goed. Live werkt dan wel, maar meld het.
- **C3 — eerste preview van `test` (`…vercel.app`, na de Vercel-login):**
  - petrol balk "Testomgeving · online · project svn10-clubkompas-test · fictieve data", footer "Test · Versie …", tabtitel "TEST · clubKOMPAS";
  - zie je "Gestopt: deze testomgeving wijst naar de echte clubdata", dan werkt het slot. Stap 3 klopt dan niet: corrigeer de variabelen en doe een Redeploy van `test`. Er is niets gelezen of opgeslagen.
- **C4 — `https://tst.clubkompas.svn10.nl`:**
  - in een privévenster zie je eerst het Vercel-inlogscherm;
  - daarna dezelfde balk, footer en tabtitel als C3;
  - inloggen met `test-beheerder@svn10.nl` geeft "Testclub clubKOMPAS";
  - je eigen HCA-account werkt hier **niet**;
  - zie je geen balk, log dan niet in. Kijk in de README-tabel "Als `tst.` niet klopt".
- **C5 — na de redirect:** `https://dev.clubkompas.svn10.nl` en `https://dev.clubkompas.svn10.nl/#/iets` komen allebei uit op `https://clubkompas.svn10.nl`, waar je opnieuw moet inloggen.
- **Optioneel, op elk moment:** zet DevTools op 320–400 px breed. De balk mag over twee à drie regels breken, maar er mag geen horizontale scrollbalk komen.

## Mijn aanbeveling

**🟢 GO — klaar voor jouw "Commit and push" naar `main`**

Er zijn geen kritieke bevindingen. Het 🟡 beveiligingspunt is opgelost. Live (Vercel Production) kan door deze code niet stoppen en krijgt geen balk. Elke preview die naar het productieproject wijst, stopt. De resterende 🟡 punten (Vercel Hobby, DPA, register) bestonden al vóór P0f en heb je bewust geaccepteerd tot een tweede club of een betaalde afspraak. Het grootste praktische risico is een mislukte build, en dan blijft de huidige live versie gewoon staan.

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
