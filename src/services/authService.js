import { supabase } from '../config/supabase'
import { getActiveUserRole, getSessionProfile } from './sessionProfileService'
import { buildDisplayGymProfile, getGymAccessState } from '../lib/gymAccess'

export const loginWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) throw error

    const { role: perfil, gym: gimnasio } = await getSessionProfile(data.user.id)

    if (!perfil) {
      await supabase.auth.signOut()
      throw new Error('No tienes un perfil activo asignado en GymControl.')
    }

    const accessState = getGymAccessState(perfil, gimnasio)
    if (!accessState.allowed) {
      await supabase.auth.signOut()
      throw new Error(accessState.message)
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      role: perfil || { rol: 'sin_rol' },
      gym: buildDisplayGymProfile(perfil, gimnasio)
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getUserRole = async (userId) => {
  try {
    const data = await getActiveUserRole(userId)
    return data || { rol: 'sin_rol' }
  } catch (error) {
    return { rol: 'sin_rol' }
  }
}
