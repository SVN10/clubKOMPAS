// Projecten en samenwerkingen (CK-046) en commissies (CK-041), modellaag.
// Projecten en samenwerkingen vullen de overkoepelende domeinen op de plaat; commissies staan alleen in Beheer.
// Pure functies met db en clubId als parameter: gedeeld door de app, het inrichtscript en de regeltests.

import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { maakNaamregels, normaliseerNaam, naamSleutel } from './vermogens.js'

export const SOORT_ONDERDEEL = {
  commissies: {
    enkel: 'commissie', meer: 'commissies', Enkel: 'Commissie', Meer: 'Commissies', status: false, opPlaat: false,
    dubbelCode: 'dubbele-commissie', wegCode: 'commissie-weg', voorbeeld: 'Bijv. Kascommissie',
    uitleg: 'Een commissie is een vaste groep vrijwilligers die een taak voor de club uitvoert, zoals de kascommissie of de activiteitencommissie.',
  },
  projecten: {
    enkel: 'project', meer: 'projecten', Enkel: 'Project', Meer: 'Projecten', status: true, opPlaat: true,
    dubbelCode: 'dubbel-project', wegCode: 'project-weg', voorbeeld: 'Bijv. LED-scorebord',
    uitleg: 'Een project is een tijdelijk traject van de club, zoals een verbouwing, een nieuw scorebord of een sponsortraject.',
  },
  samenwerkingen: {
    enkel: 'samenwerking', meer: 'samenwerkingen', Enkel: 'Samenwerking', Meer: 'Samenwerkingen', status: false, opPlaat: true,
    dubbelCode: 'dubbele-samenwerking', wegCode: 'samenwerking-weg', voorbeeld: 'Bijv. KNHB',
    uitleg: 'Een samenwerking is een vaste partner buiten de club, zoals de bond, de gemeente of scholen.',
  },
}
// Soorten met kaartjes op het Vermogensoverzicht (commissies niet: CK-041, besluit 7)
export const PLAAT_SOORTEN = Object.keys(SOORT_ONDERDEEL).filter(s => SOORT_ONDERDEEL[s].opPlaat)
export const STATUSSEN = [['in-voorbereiding', 'In voorbereiding'], ['lopend', 'Lopend'], ['afgerond', 'Afgerond']]
export const STATUS_LABEL = Object.fromEntries(STATUSSEN)
export const OP_PLAAT = new Set(['in-voorbereiding', 'lopend'])
export const OMSCHRIJVING_MAX = 500

const NAAMREGELS = maakNaamregels("&'.,()+/")
export { normaliseerNaam, naamSleutel }

export function onderdeelnaamFout(naam) {
  return NAAMREGELS.fout(naam)
}

export function geldigeOnderdeelnaam(naam) {
  return typeof naam === 'string' && NAAMREGELS.geldig(naam) && normaliseerNaam(naam) === naam
}

export function normaliseerOmschrijving(tekst) {
  return String(tekst ?? '').trim()
}

export function omschrijvingFout(tekst) {
  const n = [...tekst].length
  return n > OMSCHRIJVING_MAX ? `Een omschrijving heeft maximaal ${OMSCHRIJVING_MAX} tekens. Nu zijn het er ${n}.` : ''
}

const DATUM = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export const geldigeDatum = d => d === '' || (typeof d === 'string' && DATUM.test(d))

// Alleen splitsen, nooit new Date(): een tijdzone kan de dag verschuiven
function maandJaar(datum) {
  const [jaar, maand] = datum.split('-')
  return `${MAANDEN[Number(maand) - 1] || maand} ${jaar}`
}

export function periodeTekst(begin, eind) {
  const b = geldigeDatum(begin) && begin ? maandJaar(begin) : ''
  const e = geldigeDatum(eind) && eind ? maandJaar(eind) : ''
  if (b && e) return b === e ? b : `${b} – ${e}`
  if (b) return `vanaf ${b}`
  if (e) return `t/m ${e}`
  return ''
}

// Veldfouten voor de periode: { begin?, eind? }. Een onvolledige datum in de kiezer (badInput) controleert de app zelf.
export function datumFout(begin, eind) {
  const fout = {}
  const half = 'Vul een hele datum in, of maak het veld leeg.'
  if (!geldigeDatum(begin)) fout.begin = half
  if (!geldigeDatum(eind)) fout.eind = half
  if (!fout.begin && !fout.eind && begin && eind && eind < begin) fout.eind = 'De einddatum ligt vóór de begindatum.'
  return fout
}

// Alle velden die de regels verwachten, ook als lege tekst
export function onderdeelVelden(soort, { naam, omschrijving = '', bestuursfunctieId = '', status, begindatum = '', einddatum = '', volgorde }) {
  const velden = { naam, omschrijving, bestuursfunctieId }
  if (SOORT_ONDERDEEL[soort].status) Object.assign(velden, { status, begindatum, einddatum })
  if (volgorde !== undefined) velden.volgorde = volgorde
  return velden
}

const tekstTot = (v, max) => typeof v === 'string' && v.length <= max

// Spiegel van de Firestore-regels (voor script en tests)
export function geldigOnderdeel(soort, d) {
  const cfg = SOORT_ONDERDEEL[soort]
  if (!cfg || !d || typeof d !== 'object') return false
  const sleutels = ['naam', 'omschrijving', 'bestuursfunctieId', 'volgorde', ...(cfg.status ? ['status', 'begindatum', 'einddatum'] : [])]
  const eigen = Object.keys(d).filter(k => k !== 'id')
  return eigen.length === sleutels.length && sleutels.every(k => eigen.includes(k))
    && geldigeOnderdeelnaam(d.naam)
    && tekstTot(d.omschrijving, OMSCHRIJVING_MAX)
    && tekstTot(d.bestuursfunctieId, 100)
    && Number.isInteger(d.volgorde) && d.volgorde >= 1 && d.volgorde <= 100000
    && (!cfg.status || (Object.hasOwn(STATUS_LABEL, d.status) && geldigeDatum(d.begindatum) && geldigeDatum(d.einddatum)
      && (!d.begindatum || !d.einddatum || d.einddatum >= d.begindatum)))
}

export function sorteerOnderdelen(lijst) {
  const v = x => (typeof x.volgorde === 'number' ? x.volgorde : Infinity)
  return lijst.sort((a, b) => v(a) - v(b) || String(a.naam).localeCompare(String(b.naam), 'nl'))
}

export function hoogsteVolgorde(lijst) {
  return lijst.reduce((m, x) => (Number.isInteger(x.volgorde) ? Math.max(m, x.volgorde) : m), 0)
}

// Zelfde naam (hoofdletters en spaties tellen niet) bij een ander item in dezelfde lijst
export function naamBezet(lijst, naam, eigenId = null) {
  const sleutel = naamSleutel(normaliseerNaam(naam))
  return lijst.some(x => x.id !== eigenId && typeof x.naam === 'string' && naamSleutel(normaliseerNaam(x.naam)) === sleutel)
}

const kolom = (db, clubId, soort) => collection(db, 'clubs', clubId, soort)

export async function laadOnderdelen(db, clubId, soort) {
  const snap = await getDocs(kolom(db, clubId, soort))
  return sorteerOnderdelen(snap.docs.map(d => ({ id: d.id, ...d.data() })))
}

export async function voegOnderdeelToe(db, clubId, soort, data) {
  const volgorde = hoogsteVolgorde(await laadOnderdelen(db, clubId, soort)) + 1
  const ref = await addDoc(kolom(db, clubId, soort), onderdeelVelden(soort, { ...data, volgorde }))
  return { id: ref.id, volgorde }
}

// Eerst lezen: op een verdwenen document geven de regels permission-denied (alleen de nieuwe velden), niet not-found
export async function bewerkOnderdeel(db, clubId, soort, id, data) {
  const ref = doc(db, 'clubs', clubId, soort, id)
  if (!(await getDoc(ref)).exists()) throw { code: SOORT_ONDERDEEL[soort].wegCode }
  try {
    await updateDoc(ref, onderdeelVelden(soort, data))
  } catch (e) {
    if (e?.code === 'not-found') throw { code: SOORT_ONDERDEEL[soort].wegCode }
    throw e
  }
}

export async function verwijderOnderdeel(db, clubId, soort, id) {
  const ref = doc(db, 'clubs', clubId, soort, id)
  if (!(await getDoc(ref)).exists()) throw { code: SOORT_ONDERDEEL[soort].wegCode }
  await deleteDoc(ref)
}
