import { useState } from 'react'
import CampoMonto from '../componentes/CampoMonto.jsx'
import VistaPlanilla from '../componentes/VistaPlanilla.jsx'
import {
  CATEGORIAS_PLANILLA,
  agruparPorDia,
  alertasGasto,
  alertasPlanilla,
  destinoPlanilla,
  gastoVacio,
  nombrePlanilla,
} from '../reglas/movilidad.js'
import { topeDiarioMovilidad } from '../reglas/viaje.js'
import { centimosATexto, isoADmy, soles } from '../util/formato.js'

/** Paso 4: gastos sin comprobante → Planilla de Movilidad Diaria (opcional). */
export default function PasoMovilidad({ gastos, setGastos, comprobantes, viaje, trabajador, onVolver, onContinuar }) {
  const [editando, setEditando] = useState(null) // gasto en edición (nuevo o existente)
  const [vista, setVista] = useState(null) // id de planilla en vista previa
  const evidencias = comprobantes.lista.filter((c) => c.estado === 'listo' && c.campos?.tipo === 'evidencia')
  const planillas = agruparPorDia(gastos)
  const tope = topeDiarioMovilidad(trabajador)

  function guardarGasto(g) {
    setGastos((lista) => (lista.some((x) => x.id === g.id) ? lista.map((x) => (x.id === g.id ? g : x)) : [...lista, g]))
    setEditando(null)
  }

  return (
    <div className="paso-contenido">
      <header className="paso-cabecera">
        <h1>Movilidad sin comprobante</h1>
        <p>
          Taxis (y comidas) que no dieron comprobante. Se arma una <strong>Planilla de Movilidad Diaria</strong> por día.
          Este paso es opcional: la selección usará primero tus facturas y boletas.
        </p>
      </header>

      <div className="aviso aviso--info">
        <span>
          Tope diario: <strong>{soles(tope)}</strong> ({trabajador.topeMovilidadPct} % de la RMV de {soles(Math.round(Number(trabajador.rmv) * 100))}).
          Si un día lo supera, se avisa pero no se bloquea.
        </span>
        {!editando && (
          <button type="button" className="boton boton--primario" onClick={() => setEditando(gastoVacio(viaje.fechaSalida))}>
            + Agregar gasto
          </button>
        )}
      </div>

      {editando && (
        <FormGasto
          gasto={editando}
          viaje={viaje}
          evidencias={evidencias}
          onSubirEvidencia={(archivos) => comprobantes.agregar(archivos)}
          onGuardar={guardarGasto}
          onCancelar={() => setEditando(null)}
        />
      )}

      {planillas.length === 0 && !editando && (
        <section className="tarjeta">
          <p className="nota">Aún no hay gastos sin comprobante. Si no los tienes, continúa a la selección.</p>
        </section>
      )}

      {planillas.map((p) => {
        const alertas = alertasPlanilla(p, viaje, trabajador)
        return (
          <section key={p.id} className="tarjeta planilla-dia" aria-labelledby={`t-${p.id}`}>
            <div className="tarjeta__titulo">
              <h2 id={`t-${p.id}`}>
                {nombrePlanilla(p.numero)} · {isoADmy(p.fecha)}
              </h2>
              <strong className={p.total > tope ? 'monto monto--alerta' : 'monto'}>{soles(p.total)}</strong>
            </div>
            <div className="tope" aria-hidden="true">
              <div className={`tope__barra ${p.total > tope ? 'tope__barra--pasa' : ''}`} style={{ width: `${Math.min(100, (p.total / Math.max(tope, 1)) * 100)}%` }} />
            </div>
            {alertas.length > 0 && (
              <ul className="alertas">
                {alertas.map((a, i) => (
                  <li key={i} className={`alerta alerta--${a.nivel}`}>
                    {a.nivel === 'error' ? '⛔' : '⚠'} {a.mensaje}
                  </li>
                ))}
              </ul>
            )}
            <ul className="lineas">
              {p.lineas.map((g) => {
                const ag = alertasGasto(g, viaje).filter((a) => a.nivel !== 'info')
                return (
                  <li key={g.id} className="linea">
                    <div className="linea__texto">
                      <strong>{g.motivo}</strong>
                      <span>{destinoPlanilla(g) || 'sin destino'}</span>
                      {ag.length > 0 && <small className="linea__alertas">{ag.map((a) => a.mensaje).join(' · ')}</small>}
                      {g.evidencias?.length > 0 && (
                        <small>
                          📎 {g.evidencias.length} {g.evidencias.length === 1 ? 'evidencia' : 'evidencias'}
                        </small>
                      )}
                    </div>
                    <span className="linea__monto">{centimosATexto(g.monto)}</span>
                    <div className="linea__acciones">
                      <button type="button" className="boton boton--texto" onClick={() => setEditando(g)}>
                        Editar
                      </button>
                      <button type="button" className="boton boton--texto boton--peligro" onClick={() => setGastos((l) => l.filter((x) => x.id !== g.id))}>
                        Quitar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="revision__acciones">
              <button type="button" className="boton boton--secundario boton--chico" onClick={() => setEditando(gastoVacio(p.fecha))}>
                + Otra línea este día
              </button>
              <button type="button" className="boton boton--texto" onClick={() => setVista(vista === p.id ? null : p.id)} aria-expanded={vista === p.id}>
                {vista === p.id ? 'Ocultar planilla' : 'Ver planilla'}
              </button>
            </div>
            {vista === p.id && <VistaPlanilla planilla={p} trabajador={trabajador} fechaEmision={viaje.fechaRendicion} numero={p.numero} />}
          </section>
        )
      })}

      {planillas.length > 0 && (
        <p className="nota">
          La numeración es provisional: al final solo se numeran las planillas que entren en la rendición.
        </p>
      )}

      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          ← Revisión
        </button>
        <button type="button" className="boton boton--primario" onClick={onContinuar} disabled={!!editando}>
          Continuar a selección →
        </button>
      </div>
    </div>
  )
}

function FormGasto({ gasto, viaje, evidencias, onSubirEvidencia, onGuardar, onCancelar }) {
  const [g, setG] = useState(gasto)
  const [intento, setIntento] = useState(false)
  const errores = alertasGasto(g, viaje).filter((a) => a.nivel === 'error')
  const cambiar = (campo) => (e) => setG({ ...g, [campo]: e.target.value })

  function guardar(e) {
    e.preventDefault()
    setIntento(true)
    if (!errores.length) onGuardar(g)
  }

  function alternarEvidencia(id) {
    const ev = g.evidencias || []
    setG({ ...g, evidencias: ev.includes(id) ? ev.filter((x) => x !== id) : [...ev, id] })
  }

  return (
    <form className="tarjeta form-gasto" onSubmit={guardar} noValidate aria-label="Gasto sin comprobante">
      <div className="tarjeta__titulo">
        <h2>{gasto.monto === null ? 'Nuevo gasto sin comprobante' : 'Editar gasto'}</h2>
      </div>
      <div className="rejilla">
        <label className="campo campo--cuarto">
          <span className="campo__etiqueta">Fecha</span>
          <input type="date" value={g.fecha} min={viaje.fechaSalida || undefined} max={viaje.fechaRetorno || undefined} onChange={cambiar('fecha')} />
        </label>
        <label className="campo campo--cuarto">
          <span className="campo__etiqueta">Tipo de gasto</span>
          <select
            value={g.categoria}
            onChange={(e) => {
              const cat = CATEGORIAS_PLANILLA.find((c) => c.valor === e.target.value)
              const motivoTipico = CATEGORIAS_PLANILLA.some((c) => c.motivo === g.motivo)
              setG({ ...g, categoria: cat.valor, motivo: motivoTipico || !g.motivo ? cat.motivo : g.motivo })
            }}
          >
            {CATEGORIAS_PLANILLA.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="campo campo--medio">
          <span className="campo__etiqueta">Motivo</span>
          <input value={g.motivo} onChange={cambiar('motivo')} placeholder="Servicio de Taxi" />
        </label>
        <label className="campo campo--medio">
          <span className="campo__etiqueta">Origen</span>
          <input value={g.origen} onChange={cambiar('origen')} placeholder="San Juan de Lurigancho" />
        </label>
        <label className="campo campo--medio">
          <span className="campo__etiqueta">Destino</span>
          <input value={g.destino} onChange={cambiar('destino')} placeholder="Aeropuerto Jorge Chávez" />
        </label>
        <label className="campo campo--cuarto">
          <span className="campo__etiqueta">Monto (S/)</span>
          <CampoMonto valor={g.monto} onCambio={(v) => setG({ ...g, monto: v })} placeholder="0.00" />
        </label>
      </div>

      <fieldset className="evidencias-form">
        <legend>Evidencia (opcional): captura de Yape/Plin o de la app de taxi</legend>
        {evidencias.length === 0 && <p className="nota">No hay capturas cargadas. Puedes subirlas aquí o en «Comprobantes».</p>}
        <ul className="evidencias">
          {evidencias.map((c) => (
            <li key={c.id}>
              <label className={`evidencia-opcion ${g.evidencias?.includes(c.id) ? 'evidencia-opcion--elegida' : ''}`}>
                <input type="checkbox" checked={g.evidencias?.includes(c.id) || false} onChange={() => alternarEvidencia(c.id)} />
                <img src={c.vista} alt="" />
                <span className="miniatura__nombre">{c.nombreArchivo}</span>
              </label>
            </li>
          ))}
        </ul>
        <label className="boton boton--secundario boton--chico boton--archivo">
          Subir captura
          <input type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => { onSubirEvidencia([...e.target.files]); e.target.value = '' }} />
        </label>
      </fieldset>

      {intento && errores.length > 0 && (
        <p className="aviso aviso--error" role="alert">
          {errores.map((a) => a.mensaje).join(' ')}
        </p>
      )}
      <div className="acciones">
        <button type="button" className="boton boton--texto" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton--primario">
          Guardar gasto
        </button>
      </div>
    </form>
  )
}
