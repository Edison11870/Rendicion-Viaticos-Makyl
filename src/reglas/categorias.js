// Propuesta de categoría y descripción para cada comprobante. Solo PROPONE: el usuario confirma o edita.
// Las descripciones siguen el estilo de las rendiciones de la empresa (mayúsculas, p. ej. «SERVICIO DE TAXI»).

export const CATEGORIAS = [
  { valor: 'movilidad', etiqueta: 'Movilidad', descripcion: 'SERVICIO DE TAXI' },
  { valor: 'alimentacion', etiqueta: 'Alimentación', descripcion: 'CONSUMO DE ALIMENTOS' },
  { valor: 'hospedaje', etiqueta: 'Hospedaje', descripcion: 'SERVICIO DE HOSPEDAJE' },
  { valor: 'otros', etiqueta: 'Otros', descripcion: 'OTROS GASTOS' },
]

// Palabras que delatan cada categoría (sobre el detalle, la razón social y el texto del comprobante).
// Límites de palabra propios: \b de JavaScript no reconoce letras con tilde ni la Ñ.
const LETRA = 'A-ZÁÉÍÓÚÜÑ'
const palabras = (lista) => new RegExp(`(?<![${LETRA}])(${lista.join('|')})(?![${LETRA}])`, 'g')

const REGLAS = [
  {
    categoria: 'hospedaje',
    descripcion: 'SERVICIO DE HOSPEDAJE',
    palabras: palabras(['HOSPEDAJE', 'HOTEL(?:ES)?', 'HOSTAL', 'HOSTEL', 'ALOJAMIENTO', 'HABITACI[OÓ]N', 'POSADA', 'SUITES?', 'NOCHES?']),
  },
  {
    categoria: 'movilidad',
    descripcion: 'PASAJE TERRESTRE',
    palabras: palabras(['PASAJES?', 'BOLETO DE VIAJE', '[OÓ]MNIBUS', 'CRUZ DEL SUR', 'OLTURSA', 'MOVIL BUS', 'TEPSA', 'CIVA', 'ITTSA']),
  },
  { categoria: 'movilidad', descripcion: 'PEAJE', palabras: palabras(['PEAJES?']) },
  {
    categoria: 'movilidad',
    descripcion: 'SERVICIO DE TAXI',
    palabras: palabras(['TAXIS?', 'MOVILIDAD', 'TRANSPORTES?', 'TRASLADOS?', 'CARRERA', 'COLECTIVO', 'UBER', 'CABIFY', 'DIDI', 'INDRIVE', 'REMISSE']),
  },
  {
    categoria: 'alimentacion',
    descripcion: 'CONSUMO DE ALIMENTOS',
    palabras: palabras([
      'CONSUMO', 'ALIMENT[A-ZÓ]*', 'MEN[UÚ]', 'ALMUERZOS?', 'CENAS?', 'DESAYUNOS?', 'RESTAURANTE?S?', 'RESTAURANT',
      'POLLER[IÍ]A', 'CEVICHER[IÍ]A', 'CHIFA', 'CAF[EÉ]', 'CAFETER[IÍ]A', 'CAPPUCCINO', 'COMIDAS?', 'EMPANADAS?',
      'SANDWICH', 'BEBIDAS?', 'AGUA', 'GASEOSAS?', 'JUGOS?', 'PANADER[IÍ]A', 'MARISCOS?', 'POLLO', 'BODEGA',
      'MINIMARKET', 'MARKET', 'SNACKS?', 'GALLETAS?', 'INTEGRAL',
    ]),
  },
]

/** La regla cuya palabra aparece primero en el texto (y la palabra encontrada). */
function primeraRegla(fuente) {
  let mejor = null
  for (const regla of REGLAS) {
    regla.palabras.lastIndex = 0
    const m = regla.palabras.exec(fuente)
    if (m && (!mejor || m.index < mejor.indice)) mejor = { regla, indice: m.index, palabra: m[0] }
  }
  return mejor
}

function sinTildesMayus(t) {
  return String(t || '').toUpperCase()
}

/** Primer ítem del detalle, limpio y en mayúsculas («Servicio De movilidad,Aeropuerto…» → «SERVICIO DE MOVILIDAD, AEROPUERTO…»). */
export function detalleComoDescripcion(detalle) {
  const primero = String(detalle || '').split(' · ')[0]
  return primero
    .toUpperCase()
    .replace(/_/g, '-')
    .replace(/,(?=\S)/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70)
}

/**
 * @param {{detalle?: string, razonSocial?: string, tipo?: string}} campos
 * @param {string} [texto] texto completo leído (opcional, para más pistas)
 * @returns {{categoria: string, descripcion: string, alternativa: string, motivo: string}}
 */
export function proponerClasificacion(campos, texto = '') {
  const detalle = sinTildesMayus(campos.detalle)
  const emisor = sinTildesMayus(campos.razonSocial)
  const pistas = [detalle, emisor, sinTildesMayus(texto)]

  let elegida = null
  let motivo = ''
  // primero el detalle (lo que se compró), luego la razón social, al final el texto completo
  for (const [i, fuente] of pistas.entries()) {
    const hallada = primeraRegla(fuente)
    if (hallada) {
      elegida = hallada.regla
      motivo = `«${hallada.palabra}» en ${['el detalle', 'la razón social', 'el comprobante'][i]}`
      break
    }
  }

  const categoria = elegida?.categoria ?? 'otros'
  const descripcion = elegida?.descripcion ?? (detalleComoDescripcion(campos.detalle) || 'OTROS GASTOS')
  // alternativa: el propio detalle cuando dice más que la descripción estándar
  // (p. ej. «SERVICIO DE TAXI AEROPUERTO - PLAYA LOS DELFINES»)
  const alt = detalleComoDescripcion(campos.detalle)
  const alternativa = categoria === 'movilidad' && alt && alt !== descripcion && alt.length > 3 ? alt : ''
  return { categoria, descripcion, alternativa, motivo: motivo || 'sin pistas claras' }
}
