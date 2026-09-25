import { useEffect, useState } from 'react'
import { aCentimos, centimosATexto } from '../util/formato.js'

/** Entrada de monto en soles; guarda céntimos al salir del campo. */
export default function CampoMonto({ valor, onCambio, ...resto }) {
  const [texto, setTexto] = useState(valor === null || valor === undefined ? '' : centimosATexto(valor))
  useEffect(() => {
    setTexto(valor === null || valor === undefined ? '' : centimosATexto(valor))
  }, [valor])
  return (
    <input
      {...resto}
      inputMode="decimal"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        const c = aCentimos(texto)
        if (c !== valor) onCambio(c)
        else setTexto(c === null ? '' : centimosATexto(c))
      }}
    />
  )
}
