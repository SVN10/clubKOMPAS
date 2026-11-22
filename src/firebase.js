import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const PRODUCTIE_PROJECT_ID = 'svn10-clubkompas'
export const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim()

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
}

const DEV = import.meta.env.DEV
const MODUS = import.meta.env.MODE
export const VERCEL_ENV = __VERCEL_ENV__
const label = (import.meta.env.VITE_OMGEVING || '').trim().toLowerCase()
const isProd = projectId === PRODUCTIE_PROJECT_ID
const onlineNietLive = VERCEL_ENV !== '' && VERCEL_ENV !== 'production'

// Lokaal (DEV) bepaalt de Vite-modus de omgeving, online (build) VITE_OMGEVING. Elke build die niet
// naar het productieproject wijst, toont een balk. Op Vercel Production wint altijd 'productie'.
// Een online build buiten Production (Preview) is nooit 'productie', ook niet met het productieproject.
export const SOORT = DEV ? (MODUS === 'productie' ? 'productie-lokaal' : 'ontwikkel')
  : isProd && VERCEL_ENV === 'production' ? 'productie'
  : isProd && onlineNietLive ? (label === 'ontwikkel' ? 'ontwikkel' : 'test')
  : isProd ? (label === 'test' || label === 'ontwikkel' ? label : 'productie')
  : label === 'ontwikkel' ? 'ontwikkel' : 'test'

export const OMGEVING_LABEL = {
  'productie-lokaal': 'Productie (lokaal)', ontwikkel: 'Ontwikkel', test: 'Test', productie: 'Productie',
}[SOORT]

const verwacht = { productie: 'productie', test: 'test', ontwikkel: 'ontwikkel' }[SOORT]
if (!DEV && projectId && label !== verwacht) {
  console.warn(`[clubKOMPAS] VITE_OMGEVING is "${label || '(leeg)'}"; omgeving bepaald als "${OMGEVING_LABEL}" op basis van project ${projectId}.`)
}

// Een ontbrekende sleutel in .env.test.local wordt door Vite aangevuld uit een oude .env; dan zouden
// Auth en Firestore bij verschillende projecten kunnen horen. Nieuwe stops gelden alleen buiten
// Vercel Production (nietLive): live breekt nooit, daar geeft een afwijking alleen console.warn.
const FIREBASE_SLEUTELS = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']
  .map(s => `VITE_FIREBASE_${s}`)
const onvolledig = Object.values(firebaseConfig).some(w => !w)
  || !firebaseConfig.authDomain.startsWith(`${projectId}.`)
  || firebaseConfig.appId.split(':')[1] !== firebaseConfig.messagingSenderId
const modusMist = MODUS === 'test' && FIREBASE_SLEUTELS.some(s => !__MODUS_SLEUTELS__.includes(s))
const nietLive = !DEV && VERCEL_ENV !== 'production'

export const configFout = !projectId ? 'geen-config'
  : DEV && isProd && MODUS !== 'productie' ? 'productie-lokaal'
  : DEV && (onvolledig || modusMist) ? 'gemengde-config'
  : nietLive && isProd && (SOORT === 'test' || SOORT === 'ontwikkel') ? 'test-met-productie'
  : nietLive && onvolledig ? 'gemengde-config'
  : null

if (!DEV && !nietLive && projectId && onvolledig) {
  console.warn(`[clubKOMPAS] De Firebase-configuratie is onvolledig of past niet bij elkaar (project ${projectId}); op Vercel Production start de app toch.`)
}

const app = configFout ? null : initializeApp(firebaseConfig)
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
