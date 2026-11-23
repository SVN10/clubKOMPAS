// Gedeelde omgevingskeuze en terminalopmaak voor alle scripts (P0e).
// Standaard is de omgeving TEST; productie alleen met --omgeving=productie en het intypen van de projectnaam.

import { createInterface } from 'readline'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const PRODUCTIE_PROJECT_ID = 'svn10-clubkompas'
export const TEST_PROJECT_ID = 'svn10-clubkompas-test'
export const OMGEVINGEN = ['test', 'productie']
export const DROOG = process.argv.includes('--droog')

const KLEUR = {
  test: '\x1b[1;97;46m',
  productie: '\x1b[1;30;43m',
  rood: '\x1b[1;31m',
  geel: '\x1b[1;33m',
  groen: '\x1b[32m',
  vet: '\x1b[1m',
  reset: '\x1b[0m',
}

function kleurAan(stream) {
  return !!stream.isTTY && !('NO_COLOR' in process.env)
}

function kleur(stream, code, tekst) {
  return kleurAan(stream) ? `${code}${tekst}${KLEUR.reset}` : tekst
}

// Stuurtekens (terminal-escapes, regeleinden) en onzichtbare richtingstekens uit clubdata zichtbaar
// maken als \u{..}, zodat een naam in de database de terminaluitvoer niet kan opmaken of verbergen.
const STUURTEKENS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g
export function veilig(tekst) {
  return String(tekst).replace(STUURTEKENS, t => `\\u{${t.codePointAt(0).toString(16).toUpperCase()}}`)
}

function blok(stream, label, code, wat, regels) {
  const inspring = ' '.repeat(Math.max(label.length + 2, 9))
  const kop = kleur(stream, code, label) + ' '.repeat(inspring.length - label.length) + veilig(wat)
  stream.write(`\n${[kop, ...regels.map(r => inspring + veilig(r))].join('\n')}\n\n`)
}

export function stop(wat, regels = [], niets = 'geschreven', label = 'GESTOPT') {
  const alle = niets ? [...regels, `Er is niets ${niets}.`] : regels
  blok(process.stderr, label, KLEUR.rood, wat, alle)
  process.exit(1)
}

export function waarschuw(tekst, regels = []) {
  blok(process.stderr, 'LET OP', KLEUR.geel, tekst, regels)
}

export function gelukt(tekst, regels = []) {
  blok(process.stdout, 'KLAAR', KLEUR.groen, tekst, regels)
}

export function argumenten(argv = process.argv) {
  return argv.slice(2).filter(a => !a.startsWith('--'))
}

export function kiesOmgeving(argv = process.argv, niets = 'geschreven') {
  const args = argv.slice(2).filter(a => a.startsWith('--omgeving='))
  if (args.length > 1) {
    stop(`--omgeving is ${args.length} keer opgegeven (${args.join(' ')}).`, ['Geef de omgeving één keer op: --omgeving=test of --omgeving=productie.'], niets)
  }
  const arg = args[0]
  if (!arg) return 'test'
  const waarde = arg.slice('--omgeving='.length).trim().toLowerCase()
  if (!OMGEVINGEN.includes(waarde)) {
    stop(`onbekende omgeving "${arg.slice('--omgeving='.length)}".`, ['Kies --omgeving=test of --omgeving=productie.'], niets)
  }
  return waarde
}

export function envBestand(omgeving) {
  return `.env.${omgeving}.local`
}

export function controleerProject(omgeving, projectId, bron, niets = 'geschreven') {
  if (omgeving === 'test' && projectId === PRODUCTIE_PROJECT_ID) {
    stop(`je koos TEST, maar ${bron} wijst naar het productieproject ${PRODUCTIE_PROJECT_ID}.`, [`Zet de waarden van ${TEST_PROJECT_ID} in dat bestand.`], niets)
  }
  if (omgeving === 'productie' && projectId !== PRODUCTIE_PROJECT_ID) {
    stop(`je koos PRODUCTIE, maar ${bron} wijst naar ${projectId || '(leeg)'} in plaats van ${PRODUCTIE_PROJECT_ID}.`, [], niets)
  }
}

export function leesEnv(omgeving, map = ROOT) {
  const bestand = envBestand(omgeving)
  const pad = join(map, bestand)
  if (!existsSync(pad)) {
    stop(`het bestand ${bestand} ontbreekt.`, ['Dit script weet daardoor niet met welk project het moet werken.', 'Zie README, "Omgevingen".'])
  }
  const env = Object.fromEntries(
    readFileSync(pad, 'utf-8').split('\n')
      .map(r => r.trim())
      .filter(r => r && !r.startsWith('#') && r.includes('='))
      .map(r => { const i = r.indexOf('='); return [r.slice(0, i).trim(), r.slice(i + 1).trim()] })
  )
  if (!env.VITE_FIREBASE_PROJECT_ID) {
    stop(`het bestand ${bestand} bevat geen VITE_FIREBASE_PROJECT_ID.`, ['Dit script weet daardoor niet met welk project het moet werken.', 'Zie README, "Omgevingen".'])
  }
  controleerProject(omgeving, env.VITE_FIREBASE_PROJECT_ID, bestand)
  return env
}

export const VOORBEELD = '.env.test.local.voorbeeld'

export function ingevuldeSleutels(pad) {
  if (!existsSync(pad)) return []
  return readFileSync(pad, 'utf-8').split('\n')
    .map(r => r.trim())
    .filter(r => r && !r.startsWith('#') && r.includes('='))
    .filter(r => { const [k, ...v] = r.split('='); return k.trim() !== 'VITE_OMGEVING' && v.join('=').trim() })
    .map(r => r.slice(0, r.indexOf('=')).trim())
}

export function controleerVoorbeeld(niets = 'geschreven', map = ROOT) {
  const gevuld = ingevuldeSleutels(join(map, VOORBEELD))
  if (gevuld.length) {
    stop(`het voorbeeldbestand ${VOORBEELD} is ingevuld (${gevuld.join(', ')}).`, [
      'Dat bestand gaat mee in git en moet leeg blijven.',
      'Zet de waarden in .env.test.local en maak de waarden in het voorbeeldbestand weer leeg.',
    ], niets)
  }
}

export function firebaseConfigUit(env) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
}

export function kopregel(soort, omgeving, projectId, { droog = false } = {}) {
  const naam = omgeving === 'productie' ? 'PRODUCTIE' : 'TEST'
  const echt = omgeving === 'productie' ? ' (echte clubdata)' : ''
  const extra = droog ? ' · DROOG (er wordt niets geschreven)' : ''
  const regel = ` ${soort}: ${naam} — project ${projectId}${echt}${extra} `
  process.stdout.write(`\n${kleur(process.stdout, KLEUR[omgeving] || KLEUR.test, regel)}\n`)
  if (omgeving !== 'productie' || droog) process.stdout.write('\n')
}

export function vet(tekst) {
  return kleur(process.stdout, KLEUR.vet, tekst)
}

export function vraag(prompt, verborgen = false) {
  if (verborgen && process.stdin.isTTY) return vraagVerborgen(prompt)
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(prompt, ans => { rl.close(); resolve(ans) })
  })
}

let rawActief = false
function rawUit() {
  if (rawActief && process.stdin.isTTY) {
    try { process.stdin.setRawMode(false) } catch {}
  }
  rawActief = false
}
process.on('exit', rawUit)

// Leest invoer zonder iets op het scherm te tonen (geen tekens, geen sterretjes).
// Escape-reeksen (pijl- en functietoetsen) worden genegeerd; raw mode gaat altijd weer uit.
export function vraagVerborgen(prompt) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    let invoer = ''
    let escape = 0
    const klaar = () => {
      rawUit()
      stdin.pause()
      stdin.removeListener('data', opToets)
      stdin.removeListener('error', opFout)
      process.stdout.write('\n')
    }
    const opFout = e => { klaar(); reject(e) }
    const opToets = tekens => {
      try {
        for (const t of tekens) {
          if (escape === 1) { escape = t === '[' || t === 'O' ? 2 : 0; continue }
          if (escape === 2) { if (t >= '@' && t <= '~') escape = 0; continue }
          if (t === '\x1b') { escape = 1; continue }
          if (t === '\r' || t === '\n' || t === '\u0004') {
            klaar()
            return resolve(invoer)
          } else if (t === '\u0003') {
            klaar()
            process.exit(130)
          } else if (t === '\u007f' || t === '\b') {
            invoer = invoer.slice(0, -1)
          } else if (t >= ' ') {
            invoer += t
          }
        }
      } catch (e) {
        opFout(e)
      }
    }
    process.stdout.write(prompt)
    try {
      stdin.setRawMode(true)
      rawActief = true
      stdin.setEncoding('utf8')
      stdin.on('data', opToets)
      stdin.on('error', opFout)
      stdin.resume()
    } catch (e) {
      opFout(e)
    }
  })
}

export async function productiebevestiging(projectId, { vooraf = 'Dit script schrijft in de echte clubdata.', actie = 'door te gaan', niets = 'geschreven' } = {}) {
  process.stdout.write(`${vet(vooraf)}\n`)
  const antwoord = await vraag(`Typ de projectnaam ${projectId} om ${actie} (iets anders = stoppen): `)
  if (antwoord.trim() !== projectId) stop('de projectnaam klopte niet.', [], niets, 'AFGEBROKEN')
  process.stdout.write('\n')
}

// Kiest de omgeving, leest het bijbehorende .env-bestand, toont de kopregel en vraagt
// bij productie (zonder --droog) om de projectnaam. Pas daarna mag een script inloggen.
export async function startScript({ droogMogelijk = true, alleenTest = false } = {}) {
  const omgeving = kiesOmgeving()
  if (alleenTest && omgeving !== 'test') {
    stop('het seed-script vult alleen de testclub en draait nooit tegen productie.')
  }
  if (DROOG && !droogMogelijk) {
    stop('dit script kent geen --droog.', ['Draai het zonder --droog; bij productie vraagt het eerst de projectnaam.'])
  }
  controleerVoorbeeld()
  const env = leesEnv(omgeving)
  const firebaseConfig = firebaseConfigUit(env)
  const projectId = firebaseConfig.projectId
  kopregel('DOEL', omgeving, projectId, { droog: DROOG })
  if (omgeving === 'productie' && !DROOG) await productiebevestiging(projectId)
  if (existsSync(join(ROOT, '.env'))) {
    waarschuw('er staat nog een bestand .env in de projectmap.', [
      'Scripts gebruiken het niet meer, maar de lokale app kan erdoor in de war raken.',
      'Verwijder het of verplaats de inhoud naar .env.productie.local.',
    ])
  }
  return { omgeving, projectId, firebaseConfig, droog: DROOG }
}

export async function inloggen(auth, signIn, email, wachtwoord, projectId) {
  try {
    const { user } = await signIn(auth, email, wachtwoord)
    return user
  } catch (e) {
    stop(`inloggen mislukt bij project ${projectId} (${e.code || e.message}).`, [
      'Controleer e-mail en wachtwoord.',
      'Let op: je testaccount en je gewone account zijn verschillende accounts in verschillende projecten.',
    ])
  }
}

export function geweigerd(e, { projectId, clubId = '<clubId>', uid = '<uid>', actie = 'het schrijven', gedeeltelijk = false } = {}) {
  const omgeving = projectId === PRODUCTIE_PROJECT_ID ? 'productie' : 'test'
  if (gedeeltelijk) {
    stop(`${actie.replace(/^het /, '')} mislukt in ${projectId} (${e?.code || e?.message}).`,
      ['Mogelijk is een deel al geschreven; controleer in de console wat er staat.'], null)
  }
  if (e?.code === 'permission-denied') {
    stop(`Firestore weigert ${actie} in ${projectId}.`, [
      'Meest waarschijnlijke oorzaken:',
      `(1) de regels staan nog niet in ${omgeving}, draai npm run regels:${omgeving};`,
      `(2) de ${omgeving === 'test' ? 'testgebruiker' : 'gebruiker'} is geen beheerder, controleer clubs/${clubId}/leden/${uid} met rol = beheerder.`,
    ])
  }
  stop(`${actie.replace(/^het /, '')} mislukt in ${projectId} (${e?.code || e?.message}).`)
}

export async function zoekClubId(db, { getDoc, doc }, user, { projectId, omgeving }) {
  let snap
  try {
    snap = await getDoc(doc(db, 'gebruikers', user.uid))
  } catch (e) {
    geweigerd(e, { projectId, uid: user.uid, actie: 'het lezen' })
  }
  const clubId = snap.exists() ? snap.data().clubId : null
  if (typeof clubId !== 'string' || !clubId.trim()) {
    const waar = omgeving === 'test' ? 'in de testconsole (README, stap 6)' : 'in de Firebase-console (README, "Beheer: gebruiker aan club koppelen")'
    stop(`ingelogd als ${user.email}, maar er is geen document gebruikers/${user.uid} met een clubId in project ${projectId}.`,
      [`Maak het aan ${waar} en draai het script opnieuw.`])
  }
  return clubId
}
