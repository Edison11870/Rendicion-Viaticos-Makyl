// Genera los archivos de salida EN EL NAVEGADOR (se carga recién al llegar al paso Resultado).
import fuenteRegularUrl from '@fontsource/carlito/files/carlito-latin-400-normal.woff?url'
import fuenteNegritaUrl from '@fontsource/carlito/files/carlito-latin-700-normal.woff?url'
import { tipoDeArchivo } from '../reglas/comprobantes.js'
import { crearLibroNoUtilizados, crearLibroRendicion, libroABytes } from './excelRendicion.js'
import { generarPdfPlanillas, generarPdfSustentos } from './pdfSustentos.js'

const LADO_MAX = 2400 // px de las fotos dentro del PDF (legibles y livianas)

async function bytesDeUrl(url) {
  return new Uint8Array(await (await fetch(url)).arrayBuffer())
}

let recursos = null
function cargarRecursos() {
  recursos ??= Promise.all([
    bytesDeUrl(new URL('logo-rendicion.jpg', document.baseURI).href),
    bytesDeUrl(fuenteRegularUrl),
    bytesDeUrl(fuenteNegritaUrl),
  ]).then(([logo, regular, negrita]) => ({ logo, fuentes: { regular, negrita } }))
  return recursos
}

/** Imagen (cualquier formato que abra el navegador) → JPEG, respetando la orientación de la foto. */
async function aJpeg(blob) {
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
  const esc = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * esc)
  canvas.height = Math.round(bmp.height * esc)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close?.()
  const salida = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.88))
  return new Uint8Array(await salida.arrayBuffer())
}

/** Archivo de un comprobante listo para el PDF (con la vista previa como respaldo si el PDF está protegido). */
async function archivoDe(c) {
  if (!c?.archivo) return null
  if (tipoDeArchivo(c.archivo) === 'pdf') {
    const respaldo = c.vista ? { tipo: 'jpg', bytes: await aJpeg(await (await fetch(c.vista)).blob()) } : null
    return { tipo: 'pdf', bytes: new Uint8Array(await c.archivo.arrayBuffer()), respaldo }
  }
  return { tipo: 'jpg', bytes: await aJpeg(c.archivo) }
}

/** Resuelve las evidencias (ids) de cada planilla a los comprobantes cargados. */
function conEvidencias(filas, lista) {
  const porId = new Map(lista.map((c) => [c.id, c]))
  return filas.map((f) => (f.tipo === 'planilla' ? { ...f, evidencias: (f.planilla.evidencias || []).map((id) => porId.get(id)).filter(Boolean) } : f))
}

export async function excelRendicion(filas, datos) {
  const { logo } = await cargarRecursos()
  return libroABytes(await crearLibroRendicion({ filas, datos, logo }))
}

export async function pdfSustentos(filas, datos, lista) {
  const { logo, fuentes } = await cargarRecursos()
  const depositos = lista.filter((c) => c.estado === 'listo' && c.campos?.tipo === 'deposito')
  return generarPdfSustentos({ filas: conEvidencias(filas, lista), datos, logo, fuentes, archivoDe, depositos })
}

export async function pdfPlanillas(filas, datos) {
  const { fuentes } = await cargarRecursos()
  return generarPdfPlanillas({ filas, datos, fuentes })
}

export async function excelNoUtilizados(items, datos) {
  return libroABytes(await crearLibroNoUtilizados(items, datos))
}

/** Descarga un archivo generado. */
export function descargar(bytes, nombre, tipo) {
  const url = URL.createObjectURL(new Blob([bytes], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const TIPO_PDF = 'application/pdf'
