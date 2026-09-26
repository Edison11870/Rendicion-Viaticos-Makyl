# Rendición de viáticos · MAKYL

Página web que arma la **rendición de gastos de viaje** de MAKYL E.C.S. I.R.L. a partir de los comprobantes
(facturas, boletas, tickets) que se juntan en cada visita a una unidad minera.

Se suben los PDF o fotos de los comprobantes. La página lee RUC, serie-número, fecha, total e IGV, propone la
categoría y la descripción, y elige qué comprobantes usar para cubrir el monto recibido. Al final genera:

- la **Rendición de Gastos** en Excel (`.xlsx`) con el formato de la empresa,
- la **Planilla de Movilidad Diaria** para los gastos que no tuvieron comprobante (lista para imprimir y firmar),
- un **PDF con los sustentos**: la hoja de rendición y los comprobantes en el mismo orden del reporte,
- la **lista de comprobantes no utilizados**, que quedan guardados para otra rendición.

> **Privacidad:** todo se procesa en el navegador. Los comprobantes nunca se suben a un servidor: la lectura
> de PDF (pdf.js) y el OCR de fotos (tesseract.js) corren en tu propio equipo, y los archivos se guardan solo
> en ese navegador.

**Página publicada:** <https://edison11870.github.io/Rendicion-Viaticos-Makyl/>

## Cómo usar

1. **Viaje.**
   - La primera vez escribe tus datos: nombres, apellidos, DNI y quién recibe la rendición en la oficina.
   - En «Parámetros» puedes cambiar la RMV (tope de movilidad = 4 % de la RMV por día) y el exceso máximo
     aceptado.
   - Luego llena el viaje: proyecto, fechas, monto recibido, fecha y forma de entrega, fecha de rendición.
2. **Comprobantes.**
   - Arrastra todos los PDF y fotos a la vez. En el celular, «Tomar foto» abre la cámara.
   - Lo leído aparece en una tabla editable; lo dudoso queda en **naranja** con el motivo.
   - «Revisar» abre el comprobante en grande al lado de sus datos.
   - Las capturas de Yape/Plin o de apps de taxi se separan como **evidencias**. La transferencia con que te
     depositaron se reconoce como **constancia del depósito**.
3. **Revisión.**
   - Cada comprobante trae una categoría (movilidad, alimentación, hospedaje, otros) y una descripción
     **propuestas**. Confírmalas o cámbialas.
   - Las alertas te piden decidir si el comprobante entra: fecha fuera del viaje, datos incompletos, factura
     no emitida a MAKYL, repetidos.
4. **Movilidad** (opcional).
   - Registra los gastos sin comprobante: fecha, tipo, motivo, origen, destino y monto.
   - Puedes asociarles evidencias.
   - Se arma una planilla por día; si un día pasa el tope diario, se avisa, pero no se bloquea.
5. **Selección.**
   - La página elige la combinación que cubre el monto recibido. Usa primero facturas y boletas y deja las
     planillas para cuando hacen falta, excediendo lo menos posible y sin pasar el exceso máximo.
   - Muestra el total rendido, el saldo (a favor o a devolver) y el exceso. Puedes forzar a meter o sacar
     cualquier ítem.
6. **Resultado.**
   - Descarga el Excel, el PDF de sustentos y las planillas para firmar.
   - Los no utilizados se pueden bajar en Excel y **guardar para otra rendición**: en la próxima aparecerá
     «Traerlos a esta rendición».

Si recargas la página, la rendición en curso se mantiene. «Empezar una rendición nueva» la vacía.

### Formato de la empresa

- **Rendición de Gastos:** se reproduce el Excel oficial. Las medidas están en
  [`templates/formato-rendicion.md`](templates/formato-rendicion.md):
  - hoja `RENDICION-MARCOBRE`, A4 al 83 %, logo;
  - FECHA · DOCUMENTO · Descripción · Nuevos Soles · Dólares, 39 filas;
  - `=SUM(E14:E52)`; «Saldos Entregados» con la diferencia.
- **Orden de las filas:** primero los comprobantes **en el orden en que los subiste o fotografiaste** (el PDF de
  sustentos sigue el mismo orden), luego las planillas por fecha («Planilla N° 001»…). Para controlar el orden
  exacto, súbelos o fotografíalos de uno en uno: si eliges varios de golpe, el navegador decide su orden.
- **Planilla de Movilidad Diaria:** Motivo · Destino («Origen - Destino») · Sub Total · Total, Trabajador (el
  total del día) · Firma.

## Instalación (para desarrollo)

Requisitos: [Node.js](https://nodejs.org) 20.19 o superior.

```bash
git clone https://github.com/Edison11870/Rendicion-Viaticos-Makyl.git
cd Rendicion-Viaticos-Makyl
npm install
npm run dev        # abre http://localhost:5173
```

Otros comandos:

```bash
npm test                 # pruebas (lectura, alertas, planilla, selección, Excel y PDF)
npm run build            # versión publicable en dist/
npm run preview          # prueba la versión publicable en local
npm run probar-ejemplos  # lee comprobantes reales de ejemplos/ (carpeta local, nunca se sube)
```

## Publicación (GitHub Pages)

La GitHub Action `.github/workflows/deploy.yml` corre las pruebas, compila y publica `dist/` en cada cambio de
`main`. Configuración única del repositorio: **Settings → Pages → Build and deployment → Source: GitHub
Actions**.

## Estructura

```
src/
  pasos/        una pantalla por paso (Viaje, Comprobantes, Revisión, Movilidad, Selección, Resultado)
  componentes/  piezas de interfaz (tabla editable, zona de carga, visor, vista de planilla…)
  extraccion/   lectura de PDF (pdf.js), OCR (tesseract.js) e interpretación de campos SUNAT
  reglas/       categorías, alertas, planilla, selección óptima, filas de la rendición (sin interfaz, con pruebas)
  salida/       Excel (ExcelJS) y PDF (pdf-lib) con el formato de la empresa
  estado/       lista de comprobantes y cola de lectura
  almacen/      guardado en el navegador (localStorage e IndexedDB)
  config/       datos de la empresa y parámetros por defecto
public/         logo; el motor OCR se copia en public/tesseract al compilar
templates/      formato oficial medido y logos
tests/          pruebas (Vitest) con textos de comprobantes anonimizados
```

## Tecnología

React + Vite · pdf.js · tesseract.js (español, servido desde la propia página) · ExcelJS · pdf-lib + fuente
Carlito (misma métrica que Calibri, licencia OFL).
