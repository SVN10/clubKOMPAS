// Eenmalig (CK-028): bestuursfuncties als masterdata en de overkoepelende domeinen.
// - maakt de 6 officiële bestuursfuncties aan (als ze ontbreken)
// - voegt Projecten (14) en Samenwerkingen (15) toe als overkoepelend domein
// - koppelt elk domein via bestuursfunctieId en verwijdert het oude tekstveld 'verantwoordelijke'
// Gebruik: node scripts/inrichten-beheer-hca.mjs [--droog] [--omgeving=test|productie]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteField } from 'firebase/firestore'
import { startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, veilig } from './lib/omgeving.mjs'

const FUNCTIES = ['Voorzitter', 'Secretaris', 'Penningmeester', 'Bestuurslid Hockey', 'Bestuurslid Accommodatie', 'Bestuurslid Hospitality']

// domein → bestuursfunctie (Vermogensoverzicht v1.4; Projecten en Samenwerkingen: Voorzitter)
const KOPPELING = {
  'Bestuur': 'Voorzitter', 'Leden': 'Secretaris', 'Vrijwilligers': 'Secretaris', 'Relaties': 'Penningmeester',
  'Communicatie': 'Secretaris', '#HCASpeelt': 'Bestuurslid Hockey', '#HCAGroeit': 'Bestuurslid Hockey',
  '#HCADoet': 'Voorzitter', 'Financiën': 'Penningmeester', 'Accommodatie': 'Bestuurslid Accommodatie',
  'Hospitality': 'Bestuurslid Hospitality', 'Materiaal': 'Bestuurslid Accommodatie', 'Digitaal': 'Voorzitter',
  'Projecten': 'Voorzitter', 'Samenwerkingen': 'Voorzitter',
}

const NIEUWE_DOMEINEN = [
  { type: 'overkoepelend', naam: 'Projecten', omschrijving: 'Tijdelijke trajecten, zoals verbouw, LED-scorebord en buitenopslag.', icoon: 'projecten', volgorde: 14 },
  { type: 'overkoepelend', naam: 'Samenwerkingen', omschrijving: 'Partners buiten de club: KNHB, gemeente, Junis, scholen en hulpdiensten.', icoon: 'samenwerkingen', volgorde: 15 },
]

const { omgeving, projectId, firebaseConfig, droog: DROOG } = await startScript()
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
console.log('Ingelogd.\n')

const clubId = await zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving })

const sleutel = naam => (naam || '').trim().toLowerCase()
const colF = collection(db, 'clubs', clubId, 'bestuursfuncties')
const colD = collection(db, 'clubs', clubId, 'structuurelementen')
let functies, domeinen
try {
  functies = new Map((await getDocs(colF)).docs.map(d => [sleutel(d.data().naam), { id: d.id, ...d.data() }]))
  domeinen = (await getDocs(colD)).docs.map(d => ({ id: d.id, ...d.data() }))
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

// 1. Bestuursfuncties
const nieuweFuncties = FUNCTIES.filter(n => !functies.has(sleutel(n)))
console.log(`Bestuursfuncties: ${FUNCTIES.length - nieuweFuncties.length} bestaan al, ${nieuweFuncties.length} nieuw`)
nieuweFuncties.forEach(n => console.log(`  + ${n}`))

// 2. Nieuwe domeinen
const bestaandeNamen = new Set(domeinen.map(d => sleutel(d.naam)))
const nieuweDomeinen = NIEUWE_DOMEINEN.filter(d => !bestaandeNamen.has(sleutel(d.naam)))
console.log(`\nNieuwe domeinen: ${nieuweDomeinen.length}`)
nieuweDomeinen.forEach(d => console.log(`  + ${d.naam} (overkoepelend, plek ${d.volgorde}, ${KOPPELING[d.naam]})`))

// 3. Koppelingen
const alleDomeinen = [...domeinen, ...nieuweDomeinen.map(d => ({ ...d, nieuw: true }))]
console.log('\nKoppeling domein → bestuursfunctie:')
let ontbreekt = 0
for (const d of alleDomeinen) {
  const f = KOPPELING[d.naam]
  if (!f) { console.log(veilig(`  LET OP: geen koppeling bekend voor "${d.naam}"; ongemoeid gelaten.`)); ontbreekt++; continue }
  console.log(veilig(`  ${d.naam} → ${f}${d.verantwoordelijke && d.verantwoordelijke !== f ? `  (was "${d.verantwoordelijke}")` : ''}`))
}

if (DROOG) { console.log('\nDroogtest klaar. Niets geschreven.'); process.exit(0) }
const antwoord = await vraag('\nUitvoeren? Typ "ja": ')
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets gewijzigd.'); process.exit(0) }

let gedaan = 0
const schrijf = async actie => {
  try {
    const r = await actie()
    gedaan++
    return r
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, gedeeltelijk: gedaan > 0 })
  }
}
let volgorde = Math.max(0, ...[...functies.values()].map(f => (typeof f.volgorde === 'number' ? f.volgorde : 0)))
for (const naam of FUNCTIES) {
  if (functies.has(sleutel(naam))) continue
  const ref = await schrijf(() => addDoc(colF, { naam, volgorde: ++volgorde }))
  functies.set(sleutel(naam), { id: ref.id, naam })
}
const idVan = naam => functies.get(sleutel(naam))?.id

for (const d of nieuweDomeinen) await schrijf(() => addDoc(colD, { ...d, bestuursfunctieId: idVan(KOPPELING[d.naam]) }))
let gekoppeld = 0
for (const d of domeinen) {
  const f = KOPPELING[d.naam]
  if (!f) continue
  const data = { bestuursfunctieId: idVan(f) }
  if ('verantwoordelijke' in d) data.verantwoordelijke = deleteField()
  await schrijf(() => updateDoc(doc(colD, d.id), data))
  gekoppeld++
}
gelukt(`${nieuweFuncties.length} bestuursfuncties en ${nieuweDomeinen.length} domeinen toegevoegd, ${gekoppeld} domeinen gekoppeld in ${projectId}.${ontbreekt ? ` ${ontbreekt} zonder koppeling.` : ''}`)
process.exit(0)
