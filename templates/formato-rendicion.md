# Formato oficial · Rendición de Gastos (MAKYL)

Medido del Excel original de la empresa (`RENDICION - Boroo Zaranda.xls`, hoja `RENDICION-MARCOBRE`).
Es la referencia que debe reproducir `src/salida/` (Etapa 6). No contiene datos personales.

## Hoja y página

| Propiedad | Valor |
|---|---|
| Nombre de hoja | `RENDICION-MARCOBRE` (hay una segunda hoja `Hoja1` vacía) |
| Papel | A4 vertical, escala 83 % |
| Márgenes (pulg.) | izq. 0.512 · der. 0.118 · sup. 0.157 · inf. 0.354 · sin encabezado/pie |
| Área de impresión | `A1:F61` |
| Fuente | Calibri 11 en toda la hoja |
| Logo | `logo-rendicion.jpg` (161×105 px, la imagen que usa la hoja), anclado de `B1` (+151) a `D5`. `logo-makyl.png` (con «ENGINEERING») es la otra imagen del archivo; se usa en la página |

## Columnas (ancho en caracteres de Excel)

| Col | Ancho | Uso |
|---|---|---|
| A | 10 (por defecto) | margen, vacía |
| B | 13.57 | FECHA |
| C | 15.29 | DOCUMENTO |
| D | 51.29 | Descripción |
| E | 13.14 | Nuevos Soles |
| F | 11.43 | Dólares |

## Celdas

| Celda | Contenido | Formato |
|---|---|---|
| `B4:F4` (combinada) | `RENDICIÓN DE GASTOS` | negrita, centrado |
| `B6` | `Persona que recibe : {apellidos nombres} ` | negrita |
| `B8` | `Fecha de entrega: {dd/mm/aaaa}` | negrita · `E8:F8` combinada vacía |
| `B10` | `Monto entregado : s/{monto}` | negrita |
| `B11` | `Forma de  entrega:` | negrita |
| `D11:F11` (combinada) | `TRANSFERENCIA    ok        EFECTIVO           CHEQUE N°   ` | normal; «ok» marca la forma usada |
| `B12` / `C12` | `PROYECTO :` / `{proyecto}` | negrita; B centrado |
| `B13:F13` | `FECHA` · `DOCUMENTO` · `Descripción ` · `Nuevos Soles` · `Dólares ` | negrita, centrado, borde fino |
| `B14:F52` | **39 filas de detalle** | borde fino en todas; ver abajo |
| `B53:D53` (combinada) | `Total gastos ` | negrita, centrado, borde medio arriba/abajo/izq. |
| `E53` | `=SUM(E14:E52)` | contable S/ , borde medio |
| `F53` | vacía | borde medio en los cuatro lados |
| `B55` | `Saldos Entregados :` | negrita |
| `B57` | `Fecha de rendición  : {dd/mm/aaaa}` | negrita · `E57:F57` combinada vacía |
| `B59` | `Persona que entrega: {apellidos nombres} ` | negrita |
| `B60` | `Persona que recibe: {administración}` | negrita |

Detalle (filas 14–52):

- `B` fecha real de Excel, formato `m/d/yy` (se ve `dd/mm/aaaa` con configuración regional de Perú), centrado.
- `C` serie-número como texto, centrado.
- `D` descripción, alineada a la izquierda con sangría 1.
- `E` número con formato contable
  `_-[$S/-280A]\ * #,##0.00_-;\-[$S/-280A]\ * #,##0.00_-;_-[$S/-280A]\ * "-"??_-;_-@_-`.
- `F` formato `"S/."#,##0.00;[Red]"S/."\-#,##0.00` (sin uso en los ejemplos).

Altos de fila (pt): 4→15, 5→13.5, 6→15, 7→4.5, 8→15, 9→5.25, 10→15, 11→16.5, 12→18, 13–51→15,
52–53→15.75, 54→9, 55→14.25, 56 oculta, 57→15.75, 58 oculta, 59–60→21, 61→14.25.

> Nota: los PDF que se entregaron salieron en papel Carta (se imprimieron con otra configuración);
> el archivo guarda A4 al 83 %. Se sigue el archivo.

# Formato · Planilla de Movilidad Diaria

No vino en el Excel; se reconstruye del PDF impreso (A4 vertical, Calibri).

- Título `Planilla de Movilidad Diaria` (negrita) y a la derecha `Planilla No {NNN}`.
- `I.- Datos de la Empresa` (negrita, subrayado): Razón Social · RUC · DIA · FECHA DE EMISIÓN.
- `II.- Datos del trabajador y del Desplazamiento` (negrita, subrayado): Nombres y Apellidos · DNI.
- Tabla con borde: `Motivo` · `Destino` · `Sub Total S/.` · `Total, Trabajador S/.` · `Firma del Trabajador`,
  3 filas de detalle; «Total, Trabajador» y «Firma» combinadas verticalmente.
- `Total, Movilidad del día` con el total en `S/` y doble subrayado.
- Marco exterior alrededor de toda la planilla.

# Decisiones confirmadas con el usuario

1. **«Total, Trabajador S/.»** (planilla): en los PDF sale «1», resto de la plantilla. Va el **total del día**.
2. **Planilla sin comprobante** también para alimentación (práctica de la empresa), pero la selección
   **prioriza comprobantes** (facturas/boletas) y usa planillas solo si hacen falta. El tope diario
   (4 % RMV, configurable) es **alerta, no bloqueo**.
3. **«Saldos Entregados :»** lleva la **diferencia** = monto entregado − total gastos
   (positiva: a devolver por el trabajador; negativa: a favor del trabajador).
4. Normalizaciones: «CONSUMO DE ALIMENTOS» (el original dice «DEALIMENTOS»), DOCUMENTO como
   `SERIE-NÚMERO` (p. ej. `E001-9951`), «Planilla N° 001».
5. Orden de filas: primero comprobantes por fecha, luego planillas por número.
