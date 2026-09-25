// Interpreta el texto de un comprobante (sacado del PDF o por OCR) y propone sus campos.
// Es una función pura: no toca la pantalla. Todo lo que no está claro se marca en `dudas`
// para que el usuario lo revise en la tabla.
import { EMPRESA } from '../config/empresa.js'
import { aCentimos, aIso } from '../util/formato.js'
import { importeEnLetras } from './letras.js'
import { rucsEnTexto } from './ruc.js'

const MESES = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, set: 9, sep: 9, oct: 10, nov: 11, dic: 12 }

// Líneas que no son la razón social del emisor
const NO_ES_NOMBRE =
  /(FACTURA|BOLETA|TICKET|NOTA DE|RECIBO|ELECTR[OÓ]NIC|R\.?U\.?C|^\s*(AV|JR|CAL|CAR|MZ|PSJE|CALLE|JIRON|AVENIDA|C)\.?\s|TEL[EÉ]F|CENTRAL|EMAIL|@|WWW\.|^\s*\d)/i
const SUFIJO_EMPRESA = /\b(S\.?\s?A\.?\s?C\.?|S\.?\s?A\.?|E\.?\s?I\.?\s?R\.?\s?L\.?|S\.?\s?R\.?\s?L\.?|S\.?\s?A\.?\s?A\.?)\s*$/i

const EVIDENCIA_NO_COMPROBANTE = /(YAPEASTE|YAPE|PLIN|TRANSFERENCIA A TERCEROS|DETALLE DE MOVIMIENTO|CITY RIDE|RIDE\s*[·-]\s*COMPLETED|UBER|DIDI|CABIFY|INDRIVE)/i

function limpiarLinea(l) {
  return l.replace(/\s{2,}/g, ' ').trim()
}

/** Tipo de comprobante según el texto y la serie. */
function detectarTipo(texto, serie) {
  const t = texto.toUpperCase()
  if (/BOLETA\s+DE\s+VENTA|BOLETA\s+ELECTR/.test(t)) return 'boleta'
  if (/FACTURA/.test(t)) return 'factura'
  if (/RECIBO\s+POR\s+HONORARIOS/.test(t)) return 'recibo'
  if (/TICKET/.test(t)) return 'ticket'
  if (serie) {
    if (/^F/.test(serie)) return 'factura'
    if (/^B|^EB/.test(serie)) return 'boleta'
  }
  return null
}

/** Serie y número. Devuelve { serie, numero, confianza } o null. */
function detectarSerieNumero(texto) {
  // 1) Pie de las facturas del portal SUNAT: «… factura electrónica E001 - 100, generada …»
  let m = /electr[oó]nica\s+([A-Z]{1,2}\d{2,3}|[A-Z]\d{3})\s*-\s*(\d{1,8})\b/i.exec(texto)
  if (m) return { serie: m[1].toUpperCase(), numero: m[2], confianza: 'alta' }

  // 2) Forma habitual: F008-00000015, FA01-00034972, E001-605, B001-123 (letra + 3 alfanuméricos)
  const candidatos = []
  for (const x of texto.matchAll(/(?<![A-Z0-9])([FBE][A-Z0-9]{3})\s*[-–]\s*(\d{1,8})(?![\d])/gi)) {
    if (/\d/.test(x[1].slice(1))) candidatos.push({ serie: x[1].toUpperCase(), numero: x[2], confianza: 'alta' })
  }
  if (candidatos.length) return candidatos[0]

  // 3) Portal SUNAT con el guion desplazado: «E001 100-»
  m = /(?<![A-Z0-9])(E\d{3})\s+(\d{1,8})\s*-?\s*$/im.exec(texto)
  if (m) return { serie: m[1], numero: m[2], confianza: 'media' }

  // 4) Comprobante físico: «0003- N° 001885», «Nº 001885»
  m = /(?<!\d)(\d{3,4})\s*-?\s*N\s*[°ºo.]\s*(\d{3,8})/i.exec(texto)
  if (m) return { serie: m[1], numero: m[2], confianza: 'baja' }
  m = /\bN\s*[°º]\s*(\d{4,8})\b/i.exec(texto)
  if (m) return { serie: '', numero: m[1], confianza: 'baja' }
  return null
}

function detectarFecha(texto) {
  const lineas = texto.split('\n')
  const patron = /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2})/
  // con etiqueta «Fecha de emisión» en la misma línea o en la siguiente
  for (let i = 0; i < lineas.length; i++) {
    if (/FECHA\s*(DE)?\s*EMISI[OÓ]N|F\.?\s*EMISI[OÓ]N|FECHA\s*:/i.test(lineas[i])) {
      const m = patron.exec(lineas[i]) || patron.exec(lineas[i + 1] || '')
      const iso = m && aIso(m[1])
      if (iso) return { fecha: iso, confianza: 'alta' }
    }
  }
  // «02 mar. 2026»
  const mt = /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-z]*\.?\s+(?:de\s+)?(\d{4})/i.exec(texto)
  // primera fecha que no sea de vencimiento
  for (const l of lineas) {
    if (/VENC/i.test(l)) continue
    const m = patron.exec(l)
    const iso = m && aIso(m[1])
    if (iso) return { fecha: iso, confianza: 'media' }
  }
  if (mt) {
    const iso = aIso(`${mt[1]}/${MESES[mt[2].toLowerCase()]}/${mt[3]}`)
    if (iso) return { fecha: iso, confianza: 'media' }
  }
  return null
}

const MONTO = /(?:S\/|\$\/|s\/|US\$|\$)?\s*(\d{1,3}(?:[,.]\d{3})*[.,]\d{2}|\d+[.,]\d{2})(?!\d)/g

function montosEnLinea(linea) {
  return [...linea.matchAll(MONTO)].map((m) => aCentimos(m[1])).filter((c) => c !== null)
}

function detectarTotal(texto) {
  const lineas = texto.split('\n')
  const etiquetas = [
    /IMPORTE\s+TOTAL/i,
    /TOTAL\s+A\s+PAGAR/i,
    /TOTAL\s+VENTA/i,
    /(?<!SUB\s?)(?<!VALOR\s)\bTOTAL\b(?!\s*(DSCTO|DESC|DE\s+DESC|GRAVAD|ITEMS|ART))/i,
  ]
  for (const et of etiquetas) {
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i]
      if (!et.test(l)) continue
      const despues = l.slice(l.search(et))
      let montos = montosEnLinea(despues)
      if (!montos.length && lineas[i + 1]) montos = montosEnLinea(lineas[i + 1])
      if (montos.length) return { total: montos[montos.length - 1], confianza: 'alta' }
    }
  }
  return null
}

function detectarIgv(texto) {
  for (const l of texto.split('\n')) {
    const m = /\b(I\.?\s?G\.?\s?V\.?|1GV|16V|IGV)\b(.*)$/i.exec(l)
    if (!m) continue
    const resto = m[2].replace(/\d{1,2}(?:[.,]\d+)?\s*%/, '') // quita «18%»
    const montos = montosEnLinea(resto)
    if (montos.length) return montos[montos.length - 1]
  }
  return null
}

function detectarMoneda(texto) {
  if (/D[OÓ]LARES|US\$|\bUSD\b/i.test(texto)) return 'USD'
  return 'PEN'
}

/** Razón social del emisor: las líneas justo encima del RUC emisor. */
function detectarRazonSocial(lineas, rucEmisor) {
  let idx = rucEmisor ? lineas.findIndex((l) => l.includes(rucEmisor)) : -1
  const partes = []
  if (idx > 0) {
    // si el RUC viene en la misma línea que el nombre («RUC: … NOMBRE»), se ignora: se mira hacia arriba
    let i = idx - 1
    // saltar líneas de encabezado entre el nombre y el RUC (p. ej. «FACTURA ELECTRÓNICA»)
    while (i >= 0 && NO_ES_NOMBRE.test(lineas[i]) && !/[A-Z]{3,}.*\s{3}(FACTURA|BOLETA)/i.test(lineas[i])) i--
    while (i >= 0 && partes.length < 2) {
      let l = lineas[i].split(/\s{3,}(?=FACTURA|BOLETA)/i)[0]
      l = limpiarLinea(l)
      if (!l || NO_ES_NOMBRE.test(l)) break
      if (partes.length && partes[0] === l) break // nombre repetido (portal SUNAT)
      partes.unshift(l)
      // «EMPRESA DE TAXI … S.A.» completa en una línea; «AEROPUERTO SA» suelta es la 2.ª línea del nombre
      if (SUFIJO_EMPRESA.test(l) && partes.length === 1 && l.split(' ').length >= 3) break
      i--
    }
  }
  if (!partes.length) {
    // sin RUC reconocible: primera línea con aspecto de nombre
    const primera = lineas.map((l) => limpiarLinea(l.split(/\s{3,}(?=FACTURA|BOLETA)/i)[0])).find((l) => l.length >= 3 && !NO_ES_NOMBRE.test(l))
    return primera ? { razonSocial: primera, confianza: 'baja' } : null
  }
  return { razonSocial: partes.join(' '), confianza: 'media' }
}

/** Texto de los ítems (para proponer categoría y descripción). */
function detectarDetalle(lineas) {
  const ini = lineas.findIndex((l) => /DESCRIPCI[OÓ]N|ART[IÍ]CULO|CONCEPTO/i.test(l) && /CANT|UNIDAD|VALOR|P\.?\s?UNIT|IMPORTE|PRECIO/i.test(l))
  if (ini < 0) return ''
  const items = []
  for (let i = ini + 1; i < lineas.length && items.length < 6; i++) {
    const l = lineas[i]
    if (/SUB\s?TOTAL|OP\.\s|TOTAL|SON\s*:|VALOR\s+VENTA|DESCUENTOS|GRAVAD|EXONERAD|N[UÚ]MERO DE ART/i.test(l)) break
    const t = limpiarLinea(
      l.replace(/\b\d+(?:[.,]\d+)?\b/g, ' ').replace(/\b(UNIDAD|UND|NIU|ZZ|GRV)\b/gi, ' '),
    )
    if (t.length >= 3) items.push(t)
  }
  return items.join(' · ')
}

/**
 * @param {string} texto  texto del comprobante (una línea por renglón)
 * @param {{origen?: 'pdf'|'ocr'}} [opciones]
 */
export function interpretarComprobante(texto, { origen = 'pdf' } = {}) {
  const lineas = String(texto || '').split('\n').map((l) => l.replace(/\s+$/, ''))
  const plano = lineas.join('\n')
  const dudas = {}

  const rucs = rucsEnTexto(plano)
  const rucReceptor = rucs.includes(EMPRESA.ruc) ? EMPRESA.ruc : null
  const rucEmisor = rucs.find((r) => r !== EMPRESA.ruc) || null

  const sn = detectarSerieNumero(plano)
  const tipo = detectarTipo(plano, sn?.serie)
  const f = detectarFecha(plano)
  const t = detectarTotal(plano)
  const letras = importeEnLetras(plano)
  const rs = detectarRazonSocial(lineas, rucEmisor)

  let total = t?.total ?? null
  if (letras) {
    if (total === null) {
      total = letras.centimos
      dudas.total = 'Tomado del importe en letras; confírmalo.'
    } else if (letras.centimos !== total) {
      const leido = (total / 100).toFixed(2)
      const enLetras = (letras.centimos / 100).toFixed(2)
      // si el importe en letras también aparece como número en el comprobante, es el más confiable
      const todos = lineas.flatMap(montosEnLinea)
      if (todos.includes(letras.centimos)) {
        total = letras.centimos
        dudas.total = `Se tomó ${enLetras} (coincide con el importe en letras); la línea «Total» decía ${leido}.`
      } else {
        dudas.total = `El número (${leido}) no coincide con el importe en letras (${enLetras}).`
      }
    }
  }

  const noEsComprobante = !sn && !tipo && EVIDENCIA_NO_COMPROBANTE.test(plano)

  if (!noEsComprobante) {
    if (!rucEmisor) dudas.rucEmisor = 'No se encontró un RUC válido del emisor.'
    if (!sn) dudas.documento = 'No se encontró la serie y número.'
    else if (sn.confianza !== 'alta') dudas.documento = 'Serie y número poco claros; revísalos.'
    if (!f) dudas.fecha = 'No se encontró la fecha de emisión.'
    if (total === null) dudas.total = 'No se encontró el importe total.'
    if (!rs || rs.confianza === 'baja') dudas.razonSocial = 'Razón social dudosa; revísala.'
    if (!tipo) dudas.tipo = 'No se reconoce el tipo de comprobante.'
    if (origen === 'ocr') {
      for (const c of ['documento', 'fecha', 'total']) dudas[c] ??= 'Leído por OCR; confírmalo.'
    }
  }

  return {
    esComprobante: !noEsComprobante,
    tipo: noEsComprobante ? 'evidencia' : tipo,
    serie: sn?.serie ?? '',
    numero: sn?.numero ?? '',
    documento: sn ? [sn.serie, sn.numero].filter(Boolean).join('-') : '',
    fecha: f?.fecha ?? '',
    rucEmisor: rucEmisor ?? '',
    razonSocial: rs?.razonSocial ?? '',
    rucReceptor: rucReceptor ?? '',
    total,
    igv: detectarIgv(plano),
    moneda: letras?.moneda ?? detectarMoneda(plano),
    detalle: detectarDetalle(lineas),
    origen,
    dudas,
  }
}
