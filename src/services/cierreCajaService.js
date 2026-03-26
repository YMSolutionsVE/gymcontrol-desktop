import { supabase } from '../config/supabase'
import { calcularTotalesMultiMoneda } from '../lib/currencyUtils'

var obtenerFechaLocal = function() {
  var ahora = new Date()
  var offset = ahora.getTimezoneOffset()
  var fechaLocal = new Date(ahora.getTime() - offset * 60000)
  return fechaLocal.toISOString().split('T')[0]
}

export var obtenerResumenHoy = async function(gymId) {
  var fechaHoy = obtenerFechaLocal()
  var inicio = new Date(fechaHoy + 'T00:00:00')
  var fin = new Date(fechaHoy + 'T23:59:59')

  var pagosQuery = supabase
    .from('pagos')
    .select('id, monto_usd, monto_bs, moneda_divisa, monto_divisa, metodo, referencia, descuento, motivo_descuento, tasa_aplicada, socios (nombre, cedula)')
    .gte('fecha_pago', inicio.toISOString())
    .lte('fecha_pago', fin.toISOString())

  if (gymId) pagosQuery = pagosQuery.eq('gym_id', gymId)

  var pagosResult = await pagosQuery

  if (pagosResult.error) {
    console.error(pagosResult.error)
    return null
  }

  var pagos = pagosResult.data || []

  var asistQuery = supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_hora', inicio.toISOString())
    .lte('fecha_hora', fin.toISOString())

  if (gymId) asistQuery = asistQuery.eq('gym_id', gymId)

  var asistResult = await asistQuery
  var asistencias = asistResult.count || 0

  var totales = calcularTotalesMultiMoneda(pagos)

  var detalleMetodos = {}
  pagos.forEach(function(p) {
    if (!detalleMetodos[p.metodo]) detalleMetodos[p.metodo] = 0
    detalleMetodos[p.metodo] += Number(p.monto_bs || 0)
  })

  return {
    fecha: fechaHoy,
    totalUSD: totales.totalUsd,
    totalEUR: totales.totalEur,
    totalBS: totales.totalBs,
    asistencias: asistencias,
    detalle_metodos: detalleMetodos,
    detalle_pagos: pagos
  }
}

export var cerrarDia = async function(usuarioId, resumen, gymId) {
  var fechaHoy = obtenerFechaLocal()

  var existeQuery = supabase
    .from('cierres_caja')
    .select('id')
    .eq('fecha', fechaHoy)

  if (gymId) existeQuery = existeQuery.eq('gym_id', gymId)

  var existeResult = await existeQuery.maybeSingle()

  if (existeResult.data) {
    return { success: false, error: 'El cierre de hoy ya fue realizado' }
  }

  var insertData = {
    fecha: fechaHoy,
    total_usd: resumen.totalUSD || 0,
    total_eur: resumen.totalEUR || 0,
    total_bs: resumen.totalBS || 0,
    asistencias: resumen.asistencias,
    detalle_metodos: resumen.detalle_metodos,
    detalle_pagos: resumen.detalle_pagos,
    cerrado_por: usuarioId
  }

  if (gymId) insertData.gym_id = gymId

  var insertResult = await supabase.from('cierres_caja').insert(insertData)

  if (insertResult.error) {
    console.error(insertResult.error)
    return { success: false, error: insertResult.error.message }
  }

  return { success: true }
}

export var obtenerCierrePorFecha = async function(fecha, gymId) {
  var query = supabase
    .from('cierres_caja')
    .select('*')
    .eq('fecha', fecha)

  if (gymId) query = query.eq('gym_id', gymId)

  var result = await query.maybeSingle()

  if (result.error) return { success: false, error: result.error.message }
  if (!result.data) return { success: false, error: 'No hay cierre guardado ese día' }

  return { success: true, data: result.data }
}

export var obtenerCierresPorRango = async function(desde, hasta, gymId) {
  if (!desde || !hasta) {
    return { success: false, error: 'Rango de fechas inválido' }
  }

  var query = supabase
    .from('cierres_caja')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })

  if (gymId) query = query.eq('gym_id', gymId)

  var result = await query

  if (result.error) {
    console.error(result.error)
    return { success: false, error: result.error.message }
  }

  return { success: true, data: result.data || [] }
}