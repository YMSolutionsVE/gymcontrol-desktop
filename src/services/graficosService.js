import { supabase } from '../config/supabase'

export const getIngresosPorRango = async (fechaInicio, fechaFin, gymId = null) => {
  try {
    let query = supabase
      .from('cierres_caja')
      .select('fecha, total_usd, total_bs')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

    if (gymId) query = query.eq('gym_id', gymId)

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      data: data.map(d => ({
        fecha: d.fecha,
        usd: Number(d.total_usd) || 0,
        bs: Number(d.total_bs) || 0
      }))
    }
  } catch (error) {
    console.error('Error obteniendo ingresos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getAsistenciasPorRango = async (fechaInicio, fechaFin, gymId = null) => {
  try {
    const inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    const fin = new Date(fechaFin + 'T23:59:59').toISOString()

    let query = supabase
      .from('asistencias')
      .select('fecha_hora')
      .gte('fecha_hora', inicio)
      .lte('fecha_hora', fin)

    if (gymId) query = query.eq('gym_id', gymId)

    const { data, error } = await query

    if (error) throw error

    const agrupado = {}
    data.forEach(a => {
      const fecha = a.fecha_hora.split('T')[0]
      agrupado[fecha] = (agrupado[fecha] || 0) + 1
    })

    const resultado = Object.entries(agrupado).map(([fecha, cantidad]) => ({
      fecha,
      cantidad
    })).sort((a, b) => a.fecha.localeCompare(b.fecha))

    return { success: true, data: resultado }
  } catch (error) {
    console.error('Error obteniendo asistencias:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getMetricasResumen = async (fechaInicio, fechaFin, gymId = null) => {
  try {
    let cierresQuery = supabase
      .from('cierres_caja')
      .select('total_usd, total_bs')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)

    if (gymId) cierresQuery = cierresQuery.eq('gym_id', gymId)

    const { data: cierres, error: cierresError } = await cierresQuery

    if (cierresError) throw cierresError

    const totalUSD = cierres.reduce((sum, c) => sum + Number(c.total_usd || 0), 0)
    const totalBS = cierres.reduce((sum, c) => sum + Number(c.total_bs || 0), 0)

    const inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    const fin = new Date(fechaFin + 'T23:59:59').toISOString()

    let asistQuery = supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_hora', inicio)
      .lte('fecha_hora', fin)

    if (gymId) asistQuery = asistQuery.eq('gym_id', gymId)

    const { count, error: asistenciasError } = await asistQuery

    if (asistenciasError) throw asistenciasError

    return {
      success: true,
      data: { totalUSD, totalBS, totalAsistencias: count || 0 }
    }
  } catch (error) {
    console.error('Error obteniendo métricas:', error)
    return {
      success: false,
      error: error.message,
      data: { totalUSD: 0, totalBS: 0, totalAsistencias: 0 }
    }
  }
}