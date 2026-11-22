// Vult de testclub (alleen project TEST) met clubprofiel, 6 bestuursfuncties en 15 domeinen.
// Idempotent op naam: bestaande items worden bijgewerkt, ontbrekende toegevoegd, niets verwijderd.
// Schrijft niet in clubs/{clubId}, leden of gebruikers: die maak je in de testconsole (README, "Omgevingen").
// Gebruik: node scripts/seed-testclub.mjs [--droog]

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, getDoc, doc, writeBatch } from 'firebase/firestore'
import { startScript, vraag, inloggen, zoekClubId, geweigerd, gelukt, waarschuw } from './lib/omgeving.mjs'

const PROFIEL = { naam: 'Testclub clubKOMPAS', afkorting: 'TST', seizoen: '2026–2027' }

const FUNCTIES = ['Voorzitter', 'Secretaris', 'Penningmeester', 'Bestuurslid Hockey', 'Bestuurslid Accommodatie', 'Bestuurslid Hospitality']

// Overgenomen uit inrichten-domeinen-hca.mjs (DOMEINEN) en inrichten-beheer-hca.mjs (NIEUWE_DOMEINEN, KOPPELING)
// [volgorde, type, naam, bestuursfunctie, icoon, omschrijving]
const DOMEINEN = [
  [1, 'domein', 'Bestuur', 'Voorzitter', 'bestuur', ''],
  [2, 'domein', 'Leden', 'Secretaris', 'leden', 'Ledenwerving, ledenbeheer, ledenbehoud, oudleden en lief & leed.'],
  [3, 'domein', 'Vrijwilligers', 'Secretaris', 'vrijwilligers', 'Werving, beheer en behoud van vrijwilligers.'],
  [4, 'domein', 'Relaties', 'Penningmeester', 'relaties', 'Sponsoren, fondsen, donateurs en kledingpartnerschap.'],
  [5, 'domein', 'Communicatie', 'Secretaris', 'communicatie', ''],
  [6, 'pijler', '#HCASpeelt', 'Bestuurslid Hockey', 'hcaspeelt', ''],
  [7, 'pijler', '#HCAGroeit', 'Bestuurslid Hockey', 'hcagroeit', ''],
  [8, 'pijler', '#HCADoet', 'Voorzitter', 'hcadoet', ''],
  [9, 'domein', 'Financiën', 'Penningmeester', 'financien', ''],
  [10, 'domein', 'Accommodatie', 'Bestuurslid Accommodatie', 'accommodatie', 'Onderhoud en beveiliging van ons park en clubhuis.'],
  [11, 'domein', 'Hospitality', 'Bestuurslid Hospitality', 'hospitality', 'Bar en keuken, catering, evenementen, verhuur en reserveringen.'],
  [12, 'domein', 'Materiaal', 'Bestuurslid Accommodatie', 'materiaal', 'Spelmateriaal en kleding.'],
  [13, 'domein', 'Digitaal', 'Voorzitter', 'digitaal', 'Website, licenties en systemen.'],
  [14, 'overkoepelend', 'Projecten', 'Voorzitter', 'projecten', 'Tijdelijke trajecten, zoals verbouw, LED-scorebord en buitenopslag.'],
  [15, 'overkoepelend', 'Samenwerkingen', 'Voorzitter', 'samenwerkingen', 'Partners buiten de club: KNHB, gemeente, Junis, scholen en hulpdiensten.'],
]

const { omgeving, projectId, firebaseConfig, droog: DROOG } = await startScript({ alleenTest: true })
const email = await vraag('E-mailadres (testgebruiker): ')
const wachtwoord = await vraag('Wachtwoord: ', true)

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

console.log('\nInloggen...')
const user = await inloggen(auth, signInWithEmailAndPassword, email, wachtwoord, projectId)
console.log(`Ingelogd (uid: ${user.uid})\n`)

const clubId = await zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving })

const sleutel = naam => (naam || '').trim().toLowerCase()
const profielRef = doc(db, 'clubs', clubId, 'instellingen', 'profiel')
const colF = collection(db, 'clubs', clubId, 'bestuursfuncties')
const colD = collection(db, 'clubs', clubId, 'structuurelementen')

let profiel, functies, domeinen
try {
  const p = await getDoc(profielRef)
  profiel = p.exists() ? p.data() : null
  functies = new Map((await getDocs(colF)).docs.map(d => [sleutel(d.data().naam), d.id]))
  domeinen = new Map((await getDocs(colD)).docs.map(d => [sleutel(d.data().naam), d.id]))
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid, actie: 'het lezen' })
}

const plan = []
const functieId = new Map()
FUNCTIES.forEach((naam, i) => {
  const id = functies.get(sleutel(naam))
  const ref = id ? doc(colF, id) : doc(colF)
  functieId.set(naam, ref.id)
  plan.push({ soort: 'Bestuursfunctie', naam, ref, nieuw: !id, data: { naam, volgorde: i + 1 } })
})
for (const [volgorde, type, naam, functie, icoon, omschrijving] of DOMEINEN) {
  const id = domeinen.get(sleutel(naam))
  const ref = id ? doc(colD, id) : doc(colD)
  const data = { type, naam, icoon, volgorde, bestuursfunctieId: functieId.get(functie) }
  if (omschrijving) data.omschrijving = omschrijving
  plan.push({ soort: 'Domein', naam, ref, nieuw: !id, data })
  domeinen.delete(sleutel(naam))
}

const toegevoegd = plan.filter(p => p.nieuw).length
const bijgewerkt = plan.length - toegevoegd

console.log(`Clubprofiel: ${PROFIEL.naam} (${PROFIEL.afkorting}, seizoen ${PROFIEL.seizoen}) — ${profiel ? 'bijwerken' : 'nieuw'}`)
for (const soort of ['Bestuursfunctie', 'Domein']) {
  const rijen = plan.filter(p => p.soort === soort)
  console.log(`\n${soort === 'Domein' ? 'Domeinen' : 'Bestuursfuncties'}: ${rijen.filter(p => p.nieuw).length} nieuw, ${rijen.filter(p => !p.nieuw).length} bijwerken`)
  for (const p of rijen) {
    const extra = p.soort === 'Domein' ? ` (${p.data.type}, plek ${p.data.volgorde})` : ''
    console.log(`  ${p.nieuw ? '+' : '~'} ${p.naam}${extra}`)
  }
}
for (const naam of domeinen.keys()) {
  waarschuw(`"${naam}" staat niet in de seed-lijst; ongemoeid gelaten.`)
}

if (DROOG) {
  gelukt(`droogtest: ${toegevoegd} toegevoegd, ${bijgewerkt} bijgewerkt in ${projectId}.`, ['Er is niets geschreven.'])
  process.exit(0)
}
const antwoord = await vraag(`\nDeze ${plan.length} items en het clubprofiel schrijven? Typ "ja": `)
if (antwoord.trim().toLowerCase() !== 'ja') { console.log('Afgebroken, niets geschreven.'); process.exit(0) }

const batch = writeBatch(db)
batch.set(profielRef, PROFIEL, { merge: true })
for (const p of plan) batch.set(p.ref, p.data, { merge: true })
try {
  await batch.commit()
} catch (e) {
  geweigerd(e, { projectId, clubId, uid: user.uid })
}

gelukt(`${toegevoegd} toegevoegd, ${bijgewerkt} bijgewerkt in ${projectId}.`, ['Clubprofiel bijgewerkt. Controleer met npm run dev en log in met de testgebruiker.'])
process.exit(0)
