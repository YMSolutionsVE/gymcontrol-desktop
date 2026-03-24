import { supabase } from '../config/supabase'

const getTasasIniciales = async () => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('tasa_bcv, tasa_eur')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return {
    tasa_bcv: data?.tasa_bcv ?? null,
    tasa_eur: data?.tasa_eur ?? null,
  }
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

export const updateTasasCambio = async ({ tasaBcv, tasaEur }, gymId = null) => {
  const tasaBcvNum = parseFloat(tasaBcv)
  const tasaEurNum = parseFloat(tasaEur)

  if (isNaN(tasaBcvNum) || tasaBcvNum <= 0) {
    return { success: false, error: 'Ingresa una tasa USD valida mayor a 0' }
  }

  if (isNaN(tasaEurNum) || tasaEurNum <= 0) {
    return { success: false, error: 'Ingresa una tasa EUR valida mayor a 0' }
  }

  let query = supabase.from('configuracion').select('id')
  if (gymId) query = query.eq('gym_id', gymId)

  const { data: config } = await query.limit(1).maybeSingle()

  if (!config) {
    return { success: false, error: 'No se encontro la configuracion' }
  }

  const { data, error } = await supabase
    .from('configuracion')
    .update({
      tasa_bcv: tasaBcvNum,
      tasa_eur: tasaEurNum,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export const updateTasaBcv = async (nuevaTasa, gymId = null) => {
  const result = await getConfig(gymId)
  const tasaEurActual = result?.data?.tasa_eur || nuevaTasa
  return updateTasasCambio({
    tasaBcv: nuevaTasa,
    tasaEur: tasaEurActual
  }, gymId)
}

export const crearConfigGym = async (gymId, nombreGimnasio) => {
  const tasasIniciales = await getTasasIniciales()

  const { data, error } = await supabase
    .from('configuracion')
    .insert({
      gym_id: gymId,
      nombre_gimnasio: nombreGimnasio,
      moneda_base: 'USD',
      tasa_bcv: tasasIniciales.tasa_bcv,
      tasa_eur: tasasIniciales.tasa_eur,
      precio_mensual: 25.00,
      precio_diario: 1.50
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}
