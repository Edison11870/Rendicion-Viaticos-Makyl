import { EMPRESA } from '../config/empresa.js'
import { destinoPlanilla, nombrePlanilla } from '../reglas/movilidad.js'
import { nombrePlanilla as nombreTrabajador } from '../reglas/viaje.js'
import { centimosATexto, isoADmy } from '../util/formato.js'

/** Vista previa de la Planilla de Movilidad Diaria con el formato de la empresa. */
export default function VistaPlanilla({ planilla, trabajador, fechaEmision, numero }) {
  const filas = [...planilla.lineas]
  while (filas.length < 3) filas.push(null) // el formato trae 3 filas de detalle
  return (
    <div className="planilla" role="figure" aria-label={`Vista previa de ${nombrePlanilla(numero)}`}>
      <div className="planilla__titulo">
        <strong>Planilla de Movilidad Diaria</strong>
        <strong className="planilla__numero">Planilla No {String(numero).padStart(3, '0')}</strong>
      </div>
      <p className="planilla__seccion">I.- Datos de la Empresa</p>
      <dl className="planilla__datos">
        <dt>Razón Social:</dt>
        <dd>{EMPRESA.razonSocial}</dd>
        <dt>RUC:</dt>
        <dd>{EMPRESA.ruc}</dd>
        <dt>DIA:</dt>
        <dd>{isoADmy(planilla.fecha)}</dd>
        <dt>FECHA DE EMISIÓN:</dt>
        <dd>{isoADmy(fechaEmision)}</dd>
      </dl>
      <p className="planilla__seccion">II.- Datos del trabajador y del Desplazamiento</p>
      <dl className="planilla__datos">
        <dt>Nombres y Apellidos</dt>
        <dd>{nombreTrabajador(trabajador)}</dd>
        <dt>DNI</dt>
        <dd>{trabajador.dni}</dd>
      </dl>
      <table className="planilla__tabla">
        <thead>
          <tr>
            <th>Motivo</th>
            <th>Destino</th>
            <th>Sub Total S/.</th>
            <th>Total, Trabajador S/.</th>
            <th>Firma del Trabajador</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((g, i) => (
            <tr key={g?.id || i}>
              <td>{g?.motivo}</td>
              <td>{g ? destinoPlanilla(g) : ''}</td>
              <td className="num">{g ? centimosATexto(g.monto) : ''}</td>
              {i === 0 && (
                <>
                  <td rowSpan={filas.length} className="num planilla__total-trabajador">
                    {centimosATexto(planilla.total)}
                  </td>
                  <td rowSpan={filas.length} />
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="planilla__pie">
        <span>Total, Movilidad del día</span>
        <strong className="planilla__suma">S/ {centimosATexto(planilla.total)}</strong>
      </div>
    </div>
  )
}
