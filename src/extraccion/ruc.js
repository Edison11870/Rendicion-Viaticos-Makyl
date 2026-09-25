// RUC peruano: 11 dígitos; el último es un dígito verificador (módulo 11, pesos 5-4-3-2-7-6-5-4-3-2).
const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
const PREFIJOS = ['10', '15', '16', '17', '20']

export function rucValido(ruc) {
  const r = String(ruc || '').trim()
  if (!/^\d{11}$/.test(r) || !PREFIJOS.includes(r.slice(0, 2))) return false
  const suma = PESOS.reduce((s, p, i) => s + p * Number(r[i]), 0)
  let dv = 11 - (suma % 11)
  if (dv === 10) dv = 0
  else if (dv === 11) dv = 1
  return dv === Number(r[10])
}

/** Todos los RUC válidos del texto, en orden de aparición y sin repetir. */
export function rucsEnTexto(texto) {
  const vistos = []
  for (const m of String(texto).matchAll(/(?<!\d)(\d{11})(?!\d)/g)) {
    if (rucValido(m[1]) && !vistos.includes(m[1])) vistos.push(m[1])
  }
  return vistos
}

/** Completa los 10 primeros dígitos con el verificador correcto (útil para datos de prueba). */
export function conVerificador(diezDigitos) {
  const suma = PESOS.reduce((s, p, i) => s + p * Number(diezDigitos[i]), 0)
  let dv = 11 - (suma % 11)
  if (dv === 10) dv = 0
  else if (dv === 11) dv = 1
  return `${diezDigitos}${dv}`
}
