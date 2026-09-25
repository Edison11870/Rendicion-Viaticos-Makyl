import { useRef, useState } from 'react'

/** Zona para arrastrar y soltar (o elegir) varios PDF / fotos a la vez. */
export default function ZonaCarga({ onArchivos }) {
  const [encima, setEncima] = useState(false)
  const elegir = useRef(null)
  const camara = useRef(null)

  function recibir(lista) {
    const archivos = [...(lista || [])]
    if (archivos.length) onArchivos(archivos)
  }

  return (
    <div
      className={`zona ${encima ? 'zona--encima' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setEncima(true)
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault()
        setEncima(false)
        recibir(e.dataTransfer.files)
      }}
    >
      <p className="zona__titulo">Arrastra aquí tus comprobantes</p>
      <p className="zona__sub">PDF o fotos (JPG, PNG) · varios a la vez · se leen en tu equipo</p>
      <div className="zona__botones">
        <button type="button" className="boton boton--primario" onClick={() => elegir.current?.click()}>
          Elegir archivos
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => camara.current?.click()}>
          Tomar foto
        </button>
      </div>
      <input
        ref={elegir}
        type="file"
        multiple
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => {
          recibir(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          recibir(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
