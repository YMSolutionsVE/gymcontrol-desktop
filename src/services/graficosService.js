import { supabase } from '../config/supabase'

function validarGymId(gymId) {
  if (!gymId) {
    console.error('graficosService: gym_id es requerido pero llegó:', gymId)
    return false
  }
  return true
}

function generarRangoFechas(inicio, fin) {
  var fechas = []
  var actual = new Date(inicio + 'T12:00:00')
  var final = new Date(fin + 'T12:00:00')
  while (actual <= final) {
    fechas.push(actual.toISOString().split('T')[0])
    actual.setDate(actual.getDate() + 1)
  }
  return fechas
}

export var getIngresosPorRango = async function(fechaInicio, fechaFin, gymId) {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido', data: [] }
  try {
    var result = await supabase
      .from('cierres_caja')
      .select('fecha, total_usd, total_eur, total_bs')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .eq('gym_id', gymId)

    if (result.error) throw result.error

    var ingresosMap = {}
    result.data.forEach(function(d) {
      ingresosMap[d.fecha] = {
        usd: Number(d.total_usd) || 0,
        eur: Number(d.total_eur) || 0,
        bs: Number(d.total_bs) || 0
      }
    })

    var todasLasFechas = generarRangoFechas(fechaInicio, fechaFin)
    var dataFinal = todasLasFechas.map(function(fecha) {
      return {
        fecha: fecha,
        usd: ingresosMap[fecha] ? ingresosMap[fecha].usd : 0,
        eur: ingresosMap[fecha] ? ingresosMap[fecha].eur : 0,
        bs: ingresosMap[fecha] ? ingresosMap[fecha].bs : 0
      }
    })

    return { success: true, data: dataFinal }
  } catch (error) {
    console.error('Error obteniendo ingresos:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export var getAsistenciasPorRango = async function(fechaInicio, fechaFin, gymId) {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido', data: [] }
  try {
    var inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    var fin = new Date(fechaFin + 'T23:59:59').toISOString()

    var result = await supabase
      .from('asistencias')
      .select('fecha_hora')
      .gte('fecha_hora', inicio)
      .lte('fecha_hora', fin)
      .eq('gym_id', gymId)

    if (result.error) throw result.error

    var agrupado = {}
    result.data.forEach(function(a) {
      var d = new Date(a.fecha_hora)
      var fechaLocal = d.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
      agrupado[fechaLocal] = (agrupado[fechaLocal] || 0) + 1
    })

    var todasLasFechas = generarRangoFechas(fechaInicio, fechaFin)
    var resultado = todasLasFechas.map(function(fecha) {
      return { fecha: fecha, cantidad: agrupado[fecha] || 0 }
    })

    return { success: true, data: resultado }
  } catch (error) {
    console.error('Error obteniendo asistencias:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export var getMetricasResumen = async function(fechaInicio, fechaFin, gymId) {
  if (!validarGymId(gymId)) return { success: false, error: 'gym_id requerido', data: { totalUSD: 0, totalEUR: 0, totalBS: 0, totalAsistencias: 0, totalDescuentos: 0, cantidadDescuentos: 0, descuentosPorMoneda: {} } }
  try {
    var cierresResult = await supabase
      .from('cierres_caja')
      .select('total_usd, total_eur, total_bs')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .eq('gym_id', gymId)

    if (cierresResult.error) throw cierresResult.error

    var cierres = cierresResult.data
    var totalUSD = cierres.reduce(function(sum, c) { return sum + (Number(c.total_usd) || 0) }, 0)
    var totalEUR = cierres.reduce(function(sum, c) { return sum + (Number(c.total_eur) || 0) }, 0)
    var totalBS = cierres.reduce(function(sum, c) { return sum + (Number(c.total_bs) || 0) }, 0)

    var inicio = new Date(fechaInicio + 'T00:00:00').toISOString()
    var fin = new Date(fechaFin + 'T23:59:59').toISOString()

    var asistResult = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_hora', inicio)
      .lte('fecha_hora', fin)
      .eq('gym_id', gymId)

    if (asistResult.error) throw asistResult.error

    var descResult = await supabase
      .from('pagos')
      .select('descuento, moneda_divisa')
      .gte('fecha_pago', inicio)
      .lte('fecha_pago', fin)
      .gt('descuento', 0)
      .eq('gym_id', gymId)

    var totalDescuentos = 0
    var cantidadDescuentos = 0
    var descuentosPorMoneda = {}

    if (!descResult.error && descResult.data) {
      descResult.data.forEach(function(p) {
        var desc = Number(p.descuento) || 0
        if (desc > 0) {
          totalDescuentos += desc
          cantidadDescuentos++
          var mon = (p.moneda_divisa || 'USD').toUpperCase()
          descuentosPorMoneda[mon] = (descuentosPorMoneda[mon] || 0) + desc
        }
      })
    }

    return {
      success: true,
      data: {
        totalUSD: totalUSD,
        totalEUR: totalEUR,
        totalBS: totalBS,
        totalAsistencias: asistResult.count || 0,
        totalDescuentos: totalDescuentos,
        cantidadDescuentos: cantidadDescuentos,
        descuentosPorMoneda: descuentosPorMoneda
      }
    }
  } catch (error) {
    console.error('Error obteniendo métricas:', error)
    return {
      success: false,
      error: error.message,
      data: { totalUSD: 0, totalEUR: 0, totalBS: 0, totalAsistencias: 0, totalDescuentos: 0, cantidadDescuentos: 0, descuentosPorMoneda: {} }
    }
  }
}