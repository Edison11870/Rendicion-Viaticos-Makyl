import { TIPOS } from '../reglas/comprobantes.js'
import { textoSaldo } from '../reglas/rendicion.js'
import { isoADmy, soles } from '../util/formato.js'

const ETIQUETA_TIPO = Object.fromEntries(TIPOS.map((t) => [t.valor, t.etiqueta]))

/** Paso 5: combinación que cubre el monto recibido con el menor exceso (prefiere comprobantes). */
export default function PasoSeleccion({ cand, sel, forzados, setForzados, onVolver, onContinuar }) {
  const todos = [...cand.comprobantes, ...cand.planillas].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  const usados = todos.filter((x) => sel.ids.has(x.id))
  const noUsados = todos.filter((x) => !sel.ids.has(x.id))

  function forzar(id, valor) {
    setForzados((f) => {
      const n = { ...f }
      if (valor) n[id] = valor
      else delete n[id]
      return n
    })
  }

  const saldo = sel.diferencia
  const hayForzados = Object.keys(forzados).length > 0

  return (
    <div className="paso-contenido">
      <header className="paso-cabecera">
        <h1>Selección</h1>
        <p>
          Se eligió la combinación que <strong>cubre el monto recibido</strong> usando primero facturas y boletas, y
          excediendo lo menos posible. Puedes forzar a meter o sacar cualquiera.
        </p>
      </header>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi__etiqueta">Monto recibido</span>
          <span className="kpi__valor">{soles(sel.presupuesto)}</span>
        </div>
        <div className="kpi">
          <span className="kpi__etiqueta">Total rendido</span>
          <span className="kpi__valor kpi__valor--azul">{soles(sel.total)}</span>
        </div>
        <div className={`kpi ${!sel.cubre ? 'kpi--error' : ''}`}>
          <span className="kpi__etiqueta">Saldo ({textoSaldo(saldo)})</span>
          <span className="kpi__valor">{soles(Math.abs(saldo))}</span>
        </div>
        <div className={`kpi ${sel.cubre && !sel.dentroDelMaximo ? 'kpi--aviso' : ''}`}>
          <span className="kpi__etiqueta">Exceso (máx. {soles(sel.excesoMaximo)})</span>
          <span className="kpi__valor">{sel.cubre ? soles(sel.exceso) : '—'}</span>
        </div>
      </div>

      {!sel.cubre && (
        <p className="aviso aviso--error" role="alert">
          Con los comprobantes y planillas disponibles no se llega al monto recibido: quedan {soles(saldo)} por devolver.
          Revisa si falta algún comprobante o agrega gastos sin comprobante.
        </p>
      )}
      {sel.cubre && !sel.dentroDelMaximo && (
        <p className="aviso aviso--error" role="alert">
          Ninguna combinación queda dentro del exceso máximo; esta es la de menor exceso ({soles(sel.exceso)}).
        </p>
      )}
      {sel.montoPlanillas > 0 && (
        <p className="aviso aviso--info">
          Se usan {soles(sel.montoPlanillas)} en planillas: con los comprobantes solos no alcanzaba.
        </p>
      )}

      <section className="tarjeta" aria-labelledby="t-usados">
        <div className="tarjeta__titulo">
          <h2 id="t-usados">Entran en la rendición ({usados.length})</h2>
          {hayForzados && (
            <button type="button" className="boton boton--texto" onClick={() => setForzados({})}>
              Quitar cambios manuales
            </button>
          )}
        </div>
        <ListaItems items={usados} forzados={forzados} onForzar={forzar} usado />
      </section>

      <section className="tarjeta" aria-labelledby="t-no-usados">
        <h2 id="t-no-usados">No se usan ({noUsados.length})</h2>
        {noUsados.length ? (
          <>
            <p className="nota">Quedan guardados como «no utilizados» para otra rendición.</p>
            <ListaItems items={noUsados} forzados={forzados} onForzar={forzar} />
          </>
        ) : (
          <p className="nota">Se usan todos.</p>
        )}
      </section>

      {cand.dolares.length > 0 && (
        <p className="nota">
          {cand.dolares.length} comprobante(s) en dólares no entran al cálculo en soles; se pueden agregar desde
          «Revisión» si corresponde.
        </p>
      )}

      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          ← Movilidad
        </button>
        <button type="button" className="boton boton--primario" onClick={onContinuar} disabled={usados.length === 0}>
          Continuar a resultado →
        </button>
      </div>
    </div>
  )
}

function ListaItems({ items, forzados, onForzar, usado }) {
  return (
    <ul className="seleccion">
      {items.map((x) => {
        const f = forzados[x.id]
        const esPlanilla = x.tipo === 'planilla'
        const titulo = esPlanilla ? `Planilla de movilidad del ${isoADmy(x.fecha)}` : x.c.campos.documento || x.c.nombreArchivo
        const sub = esPlanilla
          ? x.p.lineas.map((g) => g.motivo).join(', ')
          : `${ETIQUETA_TIPO[x.c.campos.tipo] || ''} · ${x.c.clasificacion?.descripcion || ''} · ${x.c.campos.razonSocial || ''}`
        return (
          <li key={x.id} className={`seleccion__item ${esPlanilla ? 'seleccion__item--planilla' : ''}`}>
            <div className="seleccion__texto">
              <strong>{titulo}</strong>
              <span>
                {isoADmy(x.fecha)} · {sub}
              </span>
              {f && <small className="seleccion__forzado">{f === 'si' ? 'Forzado a entrar' : 'Forzado a quedar fuera'}</small>}
            </div>
            <span className="seleccion__monto">{soles(x.monto)}</span>
            <div className="seleccion__acciones">
              {f ? (
                <button type="button" className="boton boton--texto" onClick={() => onForzar(x.id, null)}>
                  Automático
                </button>
              ) : usado ? (
                <button type="button" className="boton boton--texto boton--peligro" onClick={() => onForzar(x.id, 'no')}>
                  Sacar
                </button>
              ) : (
                <button type="button" className="boton boton--texto" onClick={() => onForzar(x.id, 'si')}>
                  Meter
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
