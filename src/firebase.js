import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { bepaalOmgeving } from './omgeving.js'

export { PRODUCTIE_PROJECT_ID } from './omgeving.js'
export const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim()

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
}

export const VERCEL_ENV = __VERCEL_ENV__
const label = (import.meta.env.VITE_OMGEVING || '').trim().toLowerCase()

// De regels van de guard staan in src/omgeving.js (getest in tests/regels.test.mjs)
const omgeving = bepaalOmgeving({
  dev: import.meta.env.DEV,
  modus: import.meta.env.MODE,
  label,
  vercelEnv: VERCEL_ENV,
  config: firebaseConfig,
  modusSleutels: __MODUS_SLEUTELS__,
})

export const SOORT = omgeving.soort
export const OMGEVING_LABEL = omgeving.label
export const configFout = omgeving.configFout

if (omgeving.labelWijktAf) {
  console.warn(`[clubKOMPAS] VITE_OMGEVING is "${label || '(leeg)'}"; omgeving bepaald als "${OMGEVING_LABEL}" op basis van project ${projectId}.`)
}
if (omgeving.liveOnvolledig) {
  console.warn(`[clubKOMPAS] De Firebase-configuratie is onvolledig of past niet bij elkaar (project ${projectId}); op Vercel Production start de app toch.`)
}

const app = configFout ? null : initializeApp(firebaseConfig)
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
