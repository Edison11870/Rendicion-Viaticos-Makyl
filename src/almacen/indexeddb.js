// Guardado de comprobantes (con sus archivos) en el navegador, con IndexedDB. Nada sale del equipo.
// - «sesion»: la rendición en curso, para no perderla al recargar la página.
// - «guardados»: comprobantes no utilizados, para usarlos en otra rendición.
// Si el navegador no permite IndexedDB (modo privado estricto), todo sigue funcionando sin guardar.

const BASE = 'rendicion-makyl'
const VERSION = 1
export const SESION = 'sesion'
export const GUARDADOS = 'guardados'

let conexion = null

function abrir() {
  if (conexion) return conexion
  conexion = new Promise((ok, mal) => {
    if (typeof indexedDB === 'undefined') return mal(new Error('Sin IndexedDB'))
    const pedido = indexedDB.open(BASE, VERSION)
    pedido.onupgradeneeded = () => {
      const db = pedido.result
      for (const almacen of [SESION, GUARDADOS]) if (!db.objectStoreNames.contains(almacen)) db.createObjectStore(almacen, { keyPath: 'id' })
    }
    pedido.onsuccess = () => ok(pedido.result)
    pedido.onerror = () => mal(pedido.error)
  }).catch((e) => {
    conexion = null
    throw e
  })
  return conexion
}

function operar(almacen, modo, accion) {
  return abrir().then(
    (db) =>
      new Promise((ok, mal) => {
        const tx = db.transaction(almacen, modo)
        const st = tx.objectStore(almacen)
        const resultado = accion(st)
        tx.oncomplete = () => ok(resultado?.result ?? resultado)
        tx.onerror = () => mal(tx.error)
        tx.onabort = () => mal(tx.error)
      }),
  )
}

export async function leerTodos(almacen) {
  try {
    return (await operar(almacen, 'readonly', (st) => st.getAll())) || []
  } catch {
    return []
  }
}

/** Reemplaza todo el contenido del almacén. */
export async function reemplazar(almacen, registros) {
  try {
    await operar(almacen, 'readwrite', (st) => {
      st.clear()
      for (const r of registros) st.put(r)
    })
    return true
  } catch {
    return false
  }
}

export async function agregar(almacen, registros) {
  try {
    await operar(almacen, 'readwrite', (st) => {
      for (const r of registros) st.put(r)
    })
    return true
  } catch {
    return false
  }
}

export async function borrar(almacen, ids) {
  try {
    await operar(almacen, 'readwrite', (st) => {
      for (const id of ids) st.delete(id)
    })
    return true
  } catch {
    return false
  }
}

// vistas previas ya convertidas a Blob (se guardan muchas veces durante la edición)
const cacheVistas = new Map()

/** Comprobante en memoria → registro guardable (la vista previa se guarda como imagen). */
export async function aRegistro(c) {
  let vista = null
  if (c.vista) {
    vista = cacheVistas.get(c.vista) || null
    if (!vista) {
      try {
        vista = await (await fetch(c.vista)).blob()
        cacheVistas.set(c.vista, vista)
      } catch {
        vista = null
      }
    }
  }
  const { vista: _url, avance, ...resto } = c
  return { ...resto, vistaBlob: vista, guardadoEn: new Date().toISOString() }
}

/** Registro guardado → comprobante en memoria. */
export function deRegistro(r) {
  const { vistaBlob, guardadoEn, ...resto } = r
  const vista = vistaBlob ? URL.createObjectURL(vistaBlob) : ''
  if (vista) cacheVistas.set(vista, vistaBlob)
  return { ...resto, vista, avance: 1 }
}
