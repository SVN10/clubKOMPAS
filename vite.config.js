import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
})
