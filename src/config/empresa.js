// Datos fijos de la empresa, tal como salen en la Planilla de Movilidad y en los comprobantes.
// Son datos públicos (padrón de SUNAT); los datos del trabajador NO van aquí: se guardan en el navegador.
export const EMPRESA = {
  razonSocial: 'Makyl Engineering Consulting Services EIRL',
  razonSocialComprobante: 'MAKYL ENGINEERING CONSULTING SERVICES E.I.R.L.',
  ruc: '20523643534',
}

// Valores por defecto de los parámetros configurables.
export const PARAMETROS_POR_DEFECTO = {
  rmv: 1130, // Remuneración Mínima Vital (S/). Verificar el valor vigente.
  topeMovilidadPct: 4, // % de la RMV por día (planilla de movilidad)
  excesoMaximo: 50, // S/ que se acepta rendir por encima del monto recibido
}

export const FORMAS_ENTREGA = [
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'cheque', etiqueta: 'Cheque' },
]
