import { supabase } from '../config/supabase'

function validarGymId(gymId) {
  if (!gymId) {
    console.error('reportesService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

export const getResumenDiario = async (desde, hasta, gymId) => {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }
  try {
    const { data, error } = await supabase
      .from('cierres_caja')
      .select('fecha, total_usd, total_bs, asistencias')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .eq('gym_id', gymId)
      .order('fecha', { ascending: true })

    if (error) throw error

    const adaptado = data.map(d => ({
      fecha: d.fecha,
      total_usd: Number(d.total_usd) || 0,
      total_bs: Number(d.total_bs) || 0,
      asistencias: d.asistencias || 0
    }))

    return { success: true, data: adaptado }

  } catch (error) {
    console.error('Error resumen diario:', error)
    return { success: false, error: error.message }
  }
}