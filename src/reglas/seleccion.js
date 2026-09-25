// Selección óptima de comprobantes y planillas para cubrir el monto recibido.
//
// Criterio, en este orden:
//   1. cubrir el monto recibido;
//   2. no pasar el exceso máximo aceptado;
//   3. usar el MENOR monto posible en planillas (la empresa prefiere facturas y boletas);
//   4. exceder el presupuesto por el menor margen posible;
//   5. usar menos planillas.
// Si nada cubre el monto, se usa todo (queda saldo a devolver). Si todo lo que cubre pasa el exceso
// máximo, se elige el de menor exceso y se avisa.
//
// Método: suma de subconjuntos exacta en céntimos sobre los comprobantes (tabla de sumas alcanzables),
// combinada con cada subconjunto de planillas (son pocas: una por día).

const MAX_CENTIMOS_DP = 3_000_000 // S/ 30,000: por encima se usa un método aproximado
const MAX_PLANILLAS_EXACTO = 12

/**
 * @typedef {{id: string, monto: number, tipo: 'comprobante'|'planilla'}} Candidato
 * @param {Candidato[]} candidatos montos en céntimos (> 0)
 * @param {{presupuesto: number, excesoMaximo: number, forzados?: Record<string, 'si'|'no'>}} opciones
 */
export function seleccionar(candidatos, { presupuesto, excesoMaximo, forzados = {} }) {
  const validos = candidatos.filter((c) => Number.isInteger(c.monto) && c.monto > 0)
  const fijos = validos.filter((c) => forzados[c.id] === 'si')
  const libres = validos.filter((c) => !forzados[c.id])
  const libresC = libres.filter((c) => c.tipo === 'comprobante')
  const libresP = libres.filter((c) => c.tipo === 'planilla')

  const sumaFijos = suma(fijos)
  const planillaFija = suma(fijos.filter((c) => c.tipo === 'planilla'))
  const objetivo = presupuesto - sumaFijos

  const combinar = sumasAlcanzables(libresC)
  const subconjuntosP = subconjuntosPlanillas(libresP)

  let mejor = null
  for (const sp of subconjuntosP) {
    const p = suma(sp)
    const r = combinar(Math.max(0, objetivo - p))
    const total = sumaFijos + p + r.suma
    const cand = {
      elegidos: [...fijos, ...sp, ...r.items],
      total,
      exceso: total - presupuesto,
      montoPlanillas: planillaFija + p,
      nPlanillas: sp.length,
    }
    if (!mejor || mejorQue(cand, mejor, excesoMaximo)) mejor = cand
  }

  const ids = new Set(mejor.elegidos.map((c) => c.id))
  return {
    ids,
    total: mejor.total,
    exceso: mejor.exceso,
    diferencia: presupuesto - mejor.total, // > 0: a devolver por el trabajador · < 0: a favor del trabajador
    cubre: mejor.exceso >= 0,
    dentroDelMaximo: mejor.exceso >= 0 && mejor.exceso <= excesoMaximo,
    montoPlanillas: mejor.montoPlanillas,
  }
}

function suma(lista) {
  return lista.reduce((s, c) => s + c.monto, 0)
}

function mejorQue(a, b, max) {
  const cubreA = a.exceso >= 0
  const cubreB = b.exceso >= 0
  if (cubreA !== cubreB) return cubreA
  if (!cubreA) return a.total > b.total // ninguno cubre: el que más se acerque
  const dentroA = a.exceso <= max
  const dentroB = b.exceso <= max
  if (dentroA !== dentroB) return dentroA
  if (!dentroA) return a.exceso < b.exceso || (a.exceso === b.exceso && a.montoPlanillas < b.montoPlanillas)
  if (a.montoPlanillas !== b.montoPlanillas) return a.montoPlanillas < b.montoPlanillas
  if (a.exceso !== b.exceso) return a.exceso < b.exceso
  return a.nPlanillas < b.nPlanillas
}

/** Todos los subconjuntos de planillas (o una aproximación si son demasiadas). */
function subconjuntosPlanillas(ps) {
  if (ps.length <= MAX_PLANILLAS_EXACTO) {
    const out = []
    for (let m = 0; m < 1 << ps.length; m++) out.push(ps.filter((_, i) => m & (1 << i)))
    return out
  }
  // muchas planillas: ninguna, cada una sola, y las más chicas acumuladas
  const orden = [...ps].sort((a, b) => a.monto - b.monto)
  const out = [[]]
  for (const p of orden) out.push([p])
  for (let k = 2; k <= orden.length; k++) out.push(orden.slice(0, k))
  return out
}

/**
 * Prepara la búsqueda sobre los comprobantes y devuelve una función que, para un mínimo `x`,
 * entrega el subconjunto de suma más chica ≥ x (o todos, si ninguno llega).
 */
function sumasAlcanzables(items) {
  const total = suma(items)
  const todos = { suma: total, items }
  if (!items.length) return () => ({ suma: 0, items: [] })

  if (total > MAX_CENTIMOS_DP) {
    // aproximación voraz para montos enormes
    const orden = [...items].sort((a, b) => b.monto - a.monto)
    return (x) => {
      if (x <= 0) return { suma: 0, items: [] }
      if (x > total) return todos
      const elegidos = []
      let s = 0
      for (const it of orden) if (s < x) { elegidos.push(it); s += it.monto }
      return { suma: s, items: elegidos }
    }
  }

  // alcanzable[i][s]: ¿se llega a s usando los primeros i comprobantes? (bits)
  const palabras = (total >> 5) + 1
  const capas = [new Uint32Array(palabras)]
  capas[0][0] = 1
  for (const it of items) {
    const prev = capas[capas.length - 1]
    const sig = prev.slice()
    const w = it.monto
    const salto = w >> 5
    const bits = w & 31
    // sig |= prev << w
    for (let j = palabras - 1; j >= salto; j--) {
      let v = prev[j - salto] << bits
      if (bits && j - salto - 1 >= 0) v |= prev[j - salto - 1] >>> (32 - bits)
      sig[j] |= v
    }
    capas.push(sig)
  }
  const final = capas[capas.length - 1]
  const tiene = (capa, s) => (capa[s >> 5] >>> (s & 31)) & 1

  // siguiente suma alcanzable ≥ x
  const siguiente = new Int32Array(total + 2).fill(-1)
  for (let s = total; s >= 0; s--) siguiente[s] = tiene(final, s) ? s : siguiente[s + 1]

  return (x) => {
    if (x <= 0) return { suma: 0, items: [] }
    if (x > total) return todos
    const objetivo = siguiente[x]
    // reconstruir: de atrás hacia adelante, si la suma ya era alcanzable sin el ítem, no se usa
    const elegidos = []
    let s = objetivo
    for (let i = items.length; i > 0 && s > 0; i--) {
      if (tiene(capas[i - 1], s)) continue
      elegidos.push(items[i - 1])
      s -= items[i - 1].monto
    }
    return { suma: objetivo, items: elegidos.reverse() }
  }
}
