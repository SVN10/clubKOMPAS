// Vermogens (CK-020), modellaag: naamregels en het schrijfprotocol dat de Firestore-regels verwachten.
// Gedeeld door de app, de scripts (inrichten/controleren) en de regeltests met de emulator.
// Eén vermogen per transactie: vermogen + naamdocument + teller op het domein in één keer.

import { collection, doc, getDoc, getDocs, query, where, runTransaction } from 'firebase/firestore'

export const NAAM_MIN = 2
export const NAAM_MAX = 100
export const KAN_VERMOGENS = new Set(['pijler', 'domein'])

const LETTER = 'a-zA-Z0-9À-ÖØ-öø-ÿ'
const EERSTE_TEKEN = new RegExp(`^[${LETTER}]`)
const ONZICHTBAAR = /[\p{Extended_Pictographic}\p{Cf}\p{Cc}]/u

export function normaliseerVermogensnaam(naam) {
  return String(naam ?? '').normalize('NFC').trim().replace(/\s+/g, ' ')
}
export const normaliseerNaam = normaliseerVermogensnaam

export function naamSleutel(naam) {
  return naam.toLowerCase()
}

function opsomming(delen) {
  return delen.length < 2 ? delen.join('') : `${delen.slice(0, -1).join(', ')} en ${delen[delen.length - 1]}`
}

// Naamregels met een eigen tekenset: extra = tekens bovenop letters, cijfers en spatie (het '-' blijft achteraan)
export function maakNaamregels(extra) {
  const geldigeNaam = new RegExp(`^[${LETTER}][${LETTER} ${extra}-]*$`)
  const geldigTeken = new RegExp(`[${LETTER} ${extra}-]`)
  const toonbaar = [...extra].filter(t => t !== '&' && t !== "'")
  const staart = `Gebruik letters (ook met accent, zoals é, ë of ç), cijfers, spaties en & ' - ${toonbaar.join(' ')}`
  const geldig = naam => {
    const n = [...naam].length
    return n >= NAAM_MIN && n <= NAAM_MAX && geldigeNaam.test(naam)
  }
  // Veldfout voor een (al genormaliseerde) naam, of '' als hij voldoet. Volgorde: tekens, eerste teken, lengte.
  const fout = naam => {
    if (!naam) return 'Vul een naam in.'
    const tekens = [...naam]
    if (tekens.some(t => ONZICHTBAAR.test(t))) {
      return `Er staat een teken in de naam dat niet kan, bijvoorbeeld een emoji. ${staart}`
    }
    const fouteTekens = [...new Set(tekens.filter(t => !geldigTeken.test(t)))]
    if (fouteTekens.length === 1) return `Het teken ${fouteTekens[0]} kan niet in een naam. ${staart}`
    if (fouteTekens.length > 1) return `De tekens ${opsomming(fouteTekens.slice(0, 3))} kunnen niet in een naam. ${staart}`
    if (!EERSTE_TEKEN.test(naam)) return 'Begin de naam met een letter of cijfer.'
    if (tekens.length < NAAM_MIN) return `Een naam heeft minimaal ${NAAM_MIN} tekens.`
    if (tekens.length > NAAM_MAX) return `Een naam heeft maximaal ${NAAM_MAX} tekens. Nu zijn het er ${tekens.length}.`
    return ''
  }
  return { geldig, fout }
}

const VERMOGENSNAAM = maakNaamregels("&'.,()+")

export function geldigeVermogensnaam(naam) {
  return VERMOGENSNAAM.geldig(naam)
}

export function vermogensnaamFout(naam) {
  return VERMOGENSNAAM.fout(naam)
}

export function teller(domein) {
  return Number.isInteger(domein?.aantalVermogens) ? domein.aantalVermogens : 0
}

// Een id dat als documentnaam kan (oude of beschadigde data kan iets anders bevatten)
export function bruikbaarId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 1500 && !id.includes('/') && id !== '.' && id !== '..' && !/^__.*__$/.test(id)
}

const refs = (db, clubId) => ({
  vermogens: collection(db, 'clubs', clubId, 'vermogens'),
  vermogen: id => doc(db, 'clubs', clubId, 'vermogens', id),
  naam: naam => doc(db, 'clubs', clubId, 'vermogensnamen', naamSleutel(naam)),
  domein: id => doc(db, 'clubs', clubId, 'structuurelementen', id),
})

export async function laadVermogens(db, clubId) {
  const snap = await getDocs(collection(db, 'clubs', clubId, 'vermogens'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function hoogsteVolgorde(db, clubId, domeinId) {
  const snap = await getDocs(query(collection(db, 'clubs', clubId, 'vermogens'), where('domeinId', '==', domeinId)))
  return snap.docs.reduce((m, d) => (Number.isInteger(d.data().volgorde) ? Math.max(m, d.data().volgorde) : m), 0)
}

export async function leesAantalVermogens(db, clubId, domeinId) {
  const snap = await getDoc(refs(db, clubId).domein(domeinId))
  return snap.exists() ? teller(snap.data()) : 0
}

// Gooit dubbel-vermogen (met domeinnaam) of naam-bezet (naamdocument zonder vermogen). lees = tx.get of getDoc.
async function gooiDubbel(lees, r, naamSnap, doelDomeinId) {
  const bestaandId = naamSnap.data()?.vermogenId
  let vermogen = null
  let domein = null
  if (bruikbaarId(bestaandId)) {
    const v = await lees(r.vermogen(bestaandId))
    if (v.exists()) {
      vermogen = v.data()
      if (bruikbaarId(vermogen.domeinId)) {
        const d = await lees(r.domein(vermogen.domeinId))
        domein = d.exists() ? d.data() : null
      }
    }
  }
  if (!vermogen) throw { code: 'naam-bezet' }
  throw { code: 'dubbel-vermogen', domeinNaam: typeof domein?.naam === 'string' ? domein.naam : '', zelfdeDomein: vermogen.domeinId === doelDomeinId }
}

function controleerDoeldomein(snap) {
  if (!snap.exists()) throw { code: 'domein-weg' }
  if (!KAN_VERMOGENS.has(snap.data().type)) throw { code: 'domein-overkoepelend', domeinNaam: snap.data().naam || '' }
}

// Een transactie die na herhaalde pogingen opgeeft, kan in de web-SDK ook failed-precondition of
// already-exists geven. Dat is hier altijd "iemand anders wijzigde dit tegelijk", nooit "bestaat niet meer".
async function transactie(db, functie) {
  try {
    return await runTransaction(db, functie)
  } catch (e) {
    if (e?.code === 'failed-precondition' || e?.code === 'already-exists') throw { code: 'aborted', oorzaak: e }
    throw e
  }
}

// Controle vóór hernoemen + verplaatsen (besluit 14): bestaat de nieuwe naam al bij een ander vermogen?
export async function controleerNaamVrij(db, clubId, naam, eigenId, doelDomeinId) {
  const r = refs(db, clubId)
  const snap = await getDoc(r.naam(naam))
  if (!snap.exists() || snap.data()?.vermogenId === eigenId) return
  await gooiDubbel(getDoc, r, snap, doelDomeinId)
}

export async function voegVermogenToe(db, clubId, { naam, domeinId }) {
  const r = refs(db, clubId)
  const vRef = doc(r.vermogens)
  const dRef = r.domein(domeinId)
  const nRef = r.naam(naam)
  const volgorde = (await hoogsteVolgorde(db, clubId, domeinId)) + 1
  await transactie(db, async tx => {
    const [dSnap, nSnap] = [await tx.get(dRef), await tx.get(nRef)]
    if (nSnap.exists()) await gooiDubbel(ref => tx.get(ref), r, nSnap, domeinId)
    controleerDoeldomein(dSnap)
    tx.set(vRef, { naam, domeinId, volgorde })
    tx.set(nRef, { vermogenId: vRef.id })
    tx.update(dRef, { aantalVermogens: teller(dSnap.data()) + 1, laatsteVermogenId: vRef.id })
  })
  return { id: vRef.id, volgorde }
}

export async function hernoemVermogen(db, clubId, id, nieuweNaam) {
  const r = refs(db, clubId)
  const vRef = r.vermogen(id)
  await transactie(db, async tx => {
    const vSnap = await tx.get(vRef)
    if (!vSnap.exists()) throw { code: 'vermogen-weg' }
    const v = vSnap.data()
    const oudeNaam = typeof v.naam === 'string' ? v.naam : ''
    if (oudeNaam && naamSleutel(oudeNaam) === naamSleutel(nieuweNaam)) {
      if (oudeNaam !== nieuweNaam) tx.update(vRef, { naam: nieuweNaam })
      return
    }
    const nNieuwRef = r.naam(nieuweNaam)
    const nNieuw = await tx.get(nNieuwRef)
    const alVanMij = nNieuw.exists() && nNieuw.data()?.vermogenId === id
    if (nNieuw.exists() && !alVanMij) await gooiDubbel(ref => tx.get(ref), r, nNieuw, v.domeinId)
    const nOudRef = bruikbaarId(oudeNaam && naamSleutel(oudeNaam)) ? r.naam(oudeNaam) : null
    const nOud = nOudRef ? await tx.get(nOudRef) : null
    tx.update(vRef, { naam: nieuweNaam })
    if (nOud?.exists() && nOud.data()?.vermogenId === id) tx.delete(nOudRef)
    if (!alVanMij) tx.set(nNieuwRef, { vermogenId: id })
  })
}

export async function verplaatsVermogen(db, clubId, id, nieuwDomeinId) {
  const r = refs(db, clubId)
  const vRef = r.vermogen(id)
  const dNieuwRef = r.domein(nieuwDomeinId)
  const volgorde = (await hoogsteVolgorde(db, clubId, nieuwDomeinId)) + 1
  await transactie(db, async tx => {
    const vSnap = await tx.get(vRef)
    if (!vSnap.exists()) throw { code: 'vermogen-weg' }
    const oudId = vSnap.data().domeinId
    if (oudId === nieuwDomeinId) return
    const dNieuw = await tx.get(dNieuwRef)
    const dOudRef = bruikbaarId(oudId) ? r.domein(oudId) : null
    const dOud = dOudRef ? await tx.get(dOudRef) : null
    controleerDoeldomein(dNieuw)
    tx.update(vRef, { domeinId: nieuwDomeinId, volgorde })
    tx.update(dNieuwRef, { aantalVermogens: teller(dNieuw.data()) + 1, laatsteVermogenId: id })
    if (dOud?.exists()) tx.update(dOudRef, { aantalVermogens: teller(dOud.data()) - 1, laatsteVermogenId: id })
  })
  return { volgorde }
}

export async function verwijderVermogen(db, clubId, id) {
  const r = refs(db, clubId)
  const vRef = r.vermogen(id)
  await transactie(db, async tx => {
    const vSnap = await tx.get(vRef)
    if (!vSnap.exists()) throw { code: 'vermogen-weg' }
    const v = vSnap.data()
    const nRef = typeof v.naam === 'string' && bruikbaarId(naamSleutel(v.naam)) ? r.naam(v.naam) : null
    const nSnap = nRef ? await tx.get(nRef) : null
    const dRef = bruikbaarId(v.domeinId) ? r.domein(v.domeinId) : null
    const dSnap = dRef ? await tx.get(dRef) : null
    tx.delete(vRef)
    if (nSnap?.exists() && nSnap.data()?.vermogenId === id) tx.delete(nRef)
    if (dSnap?.exists()) tx.update(dRef, { aantalVermogens: teller(dSnap.data()) - 1, laatsteVermogenId: id })
  })
}
