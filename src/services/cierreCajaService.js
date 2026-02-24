import { supabase } from '../config/supabase'

const obtenerFechaLocal = () => {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset()
  const fechaLocal = new Date(ahora.getTime() - offset * 60000)
  return fechaLocal.toISOString().split('T')[0]
}

// ============================================
// Obtener datos del día actual 
// ============================================
export const obtenerResumenHoy = async () => {
  const fechaHoy = obtenerFechaLocal()

  const inicio = new Date(fechaHoy + 'T00:00:00')
  const fin = new Date(fechaHoy + 'T23:59:59')

  const { data: pagos, error } = await supabase
    .from('pagos')
    .select(`
      id,
      monto_usd,
      monto_bs,
      metodo,
      referencia,
      socios (nombre, cedula)
    `)
    .gte('fecha_pago', inicio.toISOString())
    .lte('fecha_pago', fin.toISOString())

  if (error) {
    console.error(error)
    return null
  }

  const { count: asistencias } = await supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_hora', inicio.toISOString())
    .lte('fecha_hora', fin.toISOString())

  const totalUSD = pagos?.reduce((s, p) => s + Number(p.monto_usd || 0), 0) || 0
  const totalBS = pagos?.reduce((s, p) => s + Number(p.monto_bs || 0), 0) || 0

  const detalleMetodos = {}

  pagos?.forEach(p => {
    if (!detalleMetodos[p.metodo]) detalleMetodos[p.metodo] = 0
    detalleMetodos[p.metodo] += Number(p.monto_bs || 0)
  })

  return {
    fecha: fechaHoy,
    totalUSD,
    totalBS,
    asistencias: asistencias || 0,
    detalle_metodos: detalleMetodos,
    detalle_pagos: pagos || []
  }
}

// ============================================
// Guardar cierre
// ============================================
export const cerrarDia = async (usuarioId, resumen) => {
  const fechaHoy = obtenerFechaLocal()

  const { data: existente } = await supabase
    .from('cierres_caja')
    .select('id')
    .eq('fecha', fechaHoy)
    .maybeSingle()

  if (existente) {
    return { success: false, error: 'El cierre de hoy ya fue realizado' }
  }

  const { error } = await supabase
    .from('cierres_caja')
    .insert({
      fecha: fechaHoy,
      total_usd: resumen.totalUSD,
      total_bs: resumen.totalBS,
      asistencias: resumen.asistencias,
      detalle_metodos: resumen.detalle_metodos,
      detalle_pagos: resumen.detalle_pagos,
      cerrado_por: usuarioId
    })

  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================
// Obtener cierre por fecha
// ============================================
export const obtenerCierrePorFecha = async (fecha) => {
  const { data, error } = await supabase
    .from('cierres_caja')
    .select('*')
    .eq('fecha', fecha)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'No hay cierre guardado ese día' }

  return { success: true, data }
}

// ============================================
// 🆕 Obtener cierres por rango de fechas
// (SOLO cierres guardados en BD)
// ============================================
export const obtenerCierresPorRango = async (desde, hasta) => {
  if (!desde || !hasta) {
    return { success: false, error: 'Rango de fechas inválido' }
  }

  const { data, error } = await supabase
    .from('cierres_caja')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })

  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data || [] }
}
