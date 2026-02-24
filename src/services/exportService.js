import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

export const exportarCierreCajaPDF = async (cierre, fecha) => {
  if (!cierre) return

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  const idReporte = generarIdSerie()
  const fechaAuditada = formatFecha(fecha)
  const generado = new Date().toLocaleString()

  const totalUSD = Number(cierre.totalUSD || cierre.total_usd || 0)
  const totalBS = Number(cierre.totalBS || cierre.total_bs || 0)
  const asistencias = cierre.asistencias || 0
  const detalleMetodos = cierre.detalle_metodos || {}
  const pagos = cierre.detalle_pagos || []

  // ===== HEADER =====
  doc.setFontSize(16)
  doc.text('Reporte de Cierre de Caja', 14, 20)

  doc.setFontSize(10)
  doc.text(`ID Reporte: ${idReporte}`, 14, 28)
  doc.text(`Fecha auditada: ${fechaAuditada}`, 14, 34)
  doc.text(`Generado: ${generado}`, 14, 40)

  // ===== RESUMEN =====
  autoTable(doc, {
    startY: 48,
    head: [['Concepto', 'Valor']],
    body: [
      ['Total USD', `$ ${totalUSD.toFixed(2)}`],
      ['Total Bs', `Bs ${totalBS.toFixed(2)}`],
      ['Asistencias', asistencias]
    ],
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [40, 130, 180],
      textColor: 255,
      fontStyle: 'bold'
    }
  })

  // ===== DESGLOSE POR MÉTODO =====
  const metodosRows = Object.entries(detalleMetodos).map(([m, v]) => [
    m.replace('_', ' '),
    `Bs ${Number(v || 0).toFixed(2)}`
  ])

  if (metodosRows.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Método de pago', 'Monto Bs']],
      body: metodosRows,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [40, 130, 180],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'right'
      },
      columnStyles: {
        1: { halign: 'right' }
      }
    })
  }

  // ===== DETALLE DE PAGOS =====
  if (pagos.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [[
        'Socio',
        'Cédula',
        'Método',
        'USD',
        'Bs',
        'Referencia'
      ]],
      body: pagos.map(p => [
        p.socios?.nombre || '-',
        p.socios?.cedula || '-',
        p.metodo ? p.metodo.replace('_', ' ') : '-',
        Number(p.monto_usd || 0).toFixed(2),
        Number(p.monto_bs || 0).toFixed(2),
        p.referencia || '-'
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [40, 130, 180],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'left' },
        1: { cellWidth: 30, halign: 'left' },
        2: { cellWidth: 30, halign: 'left' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' }
      }
    })
  }

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Documento generado automáticamente · Página ${i} de ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    )
  }

  doc.save(`cierre_${fechaAuditada}.pdf`)
}
