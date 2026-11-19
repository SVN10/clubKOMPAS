// Eenmalige import: HCA pijlers & domeinen → structuurelementen
// Gebruik: node scripts/import-hca.mjs

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore'
import { createInterface } from 'readline'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function leesEnv() {
  return Object.fromEntries(
    readFileSync(join(__dir, '..', '.env'), 'utf-8').split('\n')
      .map(r => r.trim())
      .filter(r => r && !r.startsWith('#') && r.includes('='))
      .map(r => { const i = r.indexOf('='); return [r.slice(0, i).trim(), r.slice(i + 1).trim()] })
  )
}

function vraag(prompt, verborgen = false) {
  if (verborgen && process.stdin.isTTY) return vraagVerborgen(prompt)
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(prompt, ans => { rl.close(); resolve(ans) })
  })
}

// Leest invoer zonder iets op het scherm te tonen (geen tekens, geen sterretjes)
function vraagVerborgen(prompt) {
  return new Promise(resolve => {
    const stdin = process.stdin
    let invoer = ''
    process.stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const opToets = tekens => {
      for (const t of tekens) {
        if (t === '\r' || t === '\n' || t === '\u0004') {        // Enter / Ctrl+D
          stdin.setRawMode(false)
          stdin.pause()
          stdin.removeListener('data', opToets)
          process.stdout.write('\n')
          return resolve(invoer)
        } else if (t === '\u0003') {                             // Ctrl+C
          stdin.setRawMode(false)
          process.stdout.write('\n')
          process.exit(130)
        } else if (t === '\u007f' || t === '\b') {              // Backspace
          invoer = invoer.slice(0, -1)
        } else if (t >= ' ') {
          invoer += t
        }
      }
    }
    stdin.on('data', opToets)
  })
}

const items = [
  { type: 'pijler', naam: '#HCASpeelt', omschrijving: 'Hockey', verantwoordelijke: '' },
  { type: 'pijler', naam: '#HCAGroeit', omschrijving: 'Hockey', verantwoordelijke: '' },
  { type: 'pijler', naam: '#HCADoet',   omschrijving: 'Hockey', verantwoordelijke: 'Voorzitter' },
  { type: 'domein', naam: 'Bestuur',      omschrijving: 'Voorzitter' },
  { type: 'domein', naam: 'Communicatie', omschrijving: 'Secretaris' },
  { type: 'domein', naam: 'Financiën',    omschrijving: 'Penningmeester' },
]

const env = leesEnv()
const email = process.argv[2] || await vraag('E-mailadres: ')
const wachtwoord = process.argv[3] || await vraag('Wachtwoord: ', true)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
let user
try {
  ({ user } = await signInWithEmailAndPassword(auth, email, wachtwoord))
} catch (e) {
  console.error(`Inloggen mislukt: ${e.code}`)
  process.exit(1)
}
console.log(`Ingelogd (uid: ${user.uid})\n`)

const col = collection(db, 'clubs', user.uid, 'structuurelementen')
const sleutel = (type, naam) => `${type}|${(naam || '').trim().toLowerCase()}`
const bestaand = new Set((await getDocs(col)).docs.map(d => sleutel(d.data().type, d.data().naam)))

let toegevoegd = 0, overgeslagen = 0
for (const item of items) {
  const label = item.type === 'pijler' ? 'Pijler' : 'Domein'
  const k = sleutel(item.type, item.naam)
  if (bestaand.has(k)) {
    console.log(`  – ${label}: ${item.naam} (bestaat al, overgeslagen)`)
    overgeslagen++
    continue
  }
  const doc = { type: item.type, naam: item.naam, omschrijving: item.omschrijving }
  if (item.type === 'pijler' && item.verantwoordelijke) doc.verantwoordelijke = item.verantwoordelijke
  await addDoc(col, doc)
  bestaand.add(k)
  console.log(`  ✓ ${label}: ${item.naam}`)
  toegevoegd++
}

console.log(`\nImport voltooid: ${toegevoegd} toegevoegd, ${overgeslagen} overgeslagen.`)
process.exit(0)
