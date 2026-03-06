import { supabase } from '../config/supabase'

// ── Sanitización ──

function sanitizeText(str) {
  if (str === null || str === undefined) return str
  if (typeof str !== 'string') return str
  return str
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/\0/g, '')
}

function sanitizeCedula(str) {
  if (!str) return str
  return String(str).replace(/[^0-9A-Za-z\-\.]/g, '').trim()
}

function sanitizeTelefono(str) {
  if (!str) return str
  return String(str).replace(/[^0-9+\-() ]/g, '').trim()
}

function sanitizeSocioData(data) {
  const sanitized = { ...data }
  if (sanitized.nombre !== undefined) sanitized.nombre = sanitizeText(sanitized.nombre)
  if (sanitized.cedula !== undefined) sanitized.cedula = sanitizeCedula(sanitized.cedula)
  if (sanitized.telefono !== undefined) sanitized.telefono = sanitizeTelefono(sanitized.telefono)
  if (sanitized.nota_cortesia !== undefined) sanitized.nota_cortesia = sanitizeText(sanitized.nota_cortesia)

  // Convertir strings vacíos a null para campos date
  if (sanitized.fecha_vencimiento === '' || sanitized.fecha_vencimiento === undefined) {
    sanitized.fecha_vencimiento = null
  }

  // Convertir strings vacíos a null para campos opcionales
  if (sanitized.telefono === '') sanitized.telefono = null
  if (sanitized.nota_cortesia === '') sanitized.nota_cortesia = null
  if (sanitized.plan_actual === '') sanitized.plan_actual = null

  return sanitized
}

function sanitizeSearchTerm(str) {
  if (!str) return str
  return str
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[,\\.()]/g, '')
    .replace(/\0/g, '')
}

// ── Validación gym_id ──

function validarGymId(gymId) {
  if (!gymId) {
    console.error('sociosService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

// ── Servicios ──

export const getSocios = async (gymId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  try {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('gym_id', gymId)
      .eq('activo', true)
      .order('nombre', { ascending: true })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo socios:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getSociosByEstado = async (gymId, estado) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  try {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('gym_id', gymId)
      .eq('activo', true)
      .order('nombre', { ascending: true })
    if (error) throw error

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const sociosFiltrados = (data || []).filter(socio => {
      // Plan por sesiones
      if (socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
        const restantes = socio.sesiones_restantes || 0
        if (estado === 'activo' || estado === 'activos') return restantes > 2
        if (estado === 'por_vencer') return restantes > 0 && restantes <= 2
        if (estado === 'vencido' || estado === 'vencidos') return restantes <= 0
        return false
      }
      // Plan por días
      if (!socio.fecha_vencimiento && estado === 'sin_plan') return true
      if (!socio.fecha_vencimiento) return false
      const vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
      const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
      if (estado === 'activo' || estado === 'activos') return diasRestantes > 3
      if (estado === 'por_vencer') return diasRestantes >= 0 && diasRestantes <= 3
      if (estado === 'vencido' || estado === 'vencidos') return diasRestantes < 0
      return false
    })

    return { success: true, data: sociosFiltrados }
  } catch (error) {
    console.error('Error obteniendo socios por estado:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getSocioById = async (gymId, id) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('id', id)
      .eq('gym_id', gymId)
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo socio:', error)
    return { success: false, error: error.message }
  }
}

export const buscarSocios = async (gymId, termino) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  try {
    if (!termino || termino.trim().length < 2) {
      return { success: true, data: [] }
    }
    const terminoLimpio = sanitizeSearchTerm(termino)
    if (!terminoLimpio || terminoLimpio.length < 2) {
      return { success: true, data: [] }
    }
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('gym_id', gymId)
      .eq('activo', true)
      .or(`nombre.ilike.%${terminoLimpio}%,cedula.ilike.%${terminoLimpio}%`)
      .order('nombre', { ascending: true })
      .limit(10)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error buscando socios:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const createSocio = async (gymId, socioData) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet. No se puede registrar el socio.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    if (!socioData.nombre || !socioData.cedula) {
      return { success: false, error: 'Nombre y cédula son requeridos' }
    }
    const datosSanitizados = sanitizeSocioData(socioData)
    const { data: existente } = await supabase
      .from('socios')
      .select('id')
      .eq('gym_id', gymId)
      .eq('cedula', datosSanitizados.cedula)
      .maybeSingle()
    if (existente) {
      return { success: false, error: 'Ya existe un socio con esta cédula' }
    }
    const { data, error } = await supabase
      .from('socios')
      .insert([{ ...datosSanitizados, gym_id: gymId }])
      .select()
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error registrando socio:', error)
    return { success: false, error: error.message }
  }
}

export const registrarSocio = async (gymId, socioData) => {
  return createSocio(gymId, socioData)
}

export const updateSocio = async (gymId, id, socioData) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet. No se puede actualizar el socio.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    const datosSanitizados = sanitizeSocioData(socioData)
    const { data, error } = await supabase
      .from('socios')
      .update(datosSanitizados)
      .eq('id', id)
      .eq('gym_id', gymId)
      .select()
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error actualizando socio:', error)
    return { success: false, error: error.message }
  }
}

export const actualizarSocio = async (gymId, id, socioData) => {
  return updateSocio(gymId, id, socioData)
}

export const deactivateSocio = async (gymId, id) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.' }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }
  try {
    const { data, error } = await supabase
      .from('socios')
      .update({ activo: false })
      .eq('id', id)
      .eq('gym_id', gymId)
      .select()
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error desactivando socio:', error)
    return { success: false, error: error.message }
  }
}

export const deleteSocio = async (gymId, id) => {
  return deactivateSocio(gymId, id)
}

export const getHistorialPagos = async (gymId, socioId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  try {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .order('fecha_pago', { ascending: false })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getHistorialAsistencias = async (gymId, socioId) => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexión a Internet.', data: [] }
  }
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }
  try {
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .order('fecha_hora', { ascending: false })
      .limit(50)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo historial de asistencias:', error)
    return { success: false, error: error.message, data: [] }
  }
}