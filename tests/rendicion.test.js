import { describe, expect, it } from 'vitest'
import { conClasificacion, conLectura, nuevoComprobante } from '../src/reglas/comprobantes.js'
import { gastoVacio } from '../src/reglas/movilidad.js'
import { armarSeleccion, candidatosRendicion, filasRendicion, textoSaldo } from '../src/reglas/rendicion.js'
import { TRABAJADOR_VACIO } from '../src/reglas/viaje.js'

const viaje = { fechaSalida: '2026-03-02', fechaRetorno: '2026-03-06', montoRecibido: '250' }
const trabajador = { ...TRABAJADOR_VACIO, excesoMaximo: 50 }

let n = 0
function comp(documento, fecha, total, detalle) {
  n += 1
  const c = conLectura(nuevoComprobante({ name: `${documento}.pdf`, size: n }), {
    vista: '', texto: '', origen: 'pdf',
    campos: {
      esComprobante: true, tipo: 'factura', documento, fecha, rucEmisor: '10123456781', razonSocial: 'EMISOR',
      rucReceptor: '20523643534', total, igv: 0, moneda: 'PEN', detalle, dudas: {},
    },
  })
  return conClasificacion(c, {})
}

// Rendición Boroo (datos reales de montos y fechas; emisores ficticios)
const lista = [
  comp('E001-9951', '2026-03-06', 8000, 'SERVICIO DE TAXI AEROPUERTO'),
  comp('FA01-00034972', '2026-03-02', 3000, 'Servicio de movilidad'),
  comp('E001-605', '2026-03-02', 2000, 'CONSUMO'),
  comp('0003-1885', '2026-03-02', 1200, 'CONSUMO'),
  comp('F023-00002781', '2026-03-06', 2850, 'CAFE'),
  comp('E001-15', '2026-03-06', 3360, 'SERVICIO DE TAXI'),
]
const g = (c) => ({ ...gastoVacio(), origen: 'A', destino: 'B', ...c })
const gastos = [
  g({ fecha: '2026-03-02', monto: 9000 }),
  g({ fecha: '2026-03-05', categoria: 'alimentacion', motivo: 'Consumo de Alimentos - Cena', monto: 1800 }),
  g({ fecha: '2026-03-06', monto: 5000 }),
]

describe('filas de la hoja de rendición', () => {
  const cand = candidatosRendicion(lista, gastos, viaje)
  const sel = armarSeleccion(cand, viaje, trabajador)
  const filas = filasRendicion(cand, sel.ids)

  it('usa la selección óptima', () => {
    expect(cand.comprobantes).toHaveLength(6)
    expect(cand.planillas).toHaveLength(3)
    expect(sel.total).toBe(25410)
    expect(sel.diferencia).toBe(-410)
    expect(textoSaldo(sel.diferencia)).toBe('a favor del trabajador')
  })

  it('comprobantes en el orden en que se subieron (no por fecha) y luego planillas desde 001', () => {
    expect(filas.map((f) => [f.fecha, f.documento, f.descripcion, f.soles])).toEqual([
      ['2026-03-06', 'E001-9951', 'SERVICIO DE TAXI', 8000],
      ['2026-03-02', 'FA01-00034972', 'SERVICIO DE TAXI', 3000],
      ['2026-03-02', 'E001-605', 'CONSUMO DE ALIMENTOS', 2000],
      ['2026-03-02', '0003-1885', 'CONSUMO DE ALIMENTOS', 1200],
      ['2026-03-06', 'F023-00002781', 'CONSUMO DE ALIMENTOS', 2850],
      ['2026-03-06', 'E001-15', 'SERVICIO DE TAXI', 3360],
      ['2026-03-06', 'Planilla N° 001', 'SERVICIO DE TAXI', 5000],
    ])
    expect(filas.reduce((s, f) => s + f.soles, 0)).toBe(sel.total)
  })

  it('un comprobante en dólares forzado a entrar queda en su posición de subida', () => {
    const usd = comp('INV-77', '2026-03-03', 1500, 'SERVICIO DE TAXI')
    usd.campos = { ...usd.campos, moneda: 'USD' }
    const conUsd = [lista[0], usd, lista[1]]
    const c2 = candidatosRendicion(conUsd, [], viaje)
    const f2 = filasRendicion(c2, new Set([lista[0].id, lista[1].id]), { [usd.id]: 'si' })
    expect(f2.map((f) => [f.documento, f.soles, f.dolares])).toEqual([
      ['E001-9951', 8000, null],
      ['INV-77', null, 1500],
      ['FA01-00034972', 3000, null],
    ])
  })
})
