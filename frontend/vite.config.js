import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // TAMBAHKAN INI: Agar path file jadi relatif
  build: {
    outDir: 'dist', // Memastikan hasil build masuk ke folder dist
  }
})