/** Barra de pasos del asistente. En celular se desplaza horizontalmente. */
export default function Pasos({ pasos, actual, habilitado, onIr }) {
  return (
    <nav className="pasos" aria-label="Pasos de la rendición">
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
