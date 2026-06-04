import { supabase } from '../config/supabase'

const obtenerFechaLocal = () => {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset()
  const fechaLocal = new Date(ahora.getTime() - offset * 60000)
  return fechaLocal.toISOString().split('T')[0]
}

function validarGymId(gymId) {
  if (!gymId) {
    console.error('asistenciasService: gym_id es requerido pero llego:', gymId)
    return false
  }
  return true
}

// FASE 1: Registrar asistencia via RPC — elimina lost updates por read-modify-write
export const registrarAsistencia = async (gymId, socioId, registradoPor) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  try {
    const { data, error } = await supabase.rpc('registrar_asistencia_v2', {
      p_gym_id: gymId,
      p_socio_id: socioId,
      p_registrado_por: registradoPor || 'system',
      p_forzar_pendiente: false
    })
    if (error) throw error
    if (data.codigo === 'REQUIERE_PAGO') return { success: false, codigo: 'REQUIERE_PAGO' }
    if (!data.success) return { success: false, error: data.mensaje || 'No se pudo registrar la asistencia' }
    return { success: true, esDeudor: !!data.es_deudor, nuevaRacha: data.nueva_racha }
  } catch (error) {
    console.error('Error registrando asistencia:', error)
    return { success: false, error: error.message }
  }
}

// FASE 3: Segunda llamada cuando el coach confirma registrar con deuda
export const registrarAsistenciaForzada = async (gymId, socioId, registradoPor) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  try {
    const { data, error } = await supabase.rpc('registrar_asistencia_v2', {
      p_gym_id: gymId,
      p_socio_id: socioId,
      p_registrado_por: registradoPor || 'system',
      p_forzar_pendiente: true
    })
    if (error) throw error
    if (!data.success) return { success: false, error: data.mensaje || 'No se pudo registrar la asistencia' }
    return { success: true, esDeudor: !!data.es_deudor, nuevaRacha: data.nueva_racha }
  } catch (error) {
    console.error('Error registrando asistencia forzada:', error)
    return { success: false, error: error.message }
  }
}

// FASE 2: Desmarcar via RPC — deja log 'anulacion' en logs_asistencias automaticamente
export const desmarcarAsistencia = async (gymId, socioId, registradoPor, fecha) => {
  if (!validarGymId(gymId)) return { success: false, error: 'No se pudo identificar el gimnasio.' }
  try {
    const params = {
      p_gym_id: gymId,
      p_socio_id: socioId,
      p_registrado_por: registradoPor || 'system'
    }
    if (fecha) params.p_fecha = fecha
    const { error } = await supabase.rpc('desmarcar_asistencia_v2', params)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error desmarcando asistencia:', error)
    return { success: false, error: error.message }
  }
}

// Compat: llamado desde lista "Entradas hoy" — asistenciaId ya no se usa, se usa el RPC
export const eliminarAsistencia = async (gymId, asistenciaId, socioId, registradoPor) => {
  return desmarcarAsistencia(gymId, socioId, registradoPor)
}

// Retroactivo: solo inserta la fila, sin tocar contadores (gestionados por ciclos_entrenamiento)
export const registrarAsistenciaRetroactiva = async (gymId, socioId, fecha, registradoPor) => {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }
  if (!fecha) return { success: false, error: 'Fecha requerida' }

  try {
    const inicio = new Date(fecha + 'T00:00:00')
    const fin = new Date(fecha + 'T23:59:59')

    const { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .maybeSingle()

    if (existente) return { success: false, error: 'Ya tiene asistencia ese dia', yaExiste: true }

    const fechaHora = new Date(fecha + 'T12:00:00')
    const { error: asistError } = await supabase
      .from('asistencias')
      .insert({ socio_id: socioId, gym_id: gymId, fecha_hora: fechaHora.toISOString() })

    if (asistError) throw asistError
    return { success: true }
  } catch (error) {
    console.error('Error registrando asistencia retroactiva:', error)
    return { success: false, error: error.message }
  }
}

// Calendario retroactivo — usa RPC desmarcar con fecha especifica
export const eliminarAsistenciaPorFecha = async (gymId, socioId, fecha, registradoPor) => {
  return desmarcarAsistencia(gymId, socioId, registradoPor, fecha)
}

// --- FUNCIONES DE LECTURA (sin cambios) ---

export const getAsistenciasPorMes = async (gymId, socioId, year, month) => {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido', data: [] }

  try {
    const inicio = new Date(year, month, 1)
    const fin = new Date(year, month + 1, 0, 23, 59, 59)

    const { data, error } = await supabase
      .from('asistencias')
      .select('id, fecha_hora')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .order('fecha_hora', { ascending: true })

    if (error) throw error

    const fechas = new Set()
    ;(data || []).forEach(a => {
      const d = new Date(a.fecha_hora)
      const offset = d.getTimezoneOffset()
      const local = new Date(d.getTime() - offset * 60000)
      fechas.add(local.toISOString().split('T')[0])
    })

    return { success: true, data: fechas }
  } catch (error) {
    console.error('Error obteniendo asistencias del mes:', error)
    return { success: false, error: error.message, data: new Set() }
  }
}

export const getAsistenciasHoy = async (gymId) => {
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  const fechaHoy = obtenerFechaLocal()
  const inicio = new Date(fechaHoy + 'T00:00:00')
  const fin = new Date(fechaHoy + 'T23:59:59')

  try {
    const { data, error } = await supabase
      .from('asistencias')
      .select('id, fecha_hora, socio_id, socios (nombre, cedula)')
      .eq('gym_id', gymId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .order('fecha_hora', { ascending: false })

    if (error) throw error

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

export const getSociosParaAsistencia = async (gymId) => {
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    const fechaHoy = obtenerFechaLocal()
    const inicio = new Date(fechaHoy + 'T00:00:00')
    const fin = new Date(fechaHoy + 'T23:59:59')

    const { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('*')
      .eq('gym_id', gymId)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (sociosError) throw sociosError

    const { data: asistenciasHoy, error: asistenciasHoyError } = await supabase
      .from('asistencias')
      .select('socio_id')
      .eq('gym_id', gymId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())

    if (asistenciasHoyError) throw asistenciasHoyError

    const sociosConAsistenciaHoy = new Set(asistenciasHoy.map(a => a.socio_id))

    const { data: historialAsistencias, error: historialError } = await supabase
      .from('asistencias')
      .select('socio_id')
      .eq('gym_id', gymId)

    if (historialError) throw historialError

    const conteoAsistencias = {}
    historialAsistencias.forEach(a => {
      conteoAsistencias[a.socio_id] = (conteoAsistencias[a.socio_id] || 0) + 1
    })

    // FASE 4: ciclo más reciente por socio (activo o agotado) para badges de estado
    const { data: ciclosRecientes } = await supabase
      .from('ciclos_entrenamiento')
      .select('socio_id, id, estado, sesiones_total, sesiones_usadas, pagado')
      .eq('gym_id', gymId)
      .in('estado', ['activo', 'agotado'])
      .order('fecha_inicio', { ascending: false })

    const ciclosPorSocio = {}
    if (ciclosRecientes) {
      ciclosRecientes.forEach(c => {
        if (!ciclosPorSocio[c.socio_id]) ciclosPorSocio[c.socio_id] = c
      })
    }

    const sociosConDatos = socios.map(socio => ({
      ...socio,
      marcoHoy: sociosConAsistenciaHoy.has(socio.id),
      totalAsistencias: conteoAsistencias[socio.id] || 0,
      cicloActivo: ciclosPorSocio[socio.id] || null
    }))

    const ordenados = sociosConDatos.sort((a, b) => {
      if (a.totalAsistencias === 0 && b.totalAsistencias > 0) return -1
      if (b.totalAsistencias === 0 && a.totalAsistencias > 0) return 1
      if (a.totalAsistencias > 0 && b.totalAsistencias > 0) {
        if (!a.marcoHoy && b.marcoHoy) return -1
        if (a.marcoHoy && !b.marcoHoy) return 1
      }
      return a.nombre.localeCompare(b.nombre)
    })

    return { success: true, data: ordenados }
  } catch (error) {
    console.error('Error obteniendo socios para asistencia:', error)
    return { success: false, error: error.message, data: [] }
  }
}
