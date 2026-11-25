// Omzetten naar uitvoeringen (CK-172): elke activiteit met een oude begindatum of einddatum krijgt één
// uitvoering met hetzelfde id als de activiteit, en de oude velden gaan van de activiteit af (één batch
// per activiteit). Een tweede keer draaien maakt dus geen dubbele. Dubbele namen meldt het alleen.
// Gebruik: node scripts/zet-uitvoeringen-om.mjs [--droog] [--omgeving=test|productie]
//          npm run uitvoeringen:omzetten -- --droog

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, writeBatch, deleteField } from 'firebase/firestore'
import { DROOG, kiesOmgeving, startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, waarschuw, stop, veilig } from './lib/omgeving.mjs'
import { planOmzetting, BLOKKEREND } from './lib/uitvoeringen-omzetten.mjs'

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Activiteiten omzetten naar uitvoeringen (CK-172)

Gebruik:  node scripts/zet-uitvoeringen-om.mjs [--droog] [--omgeving=test|productie]

  --droog              alleen tonen wat er gebeurt, niets schrijven
  --omgeving=test      standaard
  --omgeving=productie alleen samen met --droog (in productie wordt niets omgezet)

Per activiteit met een oude begindatum of einddatum: één uitvoering (id = het id van de activiteit)
en de oude velden weg, samen in één batch. Meldt zonder te schrijven: ongeldige oude datums,
activiteiten die ook na het omzetten niet aan de regels voldoen, dubbele namen en uitvoeringen
zonder activiteit. Exitcode 0 = alles omgezet of niets te doen, 1 = er bleef iets over.`)
  process.exit(0)
}

// Besluit 4 (CK-172): in productie niets omzetten, alleen kijken
if (kiesOmgeving() === 'productie' && !DROOG) {
  stop('in productie wordt niets omgezet (CK-172, besluit 4).', ['Draai met --droog om alleen te kijken: npm run uitvoeringen:omzetten -- --droog --omgeving=productie'])
}

const { projectId, omgeving, firebaseConfig } = await startScript()
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
let activiteiten, uitvoeringen, vermogens, commissies
try {
  ;[activiteiten, uitvoeringen, vermogens, commissies] = await Promise.all([lees('activiteiten'), lees('uitvoeringen'), lees('vermogens'), lees('commissies')])
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

const { omzetten, afwijkingen } = planOmzetting({ activiteiten, uitvoeringen, vermogens, commissies })
const metOudeVelden = activiteiten.filter(x => Object.hasOwn(x, 'begindatum') || Object.hasOwn(x, 'einddatum')).length
console.log(`${activiteiten.length} activiteiten, waarvan ${metOudeVelden} nog met oude datumvelden. ${uitvoeringen.length} uitvoeringen.`)

if (omzetten.length) {
  console.log(`\nOm te zetten (${omzetten.length}):`)
  for (const o of omzetten) {
    console.log(veilig(o.uitvoering
      ? `  ${o.naam}: ${o.datum} → 1 uitvoering`
      : `  ${o.naam}: de uitvoering bestaat al, alleen de oude velden weg`))
  }
}
if (afwijkingen.length) {
  waarschuw(`${afwijkingen.length} melding(en) die dit script niet oplost:`, afwijkingen.map(a => `- ${a.tekst}`))
}
const blokkerend = afwijkingen.filter(a => BLOKKEREND.has(a.soort)).length

if (!omzetten.length) {
  if (blokkerend) stop('niets om te zetten, maar er zijn activiteiten overgeslagen (zie hierboven).', [], 'geschreven', 'LET OP')
  gelukt('Niets te doen: geen activiteit heeft nog oude datumvelden.')
  process.exit(0)
}

if (DROOG) {
  console.log('\nDroogtest klaar. Er is niets geschreven.')
  process.exit(1)
}

const antwoord = await vraag(`\nDeze ${omzetten.length} activiteit(en) omzetten in ${projectId}? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, er is niets geschreven.'); process.exit(1) }

let gedaan = 0
for (const o of omzetten) {
  const batch = writeBatch(db)
  if (o.uitvoering) batch.set(doc(db, 'clubs', clubId, 'uitvoeringen', o.activiteitId), o.uitvoering)
  batch.update(doc(db, 'clubs', clubId, 'activiteiten', o.activiteitId), Object.fromEntries(o.velden.map(k => [k, deleteField()])))
  try {
    await batch.commit()
  } catch (e) {
    geweigerd(e, { projectId, clubId, uid: user.uid, gedeeltelijk: gedaan > 0 })
  }
  gedaan++
}

if (blokkerend) {
  stop(`${gedaan} activiteit(en) omgezet; ${blokkerend} overgeslagen (zie hierboven).`, ['Herstel ze in Beheer → Activiteiten en draai het script opnieuw.'], null, 'LET OP')
}
gelukt(`${gedaan} activiteit(en) omgezet in ${projectId}.`, ['Draai het script nog eens: dan hoort er "Niets te doen" te staan.'])
process.exit(0)
