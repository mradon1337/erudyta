import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — aplikacja działa też z podkatalogu (np. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5299, strictPort: true },
})
