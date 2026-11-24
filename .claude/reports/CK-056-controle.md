# Controle CK-056 (fixpakket v0.13.1, branch test, niet gecommit)
Bron: alleen de diff. Build en regeltests (131/131) niet opnieuw gedraaid.

## Bevindingen
| Ernst | Plaats | Bevinding | Voorstel |
|---|---|---|---|
| Midden | firestore.rules:~188 (`geenStuurtekens`) | `.` in RE2 komt standaard niet overeen met `\n`. Het patroon `.*[..].*` moet de hele string dekken. Een naam met twee of meer regeleinden (bv. `a\nb\nc`) valt buiten het patroon, dus de regel laat hem door. Eén `\n` wordt wel geweigerd; de tests testen alleen dat geval. De app (main.js) weigert wel alle gevallen, dus alleen te omzeilen buiten de app. Dit is een aanname uit RE2-gedrag, niet in de emulator bevestigd. | Gebruik `(?s)` voorop, of keer om: `v.matches('[^\\x{0000}-\\x{001F}...]*')`. Voeg een test toe met `'a\nb\nc'`. |
| Laag | regex in rules, main.js en p0d-velden.mjs | De drie bereiken zijn gelijk (0000-001F, 007F, 200B-200F, 202A-202E, 2066-2069). `\\x{...}` is geldig in een Firestore-string. Niet afgedekt: U+2028/2029, U+FEFF, U+0080-009F. | Eventueel toevoegen, in alle drie de plaatsen tegelijk. |
| Laag | zelfde bereik | 200C/200D (ZWNJ/ZWJ) zijn nu verboden. Dat raakt geen Nederlandse namen. | Geen actie. |
| Laag | src/keuzelijst.js:263 | De datumknop krijgt nu ook geen `fout`-klasse meer (de `aria`-tak keert terug vóór `classList.toggle`). Het tekstveld heeft die wel. Controleer of dat zo bedoeld is (rode rand op de knop). | Verplaats de `toggle` vóór `if (!aria) return`, als de rand wel moet. |
| Laag | .claude/docs/CK-044-technisch.md:55,72 | Noemt nog `--paneel-top`. | Tekst bijwerken (historisch, geen functionele fout). |
| Laag | CHANGELOG.md:39,256 en .claude/specs/P0c-*.md | Oude paden `scripts/firestore.rules.*`. | Historisch; geen actie, of een korte noot. |

## Gecontroleerd en in orde
- Namen met é, ë, &, –, ' worden niet geweigerd (buiten alle verboden bereiken). Test met 'Café & Bar' en 'Ède-Zuid' staat erin.
- PICTOGRAMMEN: de 15 sleutels plus '' in rules en p0d-velden.mjs komen overeen met main.js:136-151. Oude data met `icoon: 'stick'` zou nu falen; daarvoor dient de data-controle (`p0d:controle`) vóór het publiceren van de regels.
- `bevat` alleen op `overkoepelend`: main.js:1214 en :2697 gebruiken `bevat` alleen op overkoepelend. Rules, p0d-velden.mjs en tests komen overeen.
- `isBeheerder()` (main.js:296) is een const-pijlfunctie en werkt binnen de template-literal (`${...}`) van de plaat. `huidigeRol` wordt in de aanmeldflow gezet (:318) vóór het renderen.
- `return` na `isConnected` (Domeinen :1741, Bestuursfuncties :3018): het slaat alleen listeners over op een los DOM-knooppunt. Er wordt niets overgeslagen dat later nodig is. In de foutstaat blijft het lijst-element bestaan, dus bindHerlaad blijft werken.
- Vertraagde uitlogmelding (:837-840): `role="alert"` staat op het element, de 150 ms-timer controleert op `null` en vult de tekst na het tekenen. Werkt. De schermlezer-uitkomst zelf niet getest (handmatig te controleren met VoiceOver).
- Datumknop: `aria-label` blijft, `disabled` wordt nog gevolgd, `aria-describedby` en `aria-invalid` staan niet meer op de knop. Dat is juist: de foutmelding hoort bij het tekstveld.
- `--paneel-top`: geen verwijzing meer in src (alleen docs). `top: 0` en `inset: 0` kloppen omdat de omgevingsbalk onderaan staat.
- vercel.json: geldige JSON-structuur. HSTS `max-age=63072000; includeSubDomains` is correct (geen `preload`, goed). Permissions-Policy-syntaxis klopt. Let op: `includeSubDomains` geldt voor alle subdomeinen van het domein; controleer dat die allemaal https hebben. CSP ongewijzigd.
- Paden `scripts/archief/`: de drie bestanden staan er (plus README). Nergens in scripts/ of README.md staat nog het oude pad. migreer-club.mjs importeert `veilig` al (regel 8).
- bevestigVerwijderen (main.js:521) accepteert een ontbrekende naam, dus de aanroep voor het logo klopt.
- HS-1: de klasse `opslaan` op de drie knoppen in Mijn account bestaat in de CSS (niet extra gecontroleerd op stijl).

## Eindoordeel
Eén echte (midden) fout: de newline-omzeiling in `geenStuurtekens`. Verder geen blokkades. Eerst oplossen, dan opnieuw de regeltests draaien.
