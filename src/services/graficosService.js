import { supabase } from '../config/supabase'

// Obtener ingresos por rango de fechas (desde cierres_caja)
export const getIngresosPorRango = async (fechaInicio, fechaFin) => {
  try {
    const { data, error } = await supabase
      .from('cierres_caja')
      .select('fecha, total_usd, total_bs')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

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

// Obtener asistencias agrupadas por fecha
export const getAsistenciasPorRango = async (fechaInicio, fechaFin) => {
  try {
    const inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    const fin = new Date(fechaFin + 'T23:59:59').toISOString()

    const { data, error } = await supabase
      .from('asistencias')
      .select('fecha_hora')
      .gte('fecha_hora', inicio)
      .lte('fecha_hora', fin)

    if (error) throw error

    // Agrupar por fecha (día completo)
    const agrupado = {}
    data.forEach(a => {
      const fecha = a.fecha_hora.split('T')[0]
      agrupado[fecha] = (agrupado[fecha] || 0) + 1
    })

    // Convertir a array ordenado
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

// Calcular métricas resumen para un rango
export const getMetricasResumen = async (fechaInicio, fechaFin) => {
  try {
    // Ingresos totales del periodo
    const { data: cierres, error: cierresError } = await supabase
      .from('cierres_caja')
      .select('total_usd, total_bs')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)

    if (cierresError) throw cierresError

    const totalUSD = cierres.reduce((sum, c) => sum + Number(c.total_usd || 0), 0)
    const totalBS = cierres.reduce((sum, c) => sum + Number(c.total_bs || 0), 0)

    // Asistencias totales del periodo
    const inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    const fin = new Date(fechaFin + 'T23:59:59').toISOString()

    const { count, error: asistenciasError } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_hora', inicio)
      .lte('fecha_hora', fin)

    if (asistenciasError) throw asistenciasError

    return {
      success: true,
      data: {
        totalUSD,
        totalBS,
        totalAsistencias: count || 0
      }
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