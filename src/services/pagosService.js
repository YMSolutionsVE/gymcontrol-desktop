import { supabase } from '../config/supabase'

// -- Sanitización --

function sanitizeText(str) {
  if (str === null || str === undefined) return str
  if (typeof str !== 'string') return str
  return str
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/\0/g, '')
}

// -- Utilidades --

var obtenerFechaLocal = function() {
  var ahora = new Date()
  return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
}

function validarGymId(gymId) {
  if (!gymId) {
    console.error('pagosService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

var calcularNuevaFechaVencimiento = function(duracionDias) {
  if (!duracionDias || duracionDias <= 0) return null

  var hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  var nuevaFecha = new Date(hoy)
  nuevaFecha.setDate(nuevaFecha.getDate() + parseInt(duracionDias))

  return nuevaFecha.toISOString().split('T')[0]
}

// -- Servicios --

export var registrarPago = async function(gymId, pagoData) {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }

  try {
    var socio_id = pagoData.socio_id
    var monto_usd = pagoData.monto_usd
    var monto_bs = pagoData.monto_bs
    var metodo = pagoData.metodo
    var referencia = pagoData.referencia
    var registrado_por = pagoData.registrado_por
    var plan_id = pagoData.plan_id
    var plan_nombre = pagoData.plan_nombre
    var duracion_dias = pagoData.duracion_dias
    var es_cortesia = pagoData.es_cortesia
    var nota_cortesia = pagoData.nota_cortesia
    var tipo_plan = pagoData.tipo_plan
    var cantidad_sesiones = pagoData.cantidad_sesiones
    var moneda_divisa = pagoData.moneda_divisa
    var monto_divisa = pagoData.monto_divisa
    var tasa_aplicada = pagoData.tasa_aplicada
    var descuento = pagoData.descuento
    var motivo_descuento = pagoData.motivo_descuento

    if (!socio_id || !registrado_por) {
      return { success: false, error: 'Faltan datos requeridos' }
    }

    if (!es_cortesia && !plan_id) {
      return { success: false, error: 'Debe seleccionar un plan' }
    }

    if (!es_cortesia && !metodo) {
      return { success: false, error: 'Debe seleccionar un método de pago' }
    }

    if (!es_cortesia && !monto_divisa && !monto_usd && !monto_bs) {
      return { success: false, error: 'Debe indicar al menos un monto' }
    }

    if (es_cortesia && (!nota_cortesia || !nota_cortesia.trim())) {
      return { success: false, error: 'La cortesía requiere una nota explicativa' }
    }

    var referenciaSanitizada = sanitizeText(referencia)
    var notaSanitizada = sanitizeText(nota_cortesia)
    var motivoSanitizado = sanitizeText(motivo_descuento)

    var socioResult = await supabase
      .from('socios')
      .select('*')
      .eq('id', socio_id)
      .eq('gym_id', gymId)
      .single()

    if (socioResult.error) throw socioResult.error
    var socio = socioResult.data

    var hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // -- Verificar pago duplicado (solo planes por días) --
    if (!es_cortesia && tipo_plan !== 'sesiones' && duracion_dias) {
      if (duracion_dias <= 1) {
        var fechaHoy = obtenerFechaLocal()
        var inicioHoy = new Date(fechaHoy + 'T00:00:00').toISOString()
        var finHoy = new Date(fechaHoy + 'T23:59:59').toISOString()

        var pagoHoyResult = await supabase
          .from('pagos')
          .select('id')
          .eq('gym_id', gymId)
          .eq('socio_id', socio_id)
          .gte('fecha_pago', inicioHoy)
          .lte('fecha_pago', finHoy)
          .limit(1)

        if (pagoHoyResult.data && pagoHoyResult.data.length > 0) {
          return {
            success: false,
            error: 'Este miembro ya tiene un pago registrado hoy.'
          }
        }
      } else {
        if (socio.fecha_vencimiento) {
          var venc = new Date(socio.fecha_vencimiento + 'T00:00:00')
          if (venc > hoy) {
            var diasRestantes = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
            return {
              success: false,
              error: 'Este miembro ya tiene su plan vigente. Vence el ' + socio.fecha_vencimiento + ' (' + diasRestantes + ' días restantes). No se puede registrar otro pago hasta que venza.'
            }
          }
        }
      }
    }

    // -- Calcular nueva fecha de vencimiento --
    var nuevaFechaVencimiento = (es_cortesia || tipo_plan === 'sesiones')
      ? null
      : calcularNuevaFechaVencimiento(duracion_dias)

    if (!es_cortesia && tipo_plan !== 'sesiones' && !nuevaFechaVencimiento) {
      return { success: false, error: 'No se pudo calcular la nueva fecha de vencimiento' }
    }

    // -- Registrar pago --
    var pagoInsert = {
      gym_id: gymId,
      socio_id: socio_id,
      monto_usd: es_cortesia ? 0 : (monto_usd || 0),
      monto_bs: es_cortesia ? 0 : (monto_bs || 0),
      moneda_divisa: es_cortesia ? null : (moneda_divisa || 'USD'),
      monto_divisa: es_cortesia ? 0 : (monto_divisa || 0),
      tasa_aplicada: es_cortesia ? null : (tasa_aplicada || null),
      metodo: es_cortesia ? 'cortesia' : metodo,
      referencia: referenciaSanitizada || null,
      registrado_por: registrado_por,
      fecha_pago: new Date().toISOString(),
      descuento: es_cortesia ? 0 : (parseFloat(descuento) || 0),
      motivo_descuento: es_cortesia ? null : (motivoSanitizado || null)
    }

    var pagoResult = await supabase
      .from('pagos')
      .insert([pagoInsert])
      .select()
      .single()

    if (pagoResult.error) throw pagoResult.error
    var pago = pagoResult.data

    // -- Actualizar socio --
    var updateSocio = {}

    if (es_cortesia) {
      updateSocio.es_cortesia = true
      updateSocio.nota_cortesia = notaSanitizada
    } else if (tipo_plan === 'sesiones') {
      var sesiones = parseInt(cantidad_sesiones) || 0
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

    var updateResult = await supabase
      .from('socios')
      .update(updateSocio)
      .eq('id', socio_id)
      .eq('gym_id', gymId)

    if (updateResult.error) throw updateResult.error

    return {
      success: true,
      data: {
        pago: pago,
        nuevaFechaVencimiento: nuevaFechaVencimiento,
        tipo_plan: tipo_plan,
        cantidad_sesiones: cantidad_sesiones
      }
    }

  } catch (error) {
    console.error('Error registrando pago:', error)
    return { success: false, error: error.message }
  }
}

export var getPagosPorFecha = async function(gymId, fechaInicio, fechaFin) {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    var inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    var fin = new Date(fechaFin + 'T23:59:59').toISOString()

    var result = await supabase
      .from('pagos')
      .select('*, socios (nombre, cedula, plan_actual)')
      .eq('gym_id', gymId)
      .gte('fecha_pago', inicio)
      .lte('fecha_pago', fin)
      .order('fecha_pago', { ascending: false })

    if (result.error) throw result.error

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Error obteniendo pagos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export var getPagosBySocio = async function(gymId, socioId) {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    var result = await supabase
      .from('pagos')
      .select('*')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .order('fecha_pago', { ascending: false })

    if (result.error) throw result.error

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Error obteniendo pagos del socio:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export var getPagos = async function(gymId) {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    var result = await supabase
      .from('pagos')
      .select('*, socios (nombre, cedula, plan_actual)')
      .eq('gym_id', gymId)
      .order('fecha_pago', { ascending: false })

    if (result.error) throw result.error

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Error obteniendo pagos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// ============================================
// Pagos Pendientes
// ============================================

export var obtenerConfiguracion = async function(gymId) {

  if (!validarGymId(gymId)) {
    return {
      success: true,
      data: { tasaBcv: null, tasaEur: null }
    }
  }

  try {
    var result = await supabase
      .from('configuracion')
      .select('tasa_bcv, tasa_eur')
      .eq('gym_id', gymId)
      .limit(1)
      .single()

    if (result.error) throw result.error

    return {
      success: true,
      data: {
        tasaBcv: result.data?.tasa_bcv ?? null,
        tasaEur: result.data?.tasa_eur ?? null
      }
    }
  } catch (error) {
    console.error('Error obteniendo configuración:', error)
    return {
      success: true,
      data: { tasaBcv: null, tasaEur: null }
    }
  }
}

export var getPendientesHoy = async function(gymId) {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    var fechaHoy = obtenerFechaLocal()

    var result = await supabase
      .from('pagos_pendientes')
      .select('id, socio_id, tipo_plan, monto_esperado, moneda_divisa, confirmado, registrado_por, created_at, socios (nombre, cedula, telefono, plan_actual, plan_id, fecha_vencimiento)')
      .eq('gym_id', gymId)
      .eq('fecha', fechaHoy)
      .order('created_at', { ascending: false })

    if (result.error) throw result.error

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Error obteniendo pendientes:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export var getPendientesSinConfirmar = async function(gymId) {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.', data: [] }
  }

  try {
    var result = await supabase
      .from('pagos_pendientes')
      .select('id, socio_id, tipo_plan, monto_esperado, moneda_divisa, confirmado, fecha, registrado_por, created_at, socios (nombre, cedula, telefono, plan_actual, plan_id, fecha_vencimiento)')
      .eq('gym_id', gymId)
      .eq('confirmado', false)
      .order('created_at', { ascending: false })

    if (result.error) throw result.error

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Error obteniendo pendientes sin confirmar:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export var confirmarPagoPendiente = async function(gymId, pendienteId, datosConfirmacion) {

  if (!validarGymId(gymId)) {
    return { success: false, error: 'No se pudo identificar el gimnasio.' }
  }

  try {
    var metodo = datosConfirmacion.metodo
    var referencia = datosConfirmacion.referencia
    var montoUsd = datosConfirmacion.montoUsd
    var montoBs = datosConfirmacion.montoBs
    var registradoPor = datosConfirmacion.registradoPor
    var descuento = datosConfirmacion.descuento
    var motivo_descuento = datosConfirmacion.motivo_descuento
    var tasaAplicada = datosConfirmacion.tasaAplicada

    if (!metodo) {
      return { success: false, error: 'Debe seleccionar un método de pago' }
    }

    var referenciaSanitizada = sanitizeText(referencia)
    var motivoSanitizado = sanitizeText(motivo_descuento)

    // Obtener pendiente con datos del socio
    var pendienteResult = await supabase
      .from('pagos_pendientes')
      .select('*, socios (id, nombre, plan_actual, plan_id, fecha_vencimiento, sesiones_restantes, sesiones_total)')
      .eq('id', pendienteId)
      .eq('gym_id', gymId)
      .single()

    if (pendienteResult.error) throw pendienteResult.error
    var pendiente = pendienteResult.data

    if (pendiente.confirmado) {
      return { success: false, error: 'Este pago ya fue confirmado' }
    }

    // Buscar plan: primero por nombre (tipo_plan), fallback por plan_id del socio
    var plan = null

    var planByNameResult = await supabase
      .from('planes')
      .select('id, nombre, precio_usd, duracion_dias, tipo, cantidad_sesiones, moneda_referencia')
      .eq('gym_id', gymId)
      .eq('nombre', pendiente.tipo_plan)
      .limit(1)

    if (planByNameResult.data && planByNameResult.data.length > 0) {
      plan = planByNameResult.data[0]
    } else if (pendiente.socios && pendiente.socios.plan_id) {
      var planByIdResult = await supabase
        .from('planes')
        .select('id, nombre, precio_usd, duracion_dias, tipo, cantidad_sesiones, moneda_referencia')
        .eq('id', pendiente.socios.plan_id)
        .eq('gym_id', gymId)
        .limit(1)

      if (planByIdResult.data && planByIdResult.data.length > 0) {
        plan = planByIdResult.data[0]
      }
    }

    var monedaPendiente = pendiente.moneda_divisa || 'USD'
    var montoDivisaFinal = montoUsd || pendiente.monto_esperado

    // Insertar pago
    var pagoInsert = {
      gym_id: gymId,
      socio_id: pendiente.socio_id,
      monto_usd: monedaPendiente === 'USD' ? montoDivisaFinal : 0,
      monto_bs: montoBs || 0,
      moneda_divisa: monedaPendiente,
      monto_divisa: montoDivisaFinal,
      tasa_aplicada: tasaAplicada || null,
      metodo: metodo,
      referencia: referenciaSanitizada || null,
      registrado_por: registradoPor,
      fecha_pago: new Date().toISOString(),
      descuento: parseFloat(descuento) || 0,
      motivo_descuento: motivoSanitizado || null
    }

    var pagoResult = await supabase
      .from('pagos')
      .insert(pagoInsert)

    if (pagoResult.error) throw pagoResult.error

    // Marcar como confirmado
    var confirmResult = await supabase
      .from('pagos_pendientes')
      .update({ confirmado: true })
      .eq('id', pendienteId)
      .eq('gym_id', gymId)

    if (confirmResult.error) throw confirmResult.error

    // Actualizar socio con info del plan
    var planActualizado = false

    if (plan) {
      // Verificar si el socio ya tiene este plan activo (PWA ya lo seteo)
      var socioYaActualizado = false
      if (pendiente.socios && pendiente.socios.plan_id === plan.id) {
        if (plan.tipo === 'sesiones') {
          socioYaActualizado = (pendiente.socios.sesiones_restantes || 0) >= 0
            && pendiente.socios.sesiones_total === parseInt(plan.cantidad_sesiones)
        } else {
          if (pendiente.socios.fecha_vencimiento) {
            var hoyCheck = new Date()
            hoyCheck.setHours(0, 0, 0, 0)
            var vencCheck = new Date(pendiente.socios.fecha_vencimiento + 'T00:00:00')
            socioYaActualizado = vencCheck >= hoyCheck
          }
        }
      }

      if (socioYaActualizado) {
        planActualizado = true
      } else {
        var updateSocio = {
          plan_id: plan.id,
          plan_actual: plan.nombre,
          es_cortesia: false,
          nota_cortesia: null
        }

        if (plan.tipo === 'sesiones') {
          var sesiones = parseInt(plan.cantidad_sesiones) || 0
          updateSocio.sesiones_total = sesiones
          updateSocio.sesiones_usadas = 0
          updateSocio.sesiones_restantes = sesiones
          updateSocio.fecha_vencimiento = null
        } else {
          var nuevaFecha = calcularNuevaFechaVencimiento(plan.duracion_dias)
          updateSocio.sesiones_total = null
          updateSocio.sesiones_usadas = 0
          updateSocio.sesiones_restantes = null
          if (nuevaFecha) {
            updateSocio.fecha_vencimiento = nuevaFecha
          }
        }

        var updateResult = await supabase
          .from('socios')
          .update(updateSocio)
          .eq('id', pendiente.socio_id)
          .eq('gym_id', gymId)

        if (updateResult.error) {
          console.error('Error actualizando socio tras confirmar pago:', updateResult.error)
        } else {
          planActualizado = true
        }
      }
    } else {
      console.warn('confirmarPagoPendiente: No se encontró plan "' + pendiente.tipo_plan + '" para actualizar socio')
    }

    return {
      success: true,
      data: {
        pendiente: pendiente,
        socioNombre: pendiente.socios ? pendiente.socios.nombre : 'Socio',
        planActualizado: planActualizado
      }
    }

  } catch (error) {
    console.error('Error confirmando pago:', error)
    return { success: false, error: 'No se pudo confirmar el pago. Intenta nuevamente.' }
  }
}