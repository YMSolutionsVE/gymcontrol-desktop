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

// Registrar asistencia (sin bloqueo por pago — crea pendiente automaticamente)
export const registrarAsistencia = async (gymId, socioId) => {
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }

  try {
    var fechaHoy = obtenerFechaLocal()
    var inicio = new Date(fechaHoy + 'T00:00:00')
    var fin = new Date(fechaHoy + 'T23:59:59')

    var { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .maybeSingle()

    if (existente) {
      return { success: false, error: 'Este miembro ya registro asistencia hoy' }
    }

    var { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('*')
      .eq('id', socioId)
      .eq('gym_id', gymId)
      .single()

    if (socioError) throw socioError

    if (!socio.activo) {
      return { success: false, error: 'Miembro inactivo' }
    }

    // Determinar si necesita pago (para notificacion sutil, NO bloquea)
    var necesitaPago = false

    if (socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
      if (!socio.sesiones_restantes || socio.sesiones_restantes <= 0) {
        necesitaPago = true
      }
    } else {
      if (!socio.fecha_vencimiento) {
        necesitaPago = true
      } else {
        var hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        var vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
        if (vencimiento < hoy) {
          necesitaPago = true
        }
      }
    }

    // Registrar asistencia SIEMPRE (sin bloqueo por pago)
    var { error: asistError } = await supabase
      .from('asistencias')
      .insert({ socio_id: socioId, gym_id: gymId })

    if (asistError) throw asistError

    // Descontar sesion SIEMPRE si es plan por sesiones (haya pagado o no)
    if (socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
      var nuevasUsadas = (socio.sesiones_usadas || 0) + 1
      var nuevasRestantes = (socio.sesiones_restantes || 0) - 1

      var { error: updateError } = await supabase
        .from('socios')
        .update({
          sesiones_usadas: nuevasUsadas,
          sesiones_restantes: nuevasRestantes
        })
        .eq('id', socioId)
        .eq('gym_id', gymId)
      if (updateError) throw updateError
      socio.sesiones_usadas = nuevasUsadas
      socio.sesiones_restantes = nuevasRestantes
    }

    // Crear pago pendiente automaticamente si aplica (sin confirmacion)
    if (necesitaPago) {
      var tipoPlan = socio.plan_actual || 'Sin plan'
      var montoEsperado = 0
      var monedaDivisa = 'USD'

      if (socio.plan_id) {
        var { data: plan } = await supabase
          .from('planes')
          .select('nombre, precio_usd, moneda_referencia')
          .eq('id', socio.plan_id)
          .eq('gym_id', gymId)
          .single()

        if (plan) {
          tipoPlan = plan.nombre
          montoEsperado = plan.precio_usd
          monedaDivisa = plan.moneda_referencia || 'USD'
        }
      }

      var { data: pendienteExistente } = await supabase
        .from('pagos_pendientes')
        .select('id')
        .eq('gym_id', gymId)
        .eq('socio_id', socioId)
        .eq('confirmado', false)
        .eq('fecha', fechaHoy)
        .maybeSingle()

      if (!pendienteExistente) {
        await supabase
          .from('pagos_pendientes')
          .insert({
            socio_id: socioId,
            gym_id: gymId,
            tipo_plan: tipoPlan,
            monto_esperado: montoEsperado,
            moneda_divisa: monedaDivisa,
            confirmado: false
          })
      }
    }

    return { success: true, socio: socio, conPendiente: necesitaPago }

  } catch (error) {
    console.error('Error registrando asistencia:', error)
    return { success: false, error: error.message }
  }
}

// Registrar asistencia en fecha pasada (calendario retroactivo)
export const registrarAsistenciaRetroactiva = async (gymId, socioId, fecha) => {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }
  if (!fecha) return { success: false, error: 'Fecha requerida' }

  try {
    var inicio = new Date(fecha + 'T00:00:00')
    var fin = new Date(fecha + 'T23:59:59')

    var { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .maybeSingle()

    if (existente) {
      return { success: false, error: 'Ya tiene asistencia ese dia', yaExiste: true }
    }

    var fechaHora = new Date(fecha + 'T12:00:00')

    var { error: asistError } = await supabase
      .from('asistencias')
      .insert({
        socio_id: socioId,
        gym_id: gymId,
        fecha_hora: fechaHora.toISOString()
      })

    if (asistError) throw asistError

    // Descontar sesion si es plan por sesiones
    var { data: socio } = await supabase
      .from('socios')
      .select('sesiones_total, sesiones_usadas, sesiones_restantes')
      .eq('id', socioId)
      .eq('gym_id', gymId)
      .single()

    if (socio && socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
      await supabase
        .from('socios')
        .update({
          sesiones_usadas: (socio.sesiones_usadas || 0) + 1,
          sesiones_restantes: (socio.sesiones_restantes || 0) - 1
        })
        .eq('id', socioId)
        .eq('gym_id', gymId)
    }

    return { success: true }

  } catch (error) {
    console.error('Error registrando asistencia retroactiva:', error)
    return { success: false, error: error.message }
  }
}

// Eliminar asistencia por fecha (para desmarcar desde calendario)
export const eliminarAsistenciaPorFecha = async (gymId, socioId, fecha) => {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido' }

  try {
    var inicio = new Date(fecha + 'T00:00:00')
    var fin = new Date(fecha + 'T23:59:59')

    var { error } = await supabase
      .from('asistencias')
      .delete()
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())

    if (error) throw error

    // Devolver sesion si es plan por sesiones
    var { data: socio } = await supabase
      .from('socios')
      .select('sesiones_total, sesiones_usadas, sesiones_restantes')
      .eq('id', socioId)
      .eq('gym_id', gymId)
      .single()

    if (socio && socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
      await supabase
        .from('socios')
        .update({
          sesiones_usadas: Math.max((socio.sesiones_usadas || 1) - 1, 0),
          sesiones_restantes: (socio.sesiones_restantes || 0) + 1
        })
        .eq('id', socioId)
        .eq('gym_id', gymId)
    }

    return { success: true }

  } catch (error) {
    console.error('Error eliminando asistencia por fecha:', error)
    return { success: false, error: error.message }
  }
}

// Obtener asistencias de un miembro en un mes (para calendario)
export const getAsistenciasPorMes = async (gymId, socioId, year, month) => {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido', data: [] }

  try {
    var inicio = new Date(year, month, 1)
    var fin = new Date(year, month + 1, 0, 23, 59, 59)

    var { data, error } = await supabase
      .from('asistencias')
      .select('id, fecha_hora')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .order('fecha_hora', { ascending: true })

    if (error) throw error

    var fechas = new Set()
    ;(data || []).forEach(function (a) {
      var d = new Date(a.fecha_hora)
      var offset = d.getTimezoneOffset()
      var local = new Date(d.getTime() - offset * 60000)
      fechas.add(local.toISOString().split('T')[0])
    })

    return { success: true, data: fechas }

  } catch (error) {
    console.error('Error obteniendo asistencias del mes:', error)
    return { success: false, error: error.message, data: new Set() }
  }
}

// Eliminar asistencia (requiere validacion admin previa en el componente)
export const eliminarAsistencia = async (gymId, asistenciaId, socioId) => {
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }

  try {
    var { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, sesiones_total, sesiones_usadas, sesiones_restantes')
      .eq('id', socioId)
      .eq('gym_id', gymId)
      .single()

    if (socioError) throw socioError

    var { error: deleteError } = await supabase
      .from('asistencias')
      .delete()
      .eq('id', asistenciaId)
      .eq('gym_id', gymId)

    if (deleteError) throw deleteError

    if (socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
      var nuevasUsadas = Math.max((socio.sesiones_usadas || 1) - 1, 0)
      var nuevasRestantes = (socio.sesiones_restantes || 0) + 1

      var { error: updateError } = await supabase
        .from('socios')
        .update({
          sesiones_usadas: nuevasUsadas,
          sesiones_restantes: nuevasRestantes
        })
        .eq('id', socioId)
        .eq('gym_id', gymId)

      if (updateError) throw updateError
    }

    return { success: true }

  } catch (error) {
    console.error('Error eliminando asistencia:', error)
    return { success: false, error: error.message }
  }
}

// Obtener asistencias del dia
export const getAsistenciasHoy = async (gymId) => {
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  var fechaHoy = obtenerFechaLocal()
  var inicio = new Date(fechaHoy + 'T00:00:00')
  var fin = new Date(fechaHoy + 'T23:59:59')

  try {
    var { data, error } = await supabase
      .from('asistencias')
      .select('id, fecha_hora, socio_id, socios (nombre, cedula)')
      .eq('gym_id', gymId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .order('fecha_hora', { ascending: false })

    if (error) throw error

    var unicos = []
    var sociosVistos = new Set()

    for (var i = 0; i < data.length; i++) {
      if (!sociosVistos.has(data[i].socio_id)) {
        unicos.push(data[i])
        sociosVistos.add(data[i].socio_id)
      }
    }

    return { success: true, data: unicos }

  } catch (error) {
    console.error('Error obteniendo asistencias:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Obtener lista completa de socios para asistencias (con clasificacion)
export const getSociosParaAsistencia = async (gymId) => {
  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    var fechaHoy = obtenerFechaLocal()
    var inicio = new Date(fechaHoy + 'T00:00:00')
    var fin = new Date(fechaHoy + 'T23:59:59')

    var { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('*')
      .eq('gym_id', gymId)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (sociosError) throw sociosError

    var { data: asistenciasHoy, error: asistenciasHoyError } = await supabase
      .from('asistencias')
      .select('socio_id')
      .eq('gym_id', gymId)
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())

    if (asistenciasHoyError) throw asistenciasHoyError

    var sociosConAsistenciaHoy = new Set(asistenciasHoy.map(function (a) { return a.socio_id }))

    var { data: historialAsistencias, error: historialError } = await supabase
      .from('asistencias')
      .select('socio_id')
      .eq('gym_id', gymId)

    if (historialError) throw historialError

    var conteoAsistencias = {}
    historialAsistencias.forEach(function (a) {
      conteoAsistencias[a.socio_id] = (conteoAsistencias[a.socio_id] || 0) + 1
    })

    var sociosConDatos = socios.map(function (socio) {
      return Object.assign({}, socio, {
        marcoHoy: sociosConAsistenciaHoy.has(socio.id),
        totalAsistencias: conteoAsistencias[socio.id] || 0
      })
    })

    var ordenados = sociosConDatos.sort(function (a, b) {
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