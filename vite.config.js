import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Use esbuild instead of Vite 8's default Rolldown minifier.
    // Rolldown's stricter TDZ handling breaks const declarations inside
    // React components (AI_AGENTS, FTABS, NAV etc.) that Vite 6/7 tolerated.
    minify: 'esbuild',
  },
})
