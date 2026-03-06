import { supabase } from '../config/supabase'
import ExcelJS from 'exceljs'

const normalizarPeriodo = (periodo) => {
  if (!periodo) return 'semana'
  const map = {
    'semana': 'semana', 'Semana actual': 'semana',
    'mes': 'mes', 'Mes actual': 'mes',
    '3m': '3m', 'Últimos 3 meses': '3m',
    '6m': '6m', 'Últimos 6 meses': '6m',
    '1a': '1a', 'Último año': '1a'
  }
  return map[periodo] || 'semana'
}

const calcularRangoPeriodo = (periodoRaw) => {
  const periodo = normalizarPeriodo(periodoRaw)
  const hoy = new Date()
  let desde
  const hasta = hoy.toISOString().split('T')[0]

  switch (periodo) {
    case 'semana': { const d = new Date(); d.setDate(hoy.getDate() - 6); desde = d.toISOString().split('T')[0]; break }
    case 'mes': { const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1); desde = d.toISOString().split('T')[0]; break }
    case '3m': { const d = new Date(); d.setMonth(hoy.getMonth() - 3); desde = d.toISOString().split('T')[0]; break }
    case '6m': { const d = new Date(); d.setMonth(hoy.getMonth() - 6); desde = d.toISOString().split('T')[0]; break }
    case '1a': { const d = new Date(); d.setFullYear(hoy.getFullYear() - 1); desde = d.toISOString().split('T')[0]; break }
    default: { const d = new Date(); d.setDate(hoy.getDate() - 6); desde = d.toISOString().split('T')[0] }
  }

  return { desde, hasta }
}

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

export const exportarCierresPorPeriodoCSV = async (periodoRaw, gymId = null, nombreGimnasio = 'GymControl') => {
  const { desde, hasta } = calcularRangoPeriodo(periodoRaw)
  const nombreSlug = nombreGimnasio.toLowerCase().replace(/\s+/g, '_')

  let query = supabase
    .from('cierres_caja')
    .select('fecha,total_usd,total_bs,asistencias')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })

  if (gymId) query = query.eq('gym_id', gymId)

  const { data, error } = await query

  if (error) { console.error(error); throw new Error('Error obteniendo cierres') }
  if (!data || data.length === 0) throw new Error('No hay datos para exportar')

  const totalUSD = data.reduce((s, d) => s + Number(d.total_usd || 0), 0)
  const totalBS = data.reduce((s, d) => s + Number(d.total_bs || 0), 0)
  const totalAsistencias = data.reduce((s, d) => s + Number(d.asistencias || 0), 0)
  const generado = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })

  const wb = new ExcelJS.Workbook()
  wb.creator = `GymControl - ${nombreGimnasio}`
  wb.created = new Date()

  const ws = wb.addWorksheet('Consolidado de Cierres', { properties: { defaultColWidth: 18 } })

  ws.mergeCells('A1:D1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `${nombreGimnasio.toUpperCase()} — CONSOLIDADO DE CIERRES`
  titleCell.font = { bold: true, size: 14, color: { argb: COLORES.accentBlue }, name: 'Arial' }
  titleCell.alignment = { horizontal: 'center' }

  ws.mergeCells('A2:D2')
  const subtitleCell = ws.getCell('A2')
  subtitleCell.value = `${nombreGimnasio}  |  Período: ${desde} al ${hasta}`
  subtitleCell.font = { size: 10, color: { argb: '6B7280' }, name: 'Arial' }
  subtitleCell.alignment = { horizontal: 'center' }

  ws.mergeCells('A3:D3')
  const genCell = ws.getCell('A3')
  genCell.value = `Generado: ${generado}`
  genCell.font = { size: 9, color: { argb: '9CA3AF' }, name: 'Arial', italic: true }
  genCell.alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow(['Fecha', 'Total USD ($)', 'Total Bs', 'Asistencias'])
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
    const row = ws.addRow([
      d.fecha,
      Number(d.total_usd || 0),
      Number(d.total_bs || 0),
      Number(d.asistencias || 0)
    ])
    aplicarEstiloFila(row, i % 2 === 0)
  })

  ws.addRow([])
  const totRow = ws.addRow(['TOTALES', totalUSD, totalBS, totalAsistencias])
  totRow.eachCell((cell) => {
    Object.assign(cell, {
      font: estiloTotales.font,
      fill: estiloTotales.fill,
      alignment: estiloTotales.alignment,
      border: estiloTotales.border
    })
  })
  totRow.height = 30

  ws.getColumn(1).width = 16
  ws.getColumn(2).width = 18
  ws.getColumn(3).width = 20
  ws.getColumn(4).width = 16
  ws.getColumn(2).numFmt = '$#,##0.00'
  ws.getColumn(3).numFmt = '#,##0.00'
  ws.getColumn(4).numFmt = '#,##0'

  await descargarWorkbook(wb, `${nombreSlug}_cierres_${desde}_a_${hasta}.xlsx`)
}

export const exportarMiembrosXLSX = async (gymId = null, nombreGimnasio = 'GymControl') => {
  const nombreSlug = nombreGimnasio.toLowerCase().replace(/\s+/g, '_')

  let query = supabase
    .from('socios')
    .select('nombre,cedula,telefono,plan_actual,fecha_vencimiento,activo')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (gymId) query = query.eq('gym_id', gymId)

  const { data, error } = await query

  if (error) throw new Error('Error obteniendo miembros')
  if (!data || data.length === 0) throw new Error('No hay miembros para exportar')

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const calcEstado = (fv) => {
    if (!fv) return 'Sin plan'
    const v = new Date(fv + 'T00:00:00')
    const dias = Math.ceil((v - hoy) / (1000 * 60 * 60 * 24))
    if (dias < 0) return 'Vencido'
    if (dias <= 3) return 'Por vencer'
    return 'Activo'
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = `GymControl - ${nombreGimnasio}`
  const ws = wb.addWorksheet('Miembros', { properties: { defaultColWidth: 18 } })

  ws.mergeCells('A1:F1')
  const title = ws.getCell('A1')
  title.value = `${nombreGimnasio.toUpperCase()} — LISTA DE MIEMBROS`
  title.font = { bold: true, size: 14, color: { argb: COLORES.accentBlue }, name: 'Arial' }
  title.alignment = { horizontal: 'center' }

  ws.mergeCells('A2:F2')
  const sub = ws.getCell('A2')
  sub.value = `${nombreGimnasio}  |  ${data.length} miembros activos  |  ${new Date().toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })}`
  sub.font = { size: 10, color: { argb: '6B7280' }, name: 'Arial' }
  sub.alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow(['Nombre', 'Cédula', 'Teléfono', 'Plan', 'Vencimiento', 'Estado'])
  headerRow.eachCell((cell) => {
    Object.assign(cell, {
      font: estiloEncabezado.font,
      fill: estiloEncabezado.fill,
      alignment: estiloEncabezado.alignment,
      border: estiloEncabezado.border
    })
  })
  headerRow.height = 28

  data.forEach((s, i) => {
    const estado = calcEstado(s.fecha_vencimiento)
    const row = ws.addRow([
      s.nombre,
      s.cedula,
      s.telefono || '—',
      (s.plan_actual || 'Sin plan').charAt(0).toUpperCase() + (s.plan_actual || 'sin plan').slice(1),
      s.fecha_vencimiento || '—',
      estado
    ])
    aplicarEstiloFila(row, i % 2 === 0)

    const estadoCell = row.getCell(6)
    if (estado === 'Activo') estadoCell.font = { color: { argb: '10B981' }, bold: true, size: 10, name: 'Arial' }
    if (estado === 'Vencido') estadoCell.font = { color: { argb: 'EF4444' }, bold: true, size: 10, name: 'Arial' }
    if (estado === 'Por vencer') estadoCell.font = { color: { argb: 'FBBF24' }, bold: true, size: 10, name: 'Arial' }
  })

  ws.getColumn(1).width = 28
  ws.getColumn(2).width = 14
  ws.getColumn(3).width = 16
  ws.getColumn(4).width = 12
  ws.getColumn(5).width = 16
  ws.getColumn(6).width = 14

  await descargarWorkbook(wb, `${nombreSlug}_miembros_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportarPagosDelDiaXLSX = async (gymId = null, nombreGimnasio = 'GymControl') => {
  const nombreSlug = nombreGimnasio.toLowerCase().replace(/\s+/g, '_')
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
  const inicio = new Date(hoy + 'T00:00:00').toISOString()
  const fin = new Date(hoy + 'T23:59:59').toISOString()

  let query = supabase
    .from('pagos')
    .select('monto_usd,monto_bs,metodo,referencia,fecha_pago,socios(nombre,cedula)')
    .gte('fecha_pago', inicio)
    .lte('fecha_pago', fin)
    .order('fecha_pago', { ascending: false })

  if (gymId) query = query.eq('gym_id', gymId)

  const { data, error } = await query

  if (error) throw new Error('Error obteniendo pagos')
  if (!data || data.length === 0) throw new Error('No hay pagos hoy para exportar')

  const totalUSD = data.reduce((s, p) => s + Number(p.monto_usd || 0), 0)
  const totalBS = data.reduce((s, p) => s + Number(p.monto_bs || 0), 0)

  const wb = new ExcelJS.Workbook()
  wb.creator = `GymControl - ${nombreGimnasio}`
  const ws = wb.addWorksheet('Pagos del Día', { properties: { defaultColWidth: 16 } })

  ws.mergeCells('A1:F1')
  const title = ws.getCell('A1')
  title.value = `${nombreGimnasio.toUpperCase()} — PAGOS DEL DÍA ${hoy}`
  title.font = { bold: true, size: 14, color: { argb: COLORES.accentBlue }, name: 'Arial' }
  title.alignment = { horizontal: 'center' }

  ws.mergeCells('A2:F2')
  const sub = ws.getCell('A2')
  sub.value = `${nombreGimnasio}  |  ${data.length} pagos registrados`
  sub.font = { size: 10, color: { argb: '6B7280' }, name: 'Arial' }
  sub.alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow(['Miembro', 'Cédula', 'Método', 'USD', 'Bs', 'Referencia'])
  headerRow.eachCell((cell) => {
    Object.assign(cell, {
      font: estiloEncabezado.font,
      fill: estiloEncabezado.fill,
      alignment: estiloEncabezado.alignment,
      border: estiloEncabezado.border
    })
  })
  headerRow.height = 28

  data.forEach((p, i) => {
    const metodo = (p.metodo || '').replace('_', ' ')
    const row = ws.addRow([
      p.socios?.nombre || '—',
      p.socios?.cedula || '—',
      metodo.charAt(0).toUpperCase() + metodo.slice(1),
      Number(p.monto_usd || 0),
      Number(p.monto_bs || 0),
      p.referencia || '—'
    ])
    aplicarEstiloFila(row, i % 2 === 0)
  })

  ws.addRow([])
  const totRow = ws.addRow(['TOTALES', '', '', totalUSD, totalBS, ''])
  totRow.eachCell((cell) => {
    Object.assign(cell, {
      font: estiloTotales.font,
      fill: estiloTotales.fill,
      alignment: estiloTotales.alignment,
      border: estiloTotales.border
    })
  })
  totRow.height = 30

  ws.getColumn(1).width = 28
  ws.getColumn(2).width = 14
  ws.getColumn(3).width = 16
  ws.getColumn(4).width = 14; ws.getColumn(4).numFmt = '$#,##0.00'
  ws.getColumn(5).width = 16; ws.getColumn(5).numFmt = '#,##0.00'
  ws.getColumn(6).width = 16

  await descargarWorkbook(wb, `${nombreSlug}_pagos_${hoy}.xlsx`)
}

export const exportarAsistenciasDelDiaXLSX = async (gymId = null, nombreGimnasio = 'GymControl') => {
  const nombreSlug = nombreGimnasio.toLowerCase().replace(/\s+/g, '_')
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
  const inicio = new Date(hoy + 'T00:00:00').toISOString()
  const fin = new Date(hoy + 'T23:59:59').toISOString()

  let query = supabase
    .from('asistencias')
    .select('fecha_hora,socios(nombre,cedula,plan_actual)')
    .gte('fecha_hora', inicio)
    .lte('fecha_hora', fin)
    .order('fecha_hora', { ascending: false })

  if (gymId) query = query.eq('gym_id', gymId)

  const { data, error } = await query

  if (error) throw new Error('Error obteniendo asistencias')
  if (!data || data.length === 0) throw new Error('No hay asistencias hoy para exportar')

  const vistos = new Set()
  const unicos = data.filter(a => {
    const key = a.socios?.cedula
    if (vistos.has(key)) return false
    vistos.add(key)
    return true
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = `GymControl - ${nombreGimnasio}`
  const ws = wb.addWorksheet('Asistencias del Día', { properties: { defaultColWidth: 18 } })

  ws.mergeCells('A1:D1')
  const title = ws.getCell('A1')
  title.value = `${nombreGimnasio.toUpperCase()} — ASISTENCIAS DEL DÍA ${hoy}`
  title.font = { bold: true, size: 14, color: { argb: COLORES.accentBlue }, name: 'Arial' }
  title.alignment = { horizontal: 'center' }

  ws.mergeCells('A2:D2')
  const sub = ws.getCell('A2')
  sub.value = `${nombreGimnasio}  |  ${unicos.length} entradas registradas`
  sub.font = { size: 10, color: { argb: '6B7280' }, name: 'Arial' }
  sub.alignment = { horizontal: 'center' }

  ws.addRow([])

  const headerRow = ws.addRow(['Miembro', 'Cédula', 'Plan', 'Hora de Entrada'])
  headerRow.eachCell((cell) => {
    Object.assign(cell, {
      font: estiloEncabezado.font,
      fill: estiloEncabezado.fill,
      alignment: estiloEncabezado.alignment,
      border: estiloEncabezado.border
    })
  })
  headerRow.height = 28

  unicos.forEach((a, i) => {
    const hora = new Date(a.fecha_hora).toLocaleTimeString('es-VE', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas'
    })
    const plan = (a.socios?.plan_actual || 'Sin plan')
    const row = ws.addRow([
      a.socios?.nombre || '—',
      a.socios?.cedula || '—',
      plan.charAt(0).toUpperCase() + plan.slice(1),
      hora
    ])
    aplicarEstiloFila(row, i % 2 === 0)
  })

  ws.addRow([])
  const totRow = ws.addRow([`Total: ${unicos.length} asistencias`, '', '', ''])
  totRow.getCell(1).font = { bold: true, color: { argb: COLORES.accentBlue }, size: 11, name: 'Arial' }

  ws.getColumn(1).width = 28
  ws.getColumn(2).width = 14
  ws.getColumn(3).width = 14
  ws.getColumn(4).width = 18

  await descargarWorkbook(wb, `${nombreSlug}_asistencias_${hoy}.xlsx`)
}