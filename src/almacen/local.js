// Guardado en el navegador (localStorage). Nada sale del equipo.
// Si el navegador bloquea el almacenamiento (modo privado), la página sigue funcionando sin recordar datos.

const PREFIJO = 'rendicion-makyl:'

export function leer(clave, porDefecto) {
  try {
    const t = localStorage.getItem(PREFIJO + clave)
    return t ? { ...porDefecto, ...JSON.parse(t) } : porDefecto
  } catch {
    return porDefecto
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}

export function borrar(clave) {
  try {
    localStorage.removeItem(PREFIJO + clave)
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}
