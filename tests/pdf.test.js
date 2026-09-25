import { readFileSync } from 'node:fs'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { generarPdfPlanillas, generarPdfSustentos, hojaRendicion } from '../src/salida/pdfSustentos.js'

const leer = (r) => new Uint8Array(readFileSync(r))
const fuentes = {
  regular: leer('node_modules/@fontsource/carlito/files/carlito-latin-400-normal.woff'),
  negrita: leer('node_modules/@fontsource/carlito/files/carlito-latin-700-normal.woff'),
}
const foto = leer('templates/logo-rendicion.jpg') // cualquier JPEG sirve como «foto» de prueba

async function pdfDePrueba(paginas, texto) {
  const d = await PDFDocument.create()
  const f = await d.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < paginas; i++) d.addPage([595, 842]).drawText(`${texto} ${i + 1}`, { x: 50, y: 700, size: 20, font: f })
  return d.save()
}

const datos = {
  persona: 'Quispe Rojas Juan Carlos', personaPlanilla: 'Juan Carlos Quispe Rojas', dni: '12345678', recibe: 'Administración',
  proyecto: 'Boroo - Zaranda', fechaEntrega: '2026-02-28', fechaRendicion: '2026-03-21', monto: 25000, formaEntrega: 'transferencia', chequeNumero: '',
}
const planilla = { numero: 1, fecha: '2026-03-06', total: 5000, lineas: [{ motivo: 'Servicio de Taxi', origen: 'Hotel', destino: 'Aeropuerto', monto: 5000 }] }

describe('PDF de sustentos', () => {
  it('hoja de rendición → comprobantes en orden → planilla con evidencias → constancia', async () => {
    const archivos = {
      a: { tipo: 'pdf', bytes: await pdfDePrueba(2, 'Factura A') },
      b: { tipo: 'jpg', bytes: foto },
      ev: { tipo: 'jpg', bytes: foto },
      dep: { tipo: 'jpg', bytes: foto },
    }
    const filas = [
      { tipo: 'comprobante', fecha: '2026-03-02', documento: 'E001-1', descripcion: 'SERVICIO DE TAXI', soles: 3000, comprobante: 'a' },
      { tipo: 'comprobante', fecha: '2026-03-03', documento: 'E001-2', descripcion: 'CONSUMO DE ALIMENTOS', soles: 2000, comprobante: 'b' },
      { tipo: 'planilla', fecha: '2026-03-06', documento: 'Planilla N° 001', descripcion: 'SERVICIO DE TAXI', soles: 5000, planilla, evidencias: ['ev'] },
    ]
    const bytes = await generarPdfSustentos({ filas, datos, logo: foto, fuentes, archivoDe: async (k) => archivos[k], depositos: ['dep'] })
    const pdf = await PDFDocument.load(bytes)
    // 1 hoja + 2 págs. de la factura A + 1 foto B + 1 planilla + 1 evidencia + 1 constancia
    expect(pdf.getPageCount()).toBe(7)
    expect(pdf.getTitle()).toBe('Rendición de gastos - Boroo - Zaranda')
  })

  it('un PDF protegido o dañado usa su imagen de respaldo', async () => {
    const filas = [{ tipo: 'comprobante', fecha: '2026-03-02', documento: 'E001-1', descripcion: 'X', soles: 100, comprobante: 'x' }]
    const archivoDe = async () => ({ tipo: 'pdf', bytes: new Uint8Array([1, 2, 3]), respaldo: { tipo: 'jpg', bytes: foto } })
    const pdf = await PDFDocument.load(await generarPdfSustentos({ filas, datos, fuentes, archivoDe }))
    expect(pdf.getPageCount()).toBe(2)
  })

  it('planillas para firmar: una página por planilla', async () => {
    const filas = [{ tipo: 'planilla', planilla }, { tipo: 'planilla', planilla: { ...planilla, numero: 2, fecha: '2026-03-07' } }]
    expect((await PDFDocument.load(await generarPdfPlanillas({ filas, datos, fuentes }))).getPageCount()).toBe(2)
  })

  it('la hoja del PDF usa las mismas celdas que el Excel (39 filas, total y saldo)', () => {
    const hoja = hojaRendicion([{ fecha: '2026-03-02', documento: 'E001-1', descripcion: 'X', soles: 25410 }], datos)
    const en = (f, c) => hoja.celdas.find((x) => x.f === f && x.c === c)
    expect(en(13, 2).texto).toBe('FECHA')
    expect(en(52, 2).borde).toEqual({ t: 'thin', l: 'thin', r: 'thin' })
    expect(en(53, 2).texto).toBe('Total gastos')
    expect(en(53, 5).monto).toBe('254.10')
    expect(en(55, 5).monto).toBe('-4.10')
    expect(en(55, 4).texto).toBe('a favor del trabajador')
    expect(hoja.ocultas).toEqual([56, 58])
  })
})
