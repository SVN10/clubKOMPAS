# Eindoordeel: CK-044 — Eén navigatie, zijmenu op elke pagina

Fase 7 (beoordelaar), 23 november 2026 · branch `test`, niet gecommit · geen code gewijzigd.
Gelezen: `.claude/specs/CK-044-{besluiten,zijmenu,gebruikersreis,ontwerp}.md` (incl. antwoorden, bijstellingen en "Bijstelling Paul na het prototype"), `.claude/reports/CK-044-bouwverslag.md` (incl. herstelronde), de vijf kwaliteitsrapporten, `.claude/docs/CK-044-technisch.md`, `.claude/docs/CK-044-voor-gebruikers.md`, backlog "Na CK-044", `CHANGELOG.md`, en zelf `src/main.js` (shell, `navigeer`, paneel, Esc/tooltip, `uitloggen`, `onAuthStateChanged`, CK-023-meldingen, Mijn account) en het shell-blok in `src/style.css`.

## Overzicht kwaliteitscontroles

| Check | Medewerker | Oordeel | Kritieke bevindingen | Na herstelronde |
|-------|-----------|---------|---------------------|-----------------|
| Functioneel testen | Tester | ✅ (logica, jsdom) | 0 | 60/60 + 38/38 + 36/36 groen; opmerking `navNaam('beheer')` opgelost via `PAGINA_NAAM` |
| Huisstijl | Huisstijl | ✅ | 0 | Tokens voor schaduw/dimlaag ✅, ☰-lijndikte ✅. Bestaande inline styles en `.card` buiten scope |
| Beveiliging | Beveiliging | ✅ Veilig voor TST | 0 | 2 `Map` ✅, 3 ids via `esc()` ✅, 4 `'` in `esc()` ✅, 5 opruimen bij externe uitlog + `.catch` ✅. 1 (P0d) als harde eis in backlog ✅ |
| Compliance | Compliance | ✅ Compliant | 0 | 1 geen volledig e-mailadres ✅ (deel vóór @). 2 bij P0d ✅ |
| Toegankelijkheid | Toegankelijkheid | 🟡 → ✅ (code) | 0 | Alle drie 🟡 verwerkt: tooltip Esc/hoverbaar ✅, titel + focus bij paginawissel ✅, `--petrol-vlak` donker 8,1:1 ✅. Ook `role="list"` ✅ en lage viewport ✅. h1 → backlog. Suggestie 7 (titel mobiel) niet gedaan |

Ik heb in `src/main.js` zelf nagekeken:
- **Uitloggen en het paneel opruimen kloppen.** Het zijmenu doet eerst `sluitPaneel({ focus: false })` en daarna `uitloggen()`. De else-tak van `onAuthStateChanged` wist de staat, roept `sluitPaneel`, zet de titel terug, `setFavicon('')` en `renderInlogscherm()`. Elke `signOut` loopt via `uitloggen()`, ook "Opnieuw inloggen" en de tussenschermen.
- **De CK-023/CK-025-meldingen zijn intact.** `meldingenHTML`, `toonOk`, `toonFout` en `bindMeldblokken` zijn ongewijzigd. De meldingen zitten binnen `main#inhoud`. De focus na het opnieuw tekenen bij Club (`CLUB_SUCCES`) loopt buiten `navigeer`, dus de shell pakt de focus niet af.

## Documentatie

| Doc | Status |
|-----|--------|
| Technische docs | ✅ Klopt met de code (`navigeer`, `PAGINA_NAAM`, `Map`, `--petrol-vlak`, `.tip-uit`) |
| Gebruikersdocs | ✅ Eén kleine tekstfout: "De pagina waar je bent, heeft een gekleurd vlak" moet zijn "een witte achtergrond met een oranje streep, vetgedrukt" |
| CHANGELOG | ✅ Onder "Ongepubliceerd" |
| Backlog | ⚠ Nog bij te werken door de hoofdsessie: status CK-044. CK-031 (30px → 22px) en CK-037 ("Home zonder zijmenu") moeten verwijzen naar CK-044, zoals de spec vraagt |

## Aandachtspunten voor Paul

1. **Nog niets is in een echte browser bekeken.** Alle groene oordelen gaan over de code en jsdom. Het visuele deel (logo-overlap, sticky, tooltips, paneel, donkere modus) beslis je op tst met de checklist hieronder.
2. **Scrollpositie bij paginawissel (nieuw, eigen bevinding).** Het menu blijft nu in beeld bij scrollen, dus je klikt vaker vanaf onderaan een lange pagina. `navigeer` scrollt niet naar boven (`preventScroll`). Mogelijk opent de nieuwe pagina halverwege. Controleer dit (checklist punt 3). Valt het tegen, dan is de oplossing één regel (`scrollTo(0, 0)` in `navigeer`).
3. **Lege strook onder het zijmenu** bij de omgevingsbalk na scrollen. Dit volgt uit het ontwerp en staat in de backlog. Jouw oordeel.
4. **Domeinenlijst op ~768px** met uitgeklapt menu past waarschijnlijk niet. Dit bestond al sinds CK-037 en staat in de backlog.
5. **P0d blijft een harde eis.** Beheer verbergen in het menu is geen beveiliging. Eerst rules (`isBeheerder`) en guards, en pas dan een tweede rol in Beheer toelaten. Dit staat in de backlog.
6. Klein, niet blokkerend:
   - Een mislukte uitlog geeft alleen een regel in de console. De knop lijkt dan niets te doen.
   - Navigeren naar Domeinen of Bestuursfuncties wacht eerst op data zonder laadsignaal (bestaand gedrag).
   - Wie tijdens dat wachten uitlogt, kan in theorie de shell terugkrijgen over het inlogscherm (bestaand patroon, zeer klein risico).

## Blokkades

Geen.

## Mijn aanbeveling

**🟢 GO — commit op `test`, daarna jouw browsertest op `tst.clubkompas.svn10.nl`**

Voor live: **GO met voorbehoud**. Pas mergen naar main als de checklist hieronder groen is.

### Testchecklist voor Paul (tst en lokaal :5173)

1. **Desktop ≥1200px, uitgeklapt.** Op Home, Domeinen, Bestuursfuncties, Club en Mijn account staan dezelfde balk, hetzelfde zijmenu en dezelfde footer. Het actieve item is wit met een oranje streep en vet. Het tabblad heet bijvoorbeeld "TEST · Domeinen · clubKOMPAS". Footer: links het product, rechts "Test · Versie …" met tooltip.
2. **Desktop ingeklapt.** Menu op 44px met alleen pictogrammen. Tooltip bij aanwijzen én bij Tab; de muis kan op de tooltip; Esc haalt hem weg. Na herladen en bij paginawissel blijft het menu ingeklapt. » is gespiegeld.
3. **Sticky en scrollen.** Scrol op Domeinen naar onderen: het menu, je naam en Uitloggen blijven in beeld. Klik dan op Club: begint de pagina bovenaan? Bekijk ook de strook onder het menu.
4. **~768px.** Gewoon zijmenu zonder ☰. Titel en kruimelpad lopen niet onder het logo, met het menu in- en uitgeklapt. Bekijk de domeinenlijst (bekend risico).
5. **~400px.** ☰ zichtbaar, logo klein in de balk, titel afgekapt met "…", geen horizontaal scrollen.
6. **Telefoon-paneel (echt toestel).** Het paneel schuift in onder de omgevingsbalk met een gedimde achtergrond. Sluiten met ✕, met een tik ernaast en via een menu-item, daarna scrollt de pagina weer. Bij draaien naar liggend gaat het paneel dicht. Account en Uitloggen zijn goed apart aan te tikken.
7. **Toetsenbord.** Eerste Tab geeft "Direct naar inhoud" (Enter springt naar de inhoud). Daarna Home → Domeinen → Bestuursfuncties → Club → account → Uitloggen → Menu inklappen → kruimels → inhoud, overal met een oranje focusring. Na een menuklik staat de focus bovenaan de nieuwe inhoud.
8. **VoiceOver.** Je hoort "Hoofdmenu", "Overzicht" en "Beheer" als lijsten, "huidige pagina", "Mijn account, naam · rol" en "Menu openen, ingevouwen" (mobiel). Het logo wordt niet voorgelezen. Na een paginawissel wordt de nieuwe pagina aangekondigd.
9. **Logo-overlap.** Het logo staat half over de balk en het kruimelpad, en raakt de inhoud niet. Test ook met een breed logo en zonder logo: dan is er geen lege ruimte rechts.
10. **Lange clubnaam.** Zet tijdelijk een lange naam bij Club. De titel wordt op alle breedtes afgekapt. Zet de naam daarna terug.
11. **Donkere modus.** Balk, footer en sectiekoppen zijn donker petrol met goed leesbare witte tekst. Menu, tooltips en focusringen zijn zichtbaar. Bekend: de actieve filterknop op Domeinen is nog te licht (backlog).
12. **CK-023-meldingen.** Sla iets op bij Domeinen, Bestuursfuncties, Club (profiel en logo) en Mijn account. "✓ …" verschijnt één keer en op dezelfde plek. Na het opslaan van je naam wordt de accountregel direct bijgewerkt.
13. **Uitloggen.** Uitloggen vanuit het menu, op desktop en vanuit het paneel op de telefoon. Je ziet direct het inlogscherm met het kompas-favicon en de titel "TEST · clubKOMPAS". Daarna is niets geblokkeerd en scrollt de pagina.

### Wat GO voor live vereist

- Checklist 1–13 groen op tst, zonder nieuwe 🔴. Punten 3 en 4 mogen naar de backlog als jij dat accepteert.
- De hoofdsessie werkt bij: de backlog (status CK-044, verwijzingen bij CK-031 en CK-037) en de kleine tekstfix in de gebruikersdocs. Het versienummer (bv. 0.6.0) en de CHANGELOG-kop kiezen jij en de hoofdsessie bij het taggen.
- Daarna `git merge --ff-only test` naar main en een korte rookproef op `clubkompas.svn10.nl`: inloggen, menu, paginawissel, uitloggen, footer "Productie · Versie …".

---
*Jij geeft de definitieve go. Druk pas op de knop als je zeker bent.*
