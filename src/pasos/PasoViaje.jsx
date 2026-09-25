import { useState } from 'react'
import Campo from '../componentes/Campo.jsx'
import { EMPRESA, FORMAS_ENTREGA } from '../config/empresa.js'
import {
  diasViaje,
  nombreRendicion,
  topeDiarioMovilidad,
  validarTrabajador,
  validarViaje,
} from '../reglas/viaje.js'
import { aCentimos, isoADmy, soles } from '../util/formato.js'

/** Paso 1: datos del trabajador (se guardan una vez) y datos del viaje. */
export default function PasoViaje({ trabajador, setTrabajador, viaje, setViaje, onContinuar }) {
  const erroresT = validarTrabajador(trabajador)
  const erroresV = validarViaje(viaje)
  const trabajadorOk = Object.keys(erroresT).length === 0
  const [editandoT, setEditandoT] = useState(!trabajadorOk)
  const [intento, setIntento] = useState(false)

  const t = (campo) => (e) => setTrabajador({ ...trabajador, [campo]: e.target.value })
  const v = (campo) => (e) => setViaje({ ...viaje, [campo]: e.target.value })
  const errT = (campo) => (intento || trabajador[campo] !== '' ? erroresT[campo] : undefined)
  const errV = (campo) => (intento ? erroresV[campo] : undefined)

  function continuar(e) {
    e.preventDefault()
    setIntento(true)
    if (!trabajadorOk) setEditandoT(true)
    if (trabajadorOk && Object.keys(erroresV).length === 0) onContinuar()
  }

  const monto = aCentimos(viaje.montoRecibido)
  const dias = diasViaje(viaje)

  return (
    <form className="paso-contenido" onSubmit={continuar} noValidate>
      <header className="paso-cabecera">
        <h1>Datos del viaje</h1>
        <p>Lo que va en el encabezado y el pie de la rendición.</p>
      </header>

      <section className="tarjeta" aria-labelledby="t-trabajador">
        <div className="tarjeta__titulo">
          <h2 id="t-trabajador">Tus datos</h2>
          {trabajadorOk && !editandoT && (
            <button type="button" className="boton boton--texto" onClick={() => setEditandoT(true)}>
              Editar
            </button>
          )}
        </div>

        {trabajadorOk && !editandoT ? (
          <dl className="resumen">
            <div>
              <dt>Trabajador</dt>
              <dd>{nombreRendicion(trabajador)}</dd>
            </div>
            <div>
              <dt>DNI</dt>
              <dd>{trabajador.dni}</dd>
            </div>
            <div>
              <dt>Recibe en oficina</dt>
              <dd>{trabajador.recibeAdministracion}</dd>
            </div>
            <div>
              <dt>Tope movilidad / día</dt>
              <dd>{soles(topeDiarioMovilidad(trabajador))}</dd>
            </div>
            <div>
              <dt>Exceso máximo aceptado</dt>
              <dd>{soles(aCentimos(trabajador.excesoMaximo))}</dd>
            </div>
          </dl>
        ) : (
          <>
            <p className="nota">Se guardan solo en este navegador. No hace falta escribirlos otra vez.</p>
            <div className="rejilla">
              <Campo etiqueta="Nombres" error={errT('nombres')} ancho="medio"
                render={(p) => <input {...p} value={trabajador.nombres} onChange={t('nombres')} autoComplete="given-name" placeholder="Juan Carlos" />} />
              <Campo etiqueta="Apellidos" error={errT('apellidos')} ancho="medio"
                render={(p) => <input {...p} value={trabajador.apellidos} onChange={t('apellidos')} autoComplete="family-name" placeholder="Quispe Rojas" />} />
              <Campo etiqueta="DNI" error={errT('dni')} ancho="tercio"
                render={(p) => <input {...p} value={trabajador.dni} onChange={t('dni')} inputMode="numeric" maxLength={8} />} />
              <Campo etiqueta="Persona que recibe (oficina)" error={errT('recibeAdministracion')} ancho="dostercios"
                ayuda="Va al pie de la rendición."
                render={(p) => <input {...p} value={trabajador.recibeAdministracion} onChange={t('recibeAdministracion')} />} />
            </div>

            <details className="parametros">
              <summary>Parámetros (tope de movilidad y exceso)</summary>
              <div className="rejilla">
                <Campo etiqueta="RMV vigente (S/)" error={errT('rmv')} ancho="tercio"
                  ayuda="Remuneración Mínima Vital. Verifica el valor del año."
                  render={(p) => <input {...p} value={trabajador.rmv} onChange={t('rmv')} inputMode="decimal" />} />
                <Campo etiqueta="Tope movilidad (% RMV por día)" error={errT('topeMovilidadPct')} ancho="tercio"
                  ayuda={`Tope diario: ${soles(topeDiarioMovilidad(trabajador))}`}
                  render={(p) => <input {...p} value={trabajador.topeMovilidadPct} onChange={t('topeMovilidadPct')} inputMode="decimal" />} />
                <Campo etiqueta="Exceso máximo aceptable (S/)" error={errT('excesoMaximo')} ancho="tercio"
                  ayuda="Cuánto puedes rendir por encima de lo recibido."
                  render={(p) => <input {...p} value={trabajador.excesoMaximo} onChange={t('excesoMaximo')} inputMode="decimal" />} />
              </div>
            </details>

            {trabajadorOk && (
              <button type="button" className="boton boton--secundario" onClick={() => setEditandoT(false)}>
                Listo
              </button>
            )}
          </>
        )}
      </section>

      <section className="tarjeta" aria-labelledby="t-viaje">
        <div className="tarjeta__titulo">
          <h2 id="t-viaje">Viaje</h2>
        </div>
        <div className="rejilla">
          <Campo etiqueta="Unidad minera / proyecto" error={errV('proyecto')} ancho="medio"
            ayuda="Va en «PROYECTO :». Ej.: Boroo - Zaranda"
            render={(p) => <input {...p} value={viaje.proyecto} onChange={v('proyecto')} />} />
          <Campo etiqueta="Motivo del servicio" ancho="medio"
            ayuda="Referencia para proponer descripciones."
            render={(p) => <input {...p} value={viaje.motivo} onChange={v('motivo')} placeholder="Control topográfico de tanques" />} />
          <Campo etiqueta="Fecha de salida" error={errV('fechaSalida')} ancho="cuarto"
            render={(p) => <input {...p} type="date" value={viaje.fechaSalida} onChange={v('fechaSalida')} />} />
          <Campo etiqueta="Fecha de retorno" error={errV('fechaRetorno')} ancho="cuarto"
            render={(p) => <input {...p} type="date" value={viaje.fechaRetorno} onChange={v('fechaRetorno')} min={viaje.fechaSalida || undefined} />} />
          <Campo etiqueta="Monto recibido (S/)" error={errV('montoRecibido')} ancho="cuarto"
            render={(p) => <input {...p} value={viaje.montoRecibido} onChange={v('montoRecibido')} inputMode="decimal" placeholder="200.00" />} />
          <Campo etiqueta="Fecha de entrega del dinero" error={errV('fechaEntrega')} ancho="cuarto"
            render={(p) => <input {...p} type="date" value={viaje.fechaEntrega} onChange={v('fechaEntrega')} />} />
        </div>

        <fieldset className="opciones">
          <legend>Forma de entrega</legend>
          {FORMAS_ENTREGA.map((f) => (
            <label key={f.valor} className="opcion">
              <input type="radio" name="formaEntrega" value={f.valor}
                checked={viaje.formaEntrega === f.valor} onChange={v('formaEntrega')} />
              {f.etiqueta}
            </label>
          ))}
        </fieldset>

        <div className="rejilla">
          {viaje.formaEntrega === 'cheque' && (
            <Campo etiqueta="N° de cheque" error={errV('chequeNumero')} ancho="cuarto"
              render={(p) => <input {...p} value={viaje.chequeNumero} onChange={v('chequeNumero')} />} />
          )}
          <Campo etiqueta="Fecha de rendición" error={errV('fechaRendicion')} ancho="cuarto"
            ayuda="También es la fecha de emisión de las planillas."
            render={(p) => <input {...p} type="date" value={viaje.fechaRendicion} onChange={v('fechaRendicion')} />} />
        </div>
      </section>

      <aside className="tarjeta tarjeta--resumen" aria-label="Resumen">
        <dl className="resumen">
          <div>
            <dt>Proyecto</dt>
            <dd>{viaje.proyecto || '—'}</dd>
          </div>
          <div>
            <dt>Viaje</dt>
            <dd>
              {dias ? `${isoADmy(viaje.fechaSalida)} → ${isoADmy(viaje.fechaRetorno)} (${dias} ${dias === 1 ? 'día' : 'días'})` : '—'}
            </dd>
          </div>
          <div>
            <dt>Por rendir</dt>
            <dd className="resumen__fuerte">{soles(monto && monto > 0 ? monto : null)}</dd>
          </div>
          <div>
            <dt>Empresa</dt>
            <dd>{EMPRESA.razonSocial} · RUC {EMPRESA.ruc}</dd>
          </div>
        </dl>
      </aside>

      <div className="acciones">
        <button type="submit" className="boton boton--primario">
          Continuar a comprobantes →
        </button>
      </div>
    </form>
  )
}
