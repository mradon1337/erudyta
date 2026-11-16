import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { serviceWorker } from './build/serviceWorker.ts'

// base './' — aplikacja działa też z podkatalogu (np. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  server: { port: 5299, strictPort: true },
  preview: { port: 5300, strictPort: true },
})
