import { supabase } from '../config/supabase'

export const loginWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) throw error

    // Cargar perfil con gym_id
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios_roles')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('activo', true)
      .single()

    if (perfilError) throw perfilError

    // Cargar gimnasio si tiene gym_id
    let gimnasio = null
    if (perfil.gym_id) {
      const { data: gymData } = await supabase
        .from('gimnasios')
        .select('*')
        .eq('id', perfil.gym_id)
        .single()
      gimnasio = gymData
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      role: perfil || { rol: 'sin_rol' },
      gym: gimnasio
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
    const { data, error } = await supabase
      .from('usuarios_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('activo', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || { rol: 'sin_rol' }
  } catch (error) {
    return { rol: 'sin_rol' }
  }
}