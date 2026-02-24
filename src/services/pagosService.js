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

const calcularNuevaFechaVencimiento = (planActual, fechaVencimientoActual) => {
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

  switch (planActual) {
    case 'diario':
      nuevaFecha.setDate(nuevaFecha.getDate() + 1)
      break
    case 'mensual':
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
      break
    default:
      return null
  }

  return nuevaFecha.toISOString().split('T')[0]
}

// -- Servicios --

export const registrarPago = async (pagoData) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexion a Internet. No se puede registrar el pago sin conexion.' 
    }
  }

  try {
    const { socio_id, monto_usd, monto_bs, metodo, referencia, registrado_por, plan } = pagoData

    if (!socio_id || !metodo || !registrado_por) {
      return { success: false, error: 'Faltan datos requeridos' }
    }

    if (metodo !== 'cortesia' && !monto_usd && !monto_bs) {
      return { success: false, error: 'Debe indicar al menos un monto (USD o Bs)' }
    }

    const referenciaSanitizada = sanitizeText(referencia)

    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('*')
      .eq('id', socio_id)
      .single()

    if (socioError) throw socioError

    // -- Verificar pago duplicado --
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const planPago = plan || socio.plan_actual

    if (planPago === 'mensual') {
      // Verificación 1: Si tiene fecha de vencimiento vigente, bloquear
      if (socio.fecha_vencimiento) {
        const vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
        if (vencimiento > hoy) {
          const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
          return { 
            success: false, 
            error: `Este miembro ya tiene su mensualidad vigente. Vence el ${socio.fecha_vencimiento} (${diasRestantes} dias restantes). No se puede registrar otro pago mensual hasta que venza.`
          }
        }
      }

      // Verificación 2: Si no tiene fecha pero ya pagó este mes, bloquear
      // Esto cubre el caso de registros nuevos o datos inconsistentes
      if (!socio.fecha_vencimiento) {
        const primerDiaMes = obtenerFechaLocal().substring(0, 7) + '-01'
        const inicioMes = new Date(primerDiaMes + 'T00:00:00').toISOString()

        const { data: pagoReciente } = await supabase
          .from('pagos')
          .select('id, fecha_pago')
          .eq('socio_id', socio_id)
          .gte('fecha_pago', inicioMes)
          .order('fecha_pago', { ascending: false })
          .limit(1)

        if (pagoReciente && pagoReciente.length > 0) {
          return { 
            success: false, 
            error: 'Este miembro ya tiene un pago mensual registrado este mes.'
          }
        }
      }
    }

    if (planPago === 'diario') {
      const fechaHoy = obtenerFechaLocal()
      const inicioHoy = new Date(fechaHoy + 'T00:00:00').toISOString()
      const finHoy = new Date(fechaHoy + 'T23:59:59').toISOString()

      const { data: pagoHoy } = await supabase
        .from('pagos')
        .select('id')
        .eq('socio_id', socio_id)
        .gte('fecha_pago', inicioHoy)
        .lte('fecha_pago', finHoy)
        .limit(1)

      if (pagoHoy && pagoHoy.length > 0) {
        return { 
          success: false, 
          error: 'Este miembro ya tiene un pago diario registrado hoy.' 
        }
      }
    }

    // -- Registrar pago --
    const nuevaFechaVencimiento = calcularNuevaFechaVencimiento(
      planPago,
      socio.fecha_vencimiento
    )

    if (!nuevaFechaVencimiento && planPago !== 'cortesia') {
      return { success: false, error: 'No se pudo calcular la nueva fecha de vencimiento' }
    }

    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .insert([{
        socio_id,
        monto_usd: monto_usd || 0,
        monto_bs: monto_bs || 0,
        metodo,
        referencia: referenciaSanitizada || null,
        registrado_por,
        fecha_pago: new Date().toISOString()
      }])
      .select()
      .single()

    if (pagoError) throw pagoError

    if (nuevaFechaVencimiento) {
      const { error: updateError } = await supabase
        .from('socios')
        .update({ fecha_vencimiento: nuevaFechaVencimiento })
        .eq('id', socio_id)

      if (updateError) throw updateError
    }

    return { 
      success: true, 
      data: { pago, nuevaFechaVencimiento } 
    }

  } catch (error) {
    console.error('Error registrando pago:', error)
    return { success: false, error: error.message }
  }
}

export const getPagosPorFecha = async (fechaInicio, fechaFin) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexion a Internet. Por favor, conectate e intenta nuevamente.', 
      data: [] 
    }
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

export const getPagosBySocio = async (socioId) => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexion a Internet. Por favor, conectate e intenta nuevamente.', 
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
    console.error('Error obteniendo pagos del socio:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getPagos = async () => {
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: 'Sin conexion a Internet. Por favor, conectate e intenta nuevamente.', 
      data: [] 
    }
  }

  try {
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        socios (nombre, cedula, plan_actual)
      `)
      .order('fecha_pago', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo pagos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// ============================================
// NUEVAS FUNCIONES: Pagos Pendientes
// ============================================

export const obtenerConfiguracion = async () => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexion a Internet.', data: null }
  }

  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('tasa_bcv, precio_diario, precio_mensual')
      .limit(1)
      .single()

    if (error) throw error

    return {
      success: true,
      data: {
        tasaBcv: data?.tasa_bcv ?? 40.00,
        precioDiario: data?.precio_diario ?? 1.50,
        precioMensual: data?.precio_mensual ?? 25.00
      }
    }
  } catch (error) {
    console.error('Error obteniendo configuracion:', error)
    return {
      success: true,
      data: { tasaBcv: 40.00, precioDiario: 1.50, precioMensual: 25.00 }
    }
  }
}

export const getPendientesHoy = async () => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexion a Internet.', data: [] }
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
      .eq('fecha', fechaHoy)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo pendientes:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const getPendientesSinConfirmar = async () => {
  if (!navigator.onLine) {
    return { success: false, error: 'Sin conexion a Internet.', data: [] }
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
      .eq('confirmado', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error obteniendo pendientes sin confirmar:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export const confirmarPagoPendiente = async (pendienteId, datosConfirmacion) => {
  if (!navigator.onLine) {
    return {
      success: false,
      error: 'Sin conexion a Internet. No se puede confirmar el pago sin conexion.'
    }
  }

  try {
    const { metodo, referencia, montoUsd, montoBs, registradoPor } = datosConfirmacion

    if (!metodo) {
      return { success: false, error: 'Debe seleccionar un metodo de pago' }
    }

    const referenciaSanitizada = sanitizeText(referencia)

    const { data: pendiente, error: pendienteError } = await supabase
      .from('pagos_pendientes')
      .select(`
        *,
        socios (id, nombre, plan_actual, fecha_vencimiento)
      `)
      .eq('id', pendienteId)
      .single()

    if (pendienteError) throw pendienteError

    if (pendiente.confirmado) {
      return { success: false, error: 'Este pago ya fue confirmado' }
    }

    const { error: pagoError } = await supabase
      .from('pagos')
      .insert({
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