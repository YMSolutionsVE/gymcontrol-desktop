import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrencyBadge, formatMoney, calcularTotalesMultiMoneda } from '../lib/currencyUtils'

const generarIdSerie = () => {
  const ahora = new Date()
  return (
    ahora.getFullYear().toString() +
    String(ahora.getMonth() + 1).padStart(2, '0') +
    String(ahora.getDate()).padStart(2, '0') +
    String(ahora.getHours()).padStart(2, '0') +
    String(ahora.getMinutes()).padStart(2, '0') +
    String(ahora.getSeconds()).padStart(2, '0')
  )
}

const formatFecha = (fecha) => {
  if (!fecha) return '-'
  return new Date(fecha).toISOString().split('T')[0]
}

export const exportarCierreCajaPDF = async (cierre, fecha, nombreGimnasio = 'GymControl') => {
  if (!cierre) return

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  const idReporte = generarIdSerie()
  const fechaAuditada = formatFecha(fecha)
  const generado = new Date().toLocaleString()

  const pagos = cierre.detalle_pagos || []
  const totales = calcularTotalesMultiMoneda(pagos)
  const asistencias = cierre.asistencias || 0
  const detalleMetodos = cierre.detalle_metodos || {}

  // ===== HEADER =====
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreGimnasio.toUpperCase(), 14, 16)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Cierre de Caja', 14, 23)

  doc.setFontSize(9)
  doc.text(`ID Reporte: ${idReporte}`, 14, 30)
  doc.text(`Fecha auditada: ${fechaAuditada}`, 14, 36)
  doc.text(`Generado: ${generado}`, 14, 42)

  // ===== RESUMEN — dinámico según monedas =====
  const resumenRows = []
  if (totales.totalUsd > 0) resumenRows.push(['Total USD', `$ ${formatMoney(totales.totalUsd)}`])
  if (totales.totalEur > 0) resumenRows.push(['Total EUR', `EUR ${formatMoney(totales.totalEur)}`])
  resumenRows.push(['Total Bs', `Bs ${formatMoney(totales.totalBs)}`])
  resumenRows.push(['Asistencias', asistencias])

  autoTable(doc, {
    startY: 50,
    head: [['Concepto', 'Valor']],
    body: resumenRows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold' }
  })

  // ===== DESGLOSE POR MÉTODO =====
  const metodosRows = Object.entries(detalleMetodos).map(([m, v]) => [
    m.replace('_', ' '),
    `Bs ${formatMoney(Number(v || 0))}`
  ])

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
      head: [['Socio', 'Cédula', 'Método', 'Divisa', 'Monto', 'Bs', 'Referencia']],
      body: pagos.map(p => {
        const moneda = (p.moneda_divisa || 'USD').toUpperCase()
        const montoPrincipal = Number(p.monto_divisa || p.monto_usd || 0)
        return [
          p.socios?.nombre || '-',
          p.socios?.cedula || '-',
          p.metodo ? p.metodo.replace('_', ' ') : '-',
          moneda,
          `${getCurrencyBadge(moneda)}${formatMoney(montoPrincipal)}`,
          formatMoney(Number(p.monto_bs || 0)),
          p.referencia || '-'
        ]
      }),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 22, halign: 'left' },
        2: { cellWidth: 22, halign: 'left' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' }
      }
    })
  }

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `${nombreGimnasio} · Documento generado automáticamente · Página ${i} de ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    )
  }

  const nombreSlug = nombreGimnasio.toLowerCase().replace(/\s+/g, '_')
  doc.save(`${nombreSlug}_cierre_${fechaAuditada}.pdf`)
}