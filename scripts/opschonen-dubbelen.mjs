// Eenmalige opschoning: dubbele pijlers & domeinen in structuurelementen verwijderen
// Houdt per (type + naam) één exemplaar over. Gebruik: node scripts/opschonen-dubbelen.mjs

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
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

const env = leesEnv()
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

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
console.log('Ingelogd.\n')

const col = collection(db, 'clubs', user.uid, 'structuurelementen')
const docs = (await getDocs(col)).docs
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
for (const d of weg) console.log(`  – ${d.data().type}: ${d.data().naam}`)

const antwoord = await vraag(`\nDeze ${weg.length} dubbele items verwijderen? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets verwijderd.'); process.exit(0) }

for (const d of weg) await deleteDoc(doc(col, d.id))
console.log(`\nKlaar: ${weg.length} verwijderd, ${docs.length - weg.length} over.`)
process.exit(0)
