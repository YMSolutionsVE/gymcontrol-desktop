import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export function useAlerts() {
  const [alerts, setAlerts] = useState({
    porVencer: [],
    vencidos: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setLoading(true)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyStr = hoy.toISOString().split('T')[0]

    const tresDias = new Date()
    tresDias.setDate(tresDias.getDate() + 3)
    const tresDiasStr = tresDias.toISOString().split('T')[0]

    // 🔔 SOLO PLANES MENSUAL Y CORTESÍA
    const { data: porVencer } = await supabase
      .from('socios')
      .select('id, nombre, cedula, fecha_vencimiento, telefono, plan_actual')
      .eq('activo', true)
      .in('plan_actual', ['mensual', 'cortesia'])
      .gte('fecha_vencimiento', hoyStr)
      .lte('fecha_vencimiento', tresDiasStr)
      .order('fecha_vencimiento', { ascending: true })

    const { data: vencidos } = await supabase
      .from('socios')
      .select('id, nombre, cedula, fecha_vencimiento, telefono, plan_actual')
      .eq('activo', true)
      .in('plan_actual', ['mensual', 'cortesia'])
      .lt('fecha_vencimiento', hoyStr)
      .order('fecha_vencimiento', { ascending: false })

    setAlerts({
      porVencer: porVencer || [],
      vencidos: vencidos || []
    })

    setLoading(false)
  }

  return { alerts, loading, reload: loadAlerts }
}
