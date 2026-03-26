import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrencyBadge, formatMoney, calcularTotalesMultiMoneda } from '../lib/currencyUtils'

var generarIdSerie = function() {
  var ahora = new Date()
  return (
    ahora.getFullYear().toString() +
    String(ahora.getMonth() + 1).padStart(2, '0') +
    String(ahora.getDate()).padStart(2, '0') +
    String(ahora.getHours()).padStart(2, '0') +
    String(ahora.getMinutes()).padStart(2, '0') +
    String(ahora.getSeconds()).padStart(2, '0')
  )
}

var formatFecha = function(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toISOString().split('T')[0]
}

export var exportarCierreCajaPDF = async function(cierre, fecha, nombreGimnasio) {
  if (!cierre) return

  nombreGimnasio = nombreGimnasio || 'GymControl'

  var doc = new jsPDF('p', 'mm', 'a4')
  var pageWidth = doc.internal.pageSize.getWidth()

  var idReporte = generarIdSerie()
  var fechaAuditada = formatFecha(fecha)
  var generado = new Date().toLocaleString()

  var pagos = cierre.detalle_pagos || []
  var totales = calcularTotalesMultiMoneda(pagos)
  var asistencias = cierre.asistencias || 0
  var detalleMetodos = cierre.detalle_metodos || {}

  // Calcular total descuentos
  var totalDescuentos = 0
  pagos.forEach(function(p) {
    totalDescuentos += Number(p.descuento || 0)
  })

  // ===== HEADER =====
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreGimnasio.toUpperCase(), 14, 16)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Cierre de Caja', 14, 23)

  doc.setFontSize(9)
  doc.text('ID Reporte: ' + idReporte, 14, 30)
  doc.text('Fecha auditada: ' + fechaAuditada, 14, 36)
  doc.text('Generado: ' + generado, 14, 42)

  // ===== RESUMEN =====
  var resumenRows = []
  if (totales.totalUsd > 0) resumenRows.push(['Total USD', '$ ' + formatMoney(totales.totalUsd)])
  if (totales.totalEur > 0) resumenRows.push(['Total EUR', 'EUR ' + formatMoney(totales.totalEur)])
  resumenRows.push(['Total Bs', 'Bs ' + formatMoney(totales.totalBs)])
  if (totalDescuentos > 0) resumenRows.push(['Total Descuentos', formatMoney(totalDescuentos)])
  resumenRows.push(['Asistencias', String(asistencias)])

  autoTable(doc, {
    startY: 50,
    head: [['Concepto', 'Valor']],
    body: resumenRows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold' }
  })

  // ===== DESGLOSE POR MÉTODO =====
  var metodosRows = Object.entries(detalleMetodos).map(function(entry) {
    return [
      entry[0].replace('_', ' '),
      'Bs ' + formatMoney(Number(entry[1] || 0))
    ]
  })

  if (metodosRows.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Método de pago', 'Monto Bs']],
      body: metodosRows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } }
    })
  }

  // ===== DETALLE DE PAGOS =====
  if (pagos.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Socio', 'Cédula', 'Método', 'Divisa', 'Monto', 'Bs', 'Descuento', 'Ref.']],
      body: pagos.map(function(p) {
        var moneda = (p.moneda_divisa || 'USD').toUpperCase()
        var montoPrincipal = Number(p.monto_divisa || p.monto_usd || 0)
        var descStr = Number(p.descuento || 0) > 0
          ? (getCurrencyBadge(moneda) + formatMoney(Number(p.descuento)) + (p.motivo_descuento ? ' (' + p.motivo_descuento + ')' : ''))
          : '-'
        return [
          (p.socios && p.socios.nombre) ? p.socios.nombre : '-',
          (p.socios && p.socios.cedula) ? p.socios.cedula : '-',
          p.metodo ? p.metodo.replace('_', ' ') : '-',
          moneda,
          getCurrencyBadge(moneda) + formatMoney(montoPrincipal),
          formatMoney(Number(p.monto_bs || 0)),
          descStr,
          p.referencia || '-'
        ]
      }),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22, halign: 'left' },
        1: { cellWidth: 20, halign: 'left' },
        2: { cellWidth: 20, halign: 'left' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 30, halign: 'left' },
        7: { cellWidth: 20, halign: 'right' }
      }
    })
  }

  // ===== FOOTER =====
  var totalPages = doc.getNumberOfPages()
  for (var i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      nombreGimnasio + ' · Documento generado automáticamente · Página ' + i + ' de ' + totalPages,
      pageWidth / 2,
      290,
      { align: 'center' }
    )
  }

  var nombreSlug = nombreGimnasio.toLowerCase().replace(/\s+/g, '_')
  doc.save(nombreSlug + '_cierre_' + fechaAuditada + '.pdf')
}