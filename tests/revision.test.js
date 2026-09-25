import { describe, expect, it } from 'vitest'
import { detalleComoDescripcion, proponerClasificacion } from '../src/reglas/categorias.js'
import { conCampo, conClasificacion, conDecision, conLectura, normalizarDocumento, nuevoComprobante } from '../src/reglas/comprobantes.js'
import { alertasComprobante, estadoRevision } from '../src/reglas/validacion.js'

describe('propuesta de categoría y descripción', () => {
  it('movilidad aunque el detalle mencione «hotel» después', () => {
    const p = proponerClasificacion({ detalle: 'Servicio De movilidad,Aeropuerto al Hotel', razonSocial: 'EMPRESA DE TRANSPORTES EJEMPLO SA' })
    expect(p.categoria).toBe('movilidad')
    expect(p.descripcion).toBe('SERVICIO DE TAXI')
    expect(p.alternativa).toBe('SERVICIO DE MOVILIDAD, AEROPUERTO AL HOTEL')
  })

  it('taxi con ruta: propone la estándar y ofrece la ruta como alternativa', () => {
    const p = proponerClasificacion({ detalle: 'SERVICIO DE TAXI AEROPUERTO - PLAYA LOS DELFINES' })
    expect(p).toMatchObject({ categoria: 'movilidad', descripcion: 'SERVICIO DE TAXI', alternativa: 'SERVICIO DE TAXI AEROPUERTO - PLAYA LOS DELFINES' })
  })

  it('alimentación por el detalle o, si no hay detalle, por el texto del comprobante', () => {
    expect(proponerClasificacion({ detalle: 'CONSUMO' })).toMatchObject({ categoria: 'alimentacion', descripcion: 'CONSUMO DE ALIMENTOS', alternativa: '' })
    expect(proponerClasificacion({ detalle: 'MENÚ DEL DÍA' }).categoria).toBe('alimentacion')
    const p = proponerClasificacion({ detalle: '', razonSocial: 'EJEMPLO' }, '1 CAFE CAPPUCCINO 12.00')
    expect(p.categoria).toBe('alimentacion')
    expect(p.motivo).toMatch(/comprobante/)
  })

  it('hospedaje y pasajes', () => {
    expect(proponerClasificacion({ detalle: '1 NOCHE HABITACIÓN SIMPLE' }).categoria).toBe('hospedaje')
    expect(proponerClasificacion({ detalle: 'PASAJE LIMA - HUARAZ' })).toMatchObject({ categoria: 'movilidad', descripcion: 'PASAJE TERRESTRE' })
  })

  it('sin pistas: «otros» con el detalle como descripción', () => {
    const p = proponerClasificacion({ detalle: 'Cinta métrica 5 m' })
    expect(p.categoria).toBe('otros')
    expect(p.descripcion).toBe('CINTA MÉTRICA 5 M')
  })

  it('limpia el detalle para la columna Descripción', () => {
    expect(detalleComoDescripcion('SERVICIO DE TAXI MOVIL DE SAN LUIS _ SAN · JUAN')).toBe('SERVICIO DE TAXI MOVIL DE SAN LUIS - SAN')
  })
})

describe('normalizar DOCUMENTO', () => {
  it('SERIE-NÚMERO', () => {
    expect(normalizarDocumento('e001 9951')).toBe('E001-9951')
    expect(normalizarDocumento('F023 - 00002781')).toBe('F023-00002781')
    expect(normalizarDocumento('0003 1885')).toBe('0003-1885')
  })
})

const viaje = { fechaSalida: '2026-03-02', fechaRetorno: '2026-03-06' }

function comprobante(campos, dudas = {}) {
  const c = nuevoComprobante({ name: 'x.pdf', size: 1 })
  return conLectura(c, {
    vista: '',
    texto: '',
    origen: 'pdf',
    campos: {
      esComprobante: true,
      tipo: 'factura',
      documento: 'E001-100',
      fecha: '2026-03-03',
      rucEmisor: '10123456781',
      razonSocial: 'PEREZ QUISPE JUAN CARLOS',
      rucReceptor: '20523643534',
      total: 3480,
      igv: 0,
      moneda: 'PEN',
      detalle: 'SERVICIO DE TAXI',
      ...campos,
      dudas,
    },
  })
}

describe('alertas', () => {
  it('comprobante correcto: sin alertas', () => {
    expect(alertasComprobante(comprobante({}), viaje)).toEqual([])
  })

  it('fecha fuera del viaje', () => {
    const a = alertasComprobante(comprobante({ fecha: '2026-02-21' }), viaje)
    expect(a).toEqual([expect.objectContaining({ nivel: 'aviso', campo: 'fecha' })])
    expect(a[0].mensaje).toContain('21/02/2026')
  })

  it('datos incompletos y RUC inválido', () => {
    const a = alertasComprobante(comprobante({ documento: '', total: null, rucEmisor: '10123456789' }), viaje)
    expect(a.find((x) => x.campo === 'datos').mensaje).toMatch(/serie-número.*total/)
    expect(a.some((x) => x.campo === 'rucEmisor')).toBe(true)
  })

  it('factura no emitida a MAKYL', () => {
    expect(alertasComprobante(comprobante({ rucReceptor: '' }), viaje).some((x) => x.campo === 'receptor')).toBe(true)
  })

  it('boleta sin RUC: solo informa', () => {
    const a = alertasComprobante(comprobante({ tipo: 'boleta', rucEmisor: '', rucReceptor: '' }), viaje)
    expect(a.every((x) => x.nivel === 'info')).toBe(true)
  })

  it('duplicado', () => {
    const a = comprobante({})
    const b = comprobante({})
    expect(alertasComprobante(a, viaje, [a, b]).some((x) => x.campo === 'documento' && x.nivel === 'error')).toBe(true)
  })

  it('lectura con dudas sin corregir', () => {
    expect(alertasComprobante(comprobante({}, { total: 'Leído por OCR' }), viaje).some((x) => x.campo === 'lectura')).toBe(true)
  })
})

describe('estado de revisión', () => {
  it('propuesta → por confirmar → válido', () => {
    const c = comprobante({})
    expect(c.clasificacion).toMatchObject({ categoria: 'movilidad', descripcion: 'SERVICIO DE TAXI', confirmado: false })
    expect(estadoRevision(c, [])).toBe('por-confirmar')
    expect(estadoRevision(conClasificacion(c, {}), [])).toBe('valido')
  })

  it('la propuesta sigue a los datos corregidos mientras no esté confirmada', () => {
    const c = conCampo(comprobante({ detalle: '', razonSocial: '' }), 'razonSocial', 'RESTAURANT Y MARISQUERIA EJEMPLO')
    expect(c.clasificacion).toMatchObject({ categoria: 'alimentacion', confirmado: false })
    const confirmado = conClasificacion(c, {})
    expect(conCampo(confirmado, 'razonSocial', 'TAXI EJEMPLO').clasificacion.categoria).toBe('alimentacion')
  })

  it('editar la descripción la deja confirmada', () => {
    const c = conClasificacion(comprobante({}), { descripcion: 'SERVICIO DE TAXI AEROPUERTO' })
    expect(c.clasificacion).toMatchObject({ descripcion: 'SERVICIO DE TAXI AEROPUERTO', confirmado: true })
  })

  it('con alertas el usuario decide', () => {
    const c = conClasificacion(comprobante({ fecha: '2026-02-21' }), {})
    const a = alertasComprobante(c, viaje)
    expect(estadoRevision(c, a)).toBe('por-decidir')
    expect(estadoRevision(conDecision(c, 'incluir'), a)).toBe('valido')
    expect(estadoRevision(conDecision(c, 'excluir'), a)).toBe('excluido')
  })

  it('sin total no se puede incluir aunque se elija «incluir»', () => {
    const c = conDecision(conClasificacion(comprobante({ total: null }), {}), 'incluir')
    expect(estadoRevision(c, alertasComprobante(c, viaje))).toBe('por-decidir')
  })

  it('las alertas informativas no piden decisión', () => {
    const c = conClasificacion(comprobante({ tipo: 'boleta' }), {})
    expect(estadoRevision(c, alertasComprobante(c, viaje))).toBe('valido')
  })
})
