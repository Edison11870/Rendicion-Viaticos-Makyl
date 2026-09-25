import { describe, expect, it } from 'vitest'
import { aCentimos, aIso, centimosATexto, isoADmy, soles } from '../src/util/formato.js'

describe('montos', () => {
  it('lee montos como se escriben en los comprobantes', () => {
    expect(aCentimos('30.00')).toBe(3000)
    expect(aCentimos('S/ 28.50')).toBe(2850)
    expect(aCentimos('s/250')).toBe(25000)
    expect(aCentimos('1,234.56')).toBe(123456)
    expect(aCentimos('1.234,56')).toBe(123456)
    expect(aCentimos('12,5')).toBe(1250)
    expect(aCentimos(33.6)).toBe(3360)
    expect(aCentimos('')).toBeNull()
    expect(aCentimos('abc')).toBeNull()
  })

  it('suma sin errores de redondeo (total de la rendición Boroo = 362.10)', () => {
    const montos = ['30.00', '20.00', '12.00', '28.50', '80.00', '33.60', '90.00', '18.00', '50.00']
    const total = montos.map(aCentimos).reduce((a, b) => a + b, 0)
    expect(total).toBe(36210)
    expect(soles(total)).toBe('S/ 362.10')
  })

  it('formatea con miles y dos decimales', () => {
    expect(centimosATexto(123456)).toBe('1,234.56')
    expect(centimosATexto(-500)).toBe('-5.00')
    expect(soles(null)).toBe('—')
  })
})

describe('fechas', () => {
  it('convierte los formatos que aparecen en los comprobantes', () => {
    expect(aIso('02/03/2026')).toBe('2026-03-02')
    expect(aIso('16-03-2026')).toBe('2026-03-16')
    expect(aIso('2026-03-02')).toBe('2026-03-02')
    expect(aIso('2/3/26')).toBe('2026-03-02')
    expect(aIso('31/02/2026')).toBeNull()
    expect(aIso('hola')).toBeNull()
  })

  it('muestra dd/mm/aaaa', () => {
    expect(isoADmy('2026-03-21')).toBe('21/03/2026')
    expect(isoADmy('')).toBe('')
  })
})
