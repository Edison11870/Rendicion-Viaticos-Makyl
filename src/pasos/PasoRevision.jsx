import { useMemo, useState } from 'react'
import { COLUMNAS, CampoComprobante } from '../componentes/TablaComprobantes.jsx'
import Visor from '../componentes/Visor.jsx'
import { CATEGORIAS, proponerClasificacion } from '../reglas/categorias.js'
import { TIPOS } from '../reglas/comprobantes.js'
import { alertasComprobante, estadoRevision, sePuedeIncluir } from '../reglas/validacion.js'
import { isoADmy, soles } from '../util/formato.js'

const ETIQUETA_ESTADO = {
  'por-confirmar': 'Por confirmar',
  'por-decidir': 'Decide si entra',
  valido: 'Válido',
  excluido: 'No se usará',
}

const ETIQUETA_TIPO = Object.fromEntries(TIPOS.map((t) => [t.valor, t.etiqueta]))

/** Paso 3: categoría y descripción propuestas (el usuario confirma o edita) y alertas de validación. */
export default function PasoRevision({ comprobantes, viaje, onVolver, onContinuar }) {
  const { lista, editar, clasificar, decidir, confirmarPropuestas } = comprobantes
  const [viendo, setViendo] = useState(null)

  const filas = useMemo(() => {
    return lista
      .filter((c) => (c.estado === 'listo' || c.estado === 'error') && c.campos?.esComprobante)
      .map((c) => {
        const alertas = alertasComprobante(c, viaje, lista)
        return {
          c,
          alertas,
          estado: estadoRevision(c, alertas),
          clas: c.clasificacion || { ...proponerClasificacion(c.campos, c.texto), confirmado: false },
        }
      })
      .sort((a, b) => (a.c.campos.fecha || '9').localeCompare(b.c.campos.fecha || '9'))
  }, [lista, viaje])

  const cuenta = (e) => filas.filter((f) => f.estado === e).length
  const porConfirmar = cuenta('por-confirmar')
  const porDecidir = cuenta('por-decidir')
  const validos = filas.filter((f) => f.estado === 'valido')
  const sumaValidos = validos.reduce((s, f) => s + (f.c.campos.total || 0), 0)
  const confirmablesSinAlertas = filas.filter((f) => f.estado === 'por-confirmar' && !f.alertas.some((a) => a.nivel !== 'info'))
  const cVisor = lista.find((c) => c.id === viendo)

  return (
    <div className="paso-contenido">
      <header className="paso-cabecera">
        <h1>Revisión</h1>
        <p>
          Cada comprobante trae una categoría y una descripción <strong>propuestas</strong>. Confírmalas o cámbialas; las
          alertas te piden decidir si el comprobante entra.
        </p>
      </header>

      <div className="cifras" aria-live="polite">
        <span className={porConfirmar ? 'cifras--duda' : ''}>
          <strong>{porConfirmar}</strong> por confirmar
        </span>
        <span className={porDecidir ? 'cifras--error' : ''}>
          <strong>{porDecidir}</strong> con alertas por decidir
        </span>
        <span>
          <strong>{validos.length}</strong> válidos
        </span>
        <span className="cifras__suma">
          Válidos: <strong>{soles(sumaValidos)}</strong>
        </span>
      </div>

      {confirmablesSinAlertas.length > 1 && (
        <div className="aviso aviso--info">
          <span>
            {confirmablesSinAlertas.length} comprobantes no tienen alertas. Revisa sus propuestas abajo y, si estás de
            acuerdo, confírmalas juntas.
          </span>
          <button type="button" className="boton boton--secundario" onClick={() => confirmarPropuestas(confirmablesSinAlertas.map((f) => f.c.id))}>
            Confirmar esas {confirmablesSinAlertas.length} propuestas
          </button>
        </div>
      )}

      <ul className="revision">
        {filas.map(({ c, alertas, estado, clas }) => {
          const f = c.campos
          const serias = alertas.filter((a) => a.nivel !== 'info')
          const idDesc = `desc-${c.id}`
          return (
            <li key={c.id} className={`revision__item revision__item--${estado}`}>
              <button type="button" className="miniatura" onClick={() => setViendo(c.id)} disabled={!c.vista} title="Ver comprobante">
                {c.vista ? <img src={c.vista} alt="" /> : <span aria-hidden="true">📄</span>}
              </button>

              <div className="revision__cuerpo">
                <div className="revision__cabecera">
                  <div className="revision__datos">
                    <strong>{f.documento || 'Sin serie-número'}</strong>
                    <span>{f.fecha ? isoADmy(f.fecha) : 'sin fecha'}</span>
                    <span>{ETIQUETA_TIPO[f.tipo] || 'Tipo ?'}</span>
                    <span className="revision__emisor">{f.razonSocial || 'Emisor sin nombre'}</span>
                  </div>
                  <div className="revision__monto">{soles(f.total)}</div>
                </div>

                <div className="revision__clasificacion">
                  <label className="campo-visor">
                    <span>Categoría</span>
                    <select
                      className={`dato ${clas.confirmado ? '' : 'dato--propuesta'}`}
                      value={clas.categoria}
                      onChange={(e) => {
                        const cat = CATEGORIAS.find((x) => x.valor === e.target.value)
                        // al cambiar de categoría se propone su descripción típica, que el usuario puede editar
                        clasificar(c.id, { categoria: cat.valor, descripcion: cat.valor === clas.categoria ? clas.descripcion : cat.descripcion })
                      }}
                    >
                      {CATEGORIAS.map((x) => (
                        <option key={x.valor} value={x.valor}>
                          {x.etiqueta}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="campo-visor revision__desc">
                    <span>Descripción (va en la rendición)</span>
                    <input
                      className={`dato ${clas.confirmado ? '' : 'dato--propuesta'}`}
                      value={clas.descripcion}
                      list={idDesc}
                      onChange={(e) => clasificar(c.id, { descripcion: e.target.value.toUpperCase() })}
                    />
                    <datalist id={idDesc}>
                      {CATEGORIAS.map((x) => (
                        <option key={x.valor} value={x.descripcion} />
                      ))}
                      {clas.alternativa && <option value={clas.alternativa} />}
                    </datalist>
                  </label>
                </div>

                <div className="revision__propuesta">
                  {!clas.confirmado && <span className="nota">Propuesta por {clas.motivo}.</span>}
                  {clas.alternativa && clas.descripcion !== clas.alternativa && (
                    <button type="button" className="chip" onClick={() => clasificar(c.id, { descripcion: clas.alternativa })}>
                      Usar: {clas.alternativa}
                    </button>
                  )}
                </div>

                {alertas.length > 0 && (
                  <ul className="alertas">
                    {alertas.map((a, i) => (
                      <li key={i} className={`alerta alerta--${a.nivel}`}>
                        {a.nivel === 'error' ? '⛔' : a.nivel === 'aviso' ? '⚠' : 'ℹ'} {a.mensaje}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="revision__acciones">
                  <span className={`insignia insignia--${estado}`}>{ETIQUETA_ESTADO[estado]}</span>
                  {!clas.confirmado && estado !== 'excluido' && (
                    <button type="button" className="boton boton--primario boton--chico" onClick={() => clasificar(c.id, {})}>
                      ✓ Confirmar categoría y descripción
                    </button>
                  )}
                  {!sePuedeIncluir(c) && estado !== 'excluido' && (
                    <span className="nota">Completa el total (Corregir datos) para poder usarlo.</span>
                  )}
                  {serias.length > 0 && estado !== 'excluido' && c.decision !== 'incluir' && sePuedeIncluir(c) && (
                    <button type="button" className="boton boton--secundario boton--chico" onClick={() => decidir(c.id, 'incluir')}>
                      Incluir de todos modos
                    </button>
                  )}
                  {estado !== 'excluido' ? (
                    <button type="button" className="boton boton--texto boton--peligro" onClick={() => decidir(c.id, 'excluir')}>
                      No usar en esta rendición
                    </button>
                  ) : (
                    <button type="button" className="boton boton--texto" onClick={() => decidir(c.id, null)}>
                      Volver a considerar
                    </button>
                  )}
                  {c.decision === 'incluir' && estado !== 'excluido' && <span className="nota">Incluido a pesar de las alertas.</span>}
                  <button type="button" className="boton boton--texto" onClick={() => setViendo(c.id)}>
                    Corregir datos
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {cVisor && (
        <Visor comprobante={cVisor} onCerrar={() => setViendo(null)}>
          {COLUMNAS.map((k) => (
            <CampoComprobante key={k} c={cVisor} campo={k} onEditar={editar} />
          ))}
          {cVisor.campos?.detalle && (
            <p className="nota">
              <strong>Detalle leído:</strong> {cVisor.campos.detalle}
            </p>
          )}
        </Visor>
      )}

      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          ← Comprobantes
        </button>
        <button type="button" className="boton boton--primario" onClick={onContinuar} disabled={porConfirmar > 0 || porDecidir > 0}>
          Continuar a movilidad →
        </button>
      </div>
      {(porConfirmar > 0 || porDecidir > 0) && (
        <p className="nota nota--derecha">Para continuar, confirma todas las propuestas y decide los comprobantes con alertas.</p>
      )}
    </div>
  )
}
