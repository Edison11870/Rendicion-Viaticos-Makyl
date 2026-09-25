// Datos del encabezado y pie comunes a todas las salidas (Excel y PDF).
import { nombrePlanilla, nombreRendicion } from '../reglas/viaje.js'
import { aCentimos, isoADmy } from '../util/formato.js'

export function datosSalida(trabajador, viaje) {
  return {
    persona: nombreRendicion(trabajador), // «Quispe Rojas Juan Carlos»
    personaPlanilla: nombrePlanilla(trabajador), // «Juan Carlos Quispe Rojas»
    dni: trabajador.dni,
    recibe: trabajador.recibeAdministracion,
    proyecto: viaje.proyecto,
    fechaEntrega: viaje.fechaEntrega,
    fechaRendicion: viaje.fechaRendicion,
    monto: aCentimos(viaje.montoRecibido) || 0,
    formaEntrega: viaje.formaEntrega,
    chequeNumero: viaje.chequeNumero,
  }
}

/** «RENDICION - Boroo - Zaranda 21-03-2026.xlsx» (sin caracteres que Windows no acepta). */
export function nombreArchivo(prefijo, datos, extension) {
  const proyecto = (datos.proyecto || 'viaje').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
  const fecha = isoADmy(datos.fechaRendicion).replace(/\//g, '-')
  return `${prefijo} - ${proyecto} ${fecha}.${extension}`
}
