import { supabase } from '../config/supabase'

function validarGymId(gymId) {
  if (!gymId) {
    console.error('planesService: gym_id requerido pero llegó:', gymId)
    return false
  }
  return true
}

export const getPlanes = async (gymId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  try {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .eq('gym_id', gymId)
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo planes:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getAllPlanes = async (gymId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  try {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .eq('gym_id', gymId)
      .order('activo', { ascending: false })
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo todos los planes:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getPlanById = async (gymId, planId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .eq('id', planId)
      .eq('gym_id', gymId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo plan:', error)
    return { success: false, error: error.message }
  }
}

export const createPlan = async (gymId, planData) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    if (!planData.nombre || !planData.precio_usd) {
      return { success: false, error: 'Nombre y precio son requeridos.' }
    }
    const tipo = planData.tipo || 'dias'
    const { data, error } = await supabase
      .from('planes')
      .insert([{
        gym_id: gymId,
        nombre: planData.nombre.trim(),
        precio_usd: parseFloat(planData.precio_usd),
        tipo,
        duracion_dias: tipo === 'sesiones' ? null : (parseInt(planData.duracion_dias) || 30),
        cantidad_sesiones: tipo === 'sesiones' ? (parseInt(planData.cantidad_sesiones) || null) : null,
        descripcion: planData.descripcion?.trim() || null,
        orden: parseInt(planData.orden) || 0,
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creando plan:', error)
    return { success: false, error: error.message }
  }
}

export const updatePlan = async (gymId, planId, planData) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    const updateObj = {}
    if (planData.nombre !== undefined) updateObj.nombre = planData.nombre.trim()
    if (planData.precio_usd !== undefined) updateObj.precio_usd = parseFloat(planData.precio_usd)
    if (planData.tipo !== undefined) updateObj.tipo = planData.tipo
    if (planData.tipo === 'sesiones') {
      updateObj.duracion_dias = null
      if (planData.cantidad_sesiones !== undefined) updateObj.cantidad_sesiones = parseInt(planData.cantidad_sesiones) || null
    } else if (planData.tipo === 'dias') {
      updateObj.cantidad_sesiones = null
      if (planData.duracion_dias !== undefined) updateObj.duracion_dias = parseInt(planData.duracion_dias)
    } else {
      if (planData.duracion_dias !== undefined) updateObj.duracion_dias = parseInt(planData.duracion_dias)
    }
    if (planData.descripcion !== undefined) updateObj.descripcion = planData.descripcion?.trim() || null
    if (planData.orden !== undefined) updateObj.orden = parseInt(planData.orden)

    const { data, error } = await supabase
      .from('planes')
      .update(updateObj)
      .eq('id', planId)
      .eq('gym_id', gymId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error actualizando plan:', error)
    return { success: false, error: error.message }
  }
}

export const togglePlan = async (gymId, planId, activo) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    const { data, error } = await supabase
      .from('planes')
      .update({ activo })
      .eq('id', planId)
      .eq('gym_id', gymId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error toggling plan:', error)
    return { success: false, error: error.message }
  }
}

export const deletePlan = async (gymId, planId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    const { data: socios } = await supabase
      .from('socios')
      .select('id')
      .eq('gym_id', gymId)
      .eq('plan_id', planId)
      .eq('activo', true)
      .limit(1)

    if (socios && socios.length > 0) {
      return { success: false, error: 'No se puede eliminar un plan con miembros asignados. Desactívalo en su lugar.' }
    }

    const { error } = await supabase
      .from('planes')
      .delete()
      .eq('id', planId)
      .eq('gym_id', gymId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error eliminando plan:', error)
    return { success: false, error: error.message }
  }
}