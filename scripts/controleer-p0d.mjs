// Controle vóór het publiceren van de P0d-regels: voldoen clubprofiel, bestuursfuncties en domeinen
// aan de nieuwe veldcontrole, en heb jij de rol "beheerder"? Haalt na "ja" alleen onbekende velden weg
// (zoals het oude 'verantwoordelijke'). Te lange teksten of verkeerde typen meldt het: die pas je aan in Beheer.
// Werkt onder de oude én de nieuwe regels. Volgorde: eerst --droog, dan zonder, dan pas de regels publiceren.
// Gebruik: node scripts/controleer-p0d.mjs [--droog] [--omgeving=test|productie]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, deleteField } from 'firebase/firestore'
import { DROOG, startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, waarschuw, stop, veilig } from './lib/omgeving.mjs'
import { controleerP0d } from './lib/p0d-velden.mjs'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Data controleren voor de P0d-regels

Gebruik:  node scripts/controleer-p0d.mjs [--droog] [--omgeving=test|productie]

  --droog              alleen controleren, niets weghalen
  --omgeving=test      standaard
  --omgeving=productie vraagt eerst de projectnaam (behalve met --droog)

Controleert je eigen rol en de velden van instellingen/profiel, bestuursfuncties en
structuurelementen. Haalt alleen onbekende velden weg (na "ja").
Exitcode 0 = alles klopt, 1 = er zijn afwijkingen.`)
  process.exit(0)
}

const { omgeving, projectId, firebaseConfig } = await startScript()
const email = await vraag('E-mailadres: ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
console.log('Ingelogd.\n')

const clubId = await zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving })

const lees = async naam => (await getDocs(collection(db, 'clubs', clubId, naam))).docs.map(d => ({ id: d.id, data: d.data() }))
let rol, profiel, functies, domeinen
try {
  const [lid, p] = await Promise.all([
    getDoc(doc(db, 'clubs', clubId, 'leden', user.uid)),
    getDoc(doc(db, 'clubs', clubId, 'instellingen', 'profiel')),
  ])
  rol = lid.exists() ? lid.data().rol : null
  profiel = p.exists() ? p.data() : null
  ;[functies, domeinen] = await Promise.all([lees('bestuursfuncties'), lees('structuurelementen')])
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

const { afwijkingen, herstel } = controleerP0d({ rol, profiel, functies, domeinen })
console.log(`Rol ${veilig(JSON.stringify(rol ?? null))}, ${profiel ? 'clubprofiel' : 'geen clubprofiel'}, ${functies.length} bestuursfuncties en ${domeinen.length} domeinen gecontroleerd.`)

if (afwijkingen.length === 0 && herstel.length === 0) {
  gelukt('Alles klopt. Je kunt de P0d-regels publiceren.')
  process.exit(0)
}

if (afwijkingen.length) {
  waarschuw(`${afwijkingen.length} afwijking(en) die dit script niet herstelt:`, afwijkingen.map(a => `- ${a}`))
}
if (herstel.length) {
  console.log(`${herstel.length} document(en) met onbekende velden (worden weggehaald):`)
  for (const h of herstel) console.log(veilig(`  - ${h.pad} (${h.naam}): ${h.velden.join(', ')}`))
}

if (DROOG || herstel.length === 0) {
  console.log(DROOG && herstel.length ? '\nDroogtest klaar. Niets weggehaald.' : '')
  process.exit(1)
}

const antwoord = await vraag(`\nDeze velden weghalen in ${projectId}? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets weggehaald.'); process.exit(1) }

let gedaan = 0
for (const h of herstel) {
  const ref = doc(db, 'clubs', clubId, ...h.pad.split('/'))
  try {
    await updateDoc(ref, Object.fromEntries(h.velden.map(v => [v, deleteField()])))
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, gedeeltelijk: gedaan > 0 })
  }
  gedaan++
}

if (afwijkingen.length) {
  stop(`${gedaan} document(en) opgeschoond; ${afwijkingen.length} afwijking(en) blijven over (zie hierboven).`, ['Pas die aan in Beheer of de console en draai het script opnieuw.', 'Publiceer de regels pas als er "Alles klopt" staat.'], null, 'LET OP')
}
gelukt(`${gedaan} document(en) opgeschoond in ${projectId}.`, ['Draai het script nog eens: dan hoort er "Alles klopt" te staan.'])
process.exit(0)
