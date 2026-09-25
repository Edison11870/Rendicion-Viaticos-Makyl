// Reconstruye líneas de texto a partir de los fragmentos que devuelve pdf.js
// (cada fragmento trae su texto y su posición). Agrupa por altura y ordena de izquierda a derecha,
// para que "Importe Total : S/ 20.00" quede en una sola línea aunque el PDF lo guarde en pedazos.

/**
 * @param {{str: string, transform: number[], width?: number, height?: number}[]} items
 * @returns {string} texto con una línea por renglón visual
 */
export function lineasDesdeItems(items) {
  const frag = items
    .filter((it) => it.str && it.str.trim())
    .map((it) => ({
      texto: it.str,
      x: it.transform[4],
      y: it.transform[5],
      alto: Math.abs(it.height || it.transform[3] || 8),
      ancho: it.width || 0,
    }))
  // de arriba hacia abajo (en PDF la y crece hacia arriba)
  frag.sort((a, b) => b.y - a.y || a.x - b.x)

  const renglones = []
  for (const f of frag) {
    const tol = Math.max(2, f.alto * 0.45)
    const r = renglones.find((r) => Math.abs(r.y - f.y) <= tol)
    if (r) r.frag.push(f)
    else renglones.push({ y: f.y, frag: [f] })
  }
  renglones.sort((a, b) => b.y - a.y)

  return renglones
    .map((r) => {
      r.frag.sort((a, b) => a.x - b.x)
      let linea = ''
      let finAnterior = null
      for (const f of r.frag) {
        if (finAnterior !== null) {
          const hueco = f.x - finAnterior
          linea += hueco > f.alto * 1.5 ? '   ' : hueco > f.alto * 0.15 ? ' ' : ''
        }
        linea += f.texto
        finAnterior = f.x + f.ancho
      }
      return linea.replace(/\s+$/, '')
    })
    .join('\n')
}
