// Gastos sin comprobante → Planilla de Movilidad Diaria (una planilla por día).
// Puro: sin interfaz. El tope diario (4 % de la RMV, configurable) es una ALERTA, no un bloqueo.
import { isoADmy, soles } from '../util/formato.js'
import { nuevoId } from './comprobantes.js'
import { topeDiarioMovilidad } from './viaje.js'

export const CATEGORIAS_PLANILLA = [
  { valor: 'movilidad', etiqueta: 'Movilidad (taxi, colectivo…)', motivo: 'Servicio de Taxi', descripcion: 'SERVICIO DE TAXI' },
  { valor: 'alimentacion', etiqueta: 'Alimentación', motivo: 'Consumo de Alimentos', descripcion: 'CONSUMO DE ALIMENTOS' },
]

export function gastoVacio(fecha = '') {
  return {
    id: nuevoId(),
    fecha,
    categoria: 'movilidad',
    motivo: 'Servicio de Taxi',
    origen: '',
    destino: '',
    monto: null, // céntimos
    evidencias: [], // ids de comprobantes de tipo «evidencia» (Yape, app de taxi…)
  }
}

/** Lo que va en la columna «Destino» de la planilla: «Origen - Destino». */
export function destinoPlanilla(g) {
  const o = (g.origen || '').trim()
  const d = (g.destino || '').trim()
  return o && d ? `${o} - ${d}` : d || o
}

export function alertasGasto(g, viaje) {
  const a = []
  if (!g.fecha) a.push({ nivel: 'error', mensaje: 'Falta la fecha.' })
  else if (viaje.fechaSalida && viaje.fechaRetorno && (g.fecha < viaje.fechaSalida || g.fecha > viaje.fechaRetorno))
    a.push({ nivel: 'aviso', mensaje: `Fecha ${isoADmy(g.fecha)} fuera del viaje.` })
  if (!(g.monto > 0)) a.push({ nivel: 'error', mensaje: 'Falta el monto.' })
  if (!g.motivo?.trim()) a.push({ nivel: 'error', mensaje: 'Falta el motivo.' })
  if (!destinoPlanilla(g)) a.push({ nivel: 'error', mensaje: 'Falta el destino (o el recorrido).' })
  if (g.categoria === 'movilidad' && (!g.origen?.trim() || !g.destino?.trim()))
    a.push({ nivel: 'aviso', mensaje: 'Indica origen y destino del recorrido.' })
  if (!g.evidencias?.length) a.push({ nivel: 'info', mensaje: 'Sin evidencia (captura de Yape, app de taxi…).' })
  return a
}

/** Una planilla por día, ordenadas por fecha. Numeración provisional 001, 002… */
export function agruparPorDia(gastos) {
  const porDia = new Map()
  for (const g of gastos) {
    if (!g.fecha) continue
    if (!porDia.has(g.fecha)) porDia.set(g.fecha, [])
    porDia.get(g.fecha).push(g)
  }
  return [...porDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, lineas], i) => ({
      id: `planilla-${fecha}`,
      fecha,
      numero: i + 1,
      lineas,
      total: lineas.reduce((s, g) => s + (g.monto || 0), 0),
      evidencias: [...new Set(lineas.flatMap((g) => g.evidencias || []))],
    }))
}

/** «Planilla N° 001» */
export function nombrePlanilla(numero) {
  return `Planilla N° ${String(numero).padStart(3, '0')}`
}

/** Descripción de la planilla en la hoja de rendición («SERVICIO DE TAXI», «CONSUMO DE ALIMENTOS»…). */
export function descripcionPlanilla(p) {
  const cats = new Set(p.lineas.map((g) => g.categoria))
  if (cats.size === 1) {
    const cat = CATEGORIAS_PLANILLA.find((c) => c.valor === [...cats][0])
    if (cat) return cat.descripcion
  }
  return (p.lineas[0]?.motivo || 'MOVILIDAD').toUpperCase()
}

export function alertasPlanilla(p, viaje, trabajador) {
  const a = []
  const tope = topeDiarioMovilidad(trabajador)
  if (tope > 0 && p.total > tope) {
    a.push({
      nivel: 'aviso',
      mensaje: `El día suma ${soles(p.total)} y supera el tope diario de ${soles(tope)} (${trabajador.topeMovilidadPct} % de la RMV) por ${soles(p.total - tope)}.`,
    })
  }
  if (viaje.fechaSalida && viaje.fechaRetorno && (p.fecha < viaje.fechaSalida || p.fecha > viaje.fechaRetorno))
    a.push({ nivel: 'aviso', mensaje: `Día ${isoADmy(p.fecha)} fuera del viaje.` })
  if (p.lineas.some((g) => !(g.monto > 0) || !g.motivo?.trim() || !destinoPlanilla(g)))
    a.push({ nivel: 'error', mensaje: 'Hay líneas incompletas.' })
  return a
}

/** Una planilla entra a la selección si todas sus líneas están completas. */
export function planillaCompleta(p) {
  return p.lineas.length > 0 && p.lineas.every((g) => g.monto > 0 && g.motivo?.trim() && destinoPlanilla(g))
}
