import { defineConfig } from 'vite'
import { existsSync, readFileSync } from 'fs'

const FIREBASE_SLEUTELS = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']
  .map(s => `VITE_FIREBASE_${s}`)

// Welke Firebase-sleutels staan echt (en niet leeg) in .env.<mode> of .env.<mode>.local?
// Vite vult ontbrekende sleutels anders stilletjes aan uit .env (P0e, gemengde configuratie).
function sleutelsInModusbestand(mode) {
  const gevonden = new Set()
  for (const bestand of [`.env.${mode}`, `.env.${mode}.local`]) {
    if (!existsSync(bestand)) continue
    for (const regel of readFileSync(bestand, 'utf-8').split('\n')) {
      const r = regel.trim()
      const i = r.indexOf('=')
      if (r.startsWith('#') || i < 0) continue
      const sleutel = r.slice(0, i).trim()
      if (FIREBASE_SLEUTELS.includes(sleutel) && r.slice(i + 1).trim()) gevonden.add(sleutel)
    }
  }
  return [...gevonden]
}

export default defineConfig(({ mode }) => {
  if (process.env.VERCEL && !process.env.VERCEL_ENV) {
    throw new Error('[clubKOMPAS] Build gestopt: VERCEL is gezet maar VERCEL_ENV is leeg. Zet in Vercel "Automatically expose System Environment Variables" aan. De vorige deploy blijft actief.')
  }
  return {
    optimizeDeps: {
      exclude: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
    },
    define: {
      __APP_BUILD__: JSON.stringify(new Date().toISOString()),
      __MODUS_SLEUTELS__: JSON.stringify(sleutelsInModusbestand(mode)),
      __VERCEL_ENV__: JSON.stringify(process.env.VERCEL_ENV || ''),
    },
  }
})
