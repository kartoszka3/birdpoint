import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/static/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: '../backend/birdpoint_core/static',
    emptyOutDir: false,
  }
})
