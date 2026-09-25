import { describe, expect, it } from 'vitest'
import {
  agruparPorDia,
  alertasGasto,
  alertasPlanilla,
  descripcionPlanilla,
  destinoPlanilla,
  gastoVacio,
  nombrePlanilla,
  planillaCompleta,
} from '../src/reglas/movilidad.js'
import { TRABAJADOR_VACIO } from '../src/reglas/viaje.js'

const viaje = { fechaSalida: '2026-03-02', fechaRetorno: '2026-03-06' }
const trabajador = { ...TRABAJADOR_VACIO } // RMV 1130, 4 % → S/ 45.20

const g = (campos) => ({ ...gastoVacio(), ...campos })

// Los tres días sin comprobante de la rendición Boroo
const boroo = [
  g({ fecha: '2026-03-02', origen: 'San Juan de Lurigancho', destino: 'Aeropuerto Internacional Jorge Chávez', monto: 9000, evidencias: ['yape', 'app'] }),
  g({ fecha: '2026-03-05', categoria: 'alimentacion', motivo: 'Consumo de Alimentos - Cena', destino: 'Ruta Mina Boroo - Trujillo', monto: 1800 }),
  g({ fecha: '2026-03-06', origen: 'Hotel', destino: 'Aeropuerto de Trujillo', monto: 5000 }),
]

describe('planilla de movilidad', () => {
  it('una planilla por día, numeradas por fecha', () => {
    const ps = agruparPorDia([boroo[2], boroo[0], boroo[1]])
    expect(ps.map((p) => [p.fecha, p.numero, p.total])).toEqual([
      ['2026-03-02', 1, 9000],
      ['2026-03-05', 2, 1800],
      ['2026-03-06', 3, 5000],
    ])
    expect(ps[0].evidencias).toEqual(['yape', 'app'])
    expect(nombrePlanilla(ps[1].numero)).toBe('Planilla N° 002')
  })

  it('suma varias líneas del mismo día', () => {
    const ps = agruparPorDia([g({ fecha: '2026-03-01', monto: 1800 }), g({ fecha: '2026-03-01', monto: 1200 })])
    expect(ps).toHaveLength(1)
    expect(ps[0].total).toBe(3000)
  })

  it('Destino = «Origen - Destino»', () => {
    expect(destinoPlanilla(boroo[0])).toBe('San Juan de Lurigancho - Aeropuerto Internacional Jorge Chávez')
    expect(destinoPlanilla(boroo[1])).toBe('Ruta Mina Boroo - Trujillo')
  })

  it('tope diario: alerta (no bloqueo) cuando el día supera el 4 % de la RMV', () => {
    const [d1, d2, d3] = agruparPorDia(boroo)
    const a1 = alertasPlanilla(d1, viaje, trabajador)
    expect(a1).toHaveLength(1)
    expect(a1[0].mensaje).toContain('S/ 45.20')
    expect(a1[0].mensaje).toContain('S/ 44.80')
    expect(alertasPlanilla(d2, viaje, trabajador)).toEqual([])
    expect(alertasPlanilla(d3, viaje, trabajador)).toHaveLength(1) // 50.00 > 45.20
    expect(planillaCompleta(d1)).toBe(true)
  })

  it('el tope sigue la RMV configurada', () => {
    const [, , d3] = agruparPorDia(boroo)
    expect(alertasPlanilla(d3, viaje, { ...trabajador, rmv: 1300 })).toEqual([]) // tope 52.00
  })

  it('descripción para la hoja de rendición', () => {
    const [d1, d2] = agruparPorDia(boroo)
    expect(descripcionPlanilla(d1)).toBe('SERVICIO DE TAXI')
    expect(descripcionPlanilla(d2)).toBe('CONSUMO DE ALIMENTOS')
  })

  it('alertas de cada línea', () => {
    expect(alertasGasto(boroo[0], viaje)).toEqual([])
    const a = alertasGasto(g({ fecha: '2026-03-10', monto: null, destino: '' }), viaje)
    expect(a.map((x) => x.mensaje).join(' ')).toMatch(/fuera del viaje.*monto.*destino/)
    expect(planillaCompleta(agruparPorDia([g({ fecha: '2026-03-03', monto: null, destino: 'X' })])[0])).toBe(false)
  })
})
