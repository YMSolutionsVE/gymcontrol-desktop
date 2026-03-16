import { supabase } from '../config/supabase'

// -- Sanitizacion --

function sanitizeText(str) {
  if (str === null || str === undefined) return str
  if (typeof str !== 'string') return str
  return str
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/\0/g, '')
}

// -- Utilidades --

const obtenerFechaLocal = () => {
  const ahora = new Date()
  return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
}

function validarGymId(gymId) {
  if (!gymId) {
    console.error('pagosService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

/**
 * Calcula nueva fecha de vencimiento usando duracion_dias del plan.
 * Si el socio tiene vencimiento futuro, suma desde ahí (acumulable).
 * Si no, suma desde hoy.
 */
const calcularNuevaFechaVencimiento = (duracionDias, fechaVencimientoActual) => {
  if (!duracionDias || duracionDias <= 0) return null

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  let fechaBase
  if (fechaVencimientoActual) {
    const vencimiento = new Date(fechaVencimientoActual + 'T00:00:00')
    fechaBase = vencimiento > hoy ? vencimiento : hoy
  } else {
    fechaBase = hoy
  }

  const nuevaFecha = new Date(fechaBase)
  nuevaFecha.setDate(nuevaFecha.getDate() + duracionDias)

  return nuevaFecha.toISOString().split('T')[0]
}

// -- Servicios --

export const registrarPago = async (gymId, pagoData) => {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }

  try {
    const {
      socio_id, monto_usd, monto_bs, metodo, referencia,
      registrado_por, plan_id, plan_nombre, duracion_dias, es_cortesia,
      nota_cortesia, tipo_plan, cantidad_sesiones
    } = pagoData

    if (!socio_id || !registrado_por) {
      return { success: false, error: 'Faltan datos requeridos' }
    }

    if (!es_cortesia && !plan_id) {
      return { success: false, error: 'Debe seleccionar un plan' }
    }

    if (!es_cortesia && !metodo) {
      return { success: false, error: 'Debe seleccionar un método de pago' }
    }

    if (!es_cortesia && !monto_usd && !monto_bs) {
      return { success: false, error: 'Debe indicar al menos un monto (USD o Bs)' }
    }

    if (es_cortesia && (!nota_cortesia || !nota_cortesia.trim())) {
      return { success: false, error: 'La cortesía requiere una nota explicativa' }
    }

    const referenciaSanitizada = sanitizeText(referencia)
    const notaSanitizada = sanitizeText(nota_cortesia)

    // Obtener datos actuales del socio
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('*')
      .eq('id', socio_id)
      .eq('gym_id', gymId)
      .single()

    if (socioError) throw socioError

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // -- Verificar pago duplicado (solo planes por días) --
    if (!es_cortesia && tipo_plan !== 'sesiones' && duracion_dias) {
      if (duracion_dias <= 1) {
        // Plan tipo diario: verificar si ya pagó hoy
        const fechaHoy = obtenerFechaLocal()
        const inicioHoy = new Date(fechaHoy + 'T00:00:00').toISOString()
        const finHoy = new Date(fechaHoy + 'T23:59:59').toISOString()

        const { data: pagoHoy } = await supabase
          .from('pagos')
          .select('id')
          .eq('gym_id', gymId)
          .eq('socio_id', socio_id)
          .gte('fecha_pago', inicioHoy)
          .lte('fecha_pago', finHoy)
          .limit(1)

        if (pagoHoy && pagoHoy.length > 0) {
          return {
            success: false,
            error: 'Este miembro ya tiene un pago registrado hoy.'
          }
        }
      } else {
        // Plan tipo mensual/largo: verificar si tiene vencimiento futuro
        if (socio.fecha_vencimiento) {
          const vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
          if (vencimiento > hoy) {
            const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
            return {
              success: false,
              error: `Este miembro ya tiene su plan vigente. Vence el ${socio.fecha_vencimiento} (${diasRestantes} días restantes). No se puede registrar otro pago hasta que venza.`
            }
          }
        }
      }
    }

    // -- Calcular nueva fecha de vencimiento (solo planes por días) --
    const nuevaFechaVencimiento = (es_cortesia || tipo_plan === 'sesiones')
      ? null
      : calcularNuevaFechaVencimiento(duracion_dias, socio.fecha_vencimiento)

    if (!es_cortesia && tipo_plan !== 'sesiones' && !nuevaFechaVencimiento) {
      return { success: false, error: 'No se pudo calcular la nueva fecha de vencimiento' }
    }

    // -- Registrar pago --
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .insert([{
        gym_id: gymId,
        socio_id,
        monto_usd: es_cortesia ? 0 : (monto_usd || 0),
        monto_bs: es_cortesia ? 0 : (monto_bs || 0),
        metodo: es_cortesia ? 'cortesia' : metodo,
        referencia: referenciaSanitizada || null,
        registrado_por,
        fecha_pago: new Date().toISOString()
      }])
      .select()
      .single()

    if (pagoError) throw pagoError

    // -- Actualizar socio: plan_id, plan_actual, fecha_vencimiento/sesiones, cortesía --
    const updateSocio = {}

    if (es_cortesia) {
      updateSocio.es_cortesia = true
      updateSocio.nota_cortesia = notaSanitizada
    } else if (tipo_plan === 'sesiones') {
      const sesiones = parseInt(cantidad_sesiones) || 0
      updateSocio.plan_id = plan_id
      updateSocio.plan_actual = plan_nombre || null
      updateSocio.es_cortesia = false
      updateSocio.nota_cortesia = null
      updateSocio.sesiones_total = sesiones
      updateSocio.sesiones_usadas = 0
      updateSocio.sesiones_restantes = sesiones
      updateSocio.fecha_vencimiento = null
    } else {
      updateSocio.plan_id = plan_id
      updateSocio.plan_actual = plan_nombre || null
      updateSocio.es_cortesia = false
      updateSocio.nota_cortesia = null
      updateSocio.sesiones_total = null
      updateSocio.sesiones_usadas = 0
      updateSocio.sesiones_restantes = null
      if (nuevaFechaVencimiento) {
        updateSocio.fecha_vencimiento = nuevaFechaVencimiento
      }
    }

    const { error: updateError } = await supabase
      .from('socios')
      .update(updateSocio)
      .eq('id', socio_id)
      .eq('gym_id', gymId)

    if (updateError) throw updateError

    return {
      success: true,
      data: { pago, nuevaFechaVencimiento, tipo_plan, cantidad_sesiones }
    }

  } catch (error) {
    console.error('Error registrando pago:', error)
    return { success: false, error: error.message }
  }
}

export const getPagosPorFecha = async (gymId, fechaInicio, fechaFin) => {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    const inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    const fin = new Date(fechaFin + 'T23:59:59').toISOString()

    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        socios (nombre, cedula, plan_actual)
      `)
      .eq('gym_id', gymId)
      .gte('fecha_pago', inicio)
      .lte('fecha_pago', fin)
      .order('fecha_pago', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo pagos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getPagosBySocio = async (gymId, socioId) => {

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
    console.error('Error obteniendo pagos del socio:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getPagos = async (gymId) => {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        socios (nombre, cedula, plan_actual)
      `)
      .eq('gym_id', gymId)
      .order('fecha_pago', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo pagos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// ============================================
// Pagos Pendientes
// ============================================

export const obtenerConfiguracion = async (gymId) => {

  if (!validarGymId(gymId)) {
    return {
      success: true,
      data: { tasaBcv: 40.00 }
    }
  }

  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('tasa_bcv')
      .eq('gym_id', gymId)
      .limit(1)
      .single()

    if (error) throw error

    return {
      success: true,
      data: {
        tasaBcv: data?.tasa_bcv ?? 40.00
      }
    }
  } catch (error) {
    console.error('Error obteniendo configuración:', error)
    return {
      success: true,
      data: { tasaBcv: 40.00 }
    }
  }
}

export const getPendientesHoy = async (gymId) => {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    const fechaHoy = obtenerFechaLocal()

    const { data, error } = await supabase
      .from('pagos_pendientes')
      .select(`
        id,
        socio_id,
        tipo_plan,
        monto_esperado,
        confirmado,
        registrado_por,
        created_at,
        socios (nombre, cedula, telefono, plan_actual, fecha_vencimiento)
      `)
      .eq('gym_id', gymId)
      .eq('fecha', fechaHoy)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo pendientes:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getPendientesSinConfirmar = async (gymId) => {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    const { data, error } = await supabase
      .from('pagos_pendientes')
      .select(`
        id,
        socio_id,
        tipo_plan,
        monto_esperado,
        confirmado,
        fecha,
        registrado_por,
        created_at,
        socios (nombre, cedula, telefono, plan_actual, fecha_vencimiento)
      `)
      .eq('gym_id', gymId)
      .eq('confirmado', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo pendientes sin confirmar:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const confirmarPagoPendiente = async (gymId, pendienteId, datosConfirmacion) => {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }

  try {
    const { metodo, referencia, montoUsd, montoBs, registradoPor } = datosConfirmacion

    if (!metodo) {
      return { success: false, error: 'Debe seleccionar un método de pago' }
    }

    const referenciaSanitizada = sanitizeText(referencia)

    const { data: pendiente, error: pendienteError } = await supabase
      .from('pagos_pendientes')
      .select(`
        *,
        socios (id, nombre, plan_actual, fecha_vencimiento)
      `)
      .eq('id', pendienteId)
      .eq('gym_id', gymId)
      .single()

    if (pendienteError) throw pendienteError

    if (pendiente.confirmado) {
      return { success: false, error: 'Este pago ya fue confirmado' }
    }

    const { error: pagoError } = await supabase
      .from('pagos')
      .insert({
        gym_id: gymId,
        socio_id: pendiente.socio_id,
        monto_usd: montoUsd || pendiente.monto_esperado,
        monto_bs: montoBs || 0,
        metodo,
        referencia: referenciaSanitizada || null,
        registrado_por: registradoPor,
        fecha_pago: new Date().toISOString()
      })

    if (pagoError) throw pagoError

    const { error: confirmError } = await supabase
      .from('pagos_pendientes')
      .update({ confirmado: true })
      .eq('id', pendienteId)
      .eq('gym_id', gymId)

    if (confirmError) throw confirmError

    return {
      success: true,
      data: {
        pendiente,
        socioNombre: pendiente.socios?.nombre
      }
    }

  } catch (error) {
    console.error('Error confirmando pago:', error)
    return { success: false, error: 'No se pudo confirmar el pago. Intenta nuevamente.' }
  }
}