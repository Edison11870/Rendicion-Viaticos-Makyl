// Medidas del formato oficial «Rendición de Gastos», tomadas del Excel de la empresa
// (ver templates/formato-rendicion.md). Las usan el Excel y el PDF, para que ambos salgan iguales.

export const HOJA_RENDICION = 'RENDICION-MARCOBRE'
export const FILAS_DETALLE = 39 // filas 14 a 52
export const FILA_PRIMER_DETALLE = 14

// ancho de columnas A–F en caracteres de Excel
export const ANCHOS = [10, 13.57, 15.29, 51.29, 13.14, 11.43]

// alto (pt) de las filas fijas; las no listadas usan 15 pt
export const ALTOS = {
  4: 15, 5: 13.5, 6: 15, 7: 4.5, 8: 15, 9: 5.25, 10: 15, 11: 16.5, 12: 18, 13: 15,
}
// filas del pie, relativas a la fila del total (53 en el formato de 39 filas)
export const ALTOS_PIE = { 0: 15.75, 1: 9, 2: 14.25, 3: 0, 4: 15.75, 5: 0, 6: 21, 7: 21, 8: 14.25 }
export const ALTO_DETALLE = 15
export const ALTO_ULTIMO_DETALLE = 15.75

export const PAGINA = {
  papel: 9, // A4
  escala: 83,
  margenes: { left: 0.5118, right: 0.1181, top: 0.1575, bottom: 0.3543, header: 0, footer: 0 },
}

// logo anclado de B1 (+151/1024 del ancho) a D5 (+142/256 del alto)
export const LOGO = { desde: { col: 1 + 151 / 1024, row: 0 }, hasta: { col: 3 + 14 / 1024, row: 4 + 142 / 256 } }

export const FORMATO_SOLES = '_-[$S/-280A]\\ * #,##0.00_-;\\-[$S/-280A]\\ * #,##0.00_-;_-[$S/-280A]\\ * "-"??_-;_-@_-'
export const FORMATO_DOLARES = '"S/."#,##0.00;[Red]"S/."\\-#,##0.00'
export const FORMATO_FECHA = 'dd/mm/yyyy'

/** Posición de cada parte según cuántas filas de detalle hacen falta (mínimo 39, como el formato). */
export function disposicion(nFilas) {
  const n = Math.max(FILAS_DETALLE, nFilas)
  const ultimoDetalle = FILA_PRIMER_DETALLE + n - 1
  const total = ultimoDetalle + 1
  return {
    n,
    ultimoDetalle,
    total,
    saldos: total + 2,
    fechaRendicion: total + 4,
    entrega: total + 6,
    recibe: total + 7,
    fin: total + 8,
  }
}

/** Ancho de columna de Excel (caracteres, Calibri 11) → puntos. */
export function anchoEnPuntos(caracteres) {
  const px = Math.trunc(((256 * caracteres + Math.trunc(128 / 7)) / 256) * 7)
  return px * 0.75
}
