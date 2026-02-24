import { supabase } from '../config/supabase'

export const getConfig = async () => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export const updateTasaBcv = async (nuevaTasa) => {
  const tasaNum = parseFloat(nuevaTasa)

  if (isNaN(tasaNum) || tasaNum <= 0) {
    return { success: false, error: 'Ingresa una tasa válida mayor a 0' }
  }

  const { data: config } = await supabase
    .from('configuracion')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (!config) {
    return { success: false, error: 'No se encontró la configuración' }
  }

  const { data, error } = await supabase
    .from('configuracion')
    .update({ tasa_bcv: tasaNum })
    .eq('id', config.id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}
