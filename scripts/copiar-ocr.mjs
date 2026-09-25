// Copia el motor OCR (tesseract.js) y el idioma español a public/tesseract/ para que la página
// los sirva ella misma: nada se descarga de otros servidores. Se ejecuta antes de dev y build.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const destino = join(raiz, 'public', 'tesseract')
mkdirSync(destino, { recursive: true })

const archivos = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  // solo las variantes LSTM (el modo que usa la página); el navegador baja una sola
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  // modelo español «best_int»: buena precisión con 2 MB
  ['node_modules/@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz', 'spa.traineddata.gz'],
]

for (const [origen, nombre] of archivos) {
  const o = join(raiz, origen)
  const d = join(destino, nombre)
  if (!existsSync(o)) throw new Error(`Falta ${origen}. Corre «npm install».`)
  if (existsSync(d) && statSync(d).size === statSync(o).size) continue
  copyFileSync(o, d)
}
console.log('OCR listo en public/tesseract/')
