import { useEffect, useMemo, useState } from 'react'
import Pasos from './componentes/Pasos.jsx'
import PasoViaje from './pasos/PasoViaje.jsx'
import PasoComprobantes from './pasos/PasoComprobantes.jsx'
import PasoRevision from './pasos/PasoRevision.jsx'
import PasoMovilidad from './pasos/PasoMovilidad.jsx'
import PasoSeleccion from './pasos/PasoSeleccion.jsx'
import PasoResultado from './pasos/PasoResultado.jsx'
import { armarSeleccion, candidatosRendicion, filasRendicion } from './reglas/rendicion.js'
import { useComprobantes } from './estado/useComprobantes.js'
import { guardar, leer } from './almacen/local.js'
import { TRABAJADOR_VACIO, validarTrabajador, validarViaje, viajeVacio } from './reglas/viaje.js'

const PASOS = [
  { id: 'viaje', titulo: 'Viaje' },
  { id: 'comprobantes', titulo: 'Comprobantes' },
  { id: 'revision', titulo: 'Revisión' },
  { id: 'movilidad', titulo: 'Movilidad' },
  { id: 'seleccion', titulo: 'Selección' },
  { id: 'resultado', titulo: 'Resultado' },
]

export default function App() {
  const [trabajador, setTrabajador] = useState(() => leer('trabajador', TRABAJADOR_VACIO))
  const [viaje, setViaje] = useState(() => leer('viaje', viajeVacio()))
  const [paso, setPaso] = useState(0)
  const comprobantes = useComprobantes()
  // gastos sin comprobante (solo datos, se guardan en el navegador)
  const [gastos, setGastos] = useState(() => leer('movilidad', { gastos: [] }).gastos)
  // comprobantes/planillas que el usuario obliga a meter ('si') o sacar ('no') de la selección
  const [forzados, setForzados] = useState({})

  const cand = useMemo(() => candidatosRendicion(comprobantes.lista, gastos, viaje), [comprobantes.lista, gastos, viaje])
  const sel = useMemo(() => armarSeleccion(cand, viaje, trabajador, forzados), [cand, viaje, trabajador, forzados])
  const filas = useMemo(() => filasRendicion(cand, sel.ids, forzados), [cand, sel, forzados])

  // «Resultado» solo cuando hay algo que rendir
  const habilitado = (i) => i === 0 || (paso1Ok && (i < 5 || filas.length > 0))

  function nuevaRendicion() {
    comprobantes.vaciar()
    setGastos([])
    setForzados({})
    setViaje(viajeVacio())
    setPaso(0)
  }

  useEffect(() => { guardar('trabajador', trabajador) }, [trabajador])
  useEffect(() => { guardar('viaje', viaje) }, [viaje])
  useEffect(() => { guardar('movilidad', { gastos }) }, [gastos])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [paso])

  const paso1Ok =
    Object.keys(validarTrabajador(trabajador)).length === 0 && Object.keys(validarViaje(viaje)).length === 0

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
        ) : actual.id === 'seleccion' ? (
          <PasoSeleccion cand={cand} sel={sel} forzados={forzados} setForzados={setForzados} onVolver={() => setPaso(3)} onContinuar={() => setPaso(5)} />
        ) : (
          <PasoResultado
            filas={filas}
            sel={sel}
            trabajador={trabajador}
            viaje={viaje}
            comprobantes={comprobantes}
            onVolver={() => setPaso(4)}
            onNueva={nuevaRendicion}
          />
        )}
      </main>

      <footer className="pie">
        MAKYL E.C.S. I.R.L. · Rendición de viáticos · v{__VERSION__}
      </footer>
    </div>
  )
}
