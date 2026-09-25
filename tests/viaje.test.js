import { describe, expect, it } from 'vitest'
import {
  TRABAJADOR_VACIO,
  diasViaje,
  nombrePlanilla,
  nombreRendicion,
  topeDiarioMovilidad,
  validarTrabajador,
  validarViaje,
  viajeVacio,
} from '../src/reglas/viaje.js'

const trabajador = {
  ...TRABAJADOR_VACIO,
  nombres: 'Juan Carlos',
  apellidos: 'Quispe Rojas',
  dni: '12345678',
  recibeAdministracion: 'Administración',
}

const viaje = {
  ...viajeVacio(),
  proyecto: 'Boroo - Zaranda',
  fechaSalida: '2026-03-02',
  fechaRetorno: '2026-03-06',
  montoRecibido: '250',
  fechaEntrega: '2026-02-28',
  fechaRendicion: '2026-03-21',
}

describe('trabajador', () => {
  it('arma el nombre en el orden de cada formato', () => {
    expect(nombreRendicion(trabajador)).toBe('Quispe Rojas Juan Carlos')
    expect(nombrePlanilla(trabajador)).toBe('Juan Carlos Quispe Rojas')
  })

  it('exige DNI de 8 dígitos', () => {
    expect(validarTrabajador(trabajador)).toEqual({})
    expect(validarTrabajador({ ...trabajador, dni: '1234' }).dni).toBeDefined()
  })

  it('tope diario = 4 % de la RMV (S/ 1,130 → S/ 45.20)', () => {
    expect(topeDiarioMovilidad(trabajador)).toBe(4520)
    expect(topeDiarioMovilidad({ ...trabajador, rmv: 1200 })).toBe(4800)
  })
})

describe('viaje', () => {
  it('acepta un viaje completo', () => {
    expect(validarViaje(viaje)).toEqual({})
    expect(diasViaje(viaje)).toBe(5)
  })

  it('rechaza retorno antes de la salida y monto vacío', () => {
    const e = validarViaje({ ...viaje, fechaRetorno: '2026-03-01', montoRecibido: '' })
    expect(e.fechaRetorno).toBeDefined()
    expect(e.montoRecibido).toBeDefined()
  })

  it('pide número de cheque si la entrega fue con cheque', () => {
    expect(validarViaje({ ...viaje, formaEntrega: 'cheque' }).chequeNumero).toBeDefined()
    expect(validarViaje({ ...viaje, formaEntrega: 'cheque', chequeNumero: '00123' })).toEqual({})
  })
})
