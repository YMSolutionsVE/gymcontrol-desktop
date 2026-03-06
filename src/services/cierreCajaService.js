import { supabase } from '../config/supabase'

const obtenerFechaLocal = () => {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset()
  const fechaLocal = new Date(ahora.getTime() - offset * 60000)
  return fechaLocal.toISOString().split('T')[0]
}

export const obtenerResumenHoy = async (gymId = null) => {
  const fechaHoy = obtenerFechaLocal()
  const inicio = new Date(fechaHoy + 'T00:00:00')
  const fin = new Date(fechaHoy + 'T23:59:59')

  let pagosQuery = supabase
    .from('pagos')
    .select(`id, monto_usd, monto_bs, metodo, referencia, socios (nombre, cedula)`)
    .gte('fecha_pago', inicio.toISOString())
    .lte('fecha_pago', fin.toISOString())

  if (gymId) pagosQuery = pagosQuery.eq('gym_id', gymId)

  const { data: pagos, error } = await pagosQuery

  if (error) {
    console.error(error)
    return null
  }

  let asistQuery = supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_hora', inicio.toISOString())
    .lte('fecha_hora', fin.toISOString())

  if (gymId) asistQuery = asistQuery.eq('gym_id', gymId)

  const { count: asistencias } = await asistQuery

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

export const cerrarDia = async (usuarioId, resumen, gymId = null) => {
  const fechaHoy = obtenerFechaLocal()

  let existeQuery = supabase
    .from('cierres_caja')
    .select('id')
    .eq('fecha', fechaHoy)

  if (gymId) existeQuery = existeQuery.eq('gym_id', gymId)

  const { data: existente } = await existeQuery.maybeSingle()

  if (existente) {
    return { success: false, error: 'El cierre de hoy ya fue realizado' }
  }

  const insertData = {
    fecha: fechaHoy,
    total_usd: resumen.totalUSD,
    total_bs: resumen.totalBS,
    asistencias: resumen.asistencias,
    detalle_metodos: resumen.detalle_metodos,
    detalle_pagos: resumen.detalle_pagos,
    cerrado_por: usuarioId
  }

  if (gymId) insertData.gym_id = gymId

  const { error } = await supabase.from('cierres_caja').insert(insertData)

  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export const obtenerCierrePorFecha = async (fecha, gymId = null) => {
  let query = supabase
    .from('cierres_caja')
    .select('*')
    .eq('fecha', fecha)

  if (gymId) query = query.eq('gym_id', gymId)

  const { data, error } = await query.maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'No hay cierre guardado ese día' }

  return { success: true, data }
}

export const obtenerCierresPorRango = async (desde, hasta, gymId = null) => {
  if (!desde || !hasta) {
    return { success: false, error: 'Rango de fechas inválido' }
  }

  let query = supabase
    .from('cierres_caja')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })

  if (gymId) query = query.eq('gym_id', gymId)

  const { data, error } = await query

  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data || [] }
}