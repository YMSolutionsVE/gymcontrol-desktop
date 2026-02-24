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

// ── Servicios ──

// Obtener todos los socios
export const getSocios = async () => {
  // Verificar conexión
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.', 
      data: [] 
    }
  }

  try {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo socios:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Obtener socios por estado (activo, vencido, por vencer)
export const getSociosByEstado = async (estado) => {
  // Verificar conexión
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.', 
      data: [] 
    }
  }

  try {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw error

    // Filtrar por estado localmente
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const sociosFiltrados = (data || []).filter(socio => {
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

// Obtener socio por ID
export const getSocioById = async (id) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.'
    }
  }

  try {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo socio:', error)
    return { success: false, error: error.message }
  }
}

// Buscar socios por término (nombre o cédula)
export const buscarSocios = async (termino) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.', 
      data: [] 
    }
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

// Crear nuevo socio
export const createSocio = async (socioData) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. No se puede registrar el socio sin conexión.' 
    }
  }

  try {
    if (!socioData.nombre || !socioData.cedula) {
      return { success: false, error: 'Nombre y cédula son requeridos' }
    }

    const datosSanitizados = sanitizeSocioData(socioData)

    const { data: existente } = await supabase
      .from('socios')
      .select('id')
      .eq('cedula', datosSanitizados.cedula)
      .maybeSingle()

    if (existente) {
      return { success: false, error: 'Ya existe un socio con esta cédula' }
    }

    const { data, error } = await supabase
      .from('socios')
      .insert([datosSanitizados])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error registrando socio:', error)
    return { success: false, error: error.message }
  }
}

// Registrar nuevo socio (alias)
export const registrarSocio = async (socioData) => {
  return createSocio(socioData)
}

// Actualizar socio
export const updateSocio = async (id, socioData) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. No se puede actualizar el socio sin conexión.' 
    }
  }

  try {
    const datosSanitizados = sanitizeSocioData(socioData)

    const { data, error } = await supabase
      .from('socios')
      .update(datosSanitizados)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error actualizando socio:', error)
    return { success: false, error: error.message }
  }
}

// Alias de updateSocio
export const actualizarSocio = async (id, socioData) => {
  return updateSocio(id, socioData)
}

// Desactivar socio (soft delete)
export const deactivateSocio = async (id) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. No se puede desactivar el socio sin conexión.' 
    }
  }

  try {
    const { data, error } = await supabase
      .from('socios')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error desactivando socio:', error)
    return { success: false, error: error.message }
  }
}

// Eliminar socio (alias de deactivateSocio)
export const deleteSocio = async (id) => {
  return deactivateSocio(id)
}

// Obtener historial de pagos del socio
export const getHistorialPagos = async (socioId) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.', 
      data: [] 
    }
  }

  try {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('socio_id', socioId)
      .order('fecha_pago', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Obtener historial de asistencias del socio
export const getHistorialAsistencias = async (socioId) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.', 
      data: [] 
    }
  }

  try {
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
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