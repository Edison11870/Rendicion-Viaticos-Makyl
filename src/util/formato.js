// Formato de montos y fechas como los usa la rendición (Perú: dd/mm/aaaa, S/ con 2 decimales).

/** Convierte texto o número a céntimos enteros (evita errores de coma flotante al sumar). */
export function aCentimos(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'number') return Number.isFinite(valor) ? Math.round(valor * 100) : null
  let t = String(valor).replace(/s\/\.?|soles|\s/gi, '')
  if (!t) return null
  // "1.234,56" → 1234.56 · "1,234.56" → 1234.56 · "12,50" → 12.50
  const ultComa = t.lastIndexOf(',')
  const ultPunto = t.lastIndexOf('.')
  if (ultComa > ultPunto) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(/,/g, '')
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null
  return Math.round(parseFloat(t) * 100)
}

/** 12345 → "123.45" */
export function centimosATexto(c) {
  if (c === null || c === undefined) return ''
  const signo = c < 0 ? '-' : ''
  const abs = Math.abs(c)
  const enteros = Math.floor(abs / 100).toLocaleString('en-US')
  return `${signo}${enteros}.${String(abs % 100).padStart(2, '0')}`
}

/** 25000 → "S/ 250.00" */
export function soles(c) {
  if (c === null || c === undefined) return '—'
  return `S/ ${centimosATexto(c)}`
}

/** "2026-03-02" → "02/03/2026" */
export function isoADmy(iso) {
  if (!iso) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

/** "02/03/2026", "2/3/26", "2026-03-02", "02-03-2026" → "2026-03-02" (o null si no es fecha válida) */
export function aIso(texto) {
  if (!texto) return null
  const t = String(texto).trim()
  let a, m, d
  let r = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(t)
  if (r) [a, m, d] = [r[1], r[2], r[3]]
  else {
    r = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(t)
    if (!r) return null
    ;[d, m, a] = [r[1], r[2], r[3]]
    if (a.length === 2) a = `20${a}`
  }
  const f = new Date(Date.UTC(+a, +m - 1, +d))
  if (f.getUTCFullYear() !== +a || f.getUTCMonth() !== +m - 1 || f.getUTCDate() !== +d) return null
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Fecha de hoy en hora local, "aaaa-mm-dd". */
export function hoyIso(ahora = new Date()) {
  const y = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
