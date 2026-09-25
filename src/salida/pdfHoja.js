// Dibuja en PDF una «hoja» descrita como celdas de Excel (anchos en caracteres, altos en pt),
// para que la hoja de rendición y las planillas del PDF se vean como el Excel impreso.
import { rgb } from 'pdf-lib'
import { anchoEnPuntos } from './formato.js'

const NEGRO = rgb(0, 0, 0)
const GROSOR = { thin: 0.6, medium: 1.3, double: 0.5 }

/**
 * @param {import('pdf-lib').PDFPage} pagina
 * @param {object} hoja
 * @param {number[]} hoja.anchos       ancho de cada columna (caracteres)
 * @param {Record<number, number>} hoja.altos  alto de cada fila (pt), 1-indexado; 15 por defecto
 * @param {number[]} [hoja.ocultas]    filas ocultas
 * @param {object[]} hoja.celdas       { f, c, f2?, c2?, texto?, runs?, negrita?, tam?, h?: 'left'|'center'|'right', v?: 'top'|'bottom'|'center', ajustar?, sangria?, borde?: {t,b,l,r} }
 * @param {object[]} [hoja.imagenes]   { imagen, desde: {col,row}, hasta: {col,row} } (col/row base 0, con fracción)
 * @param {{x: number, y: number, escala: number}} origen  esquina superior izquierda (pt) y escala
 * @param {{regular: import('pdf-lib').PDFFont, negrita: import('pdf-lib').PDFFont}} fuentes
 */
export function dibujarHoja(pagina, hoja, origen, fuentes) {
  const k = origen.escala
  const anchos = hoja.anchos.map((w) => anchoEnPuntos(w) * k)
  const xCol = [origen.x]
  for (const w of anchos) xCol.push(xCol[xCol.length - 1] + w)
  const alto = (f) => ((hoja.ocultas || []).includes(f) ? 0 : (hoja.altos[f] ?? 15)) * k
  const maxFila = Math.max(...hoja.celdas.map((c) => c.f2 || c.f), 1) + 1
  const yFila = [null, origen.y] // yFila[f] = borde superior de la fila f (coordenada PDF, crece hacia arriba)
  for (let f = 1; f <= maxFila + 1; f++) yFila[f + 1] = yFila[f] - alto(f)

  const posX = (col) => {
    const i = Math.floor(col)
    return xCol[i] + (col - i) * (anchos[i] || 0)
  }
  const posY = (row) => {
    const i = Math.floor(row) + 1
    return yFila[i] - (row - Math.floor(row)) * alto(i)
  }

  for (const img of hoja.imagenes || []) {
    const x1 = posX(img.desde.col)
    const x2 = posX(img.hasta.col)
    const y1 = posY(img.desde.row)
    const y2 = posY(img.hasta.row)
    pagina.drawImage(img.imagen, { x: x1, y: y2, width: x2 - x1, height: y1 - y2 })
  }

  for (const c of hoja.celdas) {
    const x1 = xCol[c.c - 1]
    const x2 = xCol[(c.c2 || c.c)]
    const yTop = yFila[c.f]
    const yBot = yFila[(c.f2 || c.f) + 1]
    const b = c.borde || {}
    const linea = (xa, ya, xb, yb, estilo) => {
      if (!estilo) return
      const t = GROSOR[estilo] * Math.max(k, 0.7)
      pagina.drawLine({ start: { x: xa, y: ya }, end: { x: xb, y: yb }, thickness: t, color: NEGRO })
      if (estilo === 'double') pagina.drawLine({ start: { x: xa, y: ya - 1.6 }, end: { x: xb, y: yb - 1.6 }, thickness: t, color: NEGRO })
    }
    linea(x1, yTop, x2, yTop, b.t)
    linea(x1, yBot, x2, yBot, b.b)
    linea(x1, yTop, x1, yBot, b.l)
    linea(x2, yTop, x2, yBot, b.r)
    escribir(pagina, c, { x1, x2, yTop, yBot }, k, fuentes)
  }
  return { abajo: yFila[maxFila] }
}

function escribir(pagina, c, caja, k, fuentes) {
  const tam = (c.tam || 11) * k
  const pad = 2.2 * k + (c.sangria || 0) * 9 * k
  const ancho = caja.x2 - caja.x1 - pad * 2
  // «runs»: texto con partes subrayadas (forma de entrega); «monto»: S/ a la izquierda y cifra a la derecha
  if (c.monto !== undefined && c.monto !== null) {
    const f = c.negrita ? fuentes.negrita : fuentes.regular
    const y = caja.yBot + 3.2 * k
    pagina.drawText('S/', { x: caja.x1 + pad, y, size: tam, font: f, color: NEGRO })
    const w = f.widthOfTextAtSize(c.monto, tam)
    pagina.drawText(c.monto, { x: caja.x2 - pad - w - 3 * k, y, size: tam, font: f, color: NEGRO })
    return
  }
  if (c.runs) {
    let x = caja.x1 + pad
    const y = caja.yBot + 3.2 * k
    for (const r of c.runs) {
      const f = r.negrita ? fuentes.negrita : fuentes.regular
      const w = f.widthOfTextAtSize(r.texto, tam)
      pagina.drawText(r.texto, { x, y, size: tam, font: f, color: NEGRO })
      if (r.subrayado) pagina.drawLine({ start: { x, y: y - 1.2 * k }, end: { x: x + w, y: y - 1.2 * k }, thickness: 0.6 * k, color: NEGRO })
      x += w
    }
    return
  }
  if (c.texto === undefined || c.texto === null || c.texto === '') return
  const f = c.negrita ? fuentes.negrita : fuentes.regular
  const lineas = c.ajustar ? partir(String(c.texto), f, tam, ancho) : [String(c.texto)]
  const interlinea = tam * 1.22
  const bloque = interlinea * lineas.length
  let yPrimera
  if (c.v === 'top') yPrimera = caja.yTop - tam - 1.5 * k
  else if (c.v === 'center') yPrimera = (caja.yTop + caja.yBot) / 2 + bloque / 2 - tam
  else yPrimera = caja.yBot + 3.2 * k + bloque - interlinea
  lineas.forEach((t, i) => {
    const w = f.widthOfTextAtSize(t, tam)
    let x = caja.x1 + pad
    if (c.h === 'center') x = (caja.x1 + caja.x2) / 2 - w / 2
    else if (c.h === 'right') x = caja.x2 - pad - w
    const y = yPrimera - i * interlinea
    pagina.drawText(t, { x, y, size: tam, font: f, color: NEGRO })
    if (c.subrayado) pagina.drawLine({ start: { x, y: y - 1.3 * k }, end: { x: x + w, y: y - 1.3 * k }, thickness: 0.6 * k, color: NEGRO })
  })
}

/** Parte un texto en líneas que entren en `ancho`. */
export function partir(texto, fuente, tam, ancho) {
  const palabras = texto.split(/\s+/)
  const lineas = []
  let actual = ''
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p
    if (fuente.widthOfTextAtSize(prueba, tam) <= ancho || !actual) actual = prueba
    else {
      lineas.push(actual)
      actual = p
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}
