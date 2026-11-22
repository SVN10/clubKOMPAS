# Beveiligingsrapport: P0f — Eigen adressen voor live en online test

Gescand: de nog niet gecommitte wijzigingen in `src/firebase.js`, `src/main.js`, `vite.config.js`, `.env.test.local.voorbeeld` en `README.md`, tegen `P0f-adressen.md`, `P0f-gebruikersreis.md`, `P0f-ontwerp.md` en `P0f-bouwverslag.md`. Er is niet ingelogd, er is niets gedeployd en er is alleen dit rapport geschreven.

## Gecontroleerd zonder bevinding

- **XSS in de balk, footer, foutpagina's en M16.** `location.host` gaat in M16 alleen via `textContent` en `createElement` de pagina in (`src/main.js:431-448`). `projectId`, `MODE` en `uid` gaan altijd via `esc()`. Ook in het `title`-attribuut van de footer is dat veilig, want het attribuut gebruikt dubbele aanhalingstekens en `esc()` codeert `"`. `OMGEVING_LABEL` komt nu uit een vaste tabel en niet meer rechtstreeks uit `VITE_OMGEVING`. Dat is een verbetering: vroeger kwam het label onbewerkt uit de build-env.
- **Live breekt niet** (mits `VERCEL_ENV` bij de build gevuld is, zie bevinding 4). Bij `VERCEL_ENV === 'production'` kan `configFout` alleen `geen-config` zijn. Live met het productieproject krijgt nooit een balk "fictieve data". Live met een testproject krijgt wel een balk, en dat klopt ook.
- **Online foutpagina's** verschijnen alleen bij `nietLive`. Ze tonen geen geheimen: alleen project-ID's (die staan toch al in de bundle), Vercel-menunamen en variabelenamen. Bestandsnamen staan alleen in de lokale variant.
- **307-doorsturing van `dev.`** gaat naar een vast doel. Er is geen open redirect.
- **`verifyBeforeUpdateEmail`** wordt aangeroepen zonder `actionCodeSettings`, dus zonder continue-URL. Authorized domains spelen daar geen rol.
- **`.gitignore`** sluit `.env`, `.env.local`, `.env.*.local` en `*.local` uit. `.env.test.local.voorbeeld` bevat geen waarden.
- Er zijn geen nieuwe dependencies.

## Bevindingen

### Bevinding 1: Preview met productiewaarden zonder (of met "Productie"-)label start zonder balk en zonder stop
**Ernst:** 🟡 Hoog
**Type:** Blootgestelde data / omgevingsscheiding
**Locatie:** `src/firebase.js:25-27` (SOORT-regel 5) en `src/firebase.js:46-51` (configFout)
**Probleem:** Een build met `VERCEL_ENV=preview` en de productiewaarden krijgt `SOORT = 'productie'` en `configFout = null` als `VITE_OMGEVING` leeg, onbekend of `Productie` is. Hij toont dan geen balk en praat met de echte HCA-data. Dat is precies de huidige situatie zolang stap 3 niet gedaan is, of als `VITE_OMGEVING=Productie` per ongeluk ook bij Preview aangevinkt blijft. In die situatie draait ongeteste code van een willekeurige branch (ook `test` op `tst.`) tegen productie. De enige bescherming is de vuistregel "geen balk = live", maar op `tst.` is juist het ontbreken van iets het signaal, en dat valt makkelijk niet op. De spec (`P0f-adressen.md:91,159`) accepteert dit tijdelijk. Toch is er geen enkele legitieme reden waarom een Vercel-Preview ooit met het productieproject zou mogen praten.
Daarbij is de README-tabel "Als `tst.` niet klopt", rij 2 ("Geen balk, footer Productie, HCA-account werkt **niet**"), onjuist. Met de productiewaarden werkt het HCA-account daar gewoon, want e-mail/wachtwoord-inlog wordt niet door Authorized domains tegengehouden (zie bevinding 2). Paul ziet dan rij 1 ("dit is live, domein aan Production gekoppeld") en zoekt de oorzaak op de verkeerde plek.
**Aanbeveling:** Stop elke Preview die naar het productieproject wijst, ongeacht het label. Dit raakt live niet:
```js
: nietLive && isProd && (VERCEL_ENV === 'preview' || SOORT === 'test' || SOORT === 'ontwikkel') ? 'test-met-productie'
```
Pas ook de warn- en SOORT-logica aan, zodat een Preview met het productieproject niet als `productie` wordt gelabeld. Herschrijf README-rij 2: "Geen balk, footer Productie (HCA-account werkt wel of niet): Preview gebruikt productiewaarden. Niet inloggen, stap 3 nakijken, Redeploy." Voeg nep-env-test 8 toe: `VERCEL_ENV=preview` zonder label met productiewaarden geeft `test-met-productie`. Bij voorkeur doorvoeren vóór stap 4 (de push naar `main`), want daarna komt deze code meteen op PRD.

### Bevinding 2: Authorized domains houden e-mail/wachtwoord-inlog niet tegen; M16 en README stap 1 wekken een te sterk beeld
**Ernst:** 🟢 Laag
**Type:** Authenticatie / misleidende configuratie
**Locatie:** `src/main.js:405-408` (M16-trigger), `README.md` stap 1 en de tabelrij "Inloggen is op dit adres … nog niet toegestaan"
**Probleem:** Firebase Authorized domains gelden voor OAuth-popup/redirect en voor e-mailactielinks met een continue-URL. Ze gelden niet voor `signInWithEmailAndPassword`, het enige inlogpad van de app. `auth/unauthorized-domain` zal hier dus in de praktijk niet optreden. De enige domeinpoort is de websitebeperking (HTTP-referrer) van de API-key. De README zegt in stap 1 alleen "staat er een lijst, voeg dan toe" en adviseert niet om er een aan te maken. Gevolg: een `*.vercel.app`-preview met productiewaarden kan gewoon inloggen op productie. Het toevoegen van de domeinen kan geen kwaad, maar het is geen beveiliging.
**Aanbeveling:** Zet in de README dat Authorized domains voor deze app niet het inloggen afschermen en dat de API-keybeperking dat wel doet. Overweeg een websitebeperking op de browser-key van `svn10-clubkompas` (`clubkompas.svn10.nl/*`, tijdelijk `dev.clubkompas.svn10.nl/*`, `localhost:5173/*` voor `dev:productie`). Dan werkt een verkeerd geconfigureerde preview niet tegen productie. **Let op:** de scripts (`scripts/lib/omgeving.mjs:126`, `seed-testclub.mjs` enz.) gebruiken dezelfde key vanuit Node, zonder Referer. Die worden dan geblokkeerd. Zet de beperking dus alleen met een aparte key voor scripts, of laat hem bewust weg en leg die keuze vast. M16 mag blijven: de `requests-from-referer`-tak is dan juist de nuttige.

### Bevinding 3: De gemengde-configcontrole vergelijkt alleen authDomain met projectId, niet de API-key en appId
**Ernst:** 🟢 Laag
**Type:** Invoervalidatie / omgevingsscheiding
**Locatie:** `src/firebase.js:42-43`
**Probleem:** Stel dat in stap 3 bij Preview per ongeluk de productie-`VITE_FIREBASE_API_KEY` (of `APP_ID`/`MESSAGING_SENDER_ID`) wordt geplakt, terwijl `PROJECT_ID` en `AUTH_DOMAIN` van test zijn. Dan start de app met een petrol balk "fictieve data", maar Firebase Auth meldt aan bij het productieproject (de API-key bepaalt het Auth-project). Een HCA-wachtwoord dat daar wordt ingetypt gaat naar productie-Auth. Firestore weigert daarna, dus er lekt geen data, maar dit is precies het scenario waar P0e tegen moest beschermen.
**Aanbeveling:** Voeg twee goedkope controles toe aan `onvolledig` (alleen `nietLive` en `DEV`, dus live blijft ongemoeid):
1. `firebaseConfig.appId.split(':')[1] === firebaseConfig.messagingSenderId` (de appId bevat het projectnummer);
2. bij een niet-productie-projectId: `messagingSenderId` en `apiKey` mogen niet gelijk zijn aan de bekende productiewaarden. Beide zijn publiek en mogen als constante naast `PRODUCTIE_PROJECT_ID` staan.

### Bevinding 4: "Live breekt nooit" hangt af van `VERCEL_ENV` tijdens de build
**Ernst:** 🟢 Laag
**Type:** Beschikbaarheid / configuratie
**Locatie:** `vite.config.js:31`, `src/firebase.js:44`
**Probleem:** `VERCEL_ENV` is een Vercel-systeemvariabele. Staat "Automatically expose System Environment Variables" uit, of draait een build buiten Vercel, dan is `__VERCEL_ENV__` leeg. Op Production geldt dan `nietLive = true`. Een afwijkend label (`Test`) of een ontbrekende variabele stopt dan live, en de gebruiker krijgt de lokale-buildfoutpagina met `.env.production.local`-instructies.
**Aanbeveling:** Laat de build falen op Vercel zonder `VERCEL_ENV`, bijvoorbeeld in `vite.config.js`: `if (process.env.VERCEL && !process.env.VERCEL_ENV) throw new Error('VERCEL_ENV ontbreekt')`. Vercel houdt de vorige productiedeploy dan actief. Voeg in README stap 4 de controle toe: geen `[clubKOMPAS]`-waarschuwing in de console op live.

### Bevinding 5: Deployment Protection niet expliciet gecontroleerd, en uitzetten geldt voor alle previews
**Ernst:** 🟢 Laag
**Type:** Authenticatie (toegang tot de testomgeving)
**Locatie:** `README.md` stap 5
**Probleem:** De README gaat ervan uit dat `tst.` achter de Vercel-login staat. Dat geldt bij "Standard Protection", maar de controle in stap 5 test het niet. Het advies "zet dit uit als een HCA-tester mee moet kijken" zet de bescherming uit voor álle Preview-deploys van alle branches. Bovendien is het testproject dan publiek te benaderen, inclusief de mogelijkheid om er accounts aan te maken (zie bevinding 6).
**Aanbeveling:** Voeg toe aan de controle van stap 5: "Open `https://tst.clubkompas.svn10.nl` in een privévenster: je moet eerst het Vercel-inlogscherm zien." Gebruik voor een HCA-tester liever een Shareable Link van Vercel voor die ene deploy, in plaats van de bescherming uit te zetten. Zet een eventuele uitschakeling met een einddatum in de backlog.

### Bevinding 6: Projectgegevens staan publiek in de bundle; let op zelfregistratie en regels in het testproject
**Ernst:** 🟢 Laag
**Type:** Blootgestelde data (informatie)
**Locatie:** `src/main.js:301-338` (teksten van de foutpagina's, onderdeel van de productiebundle)
**Probleem:** De teksten van alle foutpagina's zitten in dezelfde JS-bundle als live en zijn dus publiek leesbaar op `clubkompas.svn10.nl`. Ze noemen `svn10-clubkompas-test` en de Vercel-werkwijze. Project-ID's en API-keys zijn bij Firebase geen geheim, maar iedereen kan met de publieke config wel `createUserWithEmailAndPassword` tegen beide projecten doen, tenzij zelfregistratie uit staat.
**Aanbeveling:** Geen codewijziging nodig. Controleer in beide Firebase-projecten (Authentication → Settings → User actions) dat "Enable create (sign-up)" uit staat, en dat de Firestore-regels van test minstens zo strikt zijn als die van productie (zelfde bestand via `npm run regels:test`). Zet dit als controlepunt in de README bij stap 1.

### Bevinding 7: Opheffen van `dev.`: volgorde en API-key vergeten
**Ernst:** 🟢 Laag
**Type:** Configuratie (subdomeinovername, restrechten)
**Locatie:** `README.md` stap 7
**Probleem:** Stap 7 verwijdert eerst het Vercel-domein en daarna de Hostnet-CNAME. Tussen die twee momenten wijst een CNAME naar Vercel zonder gekoppeld project (dangling CNAME). Verder staat `dev.clubkompas.svn10.nl/*` mogelijk nog in de websitebeperking van de API-key.
**Aanbeveling:** Draai de volgorde om: eerst de CNAME `dev.clubkompas` bij Hostnet verwijderen, dan het domein in Vercel. Voeg toe: "Google Cloud Console → Credentials → Browser key productie: `dev.clubkompas.svn10.nl/*` verwijderen (als die er staat)."

### Bevinding 8: Stap 3 noemt het uitvinken van `VITE_OMGEVING=Productie` bij Preview/Development niet expliciet
**Ernst:** 🟢 Laag
**Type:** Configuratie / omgevingsscheiding
**Locatie:** `README.md` stap 3
**Probleem:** Bij de zes `VITE_FIREBASE_*` staat expliciet dat Preview en Development uitgevinkt moeten worden. Bij `VITE_OMGEVING=Productie` staat alleen "blijft alleen Production". Staat dat label nu ook op Preview, dan geldt bevinding 1 (geen stop). Een productiewaarde onder Development komt via `vercel env pull` in `.env.local` terecht.
**Aanbeveling:** Voeg toe: "Ook bij `VITE_OMGEVING=Productie`: Edit → Preview en Development uitvinken." Breid de controle uit naar alle zeven sleutels.

## Samenvatting
- 🔴 Kritieke bevindingen: 0
- 🟡 Hoge bevindingen: 1 (bevinding 1)
- 🟢 Lage aanbevelingen: 7 (bevindingen 2 t/m 8)

## Eindoordeel
🟡 Naar TST met aandachtspunten. Bevinding 1 moet opgelost zijn vóór PRD. Omdat de P0f-code volgens README stap 4 meteen naar `main` gaat, is het advies: los bevinding 1 (code en README-rij 2) op vóór die push. De codewijziging is klein en raakt live niet.
