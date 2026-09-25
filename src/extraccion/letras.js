// Lee el importe escrito en letras («SON: VEINTIOCHO Y 50/100 SOLES») y lo devuelve en céntimos.
// Sirve para confirmar el total cuando el número salió dudoso (sobre todo en OCR).

const UNIDADES = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
}

function sinTildes(t) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** "treinta y tres" → 33 · "mil doscientos" → 1200. Devuelve null si hay palabras desconocidas. */
export function palabrasANumero(texto) {
  const palabras = sinTildes(texto.toLowerCase()).split(/[\s-]+/).filter((p) => p && p !== 'y')
  if (!palabras.length) return null
  let total = 0
  let grupo = 0
  for (const p of palabras) {
    if (p === 'mil') {
      total += (grupo || 1) * 1000
      grupo = 0
    } else if (p in UNIDADES) {
      grupo += UNIDADES[p]
    } else {
      return null
    }
  }
  return total + grupo
}

/** Busca «SON: … Y NN/100 SOLES|DÓLARES» y devuelve { centimos, moneda } o null. */
export function importeEnLetras(texto) {
  const t = sinTildes(String(texto))
  const m = /\bSON\s*:?\s*([A-Za-z\s-]+?)\s+(?:Y|CON)\s+(\d{2})\s*\/\s*100\s+(SOLES|DOLARES|NUEVOS SOLES)/i.exec(t)
  if (!m) return null
  const entero = palabrasANumero(m[1])
  if (entero === null) return null
  return {
    centimos: entero * 100 + Number(m[2]),
    moneda: /DOLARES/i.test(m[3]) ? 'USD' : 'PEN',
  }
}
