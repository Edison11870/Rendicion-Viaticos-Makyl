# Rendición de viáticos · MAKYL

Página web que arma la **rendición de gastos de viaje** de MAKYL E.C.S. I.R.L. a partir de los comprobantes
(facturas, boletas, tickets) que se juntan en cada visita a una unidad minera.

Se cargan los PDF o fotos de los comprobantes, la página lee RUC, serie-número, fecha y monto, propone una
categoría y una descripción, y genera:

- la **Rendición de Gastos** en Excel (`.xlsx`) con el formato de la empresa,
- la **Planilla de Movilidad Diaria** para los taxis que no dieron comprobante,
- un **PDF con los comprobantes usados**, en el mismo orden del reporte,
- la **lista de comprobantes no usados**, guardados para otra rendición.

> **Privacidad:** todo se procesa en el navegador. Los comprobantes nunca se suben a un servidor; la lectura
> de texto (pdf.js) y el OCR de fotos (tesseract.js) corren en tu propio equipo.

## Estado

🚧 En desarrollo.

| Etapa | Contenido | Estado |
|---|---|---|
| 0 | Repositorio y estructura | ✅ |
| 1 | Base de la página, datos del viaje, publicación en GitHub Pages | ✅ |
| 2 | Carga de comprobantes, lectura (pdf.js + OCR) y tabla editable | ✅ |
| 3 | Categoría y descripción propuestas, alertas de validación | ✅ |
| 4 | Planilla de Movilidad Diaria (tope configurable) | ⏳ |
| 5 | Selección óptima de comprobantes | ⏳ |
| 6 | Excel de rendición, PDF de sustentos, comprobantes no usados | ⏳ |
| 7 | Ajustes para celular y documentación final | ⏳ |

Página publicada: <https://edison11870.github.io/Rendicion-Viaticos-Makyl/>

El formato oficial medido del Excel de la empresa está en [`templates/formato-rendicion.md`](templates/formato-rendicion.md).

## Cómo instalar (desarrollo)

Requisitos: [Node.js](https://nodejs.org) 20.19 o superior.

```bash
git clone https://github.com/Edison11870/Rendicion-Viaticos-Makyl.git
cd Rendicion-Viaticos-Makyl
npm install
npm run dev        # abre http://localhost:5173
```

Otros comandos:

```bash
npm run build      # genera la versión publicable en dist/
npm run preview    # prueba la versión publicable en local
npm test           # pruebas de extracción, validación y selección
npm run probar-ejemplos  # lee comprobantes reales de ejemplos/ (carpeta local, no se sube)
```

## Cómo usar

1. **Datos del viaje:** unidad minera / proyecto, fechas de salida y retorno, motivo y monto recibido.
2. **Comprobantes:** arrastra todos los PDF o fotos a la vez.
3. **Revisión:** la tabla muestra lo leído de cada comprobante; corrige lo que haga falta.
4. **Categoría y descripción:** la página propone una; tú la confirmas o la editas.
5. **Alertas:** revisa los comprobantes marcados (fecha fuera del viaje, datos incompletos, no emitido a
   nombre de MAKYL) y decide si entran.
6. **Movilidad sin comprobante:** registra los taxis sin comprobante en la planilla (respeta el tope diario
   configurable).
7. **Selección:** la página elige la combinación de comprobantes que cubre el monto recibido con el menor
   exceso posible.
8. **Descargas:** Excel de rendición, planilla de movilidad, PDF de comprobantes y lista de no usados.

## Publicación (GitHub Pages)

La página se publica gratis con GitHub Pages mediante la GitHub Action `.github/workflows/deploy.yml`
(corre las pruebas, `npm run build` y sube `dist/`). Cada cambio en `main` actualiza la página.

Configuración única en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Estructura

```
src/
  pasos/       una pantalla por paso del asistente
  extraccion/  lectura de PDF (pdf.js), OCR (tesseract.js) e interpretación de campos SUNAT
  estado/      cola de lectura de comprobantes
  componentes/ piezas de interfaz reutilizables
  reglas/      validaciones y cálculos (sin interfaz, con pruebas)
  util/        formato de montos y fechas
  almacen/     guardado local en el navegador
  config/      datos fijos de la empresa y parámetros por defecto
public/      archivos que se publican tal cual (logo; el OCR se copia en public/tesseract al compilar)
templates/   formato oficial de la empresa y logo
tests/       pruebas (Vitest)
```

## Tecnología

React + Vite · pdf.js (texto de PDF) · tesseract.js (OCR de fotos) · ExcelJS (Excel) · pdf-lib (PDF).
