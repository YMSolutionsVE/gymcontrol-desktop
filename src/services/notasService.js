import { supabase } from '../config/supabase'

function validarGymId(gymId) {
  if (!gymId) {
    console.error('notasService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

export const getNotas = async (gymId, socioId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  if (!socioId) {
    return { success: false, error: 'socio_id es requerido.', data: [] }
  }
  try {
    const { data, error } = await supabase
      .from('notas_miembros')
      .select('*')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('notasService: error en getNotas:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const createNota = async (gymId, socioId, nota, registradoPor) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  if (!socioId) {
    return { success: false, error: 'socio_id es requerido.' }
  }
  if (!nota || !nota.trim()) {
    return { success: false, error: 'La nota no puede estar vacía.' }
  }
  if (!registradoPor) {
    return { success: false, error: 'registrado_por es requerido.' }
  }
  try {
    const { data, error } = await supabase
      .from('notas_miembros')
      .insert([{
        gym_id: gymId,
        socio_id: socioId,
        nota: nota.trim(),
        registrado_por: registradoPor,
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('notasService: error en createNota:', error)
    return { success: false, error: error.message }
  }
}

export const deleteNota = async (gymId, notaId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  if (!notaId) {
    return { success: false, error: 'notaId es requerido.' }
  }
  try {
    const { error } = await supabase
      .from('notas_miembros')
      .delete()
      .eq('id', notaId)
      .eq('gym_id', gymId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('notasService: error en deleteNota:', error)
    return { success: false, error: error.message }
  }
}
