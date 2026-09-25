// PDF de sustentos: hoja de rendición → cada comprobante en el orden del reporte (cada planilla seguida
// de sus evidencias) → constancia del depósito al final. También el PDF de planillas para firmar.
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import { EMPRESA } from '../config/empresa.js'
import { destinoPlanilla } from '../reglas/movilidad.js'
import { centimosATexto, isoADmy } from '../util/formato.js'
import { ALTOS, ALTOS_PIE, ALTO_DETALLE, ALTO_ULTIMO_DETALLE, ANCHOS, FILA_PRIMER_DETALLE, LOGO, PAGINA, disposicion } from './formato.js'
import { dibujarHoja } from './pdfHoja.js'

const A4 = [595.28, 841.89]

/** Copia exacta de los bytes (evita vistas parciales de un búfer más grande). */
function bytesDe(x) {
  if (x instanceof ArrayBuffer) return new Uint8Array(x)
  return x.byteOffset === 0 && x.byteLength === x.buffer.byteLength ? x : new Uint8Array(x)
}
const PULGADA = 72

/** Celdas de la hoja de rendición (mismas posiciones que el Excel). */
export function hojaRendicion(filas, datos) {
  const d = disposicion(filas.length)
  const altos = { ...ALTOS }
  const ocultas = []
  for (let r = FILA_PRIMER_DETALLE; r <= d.ultimoDetalle; r++) altos[r] = r === d.ultimoDetalle ? ALTO_ULTIMO_DETALLE : ALTO_DETALLE
  for (const [rel, alto] of Object.entries(ALTOS_PIE)) {
    if (alto === 0) ocultas.push(d.total + Number(rel))
    else altos[d.total + Number(rel)] = alto
  }
  const fino = 'thin'
  const medio = 'medium'
  const todo = { t: fino, b: fino, l: fino, r: fino }
  const celdas = [
    { f: 4, c: 2, c2: 6, texto: 'RENDICIÓN DE GASTOS', negrita: true, h: 'center' },
    { f: 6, c: 2, c2: 6, texto: `Persona que recibe : ${datos.persona}`, negrita: true },
    { f: 8, c: 2, c2: 4, texto: `Fecha de entrega: ${isoADmy(datos.fechaEntrega)}`, negrita: true },
    { f: 10, c: 2, c2: 4, texto: `Monto entregado : S/ ${centimosATexto(datos.monto)}`, negrita: true },
    { f: 11, c: 2, c2: 3, texto: 'Forma de  entrega:', negrita: true },
    {
      f: 11, c: 4, c2: 6,
      runs: [
        { texto: 'TRANSFERENCIA ' },
        { texto: datos.formaEntrega === 'transferencia' ? '  ok  ' : '      ', subrayado: true },
        { texto: '  EFECTIVO ' },
        { texto: datos.formaEntrega === 'efectivo' ? '  ok  ' : '      ', subrayado: true },
        { texto: '  CHEQUE N° ' },
        { texto: datos.formaEntrega === 'cheque' ? ` ${datos.chequeNumero || 'ok'} ` : '        ', subrayado: true },
      ],
    },
    { f: 12, c: 2, texto: 'PROYECTO :', negrita: true, h: 'center' },
    { f: 12, c: 3, c2: 5, texto: datos.proyecto, negrita: true },
    ...['FECHA', 'DOCUMENTO', 'Descripción', 'Nuevos Soles', 'Dólares'].map((t, i) => ({ f: 13, c: i + 2, texto: t, negrita: true, h: 'center', borde: todo })),
  ]
  for (let i = 0; i < d.n; i++) {
    const r = FILA_PRIMER_DETALLE + i
    const x = filas[i]
    const borde = r === d.ultimoDetalle ? { t: fino, l: fino, r: fino } : todo
    celdas.push(
      { f: r, c: 2, texto: x?.fecha ? isoADmy(x.fecha) : '', h: 'center', borde },
      { f: r, c: 3, texto: x?.documento || '', h: 'center', borde },
      { f: r, c: 4, texto: x?.descripcion || '', sangria: 1, borde },
      { f: r, c: 5, monto: x?.soles != null ? centimosATexto(x.soles) : null, borde },
      { f: r, c: 6, texto: x?.dolares != null ? `S/.${centimosATexto(x.dolares)}` : '', h: 'center', borde },
    )
  }
  const totalSoles = filas.reduce((s, x) => s + (x.soles || 0), 0)
  const totalDolares = filas.reduce((s, x) => s + (x.dolares || 0), 0)
  const saldo = datos.monto - totalSoles
  celdas.push(
    { f: d.total, c: 2, c2: 4, texto: 'Total gastos', negrita: true, h: 'center', borde: { t: medio, b: medio, l: medio } },
    { f: d.total, c: 5, monto: centimosATexto(totalSoles), borde: { t: medio, b: medio, l: medio } },
    { f: d.total, c: 6, texto: totalDolares ? `S/.${centimosATexto(totalDolares)}` : '', h: 'center', borde: { t: medio, b: medio, l: medio, r: medio } },
    { f: d.saldos, c: 2, c2: 3, texto: 'Saldos Entregados :', negrita: true },
    { f: d.saldos, c: 4, texto: saldo > 0 ? 'a devolver por el trabajador' : saldo < 0 ? 'a favor del trabajador' : 'sin saldo', h: 'right' },
    { f: d.saldos, c: 5, monto: `${saldo < 0 ? '-' : ''}${centimosATexto(Math.abs(saldo))}`, negrita: true },
    { f: d.fechaRendicion, c: 2, c2: 4, texto: `Fecha de rendición  : ${isoADmy(datos.fechaRendicion)}`, negrita: true },
    { f: d.entrega, c: 2, c2: 4, texto: `Persona que entrega: ${datos.persona}`, negrita: true },
    { f: d.recibe, c: 2, c2: 4, texto: `Persona que recibe: ${datos.recibe}`, negrita: true },
  )
  return { anchos: ANCHOS, altos, ocultas, celdas }
}

/** Celdas de la Planilla de Movilidad Diaria (mismas posiciones que la hoja del Excel). */
export function hojaPlanilla(p, datos) {
  const num = String(p.numero).padStart(3, '0')
  const fino = 'thin'
  const todo = { t: fino, b: fino, l: fino, r: fino }
  const n = Math.max(3, p.lineas.length)
  const ini = 14
  const fin = 13 + n
  const tot = fin + 2
  const ultima = tot + 1
  const altos = { 13: 45, [tot]: 24 }
  const celdas = [
    { f: 1, c: 1, c2: 3, texto: 'Planilla de Movilidad Diaria', negrita: true, tam: 12 },
    { f: 1, c: 5, texto: `Planilla No ${num}`, negrita: true, h: 'right' },
    { f: 3, c: 1, texto: 'I.- Datos de la Empresa', negrita: true, subrayado: true },
    { f: 4, c: 1, texto: 'Razón Social:', negrita: true },
    { f: 4, c: 2, c2: 3, texto: EMPRESA.razonSocial },
    { f: 5, c: 1, texto: 'RUC:', negrita: true },
    { f: 5, c: 2, texto: EMPRESA.ruc },
    { f: 6, c: 1, texto: 'DIA:', negrita: true },
    { f: 6, c: 2, texto: isoADmy(p.fecha) },
    { f: 7, c: 1, texto: 'FECHA DE EMISIÓN:', negrita: true },
    { f: 7, c: 2, texto: isoADmy(datos.fechaRendicion) },
    { f: 9, c: 1, c2: 2, texto: 'II.- Datos del trabajador y del Desplazamiento', negrita: true, subrayado: true },
    { f: 10, c: 1, texto: 'Nombres y Apellidos', negrita: true },
    { f: 10, c: 2, c2: 3, texto: datos.personaPlanilla },
    { f: 11, c: 1, texto: 'DNI', negrita: true },
    { f: 11, c: 2, texto: datos.dni },
    ...['Motivo', 'Destino', 'Sub Total S/.', 'Total, Trabajador S/.', 'Firma del Trabajador'].map((t, i) => ({ f: 13, c: i + 1, texto: t, negrita: true, h: 'center', ajustar: true, borde: todo })),
  ]
  for (let i = 0; i < n; i++) {
    const g = p.lineas[i]
    const r = ini + i
    altos[r] = g && destinoPlanilla(g).length > 34 ? 32 : 18
    celdas.push(
      { f: r, c: 1, texto: g?.motivo || '', ajustar: true, borde: todo },
      { f: r, c: 2, texto: g ? destinoPlanilla(g) : '', ajustar: true, borde: todo },
      { f: r, c: 3, texto: g ? centimosATexto(g.monto) : '', h: 'right', borde: todo },
    )
  }
  celdas.push(
    { f: ini, f2: fin, c: 4, texto: centimosATexto(p.total), h: 'center', borde: todo },
    { f: ini, f2: fin, c: 5, texto: '', borde: todo },
    { f: tot, c: 2, texto: 'Total, Movilidad del día', negrita: true, tam: 12, h: 'right' },
    { f: tot, c: 3, texto: `S/ ${centimosATexto(p.total)}`, negrita: true, tam: 12, h: 'right', borde: { t: fino, b: 'double' } },
    // marco exterior
    { f: 1, f2: ultima, c: 1, c2: 5, borde: todo },
  )
  return { anchos: [34, 34, 8, 14, 22], altos, celdas }
}

async function nuevoDocumento(fuentesBytes) {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const fuentes = {
    regular: await doc.embedFont(bytesDe(fuentesBytes.regular), { subset: true }),
    negrita: await doc.embedFont(bytesDe(fuentesBytes.negrita), { subset: true }),
  }
  return { doc, fuentes }
}

function paginaRendicion(doc, fuentes, filas, datos, logo) {
  const pagina = doc.addPage(A4)
  const hoja = hojaRendicion(filas, datos)
  if (logo) hoja.imagenes = [{ imagen: logo, desde: LOGO.desde, hasta: LOGO.hasta }]
  // misma escala y márgenes que la impresión del Excel (A4 al 83 %)
  dibujarHoja(pagina, hoja, { x: PAGINA.margenes.left * PULGADA, y: A4[1] - PAGINA.margenes.top * PULGADA, escala: PAGINA.escala / 100 }, fuentes)
}

function paginaPlanilla(doc, fuentes, p, datos) {
  const pagina = doc.addPage(A4)
  const hoja = hojaPlanilla(p, datos)
  const margen = 0.4 * PULGADA
  const anchoHoja = hoja.anchos.reduce((s, w) => s + (Math.trunc(((256 * w + 18) / 256) * 7) * 0.75), 0)
  const escala = Math.min(1, (A4[0] - 2 * margen) / anchoHoja)
  dibujarHoja(pagina, hoja, { x: margen, y: A4[1] - 0.5 * PULGADA, escala }, fuentes)
}

/** Agrega el archivo de un comprobante/evidencia: páginas del PDF tal cual, o la foto en una hoja A4. */
async function agregarArchivo(doc, fuentes, archivo, rotulo) {
  if (!archivo) return
  if (archivo.tipo === 'pdf') {
    try {
      const origen = await PDFDocument.load(bytesDe(archivo.bytes), { ignoreEncryption: true })
      const paginas = await doc.copyPages(origen, origen.getPageIndices())
      paginas.forEach((pg) => doc.addPage(pg))
      return
    } catch {
      if (!archivo.respaldo) throw new Error(`No se pudo copiar el PDF de ${rotulo}.`)
      archivo = archivo.respaldo // PDF protegido o dañado: se usa su imagen
    }
  }
  const b = bytesDe(archivo.bytes)
  const imagen = archivo.tipo === 'png' ? await doc.embedPng(b) : await doc.embedJpg(b)
  const horizontal = imagen.width > imagen.height * 1.15
  const [ancho, alto] = horizontal ? [A4[1], A4[0]] : A4
  const pagina = doc.addPage([ancho, alto])
  const margen = 28
  const pie = 16
  const esc = Math.min((ancho - 2 * margen) / imagen.width, (alto - 2 * margen - pie) / imagen.height)
  const w = imagen.width * esc
  const h = imagen.height * esc
  pagina.drawImage(imagen, { x: (ancho - w) / 2, y: margen + pie + (alto - 2 * margen - pie - h) / 2, width: w, height: h })
  if (rotulo) pagina.drawText(rotulo, { x: margen, y: margen - 6, size: 8, font: fuentes.regular, color: rgb(0.35, 0.35, 0.35) })
}

/**
 * @param {object} p
 * @param {Array} p.filas              filas de filasRendicion(), cada una con `archivo` (comprobante) o `planilla` y `evidencias`
 * @param {object} p.datos             datosSalida()
 * @param {Uint8Array} [p.logo]        JPEG del logo de la hoja
 * @param {{regular: Uint8Array, negrita: Uint8Array}} p.fuentes  Carlito (métrica de Calibri)
 * @param {(item: object) => Promise<{tipo: 'pdf'|'jpg'|'png', bytes: Uint8Array, respaldo?: object}>} p.archivoDe
 * @param {object[]} [p.depositos]     constancias del depósito (van al final)
 */
export async function generarPdfSustentos({ filas, datos, logo, fuentes, archivoDe, depositos = [] }) {
  const { doc, fuentes: f } = await nuevoDocumento(fuentes)
  doc.setTitle(`Rendición de gastos - ${datos.proyecto}`)
  doc.setCreator('Rendición de viáticos MAKYL')
  const logoImg = logo ? await doc.embedJpg(bytesDe(logo)) : null
  paginaRendicion(doc, f, filas, datos, logoImg)
  for (const [i, x] of filas.entries()) {
    const n = i + 1
    if (x.tipo === 'planilla') {
      paginaPlanilla(doc, f, x.planilla, datos)
      for (const ev of x.evidencias || []) await agregarArchivo(doc, f, await archivoDe(ev), `${n} · ${x.documento} · evidencia`)
    } else {
      await agregarArchivo(doc, f, await archivoDe(x.comprobante), `${n} · ${x.documento} · S/ ${centimosATexto(x.soles ?? x.dolares)}`)
    }
  }
  for (const dep of depositos) await agregarArchivo(doc, f, await archivoDe(dep), 'Constancia del depósito')
  return doc.save()
}

/** Solo las planillas, para imprimir y firmar. */
export async function generarPdfPlanillas({ filas, datos, fuentes }) {
  const { doc, fuentes: f } = await nuevoDocumento(fuentes)
  doc.setTitle(`Planillas de movilidad - ${datos.proyecto}`)
  for (const x of filas.filter((y) => y.tipo === 'planilla')) paginaPlanilla(doc, f, x.planilla, datos)
  return doc.save()
}
