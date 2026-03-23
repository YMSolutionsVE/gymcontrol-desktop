import { supabase } from '../config/supabase'

export const getActiveUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('usuarios_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('activo', true)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getGymProfile = async (gymId) => {
  if (!gymId) return null

  const [
    { data: gym, error: gymError },
    { data: config, error: configError }
  ] = await Promise.all([
    supabase
      .from('gimnasios')
      .select('*')
      .eq('id', gymId)
      .maybeSingle(),
    supabase
      .from('configuracion')
      .select('nombre_gimnasio')
      .eq('gym_id', gymId)
      .maybeSingle()
  ])

  if (gymError) throw gymError
  if (configError) throw configError

  if (!gym && !config) return null

  return {
    ...(gym || {}),
    id: gym?.id || gymId,
    nombre: gym?.nombre || config?.nombre_gimnasio || 'GymControl'
  }
}

export const getSessionProfile = async (userId) => {
  const role = await getActiveUserRole(userId)
  if (!role) return { role: null, gym: null }

  const gym = await getGymProfile(role.gym_id)
  return { role, gym }
}
