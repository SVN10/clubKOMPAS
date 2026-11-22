// Publiceert firestore.rules naar één omgeving via de Firebase CLI (firebase-tools in devDependencies).
// Gebruik: npm run regels:test   of   npm run regels:productie
//          (node scripts/regels.mjs --omgeving=test|productie)

import { spawn } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { ROOT, kiesOmgeving, controleerVoorbeeld, controleerProject, kopregel, productiebevestiging, stop, gelukt } from './lib/omgeving.mjs'

const omgeving = kiesOmgeving(process.argv, 'gepubliceerd')
controleerVoorbeeld('gepubliceerd')

let projectId
try {
  projectId = JSON.parse(readFileSync(join(ROOT, '.firebaserc'), 'utf-8')).projects?.[omgeving]
} catch {
  projectId = null
}
if (!projectId) {
  stop(`.firebaserc bevat geen project voor ${omgeving.toUpperCase()}.`, ['Zie README, "Omgevingen".'], 'gepubliceerd')
}
controleerProject(omgeving, projectId, '.firebaserc', 'gepubliceerd')

kopregel('REGELS NAAR', omgeving, projectId)
if (omgeving === 'productie') {
  await productiebevestiging(projectId, {
    vooraf: 'Heb je deze regels eerst in test gepubliceerd en gecontroleerd?',
    actie: 'te publiceren',
    niets: 'gepubliceerd',
  })
}

const firebase = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'firebase.cmd' : 'firebase')
if (!existsSync(firebase)) {
  stop('de Firebase CLI (firebase-tools) is niet geïnstalleerd.', ['Draai eenmalig npm install en probeer het opnieuw.'], 'gepubliceerd')
}

let uitvoer = ''
const code = await new Promise(resolve => {
  const kind = spawn(firebase, ['deploy', '--only', 'firestore:rules', '--project', omgeving], {
    cwd: ROOT,
    stdio: ['inherit', 'pipe', 'pipe'],
  })
  kind.stdout.on('data', d => { uitvoer += d; process.stdout.write(d) })
  kind.stderr.on('data', d => { uitvoer += d; process.stderr.write(d) })
  kind.on('error', () => resolve(-1))
  kind.on('close', resolve)
})

if (code !== 0) {
  if (/failed to authenticate|have you run firebase login|not logged in/i.test(uitvoer)) {
    stop('je bent op deze computer nog niet ingelogd bij Firebase.', ['Draai eenmalig npx firebase login en probeer het opnieuw.'], 'gepubliceerd')
  }
  if (/\b403\b|does not have permission|permission denied|PERMISSION_DENIED/i.test(uitvoer)) {
    stop('het Google-account waarmee je bij de Firebase CLI bent ingelogd heeft geen toegang tot dit project.', [
      'Controleer met npx firebase login:list welk account het is;',
      'wissel zo nodig met npx firebase logout en npx firebase login.',
    ], 'gepubliceerd')
  }
  stop(`publiceren naar ${projectId} is mislukt (zie de Firebase-melding hierboven).`, [
    'Controleer in de console (Firestore → Regels) of de publicatietijd is veranderd.',
    'Lukt het niet, plak firestore.rules dan in de console (README, "Firestore-regels").',
  ], null)
}

gelukt(`regels gepubliceerd naar ${projectId}.`, ['Controleer in de console (Firestore → Regels) de tekst en de publicatietijd.'])
