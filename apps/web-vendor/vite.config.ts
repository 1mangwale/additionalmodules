import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/vendor/', // Ensure base path is set correctly
  plugins: [react()],
  server: {
    port: 5184,
    proxy: {
      '/rooms': 'http://localhost:4000',
      '/services': 'http://localhost:4000',
      '/movies': 'http://localhost:4000',
      '/venues': 'http://localhost:4000'
    }
  }
})
