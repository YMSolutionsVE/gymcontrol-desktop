import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../config/supabase'

const generarIdSerie = () => Date.now().toString()

const formatFecha = (fecha) =>
  new Date(fecha).toISOString().split('T')[0]

const calcularRangoPeriodo = (periodoRaw) => {
  const periodo = String(periodoRaw || 'semana').trim()
  const hoy = new Date()
  let desde = new Date(hoy)
  let hasta = new Date(hoy)

  switch (periodo) {
    case 'dia': break
    case 'semana': desde.setDate(hoy.getDate() - 6); break
    case 'mes': desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1); break
    case '3m': desde.setMonth(hoy.getMonth() - 3); break
    case '6m': desde.setMonth(hoy.getMonth() - 6); break
    case '1a': desde.setFullYear(hoy.getFullYear() - 1); break
    default: desde.setDate(hoy.getDate() - 6); break
  }

  return {
    desde: formatFecha(desde),
    hasta: formatFecha(hasta)
  }
}

export const exportarCierresPeriodoPDF = async (periodo, gymId, nombreGimnasio = 'GymControl') => {
  if (!gymId) throw new Error('gym_id es requerido para exportar')
  const { desde, hasta } = calcularRangoPeriodo(periodo)

  const { data: cierres, error } = await supabase
    .from('cierres_caja')
    .select('fecha, total_usd, total_bs, asistencias')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .eq('gym_id', gymId)
    .order('fecha', { ascending: true })

  if (error || !cierres || cierres.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  const idReporte = generarIdSerie()
  const generado = new Date().toLocaleString()

  const totalUSD = cierres.reduce((s, c) => s + Number(c.total_usd || 0), 0)
  const totalBS = cierres.reduce((s, c) => s + Number(c.total_bs || 0), 0)
  const totalAsistencias = cierres.reduce((s, c) => s + Number(c.asistencias || 0), 0)

  // ===== HEADER =====
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

  // ===== TABLA =====
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

  // ===== TOTALES =====
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Totales']],
    body: [[`USD ${totalUSD.toFixed(2)} | Bs ${totalBS.toFixed(2)} | Asistencias ${totalAsistencias}`]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 130, 180], textColor: 255, fontStyle: 'bold' }
  })

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
  doc.save(`${nombreSlug}_cierres_${desde}_al_${hasta}.pdf`)
}