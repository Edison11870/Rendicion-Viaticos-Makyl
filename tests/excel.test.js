import { readFileSync } from 'node:fs'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { crearLibroRendicion, libroABytes } from '../src/salida/excelRendicion.js'
import { nombreArchivo } from '../src/salida/datos.js'

const datos = {
  persona: 'Quispe Rojas Juan Carlos',
  personaPlanilla: 'Juan Carlos Quispe Rojas',
  dni: '12345678',
  recibe: 'Administración',
  proyecto: 'Boroo - Zaranda',
  fechaEntrega: '2026-02-28',
  fechaRendicion: '2026-03-21',
  monto: 25000,
  formaEntrega: 'transferencia',
  chequeNumero: '',
}

const fila = (fecha, documento, descripcion, soles) => ({ tipo: 'comprobante', fecha, documento, descripcion, soles, dolares: null })
const planilla = {
  numero: 1,
  fecha: '2026-03-06',
  total: 5000,
  lineas: [{ motivo: 'Servicio de Taxi', origen: 'Hotel', destino: 'Aeropuerto de Trujillo', monto: 5000 }],
}
const filas = [
  fila('2026-03-02', 'FA01-00034972', 'SERVICIO DE TAXI', 3000),
  fila('2026-03-02', 'E001-605', 'CONSUMO DE ALIMENTOS', 2000),
  fila('2026-03-06', 'E001-9951', 'SERVICIO DE TAXI AEROPUERTO - PLAYA LOS DELFINES', 8000),
  { tipo: 'planilla', fecha: '2026-03-06', documento: 'Planilla N° 001', descripcion: 'SERVICIO DE TAXI', soles: 5000, dolares: null, planilla },
]

async function releer(f = filas) {
  const libro = await crearLibroRendicion({ filas: f, datos, logo: readFileSync('templates/logo-rendicion.jpg') })
  const leido = new ExcelJS.Workbook()
  await leido.xlsx.load(await libroABytes(libro))
  return leido
}

describe('Excel de rendición (formato de la empresa)', () => {
  it('hoja, página y columnas como el original', async () => {
    const ws = (await releer()).getWorksheet('RENDICION-MARCOBRE')
    expect(ws).toBeDefined()
    expect(ws.pageSetup).toMatchObject({ paperSize: 9, orientation: 'portrait', scale: 83 })
    expect(ws.pageSetup.printArea).toBe('A1:F61')
    expect([1, 2, 3, 4, 5, 6].map((c) => ws.getColumn(c).width)).toEqual([10, 13.57, 15.29, 51.29, 13.14, 11.43])
    expect(ws.getRow(7).height).toBe(4.5)
    expect(ws.getRow(56).hidden).toBe(true)
  })

  it('encabezado, celdas combinadas y tabla de 39 filas', async () => {
    const ws = (await releer()).getWorksheet('RENDICION-MARCOBRE')
    expect(ws.getCell('B4').value).toBe('RENDICIÓN DE GASTOS')
    expect(ws.getCell('F4').isMerged).toBe(true)
    expect(ws.getCell('B6').value).toBe('Persona que recibe : Quispe Rojas Juan Carlos ')
    expect(ws.getCell('B8').value).toBe('Fecha de entrega: 28/02/2026')
    expect(ws.getCell('B10').value).toBe('Monto entregado : S/ 250.00')
    expect(ws.getCell('D11').value.richText.map((r) => r.text).join('')).toMatch(/TRANSFERENCIA\s+ok\s+EFECTIVO\s+CHEQUE N°/)
    expect(ws.getCell('C12').value).toBe('Boroo - Zaranda ')
    expect(['B13', 'C13', 'D13', 'E13', 'F13'].map((r) => ws.getCell(r).value)).toEqual(['FECHA', 'DOCUMENTO', 'Descripción ', 'Nuevos Soles', 'Dólares '])
    expect(ws.getCell('C14').value).toBe('FA01-00034972')
    expect(ws.getCell('E14').value).toBe(30)
    expect(ws.getCell('E14').numFmt).toContain('[$S/-280A]')
    expect(ws.getCell('B14').numFmt).toBe('dd/mm/yyyy')
    expect(ws.getCell('C17').value).toBe('Planilla N° 001')
    expect(ws.getCell('B52').border.left.style).toBe('thin') // última fila del detalle
    expect(ws.getCell('B53').value).toBe('Total gastos ')
    expect(ws.getCell('D53').isMerged).toBe(true)
    expect(ws.getCell('E53').value).toMatchObject({ formula: 'SUM(E14:E52)', result: 180 })
    expect(ws.getCell('F53').border.right.style).toBe('medium')
  })

  it('pie con el saldo (diferencia) y firmas', async () => {
    const ws = (await releer()).getWorksheet('RENDICION-MARCOBRE')
    expect(ws.getCell('B55').value).toBe('Saldos Entregados :')
    expect(ws.getCell('E55').value).toMatchObject({ formula: '250.00-E53', result: 70 })
    expect(ws.getCell('D55').value).toBe('a devolver por el trabajador')
    expect(ws.getCell('B57').value).toBe('Fecha de rendición  : 21/03/2026')
    expect(ws.getCell('B59').value).toBe('Persona que entrega: Quispe Rojas Juan Carlos ')
    expect(ws.getCell('B60').value).toBe('Persona que recibe: Administración')
  })

  it('logo embebido', async () => {
    const libro = await releer()
    expect(libro.model.media.length).toBe(1)
    expect(libro.getWorksheet('RENDICION-MARCOBRE').getImages()[0].range.tl.nativeCol).toBe(1)
  })

  it('una hoja por planilla con su formato', async () => {
    const ws = (await releer()).getWorksheet('Planilla 001')
    expect(ws.getCell('E1').value).toBe('Planilla No 001')
    expect(ws.getCell('B4').value).toBe('Makyl Engineering Consulting Services EIRL')
    expect(ws.getCell('B6').value).toBe('06/03/2026')
    expect(ws.getCell('B7').value).toBe('21/03/2026')
    expect(ws.getCell('B10').value).toBe('Juan Carlos Quispe Rojas')
    expect(ws.getCell('B14').value).toBe('Hotel - Aeropuerto de Trujillo')
    expect(ws.getCell('D14').value).toMatchObject({ formula: 'SUM(C14:C16)', result: 50 })
    expect(ws.getCell('D16').isMerged).toBe(true)
  })

  it('más de 39 filas: se agregan filas y el total las incluye', async () => {
    const muchas = Array.from({ length: 45 }, (_, i) => fila('2026-03-03', `E001-${i + 1}`, 'SERVICIO DE TAXI', 1000))
    const ws = (await releer(muchas)).getWorksheet('RENDICION-MARCOBRE')
    expect(ws.getCell('E59').value).toMatchObject({ formula: 'SUM(E14:E58)', result: 450 })
    expect(ws.getCell('B59').value).toBe('Total gastos ')
    expect(ws.pageSetup.printArea).toBe('A1:F67')
  })

  it('nombre de archivo', () => {
    expect(nombreArchivo('RENDICION', datos, 'xlsx')).toBe('RENDICION - Boroo - Zaranda 21-03-2026.xlsx')
  })
})
