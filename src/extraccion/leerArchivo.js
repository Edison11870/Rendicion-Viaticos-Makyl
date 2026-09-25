// Lectura de un archivo de comprobante EN EL NAVEGADOR: PDF con texto (pdf.js), PDF escaneado o
// foto (OCR con tesseract.js). Devuelve el texto, una vista previa y los campos interpretados.
// versión «legacy»: incluye compatibilidad con navegadores y celulares más antiguos
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.min.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { createWorker } from 'tesseract.js'
import { interpretarComprobante } from './interpretar.js'
import { lineasDesdeItems } from './lineas.js'
import { tipoDeArchivo } from '../reglas/comprobantes.js'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MAX_PAGINAS_OCR = 3
const LADO_MAX_FOTO = 2600 // px; fotos de celular más grandes se reducen (más rápido, igual de legible)
const ANCHO_VISTA = 1400 // px de la vista previa

let ocrPromesa = null
let ocrAvance = () => {}

/** Un solo motor OCR para toda la página; se carga la primera vez que se necesita. */
function motorOcr() {
  if (!ocrPromesa) {
    const base = new URL('tesseract/', document.baseURI).href
    ocrPromesa = createWorker('spa', 1, {
      workerPath: `${base}worker.min.js`,
      corePath: base,
      langPath: base,
      gzip: true,
      logger: (m) => ocrAvance(m),
    }).catch((e) => {
      ocrPromesa = null
      throw e
    })
  }
  return ocrPromesa
}

async function ocrDeCanvas(canvas, alAvanzar) {
  const worker = await motorOcr()
  ocrAvance = (m) => {
    if (m.status === 'recognizing text') alAvanzar?.(m.progress)
  }
  const { data } = await worker.recognize(canvas)
  ocrAvance = () => {}
  return data.text
}

function canvasABlobUrl(canvas) {
  return new Promise((ok) => canvas.toBlob((b) => ok(b ? URL.createObjectURL(b) : ''), 'image/jpeg', 0.85))
}

async function renderizarPagina(pagina, anchoObjetivo) {
  const base = pagina.getViewport({ scale: 1 })
  const escala = anchoObjetivo / base.width
  const vp = pagina.getViewport({ scale: escala })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(vp.width)
  canvas.height = Math.ceil(vp.height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await pagina.render({ canvasContext: ctx, viewport: vp, canvas }).promise
  return canvas
}

async function leerPdf(archivo, alAvanzar) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise
  const textos = []
  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i)
    textos.push(lineasDesdeItems((await pagina.getTextContent()).items))
  }
  let texto = textos.join('\n')
  let origen = 'pdf'
  const primera = await doc.getPage(1)
  const vistaCanvas = await renderizarPagina(primera, ANCHO_VISTA)

  // PDF escaneado (sin texto): OCR de las primeras páginas
  if (texto.replace(/\s/g, '').length < 40) {
    origen = 'ocr'
    const partes = []
    const n = Math.min(doc.numPages, MAX_PAGINAS_OCR)
    for (let i = 1; i <= n; i++) {
      const c = i === 1 ? vistaCanvas : await renderizarPagina(await doc.getPage(i), ANCHO_VISTA)
      partes.push(await ocrDeCanvas(c, (p) => alAvanzar?.((i - 1 + p) / n)))
    }
    texto = partes.join('\n')
  }
  return { texto, origen, vista: await canvasABlobUrl(vistaCanvas), paginas: doc.numPages }
}

async function leerImagen(archivo, alAvanzar) {
  let bitmap
  try {
    bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('No se pudo abrir la imagen. Si es HEIC (iPhone), expórtala como JPG o tómala en «Más compatible».')
  }
  const escala = Math.min(1, LADO_MAX_FOTO / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const texto = await ocrDeCanvas(canvas, alAvanzar)
  return { texto, origen: 'ocr', vista: URL.createObjectURL(archivo), paginas: 1 }
}

/**
 * @param {File} archivo
 * @param {(avance: number) => void} [alAvanzar] 0..1
 */
export async function leerComprobante(archivo, alAvanzar) {
  const tipo = tipoDeArchivo(archivo)
  if (!tipo) throw new Error('Formato no soportado. Sube PDF o fotos (JPG, PNG).')
  const r = tipo === 'pdf' ? await leerPdf(archivo, alAvanzar) : await leerImagen(archivo, alAvanzar)
  return { ...r, campos: interpretarComprobante(r.texto, { origen: r.origen }) }
}
