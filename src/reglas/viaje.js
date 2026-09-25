// Datos del viaje y del trabajador: valores iniciales y validación.
import { PARAMETROS_POR_DEFECTO } from '../config/empresa.js'
import { aCentimos, hoyIso } from '../util/formato.js'

export const TRABAJADOR_VACIO = {
  nombres: '', // "Juan Carlos"
  apellidos: '', // "Quispe Rojas"
  dni: '',
  recibeAdministracion: '', // «Persona que recibe» al pie de la rendición
  ...PARAMETROS_POR_DEFECTO,
}

export function viajeVacio() {
  return {
    proyecto: '', // PROYECTO / unidad minera
    motivo: '',
    fechaSalida: '',
    fechaRetorno: '',
    montoRecibido: '', // texto tal como lo escribe el usuario; se convierte con aCentimos
    fechaEntrega: '',
    formaEntrega: 'transferencia',
    chequeNumero: '',
    fechaRendicion: hoyIso(),
  }
}

/** «Quispe Rojas Juan Carlos» — como va en la hoja de rendición. */
export function nombreRendicion(t) {
  return [t.apellidos, t.nombres].map((s) => s.trim()).filter(Boolean).join(' ')
}

/** «Juan Carlos Quispe Rojas» — como va en la planilla de movilidad. */
export function nombrePlanilla(t) {
  return [t.nombres, t.apellidos].map((s) => s.trim()).filter(Boolean).join(' ')
}

/** Devuelve { campo: 'mensaje' } con los errores; objeto vacío si todo está bien. */
export function validarTrabajador(t) {
  const e = {}
  if (!t.nombres.trim()) e.nombres = 'Escribe tus nombres.'
  if (!t.apellidos.trim()) e.apellidos = 'Escribe tus apellidos.'
  if (!/^\d{8}$/.test(t.dni.trim())) e.dni = 'El DNI tiene 8 dígitos.'
  if (!t.recibeAdministracion.trim()) e.recibeAdministracion = '¿Quién recibe la rendición en la oficina?'
  if (!(Number(t.rmv) > 0)) e.rmv = 'La RMV debe ser mayor que cero.'
  if (!(Number(t.topeMovilidadPct) > 0)) e.topeMovilidadPct = 'El porcentaje debe ser mayor que cero.'
  if (!(Number(t.excesoMaximo) >= 0)) e.excesoMaximo = 'El exceso máximo no puede ser negativo.'
  return e
}

export function validarViaje(v) {
  const e = {}
  if (!v.proyecto.trim()) e.proyecto = 'Indica la unidad minera o proyecto.'
  if (!v.fechaSalida) e.fechaSalida = 'Falta la fecha de salida.'
  if (!v.fechaRetorno) e.fechaRetorno = 'Falta la fecha de retorno.'
  if (v.fechaSalida && v.fechaRetorno && v.fechaRetorno < v.fechaSalida)
    e.fechaRetorno = 'El retorno no puede ser antes de la salida.'
  const monto = aCentimos(v.montoRecibido)
  if (monto === null || monto <= 0) e.montoRecibido = 'Escribe el monto recibido, por ejemplo 200.00.'
  if (!v.fechaEntrega) e.fechaEntrega = 'Falta la fecha en que te entregaron el dinero.'
  if (v.formaEntrega === 'cheque' && !v.chequeNumero.trim()) e.chequeNumero = 'Escribe el número de cheque.'
  if (!v.fechaRendicion) e.fechaRendicion = 'Falta la fecha de rendición.'
  if (v.fechaRendicion && v.fechaRetorno && v.fechaRendicion < v.fechaRetorno)
    e.fechaRendicion = 'La rendición suele hacerse después del retorno. Revisa la fecha.'
  return e
}

/** Tope diario de la planilla de movilidad en céntimos (4 % de la RMV por defecto). */
export function topeDiarioMovilidad(t) {
  return Math.round(Number(t.rmv) * Number(t.topeMovilidadPct))
}

/** Días calendario del viaje, contando salida y retorno. */
export function diasViaje(v) {
  if (!v.fechaSalida || !v.fechaRetorno || v.fechaRetorno < v.fechaSalida) return 0
  const ms = Date.parse(v.fechaRetorno) - Date.parse(v.fechaSalida)
  return Math.round(ms / 86400000) + 1
}
