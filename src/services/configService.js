import { supabase } from '../config/supabase'

const getTasaBcvInicial = async () => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('tasa_bcv')
    .not('tasa_bcv', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.tasa_bcv ?? null
}

export const getConfig = async (gymId = null) => {
  try {
    let query = supabase.from('configuracion').select('*')

    if (gymId) {
      query = query.eq('gym_id', gymId)
    }

    const { data, error } = await query.limit(1).maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const updateTasaBcv = async (nuevaTasa, gymId = null) => {
  const tasaNum = parseFloat(nuevaTasa)

  if (isNaN(tasaNum) || tasaNum <= 0) {
    return { success: false, error: 'Ingresa una tasa válida mayor a 0' }
  }

  let query = supabase.from('configuracion').select('id')
  if (gymId) query = query.eq('gym_id', gymId)

  const { data: config } = await query.limit(1).maybeSingle()

  if (!config) {
    return { success: false, error: 'No se encontró la configuración' }
  }

  const { data, error } = await supabase
    .from('configuracion')
    .update({ tasa_bcv: tasaNum, updated_at: new Date().toISOString() })
    .eq('id', config.id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export const crearConfigGym = async (gymId, nombreGimnasio) => {
  const tasaInicial = await getTasaBcvInicial()

  const { data, error } = await supabase
    .from('configuracion')
    .insert({
      gym_id: gymId,
      nombre_gimnasio: nombreGimnasio,
      moneda_base: 'USD',
      tasa_bcv: tasaInicial,
      precio_mensual: 25.00,
      precio_diario: 1.50
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}
