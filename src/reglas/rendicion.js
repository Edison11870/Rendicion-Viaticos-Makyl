// Une todo: qué entra a la selección y cómo quedan las filas de la hoja de rendición.
import { agruparPorDia, descripcionPlanilla, nombrePlanilla, planillaCompleta } from './movilidad.js'
import { seleccionar } from './seleccion.js'
import { alertasComprobante, estadoRevision } from './validacion.js'
import { aCentimos } from '../util/formato.js'

/** Comprobantes válidos (confirmados y decididos) y planillas completas. */
export function candidatosRendicion(lista, gastos, viaje) {
  const comprobantes = []
  const dolares = []
  for (const c of lista) {
    if (!c.campos?.esComprobante) continue
    if (estadoRevision(c, alertasComprobante(c, viaje, lista)) !== 'valido') continue
    const item = { id: c.id, tipo: 'comprobante', monto: c.campos.total, fecha: c.campos.fecha, c }
    ;(c.campos.moneda === 'USD' ? dolares : comprobantes).push(item)
  }
  const planillas = agruparPorDia(gastos)
    .filter(planillaCompleta)
    .map((p) => ({ id: p.id, tipo: 'planilla', monto: p.total, fecha: p.fecha, p }))
  return { comprobantes, planillas, dolares }
}

/** Ejecuta la selección con los parámetros del viaje y del trabajador. */
export function armarSeleccion(cand, viaje, trabajador, forzados = {}) {
  const presupuesto = aCentimos(viaje.montoRecibido) || 0
  const excesoMaximo = aCentimos(trabajador.excesoMaximo) ?? 0
  const r = seleccionar([...cand.comprobantes, ...cand.planillas], { presupuesto, excesoMaximo, forzados })
  return { ...r, presupuesto, excesoMaximo }
}

/**
 * Filas de la hoja en el orden de la empresa: comprobantes por fecha, luego planillas por fecha
 * (numeradas 001, 002… solo entre las que entran). Los comprobantes en dólares forzados a entrar
 * van en la columna Dólares.
 */
export function filasRendicion(cand, ids, forzados = {}) {
  const porFecha = (a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.c?.campos.documento || '').localeCompare(b.c?.campos.documento || '')
  const comps = cand.comprobantes.filter((x) => ids.has(x.id)).sort(porFecha)
  const usd = cand.dolares.filter((x) => forzados[x.id] === 'si').sort(porFecha)
  const plans = cand.planillas.filter((x) => ids.has(x.id)).sort(porFecha)

  const filas = [...comps, ...usd].sort(porFecha).map((x) => ({
    id: x.id,
    tipo: 'comprobante',
    fecha: x.c.campos.fecha,
    documento: x.c.campos.documento,
    descripcion: x.c.clasificacion?.descripcion || '',
    soles: x.c.campos.moneda === 'USD' ? null : x.c.campos.total,
    dolares: x.c.campos.moneda === 'USD' ? x.c.campos.total : null,
    comprobante: x.c,
  }))
  plans.forEach((x, i) => {
    filas.push({
      id: x.id,
      tipo: 'planilla',
      numero: i + 1,
      fecha: x.p.fecha,
      documento: nombrePlanilla(i + 1),
      descripcion: descripcionPlanilla(x.p),
      soles: x.p.total,
      dolares: null,
      planilla: { ...x.p, numero: i + 1 },
    })
  })
  return filas
}

/** Texto del saldo para la pantalla y el Excel. */
export function textoSaldo(diferencia) {
  if (diferencia > 0) return 'a devolver por el trabajador'
  if (diferencia < 0) return 'a favor del trabajador'
  return 'sin saldo'
}
