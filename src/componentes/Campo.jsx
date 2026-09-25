import { useId } from 'react'

/** Campo de formulario con etiqueta, ayuda y mensaje de error. */
export default function Campo({ etiqueta, ayuda, error, ancho, children, render }) {
  const id = useId()
  const describe = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined
  return (
    <div className={`campo ${ancho ? `campo--${ancho}` : ''} ${error ? 'campo--error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {render ? render({ id, 'aria-describedby': describe, 'aria-invalid': !!error }) : children}
      {error ? (
        <p className="campo__error" id={`${id}-error`}>
          {error}
        </p>
      ) : ayuda ? (
        <p className="campo__ayuda" id={`${id}-ayuda`}>
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}
