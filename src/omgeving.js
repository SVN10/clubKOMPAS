// Omgevingsguard (P0e, CK-047) als pure functie, zonder Vite-variabelen, zodat de regeltests hem
// kunnen toetsen (P0d). src/firebase.js vult de invoer uit import.meta.env en __VERCEL_ENV__.

export const PRODUCTIE_PROJECT_ID = 'svn10-clubkompas'
export const FIREBASE_SLEUTELS = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']
  .map(s => `VITE_FIREBASE_${s}`)

const LABELS = {
  'productie-lokaal': 'Productie (lokaal)', ontwikkel: 'Ontwikkel', test: 'Test', productie: 'Productie',
}

// dev: import.meta.env.DEV · modus: import.meta.env.MODE · label: VITE_OMGEVING (al getrimd, kleine letters)
// vercelEnv: VERCEL_ENV bij de build ('' lokaal) · config: firebaseConfig · modusSleutels: __MODUS_SLEUTELS__
export function bepaalOmgeving({ dev, modus, label, vercelEnv, config, modusSleutels = [] }) {
  const projectId = config.projectId
  const isProd = projectId === PRODUCTIE_PROJECT_ID
  const onlineNietLive = vercelEnv !== '' && vercelEnv !== 'production'

  // Lokaal (DEV) bepaalt de Vite-modus de omgeving, online (build) VITE_OMGEVING. Elke build die niet
  // naar het productieproject wijst, toont een balk. Op Vercel Production wint altijd 'productie'.
  // Een online build buiten Production (Preview) is nooit 'productie', ook niet met het productieproject.
  const soort = dev ? (modus === 'productie' ? 'productie-lokaal' : 'ontwikkel')
    : isProd && vercelEnv === 'production' ? 'productie'
    : isProd && onlineNietLive ? (label === 'ontwikkel' ? 'ontwikkel' : 'test')
    : isProd ? (label === 'test' || label === 'ontwikkel' ? label : 'productie')
    : label === 'ontwikkel' ? 'ontwikkel' : 'test'

  const verwacht = { productie: 'productie', test: 'test', ontwikkel: 'ontwikkel' }[soort]
  const labelWijktAf = !dev && !!projectId && label !== verwacht

  // Een ontbrekende sleutel in .env.test.local wordt door Vite aangevuld uit een oude .env; dan zouden
  // Auth en Firestore bij verschillende projecten kunnen horen. Nieuwe stops gelden alleen buiten
  // Vercel Production (nietLive): live breekt nooit, daar geeft een afwijking alleen console.warn.
  const onvolledig = Object.values(config).some(w => !w)
    || !config.authDomain.startsWith(`${projectId}.`)
    || config.appId.split(':')[1] !== config.messagingSenderId
  const modusMist = modus === 'test' && FIREBASE_SLEUTELS.some(s => !modusSleutels.includes(s))
  const nietLive = !dev && vercelEnv !== 'production'

  const configFout = !projectId ? 'geen-config'
    : dev && isProd && modus !== 'productie' ? 'productie-lokaal'
    : dev && (onvolledig || modusMist) ? 'gemengde-config'
    : nietLive && isProd && (soort === 'test' || soort === 'ontwikkel') ? 'test-met-productie'
    : nietLive && onvolledig ? 'gemengde-config'
    : null

  const liveOnvolledig = !dev && !nietLive && !!projectId && onvolledig
  return { soort, label: LABELS[soort], configFout, labelWijktAf, liveOnvolledig }
}
