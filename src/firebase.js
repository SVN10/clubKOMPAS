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

// Lokaal (dev) mag de app alleen bewust tegen productie draaien: npm run dev:productie.
// Ook lokaal: een ontbrekende sleutel in .env.test.local wordt door Vite aangevuld uit een oude .env;
// dan zouden Auth en Firestore bij verschillende projecten kunnen horen. Live (Vercel) blijft ongemoeid.
const FIREBASE_SLEUTELS = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']
  .map(s => `VITE_FIREBASE_${s}`)
const gemengd = Object.values(firebaseConfig).some(w => !w)
  || !firebaseConfig.authDomain.startsWith(`${projectId}.`)
  || (import.meta.env.MODE === 'test' && FIREBASE_SLEUTELS.some(s => !__MODUS_SLEUTELS__.includes(s)))

export const configFout = !projectId ? 'geen-config'
  : import.meta.env.DEV && projectId === PRODUCTIE_PROJECT_ID && import.meta.env.MODE !== 'productie' ? 'productie-lokaal'
  : import.meta.env.DEV && gemengd ? 'gemengde-config'
  : null

const app = configFout ? null : initializeApp(firebaseConfig)
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
