import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:4000',
      '/admin': 'http://localhost:4000',
      '/organiser': 'http://localhost:4000',
      '/customer': 'http://localhost:4000',
      '/offers': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
})
