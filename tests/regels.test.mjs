// Regeltests CK-020 met de Firestore-emulator (besluit 11). Geen login, geen echt project.
// Draaien: npm run test:regels (start de emulator met project demo-clubkompas en draait dit bestand).

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, writeBatch, setLogLevel,
} from 'firebase/firestore'
import {
  voegVermogenToe, hernoemVermogen, verplaatsVermogen, verwijderVermogen, controleerNaamVrij,
  laadVermogens, normaliseerVermogensnaam, vermogensnaamFout, naamSleutel,
} from '../src/vermogens.js'
import { HCA_VERMOGENS, maakImportplan, controleerVermogens } from '../scripts/lib/vermogens-hca.mjs'
import {
  SOORT_ONDERDEEL, PLAAT_SOORTEN, onderdeelnaamFout, periodeTekst, datumFout, geldigOnderdeel, onderdeelVelden, naamBezet,
  laadOnderdelen, voegOnderdeelToe, bewerkOnderdeel, verwijderOnderdeel,
} from '../src/onderdelen.js'
import { HCA_ONDERDELEN, maakOnderdelenPlan } from '../scripts/lib/onderdelen-hca.mjs'

const CLUB = 'club1'
// De bronlijst (CK-020-bron-vermogensoverzicht.md) bevat 58 namen (13 + 45), bevestigd tegen het HCA-overzicht v1.4.
// Zie het bouwverslag: het script importeert precies de namen uit de bron.
const BRON_AANTAL = 58
let env
let db
let buiten

const pad = (...delen) => ['clubs', CLUB, ...delen]
const admin = async fn => {
  let uitkomst
  await env.withSecurityRulesDisabled(async ctx => { uitkomst = await fn(ctx.firestore()) })
  return uitkomst
}
const lees = async (...delen) => admin(async a => {
  const s = await getDoc(doc(a, ...pad(...delen)))
  return s.exists() ? s.data() : null
})
const aantal = async naam => admin(async a => (await getDocs(collection(a, ...pad(naam)))).size)
const fout = async belofte => {
  try { await belofte } catch (e) { return e }
  assert.fail('verwacht een fout')
}

// Domeinen zoals in de testclub: zonder tellerveld (= 0)
const DOMEINEN = {
  speelt: { type: 'pijler', naam: '#HCASpeelt', volgorde: 6 },
  leden: { type: 'domein', naam: 'Leden', volgorde: 2 },
  vrijw: { type: 'domein', naam: 'Vrijwilligers', volgorde: 3 },
  fin: { type: 'domein', naam: 'Financiën', volgorde: 9 },
  proj: { type: 'overkoepelend', naam: 'Projecten', volgorde: 14 },
}

before(async () => {
  setLogLevel('silent')
  env = await initializeTestEnvironment({
    projectId: 'demo-clubkompas',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})

after(async () => { await env?.cleanup() })

beforeEach(async () => {
  await env.clearFirestore()
  await admin(async a => {
    await setDoc(doc(a, 'gebruikers', 'jan'), { clubId: CLUB })
    await setDoc(doc(a, 'clubs', CLUB), { naam: 'Testclub' })
    await setDoc(doc(a, ...pad('leden', 'jan')), { rol: 'beheerder' })
    for (const [id, d] of Object.entries(DOMEINEN)) await setDoc(doc(a, ...pad('structuurelementen', id)), d)
    await setDoc(doc(a, ...pad('bestuursfuncties', 'vz')), { naam: 'Voorzitter', volgorde: 1 })
  })
  db = env.authenticatedContext('jan').firestore()
  buiten = env.authenticatedContext('piet').firestore()
})

// Schrijft een vermogen buiten het app-protocol om (zoals via devtools), met instelbare onderdelen
function rauwToevoegen(fs, {
  id = 'v1', naam = 'Teamindeling', domeinId = 'speelt', volgorde = 1, extra = {},
  sleutel = naam.toLowerCase(), metNaam = true, naamVoor = id, stap = 1, laatste = id, metTeller = true, tellerVan = 0,
} = {}) {
  const b = writeBatch(fs)
  b.set(doc(fs, ...pad('vermogens', id)), { naam, domeinId, volgorde, ...extra })
  if (metNaam) b.set(doc(fs, ...pad('vermogensnamen', sleutel)), { vermogenId: naamVoor })
  if (metTeller) b.update(doc(fs, ...pad('structuurelementen', domeinId)), { aantalVermogens: tellerVan + stap, laatsteVermogenId: laatste })
  return b.commit()
}

describe('naamregels in de app', () => {
  test('normaliseren: NFC, trim en enkele spaties', () => {
    assert.equal(normaliseerVermogensnaam('  Lief   &  Leed '), 'Lief & Leed')
    assert.equal(normaliseerVermogensnaam('Café'), 'Café')
  })
  test('veldfouten volgens het ontwerp', () => {
    assert.equal(vermogensnaamFout(''), 'Vul een naam in.')
    assert.equal(vermogensnaamFout('A'), 'Een naam heeft minimaal 2 tekens.')
    assert.match(vermogensnaamFout('x'.repeat(104)), /maximaal 100 tekens\. Nu zijn het er 104\./)
    assert.equal(vermogensnaamFout('-Catering'), 'Begin de naam met een letter of cijfer.')
    assert.match(vermogensnaamFout('a/b'), /^Het teken \/ kan niet in een naam\. Gebruik letters/)
    assert.match(vermogensnaamFout('a/b_c#d@e'), /^De tekens \/, _ en # kunnen niet in een naam\./)
    assert.match(vermogensnaamFout('Feest 🎉'), /^Er staat een teken in de naam dat niet kan, bijvoorbeeld een emoji\./)
    assert.match(vermogensnaamFout('İstanbul'), /^Het teken İ kan niet/)
    assert.match(vermogensnaamFout('<b>'), /^De tekens < en > kunnen niet/)
    assert.equal(vermogensnaamFout('xy'), '')
    assert.equal(vermogensnaamFout('x'.repeat(100)), '')
    for (const n of ['Lief & Leed', 'Bar- en keukenbeheer', 'G-hockey', 'Ver(nieuw)bouw', 'Hoofdsponsoring 27+', 'Ærø, Ñandú en ß']) {
      assert.equal(vermogensnaamFout(n), '', n)
    }
  })
  test('alle HCA-namen uit de bron voldoen', () => {
    const namen = HCA_VERMOGENS.flatMap(([, l]) => l)
    assert.equal(namen.length, BRON_AANTAL)
    assert.equal(HCA_VERMOGENS.length, 13)
    for (const n of namen) assert.equal(vermogensnaamFout(n), '', n)
    assert.ok(namen.includes('Parkonderhoud') && namen.includes('Parkbeveiliging'))
    assert.ok(!namen.includes('Onderhoud') && !namen.includes('Beveiliging'))
  })
})

describe('app-protocol (transacties) slaagt', () => {
  test('toevoegen: vermogen, naamdocument en teller +1', async () => {
    const { id, volgorde } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    assert.equal(volgorde, 1)
    assert.deepEqual(await lees('vermogens', id), { naam: 'Teamindeling', domeinId: 'speelt', volgorde: 1 })
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
    const d = await lees('structuurelementen', 'speelt')
    assert.equal(d.aantalVermogens, 1)
    assert.equal(d.laatsteVermogenId, id)
    const tweede = await voegVermogenToe(db, CLUB, { naam: 'Coachaanstelling', domeinId: 'speelt' })
    assert.equal(tweede.volgorde, 2)
    assert.equal((await lees('structuurelementen', 'speelt')).aantalVermogens, 2)
  })

  test('namen met accenten (Latin-1) en hoofdletters: regex en lower() in de regels', async () => {
    for (const naam of ['Lijncoördinatie', 'ÉÉN ÇA ÑÜ', 'Ærø Øst', 'ÀÖØöøÿ', 'Straße', 'Lief & Leed', "Bar- en keuken (oud), 2+'s."]) {
      await assertSucceeds(voegVermogenToe(db, CLUB, { naam, domeinId: 'fin' }))
      assert.ok(await lees('vermogensnamen', naamSleutel(naam)), naam)
    }
    const e = await fout(voegVermogenToe(db, CLUB, { naam: 'één ça ñü', domeinId: 'leden' }))
    assert.equal(e.code, 'dubbel-vermogen')
  })

  test('hoofdletter met accent: zelfde sleutel als in de app, hernoemen alleen hoofdletters', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Éénheid', domeinId: 'leden' })
    assert.deepEqual(await lees('vermogensnamen', 'éénheid'), { vermogenId: id })
    await assertSucceeds(hernoemVermogen(db, CLUB, id, 'ÉÉNHEID'))
    assert.deepEqual(await lees('vermogensnamen', 'éénheid'), { vermogenId: id })
    await assertFails(rauwToevoegen(db, { id: 'v9', naam: 'ÉénHeid', domeinId: 'fin', sleutel: 'Éénheid' }))
    await assertFails(rauwToevoegen(db, { id: 'v9', naam: 'Öland', domeinId: 'fin', sleutel: 'Öland' }))
    await assertSucceeds(rauwToevoegen(db, { id: 'v9', naam: 'Öland', domeinId: 'fin', sleutel: 'öland' }))
  })

  test('alle HCA-namen worden door de regels geaccepteerd', async () => {
    for (const [, lijst] of HCA_VERMOGENS) {
      for (const naam of lijst) await voegVermogenToe(db, CLUB, { naam, domeinId: 'leden' })
    }
    assert.equal(await aantal('vermogens'), BRON_AANTAL)
    assert.equal(await aantal('vermogensnamen'), BRON_AANTAL)
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, BRON_AANTAL)
  })

  test('dubbele naam (andere hoofdletters, extra spaties, ander domein) geweigerd met het domein', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const e = await fout(voegVermogenToe(db, CLUB, { naam: normaliseerVermogensnaam('  teamINDELING '), domeinId: 'leden' }))
    assert.equal(e.code, 'dubbel-vermogen')
    assert.equal(e.domeinNaam, '#HCASpeelt')
    assert.equal(e.zelfdeDomein, false)
    const z = await fout(voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' }))
    assert.equal(z.zelfdeDomein, true)
    assert.equal(await aantal('vermogens'), 1)
  })

  test('los naamdocument zonder vermogen geeft naam-bezet', async () => {
    await admin(a => setDoc(doc(a, ...pad('vermogensnamen', 'kascontrole')), { vermogenId: 'weg' }))
    const e = await fout(voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' }))
    assert.equal(e.code, 'naam-bezet')
  })

  test('domein verdwenen of overkoepelend: eigen foutcode, niets geschreven', async () => {
    assert.equal((await fout(voegVermogenToe(db, CLUB, { naam: 'Nieuw', domeinId: 'bestaatniet' }))).code, 'domein-weg')
    assert.equal((await fout(voegVermogenToe(db, CLUB, { naam: 'Nieuw', domeinId: 'proj' }))).code, 'domein-overkoepelend')
    assert.equal(await aantal('vermogens'), 0)
  })

  test('hernoemen: alleen hoofdletters houdt het naamdocument; andere naam ruimt het oude op', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await hernoemVermogen(db, CLUB, id, 'teamindeling')
    assert.equal((await lees('vermogens', id)).naam, 'teamindeling')
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
    await hernoemVermogen(db, CLUB, id, 'Teamsamenstelling')
    assert.equal(await lees('vermogensnamen', 'teamindeling'), null)
    assert.deepEqual(await lees('vermogensnamen', 'teamsamenstelling'), { vermogenId: id })
    await assertSucceeds(voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'leden' }))
    const e = await fout(hernoemVermogen(db, CLUB, id, 'TEAMINDELING'))
    assert.equal(e.code, 'dubbel-vermogen')
    assert.equal(e.domeinNaam, 'Leden')
  })

  test('verplaatsen: onderaan in het nieuwe domein, tellers −1 en +1', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await voegVermogenToe(db, CLUB, { naam: 'Vrijwilligerswerving', domeinId: 'vrijw' })
    const { volgorde } = await verplaatsVermogen(db, CLUB, a.id, 'vrijw')
    assert.equal(volgorde, 2)
    assert.equal((await lees('vermogens', a.id)).domeinId, 'vrijw')
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 0)
    assert.equal((await lees('structuurelementen', 'vrijw')).aantalVermogens, 2)
    assert.equal((await fout(verplaatsVermogen(db, CLUB, a.id, 'proj'))).code, 'domein-overkoepelend')
  })

  test('hernoemen én verplaatsen: naamcheck vooraf, dan twee transacties', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Kledingpartnerschap', domeinId: 'leden' })
    await voegVermogenToe(db, CLUB, { naam: 'Contentcreatie', domeinId: 'fin' })
    const e = await fout(controleerNaamVrij(db, CLUB, 'contentcreatie', a.id, 'vrijw'))
    assert.equal(e.code, 'dubbel-vermogen')
    assert.equal(e.domeinNaam, 'Financiën')
    await controleerNaamVrij(db, CLUB, 'Kledingafspraken', a.id, 'vrijw')
    await verplaatsVermogen(db, CLUB, a.id, 'vrijw')
    await hernoemVermogen(db, CLUB, a.id, 'Kledingafspraken')
    assert.deepEqual(await lees('vermogens', a.id), { naam: 'Kledingafspraken', domeinId: 'vrijw', volgorde: 1 })
  })

  test('verwijderen: vermogen en naamdocument weg, teller −1, naam weer vrij', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await verwijderVermogen(db, CLUB, id)
    assert.equal(await lees('vermogens', id), null)
    assert.equal(await lees('vermogensnamen', 'kascontrole'), null)
    assert.equal((await lees('structuurelementen', 'fin')).aantalVermogens, 0)
    await assertSucceeds(voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' }))
    assert.equal((await fout(verwijderVermogen(db, CLUB, 'bestaatniet'))).code, 'vermogen-weg')
  })

  test('↑/↓: alleen volgorde in één batch, ook voor alle HCA-vermogens tegelijk', async () => {
    for (const [, lijst] of HCA_VERMOGENS) for (const naam of lijst) await voegVermogenToe(db, CLUB, { naam, domeinId: 'leden' })
    const lijst = (await laadVermogens(db, CLUB)).sort((x, y) => x.volgorde - y.volgorde).reverse()
    const b = writeBatch(db)
    lijst.forEach((v, k) => b.update(doc(db, ...pad('vermogens', v.id)), { volgorde: k + 1 }))
    await assertSucceeds(b.commit())
  })

  test('verweesd vermogen (domein via de console verwijderd) is te verplaatsen en te verwijderen', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    const b = await voegVermogenToe(db, CLUB, { naam: 'Twee', domeinId: 'leden' })
    await admin(x => deleteDoc(doc(x, ...pad('structuurelementen', 'leden'))))
    await assertSucceeds(verplaatsVermogen(db, CLUB, a.id, 'fin'))
    await assertSucceeds(verwijderVermogen(db, CLUB, b.id))
    assert.equal((await lees('structuurelementen', 'fin')).aantalVermogens, 1)
  })

  test('twee tabbladen tegelijk dezelfde naam: één wint, tellers kloppen', async () => {
    const db2 = env.authenticatedContext('jan').firestore()
    const uitkomst = await Promise.allSettled([
      voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' }),
      voegVermogenToe(db2, CLUB, { naam: 'Ledenwerving', domeinId: 'vrijw' }),
    ])
    assert.equal(uitkomst.filter(u => u.status === 'fulfilled').length, 1)
    const mis = uitkomst.find(u => u.status === 'rejected').reason
    assert.ok(['dubbel-vermogen', 'aborted', 'permission-denied'].includes(mis.code), mis.code)
    assert.equal(await aantal('vermogens'), 1)
    assert.equal(await aantal('vermogensnamen'), 1)
    const som = ((await lees('structuurelementen', 'leden')).aantalVermogens ?? 0) + ((await lees('structuurelementen', 'vrijw')).aantalVermogens ?? 0)
    assert.equal(som, 1)
  })
})

describe('regels weigeren buiten het protocol om', () => {
  test('vermogen zonder naamdocument en teller (addDoc)', async () => {
    await assertFails(addDoc(collection(db, ...pad('vermogens')), { naam: 'Teamindeling', domeinId: 'speelt', volgorde: 1 }))
  })
  test('vermogen zonder teller +1', async () => {
    await assertFails(rauwToevoegen(db, { metTeller: false }))
  })
  test('vermogen zonder naamdocument', async () => {
    await assertFails(rauwToevoegen(db, { metNaam: false }))
  })
  test('vermogen met teller +2', async () => {
    await assertFails(rauwToevoegen(db, { stap: 2 }))
  })
  test('teller +1 toegeschreven aan een ander vermogen', async () => {
    await assertFails(rauwToevoegen(db, { laatste: 'ander' }))
  })
  test('naamdocument dat naar een ander vermogen wijst', async () => {
    await assertFails(rauwToevoegen(db, { naamVoor: 'ander' }))
  })
  test('naamdocument met een andere sleutel dan de naam', async () => {
    await assertFails(rauwToevoegen(db, { sleutel: 'iets-anders' }))
  })
  test('bij een overkoepelend of niet-bestaand domein', async () => {
    await assertFails(rauwToevoegen(db, { domeinId: 'proj' }))
    await assertFails(rauwToevoegen(db, { domeinId: 'bestaatniet', metTeller: false }))
  })
  test('extra velden of geen geldige volgorde', async () => {
    await assertFails(rauwToevoegen(db, { extra: { status: 'x' } }))
    await assertFails(rauwToevoegen(db, { volgorde: 1.5 }))
    await assertFails(rauwToevoegen(db, { volgorde: 0 }))
    await assertFails(rauwToevoegen(db, { volgorde: '1' }))
  })
  test('het protocol zelf is geldig (controle op rauwToevoegen)', async () => {
    await assertSucceeds(rauwToevoegen(db))
  })
  test('ongeldige namen, ook met correct protocol', async () => {
    const namen = ['A', 'x'.repeat(101), 'a_b', 'Feest 🎉', 'İstanbul', '<b>', ' Voorspatie', 'Achterspatie ', 'Dubbel  spatie', '-Catering', 'a:b', 'Tab\tje', 'µ-meting', 'a×b', 'Œuvre']
    for (const [k, naam] of namen.entries()) await assertFails(rauwToevoegen(db, { id: `o${k}`, naam }))
  })
  test('lengtegrenzen 2 en 100 tekens toegestaan', async () => {
    await assertSucceeds(rauwToevoegen(db, { id: 'kort', naam: 'Ab' }))
    const lang = 'L'.repeat(100)
    await assertSucceeds(rauwToevoegen(db, { id: 'lang', naam: lang, tellerVan: 1 }))
  })
  test('tweede vermogen met een bestaande sleutel', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertFails(rauwToevoegen(db, { id: 'v2', naam: 'TeamIndeling', domeinId: 'leden' }))
    await assertFails(rauwToevoegen(db, { id: 'v2', naam: 'TeamIndeling', domeinId: 'leden', metNaam: false }))
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
  })
  test('naamdocument wijzigen of te vroeg verwijderen', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const ref = doc(db, ...pad('vermogensnamen', 'teamindeling'))
    await assertFails(updateDoc(ref, { vermogenId: 'ander' }))
    await assertFails(setDoc(ref, { vermogenId: id }))
    await assertFails(deleteDoc(ref))
    await assertFails(setDoc(doc(db, ...pad('vermogensnamen', 'kascontrole')), { vermogenId: id }))
  })
  test('hernoemen zonder het oude naamdocument op te ruimen', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const b = writeBatch(db)
    b.update(doc(db, ...pad('vermogens', id)), { naam: 'Teamsamenstelling' })
    b.set(doc(db, ...pad('vermogensnamen', 'teamsamenstelling')), { vermogenId: id })
    await assertFails(b.commit())
  })
  test('vermogen verwijderen zonder teller −1 of met het naamdocument nog staand', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await assertFails(deleteDoc(doc(db, ...pad('vermogens', id))))
    const b = writeBatch(db)
    b.delete(doc(db, ...pad('vermogens', id)))
    b.update(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertFails(b.commit())
  })
  test('verplaatsen met maar één teller', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    b.update(doc(db, ...pad('vermogens', id)), { domeinId: 'vrijw', volgorde: 1 })
    b.update(doc(db, ...pad('structuurelementen', 'vrijw')), { aantalVermogens: 1, laatsteVermogenId: id })
    await assertFails(b.commit())
    await assertFails(updateDoc(doc(db, ...pad('vermogens', id)), { domeinId: 'vrijw' }))
  })
  test('niet-lid kan niets lezen of schrijven', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertFails(getDocs(collection(buiten, ...pad('vermogens'))))
    await assertFails(getDoc(doc(buiten, ...pad('vermogensnamen', 'teamindeling'))))
    await assertFails(voegVermogenToe(buiten, CLUB, { naam: 'Iets', domeinId: 'leden' }))
  })
})

describe('domeinen en de teller', () => {
  test('domein met vermogens: niet verwijderen, niet naar overkoepelend', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await assertFails(deleteDoc(doc(db, ...pad('structuurelementen', 'leden'))))
    await assertFails(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { type: 'overkoepelend' }))
  })
  test('pijler ↔ ondersteunend mag met vermogens; overkoepelend blijft bewerkbaar', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { type: 'pijler', naam: 'Leden', omschrijving: 'x' }))
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'proj')), { naam: 'Projecten 2027' }))
  })
  test('na verwijderen van alle vermogens (teller 0) kan het domein weg', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await verwijderVermogen(db, CLUB, id)
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { type: 'overkoepelend' }))
    await assertSucceeds(deleteDoc(doc(db, ...pad('structuurelementen', 'leden'))))
  })
  test('teller vervalsen: los wijzigen, met laatsteVermogenId, onder 0, of +1 zonder echte wijziging', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const ref = doc(db, ...pad('structuurelementen', 'leden'))
    await assertFails(updateDoc(ref, { aantalVermogens: 0 }))
    await assertFails(updateDoc(ref, { aantalVermogens: 0, laatsteVermogenId: id }))
    await assertFails(updateDoc(ref, { aantalVermogens: 2, laatsteVermogenId: id }))
    await assertFails(updateDoc(ref, { aantalVermogens: 1.5 }))
    await assertFails(updateDoc(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: -1, laatsteVermogenId: id }))
    await assertFails(updateDoc(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: 1, laatsteVermogenId: id }))
    await assertSucceeds(updateDoc(ref, { laatsteVermogenId: 'onschuldig' }))
  })
  test('nieuw domein alleen met teller 0 (of zonder)', async () => {
    await assertSucceeds(addDoc(collection(db, ...pad('structuurelementen')), { type: 'domein', naam: 'Nieuw', volgorde: 20 }))
    await assertSucceeds(addDoc(collection(db, ...pad('structuurelementen')), { type: 'domein', naam: 'Nieuw2', aantalVermogens: 0 }))
    await assertFails(addDoc(collection(db, ...pad('structuurelementen')), { type: 'domein', naam: 'Nep', aantalVermogens: 3 }))
  })
})

describe('bestaande bewerkingen (v0.6.0-app en scripts) blijven werken', () => {
  test('domein bewerken zoals de app (updateDoc zonder tellervelden), ook met teller > 0', async () => {
    const data = { type: 'domein', naam: 'Leden', hashtag: '', omschrijving: 'Ledenzaken', bestuursfunctieId: 'vz', icoon: 'leden' }
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), data))
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { ...data, naam: 'Leden & co' }))
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 1)
  })
  test('domein toevoegen en een leeg domein verwijderen', async () => {
    const ref = await addDoc(collection(db, ...pad('structuurelementen')), { type: 'pijler', naam: 'Test', hashtag: '', omschrijving: 'xx', bestuursfunctieId: 'vz', icoon: '', volgorde: 16 })
    await assertSucceeds(deleteDoc(ref))
    await assertSucceeds(deleteDoc(doc(db, ...pad('structuurelementen', 'proj'))))
  })
  test('↑/↓ van domeinen in één batch (schrijfVolgorde)', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    Object.keys(DOMEINEN).forEach((id, k) => b.update(doc(db, ...pad('structuurelementen', id)), { volgorde: k + 1 }))
    await assertSucceeds(b.commit())
  })
  test('seed-testclub: batch.set met merge laat de teller staan', async () => {
    await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    b.set(doc(db, ...pad('structuurelementen', 'leden')), { type: 'domein', naam: 'Leden', icoon: 'leden', volgorde: 2, bestuursfunctieId: 'vz' }, { merge: true })
    await assertSucceeds(b.commit())
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 1)
  })
  test('bestuursfuncties en clubprofiel', async () => {
    const ref = await assertSucceeds(addDoc(collection(db, ...pad('bestuursfuncties')), { naam: 'Secretaris', volgorde: 2 }))
    await assertSucceeds(updateDoc(ref, { naam: 'Secretaris HCA' }))
    await assertSucceeds(deleteDoc(ref))
    await assertSucceeds(setDoc(doc(db, ...pad('instellingen', 'profiel')), { naam: 'Testclub', afkorting: 'TST', seizoen: '2026–2027' }, { merge: true }))
    await assertSucceeds(getDocs(collection(db, ...pad('structuurelementen'))))
  })
})

describe('limieten van get/getAfter (max. 10 per document, 20 per verzoek)', () => {
  test('toevoegen, verplaatsen, hernoemen en verwijderen blijven binnen de limiet (zie boven)', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    await assertSucceeds(verplaatsVermogen(db, CLUB, id, 'fin'))
    await assertSucceeds(hernoemVermogen(db, CLUB, id, 'Twee'))
    await assertSucceeds(verwijderVermogen(db, CLUB, id))
  })
  test('hernoemen én verplaatsen in één schrijfactie (ter informatie; de app splitst dit)', async t => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    const b = writeBatch(db)
    b.update(doc(db, ...pad('vermogens', id)), { naam: 'Twee', domeinId: 'fin', volgorde: 1 })
    b.delete(doc(db, ...pad('vermogensnamen', 'een')))
    b.set(doc(db, ...pad('vermogensnamen', 'twee')), { vermogenId: id })
    b.update(doc(db, ...pad('structuurelementen', 'leden')), { aantalVermogens: 0, laatsteVermogenId: id })
    b.update(doc(db, ...pad('structuurelementen', 'fin')), { aantalVermogens: 1, laatsteVermogenId: id })
    let uitkomst = 'toegestaan'
    try { await b.commit() } catch (e) { uitkomst = e.code }
    t.diagnostic(`gecombineerde schrijfactie: ${uitkomst}`)
  })
})

describe('scripts: importplan en controle', () => {
  const leesAlles = async () => admin(async a => {
    const l = async naam => (await getDocs(collection(a, ...pad(naam)))).docs.map(d => ({ id: d.id, ...d.data() }))
    return { domeinen: await l('structuurelementen'), vermogens: await l('vermogens'), namen: await l('vermogensnamen') }
  })

  async function hcaDomeinen() {
    await env.clearFirestore()
    await admin(async a => {
      await setDoc(doc(a, ...pad('leden', 'jan')), { rol: 'beheerder' })
      for (const [k, [label]] of HCA_VERMOGENS.entries()) {
        await setDoc(doc(a, ...pad('structuurelementen', `d${k}`)), { type: k < 3 ? 'pijler' : 'domein', naam: label, volgorde: k + 1 })
      }
      await setDoc(doc(a, ...pad('structuurelementen', 'proj')), { type: 'overkoepelend', naam: 'Projecten', volgorde: 14 })
    })
  }

  test('import: alle bronnamen nieuw over 13 domeinen, tweede keer 0, controle klopt', async () => {
    await hcaDomeinen()
    const eerste = maakImportplan(await leesAlles())
    assert.deepEqual(eerste.fouten, [])
    assert.equal(eerste.plan.length, BRON_AANTAL)
    assert.equal(new Set(eerste.plan.map(p => p.domeinId)).size, 13)
    for (const p of eerste.plan) await voegVermogenToe(db, CLUB, { naam: p.naam, domeinId: p.domeinId })
    const tweede = maakImportplan(await leesAlles())
    assert.equal(tweede.plan.length, 0)
    assert.equal(tweede.overgeslagen.length, BRON_AANTAL)
    const c = controleerVermogens(await leesAlles())
    assert.deepEqual(c, { afwijkingen: [], herstel: [] })
    const accommodatie = (await leesAlles()).domeinen.find(d => d.naam === 'Accommodatie')
    assert.equal(accommodatie.aantalVermogens, 2)
  })

  test('import vindt een pijler op hashtag en stopt bij een ontbrekend of overkoepelend domein', async () => {
    await hcaDomeinen()
    await admin(a => updateDoc(doc(a, ...pad('structuurelementen', 'd0')), { naam: 'Hockey', hashtag: '#hcaspeelt' }))
    assert.deepEqual(maakImportplan(await leesAlles()).fouten, [])
    await admin(a => updateDoc(doc(a, ...pad('structuurelementen', 'd3')), { type: 'overkoepelend' }))
    await admin(a => deleteDoc(doc(a, ...pad('structuurelementen', 'd4'))))
    const { fouten } = maakImportplan(await leesAlles())
    assert.equal(fouten.length, 2)
  })

  test('import laat een vermogen in een ander domein en een los naamdocument ongemoeid', async () => {
    await hcaDomeinen()
    await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'd3' })
    await admin(a => setDoc(doc(a, ...pad('vermogensnamen', 'begroting')), { vermogenId: 'weg' }))
    const { plan, letOp } = maakImportplan(await leesAlles())
    assert.equal(plan.length, BRON_AANTAL - 2)
    assert.equal(letOp.length, 2)
  })

  test('controle meldt consoleschade precies en herstelt naamdocumenten binnen de regels', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = await voegVermogenToe(db, CLUB, { naam: 'Ledenbeheer', domeinId: 'leden' })
    await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await admin(async x => {
      await deleteDoc(doc(x, ...pad('vermogens', a.id)))
      await deleteDoc(doc(x, ...pad('vermogensnamen', 'ledenbeheer')))
      await deleteDoc(doc(x, ...pad('structuurelementen', 'fin')))
    })
    const { afwijkingen, herstel } = controleerVermogens(await leesAlles())
    assert.ok(afwijkingen.some(t => t.includes('structuurelementen/leden (Leden): aantalVermogens 2 → 1')), afwijkingen.join('\n'))
    assert.ok(afwijkingen.some(t => t.includes('domein dat niet bestaat')), afwijkingen.join('\n'))
    assert.deepEqual(herstel.map(h => [h.soort, h.sleutel]).sort(), [['naam-maken', 'ledenbeheer'], ['naam-weg', 'ledenwerving']])
    for (const h of herstel.sort((x, y) => (x.soort === 'naam-weg' ? -1 : 1))) {
      const ref = doc(db, ...pad('vermogensnamen', h.sleutel))
      await assertSucceeds(h.soort === 'naam-weg' ? deleteDoc(ref) : setDoc(ref, { vermogenId: h.vermogenId }))
    }
    assert.deepEqual(await lees('vermogensnamen', 'ledenbeheer'), { vermogenId: b.id })
    assert.deepEqual(controleerVermogens(await leesAlles()).herstel, [])
  })
})

// Aanvullende regeltests (tester, fase 5a): rechtstreekse updates buiten het app-protocol om
describe('aanvullend: rechtstreekse updates en regressie (tester)', () => {
  const vRef = id => doc(db, ...pad('vermogens', id))
  const dRef = id => doc(db, ...pad('structuurelementen', id))
  const nRef = sleutel => doc(db, ...pad('vermogensnamen', sleutel))

  test('hernoemen rechtstreeks volgens het protocol slaagt; alleen hoofdletters ook zonder naamdocument', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertSucceeds(updateDoc(vRef(id), { naam: 'TEAMINDELING' }))
    const b = writeBatch(db)
    b.update(vRef(id), { naam: 'Teamsamenstelling' })
    b.delete(nRef('teamindeling'))
    b.set(nRef('teamsamenstelling'), { vermogenId: id })
    await assertSucceeds(b.commit())
  })

  test('hernoemen naar een naam van een ander vermogen of zonder naamdocument: geweigerd', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    await assertFails(updateDoc(vRef(a.id), { naam: 'Kascontrole' }))
    const b = writeBatch(db)
    b.update(vRef(a.id), { naam: 'kascontrole' })
    b.delete(nRef('teamindeling'))
    b.set(nRef('kascontrole'), { vermogenId: a.id })
    await assertFails(b.commit())
    assert.equal((await lees('vermogens', a.id)).naam, 'Teamindeling')
  })

  test('update met extra veld, ongeldige naam of ongeldige volgorde: geweigerd; alleen volgorde mag', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertFails(updateDoc(vRef(id), { status: 'x' }))
    await assertFails(updateDoc(vRef(id), { naam: 'Teamindeling ' }))
    await assertFails(updateDoc(vRef(id), { naam: '<b>' }))
    await assertFails(updateDoc(vRef(id), { volgorde: 0 }))
    await assertFails(updateDoc(vRef(id), { volgorde: 2.5 }))
    await assertSucceeds(updateDoc(vRef(id), { volgorde: 7 }))
  })

  test('verplaatsen rechtstreeks naar overkoepelend of niet-bestaand domein: geweigerd, ook met tellers', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Ledenwerving', domeinId: 'leden' })
    const b = writeBatch(db)
    b.update(vRef(id), { domeinId: 'proj', volgorde: 1 })
    b.update(dRef('proj'), { aantalVermogens: 1, laatsteVermogenId: id })
    b.update(dRef('leden'), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertFails(b.commit())
    await assertFails(updateDoc(vRef(id), { domeinId: 'bestaatniet', volgorde: 1 }))
    assert.equal((await lees('structuurelementen', 'leden')).aantalVermogens, 1)
  })

  test('verplaatsen rechtstreeks volgens het protocol slaagt; twee vermogens met één tellerstap niet', async () => {
    const a = await voegVermogenToe(db, CLUB, { naam: 'Een', domeinId: 'leden' })
    const c = await voegVermogenToe(db, CLUB, { naam: 'Twee', domeinId: 'leden' })
    const dubbel = writeBatch(db)
    dubbel.update(vRef(a.id), { domeinId: 'fin', volgorde: 1 })
    dubbel.update(vRef(c.id), { domeinId: 'fin', volgorde: 2 })
    dubbel.update(dRef('fin'), { aantalVermogens: 2, laatsteVermogenId: a.id })
    dubbel.update(dRef('leden'), { aantalVermogens: 0, laatsteVermogenId: a.id })
    await assertFails(dubbel.commit())
    const b = writeBatch(db)
    b.update(vRef(a.id), { domeinId: 'fin', volgorde: 1 })
    b.update(dRef('fin'), { aantalVermogens: 1, laatsteVermogenId: a.id })
    b.update(dRef('leden'), { aantalVermogens: 1, laatsteVermogenId: a.id })
    await assertSucceeds(b.commit())
  })

  test('verwijderen rechtstreeks volgens het protocol slaagt; teller onder 0 niet', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    const b = writeBatch(db)
    b.delete(vRef(id))
    b.delete(nRef('kascontrole'))
    b.update(dRef('fin'), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertSucceeds(b.commit())
    await assertFails(updateDoc(dRef('fin'), { aantalVermogens: -1, laatsteVermogenId: id }))
    await assertFails(updateDoc(dRef('leden'), { aantalVermogens: -1, laatsteVermogenId: id }))
  })

  test('domein zonder tellerveld: bewerken en verwijderen zoals voorheen; ongeldig type of naam blijft geweigerd', async () => {
    await assertSucceeds(updateDoc(dRef('fin'), { naam: 'Financiën en fondsen' }))
    await assertFails(updateDoc(dRef('fin'), { type: 'iets' }))
    await assertFails(updateDoc(dRef('fin'), { naam: 'x'.repeat(201) }))
    await assertSucceeds(deleteDoc(dRef('fin')))
  })

  test('bestuursfuncties en clubprofiel: bestaande grenzen blijven gelden', async () => {
    await assertFails(addDoc(collection(db, ...pad('bestuursfuncties')), { naam: 'S', volgorde: 2 }))
    await assertFails(addDoc(collection(db, ...pad('bestuursfuncties')), { naam: 'x'.repeat(101), volgorde: 2 }))
    await assertFails(setDoc(doc(db, ...pad('instellingen', 'anders')), { naam: 'x' }))
    await assertFails(setDoc(doc(db, ...pad('instellingen', 'profiel')), { logo: 'http://example.com/x.png' }, { merge: true }))
    await assertSucceeds(setDoc(doc(db, ...pad('instellingen', 'profiel')), { logo: 'data:image/png;base64,AAAA' }, { merge: true }))
    await assertFails(updateDoc(doc(buiten, ...pad('structuurelementen', 'leden')), { naam: 'Hack' }))
    await assertFails(setDoc(doc(db, ...pad('onbekend', 'x')), { a: 1 }))
  })
})

// Aanvallende tests (fase 5c, beveiliging): pogingen om uniciteit, domein-guard en tenant-isolatie te omzeilen
describe('beveiliging: aanvallen via de API worden geweigerd', () => {
  const ref = (fs, ...delen) => doc(fs, ...pad(...delen))

  test('tenant-isolatie: lid van club1 kan niets in club2 lezen of schrijven', async () => {
    await admin(async a => {
      await setDoc(doc(a, 'clubs', 'club2'), { naam: 'Andere club' })
      await setDoc(doc(a, 'clubs', 'club2', 'leden', 'piet'), { rol: 'beheerder' })
      await setDoc(doc(a, 'clubs', 'club2', 'structuurelementen', 'd2'), { type: 'pijler', naam: 'Anders' })
      await setDoc(doc(a, 'clubs', 'club2', 'vermogens', 'w1'), { naam: 'Geheim', domeinId: 'd2', volgorde: 1 })
    })
    await assertFails(getDoc(doc(db, 'clubs', 'club2', 'vermogens', 'w1')))
    await assertFails(getDocs(collection(db, 'clubs', 'club2', 'vermogensnamen')))
    const b = writeBatch(db)
    b.set(doc(db, 'clubs', 'club2', 'vermogens', 'x1'), { naam: 'Inbraak', domeinId: 'd2', volgorde: 1 })
    b.set(doc(db, 'clubs', 'club2', 'vermogensnamen', 'inbraak'), { vermogenId: 'x1' })
    b.update(doc(db, 'clubs', 'club2', 'structuurelementen', 'd2'), { aantalVermogens: 1, laatsteVermogenId: 'x1' })
    await assertFails(b.commit())
  })

  test('domeinId met een pad (traversal) wordt geweigerd', async () => {
    await admin(async a => {
      await setDoc(doc(a, 'clubs', 'club2', 'structuurelementen', 'd2'), { type: 'pijler', naam: 'Anders' })
    })
    for (const domeinId of ['../../club2/structuurelementen/d2', 'speelt/x/y', 'speelt/']) {
      const b = writeBatch(db)
      b.set(ref(db, 'vermogens', 'v9'), { naam: 'Padtruc', domeinId, volgorde: 1 })
      b.set(ref(db, 'vermogensnamen', 'padtruc'), { vermogenId: 'v9' })
      b.update(ref(db, 'structuurelementen', 'speelt'), { aantalVermogens: 1, laatsteVermogenId: 'v9' })
      await assertFails(b.commit())
    }
  })

  test('naamdocument kapen: verwijderen en opnieuw zetten in één batch lukt niet', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    const b = writeBatch(db)
    b.delete(ref(db, 'vermogensnamen', 'teamindeling'))
    b.set(ref(db, 'vermogensnamen', 'teamindeling'), { vermogenId: 'v2' })
    b.set(ref(db, 'vermogens', 'v2'), { naam: 'TEAMINDELING', domeinId: 'leden', volgorde: 1 })
    b.update(ref(db, 'structuurelementen', 'leden'), { aantalVermogens: 1, laatsteVermogenId: 'v2' })
    await assertFails(b.commit())
    assert.deepEqual(await lees('vermogensnamen', 'teamindeling'), { vermogenId: id })
    assert.equal(await lees('vermogens', 'v2'), null)
  })

  test('twee vermogens in één batch met één tellerstap: geweigerd', async () => {
    const b = writeBatch(db)
    b.set(ref(db, 'vermogens', 'a1'), { naam: 'Eerste', domeinId: 'speelt', volgorde: 1 })
    b.set(ref(db, 'vermogensnamen', 'eerste'), { vermogenId: 'a1' })
    b.set(ref(db, 'vermogens', 'a2'), { naam: 'Tweede', domeinId: 'speelt', volgorde: 2 })
    b.set(ref(db, 'vermogensnamen', 'tweede'), { vermogenId: 'a2' })
    b.update(ref(db, 'structuurelementen', 'speelt'), { aantalVermogens: 2, laatsteVermogenId: 'a2' })
    await assertFails(b.commit())
  })

  test('domein naar overkoepelend in dezelfde batch als een nieuw vermogen: geweigerd', async () => {
    const b = writeBatch(db)
    b.set(ref(db, 'vermogens', 'o1'), { naam: 'Stiekem', domeinId: 'leden', volgorde: 1 })
    b.set(ref(db, 'vermogensnamen', 'stiekem'), { vermogenId: 'o1' })
    b.update(ref(db, 'structuurelementen', 'leden'), { type: 'overkoepelend', aantalVermogens: 1, laatsteVermogenId: 'o1' })
    await assertFails(b.commit())
  })

  test('domein met vermogens verwijderen samen met zijn laatste vermogen: geweigerd (teller is nog 1)', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    const b = writeBatch(db)
    b.delete(ref(db, 'vermogens', id))
    b.delete(ref(db, 'vermogensnamen', 'kascontrole'))
    b.delete(ref(db, 'structuurelementen', 'fin'))
    await assertFails(b.commit())
  })

  test('teller verlagen door het vermogen naar een niet-bestaand domein te zetten: geweigerd', async () => {
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Kascontrole', domeinId: 'fin' })
    const b = writeBatch(db)
    b.update(ref(db, 'vermogens', id), { domeinId: 'bestaatniet' })
    b.update(ref(db, 'structuurelementen', 'fin'), { aantalVermogens: 0, laatsteVermogenId: id })
    await assertFails(b.commit())
    assert.equal((await lees('structuurelementen', 'fin')).aantalVermogens, 1)
  })

  test('nieuw domein met teller als string: geweigerd', async () => {
    await assertFails(setDoc(ref(db, 'structuurelementen', 'n1'), { type: 'pijler', naam: 'X', aantalVermogens: '0' }))
  })

  test('naamdocument voor een niet-bestaand vermogen: geweigerd', async () => {
    await assertFails(setDoc(ref(db, 'vermogensnamen', 'spook'), { vermogenId: 'bestaatniet' }))
  })

  // Herstelronde (beveiliging 2): volgorde heeft nu een bovengrens van 100000
  test('volgorde boven 100000 geweigerd, 100000 toegestaan', async () => {
    const poging = (id, naam, volgorde, teller) => {
      const b = writeBatch(db)
      b.set(ref(db, 'vermogens', id), { naam, domeinId: 'speelt', volgorde })
      b.set(ref(db, 'vermogensnamen', naam.toLowerCase()), { vermogenId: id })
      b.update(ref(db, 'structuurelementen', 'speelt'), { aantalVermogens: teller, laatsteVermogenId: id })
      return b.commit()
    }
    await assertFails(poging('g1', 'Groot', Number.MAX_SAFE_INTEGER, 1))
    await assertFails(poging('g1', 'Groot', 100001, 1))
    await assertSucceeds(poging('g2', 'Grens', 100000, 1))
    await assertFails(updateDoc(ref(db, 'vermogens', 'g2'), { volgorde: 100001 }))
  })

  test('laatsteVermogenId altijd een string van max. 100 tekens', async () => {
    const d = ref(db, 'structuurelementen', 'leden')
    await assertSucceeds(updateDoc(d, { laatsteVermogenId: 'x'.repeat(100) }))
    await assertFails(updateDoc(d, { laatsteVermogenId: 'x'.repeat(101) }))
    await assertFails(updateDoc(d, { laatsteVermogenId: 42 }))
    await assertFails(updateDoc(d, { laatsteVermogenId: { groot: 'x' } }))
    await assertFails(setDoc(ref(db, 'structuurelementen', 'n2'), { type: 'domein', naam: 'Nieuw', laatsteVermogenId: 7 }))
    await assertSucceeds(setDoc(ref(db, 'structuurelementen', 'n3'), { type: 'domein', naam: 'Nieuw' }))
  })
})

describe('scripts: terminaluitvoer (beveiliging 3)', () => {
  test('veilig() maakt stuurtekens en richtingstekens zichtbaar', async () => {
    const { veilig } = await import('../scripts/lib/omgeving.mjs')
    assert.equal(veilig('Leden\u001b[2J\nnep\u202Eregel'), 'Leden\\u{1B}[2J\\u{A}nep\\u{202E}regel')
    assert.equal(veilig('Lief & Leed — Financiën'), 'Lief & Leed — Financiën')
  })
})

// ── Projecten en samenwerkingen (CK-046) ──
const PROJECT = { naam: 'LED-scorebord', omschrijving: '', bestuursfunctieId: 'vz', status: 'in-voorbereiding', begindatum: '', einddatum: '', volgorde: 1 }
const SAMENWERKING = { naam: 'KNHB', omschrijving: '', bestuursfunctieId: 'vz', volgorde: 1 }
const HCA_NAMEN = Object.values(HCA_ONDERDELEN).flatMap(l => l.map(([n]) => n))

describe('CK-046 app-functies', () => {
  test('naamregels: tekenset met / en dezelfde opbouw als vermogens', () => {
    assert.equal(onderdeelnaamFout(''), 'Vul een naam in.')
    assert.equal(onderdeelnaamFout('A'), 'Een naam heeft minimaal 2 tekens.')
    assert.match(onderdeelnaamFout('x'.repeat(101)), /maximaal 100 tekens\. Nu zijn het er 101\./)
    assert.equal(onderdeelnaamFout('-Bouw'), 'Begin de naam met een letter of cijfer.')
    assert.equal(onderdeelnaamFout('Seizoen 27/28'), '')
    assert.match(onderdeelnaamFout('Feest 🎉'), /^Er staat een teken in de naam dat niet kan, bijvoorbeeld een emoji\..*\( \) \+ \/$/)
    assert.match(onderdeelnaamFout('a_b'), /^Het teken _ kan niet in een naam\. Gebruik letters .*& ' - \. , \( \) \+ \/$/)
    assert.match(vermogensnaamFout('a/b'), /^Het teken \/ kan niet in een naam\..*\( \) \+$/)
  })
  test('alle 10 HCA-namen voldoen', () => {
    assert.equal(HCA_NAMEN.length, 10)
    for (const n of HCA_NAMEN) assert.equal(onderdeelnaamFout(n), '', n)
  })
  test('periodeTekst volgens de tabel in het ontwerp', () => {
    assert.equal(periodeTekst('2026-09-01', '2028-06-30'), 'sep 2026 – jun 2028')
    assert.equal(periodeTekst('2027-03-01', '2027-03-31'), 'mrt 2027')
    assert.equal(periodeTekst('2026-09-01', ''), 'vanaf sep 2026')
    assert.equal(periodeTekst('', '2028-06-30'), 't/m jun 2028')
    assert.equal(periodeTekst('', ''), '')
    assert.equal(periodeTekst(undefined, undefined), '')
  })
  test('datumFout: einde vóór begin bij de einddatum, half ingevulde datum', () => {
    assert.deepEqual(datumFout('2027-06-01', '2027-05-31'), { eind: 'De einddatum ligt vóór de begindatum.' })
    assert.deepEqual(datumFout('2027-06-01', '2027-06-01'), {})
    assert.deepEqual(datumFout('', '2027-01-01'), {})
    assert.deepEqual(datumFout('2027-6-1', ''), { begin: 'Vul een hele datum in, of maak het veld leeg.' })
  })
  test('naamBezet: hoofdletters en spaties tellen niet, eigen id telt niet', () => {
    const lijst = [{ id: 'a', naam: 'Ver(nieuw)bouw' }]
    assert.ok(naamBezet(lijst, 'ver(NIEUW)bouw  '))
    assert.ok(!naamBezet(lijst, 'VER(nieuw)bouw', 'a'))
    assert.ok(!naamBezet(lijst, 'Verbouw'))
  })
  test('geldigOnderdeel spiegelt de regels', () => {
    assert.ok(geldigOnderdeel('projecten', PROJECT))
    assert.ok(geldigOnderdeel('samenwerkingen', SAMENWERKING))
    assert.ok(!geldigOnderdeel('samenwerkingen', { ...SAMENWERKING, status: 'lopend' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, status: 'bezig' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, begindatum: '2027' }))
  })
})

describe('CK-046 regels: projecten en samenwerkingen slagen', () => {
  test('project toevoegen (lege velden), status en periode wijzigen, verwijderen', async () => {
    const { id, volgorde } = await assertSucceeds(voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'Hoofdsponsoring 27/28+', status: 'lopend' }))
    assert.equal(volgorde, 1)
    assert.deepEqual(await lees('projecten', id), { naam: 'Hoofdsponsoring 27/28+', omschrijving: '', bestuursfunctieId: '', status: 'lopend', begindatum: '', einddatum: '', volgorde: 1 })
    const tweede = await voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'Ver(nieuw)bouw', status: 'in-voorbereiding' })
    assert.equal(tweede.volgorde, 2)
    await assertSucceeds(bewerkOnderdeel(db, CLUB, 'projecten', id, {
      naam: 'Hoofdsponsoring 27/28+', omschrijving: 'Café & co <b>', bestuursfunctieId: 'vz', status: 'afgerond', begindatum: '2026-09-01', einddatum: '2028-06-30',
    }))
    assert.equal((await lees('projecten', id)).status, 'afgerond')
    assert.equal((await lees('projecten', id)).volgorde, 1)
    await assertSucceeds(verwijderOnderdeel(db, CLUB, 'projecten', id))
    assert.equal(await lees('projecten', id), null)
    const e = await fout(verwijderOnderdeel(db, CLUB, 'projecten', id))
    assert.equal(e.code, 'project-weg')
    const e2 = await fout(bewerkOnderdeel(db, CLUB, 'projecten', id, { naam: 'Weg', status: 'lopend' }))
    assert.equal(e2.code, 'project-weg')
  })
  test('samenwerking toevoegen, bewerken en verwijderen', async () => {
    const { id } = await assertSucceeds(voegOnderdeelToe(db, CLUB, 'samenwerkingen', { naam: 'KNHB' }))
    assert.deepEqual(await lees('samenwerkingen', id), { naam: 'KNHB', omschrijving: '', bestuursfunctieId: '', volgorde: 1 })
    await assertSucceeds(bewerkOnderdeel(db, CLUB, 'samenwerkingen', id, { naam: 'KNHB', omschrijving: 'De bond', bestuursfunctieId: 'vz' }))
    assert.equal((await laadOnderdelen(db, CLUB, 'samenwerkingen')).length, 1)
    await assertSucceeds(verwijderOnderdeel(db, CLUB, 'samenwerkingen', id))
  })
  test('alle HCA-namen geaccepteerd; ↑/↓ als batch over alle HCA-projecten', async () => {
    for (const [soort, lijst] of Object.entries(HCA_ONDERDELEN)) {
      for (const [naam, status] of lijst) await assertSucceeds(voegOnderdeelToe(db, CLUB, soort, { naam, status }))
    }
    const projecten = await laadOnderdelen(db, CLUB, 'projecten')
    assert.deepEqual(projecten.map(p => p.volgorde), [1, 2, 3, 4, 5])
    const b = writeBatch(db)
    projecten.reverse().forEach((p, k) => b.update(doc(db, ...pad('projecten', p.id)), { volgorde: k + 1 }))
    await assertSucceeds(b.commit())
    assert.equal((await laadOnderdelen(db, CLUB, 'projecten'))[0].naam, 'Buitenopslag (blaashal)')
  })
  test('grenzen: naam 2 en 100 tekens, omschrijving 500, Latin-1', async () => {
    const r = n => doc(db, ...pad('projecten', n))
    await assertSucceeds(setDoc(r('a'), { ...PROJECT, naam: 'xy' }))
    await assertSucceeds(setDoc(r('b'), { ...PROJECT, naam: 'x'.repeat(100), omschrijving: 'o'.repeat(500) }))
    await assertSucceeds(setDoc(r('c'), { ...PROJECT, naam: 'Ærø Øst / Ñandú (ÀÖØöøÿ)' }))
  })
  test('domein: bewerken zonder bevat blijft slagen, bevat zetten op projecten of samenwerkingen slaagt', async () => {
    const d = doc(db, ...pad('structuurelementen', 'proj'))
    await assertSucceeds(updateDoc(d, { type: 'overkoepelend', naam: 'Projecten', omschrijving: 'Trajecten', bestuursfunctieId: 'vz', hashtag: '', icoon: '' }))
    await assertSucceeds(updateDoc(d, { bevat: 'projecten' }))
    await assertSucceeds(updateDoc(d, { naam: 'Trajecten' }))
    assert.equal((await lees('structuurelementen', 'proj')).bevat, 'projecten')
    await assertSucceeds(addDoc(collection(db, ...pad('structuurelementen')), { type: 'overkoepelend', naam: 'Partners', bevat: 'samenwerkingen' }))
  })
})

describe('CK-046 regels weigeren', () => {
  const r = (soort, id = 'x') => doc(db, ...pad(soort, id))
  test('niet-lid kan niet lezen of schrijven', async () => {
    await admin(a => setDoc(doc(a, ...pad('projecten', 'p1')), PROJECT))
    await assertFails(getDocs(collection(buiten, ...pad('projecten'))))
    await assertFails(getDoc(doc(buiten, ...pad('projecten', 'p1'))))
    await assertFails(setDoc(doc(buiten, ...pad('projecten', 'p2')), PROJECT))
    await assertFails(deleteDoc(doc(buiten, ...pad('projecten', 'p1'))))
    await assertFails(setDoc(doc(buiten, ...pad('samenwerkingen', 's1')), SAMENWERKING))
    await assertFails(getDocs(collection(buiten, ...pad('samenwerkingen'))))
  })
  test('extra of ontbrekend veld', async () => {
    await assertFails(setDoc(r('projecten'), { ...PROJECT, contactpersoon: 'Jan' }))
    await assertFails(setDoc(r('projecten'), { ...PROJECT, periode: '2026–2028' }))
    const { omschrijving, ...zonder } = PROJECT
    await assertFails(setDoc(r('projecten'), zonder))
    const { einddatum, ...zonderEinde } = PROJECT
    await assertFails(setDoc(r('projecten'), zonderEinde))
    await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, status: 'lopend' }))
    await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, begindatum: '' }))
    const { bestuursfunctieId, ...zonderEigenaar } = SAMENWERKING
    await assertFails(setDoc(r('samenwerkingen'), zonderEigenaar))
  })
  test('status en datums', async () => {
    await assertFails(setDoc(r('projecten'), { ...PROJECT, status: 'bezig' }))
    for (const datum of ['2027', '2027-3-1', '01-03-2027', '2027-03-01T00:00', 20270301, null]) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, begindatum: datum }), String(datum))
      await assertFails(setDoc(r('projecten'), { ...PROJECT, einddatum: datum }), String(datum))
    }
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2026-09-01', einddatum: '2028-06-30' }))
  })
  test('datums inhoudelijk: maand 01-12, dag 01-31, einde niet vóór begin (herstelronde)', async () => {
    for (const datum of ['2026-13-45', '2026-00-10', '2026-12-32', '2026-02-00', '0000-00-00']) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, begindatum: datum }), datum)
      await assertFails(setDoc(r('projecten'), { ...PROJECT, einddatum: datum }), datum)
    }
    await assertFails(setDoc(r('projecten'), { ...PROJECT, begindatum: '2027-06-01', einddatum: '2027-05-31' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2027-06-01', einddatum: '2027-06-01' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2027-06-01', einddatum: '' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '', einddatum: '2027-05-31' }))
    await assertSucceeds(setDoc(r('projecten'), { ...PROJECT, begindatum: '2026-01-31', einddatum: '2026-12-01' }))
    await assertSucceeds(setDoc(r('projecten', 'p'), { ...PROJECT, begindatum: '2027-01-01', einddatum: '2027-12-31' }))
    await assertFails(updateDoc(r('projecten', 'p'), { einddatum: '2026-12-31' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, begindatum: '2026-13-45' }))
    assert.ok(!geldigOnderdeel('projecten', { ...PROJECT, begindatum: '2027-06-01', einddatum: '2027-05-31' }))
    assert.deepEqual(datumFout('2026-13-45', ''), { begin: 'Vul een hele datum in, of maak het veld leeg.' })
  })
  test('ongeldige namen', async () => {
    for (const naam of ['x', 'x'.repeat(101), ' Bouw', 'Bouw ', 'Ver  bouw', 'a_b', 'Feest 🎉', '-Bouw', 'a\nb', 42]) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, naam }), String(naam))
      await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, naam }), String(naam))
    }
  })
  test('omschrijving, eigenaar en volgorde', async () => {
    await assertFails(setDoc(r('projecten'), { ...PROJECT, omschrijving: 'o'.repeat(501) }))
    await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, omschrijving: 'o'.repeat(501) }))
    await assertFails(setDoc(r('projecten'), { ...PROJECT, bestuursfunctieId: 7 }))
    await assertFails(setDoc(r('projecten'), { ...PROJECT, bestuursfunctieId: 'x'.repeat(101) }))
    for (const volgorde of [0, 1.5, '1', 100001]) {
      await assertFails(setDoc(r('projecten'), { ...PROJECT, volgorde }), String(volgorde))
      await assertFails(setDoc(r('samenwerkingen'), { ...SAMENWERKING, volgorde }), String(volgorde))
    }
  })
  test('update naar ongeldig wordt geweigerd', async () => {
    await assertSucceeds(setDoc(r('projecten', 'p'), PROJECT))
    await assertFails(updateDoc(r('projecten', 'p'), { status: 'weg' }))
    await assertFails(updateDoc(r('projecten', 'p'), { extra: true }))
    await assertSucceeds(updateDoc(r('projecten', 'p'), { volgorde: 2 }))
  })
  test('bevat met een andere waarde', async () => {
    const d = doc(db, ...pad('structuurelementen', 'proj'))
    await assertFails(updateDoc(d, { bevat: 'vermogens' }))
    await assertFails(updateDoc(d, { bevat: '' }))
    await assertFails(updateDoc(d, { bevat: ['projecten'] }))
    await assertFails(addDoc(collection(db, ...pad('structuurelementen')), { type: 'overkoepelend', naam: 'X', bevat: 'leden' }))
  })
})

describe('CK-046 inrichtscript: plan', () => {
  const leesAlles = async () => admin(async a => {
    const l = async naam => (await getDocs(collection(a, ...pad(naam)))).docs.map(d => ({ id: d.id, ...d.data() }))
    return { domeinen: await l('structuurelementen'), functies: await l('bestuursfuncties'), projecten: await l('projecten'), samenwerkingen: await l('samenwerkingen') }
  })
  const voerUit = async plan => {
    const b = writeBatch(db)
    for (const { soort, velden } of plan.nieuw) b.set(doc(collection(db, ...pad(soort))), velden)
    for (const x of plan.bevat) b.update(doc(db, ...pad('structuurelementen', x.domeinId)), { bevat: x.soort })
    await b.commit()
  }
  beforeEach(async () => {
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'overkoepelend', naam: 'Samenwerkingen', volgorde: 15 }))
  })

  test('eerste keer 10 items en 2 keer bevat in één batch, tweede keer niets; Voorzitter is eigenaar', async () => {
    const eerste = maakOnderdelenPlan(await leesAlles())
    assert.deepEqual(eerste.fouten, [])
    assert.equal(eerste.nieuw.length, 10)
    assert.equal(eerste.bevat.length, 2)
    await assertSucceeds(voerUit(eerste))
    const p = await laadOnderdelen(db, CLUB, 'projecten')
    assert.deepEqual(p.map(x => [x.naam, x.status, x.volgorde, x.bestuursfunctieId]), HCA_ONDERDELEN.projecten.map(([n, s], k) => [n, s, k + 1, 'vz']))
    assert.equal((await lees('structuurelementen', 'proj')).bevat, 'projecten')
    assert.equal((await lees('structuurelementen', 'samen')).bevat, 'samenwerkingen')
    const tweede = maakOnderdelenPlan(await leesAlles())
    assert.deepEqual([tweede.fouten, tweede.nieuw, tweede.bevat, tweede.letOp], [[], [], [], []])
    assert.equal(tweede.overgeslagen.length, 10)
  })
  test('bestaand item met andere status: ongemoeid, LET OP; nieuwe volgorde na de hoogste', async () => {
    await voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'Eigen project', status: 'lopend' })
    await voegOnderdeelToe(db, CLUB, 'projecten', { naam: 'buitenopslag (BLAASHAL)', status: 'lopend' })
    const plan = maakOnderdelenPlan(await leesAlles())
    assert.equal(plan.nieuw.filter(x => x.soort === 'projecten').length, 4)
    assert.equal(plan.nieuw[0].velden.volgorde, 3)
    assert.deepEqual(plan.letOp, ['buitenopslag (BLAASHAL) staat er al met status lopend, ongemoeid.'])
  })
  test('stopt bij ontbrekend, dubbel of niet-overkoepelend domein, andere bevat of geen Voorzitter', async () => {
    await admin(a => deleteDoc(doc(a, ...pad('structuurelementen', 'samen'))))
    assert.equal(maakOnderdelenPlan(await leesAlles()).fouten.length, 1)
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'domein', naam: 'Samenwerkingen' }))
    assert.equal(maakOnderdelenPlan(await leesAlles()).fouten.length, 1)
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'overkoepelend', naam: 'samenwerkingen ', bevat: 'projecten' }))
    const { fouten } = maakOnderdelenPlan(await leesAlles())
    assert.equal(fouten.length, 1)
    assert.match(fouten[0], /toont al "projecten"/)
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'samen')), { type: 'overkoepelend', naam: 'Samenwerkingen' }))
    await admin(a => setDoc(doc(a, ...pad('bestuursfuncties', 'vz')), { naam: 'Penningmeester', volgorde: 1 }))
    assert.equal(maakOnderdelenPlan(await leesAlles()).fouten.length, 1)
  })
  test('vindt een hernoemd domein op bevat', async () => {
    await admin(a => updateDoc(doc(a, ...pad('structuurelementen', 'proj')), { naam: 'Trajecten', bevat: 'projecten' }))
    const plan = maakOnderdelenPlan(await leesAlles())
    assert.deepEqual(plan.fouten, [])
    assert.deepEqual(plan.bevat.map(x => x.soort), ['samenwerkingen'])
  })
})

// ── Commissies (CK-041) ──
const COMMISSIE = { naam: 'Kascommissie', omschrijving: '', bestuursfunctieId: 'vz', volgorde: 1 }

describe('CK-041 commissies', () => {
  const r = (id = 'x') => doc(db, ...pad('commissies', id))
  test('soort zonder status, niet op de plaat', () => {
    assert.equal(SOORT_ONDERDEEL.commissies.status, false)
    assert.deepEqual(PLAAT_SOORTEN, ['projecten', 'samenwerkingen'])
    assert.ok(geldigOnderdeel('commissies', COMMISSIE))
    assert.ok(!geldigOnderdeel('commissies', { ...COMMISSIE, status: 'lopend' }))
    assert.deepEqual(onderdeelVelden('commissies', { naam: 'X y', volgorde: 3 }), { naam: 'X y', omschrijving: '', bestuursfunctieId: '', volgorde: 3 })
  })
  test('toevoegen, bewerken, volgorde en verwijderen slagen', async () => {
    const { id, volgorde } = await assertSucceeds(voegOnderdeelToe(db, CLUB, 'commissies', { naam: 'Kascommissie' }))
    assert.equal(volgorde, 1)
    assert.deepEqual(await lees('commissies', id), { naam: 'Kascommissie', omschrijving: '', bestuursfunctieId: '', volgorde: 1 })
    const tweede = await voegOnderdeelToe(db, CLUB, 'commissies', { naam: 'Activiteitencommissie' })
    assert.equal(tweede.volgorde, 2)
    await assertSucceeds(bewerkOnderdeel(db, CLUB, 'commissies', id, { naam: 'Kascommissie', omschrijving: 'Controleert de jaarrekening', bestuursfunctieId: 'pm' }))
    assert.equal((await lees('commissies', id)).volgorde, 1)
    await assertSucceeds(updateDoc(r(tweede.id), { volgorde: 1 }))
    await assertSucceeds(verwijderOnderdeel(db, CLUB, 'commissies', id))
    assert.equal((await fout(verwijderOnderdeel(db, CLUB, 'commissies', id))).code, 'commissie-weg')
    assert.equal((await fout(bewerkOnderdeel(db, CLUB, 'commissies', id, { naam: 'Weg' }))).code, 'commissie-weg')
  })
  test('niet-lid kan niet lezen of schrijven', async () => {
    await admin(a => setDoc(doc(a, ...pad('commissies', 'c1')), COMMISSIE))
    await assertFails(getDocs(collection(buiten, ...pad('commissies'))))
    await assertFails(getDoc(doc(buiten, ...pad('commissies', 'c1'))))
    await assertFails(setDoc(doc(buiten, ...pad('commissies', 'c2')), COMMISSIE))
    await assertFails(updateDoc(doc(buiten, ...pad('commissies', 'c1')), { volgorde: 2 }))
    await assertFails(deleteDoc(doc(buiten, ...pad('commissies', 'c1'))))
  })
  test('weigert extra en ontbrekende velden (geen persoonsgegevens)', async () => {
    for (const extra of [{ leden: ['Jan'] }, { voorzitter: 'Jan' }, { status: 'lopend' }, { domeinId: 'fin' }, { begindatum: '' }]) {
      await assertFails(setDoc(r(), { ...COMMISSIE, ...extra }), JSON.stringify(extra))
    }
    for (const veld of Object.keys(COMMISSIE)) {
      const { [veld]: _, ...zonder } = COMMISSIE
      await assertFails(setDoc(r(), zonder), veld)
    }
    await assertSucceeds(setDoc(r('c'), COMMISSIE))
    await assertFails(updateDoc(r('c'), { leden: ['Jan'] }))
  })
  test('weigert ongeldige naam, omschrijving, eigenaar en volgorde', async () => {
    for (const naam of ['x', 'x'.repeat(101), ' Kas', 'Kas ', 'Kas  commissie', 'a_b', 'Feest 🎉', '-Kas', 42]) {
      await assertFails(setDoc(r(), { ...COMMISSIE, naam }), String(naam))
    }
    await assertFails(setDoc(r(), { ...COMMISSIE, omschrijving: 'o'.repeat(501) }))
    await assertSucceeds(setDoc(r('grens'), { ...COMMISSIE, naam: 'x'.repeat(100), omschrijving: 'o'.repeat(500) }))
    await assertFails(setDoc(r(), { ...COMMISSIE, bestuursfunctieId: 7 }))
    await assertFails(setDoc(r(), { ...COMMISSIE, bestuursfunctieId: 'x'.repeat(101) }))
    for (const volgorde of [0, 1.5, '1', 100001]) await assertFails(setDoc(r(), { ...COMMISSIE, volgorde }), String(volgorde))
  })
  test('bevat kan niet op commissies', async () => {
    await assertFails(addDoc(collection(db, ...pad('structuurelementen')), { type: 'overkoepelend', naam: 'Commissies', bevat: 'commissies' }))
  })
})

// ── P0d: alleen de rol beheerder schrijft masterdata ──
// kees is lid met rol 'lid', bram is lid zonder rol; jan is beheerder (zie beforeEach hierboven).
import { controleerProfiel, controleerBestuursfunctie, controleerDomein, controleerP0d, LOGO_MAX_TEKENS } from '../scripts/lib/p0d-velden.mjs'
import { bepaalOmgeving, PRODUCTIE_PROJECT_ID, FIREBASE_SLEUTELS } from '../src/omgeving.js'

const P0D_PROFIEL = { naam: 'Testclub', afkorting: 'TST', seizoen: '2026–2027' }
const P0D_PROJECT = { naam: 'Nieuw veld', omschrijving: '', bestuursfunctieId: 'vz', status: 'lopend', begindatum: '', einddatum: '', volgorde: 1 }
const P0D_SAMEN = { naam: 'Gemeente', omschrijving: '', bestuursfunctieId: 'vz', volgorde: 1 }
const png = n => `data:image/png;base64,${'A'.repeat(n)}`

describe('P0d: alleen een beheerder schrijft', () => {
  let kees, bram
  beforeEach(async () => {
    await admin(async a => {
      await setDoc(doc(a, 'gebruikers', 'kees'), { clubId: CLUB })
      await setDoc(doc(a, ...pad('leden', 'kees')), { rol: 'lid' })
      await setDoc(doc(a, 'gebruikers', 'bram'), { clubId: CLUB })
      await setDoc(doc(a, ...pad('leden', 'bram')), { email: 'bram@example.com' })
      await setDoc(doc(a, ...pad('instellingen', 'profiel')), P0D_PROFIEL)
      await setDoc(doc(a, ...pad('projecten', 'p1')), P0D_PROJECT)
      await setDoc(doc(a, ...pad('samenwerkingen', 's1')), P0D_SAMEN)
      await setDoc(doc(a, ...pad('commissies', 'c1')), P0D_SAMEN)
    })
    kees = env.authenticatedContext('kees').firestore()
    bram = env.authenticatedContext('bram').firestore()
  })

  test('een lid zonder beheerrol kan alles lezen', async () => {
    for (const fs of [kees, bram]) {
      await assertSucceeds(getDoc(doc(fs, ...pad('instellingen', 'profiel'))))
      for (const c of ['bestuursfuncties', 'structuurelementen', 'vermogens', 'vermogensnamen', 'projecten', 'samenwerkingen', 'commissies']) {
        await assertSucceeds(getDocs(collection(fs, ...pad(c))))
      }
    }
  })

  test('instellingen, bestuursfuncties en structuurelementen: lid geweigerd, beheerder toegestaan', async () => {
    for (const fs of [kees, bram]) {
      await assertFails(setDoc(doc(fs, ...pad('instellingen', 'profiel')), { naam: 'Overgenomen' }, { merge: true }))
      await assertFails(setDoc(doc(fs, ...pad('instellingen', 'profiel')), { logo: png(8) }, { merge: true }))
      await assertFails(addDoc(collection(fs, ...pad('bestuursfuncties')), { naam: 'Secretaris', volgorde: 2 }))
      await assertFails(updateDoc(doc(fs, ...pad('bestuursfuncties', 'vz')), { naam: 'Baas' }))
      await assertFails(deleteDoc(doc(fs, ...pad('bestuursfuncties', 'vz'))))
      await assertFails(addDoc(collection(fs, ...pad('structuurelementen')), { type: 'domein', naam: 'Nieuw', volgorde: 20 }))
      await assertFails(updateDoc(doc(fs, ...pad('structuurelementen', 'leden')), { naam: 'Leden & co' }))
      await assertFails(updateDoc(doc(fs, ...pad('structuurelementen', 'leden')), { volgorde: 1 }))
      await assertFails(deleteDoc(doc(fs, ...pad('structuurelementen', 'proj'))))
    }
    await assertSucceeds(setDoc(doc(db, ...pad('instellingen', 'profiel')), { naam: 'Testclub HCA' }, { merge: true }))
    await assertSucceeds(addDoc(collection(db, ...pad('bestuursfuncties')), { naam: 'Secretaris', volgorde: 2 }))
    await assertSucceeds(updateDoc(doc(db, ...pad('structuurelementen', 'leden')), { naam: 'Leden & co' }))
    await assertSucceeds(deleteDoc(doc(db, ...pad('structuurelementen', 'proj'))))
  })

  test('bevat zetten of weghalen: alleen een beheerder', async () => {
    const d = fs => doc(fs, ...pad('structuurelementen', 'proj'))
    await assertFails(updateDoc(d(kees), { bevat: 'projecten' }))
    await assertSucceeds(updateDoc(d(db), { bevat: 'projecten' }))
    const { deleteField } = await import('firebase/firestore')
    await assertFails(updateDoc(d(kees), { bevat: deleteField() }))
    await assertFails(updateDoc(d(bram), { bevat: 'samenwerkingen' }))
    await assertSucceeds(updateDoc(d(db), { bevat: deleteField() }))
    assert.equal('bevat' in (await lees('structuurelementen', 'proj')), false)
  })

  test('vermogens en naamdocumenten: lid geweigerd via de app-functies en rechtstreeks', async () => {
    assert.equal((await fout(voegVermogenToe(kees, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' }))).code, 'permission-denied')
    await assertFails(rauwToevoegen(kees))
    const { id } = await voegVermogenToe(db, CLUB, { naam: 'Teamindeling', domeinId: 'speelt' })
    await assertFails(hernoemVermogen(kees, CLUB, id, 'Teamplanning'))
    await assertFails(verplaatsVermogen(kees, CLUB, id, 'leden'))
    await assertFails(verwijderVermogen(kees, CLUB, id))
    await assertFails(updateDoc(doc(kees, ...pad('vermogens', id)), { volgorde: 2 }))
    await assertFails(setDoc(doc(kees, ...pad('vermogensnamen', 'los')), { vermogenId: id }))
    await assertFails(deleteDoc(doc(kees, ...pad('vermogensnamen', 'teamindeling'))))
    await assertSucceeds(verwijderVermogen(db, CLUB, id))
  })

  test('projecten, samenwerkingen en commissies: lid geweigerd, beheerder toegestaan', async () => {
    for (const [soort, data] of [['projecten', P0D_PROJECT], ['samenwerkingen', P0D_SAMEN], ['commissies', P0D_SAMEN]]) {
      const bestaand = { projecten: 'p1', samenwerkingen: 's1', commissies: 'c1' }[soort]
      for (const fs of [kees, bram]) {
        await assertFails(setDoc(doc(fs, ...pad(soort, 'nieuw')), data), soort)
        await assertFails(updateDoc(doc(fs, ...pad(soort, bestaand)), { volgorde: 2 }), soort)
        await assertFails(deleteDoc(doc(fs, ...pad(soort, bestaand))), soort)
      }
      await assertFails(voegOnderdeelToe(kees, CLUB, soort, { naam: 'Iets nieuws', status: 'lopend', begindatum: '', einddatum: '' }))
      await assertSucceeds(setDoc(doc(db, ...pad(soort, 'nieuw')), data))
      await assertSucceeds(deleteDoc(doc(db, ...pad(soort, bestaand))))
    }
  })

  test('rol moet precies "beheerder" zijn', async () => {
    for (const rol of ['Beheerder', ' beheerder', 'bestuurder', 'admin', '', 1, true]) {
      await admin(a => setDoc(doc(a, ...pad('leden', 'kees')), { rol }))
      await assertFails(updateDoc(doc(kees, ...pad('bestuursfuncties', 'vz')), { naam: 'Baas' }), JSON.stringify(rol))
    }
    await admin(a => setDoc(doc(a, ...pad('leden', 'kees')), { rol: 'beheerder' }))
    await assertSucceeds(updateDoc(doc(kees, ...pad('bestuursfuncties', 'vz')), { naam: 'Baas' }))
  })

  test('beheerder van een andere club schrijft niet in deze club', async () => {
    await admin(async a => {
      await setDoc(doc(a, 'clubs', 'club2', 'leden', 'piet'), { rol: 'beheerder' })
    })
    await assertFails(updateDoc(doc(buiten, ...pad('bestuursfuncties', 'vz')), { naam: 'Baas' }))
    await assertFails(setDoc(doc(buiten, ...pad('instellingen', 'profiel')), { naam: 'Overgenomen' }, { merge: true }))
  })

  // CK-056 (L1): alle collecties, zodat een fout in één match-blok een test laat falen
  test('beheerder van een andere club: geen toevoegen, wijzigen of verwijderen in alle collecties', async () => {
    await admin(async a => {
      await setDoc(doc(a, 'clubs', 'club2', 'leden', 'piet'), { rol: 'beheerder' })
      await setDoc(doc(a, ...pad('vermogens', 'v1')), { naam: 'Teamindeling', domeinId: 'speelt', volgorde: 1 })
      await setDoc(doc(a, ...pad('vermogensnamen', 'teamindeling')), { vermogenId: 'v1' })
    })
    const gevallen = [
      ['instellingen', 'profiel', P0D_PROFIEL, { naam: 'Overgenomen' }],
      ['bestuursfuncties', 'vz', { naam: 'Secretaris', volgorde: 9 }, { naam: 'Baas' }],
      ['structuurelementen', 'leden', { type: 'pijler', naam: 'Nieuw', volgorde: 9 }, { naam: 'Overgenomen' }],
      ['vermogens', 'v1', { naam: 'Nieuw', domeinId: 'speelt', volgorde: 9 }, { volgorde: 2 }],
      ['vermogensnamen', 'teamindeling', { vermogenId: 'v1' }, { vermogenId: 'v2' }],
      ['projecten', 'p1', P0D_PROJECT, { volgorde: 2 }],
      ['samenwerkingen', 's1', P0D_SAMEN, { volgorde: 2 }],
      ['commissies', 'c1', P0D_SAMEN, { volgorde: 2 }],
    ]
    for (const [col, id, nieuw, wijziging] of gevallen) {
      await assertFails(setDoc(doc(buiten, ...pad(col, 'van-buiten')), nieuw), `${col}: toevoegen`)
      await assertFails(updateDoc(doc(buiten, ...pad(col, id)), wijziging), `${col}: wijzigen`)
      await assertFails(deleteDoc(doc(buiten, ...pad(col, id))), `${col}: verwijderen`)
    }
    // Positieve controle (CK-057): dezelfde wijziging mag de eigen beheerder wel, dus de weigering hierboven komt door de club
    for (const [col, id, , wijziging] of gevallen) {
      if (col === 'vermogensnamen') continue   // naamdocumenten wijzigen alleen via een vermogen-transactie
      await assertSucceeds(updateDoc(doc(db, ...pad(col, id)), wijziging), `${col}: eigen beheerder wijzigt`)
    }
  })
})

describe('P0d: veldcontrole op instellingen, bestuursfuncties en structuurelementen', () => {
  const profiel = () => doc(db, ...pad('instellingen', 'profiel'))
  const domein = (id = 'x') => doc(db, ...pad('structuurelementen', id))
  const DOMEIN = { type: 'pijler', naam: 'Hockey', hashtag: '#HCASpeelt', omschrijving: 'Alles rond hockey', bestuursfunctieId: 'vz', icoon: 'hcaspeelt', volgorde: 1 }

  test('clubprofiel: alleen naam, afkorting, seizoen en logo', async () => {
    await assertSucceeds(setDoc(profiel(), P0D_PROFIEL))
    await assertSucceeds(setDoc(profiel(), { naam: 'n'.repeat(100), afkorting: 'a'.repeat(20), seizoen: 's'.repeat(20) }))
    await assertFails(setDoc(profiel(), { ...P0D_PROFIEL, beheerder: 'jan' }))
    await assertFails(setDoc(profiel(), { kleur: 'rood' }, { merge: true }))
    await assertFails(setDoc(profiel(), { naam: '' }, { merge: true }))
    await assertFails(setDoc(profiel(), { naam: '   ' }, { merge: true }))
    await assertFails(setDoc(profiel(), { naam: 'n'.repeat(101) }, { merge: true }))
    await assertFails(setDoc(profiel(), { afkorting: 'a'.repeat(21) }, { merge: true }))
    await assertFails(setDoc(profiel(), { seizoen: 2026 }, { merge: true }))
    await assertFails(setDoc(profiel(), { naam: 'Hockey Club\u202E' }, { merge: true }))   // bidi-teken (CK-056)
    await assertSucceeds(setDoc(profiel(), { naam: 'Hockeyclub Ède-Zuid' }, { merge: true }))
  })

  test('logo: alleen PNG, JPEG of WebP als base64, met een maximale lengte', async () => {
    for (const soort of ['png', 'jpeg', 'webp']) {
      await assertSucceeds(setDoc(profiel(), { logo: `data:image/${soort};base64,iVBORw0KGgo=` }, { merge: true }), soort)
    }
    await assertSucceeds(setDoc(profiel(), { logo: png(LOGO_MAX_TEKENS - 'data:image/png;base64,'.length) }, { merge: true }))
    await assertFails(setDoc(profiel(), { logo: png(LOGO_MAX_TEKENS - 'data:image/png;base64,'.length + 1) }, { merge: true }))
    for (const logo of [
      'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/svg+xml,<svg onload=alert(1)>', 'data:image/gif;base64,R0lGOD',
      'data:image/png,ruw', 'data:image/png;base64,', 'data:image/png;base64,AA AA', 'data:image/png;base64,AA"><script>',
      'DATA:image/png;base64,AAAA', 'http://example.com/x.png', 'javascript:alert(1)', 42,
    ]) {
      await assertFails(setDoc(profiel(), { logo }, { merge: true }), String(logo))
    }
  })

  test('bestuursfuncties: alleen naam en volgorde', async () => {
    const col = collection(db, ...pad('bestuursfuncties'))
    await assertSucceeds(addDoc(col, { naam: 'Secretaris', volgorde: 2 }))
    await assertSucceeds(addDoc(col, { naam: 'Zonder volgorde' }))
    await assertFails(addDoc(col, { naam: 'Secretaris', volgorde: 2, persoon: 'Jan Jansen' }))
    await assertFails(addDoc(col, { naam: 'Secretaris', volgorde: '2' }))
    await assertFails(addDoc(col, { naam: 'Secretaris', volgorde: 0 }))
    await assertFails(addDoc(col, { naam: '   ', volgorde: 3 }))
    await assertFails(addDoc(col, { naam: ' x ', volgorde: 3 }))
    await assertFails(addDoc(col, { volgorde: 3 }))
    await assertFails(addDoc(col, { naam: 'Voorzitter\u202Eresiwe', volgorde: 3 }))   // bidi-teken (CK-056)
    await assertFails(addDoc(col, { naam: 'Secre\u0007taris', volgorde: 3 }))        // stuurteken
    await assertFails(addDoc(col, { naam: 'Secre\ntaris\nx', volgorde: 3 }))       // meerdere regeleinden
    await assertSucceeds(addDoc(col, { naam: 'Penningmeester – Café & Bar', volgorde: 4 }))
    await assertFails(updateDoc(doc(db, ...pad('bestuursfuncties', 'vz')), { email: 'vz@example.com' }))
  })

  test('domein: soort wijzigen van overkoepelend met bevat naar pijler kan, mits bevat weg gaat (CK-057)', async () => {
    await assertSucceeds(setDoc(domein('ov'), { type: 'overkoepelend', naam: 'Projecten', bevat: 'projecten', volgorde: 5 }))
    await assertFails(updateDoc(domein('ov'), { type: 'pijler' }))
    const { deleteField } = await import('firebase/firestore')
    await assertSucceeds(updateDoc(domein('ov'), { type: 'pijler', bevat: deleteField() }))
  })

  test('domein: geldige namen met accenten, leestekens en emoji mogen', async () => {
    for (const naam of ['Café & Bar – \'s-Hertogenbosch', 'Jeugd\u00A0O12', '🏑 Hockey', 'Oranje 🇳🇱', 'Top 👍🏽']) {
      await assertSucceeds(setDoc(domein('n'), { ...DOMEIN, naam }), naam)
    }
  })

  test('domein: toegestane velden en grenzen', async () => {
    await assertSucceeds(setDoc(domein('a'), DOMEIN))
    await assertSucceeds(setDoc(domein('b'), { ...DOMEIN, naam: 'x'.repeat(200), omschrijving: 'o'.repeat(500), icoon: 'samenwerkingen', hashtag: `#${'h'.repeat(49)}` }))
    await assertSucceeds(setDoc(domein('c'), { ...DOMEIN, hashtag: '' }))
    await assertSucceeds(setDoc(domein('d'), { type: 'overkoepelend', naam: 'Projecten', bevat: 'projecten' }))
  })

  test('domein: weigert extra velden, lege naam, te lange omschrijving en ongeldige waarden', async () => {
    const weiger = [
      { verantwoordelijke: 'Voorzitter' }, { leden: ['Jan'] }, { email: 'x@example.com' },
      { naam: '' }, { naam: '   ' }, { naam: 'x'.repeat(201) }, { naam: 7 },
      { omschrijving: 'o'.repeat(501) }, { omschrijving: 5 },
      { hashtag: 'HCASpeelt' }, { hashtag: '#HCA Speelt' }, { hashtag: '#' }, { hashtag: '#a#b' }, { hashtag: `#${'h'.repeat(50)}` },
      { icoon: 'i'.repeat(51) }, { icoon: 'stick' }, { icoon: 'HCASpeelt' }, { naam: 'Hockey\u202E' }, { naam: 'Hoc\u200Bkey' }, { naam: 'Hockey\n' }, { naam: 'a\nb\nc' }, { naam: 'Hoc\tkey\r\nclub' }, { naam: 'Hockey\u2028' }, { naam: '\uFEFFHockey' }, { naam: 'Hoc\u00ADkey' }, { naam: 'Hockey\u0085' }, { naam: 'Hoc\u2060key' }, { bestuursfunctieId: 'b'.repeat(101) }, { bestuursfunctieId: 3 },
      { volgorde: 0 }, { volgorde: 1.5 }, { volgorde: '1' }, { volgorde: 100001 },
      { type: 'iets' }, { bevat: 'commissies' }, { bevat: 'projecten' }, { type: 'domein', bevat: 'samenwerkingen' },
    ]
    for (const extra of weiger) await assertFails(setDoc(domein(), { ...DOMEIN, ...extra }), JSON.stringify(extra).slice(0, 60))
    const { naam, ...zonderNaam } = DOMEIN
    await assertFails(setDoc(domein(), zonderNaam))
    const { type, ...zonderType } = DOMEIN
    await assertFails(setDoc(domein(), zonderType))
    await assertFails(updateDoc(domein('leden'), { omschrijving: 'o'.repeat(501) }))
    await assertFails(updateDoc(domein('leden'), { naam: ' ' }))
  })

  test('oud document met een onbekend veld: eerst opschonen, dan weer te bewerken', async () => {
    await admin(a => setDoc(doc(a, ...pad('structuurelementen', 'oud')), { type: 'domein', naam: 'Oud', verantwoordelijke: 'Voorzitter', volgorde: 4 }))
    await assertFails(updateDoc(domein('oud'), { volgorde: 5 }))
    const { deleteField } = await import('firebase/firestore')
    await assertSucceeds(updateDoc(domein('oud'), { verantwoordelijke: deleteField() }))
    await assertSucceeds(updateDoc(domein('oud'), { volgorde: 5 }))
  })

  test('de JavaScript-spiegel (scripts/lib/p0d-velden.mjs) oordeelt zoals de regels', async () => {
    const gevallen = [
      ['instellingen', 'profiel', controleerProfiel, P0D_PROFIEL],
      ['instellingen', 'profiel', controleerProfiel, { ...P0D_PROFIEL, kleur: 'rood' }],
      ['instellingen', 'profiel', controleerProfiel, { naam: ' ' }],
      ['instellingen', 'profiel', controleerProfiel, { logo: 'data:image/svg+xml;base64,PHN2Zz4=' }],
      ['instellingen', 'profiel', controleerProfiel, { logo: 'data:image/webp;base64,UklGR==' }],
      ['bestuursfuncties', 'f', controleerBestuursfunctie, { naam: 'Secretaris', volgorde: 2 }],
      ['bestuursfuncties', 'f', controleerBestuursfunctie, { naam: 'S', volgorde: 2 }],
      ['bestuursfuncties', 'f', controleerBestuursfunctie, { naam: '   ', volgorde: 2 }],
      ['bestuursfuncties', 'f', controleerBestuursfunctie, { naam: 'Secretaris', persoon: 'Jan' }],
      ['structuurelementen', 'd', controleerDomein, DOMEIN],
      ['structuurelementen', 'd', controleerDomein, { ...DOMEIN, verantwoordelijke: 'x' }],
      ['structuurelementen', 'd', controleerDomein, { ...DOMEIN, omschrijving: 'o'.repeat(501) }],
      ['structuurelementen', 'd', controleerDomein, { ...DOMEIN, hashtag: '#a b' }],
      ['structuurelementen', 'd', controleerDomein, { ...DOMEIN, naam: '' }],
      ['structuurelementen', 'd', controleerDomein, { type: 'overkoepelend', naam: 'P', bevat: 'samenwerkingen' }],
      ['structuurelementen', 'd', controleerDomein, { naam: 'Zonder type' }],
    ]
    for (const [c, id, check, data] of gevallen) {
      const { onbekend, fouten } = check(data)
      const goed = onbekend.length === 0 && fouten.length === 0
      const ref = doc(db, ...pad(c, id))
      await (goed ? assertSucceeds : assertFails)(setDoc(ref, data), `${c} ${JSON.stringify(data).slice(0, 60)}`)
      await admin(a => deleteDoc(doc(a, ...pad(c, id))))
    }
  })

  test('controleerP0d: meldt een ontbrekende beheerrol en ruimt alleen onbekende velden op', () => {
    const r = controleerP0d({
      rol: 'lid',
      profiel: { ...P0D_PROFIEL, kleur: 'rood' },
      functies: [{ id: 'vz', data: { naam: 'Voorzitter', volgorde: 1 } }],
      domeinen: [
        { id: 'a', data: DOMEIN },
        { id: 'b', data: { type: 'domein', naam: 'Oud', verantwoordelijke: 'Voorzitter' } },
        { id: 'c', data: { type: 'domein', naam: 'Lang', omschrijving: 'o'.repeat(501) } },
        { id: 'd', data: { type: 'domein', naam: 'Met id', id: 'nep' } },
      ],
    })
    assert.equal(r.afwijkingen.length, 2)
    assert.match(r.afwijkingen[0], /niet "beheerder"/)
    assert.match(r.afwijkingen[1], /structuurelementen\/c .*omschrijving/)
    assert.deepEqual(r.herstel.map(h => [h.pad, h.velden]), [['instellingen/profiel', ['kleur']], ['structuurelementen/b', ['verantwoordelijke']], ['structuurelementen/d', ['id']]])
    assert.deepEqual(controleerP0d({ rol: 'beheerder', profiel: null, functies: [], domeinen: [] }), { afwijkingen: [], herstel: [] })
  })
})

// ── P0c: gebruikers en leden zijn vanuit de app alleen te lezen, en alleen je eigen document ──
describe('P0c: gebruikers, leden en het clubdocument', () => {
  beforeEach(async () => {
    await admin(async a => {
      await setDoc(doc(a, 'gebruikers', 'kees'), { clubId: CLUB })
      await setDoc(doc(a, ...pad('leden', 'kees')), { rol: 'lid' })
    })
  })
  const kees = () => env.authenticatedContext('kees').firestore()

  test('je eigen documenten lezen mag', async () => {
    await assertSucceeds(getDoc(doc(db, 'gebruikers', 'jan')))
    await assertSucceeds(getDoc(doc(db, ...pad('leden', 'jan'))))
    await assertSucceeds(getDoc(doc(db, 'clubs', CLUB)))
  })
  test('zelf gebruikers/{uid} schrijven: geweigerd (ook je eigen, ook naar een andere club)', async () => {
    await assertFails(setDoc(doc(db, 'gebruikers', 'jan'), { clubId: 'club2' }))
    await assertFails(updateDoc(doc(db, 'gebruikers', 'jan'), { clubId: 'club2' }))
    await assertFails(deleteDoc(doc(db, 'gebruikers', 'jan')))
    await assertFails(setDoc(doc(buiten, 'gebruikers', 'piet'), { clubId: CLUB }))
  })
  test('zelf leden/{uid} aanmaken: geweigerd', async () => {
    await assertFails(setDoc(doc(buiten, ...pad('leden', 'piet')), { rol: 'beheerder' }))
    await assertFails(setDoc(doc(buiten, ...pad('leden', 'piet')), { rol: 'lid' }))
    await assertFails(setDoc(doc(db, ...pad('leden', 'nieuw')), { rol: 'lid' }))
  })
  test('je rol ophogen of je lidmaatschap weghalen: geweigerd', async () => {
    await assertFails(updateDoc(doc(kees(), ...pad('leden', 'kees')), { rol: 'beheerder' }))
    await assertFails(setDoc(doc(kees(), ...pad('leden', 'kees')), { rol: 'beheerder' }))
    await assertFails(updateDoc(doc(db, ...pad('leden', 'kees')), { rol: 'beheerder' }))
    await assertFails(updateDoc(doc(db, ...pad('leden', 'jan')), { rol: 'eigenaar' }))
    await assertFails(deleteDoc(doc(kees(), ...pad('leden', 'kees'))))
  })
  test('clubs/{id} schrijven: geweigerd, ook voor een beheerder', async () => {
    await assertFails(updateDoc(doc(db, 'clubs', CLUB), { naam: 'Overgenomen' }))
    await assertFails(setDoc(doc(db, 'clubs', 'club3'), { naam: 'Nieuwe club' }))
    await assertFails(deleteDoc(doc(db, 'clubs', CLUB)))
    await assertFails(getDoc(doc(buiten, 'clubs', CLUB)))
  })
  test('het document van een ander lezen: geweigerd', async () => {
    await assertFails(getDoc(doc(db, 'gebruikers', 'kees')))
    await assertFails(getDoc(doc(db, ...pad('leden', 'kees'))))
    await assertFails(getDoc(doc(kees(), ...pad('leden', 'jan'))))
    await assertFails(getDocs(collection(db, ...pad('leden'))))
    await assertFails(getDocs(collection(db, 'gebruikers')))
  })
  test('niet ingelogd: niets te lezen', async () => {
    const anoniem = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anoniem, 'gebruikers', 'jan')))
    await assertFails(getDoc(doc(anoniem, ...pad('instellingen', 'profiel'))))
    await assertFails(getDocs(collection(anoniem, ...pad('structuurelementen'))))
  })
})

// ── Omgevingsguard (src/omgeving.js, gebruikt door src/firebase.js) ──
describe('omgevingsguard', () => {
  const config = (projectId, anders = {}) => ({
    apiKey: 'sleutel', authDomain: `${projectId}.firebaseapp.com`, projectId,
    storageBucket: `${projectId}.appspot.com`, messagingSenderId: '123', appId: '1:123:web:abc', ...anders,
  })
  const TEST = 'svn10-clubkompas-test'
  const g = invoer => bepaalOmgeving({ dev: false, modus: 'production', label: '', vercelEnv: '', modusSleutels: [], ...invoer })

  test('lokaal: npm run dev tegen test, dev:productie tegen productie', () => {
    assert.deepEqual(g({ dev: true, modus: 'test', config: config(TEST), modusSleutels: FIREBASE_SLEUTELS }),
      { soort: 'ontwikkel', label: 'Ontwikkel', configFout: null, labelWijktAf: false, liveOnvolledig: false })
    const p = g({ dev: true, modus: 'productie', config: config(PRODUCTIE_PROJECT_ID) })
    assert.equal(p.soort, 'productie-lokaal')
    assert.equal(p.configFout, null)
  })
  test('lokaal: productieproject zonder modus productie stopt', () => {
    assert.equal(g({ dev: true, modus: 'test', config: config(PRODUCTIE_PROJECT_ID), modusSleutels: FIREBASE_SLEUTELS }).configFout, 'productie-lokaal')
    assert.equal(g({ dev: true, modus: 'development', config: config(PRODUCTIE_PROJECT_ID) }).configFout, 'productie-lokaal')
  })
  test('lokaal: gemengde of onvolledige config stopt', () => {
    assert.equal(g({ dev: true, modus: 'test', config: config(TEST), modusSleutels: FIREBASE_SLEUTELS.slice(1) }).configFout, 'gemengde-config')
    assert.equal(g({ dev: true, modus: 'test', config: config(TEST, { authDomain: 'svn10-clubkompas.firebaseapp.com' }), modusSleutels: FIREBASE_SLEUTELS }).configFout, 'gemengde-config')
    assert.equal(g({ dev: true, modus: 'test', config: config(TEST, { appId: '1:999:web:abc' }), modusSleutels: FIREBASE_SLEUTELS }).configFout, 'gemengde-config')
    assert.equal(g({ dev: true, modus: 'test', config: config(TEST, { apiKey: '' }), modusSleutels: FIREBASE_SLEUTELS }).configFout, 'gemengde-config')
  })
  test('geen project: geen-config', () => {
    assert.equal(g({ config: config('') }).configFout, 'geen-config')
    assert.equal(g({ dev: true, modus: 'test', config: config('') }).configFout, 'geen-config')
  })
  test('Vercel Production: altijd productie, breekt nooit op een onvolledige config', () => {
    const live = g({ vercelEnv: 'production', label: 'productie', config: config(PRODUCTIE_PROJECT_ID) })
    assert.deepEqual([live.soort, live.configFout, live.labelWijktAf], ['productie', null, false])
    assert.equal(g({ vercelEnv: 'production', label: 'test', config: config(PRODUCTIE_PROJECT_ID) }).soort, 'productie')
    const half = g({ vercelEnv: 'production', label: 'productie', config: config(PRODUCTIE_PROJECT_ID, { apiKey: '' }) })
    assert.deepEqual([half.configFout, half.liveOnvolledig], [null, true])
  })
  test('Vercel Preview met het productieproject: stopt (test-met-productie)', () => {
    assert.equal(g({ vercelEnv: 'preview', label: 'productie', config: config(PRODUCTIE_PROJECT_ID) }).configFout, 'test-met-productie')
    assert.equal(g({ vercelEnv: 'preview', label: 'ontwikkel', config: config(PRODUCTIE_PROJECT_ID) }).configFout, 'test-met-productie')
  })
  test('Vercel Preview met het testproject: test, met balk', () => {
    const r = g({ vercelEnv: 'preview', label: 'test', config: config(TEST) })
    assert.deepEqual([r.soort, r.configFout, r.labelWijktAf], ['test', null, false])
    assert.equal(g({ vercelEnv: 'preview', label: 'test', config: config(TEST, { appId: '1:999:web:abc' }) }).configFout, 'gemengde-config')
  })
  test('lokale build (vite build, geen Vercel): label bepaalt test of ontwikkel; afwijkend label geeft alleen een waarschuwing', () => {
    assert.equal(g({ label: 'productie', config: config(PRODUCTIE_PROJECT_ID) }).soort, 'productie')
    assert.equal(g({ label: 'test', config: config(PRODUCTIE_PROJECT_ID) }).configFout, 'test-met-productie')
    const r = g({ label: 'productie', config: config(TEST) })
    assert.deepEqual([r.soort, r.labelWijktAf, r.configFout], ['test', true, null])
  })
})
