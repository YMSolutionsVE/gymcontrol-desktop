import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'

export function useAlerts() {
  const [alerts, setAlerts] = useState({ porVencer: [], vencidos: [] })
  const [loading, setLoading] = useState(true)
  const { gymId } = useAuth()

  useEffect(() => {
    if (gymId) loadAlerts()
  }, [gymId])

  const loadAlerts = async () => {
    setLoading(true)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyStr = hoy.toISOString().split('T')[0]

    const tresDias = new Date()
    tresDias.setDate(tresDias.getDate() + 3)
    const tresDiasStr = tresDias.toISOString().split('T')[0]

    // Planes por días — por vencer en 3 días
    const { data: porVencerDias } = await supabase
      .from('socios')
      .select('id, nombre, cedula, fecha_vencimiento, telefono, plan_actual')
      .eq('activo', true)
      .eq('gym_id', gymId)
      .not('fecha_vencimiento', 'is', null)
      .gte('fecha_vencimiento', hoyStr)
      .lte('fecha_vencimiento', tresDiasStr)
      .order('fecha_vencimiento', { ascending: true })

    // Planes por días — vencidos
    const { data: vencidosDias } = await supabase
      .from('socios')
      .select('id, nombre, cedula, fecha_vencimiento, telefono, plan_actual')
      .eq('activo', true)
      .eq('gym_id', gymId)
      .not('fecha_vencimiento', 'is', null)
      .lt('fecha_vencimiento', hoyStr)
      .order('fecha_vencimiento', { ascending: false })

    // Planes por sesiones — quedan 1 o 2 sesiones
    const { data: porVencerSesiones } = await supabase
      .from('socios')
      .select('id, nombre, cedula, sesiones_restantes, sesiones_total, telefono, plan_actual')
      .eq('activo', true)
      .eq('gym_id', gymId)
      .not('sesiones_total', 'is', null)
      .gt('sesiones_restantes', 0)
      .lte('sesiones_restantes', 2)
      .order('sesiones_restantes', { ascending: true })

    // Planes por sesiones — agotadas
    const { data: vencidosSesiones } = await supabase
      .from('socios')
      .select('id, nombre, cedula, sesiones_restantes, sesiones_total, telefono, plan_actual')
      .eq('activo', true)
      .eq('gym_id', gymId)
      .not('sesiones_total', 'is', null)
      .lte('sesiones_restantes', 0)
      .order('nombre', { ascending: true })

    setAlerts({
      porVencer: [...(porVencerDias || []), ...(porVencerSesiones || [])],
      vencidos: [...(vencidosDias || []), ...(vencidosSesiones || [])],
    })

    setLoading(false)
  }

  return { alerts, loading, reload: loadAlerts }
}
