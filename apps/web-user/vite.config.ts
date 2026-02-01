import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    proxy: {
      '/rooms': 'http://localhost:4000',
      '/services': 'http://localhost:4000',
      '/movies': 'http://localhost:4000',
      '/venues': 'http://localhost:4000'
    }
  },
  base: '/user/'
})
