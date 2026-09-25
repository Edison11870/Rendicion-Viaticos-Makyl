// Comprobantes cargados: estructura de cada uno y edición de campos. Sin interfaz (se prueba aparte).
import { proponerClasificacion } from './categorias.js'

export const TIPOS = [
  { valor: 'factura', etiqueta: 'Factura' },
  { valor: 'boleta', etiqueta: 'Boleta' },
  { valor: 'ticket', etiqueta: 'Ticket' },
  { valor: 'recibo', etiqueta: 'Recibo por honorarios' },
  { valor: 'otro', etiqueta: 'Otro comprobante' },
  { valor: 'evidencia', etiqueta: 'Evidencia (Yape, app de taxi…)' },
]

export const CAMPOS_EDITABLES = ['tipo', 'documento', 'fecha', 'rucEmisor', 'razonSocial', 'total', 'igv']

export function tipoDeArchivo(archivo) {
  if (archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name)) return 'pdf'
  if (archivo.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(archivo.name)) return 'imagen'
  return null
}

let contador = 0
export function nuevoId() {
  contador += 1
  return `c${Date.now().toString(36)}${contador}`
}

/** Comprobante recién agregado, aún sin leer. */
export function nuevoComprobante(archivo) {
  return {
    id: nuevoId(),
    archivo,
    nombreArchivo: archivo.name,
    estado: 'en-cola', // en-cola · leyendo · listo · error
    avance: 0,
    error: '',
    vista: '',
    texto: '',
    origen: '',
    campos: null,
    dudas: {},
    clasificacion: null, // { categoria, descripcion, alternativa, motivo, confirmado }
    decision: null, // null · 'incluir' (a pesar de las alertas) · 'excluir'
  }
}

function propuesta(campos, texto) {
  return { ...proponerClasificacion(campos, texto), confirmado: false }
}

/** Aplica el resultado de la lectura. */
export function conLectura(c, lectura) {
  const { dudas, ...campos } = lectura.campos
  return {
    ...c,
    estado: 'listo',
    avance: 1,
    vista: lectura.vista,
    texto: lectura.texto,
    origen: lectura.origen,
    campos,
    dudas,
    clasificacion: propuesta(campos, lectura.texto),
  }
}

/** Cambia categoría o descripción. Lo que el usuario escribe o elige queda confirmado. */
export function conClasificacion(c, cambios, { confirmar = true } = {}) {
  const base = c.clasificacion || propuesta(c.campos || {}, c.texto)
  return { ...c, clasificacion: { ...base, ...cambios, confirmado: confirmar || base.confirmado } }
}

/** Decisión del usuario frente a las alertas. */
export function conDecision(c, decision) {
  return { ...c, decision }
}

/** Cambia un campo; al corregirlo a mano deja de estar «en duda». */
export function conCampo(c, campo, valor) {
  const dudas = { ...c.dudas }
  delete dudas[campo]
  const campos = { ...c.campos, [campo]: valor }
  if (campo === 'tipo') {
    campos.esComprobante = valor !== 'evidencia'
    if (valor === 'evidencia') return { ...c, campos, dudas: {} }
  }
  return { ...c, campos, dudas }
}

/** Comprobante manual (para cuando la lectura falla del todo). */
export function comprobanteVacio() {
  return {
    esComprobante: true,
    tipo: 'factura',
    serie: '',
    numero: '',
    documento: '',
    fecha: '',
    rucEmisor: '',
    razonSocial: '',
    rucReceptor: '',
    total: null,
    igv: null,
    moneda: 'PEN',
    detalle: '',
    origen: 'manual',
  }
}

/** Normaliza la serie-número como va en la columna DOCUMENTO: «e001 9951» → «E001-9951». */
export function normalizarDocumento(texto) {
  const t = String(texto || '').trim().toUpperCase().replace(/\s*[-–]\s*/g, '-')
  const m = /^([A-Z0-9]{1,4})[\s-]+(\d{1,8})$/.exec(t)
  return m ? `${m[1]}-${m[2]}` : t.replace(/\s+/g, ' ')
}

export function resumen(lista) {
  const listos = lista.filter((c) => c.estado === 'listo')
  const comprobantes = listos.filter((c) => c.campos.esComprobante)
  return {
    total: lista.length,
    pendientes: lista.filter((c) => c.estado === 'en-cola' || c.estado === 'leyendo').length,
    errores: lista.filter((c) => c.estado === 'error').length,
    comprobantes: comprobantes.length,
    evidencias: listos.length - comprobantes.length,
    conDudas: comprobantes.filter((c) => Object.keys(c.dudas).length > 0).length,
    suma: comprobantes.reduce((s, c) => s + (c.campos.total || 0), 0),
  }
}
