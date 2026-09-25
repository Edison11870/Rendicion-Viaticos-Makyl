import { useCallback, useEffect, useRef, useState } from 'react'
import {
  comprobanteVacio,
  conCampo,
  conClasificacion,
  conDecision,
  conLectura,
  nuevoComprobante,
  tipoDeArchivo,
} from '../reglas/comprobantes.js'

// pdf.js y el OCR pesan: se cargan recién cuando llega el primer archivo
const lector = () => import('../extraccion/leerArchivo.js')

/**
 * Lista de comprobantes y cola de lectura: se leen de uno en uno (el OCR usa mucha memoria,
 * sobre todo en celular) mientras la pantalla sigue respondiendo.
 */
export function useComprobantes() {
  const [lista, setLista] = useState([])
  const ocupado = useRef(false)

  const actualizar = useCallback((id, cambio) => {
    setLista((l) => l.map((c) => (c.id === id ? (typeof cambio === 'function' ? cambio(c) : { ...c, ...cambio }) : c)))
  }, [])

  // procesa el siguiente en cola
  useEffect(() => {
    if (ocupado.current) return
    const siguiente = lista.find((c) => c.estado === 'en-cola')
    if (!siguiente) return
    ocupado.current = true
    actualizar(siguiente.id, { estado: 'leyendo', avance: 0 })
    lector()
      .then(({ leerComprobante }) => leerComprobante(siguiente.archivo, (avance) => actualizar(siguiente.id, { avance })))
      .then((lectura) => actualizar(siguiente.id, (c) => conLectura(c, lectura)))
      .catch((e) =>
        actualizar(siguiente.id, (c) => ({
          ...c,
          estado: 'error',
          error: e?.message || 'No se pudo leer el archivo.',
          campos: comprobanteVacio(),
          dudas: {},
        })),
      )
      .finally(() => {
        ocupado.current = false
        setLista((l) => [...l]) // despierta la cola
      })
  }, [lista, actualizar])

  const agregar = useCallback((archivos) => {
    const nuevos = []
    const rechazados = []
    for (const a of archivos) (tipoDeArchivo(a) ? nuevos : rechazados).push(a)
    setLista((l) => {
      const ya = new Set(l.map((c) => `${c.nombreArchivo}|${c.archivo.size}`))
      return [...l, ...nuevos.filter((a) => !ya.has(`${a.name}|${a.size}`)).map(nuevoComprobante)]
    })
    return rechazados.map((a) => a.name)
  }, [])

  const quitar = useCallback((id) => {
    setLista((l) => {
      const c = l.find((x) => x.id === id)
      if (c?.vista) URL.revokeObjectURL(c.vista)
      return l.filter((x) => x.id !== id)
    })
  }, [])

  const editar = useCallback((id, campo, valor) => actualizar(id, (c) => conCampo(c, campo, valor)), [actualizar])

  const reintentar = useCallback((id) => actualizar(id, { estado: 'en-cola', error: '', avance: 0 }), [actualizar])

  const clasificar = useCallback((id, cambios) => actualizar(id, (c) => conClasificacion(c, cambios)), [actualizar])

  const decidir = useCallback((id, decision) => actualizar(id, (c) => conDecision(c, decision)), [actualizar])

  /** Confirma tal cual la propuesta de varios comprobantes (acción explícita del usuario). */
  const confirmarPropuestas = useCallback((ids) => {
    const set = new Set(ids)
    setLista((l) => l.map((c) => (set.has(c.id) ? conClasificacion(c, {}) : c)))
  }, [])

  return { lista, agregar, quitar, editar, reintentar, clasificar, decidir, confirmarPropuestas }
}
