import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
  define: {
    __APP_BUILD__: JSON.stringify(new Date().toISOString()),
  },
})
