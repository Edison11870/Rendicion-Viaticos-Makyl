import { useEffect, useState } from 'react'
import Pasos from './componentes/Pasos.jsx'
import PasoViaje from './pasos/PasoViaje.jsx'
import PasoPendiente from './pasos/PasoPendiente.jsx'
import PasoComprobantes from './pasos/PasoComprobantes.jsx'
import PasoRevision from './pasos/PasoRevision.jsx'
import PasoMovilidad from './pasos/PasoMovilidad.jsx'
import { useComprobantes } from './estado/useComprobantes.js'
import { guardar, leer } from './almacen/local.js'
import { TRABAJADOR_VACIO, validarTrabajador, validarViaje, viajeVacio } from './reglas/viaje.js'

const PASOS = [
  { id: 'viaje', titulo: 'Viaje' },
  { id: 'comprobantes', titulo: 'Comprobantes' },
  { id: 'revision', titulo: 'Revisión' },
  { id: 'movilidad', titulo: 'Movilidad' },
  { id: 'seleccion', titulo: 'Selección', etapa: 5,
    descripcion: 'La combinación que cubre el monto recibido con el menor exceso.' },
  { id: 'resultado', titulo: 'Resultado', etapa: 6,
    descripcion: 'Excel de rendición, planillas, PDF de sustentos y comprobantes no usados.' },
]

export default function App() {
  const [trabajador, setTrabajador] = useState(() => leer('trabajador', TRABAJADOR_VACIO))
  const [viaje, setViaje] = useState(() => leer('viaje', viajeVacio()))
  const [paso, setPaso] = useState(0)
  const comprobantes = useComprobantes()
  // gastos sin comprobante (solo datos, se guardan en el navegador)
  const [gastos, setGastos] = useState(() => leer('movilidad', { gastos: [] }).gastos)

  useEffect(() => { guardar('trabajador', trabajador) }, [trabajador])
  useEffect(() => { guardar('viaje', viaje) }, [viaje])
  useEffect(() => { guardar('movilidad', { gastos }) }, [gastos])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [paso])

  const paso1Ok =
    Object.keys(validarTrabajador(trabajador)).length === 0 && Object.keys(validarViaje(viaje)).length === 0
  const habilitado = (i) => i === 0 || paso1Ok

  const actual = PASOS[paso]

  return (
    <div className="app">
      <header className="barra">
        <img src="./logo-makyl.png" alt="MAKYL" className="barra__logo" width="80" height="50" />
        <div className="barra__texto">
          <span className="barra__titulo">Rendición de viáticos</span>
          <span className="barra__sub">Todo se procesa en tu equipo · nada se sube a internet</span>
        </div>
      </header>

      <Pasos pasos={PASOS} actual={paso} habilitado={habilitado} onIr={setPaso} />

      <main>
        {actual.id === 'viaje' ? (
          <PasoViaje
            trabajador={trabajador}
            setTrabajador={setTrabajador}
            viaje={viaje}
            setViaje={setViaje}
            onContinuar={() => setPaso(1)}
          />
        ) : actual.id === 'comprobantes' ? (
          <PasoComprobantes comprobantes={comprobantes} onVolver={() => setPaso(0)} onContinuar={() => setPaso(2)} />
        ) : actual.id === 'revision' ? (
          <PasoRevision comprobantes={comprobantes} viaje={viaje} onVolver={() => setPaso(1)} onContinuar={() => setPaso(3)} />
        ) : actual.id === 'movilidad' ? (
          <PasoMovilidad
            gastos={gastos}
            setGastos={setGastos}
            comprobantes={comprobantes}
            viaje={viaje}
            trabajador={trabajador}
            onVolver={() => setPaso(2)}
            onContinuar={() => setPaso(4)}
          />
        ) : (
          <PasoPendiente
            titulo={actual.titulo}
            descripcion={actual.descripcion}
            etapa={actual.etapa}
            onVolver={() => setPaso(paso - 1)}
          />
        )}
      </main>

      <footer className="pie">
        MAKYL E.C.S. I.R.L. · Rendición de viáticos · v{__VERSION__}
      </footer>
    </div>
  )
}
