import { supabase } from '../config/supabase'

const normalizeFunctionError = (error, fallbackMessage) => {
  const rawMessage = String(
    error?.message
    || error?.context?.msg
    || error?.details
    || fallbackMessage
  )

  if (
    rawMessage.includes('Failed to send a request to the Edge Function')
    || rawMessage.includes('FunctionsFetchError')
    || rawMessage.includes('404')
  ) {
    return 'La Edge Function `crear-gym-admin` no está desplegada o no está actualizada en Supabase.'
  }

  return rawMessage
}

const mapCliente = (gym, adminMap) => ({
  ...gym,
  admin_nombre: adminMap[gym.id]?.nombre || '',
  admin_email: adminMap[gym.id]?.email || gym.owner_email || '',
  admin_activo: adminMap[gym.id]?.activo ?? false,
})

export const getGymsResumen = async () => {
  try {
    const { data: gimnasios, error: gymError } = await supabase
      .from('gimnasios')
      .select('id, nombre, slug, activo, en_trial, trial_end, owner_email, ciudad, telefono, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (gymError) throw gymError

    const gymIds = (gimnasios || []).map(g => g.id)
    if (gymIds.length === 0) {
      return { success: true, data: [] }
    }

    const { data: admins, error: adminError } = await supabase
      .from('usuarios_roles')
      .select('gym_id, nombre, email, activo, created_at')
      .eq('rol', 'admin')
      .in('gym_id', gymIds)
      .order('created_at', { ascending: true })

    if (adminError) throw adminError

    const adminMap = {}
    ;(admins || []).forEach((admin) => {
      if (!adminMap[admin.gym_id]) {
        adminMap[admin.gym_id] = admin
      }
    })

    return {
      success: true,
      data: (gimnasios || []).map(gym => mapCliente(gym, adminMap)),
    }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

export const crearGymConAdmin = async (payload) => {
  try {
    const { data, error } = await supabase.functions.invoke('crear-gym-admin', {
      body: payload,
    })

    if (error) {
      throw new Error(normalizeFunctionError(error, 'No se pudo crear el cliente.'))
    }

    if (!data?.success) {
      throw new Error(data?.error || 'No se pudo crear el cliente.')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const actualizarGym = async (payload) => {
  try {
    const { data, error } = await supabase.functions.invoke('crear-gym-admin', {
      body: { action: 'update-gym', ...payload },
    })

    if (error) {
      throw new Error(normalizeFunctionError(error, 'No se pudo actualizar el cliente.'))
    }

    if (!data?.success) {
      throw new Error(data?.error || 'No se pudo actualizar el cliente.')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
