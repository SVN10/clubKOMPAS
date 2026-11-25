// Omzetten van activiteiten met een datum (CK-170) naar activiteiten met uitvoeringen (CK-172).
// Zonder Firestore-aanroepen, zodat de regeltests (emulator) dezelfde logica kunnen toetsen.

import { geldigeActiviteit, geldigeUitvoering, uitvoeringVelden, datumTekst } from '../../src/activiteiten.js'
import { geldigeDatum, normaliseerNaam, naamSleutel } from '../../src/onderdelen.js'

const OUDE_VELDEN = ['begindatum', 'einddatum']
const heeftOudeVelden = x => OUDE_VELDEN.some(k => Object.hasOwn(x, k))
const naamVan = x => (typeof x.naam === 'string' && x.naam ? x.naam : `(zonder naam, ${x.id})`)

// Overslaan (blokkeert het omzetten van die activiteit): 'datum', 'regels' en 'bestaande-uitvoering'.
// Alleen melden (Paul ruimt op in de app): 'dubbele-naam' en 'wees'.
export const BLOKKEREND = new Set(['datum', 'regels', 'bestaande-uitvoering'])

// vermogens en commissies: lijsten met { id }; null = niet gecontroleerd
export function planOmzetting({ activiteiten, uitvoeringen, vermogens = null, commissies = null }) {
  const omzetten = []
  const afwijkingen = []
  const bestaand = new Map(uitvoeringen.map(u => [u.id, u]))
  const vermogenIds = vermogens ? new Set(vermogens.map(v => v.id)) : null
  const commissieIds = commissies ? new Set(commissies.map(c => c.id)) : null

  for (const x of activiteiten) {
    if (!heeftOudeVelden(x)) continue
    const naam = naamVan(x)
    const begindatum = x.begindatum ?? ''
    const einddatum = x.einddatum ?? ''
    if (typeof begindatum !== 'string' || begindatum === '' || !geldigeDatum(begindatum)) {
      afwijkingen.push({ soort: 'datum', activiteitId: x.id, tekst: `${naam}: de oude begindatum is leeg of ongeldig (${JSON.stringify(begindatum)}).` })
      continue
    }
    if (typeof einddatum !== 'string' || !geldigeDatum(einddatum)) {
      afwijkingen.push({ soort: 'datum', activiteitId: x.id, tekst: `${naam}: de oude einddatum is ongeldig (${JSON.stringify(einddatum)}).` })
      continue
    }
    if (einddatum && einddatum < begindatum) {
      afwijkingen.push({ soort: 'datum', activiteitId: x.id, tekst: `${naam}: de oude einddatum ligt vóór de begindatum.` })
      continue
    }
    const { id, ...rest } = x
    const na = Object.fromEntries(Object.entries(rest).filter(([k]) => !OUDE_VELDEN.includes(k)))
    const vermogenOk = !vermogenIds || (Array.isArray(na.vermogenIds) && vermogenIds.has(na.vermogenIds[0]))
    const commissieOk = !commissieIds || !na.commissieId || commissieIds.has(na.commissieId)
    if (!geldigeActiviteit(na) || !vermogenOk || !commissieOk) {
      const waarom = !vermogenOk ? 'het vermogen bestaat niet meer' : !commissieOk ? 'de commissie bestaat niet meer' : 'de overige velden kloppen niet'
      afwijkingen.push({ soort: 'regels', activiteitId: id, tekst: `${naam}: overgeslagen, want ${waarom}. Herstel de activiteit in Beheer → Activiteiten en draai het script opnieuw.` })
      continue
    }
    const uitvoering = uitvoeringVelden({ activiteitId: id, begindatum, einddatum })
    if (!geldigeUitvoering(uitvoering)) {
      afwijkingen.push({ soort: 'regels', activiteitId: id, tekst: `${naam}: overgeslagen, want het id past niet in een uitvoering.` })
      continue
    }
    // Een uitvoering met dit id die niet bij deze oude datums hoort: niet blind de datums weghalen
    const eerder = bestaand.get(id)
    if (eerder && (eerder.activiteitId !== id || eerder.begindatum !== begindatum || (eerder.einddatum ?? '') !== einddatum)) {
      afwijkingen.push({ soort: 'bestaande-uitvoering', activiteitId: id, tekst: `${naam}: overgeslagen, want uitvoering ${id} bestaat al met een andere activiteit of andere datums. De oude datumvelden blijven staan; controleer de uitvoering in de console.` })
      continue
    }
    omzetten.push({
      activiteitId: id,
      naam,
      datum: datumTekst(begindatum, einddatum),
      uitvoering: eerder ? null : uitvoering,
      velden: OUDE_VELDEN.filter(k => Object.hasOwn(x, k)),
    })
  }

  const perNaam = new Map()
  for (const x of activiteiten) {
    if (typeof x.naam !== 'string' || !x.naam) continue
    const sleutel = naamSleutel(normaliseerNaam(x.naam))
    if (!perNaam.has(sleutel)) perNaam.set(sleutel, [])
    perNaam.get(sleutel).push(x)
  }
  for (const lijst of perNaam.values()) {
    if (lijst.length < 2) continue
    afwijkingen.push({
      soort: 'dubbele-naam',
      tekst: `Dubbele naam "${lijst[0].naam}": ${lijst.length} activiteiten (${lijst.map(x => x.id).join(', ')}). Houd er één, zet daar de uitvoeringen bij en verwijder de andere in de app.`,
    })
  }

  const activiteitIds = new Set(activiteiten.map(x => x.id))
  for (const u of uitvoeringen) {
    if (!activiteitIds.has(u.activiteitId)) {
      afwijkingen.push({ soort: 'wees', tekst: `Uitvoering ${u.id} hoort bij een activiteit die niet meer bestaat (${JSON.stringify(u.activiteitId)}).` })
    }
  }

  return { omzetten, afwijkingen }
}
