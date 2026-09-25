import { describe, expect, it } from 'vitest'
import { interpretarComprobante } from '../src/extraccion/interpretar.js'
import { importeEnLetras, palabrasANumero } from '../src/extraccion/letras.js'
import { lineasDesdeItems } from '../src/extraccion/lineas.js'
import { rucValido, rucsEnTexto } from '../src/extraccion/ruc.js'
import * as T from './fixtures/textos.js'

describe('RUC', () => {
  it('valida el dígito verificador', () => {
    expect(rucValido('20523643534')).toBe(true) // MAKYL
    expect(rucValido('20523643535')).toBe(false)
    expect(rucValido('30523643534')).toBe(false)
    expect(rucValido('2052364353')).toBe(false)
  })
  it('encuentra los RUC válidos en orden', () => {
    expect(rucsEnTexto('RUC:10123456781 ... RUC :20523643534 ... 12345678901')).toEqual(['10123456781', '20523643534'])
  })
})

describe('importe en letras', () => {
  it('lee números en español', () => {
    expect(palabrasANumero('treinta y tres')).toBe(33)
    expect(palabrasANumero('VEINTIOCHO')).toBe(28)
    expect(palabrasANumero('mil doscientos cincuenta')).toBe(1250)
    expect(palabrasANumero('ciento veinte')).toBe(120)
    expect(palabrasANumero('hola')).toBeNull()
  })
  it('lee la línea SON:', () => {
    expect(importeEnLetras('SON: TREINTA Y TRES Y 60/100 SOLES')).toEqual({ centimos: 3360, moneda: 'PEN' })
    expect(importeEnLetras('SON: CATORCE CON 00/100 SOLES')).toEqual({ centimos: 1400, moneda: 'PEN' })
    expect(importeEnLetras('Son: VEINTIOCHO Y 50/100 SOLES')).toEqual({ centimos: 2850, moneda: 'PEN' })
  })
})

describe('líneas desde pdf.js', () => {
  it('une en una línea los pedazos que están a la misma altura', () => {
    const it = (str, x, y, width) => ({ str, transform: [9, 0, 0, 9, x, y], width, height: 9 })
    const texto = lineasDesdeItems([
      it('Importe Total :', 300, 100, 60),
      it('34.80', 420, 100.5, 20),
      it('Fecha de Emisión', 20, 200, 70),
      it(':16/03/2026', 92, 200, 45),
    ])
    expect(texto).toBe('Fecha de Emisión :16/03/2026\nImporte Total :   34.80')
  })
})

describe('interpretar comprobantes', () => {
  it('factura del portal SUNAT (persona natural)', () => {
    const r = interpretarComprobante(T.portalSunat)
    expect(r).toMatchObject({
      esComprobante: true,
      tipo: 'factura',
      documento: 'E001-100',
      fecha: '2026-03-16',
      rucEmisor: '10123456781',
      razonSocial: 'PEREZ QUISPE JUAN CARLOS',
      rucReceptor: '20523643534',
      total: 3480,
      igv: 0,
      moneda: 'PEN',
    })
    expect(r.detalle).toMatch(/SERVICIO DE TAXI/)
    expect(r.dudas).toEqual({})
  })

  it('factura del portal SUNAT (empresa con nombre comercial arriba)', () => {
    const r = interpretarComprobante(T.portalSunatEmpresa)
    expect(r.razonSocial).toBe('EMPRESA DE TAXI EJEMPLO S.A.')
    expect(r.documento).toBe('E001-9951')
    expect(r.total).toBe(8000)
  })

  it('razón social en dos líneas y fecha de vencimiento distinta', () => {
    const r = interpretarComprobante(T.facturadorDosLineas)
    expect(r.razonSocial).toBe('EMPRESA DE TRANSPORTES EJEMPLO AEROPUERTO SA')
    expect(r.documento).toBe('FA01-00034972')
    expect(r.fecha).toBe('2026-03-02')
    expect(r.total).toBe(3000)
  })

  it('factura con IGV y RUC sin etiqueta', () => {
    const r = interpretarComprobante(T.facturadorConIgv)
    expect(r).toMatchObject({ rucEmisor: '20333333334', razonSocial: 'TIENDA EJEMPLO S.A.C.', documento: 'F008-00000015', total: 1400, igv: 133 })
    expect(r.detalle).toMatch(/Integral Miel/)
  })

  it('toma la razón social y no el nombre comercial', () => {
    const r = interpretarComprobante(T.nombreComercialArriba)
    expect(r.razonSocial).toBe('ROJAS DIAZ MARIA')
    expect(r.documento).toBe('E001-605')
    expect(r.total).toBe(2000)
    expect(r.igv).toBe(305)
  })

  it('ticket por OCR: corrige el total con el importe en letras y avisa lo dudoso', () => {
    const r = interpretarComprobante(T.ticketOcr, { origen: 'ocr' })
    expect(r.documento).toBe('F023-00002781')
    expect(r.fecha).toBe('2026-03-06')
    expect(r.total).toBe(2850)
    expect(r.igv).toBe(414)
    expect(r.rucReceptor).toBe('20523643534')
    expect(r.rucEmisor).toBe('')
    expect(Object.keys(r.dudas)).toEqual(expect.arrayContaining(['rucEmisor', 'total', 'fecha', 'documento']))
  })

  it('reconoce una captura de Yape como evidencia, no como comprobante', () => {
    const r = interpretarComprobante(T.capturaYape, { origen: 'ocr' })
    expect(r.esComprobante).toBe(false)
    expect(r.tipo).toBe('evidencia')
  })

  it('texto vacío: todo queda marcado para revisar', () => {
    const r = interpretarComprobante('')
    expect(r.total).toBeNull()
    expect(Object.keys(r.dudas)).toEqual(expect.arrayContaining(['documento', 'fecha', 'total', 'rucEmisor']))
  })
})
