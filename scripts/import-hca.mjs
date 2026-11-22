// Eenmalige import: HCA pijlers & domeinen → structuurelementen
// Gebruik: node scripts/import-hca.mjs [e-mailadres] [--omgeving=test|productie]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, getDoc, doc } from 'firebase/firestore'
import { startScript, argumenten, vraag, inloggen, zoekClubId, geweigerd, gelukt } from './lib/omgeving.mjs'

const items = [
  { type: 'pijler', naam: '#HCASpeelt', omschrijving: 'Hockey', verantwoordelijke: '' },
  { type: 'pijler', naam: '#HCAGroeit', omschrijving: 'Hockey', verantwoordelijke: '' },
  { type: 'pijler', naam: '#HCADoet',   omschrijving: 'Hockey', verantwoordelijke: 'Voorzitter' },
  { type: 'domein', naam: 'Bestuur',      omschrijving: 'Voorzitter' },
  { type: 'domein', naam: 'Communicatie', omschrijving: 'Secretaris' },
  { type: 'domein', naam: 'Financiën',    omschrijving: 'Penningmeester' },
]

const { omgeving, projectId, firebaseConfig } = await startScript({ droogMogelijk: false })
const email = argumenten()[0] || await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
console.log(`Ingelogd (uid: ${user.uid})\n`)

const clubId = await zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving })

const col = collection(db, 'clubs', clubId, 'structuurelementen')
const sleutel = (type, naam) => `${type}|${(naam || '').trim().toLowerCase()}`
let bestaand
try {
  bestaand = new Set((await getDocs(col)).docs.map(d => sleutel(d.data().type, d.data().naam)))
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

let toegevoegd = 0, overgeslagen = 0
for (const item of items) {
  const label = item.type === 'pijler' ? 'Pijler' : 'Domein'
  const k = sleutel(item.type, item.naam)
  if (bestaand.has(k)) {
    console.log(`  – ${label}: ${item.naam} (bestaat al, overgeslagen)`)
    overgeslagen++
    continue
  }
  const nieuw = { type: item.type, naam: item.naam, omschrijving: item.omschrijving }
  if (item.type === 'pijler' && item.verantwoordelijke) nieuw.verantwoordelijke = item.verantwoordelijke
  try {
    await addDoc(col, nieuw)
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, gedeeltelijk: toegevoegd > 0 })
  }
  bestaand.add(k)
  console.log(`  ✓ ${label}: ${item.naam}`)
  toegevoegd++
}

gelukt(`import voltooid: ${toegevoegd} toegevoegd, ${overgeslagen} overgeslagen in ${projectId}.`)
process.exit(0)
