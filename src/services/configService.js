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

function validarGymId(gymId) {
  if (!gymId) {
    console.error('configService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

export const getConfig = async (gymId) => {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }
  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('gym_id', gymId)
      .limit(1)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const updateTasasCambio = async ({ tasaBcv, tasaEur }, gymId) => {
  const tasaBcvNum = parseFloat(tasaBcv)
  const tasaEurNum = parseFloat(tasaEur)

  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }

  if (isNaN(tasaBcvNum) || tasaBcvNum <= 0) {
    return { success: false, error: 'Ingresa una tasa USD valida mayor a 0' }
  }

  if (isNaN(tasaEurNum) || tasaEurNum <= 0) {
    return { success: false, error: 'Ingresa una tasa EUR valida mayor a 0' }
  }

  const query = supabase.from('configuracion').select('id').eq('gym_id', gymId)

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
    .eq('gym_id', gymId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export const updateTasaBcv = async (nuevaTasa, gymId) => {
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
