# Compliancerapport: CK-010 — Pijlers aanmaken

## Verwerkte persoonsgegevens

Naam van de eindverantwoordelijke (een persoonsnaam) wordt opgeslagen in
`localStorage`. Dit is een persoonsgegeven in de zin van de AVG.

## Bevindingen

### Persoonsnaam in localStorage zonder toestemming
**Ernst:** 🟢 Aanbeveling
**Regelgeving:** AVG art. 5 lid 1(b) — doelbinding; art. 6 — rechtsgrond
**Probleem:** Een persoonsnaam is een persoonsgegeven. In de huidige opzet
(localStorage) is er nog geen verwerkingsregister, geen privacyverklaring en
geen expliciete rechtsgrond. Voor een beheerder die zijn eigen naam invoert is
dit acceptabel (toestemming via gebruik), maar dit moet formeel worden
vastgelegd zodra de applicatie bij clubs in gebruik gaat.
**Aanbeveling:** Vóór PRD-lancering: verwerkingsregister bijwerken met "naam
eindverantwoordelijke per pijler", rechtsgrond documenteren (gerechtvaardigd
belang of toestemming).

## Samenvatting

- 🔴 Kritieke bevindingen: 0
- 🟡 Aandachtspunten: 0
- 🟢 Aanbevelingen: 1 (verwerkingsregister bijwerken vóór PRD)

## Eindoordeel

✅ Compliant voor DEV/TST — aanbeveling voor PRD-lancering
