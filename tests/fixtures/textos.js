// Textos de comprobantes ANONIMIZADOS: reproducen la forma exacta en que pdf.js / el OCR entregan
// cada diseño real (portal SUNAT, facturadores privados, ticket térmico), con nombres, RUC y
// direcciones inventados. Los RUC falsos tienen dígito verificador válido.
// El RUC de MAKYL (receptor) es público y se mantiene.

export const portalSunat = `PEREZ QUISPE JUAN CARLOS   FACTURA ELECTRÓNICA
PEREZ QUISPE JUAN CARLOS
RUC:10123456781
AV. LOS PINOS 123 URB. LAS FLORES
E001 100-
SAN JUAN DE LURIGANCHO - LIMA - LIMA
Formato de Pago :Al Contado
Fecha de Emisión :16/03/2026
Señor (es)   :
MAKYL ENGINEERING CONSULTING SERVICES E.I.R.L
RUC   :20523643534   Tipo de Moneda   :SOLES
Lugar de entrega :
JR. ALMERIA 299 URB. JAVIER PRADO
Cantidad Unidad Medida   Código   Descripción   Valor Unitario
1.00   UNIDAD   001   SERVICIO DE TAXI MOVIL DE SAN LUIS _ SAN   34.80
JUAN
Sub Total Ventas :   34.80
Descuentos :   0.00
Valor Venta :   34.80
IGV :   0.00
-   Importe Total :   34.80
SON: TREINTA Y CUATRO Y 80/100 SOLES
Esta es una representación impresa de la factura electrónica E001 - 100, generada en el Sistema de SUNAT.
Puede verificarla utilizando su clave SOL.`

export const portalSunatEmpresa = `E.T.X. S.A.   FACTURA ELECTRÓNICA
EMPRESA DE TAXI EJEMPLO S.A.
RUC:20111111112
CAL. LAS GAVIOTAS 159 URB. EJEMPLO
E001 9951-
CALLAO - PROV. CONST. DEL CALLAO
Fecha de Emisión :06/03/2026
Señor (es)   :
MAKYL ENGINEERING CONSULTING SERVICES E.I.R.L
RUC   :20523643534   Tipo de Moneda   :SOLES
Cantidad Unidad Medida   Código   Descripción   Valor Unitario
1.00   UNIDAD   GRV   SERVICIO DE TAXI AEROPUERTO - PLAYA LOS DELFINES   80.00
Sub Total Ventas :   80.00
IGV :   0.00
-   Importe Total :   80.00
SON: OCHENTA Y 00/100 SOLES
Esta es una representación impresa de la factura electrónica E001 - 9951, generada en el Sistema de SUNAT.`

export const facturadorDosLineas = `EMPRESA DE TRANSPORTES EJEMPLO
AEROPUERTO SA
FACTURA ELECTRÓNICA
RUC 20222222223
AV. AVIACION NRO. S/N INT. 06   FA01-00034972
HUANCHACO , TRUJILLO - LA LIBERTAD
Central telefónica: -900000000
FECHA DE EMISIÓN : 2026-03-02
FECHA DE
: 2026-03-09
VENCIMIENTO
CLIENTE:   : MAKYL ENGINEERING CONSULTING SERVICES E.I.R.L
RUC   : 20523643534
CANT. UNIDAD DESCRIPCIÓN   MODELO LOTE   SERIE   P.UNIT   DTO.   TOTAL
1   Servicio De movilidad,Aeropuerto al Hotel   30.00   0   30.00
OP. EXONERADAS: S/   30.00
IGV: S/   0.00
TOTAL A PAGAR: S/   30.00
SON: TREINTA CON 00/100 SOLES`

export const facturadorConIgv = `TIENDA EJEMPLO S.A.C.
20333333334
AV. NICOLÁS ARRIOLA NRO. 100 LIMA - LIMA - LA VICTORIA
FACTURA ELECTRONICA
F008-00000015
FECHA DE EMISION: 21/02/2026
SEÑOR:   MAKYL ENGINEERING CONSULTING SERVICES E I R L
Nº DOC:   20523643534
Des. Articulo   Cantidad   Valor Unitario   Precio Unitario   Valor Total
Integral Miel   1.00   1.36   1.50   1.36
Agua San Luis 1L   1.00   3.62   4.00   3.62
SON: CATORCE CON 00/100 SOLES
Total Dscto :   S/ 0.00
Op. Gravada :   S/ 12.67
I.G.V :   S/ 1.33
IMPORTE TOTAL :   S/ 14.00`

export const nombreComercialArriba = `ECO EJEMPLO
FACTURA ELECTRONICA
ROJAS DIAZ MARIA
RUC: 10876543210
CAR. PRINCIPAL KM. 140
E001-605
Fecha de Emisión   : 02/03/2026   Forma de pago: Contado
MAKYL ENGINEERING CONSULTING
Señor(es)   :
SERVICES E.I.R.L
RUC   : 20523643534
Cantidad   Unidad Medida   Descripción   Valor Unitario   ICBPER
1.00   UNIDAD   CONSUMO   16.9491525   0.00
Sub Total Ventas :   S/ 16.95
IGV :   S/ 3.05
SON: VEINTE Y 00/100 SOLES   ICBPER :   S/ 0.00
Importe Total :   S/ 20.00`

// Ticket fotografiado: el OCR cortó el RUC del emisor y leyó mal la línea «Total»
export const ticketOcr = `EJEMPLO
Ejemplo Comida & Café
RUC 205561
AV. AVIACION S/N HUANCHACO
FACTURA ELECTRONICA
f023-00002781
MAKYL ENGINEERING CONSULTING SERVICES E.L.R.L
R.U.C.: 20523643534
1 CAFE CAPPUCCINO 12.00
1 EMPANADA DE POLLO 16.50
OP. GRAVADA: S/22.98
16V 18%: S/4.14
RC 6%: y
Total: S/1.38
TOTAL A PAGAR: S/28.50
Son: VEINTIOCHO Y 50/100 SOLES
Fecha de emisión: 06/03/2026 05:18 a.m.`

export const capturaYape = `1:04
¡Yapeaste! Compartir
S/ 90
Nombre Ejemplo
02 mar. 2026 | 3:23 a.m.
DATOS DE LA TRANSACCIÓN
Destino Plin
Nro. de operación 1603810`
