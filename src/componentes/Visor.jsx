import { useEffect, useRef } from 'react'

/** Ventana con el comprobante en grande, para comparar con lo leído. */
export default function Visor({ comprobante, onCerrar, children }) {
  const dialogo = useRef(null)
  useEffect(() => {
    const d = dialogo.current
    if (d && !d.open) d.showModal()
  }, [])
  return (
    <dialog ref={dialogo} className="visor" onClose={onCerrar} onClick={(e) => e.target === dialogo.current && onCerrar()}>
      <div className="visor__marco">
        <header className="visor__cabecera">
          <strong>{comprobante.nombreArchivo}</strong>
          <button type="button" className="boton boton--texto" onClick={onCerrar} aria-label="Cerrar">
            ✕ Cerrar
          </button>
        </header>
        <div className="visor__cuerpo">
          <div className="visor__imagen">
            {comprobante.vista ? <img src={comprobante.vista} alt={`Comprobante ${comprobante.nombreArchivo}`} /> : <p>Sin vista previa.</p>}
          </div>
          <div className="visor__campos">{children}</div>
        </div>
      </div>
    </dialog>
  )
}
