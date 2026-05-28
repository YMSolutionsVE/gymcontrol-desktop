import { supabase } from '../config/supabase'
import ExcelJS from 'exceljs'

const COLORES = {
  headerBg: '1F2937',
  headerFont: 'FFFFFF',
  accentBlue: '4472C4',
  accentGreen: '10B981',
  accentOrange: 'FB923C',
  totalBg: '111827',
  totalFont: '10B981',
  bordeLigero: '374151',
  filaPar: 'F9FAFB',
  filaImpar: 'FFFFFF'
}

const estiloEncabezado = {
  font: { bold: true, color: { argb: COLORES.headerFont }, size: 11, name: 'Arial' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.headerBg } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: { bottom: { style: 'medium', color: { argb: COLORES.accentBlue } } }
}

const estiloTotales = {
  font: { bold: true, color: { argb: COLORES.totalFont }, size: 11, name: 'Arial' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.totalBg } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: { top: { style: 'medium', color: { argb: COLORES.accentGreen } } }
}

const aplicarEstiloFila = (row, esPar) => {
  row.eachCell((cell) => {
    cell.font = { size: 10, name: 'Arial' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: esPar ? COLORES.filaPar : COLORES.filaImpar }
    }
    cell.border = {
      bottom: { style: 'thin', color: { argb: COLORES.bordeLigero } }
    }
  })
}

const descargarWorkbook = async (workbook, nombreArchivo) => {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const exportarCierresPorPeriodoCSV = async (desde, hasta, gymId, nombreGimnasio = 'GymControl') => {
  if (!gymId) throw new Error('gym_id es requerido para exportar')
  const nombreSlug = nombreGimnasio.toLowerCase().replace(/\s+/g, '_')

  const { data, error } = await supabase
    .from('cierres_caja')
    .select('fecha,total_usd,total_eur,total_bs,asistencias')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .eq('gym_id', gymId)
    .order('fecha', { ascending: true })

  if (error) { console.error(error); throw new Error('Error obteniendo cierres') }
  if (!data || data.length === 0) throw new Error('No hay datos para exportar')

  const totalUSD = data.reduce((s, d) => s + Number(d.total_usd || 0), 0)
  const totalEUR = data.reduce((s, d) => s + Number(d.total_eur || 0), 0)
  const totalBS = data.reduce((s, d) => s + Number(d.total_bs || 0), 0)
  const totalAsistencias = data.reduce((s, d) => s + Number(d.asistencias || 0), 0)
  const generado = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })

  const tieneUSD = totalUSD > 0 || data.some(d => Number(d.total_usd || 0) > 0)
  const tieneEUR = totalEUR > 0 || data.some(d => Number(d.total_eur || 0) > 0)

  const wb = new ExcelJS.Workbook()
  wb.creator = `GymControl - ${nombreGimnasio}`
  wb.created = new Date()

  const ws = wb.addWorksheet('Consolidado de Cierres', { properties: { defaultColWidth: 18 } })

  const headers = ['Fecha']
  if (tieneUSD) headers.push('Total USD ($)')
  if (tieneEUR) headers.push('Total EUR (€)')
  headers.push('Total Bs', 'Asistencias')

  const colCount = headers.length
  const lastCol = String.fromCharCode(64 + colCount)

  ws.mergeCells(`A1:${lastCol}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = `${nombreGimnasio.toUpperCase()} — CONSOLIDADO DE CIERRES`
  titleCell.font = { bold: true, size: 14, color: { argb: COLORES.accentBlue }, name: 'Arial' }
  titleCell.alignment = { horizontal: 'center' }

  ws.mergeCells(`A2:${lastCol}2`)
  const subtitleCell = ws.getCell('A2')
  subtitleCell.value = `${nombreGimnasio}  |  Período: ${desde} al ${hasta}`
  subtitleCell.font = { size: 10, color: { argb: '6B7280' }, name: 'Arial' }
  subtitleCell.alignment = { horizontal: 'center' }

  ws.mergeCells(`A3:${lastCol}3`)
  const genCell = ws.getCell('A3')
  genCell.value = `Generado: ${generado}`
  genCell.font = { size: 9, color: { argb: '9CA3AF' }, name: 'Arial', italic: true }
  genCell.alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow(headers)
  headerRow.eachCell((cell) => {
    Object.assign(cell, {
      font: estiloEncabezado.font,
      fill: estiloEncabezado.fill,
      alignment: estiloEncabezado.alignment,
      border: estiloEncabezado.border
    })
  })
  headerRow.height = 28

  data.forEach((d, i) => {
    const rowData = [d.fecha]
    if (tieneUSD) rowData.push(Number(d.total_usd || 0))
    if (tieneEUR) rowData.push(Number(d.total_eur || 0))
    rowData.push(Number(d.total_bs || 0), Number(d.asistencias || 0))

    const row = ws.addRow(rowData)
    aplicarEstiloFila(row, i % 2 === 0)
  })

  ws.addRow([])

  const totData = ['TOTALES']
  if (tieneUSD) totData.push(totalUSD)
  if (tieneEUR) totData.push(totalEUR)
  totData.push(totalBS, totalAsistencias)

  const totRow = ws.addRow(totData)
  totRow.eachCell((cell) => {
    Object.assign(cell, {
      font: estiloTotales.font,
      fill: estiloTotales.fill,
      alignment: estiloTotales.alignment,
      border: estiloTotales.border
    })
  })
  totRow.height = 30

  let colIdx = 1
  ws.getColumn(colIdx).width = 16; colIdx++
  if (tieneUSD) { ws.getColumn(colIdx).width = 18; ws.getColumn(colIdx).numFmt = '$#,##0.00'; colIdx++ }
  if (tieneEUR) { ws.getColumn(colIdx).width = 18; ws.getColumn(colIdx).numFmt = '€#,##0.00'; colIdx++ }
  ws.getColumn(colIdx).width = 20; ws.getColumn(colIdx).numFmt = '#,##0.00'; colIdx++
  ws.getColumn(colIdx).width = 16; ws.getColumn(colIdx).numFmt = '#,##0'

  await descargarWorkbook(wb, `${nombreSlug}_cierres_${desde}_a_${hasta}.xlsx`)
}