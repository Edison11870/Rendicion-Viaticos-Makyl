// Alertas de cada comprobante frente al viaje. No excluye nada por su cuenta: marca para que el
// usuario decida (incluir de todos modos / no usar).
import { EMPRESA } from '../config/empresa.js'
import { rucValido } from '../extraccion/ruc.js'
import { isoADmy } from '../util/formato.js'

/**
 * @typedef {{nivel: 'error'|'aviso'|'info', campo: string, mensaje: string}} Alerta
 */

/** Alertas de un comprobante. `todos` sirve para detectar duplicados. */
export function alertasComprobante(c, viaje, todos = []) {
  const a = []
  const f = c.campos
  if (!f || !f.esComprobante) return a

  // datos incompletos
  const faltan = []
  if (!f.documento) faltan.push('serie-número')
  if (!f.fecha) faltan.push('fecha')
  if (f.total === null || f.total === undefined) faltan.push('total')
  if (!f.razonSocial) faltan.push('razón social')
  if (!f.rucEmisor && f.tipo !== 'boleta' && f.tipo !== 'ticket') faltan.push('RUC del emisor')
  if (faltan.length) a.push({ nivel: 'error', campo: 'datos', mensaje: `Datos incompletos: falta ${faltan.join(', ')}.` })

  if (f.rucEmisor && !rucValido(f.rucEmisor)) a.push({ nivel: 'error', campo: 'rucEmisor', mensaje: `El RUC ${f.rucEmisor} no es válido (dígito verificador).` })
  if (f.total !== null && f.total !== undefined && f.total <= 0) a.push({ nivel: 'error', campo: 'total', mensaje: 'El total debe ser mayor que cero.' })

  // fecha fuera del viaje
  if (f.fecha && viaje.fechaSalida && viaje.fechaRetorno && (f.fecha < viaje.fechaSalida || f.fecha > viaje.fechaRetorno)) {
    a.push({
      nivel: 'aviso',
      campo: 'fecha',
      mensaje: `Fecha ${isoADmy(f.fecha)} fuera del viaje (${isoADmy(viaje.fechaSalida)} al ${isoADmy(viaje.fechaRetorno)}).`,
    })
  }

  // a nombre de la empresa
  if (f.tipo === 'factura' && f.rucReceptor !== EMPRESA.ruc) {
    a.push({ nivel: 'aviso', campo: 'receptor', mensaje: `No se ve emitida a MAKYL (RUC ${EMPRESA.ruc}). Revisa el comprobante.` })
  }
  if (f.tipo === 'boleta') a.push({ nivel: 'info', campo: 'tipo', mensaje: 'Es boleta: la empresa prefiere factura.' })
  if (f.moneda === 'USD') a.push({ nivel: 'info', campo: 'moneda', mensaje: 'Comprobante en dólares: irá en la columna Dólares.' })

  // duplicados
  const clave = (x) => (x.campos?.documento ? `${x.campos.rucEmisor}|${x.campos.documento}`.toUpperCase() : null)
  const k = clave(c)
  if (k && todos.some((o) => o.id !== c.id && o.campos?.esComprobante && clave(o) === k)) {
    a.push({ nivel: 'error', campo: 'documento', mensaje: `Comprobante repetido: ${f.documento} aparece más de una vez.` })
  }

  // lo que quedó dudoso en la lectura y nadie corrigió
  const dudas = Object.keys(c.dudas || {})
  if (dudas.length) a.push({ nivel: 'aviso', campo: 'lectura', mensaje: `Lectura por confirmar (${dudas.length} ${dudas.length === 1 ? 'dato' : 'datos'}).` })
  return a
}

/** Un comprobante solo puede entrar si tiene un total mayor que cero. */
export function sePuedeIncluir(c) {
  return Number.isFinite(c.campos?.total) && c.campos.total > 0
}

/**
 * Estado de revisión de un comprobante:
 * - 'por-confirmar': falta confirmar categoría y descripción
 * - 'por-decidir': tiene alertas y el usuario no decidió si entra
 * - 'valido' / 'excluido'
 */
export function estadoRevision(c, alertas) {
  if (!c.campos?.esComprobante) return 'evidencia'
  if (c.decision === 'excluir') return 'excluido'
  if (!c.clasificacion?.confirmado) return 'por-confirmar'
  // sin monto no puede entrar en la rendición, aunque el usuario quiera incluirlo
  if (!sePuedeIncluir(c)) return 'por-decidir'
  const serias = alertas.filter((x) => x.nivel !== 'info')
  if (serias.length && c.decision !== 'incluir') return 'por-decidir'
  return 'valido'
}
