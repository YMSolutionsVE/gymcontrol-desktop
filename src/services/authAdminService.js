import { supabase } from '../config/supabase'

export const verifyAdminCredentials = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    const userId = data.user.id

    const { data: roleData, error: roleError } = await supabase
      .from('usuarios_roles')
      .select('rol')
      .eq('user_id', userId)
      .single()

    if (roleError) throw roleError

    if (roleData.rol !== 'admin') {
      return { success: false, error: 'El usuario no tiene permisos de administrador' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Credenciales inválidas o sin permisos' }
  }
}
