// Banco de prueba LOCAL: lee los comprobantes reales de la carpeta ejemplos/ (ignorada por git,
// nunca se sube) y muestra en una tabla lo que interpreta. Uso: npm run probar-ejemplos
import { readFileSync, readdirSync } from 'node:fs'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createWorker } from 'tesseract.js'
import { lineasDesdeItems } from '../src/extraccion/lineas.js'
import { interpretarComprobante } from '../src/extraccion/interpretar.js'
const dir = process.argv[2]
const filas = []
let w
for (const f of readdirSync(dir).sort()) {
  let texto, origen
  if (f.endsWith('.pdf')) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(`${dir}/${f}`)), verbosity: 0 }).promise
    texto = lineasDesdeItems((await (await doc.getPage(1)).getTextContent()).items); origen = 'pdf'
  } else {
    w ??= await createWorker('spa', 1, { langPath: './node_modules/@tesseract.js-data/spa/4.0.0_best_int', gzip: true, cachePath: '/tmp/claude-0/tess' })
    texto = (await w.recognize(`${dir}/${f}`)).data.text; origen = 'ocr'
  }
  const r = interpretarComprobante(texto, { origen })
  filas.push({ archivo: f.slice(0, 22), tipo: r.tipo, doc: r.documento, fecha: r.fecha, rucE: r.rucEmisor, razon: r.razonSocial.slice(0, 34), recep: r.rucReceptor ? 'MAKYL' : '-', total: r.total === null ? null : (r.total / 100).toFixed(2), igv: r.igv === null ? '' : (r.igv / 100).toFixed(2), detalle: r.detalle.slice(0, 40), dudas: Object.keys(r.dudas).join(',') })
}
await w?.terminate()
console.table(filas)
