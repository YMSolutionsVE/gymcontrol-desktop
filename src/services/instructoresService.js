import { supabase } from '../config/supabase'

function validarGymId(gymId) {
  if (!gymId) {
    console.error('instructoresService: gym_id requerido')
    return false
  }
  return true
}

// ── Obtener instructores del gym ──
export const getInstructores = async (gymId) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  try {
    const { data, error } = await supabase
      .from('usuarios_roles')
      .select('*')
      .eq('gym_id', gymId)
      .eq('rol', 'instructor')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

// ── Crear instructor (genera usuario en Supabase Auth + rol) ──
export const crearInstructor = async (gymId, { nombre, email, password }) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  if (!nombre?.trim() || !email?.trim() || !password?.trim())
    return { success: false, error: 'Nombre, email y contraseña son obligatorios.' }
  if (password.length < 6)
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
  try {
    // Crear usuario en Supabase Auth usando Admin API vía Edge Function
    const { data: fnData, error: fnError } = await supabase.functions.invoke('crear-instructor', {
      body: { gymId, nombre, email, password },
    })
    if (fnError) throw fnError
    if (!fnData?.success) throw new Error(fnData?.error || 'Error al crear instructor')
    return { success: true, data: fnData.instructor }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ── Desactivar instructor ──
export const desactivarInstructor = async (gymId, instructorUserId) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  try {
    const { error } = await supabase
      .from('usuarios_roles')
      .update({ activo: false })
      .eq('gym_id', gymId)
      .eq('user_id', instructorUserId)
      .eq('rol', 'instructor')
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ── Obtener miembros asignados a un instructor ──
export const getMiembrosInstructor = async (gymId, instructorUserId) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  try {
    const { data, error } = await supabase
      .from('instructores_miembros')
      .select('socio_id, socios(id, nombre, cedula, plan_actual, sesiones_restantes, sesiones_total, fecha_vencimiento, dias_semana)')
      .eq('gym_id', gymId)
      .eq('instructor_id', instructorUserId)
    if (error) throw error
    return { success: true, data: (data || []).map(r => r.socios).filter(Boolean) }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

// ── Asignar miembro a instructor ──
export const asignarMiembro = async (gymId, instructorUserId, socioId) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  try {
    const { error } = await supabase
      .from('instructores_miembros')
      .insert([{ gym_id: gymId, instructor_id: instructorUserId, socio_id: socioId }])
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ── Cambiar contraseña de instructor ──
export const cambiarContrasenaInstructor = async (gymId, instructorUserId, nuevaPassword) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  if (!nuevaPassword || nuevaPassword.length < 6)
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
  try {
    const { data: fnData, error: fnError } = await supabase.functions.invoke('crear-instructor', {
      body: { action: 'cambiar-password', gymId, userId: instructorUserId, password: nuevaPassword },
    })
    if (fnError) throw fnError
    if (!fnData?.success) throw new Error(fnData?.error || 'Error al cambiar contraseña')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ── Desasignar miembro de instructor ──
export const desasignarMiembro = async (gymId, instructorUserId, socioId) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  try {
    const { error } = await supabase
      .from('instructores_miembros')
      .delete()
      .eq('gym_id', gymId)
      .eq('instructor_id', instructorUserId)
      .eq('socio_id', socioId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
