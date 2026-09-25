import { describe, expect, it } from 'vitest'
import { seleccionar } from '../src/reglas/seleccion.js'

const c = (id, monto) => ({ id, monto, tipo: 'comprobante' })
const p = (id, monto) => ({ id, monto, tipo: 'planilla' })

// Rendición real Boroo - Zaranda (montos en céntimos)
const boroo = [
  c('FA01-00034972', 3000), c('E001-605', 2000), c('0003-1885', 1200),
  c('F023-00002781', 2850), c('E001-9951', 8000), c('E001-15', 3360),
  p('planilla-02/03', 9000), p('planilla-05/03', 1800), p('planilla-06/03', 5000),
]

describe('selección óptima', () => {
  it('Boroo: todos los comprobantes + solo la planilla más chica que alcanza', () => {
    const r = seleccionar(boroo, { presupuesto: 25000, excesoMaximo: 5000 })
    expect(r.total).toBe(25410)
    expect(r.exceso).toBe(410)
    expect(r.diferencia).toBe(-410) // a favor del trabajador
    expect(r.cubre).toBe(true)
    expect(r.dentroDelMaximo).toBe(true)
    expect(r.montoPlanillas).toBe(5000)
    expect([...r.ids].filter((id) => id.startsWith('planilla'))).toEqual(['planilla-06/03'])
  })

  it('prefiere comprobantes aunque una planilla daría menos exceso', () => {
    // 100 exacto con planilla, 105 solo con comprobantes → gana la de comprobantes
    const r = seleccionar([c('a', 6000), c('b', 4500), p('x', 4000)], { presupuesto: 10000, excesoMaximo: 1000 })
    expect([...r.ids].sort()).toEqual(['a', 'b'])
    expect(r.exceso).toBe(500)
  })

  it('con comprobantes que alcanzan, elige la combinación de menor exceso', () => {
    const r = seleccionar([c('a', 4400), c('b', 1400), c('d', 3300), c('e', 3000)], { presupuesto: 12000, excesoMaximo: 5000 })
    // 44 + 33 + 30 = 107 < 120; 44 + 14 + 33 + 30 = 121 → exceso 1.00
    expect(r.total).toBe(12100)
    const r2 = seleccionar([c('a', 4400), c('b', 1400), c('d', 3300), c('e', 3000), c('f', 7700)], { presupuesto: 12000, excesoMaximo: 5000 })
    expect(r2.total).toBe(12100) // 44 + 77 = 121 o 44+14+33+30 = 121
  })

  it('suma exacta cuando existe', () => {
    const r = seleccionar([c('a', 3480), c('b', 4060), c('d', 2500), c('e', 1000)], { presupuesto: 10040, excesoMaximo: 2000 })
    expect(r.exceso).toBe(0)
    expect(r.diferencia).toBe(0)
  })

  it('si nada alcanza, usa todo y queda saldo a devolver', () => {
    const r = seleccionar([c('a', 3000), p('x', 2000)], { presupuesto: 10000, excesoMaximo: 1000 })
    expect(r.total).toBe(5000)
    expect(r.cubre).toBe(false)
    expect(r.diferencia).toBe(5000) // a devolver
  })

  it('si todo pasa el exceso máximo, elige el menor exceso y lo marca', () => {
    const r = seleccionar([c('a', 20000), c('b', 30000)], { presupuesto: 10000, excesoMaximo: 1000 })
    expect(r.total).toBe(20000)
    expect(r.dentroDelMaximo).toBe(false)
  })

  it('respeta lo forzado por el usuario', () => {
    const r = seleccionar(boroo, { presupuesto: 25000, excesoMaximo: 5000, forzados: { 'planilla-02/03': 'si', 'E001-9951': 'no' } })
    expect(r.ids.has('planilla-02/03')).toBe(true)
    expect(r.ids.has('E001-9951')).toBe(false)
    expect(r.total).toBeGreaterThanOrEqual(25000)
  })

  it('aguanta muchos comprobantes (60) sin demorar', () => {
    const muchos = Array.from({ length: 60 }, (_, i) => c(`c${i}`, 1000 + ((i * 7919) % 9000)))
    const t0 = performance.now()
    const r = seleccionar(muchos, { presupuesto: 150000, excesoMaximo: 5000 })
    expect(performance.now() - t0).toBeLessThan(2000)
    expect(r.cubre).toBe(true)
    const sumaElegidos = muchos.filter((x) => r.ids.has(x.id)).reduce((s, x) => s + x.monto, 0)
    expect(sumaElegidos).toBe(r.total)
  })
})
