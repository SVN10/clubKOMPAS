// Activiteiten (CK-170), modellaag: het onderste niveau van Club → Domein → Vermogen → Activiteiten.
// Pure functies met db en clubId als parameter, zonder DOM: gedeeld door Beheer → Activiteiten,
// de verwijderblokkade bij vermogens en commissies, de regeltests en later de vermogenskaart en de plaat.

import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, getCountFromServer } from 'firebase/firestore'
import { geldigeOnderdeelnaam, geldigeDatum, naamBezet } from './onderdelen.js'

export const ACTIVITEIT_SOORTEN = [
  ['toernooi', 'Toernooi'],
  ['clinic', 'Clinic of training'],
  ['evenement', 'Evenement'],
  ['bijeenkomst', 'Bijeenkomst'],
  ['opleiding', 'Opleiding'],
  ['actie', 'Actie'],
  ['overig', 'Overig'],
]
export const ACTIVITEIT_SOORT_LABEL = Object.fromEntries(ACTIVITEIT_SOORTEN)

// Een onbekende soort (oude data) telt als Overig, ook in het filter
export const activiteitSoort = x => (Object.hasOwn(ACTIVITEIT_SOORT_LABEL, x?.soort) ? x.soort : 'overig')
export const activiteitSoortLabel = x => ACTIVITEIT_SOORT_LABEL[activiteitSoort(x)]

const VELDEN = ['naam', 'soort', 'begindatum', 'einddatum', 'vermogenIds', 'commissieId']

// Alle velden die de regels verwachten, ook als lege tekst
export function activiteitVelden({ naam, soort, begindatum, einddatum = '', vermogenIds, commissieId = '' }) {
  return { naam, soort, begindatum, einddatum: einddatum || '', vermogenIds: [...vermogenIds], commissieId: commissieId || '' }
}

const kortId = v => typeof v === 'string' && v.length > 0 && v.length <= 100

// Spiegel van geldigeActiviteit in firestore.rules (zonder de exists()-controles)
export function geldigeActiviteit(d) {
  if (!d || typeof d !== 'object') return false
  const eigen = Object.keys(d).filter(k => k !== 'id')
  return eigen.length === VELDEN.length && VELDEN.every(k => eigen.includes(k))
    && geldigeOnderdeelnaam(d.naam)
    && Object.hasOwn(ACTIVITEIT_SOORT_LABEL, d.soort)
    && geldigeDatum(d.begindatum) && d.begindatum !== ''
    && geldigeDatum(d.einddatum)
    && (d.einddatum === '' || d.einddatum >= d.begindatum)
    && Array.isArray(d.vermogenIds) && d.vermogenIds.length === 1 && kortId(d.vermogenIds[0])
    && typeof d.commissieId === 'string' && d.commissieId.length <= 100
}

// Veldfouten voor de datum: { begin?, eind? }. Een onvolledige datum in de kiezer (badInput) controleert de app zelf.
export function activiteitDatumFout(begin, eind) {
  const fout = {}
  if (!begin) fout.begin = 'Vul een begindatum in.'
  else if (!geldigeDatum(begin)) fout.begin = 'Vul een hele datum in.'
  if (!geldigeDatum(eind)) fout.eind = 'Vul een hele datum in, of maak het veld leeg.'
  if (!fout.begin && !fout.eind && eind && eind < begin) fout.eind = 'De einddatum ligt vóór de begindatum.'
  return fout
}

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

// Alleen splitsen, nooit new Date(): een tijdzone kan de dag verschuiven
function delen(datum) {
  const [jaar, maand, dag] = datum.split('-')
  return { jaar, maand: MAANDEN[Number(maand) - 1] || maand, dag: String(Number(dag)) }
}

export function datumTekst(begin, eind) {
  if (!begin || !geldigeDatum(begin)) return ''
  const b = delen(begin)
  if (!eind || !geldigeDatum(eind) || eind <= begin) return `${b.dag} ${b.maand} ${b.jaar}`
  const e = delen(eind)
  if (b.jaar !== e.jaar) return `${b.dag} ${b.maand} ${b.jaar} – ${e.dag} ${e.maand} ${e.jaar}`
  if (b.maand !== e.maand) return `${b.dag} ${b.maand} – ${e.dag} ${e.maand} ${e.jaar}`
  return `${b.dag} – ${e.dag} ${e.maand} ${e.jaar}`
}

// Op begindatum, dan einddatum (leeg eerst), dan naam
export function sorteerActiviteiten(lijst) {
  const s = v => (typeof v === 'string' ? v : '')
  return lijst.sort((a, b) => s(a.begindatum).localeCompare(s(b.begindatum))
    || s(a.einddatum).localeCompare(s(b.einddatum))
    || String(a.naam).localeCompare(String(b.naam), 'nl'))
}

// Dubbel = dezelfde naam (hoofdletters en spaties tellen niet) op dezelfde begindatum, bij een andere activiteit
export function activiteitBezet(lijst, naam, begindatum, eigenId = null) {
  return naamBezet(lijst.filter(x => x.begindatum === begindatum), naam, eigenId)
}

const kolom = (db, clubId) => collection(db, 'clubs', clubId, 'activiteiten')
const metId = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))

export async function laadActiviteiten(db, clubId) {
  return sorteerActiviteiten(metId(await getDocs(kolom(db, clubId))))
}

export async function laadActiviteitenVanVermogen(db, clubId, vermogenId) {
  return sorteerActiviteiten(metId(await getDocs(query(kolom(db, clubId), where('vermogenIds', 'array-contains', vermogenId)))))
}

export async function telActiviteitenVanCommissie(db, clubId, commissieId) {
  return (await getCountFromServer(query(kolom(db, clubId), where('commissieId', '==', commissieId)))).data().count
}

export async function voegActiviteitToe(db, clubId, data) {
  const ref = await addDoc(kolom(db, clubId), activiteitVelden(data))
  return { id: ref.id }
}

// Eerst lezen: op een verdwenen document geven de regels permission-denied, niet not-found
export async function bewerkActiviteit(db, clubId, id, data) {
  const ref = doc(db, 'clubs', clubId, 'activiteiten', id)
  if (!(await getDoc(ref)).exists()) throw { code: 'activiteit-weg' }
  try {
    await updateDoc(ref, activiteitVelden(data))
  } catch (e) {
    if (e?.code === 'not-found') throw { code: 'activiteit-weg' }
    throw e
  }
}

export async function verwijderActiviteit(db, clubId, id) {
  const ref = doc(db, 'clubs', clubId, 'activiteiten', id)
  if (!(await getDoc(ref)).exists()) throw { code: 'activiteit-weg' }
  await deleteDoc(ref)
}
