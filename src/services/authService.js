import { supabase } from '../config/supabase'

export const loginWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) throw error

    const { data: roleData } = await supabase
      .from('usuarios_roles')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    return {
      success: true,
      user: data.user,
      session: data.session,
      role: roleData || { rol: 'sin_rol' }
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
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || { rol: 'sin_rol' }
  } catch (error) {
    return { rol: 'sin_rol' }
  }
}