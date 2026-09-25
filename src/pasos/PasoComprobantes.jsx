import { useState } from 'react'
import TablaComprobantes, { COLUMNAS, CampoComprobante } from '../componentes/TablaComprobantes.jsx'
import Visor from '../componentes/Visor.jsx'
import ZonaCarga from '../componentes/ZonaCarga.jsx'
import { resumen } from '../reglas/comprobantes.js'
import { soles } from '../util/formato.js'

/** Paso 2: carga de comprobantes, lectura automática y corrección en tabla. */
export default function PasoComprobantes({ comprobantes, onVolver, onContinuar }) {
  const { lista, agregar, quitar, editar, reintentar, guardados, recuperarGuardados } = comprobantes
  const [rechazados, setRechazados] = useState([])
  const [viendo, setViendo] = useState(null)
  const r = resumen(lista)


  const comprobantesLista = lista.filter((c) => c.estado !== 'listo' || c.campos.esComprobante)
  const evidencias = lista.filter((c) => c.estado === 'listo' && !c.campos.esComprobante)
  const cVisor = lista.find((c) => c.id === viendo)

  return (
    <div className="paso-contenido paso-contenido--ancho">
      <header className="paso-cabecera">
        <h1>Comprobantes</h1>
        <p>Sube todos los comprobantes del viaje. Revisa lo leído y corrige lo marcado en naranja.</p>
      </header>

      <ZonaCarga onArchivos={(a) => setRechazados(agregar(a))} />
      {guardados > 0 && (
        <div className="aviso aviso--info">
          <span>
            Tienes <strong>{guardados}</strong> comprobante(s) guardados de otra rendición (no utilizados).
          </span>
          <button type="button" className="boton boton--secundario" onClick={recuperarGuardados}>
            Traerlos a esta rendición
          </button>
        </div>
      )}
      {rechazados.length > 0 && (
        <p className="aviso aviso--error" role="alert">
          No se aceptaron (formato no soportado): {rechazados.join(', ')}
        </p>
      )}

      {lista.length > 0 && (
        <div className="cifras" aria-live="polite">
          <span>
            <strong>{r.comprobantes}</strong> comprobantes
          </span>
          {r.pendientes > 0 && (
            <span>
              <strong>{r.pendientes}</strong> por leer
            </span>
          )}
          {r.conDudas > 0 && (
            <span className="cifras--duda">
              <strong>{r.conDudas}</strong> con datos por revisar
            </span>
          )}
          {r.errores > 0 && (
            <span className="cifras--error">
              <strong>{r.errores}</strong> con error
            </span>
          )}
          {r.evidencias > 0 && (
            <span>
              <strong>{r.evidencias}</strong> evidencias
            </span>
          )}
          <span className="cifras__suma">
            Suma: <strong>{soles(r.suma)}</strong>
          </span>
        </div>
      )}

      {comprobantesLista.length > 0 && (
        <TablaComprobantes lista={comprobantesLista} onEditar={editar} onQuitar={quitar} onVer={setViendo} onReintentar={reintentar} />
      )}

      {evidencias.length > 0 && (
        <section className="tarjeta" aria-labelledby="t-evidencias">
          <h2 id="t-evidencias">Evidencias y constancias (no son comprobantes)</h2>
          <p className="nota">
            Capturas de Yape/Plin o de apps de taxi (sustentan la Planilla de Movilidad) y la constancia del depósito que
            recibiste (va al final del PDF). Si alguna sí es un comprobante, cambia su tipo.
          </p>
          <ul className="evidencias">
            {evidencias.map((c) => (
              <li key={c.id}>
                <button type="button" className="miniatura" onClick={() => setViendo(c.id)}>
                  <img src={c.vista} alt="" />
                  <span className="miniatura__nombre">{c.nombreArchivo}</span>
                </button>
                <CampoComprobante c={c} campo="tipo" onEditar={editar} compacto />
                <button type="button" className="boton boton--texto boton--peligro" onClick={() => quitar(c.id)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cVisor && (
        <Visor comprobante={cVisor} onCerrar={() => setViendo(null)}>
          {cVisor.campos && (cVisor.campos.esComprobante ? COLUMNAS : ['tipo']).map((k) => (
            <CampoComprobante key={k} c={cVisor} campo={k} onEditar={editar} />
          ))}
          {cVisor.campos?.detalle && (
            <p className="nota">
              <strong>Detalle leído:</strong> {cVisor.campos.detalle}
            </p>
          )}
        </Visor>
      )}

      {lista.length > 0 && (
        <p className="nota">Los archivos se guardan solo en este navegador; si recargas la página, siguen aquí.</p>
      )}

      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          ← Viaje
        </button>
        <button type="button" className="boton boton--primario" onClick={onContinuar} disabled={r.pendientes > 0 || r.comprobantes === 0}>
          Continuar a revisión →
        </button>
      </div>
    </div>
  )
}
