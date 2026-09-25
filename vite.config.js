import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// base relativa: la misma compilación funciona en GitHub Pages
// (https://<usuario>.github.io/<repo>/) y abierta en local.
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __VERSION__: JSON.stringify(version) },
  // pdf.js, el OCR y ExcelJS son pesados, pero se cargan recién cuando se usan (import dinámico)
  build: { chunkSizeWarningLimit: 2500 },
  test: {
    include: ['tests/**/*.test.js'],
  },
})
