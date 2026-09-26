// Propuesta de categoría y descripción para cada comprobante. Solo PROPONE: el usuario confirma o edita.
// Las descripciones siguen el estilo de las rendiciones de la empresa (mayúsculas, p. ej. «SERVICIO DE TAXI»).

export const CATEGORIAS = [
  { valor: 'movilidad', etiqueta: 'Movilidad (taxi, colectivo)', descripcion: 'SERVICIO DE TAXI' },
  { valor: 'pasajes', etiqueta: 'Pasajes (bus, avión)', descripcion: 'PASAJE TERRESTRE' },
  { valor: 'alimentacion', etiqueta: 'Alimentación', descripcion: 'CONSUMO DE ALIMENTOS' },
  { valor: 'hospedaje', etiqueta: 'Hospedaje', descripcion: 'SERVICIO DE HOSPEDAJE' },
  { valor: 'combustible', etiqueta: 'Combustible', descripcion: 'COMBUSTIBLE' },
  { valor: 'peajes', etiqueta: 'Peajes y estacionamiento', descripcion: 'PEAJE' },
  { valor: 'materiales', etiqueta: 'Materiales y útiles', descripcion: 'MATERIALES Y ÚTILES' },
  { valor: 'epp', etiqueta: 'Equipos de protección (EPP)', descripcion: 'EQUIPO DE PROTECCIÓN PERSONAL' },
  { valor: 'salud', etiqueta: 'Salud y medicinas', descripcion: 'MEDICAMENTOS' },
  { valor: 'comunicaciones', etiqueta: 'Comunicaciones (recargas, internet)', descripcion: 'RECARGA TELEFÓNICA' },
  { valor: 'impresiones', etiqueta: 'Impresiones y copias', descripcion: 'IMPRESIONES Y FOTOCOPIAS' },
  { valor: 'envios', etiqueta: 'Envíos y courier', descripcion: 'SERVICIO DE COURIER' },
  { valor: 'lavanderia', etiqueta: 'Lavandería', descripcion: 'SERVICIO DE LAVANDERÍA' },
  { valor: 'otros', etiqueta: 'Otros', descripcion: 'OTROS GASTOS' },
]

// Palabras que delatan cada categoría (sobre el detalle, la razón social y el texto del comprobante).
// Si en un mismo texto aparecen palabras de varias categorías, gana la que aparece primero.
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
    categoria: 'pasajes',
    descripcion: 'PASAJE AÉREO',
    palabras: palabras(['PASAJE A[EÉ]REO', 'BOLETO A[EÉ]REO', 'LATAM', 'SKY AIRLINE', 'JETSMART', 'STAR PER[UÚ]', 'VUELO', 'TUUA']),
  },
  {
    categoria: 'pasajes',
    descripcion: 'PASAJE TERRESTRE',
    palabras: palabras(['PASAJES?', 'BOLETO DE VIAJE', '[OÓ]MNIBUS', 'CRUZ DEL SUR', 'OLTURSA', 'MOVIL BUS', 'TEPSA', 'CIVA', 'ITTSA', 'LINEA S\\.?A\\.?C', 'EMTRAFESA']),
  },
  { categoria: 'peajes', descripcion: 'PEAJE', palabras: palabras(['PEAJES?', 'RUTAS DE LIMA', 'L[IÍ]NEA AMARILLA']) },
  { categoria: 'peajes', descripcion: 'ESTACIONAMIENTO', palabras: palabras(['ESTACIONAMIENTO', 'PARKING', 'COCHERA']) },
  {
    categoria: 'combustible',
    descripcion: 'COMBUSTIBLE',
    palabras: palabras(['COMBUSTIBLES?', 'GASOLINA', 'GASOHOL', 'DIESEL', 'D[IÍ]ESEL B5', 'GLP', 'GNV', 'GRIFO', 'PRIMAX', 'REPSOL', 'PETROPER[UÚ]', 'PECSA']),
  },
  {
    categoria: 'movilidad',
    descripcion: 'SERVICIO DE TAXI',
    palabras: palabras(['TAXIS?', 'MOVILIDAD', 'TRANSPORTES?', 'TRASLADOS?', 'CARRERA', 'COLECTIVO', 'UBER', 'CABIFY', 'DIDI', 'INDRIVE', 'REMISSE']),
  },
  {
    categoria: 'epp',
    descripcion: 'EQUIPO DE PROTECCIÓN PERSONAL',
    palabras: palabras(['EPP', 'CASCOS?', 'GUANTES?', 'LENTES DE SEGURIDAD', 'BOTAS?', 'BOTINES?', 'CHALECOS?', 'RESPIRADOR(?:ES)?', 'TAPONES', 'BARBIQUEJO', 'ARN[EÉ]S', 'MASCARILLAS?']),
  },
  {
    categoria: 'salud',
    descripcion: 'MEDICAMENTOS',
    palabras: palabras(['FARMACIA', 'BOTICA', 'INKAFARMA', 'MIFARMA', 'MEDICAMENTOS?', 'PARACETAMOL', 'IBUPROFENO', 'CONSULTA M[EÉ]DICA', 'CL[IÍ]NICA', 'SOROCHE', 'SOROJCHI']),
  },
  {
    categoria: 'comunicaciones',
    descripcion: 'RECARGA TELEFÓNICA',
    palabras: palabras(['RECARGAS?', 'CHIP', 'INTERNET', 'CLARO', 'MOVISTAR', 'ENTEL', 'BITEL', 'PLAN DE DATOS']),
  },
  {
    categoria: 'impresiones',
    descripcion: 'IMPRESIONES Y FOTOCOPIAS',
    palabras: palabras(['FOTOCOPIAS?', 'IMPRESI[OÓ]N(?:ES)?', 'PLOTEO', 'PLOTEOS', 'ANILLADO', 'ESCANEO', 'SCANEO']),
  },
  {
    categoria: 'envios',
    descripcion: 'SERVICIO DE COURIER',
    palabras: palabras(['COURIER', 'OLVA', 'SHALOM', 'SERPOST', 'ENCOMIENDAS?', 'ENV[IÍ]OS?']),
  },
  { categoria: 'lavanderia', descripcion: 'SERVICIO DE LAVANDERÍA', palabras: palabras(['LAVANDER[IÍ]A', 'LAVADO DE ROPA', 'PLANCHADO']) },
  {
    categoria: 'materiales',
    descripcion: 'MATERIALES Y ÚTILES',
    palabras: palabras([
      'FERRETER[IÍ]A', 'MATERIALES', 'MATERIAL', '[UÚ]TILES', 'LIBRER[IÍ]A', 'CINTA', 'PILAS?', 'BATER[IÍ]AS?', 'PINTURA',
      'SPRAY', 'MARCADOR(?:ES)?', 'PLUM[OÓ]N(?:ES)?', 'CUADERNO', 'LAPICEROS?', 'WINCHA', 'TORNILLOS?', 'PERNOS?',
    ]),
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
  const alternativa = (categoria === 'movilidad' || categoria === 'pasajes') && alt && alt !== descripcion && alt.length > 3 ? alt : ''
  return { categoria, descripcion, alternativa, motivo: motivo || 'sin pistas claras' }
}
