import { supabase } from '../config/supabase'
import { calcularTotalesMultiMoneda } from '../lib/currencyUtils'

function validarGymId(gymId) {
  if (!gymId) {
    console.error('cierreCajaService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

var obtenerFechaLocal = function() {
  var ahora = new Date()
  var offset = ahora.getTimezoneOffset()
  var fechaLocal = new Date(ahora.getTime() - offset * 60000)
  return fechaLocal.toISOString().split('T')[0]
}

export var obtenerResumenHoy = async function(gymId) {
  if (!validarGymId(gymId)) return null

  var fechaHoy = obtenerFechaLocal()
  var inicio = new Date(fechaHoy + 'T00:00:00')
  var fin = new Date(fechaHoy + 'T23:59:59')

  var pagosQuery = supabase
    .from('pagos')
    .select('id, monto_usd, monto_bs, moneda_divisa, monto_divisa, metodo, referencia, descuento, motivo_descuento, tasa_aplicada, socios (nombre, cedula)')
    .gte('fecha_pago', inicio.toISOString())
    .lte('fecha_pago', fin.toISOString())
    .eq('gym_id', gymId)

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
    .eq('gym_id', gymId)

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
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }

  var fechaHoy = obtenerFechaLocal()

  var existeResult = await supabase
    .from('cierres_caja')
    .select('id')
    .eq('fecha', fechaHoy)
    .eq('gym_id', gymId)
    .maybeSingle()

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
    cerrado_por: usuarioId,
    gym_id: gymId
  }

  var insertResult = await supabase.from('cierres_caja').insert(insertData)

  if (insertResult.error) {
    console.error(insertResult.error)
    return { success: false, error: insertResult.error.message }
  }

  return { success: true }
}

export var obtenerCierrePorFecha = async function(fecha, gymId) {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }

  var result = await supabase
    .from('cierres_caja')
    .select('*')
    .eq('fecha', fecha)
    .eq('gym_id', gymId)
    .maybeSingle()

  if (result.error) return { success: false, error: result.error.message }
  if (!result.data) return { success: false, error: 'No hay cierre guardado ese día' }

  return { success: true, data: result.data }
}

export var obtenerCierresPorRango = async function(desde, hasta, gymId) {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }
  if (!desde || !hasta) {
    return { success: false, error: 'Rango de fechas inválido' }
  }

  var result = await supabase
    .from('cierres_caja')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .eq('gym_id', gymId)
    .order('fecha', { ascending: true })

  if (result.error) {
    console.error(result.error)
    return { success: false, error: result.error.message }
  }

  return { success: true, data: result.data || [] }
}