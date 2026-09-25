import { useEffect, useRef } from 'react'

/** Barra de pasos del asistente. En celular se desplaza horizontalmente y sigue al paso actual. */
export default function Pasos({ pasos, actual, habilitado, onIr }) {
  const nav = useRef(null)
  useEffect(() => {
    const el = nav.current?.querySelector('[aria-current="step"]')
    if (el && nav.current.scrollWidth > nav.current.clientWidth) {
      nav.current.scrollTo({ left: el.offsetLeft - nav.current.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
    }
  }, [actual])
  return (
    <nav className="pasos" aria-label="Pasos de la rendición" ref={nav}>
      <ol>
        {pasos.map((p, i) => {
          const estado = i === actual ? 'actual' : i < actual ? 'hecho' : 'pendiente'
          return (
            <li key={p.id} className={`paso paso--${estado}`}>
              <button
                type="button"
                onClick={() => onIr(i)}
                disabled={!habilitado(i)}
                aria-current={i === actual ? 'step' : undefined}
              >
                <span className="paso__num">{i + 1}</span>
                <span className="paso__nombre">{p.titulo}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
