import { supabase } from '../config/supabase'

export const getDashboardStats = async () => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const tresDias = new Date()
    tresDias.setDate(tresDias.getDate() + 3)

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    const { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('id, fecha_vencimiento, activo, plan_actual')
      .eq('activo', true)

    if (sociosError) throw sociosError

    let activos = 0
    let vencidos = 0
    let porVencer = 0

    socios.forEach(s => {
      // 🚫 PLAN DIARIO NO CUENTA PARA ALERTAS
      if (s.plan_actual === 'diario') return

      if (!s.fecha_vencimiento) {
        vencidos++
        return
      }

      const venc = new Date(s.fecha_vencimiento + 'T00:00:00')

      if (venc < hoy) {
        vencidos++
      } else if (venc <= tresDias) {
        porVencer++
        activos++
      } else {
        activos++
      }
    })

    const { data: pagosHoy } = await supabase
      .from('pagos')
      .select('monto_usd')
      .gte('fecha_pago', hoy.toISOString())

    const ingresosHoy = (pagosHoy || []).reduce((sum, p) => sum + parseFloat(p.monto_usd), 0)

    const { data: pagosMes } = await supabase
      .from('pagos')
      .select('monto_usd')
      .gte('fecha_pago', primerDiaMes.toISOString())

    const ingresosMes = (pagosMes || []).reduce((sum, p) => sum + parseFloat(p.monto_usd), 0)

    const { data: asistHoy } = await supabase
      .from('asistencias')
      .select('id')
      .gte('fecha_hora', hoy.toISOString())

    return {
      success: true,
      data: {
        totalSocios: socios.length,
        activos,
        vencidos,
        porVencer,
        ingresosHoy: Math.round(ingresosHoy * 100) / 100,
        ingresosMes: Math.round(ingresosMes * 100) / 100,
        asistenciasHoy: (asistHoy || []).length
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
