import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../config/supabase'

const generarIdSerie = () => Date.now().toString()

export const exportarCierresPeriodoPDF = async (desde, hasta, gymId, nombreGimnasio = 'GymControl') => {
  if (!gymId) throw new Error('gym_id es requerido para exportar')

  const { data: cierres, error } = await supabase
    .from('cierres_caja')
    .select('fecha, total_usd, total_bs, asistencias')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .eq('gym_id', gymId)
    .order('fecha', { ascending: true })

  if (error || !cierres || cierres.length === 0) {
    throw new Error('No hay datos para exportar en este rango')
  }

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  const idReporte = generarIdSerie()
  const generado = new Date().toLocaleString()

  const totalUSD = cierres.reduce((s, c) => s + Number(c.total_usd || 0), 0)
  const totalBS = cierres.reduce((s, c) => s + Number(c.total_bs || 0), 0)
  const totalAsistencias = cierres.reduce((s, c) => s + Number(c.asistencias || 0), 0)

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreGimnasio.toUpperCase(), 14, 16)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte Consolidado de Cierres', 14, 23)

  doc.setFontSize(9)
  doc.text(`ID Reporte: ${idReporte}`, 14, 30)
  doc.text(`Período: ${desde} al ${hasta}`, 14, 36)
  doc.text(`Generado: ${generado}`, 14, 42)

  autoTable(doc, {
    startY: 50,
    head: [['Fecha', 'USD', 'Bs', 'Asistencias']],
    body: cierres.map(c => [
      c.fecha,
      Number(c.total_usd || 0).toFixed(2),
      Number(c.total_bs || 0).toFixed(2),
      c.asistencias
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Totales']],
    body: [[`USD ${totalUSD.toFixed(2)} | Bs ${totalBS.toFixed(2)} | Asistencias ${totalAsistencias}`]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold' }
  })

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
  doc.save(`${nombreSlug}_cierres_${desde}_al_${hasta}.pdf`)
}