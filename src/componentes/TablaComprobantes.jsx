import CampoMonto from './CampoMonto.jsx'
import { TIPOS, normalizarDocumento } from '../reglas/comprobantes.js'

const ETIQUETAS = {
  tipo: 'Tipo',
  documento: 'Serie-número',
  fecha: 'Fecha emisión',
  rucEmisor: 'RUC emisor',
  razonSocial: 'Razón social',
  total: 'Total S/',
  igv: 'IGV S/',
}

/** Un campo editable de un comprobante, resaltado si quedó en duda. */
export function CampoComprobante({ c, campo, onEditar, compacto }) {
  const duda = c.dudas[campo]
  const valor = c.campos[campo]
  const comun = {
    'aria-label': `${ETIQUETAS[campo]} de ${c.nombreArchivo}`,
    'aria-invalid': !!duda,
    title: duda || undefined,
    className: duda ? 'dato dato--duda' : 'dato',
  }
  let entrada
  if (campo === 'tipo') {
    entrada = (
      <select {...comun} value={valor || ''} onChange={(e) => onEditar(c.id, 'tipo', e.target.value)}>
        {!valor && <option value="">—</option>}
        {TIPOS.map((t) => (
          <option key={t.valor} value={t.valor}>
            {t.etiqueta}
          </option>
        ))}
      </select>
    )
  } else if (campo === 'total' || campo === 'igv') {
    entrada = <CampoMonto {...comun} valor={valor} onCambio={(v) => onEditar(c.id, campo, v)} />
  } else if (campo === 'fecha') {
    entrada = <input {...comun} type="date" value={valor || ''} onChange={(e) => onEditar(c.id, 'fecha', e.target.value)} />
  } else {
    entrada = (
      <input
        {...comun}
        value={valor || ''}
        inputMode={campo === 'rucEmisor' ? 'numeric' : undefined}
        maxLength={campo === 'rucEmisor' ? 11 : undefined}
        onChange={(e) => onEditar(c.id, campo, e.target.value)}
        onBlur={campo === 'documento' ? (e) => onEditar(c.id, 'documento', normalizarDocumento(e.target.value)) : undefined}
      />
    )
  }
  if (compacto) return entrada
  return (
    <label className="campo-visor">
      <span>{ETIQUETAS[campo]}</span>
      {entrada}
      {duda && <small className="campo-visor__duda">⚠ {duda}</small>}
    </label>
  )
}

function Estado({ c, onReintentar }) {
  if (c.estado === 'en-cola') return <span className="estado estado--cola">En cola</span>
  if (c.estado === 'leyendo')
    return (
      <span className="estado estado--leyendo">
        Leyendo… <progress max="1" value={c.avance || 0} aria-label={`Avance de ${c.nombreArchivo}`} />
      </span>
    )
  if (c.estado === 'error')
    return (
      <span className="estado estado--error">
        {c.error}{' '}
        <button type="button" className="boton boton--texto" onClick={() => onReintentar(c.id)}>
          Reintentar
        </button>
      </span>
    )
  const n = Object.keys(c.dudas).length
  return n ? (
    <span className="estado estado--duda">⚠ Revisar {n} {n === 1 ? 'dato' : 'datos'}</span>
  ) : (
    <span className="estado estado--ok">✓ Leído{c.origen === 'ocr' ? ' (OCR)' : ''}</span>
  )
}

const COLUMNAS = ['tipo', 'documento', 'fecha', 'rucEmisor', 'razonSocial', 'total', 'igv']

export default function TablaComprobantes({ lista, onEditar, onQuitar, onVer, onReintentar }) {
  return (
    <div className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th scope="col">Vista</th>
            {COLUMNAS.map((k) => (
              <th key={k} scope="col" className={`col-${k}`}>
                {ETIQUETAS[k]}
              </th>
            ))}
            <th scope="col">Estado</th>
            <th scope="col">
              <span className="solo-lector">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lista.map((c) => {
            const listo = c.estado === 'listo' || c.estado === 'error'
            return (
              <tr key={c.id} className={Object.keys(c.dudas).length ? 'fila--duda' : ''}>
                <td data-etiqueta="Vista" className="celda-vista">
                  <button type="button" className="miniatura" onClick={() => onVer(c.id)} disabled={!c.vista} title="Ver en grande">
                    {c.vista ? <img src={c.vista} alt="" /> : <span aria-hidden="true">📄</span>}
                    <span className="miniatura__nombre">{c.nombreArchivo}</span>
                  </button>
                </td>
                {COLUMNAS.map((k) => (
                  <td key={k} data-etiqueta={ETIQUETAS[k]} className={`col-${k}`}>
                    {listo ? <CampoComprobante c={c} campo={k} onEditar={onEditar} compacto /> : <span className="vacio">…</span>}
                  </td>
                ))}
                <td data-etiqueta="Estado">
                  <Estado c={c} onReintentar={onReintentar} />
                  {listo && Object.keys(c.dudas).length > 0 && (
                    <ul className="dudas">
                      {Object.entries(c.dudas).map(([k, v]) => (
                        <li key={k}>
                          <strong>{ETIQUETAS[k] || k}:</strong> {v}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="celda-acciones">
                  {listo && c.vista && (
                    <button type="button" className="boton boton--texto" onClick={() => onVer(c.id)}>
                      Revisar
                    </button>
                  )}
                  <button type="button" className="boton boton--texto boton--peligro" onClick={() => onQuitar(c.id)} aria-label={`Quitar ${c.nombreArchivo}`}>
                    Quitar
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { COLUMNAS }
