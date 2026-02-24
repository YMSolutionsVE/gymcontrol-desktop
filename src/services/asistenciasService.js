import { supabase } from '../config/supabase'

const obtenerFechaLocal = () => {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset()
  const fechaLocal = new Date(ahora.getTime() - offset * 60000)
  return fechaLocal.toISOString().split('T')[0]
}

// Registrar asistencia
export const registrarAsistencia = async (socioId) => {
  // Verificar conexión
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. No se puede registrar la asistencia sin conexión.' 
    }
  }

  try {
    const fechaHoy = obtenerFechaLocal()
    const inicio = new Date(fechaHoy + 'T00:00:00')
    const fin = new Date(fechaHoy + 'T23:59:59')

    // Verificar si ya registró hoy
    const { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('socio_id', socioId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .maybeSingle()

    if (existente) {
      return { success: false, error: 'Este miembro ya registró asistencia hoy' }
    }

    // Obtener datos del socio
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('*')
      .eq('id', socioId)
      .single()

    if (socioError) throw socioError

    if (!socio.activo) {
      return { success: false, error: 'Miembro inactivo' }
    }

    if (!socio.fecha_vencimiento) {
      return { success: false, error: 'Miembro sin plan activo' }
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')

    if (vencimiento < hoy) {
      return { success: false, error: 'Membresía vencida' }
    }

    // Registrar asistencia
    const { error } = await supabase
      .from('asistencias')
      .insert({ socio_id: socioId })

    if (error) throw error

    return { success: true, socio }

  } catch (error) {
    console.error('Error registrando asistencia:', error)
    return { success: false, error: error.message }
  }
}

// Obtener asistencias del día
export const getAsistenciasHoy = async () => {
  // Verificar conexión
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.', 
      data: [] 
    }
  }

  const fechaHoy = obtenerFechaLocal()
  const inicio = new Date(fechaHoy + 'T00:00:00')
  const fin = new Date(fechaHoy + 'T23:59:59')

  try {
    const { data, error } = await supabase
      .from('asistencias')
      .select(`
        id,
        fecha_hora,
        socio_id,
        socios (nombre, cedula)
      `)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .order('fecha_hora', { ascending: false })

    if (error) throw error

    // Deduplicar por socio_id
    const unicos = []
    const sociosVistos = new Set()

    for (const asistencia of data) {
      if (!sociosVistos.has(asistencia.socio_id)) {
        unicos.push(asistencia)
        sociosVistos.add(asistencia.socio_id)
      }
    }

    return { success: true, data: unicos }

  } catch (error) {
    console.error('Error obteniendo asistencias:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Obtener lista completa de socios para asistencias (con clasificación)
export const getSociosParaAsistencia = async () => {
  // Verificar conexión
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexión a Internet. Por favor, conéctate e intenta nuevamente.', 
      data: [] 
    }
  }

  try {
    const fechaHoy = obtenerFechaLocal()
    const inicio = new Date(fechaHoy + 'T00:00:00')
    const fin = new Date(fechaHoy + 'T23:59:59')

    // 1. Obtener todos los socios activos
    const { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (sociosError) throw sociosError

    // 2. Obtener asistencias de hoy
    const { data: asistenciasHoy, error: asistenciasHoyError } = await supabase
      .from('asistencias')
      .select('socio_id')
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())

    if (asistenciasHoyError) throw asistenciasHoyError

    const sociosConAsistenciaHoy = new Set(asistenciasHoy.map(a => a.socio_id))

    // 3. Obtener conteo total de asistencias por socio
    const { data: historialAsistencias, error: historialError } = await supabase
      .from('asistencias')
      .select('socio_id')

    if (historialError) throw historialError

    const conteoAsistencias = {}
    historialAsistencias.forEach(a => {
      conteoAsistencias[a.socio_id] = (conteoAsistencias[a.socio_id] || 0) + 1
    })

    // 4. Clasificar socios
    const sociosConDatos = socios.map(socio => ({
      ...socio,
      marcoHoy: sociosConAsistenciaHoy.has(socio.id),
      totalAsistencias: conteoAsistencias[socio.id] || 0
    }))

    // 5. Ordenar: Recién registrados (0 asistencias) → Con asistencias (primero sin marcar hoy)
    const ordenados = sociosConDatos.sort((a, b) => {
      // Recién registrados primero (0 asistencias)
      if (a.totalAsistencias === 0 && b.totalAsistencias > 0) return -1
      if (b.totalAsistencias === 0 && a.totalAsistencias > 0) return 1

      // Entre los que tienen asistencias: los que NO marcaron hoy primero
      if (a.totalAsistencias > 0 && b.totalAsistencias > 0) {
        if (!a.marcoHoy && b.marcoHoy) return -1
        if (a.marcoHoy && !b.marcoHoy) return 1
      }

      // Mismo grupo: orden alfabético
      return a.nombre.localeCompare(b.nombre)
    })

    return { success: true, data: ordenados }

  } catch (error) {
    console.error('Error obteniendo socios para asistencia:', error)
    return { success: false, error: error.message, data: [] }
  }
}