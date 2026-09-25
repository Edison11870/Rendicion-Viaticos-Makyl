/** Pantalla provisional para los pasos que se construyen en las siguientes etapas. */
export default function PasoPendiente({ titulo, descripcion, etapa, onVolver }) {
  return (
    <div className="paso-contenido">
      <header className="paso-cabecera">
        <h1>{titulo}</h1>
        <p>{descripcion}</p>
      </header>
      <section className="tarjeta tarjeta--pendiente">
        <p>
          <strong>En construcción · Etapa {etapa}.</strong> Este paso se habilita en la siguiente versión de la página.
        </p>
      </section>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          ← Volver
        </button>
      </div>
    </div>
  )
}
