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

import { GUARDADOS, SESION, aRegistro, agregar as agregarDb, borrar as borrarDb, deRegistro, leerTodos, reemplazar } from '../almacen/indexeddb.js'

// pdf.js y el OCR pesan: se cargan recién cuando llega el primer archivo
const lector = () => import('../extraccion/leerArchivo.js')

/**
 * Lista de comprobantes y cola de lectura: se leen de uno en uno (el OCR usa mucha memoria,
 * sobre todo en celular) mientras la pantalla sigue respondiendo.
 */
export function useComprobantes() {
  const [lista, setLista] = useState([])
  const [restaurado, setRestaurado] = useState(false)
  const [guardados, setGuardados] = useState(0) // comprobantes guardados de otras rendiciones
  const ocupado = useRef(false)

  // al abrir: recuperar la rendición en curso (si se recargó la página) y contar los guardados
  useEffect(() => {
    let vivo = true
    Promise.all([leerTodos(SESION), leerTodos(GUARDADOS)]).then(([sesion, g]) => {
      if (!vivo) return
      if (sesion.length) setLista((l) => (l.length ? l : sesion.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map(deRegistro)))
      setGuardados(g.length)
      setRestaurado(true)
    })
    return () => {
      vivo = false
    }
  }, [])

  // guardar la sesión (con una pequeña espera para no escribir en cada tecla)
  useEffect(() => {
    if (!restaurado) return
    const t = setTimeout(async () => {
      const registros = await Promise.all(
        lista.map(async (c, orden) => {
          const r = await aRegistro(c)
          // lo que se estaba leyendo vuelve a la cola al recuperar
          return { ...r, orden, estado: r.estado === 'leyendo' ? 'en-cola' : r.estado }
        }),
      )
      reemplazar(SESION, registros)
    }, 700)
    return () => clearTimeout(t)
  }, [lista, restaurado])

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

  /** Guarda comprobantes para otra rendición (vuelven sin decisión, con sus datos confirmados). */
  const guardarParaOtra = useCallback(async (comprobantes, referencia) => {
    const registros = await Promise.all(comprobantes.map(async (c) => ({ ...(await aRegistro(c)), decision: null, deRendicion: referencia })))
    const ok = await agregarDb(GUARDADOS, registros)
    setGuardados((await leerTodos(GUARDADOS)).length)
    return ok
  }, [])

  /** Trae a esta rendición los comprobantes guardados antes. */
  const recuperarGuardados = useCallback(async () => {
    const g = await leerTodos(GUARDADOS)
    setLista((l) => {
      const ya = new Set(l.map((c) => c.id))
      return [...l, ...g.filter((r) => !ya.has(r.id)).map(deRegistro)]
    })
    await borrarDb(GUARDADOS, g.map((r) => r.id))
    setGuardados(0)
    return g.length
  }, [])

  /** Empieza una rendición nueva (vacía la lista y la sesión guardada). */
  const vaciar = useCallback(() => {
    setLista((l) => {
      for (const c of l) if (c.vista) URL.revokeObjectURL(c.vista)
      return []
    })
  }, [])

  return {
    lista, agregar, quitar, editar, reintentar, clasificar, decidir, confirmarPropuestas,
    guardados, guardarParaOtra, recuperarGuardados, vaciar, restaurado,
  }
}
