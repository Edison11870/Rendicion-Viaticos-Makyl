import { useState } from 'react'
import { datosSalida, nombreArchivo } from '../salida/datos.js'
import { noUtilizados, textoSaldo } from '../reglas/rendicion.js'
import { isoADmy, soles } from '../util/formato.js'

// el generador (ExcelJS, pdf-lib, fuentes) se carga solo al usarlo
const generador = () => import('../salida/generar.js')

/** Paso 6: descargas. */
export default function PasoResultado({ filas, sel, trabajador, viaje, comprobantes, onVolver, onNueva }) {
  const [trabajando, setTrabajando] = useState('')
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)
  const datos = datosSalida(trabajador, viaje)
  const planillas = filas.filter((f) => f.tipo === 'planilla')
  const noUsados = noUtilizados(comprobantes.lista, sel.ids, viaje)
  const depositos = comprobantes.lista.filter((c) => c.estado === 'listo' && c.campos?.tipo === 'deposito')

  async function hacer(clave, accion) {
    setTrabajando(clave)
    setError('')
    try {
      await accion(await generador())
    } catch (e) {
      setError(`No se pudo generar: ${e?.message || e}`)
    } finally {
      setTrabajando('')
    }
  }

  const boton = (clave, texto, accion, deshabilitado) => (
    <button type="button" className="boton boton--primario descarga" disabled={!!trabajando || deshabilitado} onClick={() => hacer(clave, accion)}>
      {trabajando === clave ? 'Generando…' : texto}
    </button>
  )

  return (
    <div className="paso-contenido">
      <header className="paso-cabecera">
        <h1>Resultado</h1>
        <p>
          Rendición de <strong>{viaje.proyecto}</strong> · {filas.length} filas · total {soles(sel.total)} · saldo{' '}
          {soles(Math.abs(sel.diferencia))} {textoSaldo(sel.diferencia)}.
        </p>
      </header>

      {error && (
        <p className="aviso aviso--error" role="alert">
          {error}
        </p>
      )}

      <section className="tarjeta descargas">
        <div className="descarga-item">
          <div>
            <h2>Rendición de Gastos (Excel)</h2>
            <p className="nota">
              Formato de la empresa: hoja «RENDICION-MARCOBRE» {planillas.length > 0 && `+ ${planillas.length} hoja(s) de planilla`}.
            </p>
          </div>
          {boton('xlsx', 'Descargar Excel', (g) =>
            g.excelRendicion(filas, datos).then((b) => g.descargar(b, nombreArchivo('RENDICION', datos, 'xlsx'), g.TIPO_XLSX)),
          )}
        </div>

        <div className="descarga-item">
          <div>
            <h2>PDF de sustentos</h2>
            <p className="nota">
              Hoja de rendición → comprobantes en el mismo orden → planillas con sus evidencias
              {depositos.length ? ' → constancia del depósito' : ''}.
            </p>
          </div>
          {boton('pdf', 'Descargar PDF', (g) =>
            g.pdfSustentos(filas, datos, comprobantes.lista).then((b) => g.descargar(b, nombreArchivo('SUSTENTOS', datos, 'pdf'), g.TIPO_PDF)),
          )}
        </div>

        {planillas.length > 0 && (
          <div className="descarga-item">
            <div>
              <h2>Planillas de movilidad para firmar</h2>
              <p className="nota">
                {planillas.map((p) => `${p.documento} (${isoADmy(p.fecha)})`).join(' · ')}. Imprímelas y fírmalas.
              </p>
            </div>
            {boton('planillas', 'Descargar planillas', (g) =>
              g.pdfPlanillas(filas, datos).then((b) => g.descargar(b, nombreArchivo('PLANILLAS DE MOVILIDAD', datos, 'pdf'), g.TIPO_PDF)),
            )}
          </div>
        )}
      </section>

      <section className="tarjeta" aria-labelledby="t-nu">
        <div className="tarjeta__titulo">
          <h2 id="t-nu">Comprobantes no utilizados ({noUsados.length})</h2>
          <strong>{soles(noUsados.reduce((s, x) => s + (x.c.campos.total || 0), 0))}</strong>
        </div>
        {noUsados.length === 0 ? (
          <p className="nota">Se usaron todos los comprobantes.</p>
        ) : (
          <>
            <ul className="seleccion">
              {noUsados.map(({ c, motivo }) => (
                <li key={c.id} className="seleccion__item">
                  <div className="seleccion__texto">
                    <strong>{c.campos.documento || c.nombreArchivo}</strong>
                    <span>
                      {isoADmy(c.campos.fecha)} · {c.campos.razonSocial} · {motivo}
                    </span>
                  </div>
                  <span className="seleccion__monto">{soles(c.campos.total)}</span>
                </li>
              ))}
            </ul>
            <div className="revision__acciones">
              <button
                type="button"
                className="boton boton--secundario"
                disabled={guardado || !!trabajando}
                onClick={() =>
                  hacer('guardar', async () => {
                    const ok = await comprobantes.guardarParaOtra(noUsados.map((x) => x.c), `${viaje.proyecto} ${isoADmy(viaje.fechaRendicion)}`)
                    if (!ok) throw new Error('este navegador no permite guardar datos')
                    setGuardado(true)
                  })
                }
              >
                {guardado ? '✓ Guardados para otra rendición' : 'Guardar para otra rendición'}
              </button>
              <button
                type="button"
                className="boton boton--texto"
                disabled={!!trabajando}
                onClick={() =>
                  hacer('nu', (g) => g.excelNoUtilizados(noUsados, datos).then((b) => g.descargar(b, nombreArchivo('NO UTILIZADOS', datos, 'xlsx'), g.TIPO_XLSX)))
                }
              >
                {trabajando === 'nu' ? 'Generando…' : 'Descargar lista (Excel)'}
              </button>
            </div>
            <p className="nota">
              Al guardarlos quedan en este navegador; en la próxima rendición aparecerá «Traerlos a esta rendición» en el paso
              Comprobantes.
            </p>
          </>
        )}
      </section>

      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onVolver}>
          ← Selección
        </button>
        <button
          type="button"
          className="boton boton--texto boton--peligro"
          onClick={() => {
            if (window.confirm('¿Empezar una rendición nueva? Se vaciarán los comprobantes y gastos de esta (los guardados para otra rendición se conservan).')) onNueva()
          }}
        >
          Empezar una rendición nueva
        </button>
      </div>
    </div>
  )
}
