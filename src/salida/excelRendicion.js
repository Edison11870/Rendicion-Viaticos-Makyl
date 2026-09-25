// Excel de la rendición con el formato oficial de MAKYL (hoja de rendición + una hoja por planilla).
import ExcelJS from 'exceljs'
import { EMPRESA } from '../config/empresa.js'
import { destinoPlanilla } from '../reglas/movilidad.js'
import { centimosATexto, isoADmy } from '../util/formato.js'
import {
  ALTOS,
  ALTOS_PIE,
  ALTO_DETALLE,
  ALTO_ULTIMO_DETALLE,
  ANCHOS,
  FILA_PRIMER_DETALLE,
  FORMATO_DOLARES,
  FORMATO_FECHA,
  FORMATO_SOLES,
  HOJA_RENDICION,
  LOGO,
  PAGINA,
  disposicion,
} from './formato.js'

const FUENTE = { name: 'Calibri', size: 11, family: 2 }
const NEGRITA = { ...FUENTE, bold: true }
const FINO = { style: 'thin' }
const MEDIO = { style: 'medium' }
const BORDE_FINO = { top: FINO, left: FINO, bottom: FINO, right: FINO }

/** Fecha ISO → fecha de Excel (sin desfase de zona horaria). */
function fechaExcel(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

/** «TRANSFERENCIA __ok__ EFECTIVO ____ CHEQUE N° ____» con la forma usada marcada. */
function textoFormaEntrega(forma, cheque) {
  const marca = (si) => (si ? '  ok  ' : '      ')
  const sub = (texto) => ({ font: { ...FUENTE, underline: true }, text: texto })
  return {
    richText: [
      { font: FUENTE, text: 'TRANSFERENCIA ' },
      sub(marca(forma === 'transferencia')),
      { font: FUENTE, text: '  EFECTIVO ' },
      sub(marca(forma === 'efectivo')),
      { font: FUENTE, text: '  CHEQUE N° ' },
      sub(forma === 'cheque' ? ` ${cheque || 'ok'} ` : '        '),
    ],
  }
}

/**
 * @param {object} p
 * @param {Array} p.filas            filas de filasRendicion()
 * @param {object} p.datos           ver datosSalida() en ./datos.js
 * @param {ArrayBuffer|Uint8Array} [p.logo]  JPEG del logo de la hoja (templates/logo-rendicion.jpg)
 */
export async function crearLibroRendicion({ filas, datos, logo }) {
  const libro = new ExcelJS.Workbook()
  libro.creator = 'Rendición de viáticos MAKYL'
  libro.created = new Date()
  hojaRendicion(libro, filas, datos, logo)
  for (const f of filas.filter((x) => x.tipo === 'planilla')) hojaPlanilla(libro, f.planilla, datos)
  return libro
}

export async function libroABytes(libro) {
  return new Uint8Array(await libro.xlsx.writeBuffer())
}

function hojaRendicion(libro, filas, datos, logo) {
  const d = disposicion(filas.length)
  const ws = libro.addWorksheet(HOJA_RENDICION, {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: PAGINA.papel,
      orientation: 'portrait',
      scale: PAGINA.escala,
      fitToPage: false,
      margins: PAGINA.margenes,
      printArea: `A1:F${d.fin}`,
    },
  })
  ws.properties.defaultRowHeight = 15
  ANCHOS.forEach((w, i) => (ws.getColumn(i + 1).width = w))
  ws.getColumn(1).font = FUENTE

  for (const [fila, alto] of Object.entries(ALTOS)) ws.getRow(Number(fila)).height = alto
  for (let r = FILA_PRIMER_DETALLE; r <= d.ultimoDetalle; r++) ws.getRow(r).height = r === d.ultimoDetalle ? ALTO_ULTIMO_DETALLE : ALTO_DETALLE
  for (const [rel, alto] of Object.entries(ALTOS_PIE)) {
    const fila = ws.getRow(d.total + Number(rel))
    if (alto === 0) {
      // fila oculta del formato; ExcelJS solo la guarda si tiene alguna celda
      fila.height = 6.75
      fila.hidden = true
      fila.getCell(2).value = null
      fila.getCell(2).font = FUENTE
    } else fila.height = alto
  }

  const celda = (ref, valor, estilo = {}) => {
    const c = ws.getCell(ref)
    c.value = valor
    c.font = estilo.font || FUENTE
    if (estilo.alignment) c.alignment = estilo.alignment
    if (estilo.numFmt) c.numFmt = estilo.numFmt
    if (estilo.border) c.border = estilo.border
    return c
  }
  const izq = { horizontal: 'left', vertical: 'bottom' }
  const centro = { horizontal: 'center', vertical: 'bottom' }

  // encabezado
  ws.mergeCells('B4:F4')
  celda('B4', 'RENDICIÓN DE GASTOS', { font: NEGRITA, alignment: centro })
  celda('B6', `Persona que recibe : ${datos.persona} `, { font: NEGRITA, alignment: izq })
  celda('B8', `Fecha de entrega: ${isoADmy(datos.fechaEntrega)}`, { font: NEGRITA, alignment: izq })
  ws.mergeCells('E8:F8')
  celda('B10', `Monto entregado : S/ ${centimosATexto(datos.monto)}`, { font: NEGRITA, alignment: izq })
  celda('B11', 'Forma de  entrega:', { font: NEGRITA, alignment: izq })
  ws.mergeCells('D11:F11')
  celda('D11', textoFormaEntrega(datos.formaEntrega, datos.chequeNumero), { alignment: izq })
  celda('B12', 'PROYECTO :', { font: NEGRITA, alignment: centro })
  celda('C12', `${datos.proyecto} `, { font: NEGRITA, alignment: izq })

  // cabecera de la tabla
  ;['FECHA', 'DOCUMENTO', 'Descripción ', 'Nuevos Soles', 'Dólares '].forEach((t, i) => {
    celda(`${'BCDEF'[i]}13`, t, { font: NEGRITA, alignment: centro, border: BORDE_FINO })
  })

  // detalle
  for (let i = 0; i < d.n; i++) {
    const r = FILA_PRIMER_DETALLE + i
    const f = filas[i]
    const borde = r === d.ultimoDetalle ? { top: FINO, left: FINO, right: FINO } : BORDE_FINO
    celda(`B${r}`, f?.fecha ? fechaExcel(f.fecha) : null, { numFmt: FORMATO_FECHA, alignment: centro, border: borde })
    celda(`C${r}`, f ? f.documento : null, { alignment: centro, border: borde })
    celda(`D${r}`, f ? f.descripcion : null, { alignment: { ...izq, indent: 1 }, border: borde })
    celda(`E${r}`, f?.soles != null ? f.soles / 100 : null, { numFmt: FORMATO_SOLES, border: borde })
    celda(`F${r}`, f?.dolares != null ? f.dolares / 100 : null, { numFmt: FORMATO_DOLARES, alignment: centro, border: borde })
  }

  // total
  const t = d.total
  const totalSoles = filas.reduce((s, f) => s + (f.soles || 0), 0)
  const totalDolares = filas.reduce((s, f) => s + (f.dolares || 0), 0)
  ws.mergeCells(`B${t}:D${t}`)
  celda(`B${t}`, 'Total gastos ', { font: NEGRITA, alignment: centro, border: { top: MEDIO, left: MEDIO, bottom: MEDIO } })
  ws.getCell(`C${t}`).border = { top: MEDIO, bottom: MEDIO }
  ws.getCell(`D${t}`).border = { top: MEDIO, bottom: MEDIO }
  celda(`E${t}`, { formula: `SUM(E${FILA_PRIMER_DETALLE}:E${d.ultimoDetalle})`, result: totalSoles / 100 }, {
    numFmt: FORMATO_SOLES,
    border: { top: MEDIO, left: MEDIO, bottom: MEDIO },
  })
  celda(`F${t}`, totalDolares ? { formula: `SUM(F${FILA_PRIMER_DETALLE}:F${d.ultimoDetalle})`, result: totalDolares / 100 } : null, {
    numFmt: FORMATO_DOLARES,
    border: { top: MEDIO, left: MEDIO, bottom: MEDIO, right: MEDIO },
  })

  // pie: saldo = monto entregado − total gastos
  const saldo = datos.monto - totalSoles
  celda(`B${d.saldos}`, 'Saldos Entregados :', { font: NEGRITA, alignment: izq })
  celda(`E${d.saldos}`, { formula: `${(datos.monto / 100).toFixed(2)}-E${t}`, result: saldo / 100 }, { font: NEGRITA, numFmt: FORMATO_SOLES })
  celda(`D${d.saldos}`, saldo > 0 ? 'a devolver por el trabajador' : saldo < 0 ? 'a favor del trabajador' : 'sin saldo', {
    alignment: { horizontal: 'right', vertical: 'bottom' },
  })
  celda(`B${d.fechaRendicion}`, `Fecha de rendición  : ${isoADmy(datos.fechaRendicion)}`, { font: NEGRITA, alignment: izq })
  ws.mergeCells(`E${d.fechaRendicion}:F${d.fechaRendicion}`)
  celda(`B${d.entrega}`, `Persona que entrega: ${datos.persona} `, { font: NEGRITA, alignment: izq })
  celda(`B${d.recibe}`, `Persona que recibe: ${datos.recibe}`, { font: NEGRITA, alignment: izq })

  if (logo) {
    const id = libro.addImage({ buffer: logo, extension: 'jpeg' })
    ws.addImage(id, { tl: LOGO.desde, br: LOGO.hasta, editAs: 'oneCell' })
  }
  return ws
}

/** Planilla de Movilidad Diaria (reconstruida del formato impreso de la empresa). */
function hojaPlanilla(libro, p, datos) {
  const num = String(p.numero).padStart(3, '0')
  const ws = libro.addWorksheet(`Planilla ${num}`, {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0, footer: 0 } },
  })
  ;[34, 34, 8, 14, 22].forEach((w, i) => (ws.getColumn(i + 1).width = w))
  const c = (ref, valor, estilo = {}) => {
    const x = ws.getCell(ref)
    x.value = valor
    x.font = estilo.font || FUENTE
    x.alignment = estilo.alignment || { vertical: 'bottom', wrapText: true }
    if (estilo.border) x.border = estilo.border
    if (estilo.numFmt) x.numFmt = estilo.numFmt
    return x
  }
  const sub = { ...NEGRITA, underline: true }

  c('A1', 'Planilla de Movilidad Diaria', { font: { ...NEGRITA, size: 12 } })
  c('E1', `Planilla No ${num}`, { font: NEGRITA, alignment: { horizontal: 'right' } })
  c('A3', 'I.- Datos de la Empresa', { font: sub })
  c('A4', 'Razón Social:', { font: NEGRITA })
  c('B4', EMPRESA.razonSocial)
  c('A5', 'RUC:', { font: NEGRITA })
  c('B5', EMPRESA.ruc)
  c('A6', 'DIA:', { font: NEGRITA })
  c('B6', isoADmy(p.fecha))
  c('A7', 'FECHA DE EMISIÓN:', { font: NEGRITA })
  c('B7', isoADmy(datos.fechaRendicion))
  c('A9', 'II.- Datos del trabajador y del Desplazamiento', { font: sub })
  c('A10', 'Nombres y Apellidos', { font: NEGRITA })
  c('B10', datos.personaPlanilla)
  c('A11', 'DNI', { font: NEGRITA })
  c('B11', datos.dni)

  const cab = 13
  ws.getRow(cab).height = 45
  ;['Motivo', 'Destino', 'Sub Total S/.', 'Total, Trabajador S/.', 'Firma del Trabajador'].forEach((t, i) => {
    c(`${'ABCDE'[i]}${cab}`, t, { font: NEGRITA, alignment: { horizontal: 'center', vertical: 'bottom', wrapText: true }, border: BORDE_FINO })
  })
  const n = Math.max(3, p.lineas.length)
  const ini = cab + 1
  const fin = cab + n
  for (let i = 0; i < n; i++) {
    const g = p.lineas[i]
    const r = ini + i
    ws.getRow(r).height = g && destinoPlanilla(g).length > 34 ? 32 : 18
    c(`A${r}`, g?.motivo || null, { border: BORDE_FINO })
    c(`B${r}`, g ? destinoPlanilla(g) : null, { border: BORDE_FINO })
    c(`C${r}`, g ? g.monto / 100 : null, { numFmt: '0.00', alignment: { horizontal: 'right', vertical: 'bottom' }, border: BORDE_FINO })
  }
  ws.mergeCells(`D${ini}:D${fin}`)
  c(`D${ini}`, { formula: `SUM(C${ini}:C${fin})`, result: p.total / 100 }, { numFmt: '0.00', alignment: { horizontal: 'center', vertical: 'bottom' }, border: BORDE_FINO })
  ws.mergeCells(`E${ini}:E${fin}`)
  c(`E${ini}`, null, { border: BORDE_FINO })

  const tot = fin + 2
  ws.getRow(tot).height = 24
  c(`B${tot}`, 'Total, Movilidad del día', { font: { ...NEGRITA, size: 12 }, alignment: { horizontal: 'right', vertical: 'bottom' } })
  c(`C${tot}`, { formula: `D${ini}`, result: p.total / 100 }, {
    font: { ...NEGRITA, size: 12 },
    numFmt: '"S/ "0.00',
    alignment: { horizontal: 'right', vertical: 'bottom' },
    border: { top: FINO, bottom: { style: 'double' } },
  })
  // marco exterior
  const ultima = tot + 1
  for (let r = 1; r <= ultima; r++) {
    for (let k = 1; k <= 5; k++) {
      const x = ws.getRow(r).getCell(k)
      const b = { ...(x.border || {}) }
      if (r === 1) b.top = FINO
      if (r === ultima) b.bottom = FINO
      if (k === 1) b.left = FINO
      if (k === 5) b.right = FINO
      x.border = b
    }
  }
  ws.pageSetup.printArea = `A1:E${ultima}`
  return ws
}

/** Lista de comprobantes no utilizados (para otra rendición). */
export async function crearLibroNoUtilizados(items, datos) {
  const libro = new ExcelJS.Workbook()
  const ws = libro.addWorksheet('No utilizados', { views: [{ state: 'frozen', ySplit: 3 }] })
  ws.getCell('A1').value = `Comprobantes no utilizados · ${datos.proyecto} · rendición del ${isoADmy(datos.fechaRendicion)}`
  ws.getCell('A1').font = { ...NEGRITA, size: 12 }
  const cab = ['Fecha', 'Tipo', 'Serie-número', 'RUC emisor', 'Razón social', 'Descripción', 'Total S/', 'Motivo', 'Archivo']
  ws.getRow(3).values = cab
  ws.getRow(3).font = NEGRITA
  ws.getRow(3).eachCell((x) => {
    x.border = BORDE_FINO
    x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FA' } }
  })
  ;[12, 10, 16, 13, 36, 30, 11, 30, 30].forEach((w, i) => (ws.getColumn(i + 1).width = w))
  items.forEach(({ c, motivo }, i) => {
    const f = c.campos
    const fila = ws.getRow(4 + i)
    fila.values = [
      f.fecha ? fechaExcel(f.fecha) : null,
      f.tipo || '',
      f.documento || '',
      f.rucEmisor || '',
      f.razonSocial || '',
      c.clasificacion?.descripcion || '',
      f.total != null ? f.total / 100 : null,
      motivo,
      c.nombreArchivo,
    ]
    fila.getCell(1).numFmt = FORMATO_FECHA
    fila.getCell(7).numFmt = '#,##0.00'
    fila.eachCell({ includeEmpty: true }, (x) => (x.border = BORDE_FINO))
  })
  const t = 4 + items.length
  ws.getCell(`F${t}`).value = 'Total'
  ws.getCell(`F${t}`).font = NEGRITA
  ws.getCell(`G${t}`).value = { formula: `SUM(G4:G${t - 1})`, result: items.reduce((s, x) => s + (x.c.campos.total || 0), 0) / 100 }
  ws.getCell(`G${t}`).numFmt = '#,##0.00'
  ws.getCell(`G${t}`).font = NEGRITA
  return libro
}
