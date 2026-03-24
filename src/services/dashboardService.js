import { supabase } from '../config/supabase'

export const getDashboardStats = async (gymId = null) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const tresDias = new Date()
    tresDias.setDate(tresDias.getDate() + 3)

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    let sociosQuery = supabase
      .from('socios')
      .select('id, fecha_vencimiento, activo, plan_actual, sesiones_total, sesiones_restantes')
      .eq('activo', true)
    if (gymId) sociosQuery = sociosQuery.eq('gym_id', gymId)

    // Traer monto_bs como dato principal + divisa para desglose
    let pagosHoyQuery = supabase
      .from('pagos')
      .select('monto_bs, monto_divisa, moneda_divisa')
      .gte('fecha_pago', hoy.toISOString())
    if (gymId) pagosHoyQuery = pagosHoyQuery.eq('gym_id', gymId)

    let pagosMesQuery = supabase
      .from('pagos')
      .select('monto_bs, monto_divisa, moneda_divisa')
      .gte('fecha_pago', primerDiaMes.toISOString())
    if (gymId) pagosMesQuery = pagosMesQuery.eq('gym_id', gymId)

    let asistHoyQuery = supabase
      .from('asistencias')
      .select('id')
      .gte('fecha_hora', hoy.toISOString())
    if (gymId) asistHoyQuery = asistHoyQuery.eq('gym_id', gymId)

    const [
      { data: socios, error: sociosError },
      { data: pagosHoy },
      { data: pagosMes },
      { data: asistHoy }
    ] = await Promise.all([sociosQuery, pagosHoyQuery, pagosMesQuery, asistHoyQuery])

    if (sociosError) throw sociosError

    let activos = 0
    let vencidos = 0
    let porVencer = 0

    socios.forEach(s => {
      if (s.plan_actual === 'diario') return

      // Plan por sesiones
      if (s.sesiones_total !== null && s.sesiones_total !== undefined) {
        if (!s.sesiones_restantes || s.sesiones_restantes <= 0) {
          vencidos++
        } else if (s.sesiones_restantes <= 2) {
          porVencer++
          activos++
        } else {
          activos++
        }
        return
      }

      // Plan por días
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

    // Calcular ingresos en Bs (denominador común real)
    const ingresosHoyBs = (pagosHoy || []).reduce((sum, p) => sum + parseFloat(p.monto_bs || 0), 0)
    const ingresosMesBs = (pagosMes || []).reduce((sum, p) => sum + parseFloat(p.monto_bs || 0), 0)

    // Desglose por divisa para hoy
    const desgloseHoy = {}
    ;(pagosHoy || []).forEach(p => {
      const moneda = (p.moneda_divisa || 'USD').toUpperCase()
      if (!desgloseHoy[moneda]) desgloseHoy[moneda] = 0
      desgloseHoy[moneda] += parseFloat(p.monto_divisa || 0)
    })

    // Desglose por divisa para el mes
    const desgloseMes = {}
    ;(pagosMes || []).forEach(p => {
      const moneda = (p.moneda_divisa || 'USD').toUpperCase()
      if (!desgloseMes[moneda]) desgloseMes[moneda] = 0
      desgloseMes[moneda] += parseFloat(p.monto_divisa || 0)
    })

    return {
      success: true,
      data: {
        totalSocios: socios.length,
        activos,
        vencidos,
        porVencer,
        // Bs como dato principal
        ingresosHoyBs: Math.round(ingresosHoyBs * 100) / 100,
        ingresosMesBs: Math.round(ingresosMesBs * 100) / 100,
        // Desglose por divisa
        desgloseHoy,
        desgloseMes,
        // Mantener compatibilidad (ahora solo USD real, no normalizado)
        ingresosHoy: Math.round((desgloseHoy.USD || 0) * 100) / 100,
        ingresosMes: Math.round((desgloseMes.USD || 0) * 100) / 100,
        asistenciasHoy: (asistHoy || []).length
      }
    }
  } catch (error) {
    console.error('dashboardService: error en getDashboardStats:', error)
    return { success: false, error: error.message }
  }
}