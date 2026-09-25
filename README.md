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

🚧 En desarrollo. Etapa 0: estructura del repositorio. El plan por etapas está en la conversación de diseño y
se irá reflejando aquí.

## Cómo instalar (desarrollo)

Requisitos: [Node.js](https://nodejs.org) 20 o superior.

```bash
git clone https://github.com/Edison11870/rendicion-viaticos-makyl.git
cd rendicion-viaticos-makyl
npm install
npm run dev        # abre http://localhost:5173
```

Otros comandos:

```bash
npm run build      # genera la versión publicable en dist/
npm run preview    # prueba la versión publicable en local
npm test           # pruebas de extracción, validación y selección
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

La página se publica gratis con GitHub Pages mediante una GitHub Action que corre `npm run build` y sube
`dist/`. Una vez configurada, cada cambio en `main` actualiza la página publicada.

## Estructura

```
src/         Código de la aplicación (React + Vite)
public/      Archivos estáticos que se publican tal cual (íconos, datos del OCR)
templates/   Formato oficial de la empresa (Rendición de Gastos, Planilla de Movilidad)
```

## Tecnología

React + Vite · pdf.js (texto de PDF) · tesseract.js (OCR de fotos) · ExcelJS (Excel) · pdf-lib (PDF).
