// Eenmalig: de projecten en samenwerkingen van HCA neerzetten (CK-046) en op de overkoepelende domeinen
// Projecten en Samenwerkingen het veld bevat zetten, zodat de plaat ze toont. Eigenaar: de Voorzitter.
// Idempotent: een naam die al in de lijst staat, wordt overgeslagen. Wijzigt en verwijdert nooit bestaande items.
// Alles in één writeBatch: lukt het niet, dan is er niets geschreven en is opnieuw draaien veilig.
// Gebruik: node scripts/inrichten-projecten-samenwerkingen-hca.mjs [--droog] [--omgeving=test|productie]
//          npm run projecten:import -- --droog

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, writeBatch } from 'firebase/firestore'
import { DROOG, startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, waarschuw, stop, veilig } from './lib/omgeving.mjs'
import { SOORT_ONDERDEEL, STATUS_LABEL } from '../src/onderdelen.js'
import { maakOnderdelenPlan, HCA_ONDERDELEN, HCA_EIGENAAR } from './lib/onderdelen-hca.mjs'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Projecten en samenwerkingen van HCA inrichten (CK-046)

Gebruik:  node scripts/inrichten-projecten-samenwerkingen-hca.mjs [--droog] [--omgeving=test|productie]

  --droog              toon het plan, schrijf niets
  --omgeving=test      standaard
  --omgeving=productie vraagt eerst de projectnaam

Eerst wordt het hele plan opgesteld. Ontbreekt het domein Projecten of Samenwerkingen, is het dubbel,
niet overkoepelend of toont het al iets anders, ontbreekt de bestuursfunctie ${HCA_EIGENAAR}, of voldoet
een naam niet, dan stopt het script zonder te schrijven. Daarna "ja" typen.
Publiceer eerst de Firestore-regels van CK-046 in deze omgeving.`)
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

const lees = async naam => (await getDocs(collection(db, 'clubs', clubId, naam))).docs.map(d => ({ id: d.id, ...d.data() }))
let domeinen, functies, projecten, samenwerkingen
try {
  ;[domeinen, functies, projecten, samenwerkingen] = await Promise.all([
    lees('structuurelementen'), lees('bestuursfuncties'), lees('projecten'), lees('samenwerkingen'),
  ])
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

const { fouten, nieuw, bevat, overgeslagen, letOp } = maakOnderdelenPlan({ domeinen, functies, projecten, samenwerkingen })
if (fouten.length) stop('het plan klopt niet.', fouten.map(f => `- ${f}`))

const totaal = Object.values(HCA_ONDERDELEN).reduce((n, l) => n + l.length, 0)
console.log(`${totaal} items in de bronlijst: ${nieuw.length} nieuw, ${overgeslagen.length} al aanwezig. Eigenaar: ${HCA_EIGENAAR}.\n`)
for (const { soort, velden } of nieuw) {
  const status = SOORT_ONDERDEEL[soort].status ? `${STATUS_LABEL[velden.status].toLowerCase()}, ` : ''
  console.log(veilig(`  + ${SOORT_ONDERDEEL[soort].enkel} ${velden.naam} (${status}volgorde ${velden.volgorde})`))
}
for (const b of bevat) console.log(veilig(`  + bevat=${b.soort} op ${b.domeinNaam}`))
if (letOp.length) waarschuw(`${letOp.length} item(s) ongemoeid gelaten:`, letOp)

const schrijfacties = nieuw.length + bevat.length
if (DROOG || schrijfacties === 0) {
  console.log(DROOG ? '\nDroogtest klaar. Niets geschreven.' : '\nNiets te doen.')
  process.exit(0)
}
const antwoord = await vraag(`\nDeze ${schrijfacties} schrijfacties uitvoeren in ${projectId}? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets geschreven.'); process.exit(0) }

const batch = writeBatch(db)
for (const { soort, velden } of nieuw) batch.set(doc(collection(db, 'clubs', clubId, soort)), velden)
for (const b of bevat) batch.update(doc(db, 'clubs', clubId, 'structuurelementen', b.domeinId), { bevat: b.soort })
try {
  await batch.commit()
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid })
}
gelukt(`${nieuw.length} items toegevoegd en ${bevat.length} domein(en) bijgewerkt in ${projectId}.`, ['Controleer Beheer → Projecten, Beheer → Samenwerkingen en het Vermogensoverzicht.'])
process.exit(0)
