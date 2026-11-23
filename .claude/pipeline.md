# SVN10-pipeline: route naar grootte

Vastgesteld door Paul (PO) op 23 november 2026, om zuiniger met credits te werken. Aanleiding: CK-020 kostte ongeveer 2,5 miljoen agent-tokens, doordat 12 agents elk de specs en `src/main.js` opnieuw lazen, plus een zeer lange hoofdsessie.

## Altijd
- **Eén sessie per feature.** De stand staat in `.claude/backlog.md` en het geheugen.
- **Eerst de grootte bepalen** (klein, middel of groot) en aan Paul voorleggen.
- Werken op branch `test`. Commit en push alleen na "Commit and push". Paul zet live met `git merge --ff-only test`.
- Agents krijgen een korte opdracht met precies de bestanden die ze nodig hebben, en geven een korte samenvatting terug.
- Weinig meekijken in de browser: alleen gericht controleren wat niet anders kan. Paul doet de testlijst.
- Een prototype alleen als het scherm echt verandert.

## Klein
Tekst, CSS of een kleine fix.
1. De hoofdsessie bouwt zelf.
2. `npm run build` (en `npm run test:regels` als de regels geraakt worden).
3. Paul test op tst.

Geen agents, geen rapporten.

## Middel
Eén scherm of functie, zonder nieuw datamodel en zonder wijziging in de regels.
1. **Intake + ontwerp** in één agent (intake-medewerker): spec met ontwerp en vragen voor Paul. Er is geen aparte ervaring-fase.
2. **Bouwer** (bouwer-medewerker).
3. **Eén controle-agent** (tester-medewerker) die test, huisstijl, toegankelijkheid en beveiliging samen nakijkt, in één rapport.
4. Herstel door de bouwer, alleen als het nodig is.
5. **Eén document** `.claude/docs/CK-xxx.md`: de technische beschrijving met een korte sectie "Voor gebruikers".

Geen beoordelaar.

## Groot
Een nieuw datamodel, nieuwe Firestore-regels of persoonsgegevens (zoals CK-020).
1. Intake (met de gebruikersreis erin) en daarna ontwerp, met een prototype als het scherm verandert.
2. Bouwer, met regeltests in de emulator.
3. Controles: beveiliging apart (sterkste model). Test, huisstijl en toegankelijkheid samen in één agent. Compliance alleen bij persoonsgegevens.
4. Herstelronde.
5. Eén document, zoals bij middel.
6. Beoordelaar met de testlijst voor tst.

## Modellen
- Sterkste model: intake, ontwerp, bouwer, beveiliging, beoordelaar.
- Sonnet: tester (gecombineerde controle), huisstijl, toegankelijkheid, compliance, documentatie.

## Later
`src/main.js` opsplitsen in modules per pagina, zodat agents alleen lezen wat ze nodig hebben.
