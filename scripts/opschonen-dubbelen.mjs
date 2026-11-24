// Eenmalige opschoning: dubbele pijlers & domeinen in structuurelementen verwijderen
// Houdt per (type + naam) één exemplaar over. Gebruik: node scripts/opschonen-dubbelen.mjs [--omgeving=test|productie]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore'
import { startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, veilig } from './lib/omgeving.mjs'

const { omgeving, projectId, firebaseConfig } = await startScript({ droogMogelijk: false })
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
console.log('Ingelogd.\n')

const clubId = await zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving })

const col = collection(db, 'clubs', clubId, 'structuurelementen')
let docs
try {
  docs = (await getDocs(col)).docs
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}
const groepen = new Map()
for (const d of docs) {
  const k = `${d.data().type}|${(d.data().naam || '').trim().toLowerCase()}`
  if (!groepen.has(k)) groepen.set(k, [])
  groepen.get(k).push(d)
}

// Per groep: bewaar het exemplaar met de meeste ingevulde velden, de rest is dubbel
const weg = []
for (const groep of groepen.values()) {
  if (groep.length < 2) continue
  const gevuld = d => Object.values(d.data()).filter(v => v !== '' && v != null).length
  groep.sort((a, b) => gevuld(b) - gevuld(a))
  weg.push(...groep.slice(1))
}

console.log(`${docs.length} items gevonden, ${weg.length} dubbel.`)
if (weg.length === 0) { console.log('Niets op te ruimen.'); process.exit(0) }
for (const d of weg) console.log(veilig(`  – ${d.data().type}: ${d.data().naam}`))

const antwoord = await vraag(`\nDeze ${weg.length} dubbele items verwijderen? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets verwijderd.'); process.exit(0) }

let verwijderd = 0
for (const d of weg) {
  try {
    await deleteDoc(doc(col, d.id))
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het verwijderen', gedeeltelijk: verwijderd > 0 })
  }
  verwijderd++
}
gelukt(`${weg.length} verwijderd, ${docs.length - weg.length} over in ${projectId}.`)
process.exit(0)
