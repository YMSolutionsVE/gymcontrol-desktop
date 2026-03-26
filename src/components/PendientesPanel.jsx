import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCurrencyBadge } from '../lib/currencyUtils'

var obtenerFechaLocal = function() {
  var ahora = new Date()
  return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
}

import {
  getPendientesHoy,
  getPendientesSinConfirmar,
  confirmarPagoPendiente,
  obtenerConfiguracion
} from '../services/pagosService'

// ============================================
// Modal de Confirmación de Pago
// ============================================
function ConfirmarPagoModal({ pendiente, config, onConfirm, onCancel }) {
  var monedaPendiente = (pendiente.moneda_divisa || 'USD').toUpperCase()
  var esEur = monedaPendiente === 'EUR'
  var tasaActiva = esEur ? (Number(config.tasaEur) || 0) : (Number(config.tasaBcv) || 0)
  var simboloMoneda = esEur ? 'EUR' : 'USD'

  var [metodo, setMetodo] = useState('efectivo')
  var [referencia, setReferencia] = useState('')
  var [montoDivisa, setMontoDivisa] = useState(String(pendiente.monto_esperado || 0))
  var [montoBs, setMontoBs] = useState(
    tasaActiva > 0 ? (Number(pendiente.monto_esperado || 0) * tasaActiva).toFixed(2) : '0.00'
  )
  var [confirmando, setConfirmando] = useState(false)
  var [error, setError] = useState(null)

  // Descuento
  var [aplicarDescuento, setAplicarDescuento] = useState(false)
  var [tipoDescuento, setTipoDescuento] = useState('porcentaje')
  var [valorDescuento, setValorDescuento] = useState('')
  var [motivoDescuento, setMotivoDescuento] = useState('')

  var montoOriginal = Number(pendiente.monto_esperado || 0)
  var descuentoCalculado = 0
  if (aplicarDescuento && Number(valorDescuento) > 0) {
    if (tipoDescuento === 'porcentaje') {
      descuentoCalculado = montoOriginal * (Number(valorDescuento) / 100)
    } else {
      descuentoCalculado = Number(valorDescuento)
    }
    if (descuentoCalculado > montoOriginal) descuentoCalculado = montoOriginal
  }
  var montoFinalDivisa = montoOriginal - descuentoCalculado

  var handleMontoDivisaChange = function(valor) {
    setMontoDivisa(valor)
    var num = parseFloat(valor) || 0
    setMontoBs(tasaActiva > 0 ? (num * tasaActiva).toFixed(2) : '0.00')
  }

  var handleMontoBsChange = function(valor) {
    setMontoBs(valor)
    var bs = parseFloat(valor) || 0
    setMontoDivisa(tasaActiva > 0 ? (bs / tasaActiva).toFixed(2) : '0.00')
  }

  // Recalcular cuando cambia descuento
  useEffect(function() {
    setMontoDivisa(String(montoFinalDivisa.toFixed(2)))
    setMontoBs(tasaActiva > 0 ? (montoFinalDivisa * tasaActiva).toFixed(2) : '0.00')
  }, [aplicarDescuento, valorDescuento, tipoDescuento])

  var handleConfirmar = async function() {
    if (!metodo) return setError('Selecciona un método de pago')
    if ((metodo === 'transferencia' || metodo === 'pago_movil') && !referencia.trim()) {
      return setError('Ingresa los últimos 4 dígitos de referencia')
    }
    setConfirmando(true)
    setError(null)
    var result = await onConfirm(pendiente.id, {
      metodo: metodo,
      referencia: referencia.trim() || null,
      montoUsd: esEur ? 0 : (parseFloat(montoDivisa) || 0),
      montoBs: parseFloat(montoBs) || 0,
      descuento: descuentoCalculado > 0 ? descuentoCalculado.toFixed(2) : 0,
      motivo_descuento: descuentoCalculado > 0 ? motivoDescuento : null,
      tasaAplicada: tasaActiva > 0 ? tasaActiva : null
    })
    if (!result.success) { setError(result.error); setConfirmando(false) }
  }

  var metodos = [
    {
      id: 'efectivo', label: 'Efectivo',
      icon: React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round' },
        React.createElement('rect', { x: '2', y: '6', width: '20', height: '12', rx: '2' }),
        React.createElement('circle', { cx: '12', cy: '12', r: '3' })
      )
    },
    {
      id: 'transferencia', label: 'Transferencia',
      icon: React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round' },
        React.createElement('path', { d: 'M3 21h18' }),
        React.createElement('path', { d: 'M3 10h18' }),
        React.createElement('path', { d: 'M5 6l7-3 7 3' }),
        React.createElement('line', { x1: '4', y1: '10', x2: '4', y2: '21' }),
        React.createElement('line', { x1: '20', y1: '10', x2: '20', y2: '21' }),
        React.createElement('line', { x1: '8', y1: '14', x2: '8', y2: '17' }),
        React.createElement('line', { x1: '12', y1: '14', x2: '12', y2: '17' }),
        React.createElement('line', { x1: '16', y1: '14', x2: '16', y2: '17' })
      )
    },
    {
      id: 'pago_movil', label: 'Pago Móvil',
      icon: React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round' },
        React.createElement('rect', { x: '5', y: '2', width: '14', height: '20', rx: '2' }),
        React.createElement('line', { x1: '12', y1: '18', x2: '12.01', y2: '18' })
      )
    }
  ]

  var necesitaReferencia = metodo === 'transferencia' || metodo === 'pago_movil'

  var inputClass = 'w-full px-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200 text-sm'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Confirmar Pago</h3>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Member info */}
          <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
            <p className="font-semibold text-white">{pendiente.socios ? pendiente.socios.nombre : 'Socio'}</p>
            <p className="text-sm text-gray-400 mt-0.5">{'C.I: ' + (pendiente.socios ? pendiente.socios.cedula : '-')}</p>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {pendiente.tipo_plan || 'Plan'}
              </span>
              {esEur && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  EUR
                </span>
              )}
              <span className="text-xs text-gray-500">
                {new Date(pendiente.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {metodos.map(function(m) {
                var isActive = metodo === m.id
                return (
                  <button
                    key={m.id}
                    onClick={function() { setMetodo(m.id) }}
                    className={isActive
                      ? 'p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-400'
                      : 'p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1.5 border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.1] hover:bg-white/[0.04]'
                    }
                  >
                    {m.icon}
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reference */}
          {necesitaReferencia && (
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Últimos 4 dígitos de referencia *</label>
              <input
                type="text" value={referencia}
                onChange={function(e) { setReferencia(e.target.value.replace(/\D/g, '').slice(0, 4)) }}
                placeholder="Ej: 7842" maxLength={4}
                className={inputClass + ' text-xl text-center tracking-[0.3em] font-mono'}
              />
            </div>
          )}

          {/* Descuento toggle */}
          <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
                Aplicar descuento
              </label>
              <button
                type="button"
                onClick={function() { setAplicarDescuento(!aplicarDescuento); setValorDescuento(''); setMotivoDescuento('') }}
                className={'w-9 h-5 rounded-full transition-colors relative cursor-pointer ' + (aplicarDescuento ? 'bg-amber-500' : 'bg-white/[0.1]')}
              >
                <div className={'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ' + (aplicarDescuento ? 'translate-x-[18px]' : 'translate-x-0.5')} />
              </button>
            </div>

            {aplicarDescuento && (
              <div className="space-y-3 mt-3 pt-3 border-t border-white/[0.06]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={function() { setTipoDescuento('porcentaje'); setValorDescuento('') }}
                    className={tipoDescuento === 'porcentaje'
                      ? 'flex-1 py-2 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'flex-1 py-2 rounded-lg text-xs font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06]'
                    }
                  >
                    % Porcentaje
                  </button>
                  <button
                    type="button"
                    onClick={function() { setTipoDescuento('fijo'); setValorDescuento('') }}
                    className={tipoDescuento === 'fijo'
                      ? 'flex-1 py-2 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'flex-1 py-2 rounded-lg text-xs font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06]'
                    }
                  >
                    {simboloMoneda + ' Fijo'}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={tipoDescuento === 'porcentaje' ? '100' : String(montoOriginal)}
                  value={valorDescuento}
                  onChange={function(e) { setValorDescuento(e.target.value) }}
                  placeholder={tipoDescuento === 'porcentaje' ? 'Ej: 10' : 'Ej: 5.00'}
                  className={inputClass}
                />
                <input
                  type="text"
                  value={motivoDescuento}
                  onChange={function(e) { setMotivoDescuento(e.target.value) }}
                  placeholder="Motivo del descuento (opcional)"
                  className={inputClass}
                />
                {descuentoCalculado > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs">
                    <span className="text-amber-400">{'Descuento: ' + getCurrencyBadge(monedaPendiente) + descuentoCalculado.toFixed(2)}</span>
                    <span className="text-gray-400 ml-2">{'→ Cobra: ' + getCurrencyBadge(monedaPendiente) + montoFinalDivisa.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">{'Monto ' + simboloMoneda}</label>
              <input type="number" step="0.01" value={montoDivisa} onChange={function(e) { handleMontoDivisaChange(e.target.value) }} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Monto Bs</label>
              <input type="number" step="0.01" value={montoBs} onChange={function(e) { handleMontoBsChange(e.target.value) }} className={inputClass} />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 text-right -mt-3">
            {'Tasa ' + (esEur ? 'EUR' : 'BCV') + ': ' + (tasaActiva > 0 ? ('Bs ' + tasaActiva + ' / ' + (esEur ? '€1' : '\$1')) : 'No configurada')}
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] rounded-xl transition-all text-sm font-medium">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar} disabled={confirmando}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-all text-sm font-bold flex items-center justify-center gap-2"
          >
            {confirmando ? (
              React.createElement(React.Fragment, null,
                React.createElement('div', { className: 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' }),
                ' Confirmando...'
              )
            ) : (
              React.createElement(React.Fragment, null,
                React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round' },
                  React.createElement('polyline', { points: '20 6 9 17 4 12' })
                ),
                ' Confirmar Pago'
              )
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Panel de Pendientes
// ============================================
export default function PendientesPanel() {
  var { user, gymId } = useAuth()
  var [pendientes, setPendientes] = useState([])
  var [config, setConfig] = useState({ tasaBcv: 0, tasaEur: 0 })
  var [loading, setLoading] = useState(true)
  var [mensaje, setMensaje] = useState(null)
  var [pendienteConfirmando, setPendienteConfirmando] = useState(null)
  var [filtro, setFiltro] = useState('hoy')

  useEffect(function() { if (gymId) cargarDatos() }, [filtro, gymId])

  var cargarDatos = async function() {
    if (!gymId) return
    setLoading(true)
    var results = await Promise.all([
      filtro === 'hoy' ? getPendientesHoy(gymId) : getPendientesSinConfirmar(gymId),
      obtenerConfiguracion(gymId)
    ])
    if (results[0].success) setPendientes(results[0].data)
    if (results[1].success) setConfig(results[1].data)
    setLoading(false)
  }

  var handleConfirmar = async function(pendienteId, datos) {
    var result = await confirmarPagoPendiente(gymId, pendienteId, Object.assign({}, datos, { registradoPor: user ? user.id : null }))
    if (result.success) {
      var nombre = result.data ? result.data.socioNombre : 'Socio'
      var planMsg = result.data && result.data.planActualizado ? ' · Plan actualizado' : ' · ⚠ Plan no actualizado'
      showMessage('Pago confirmado: ' + nombre + planMsg, 'success')
      setPendienteConfirmando(null)
      cargarDatos()
    }
    return result
  }

  var showMessage = function(text, type) {
    setMensaje({ text: text, type: type || 'success' })
    setTimeout(function() { setMensaje(null) }, 5000)
  }

  var sinConfirmar = pendientes.filter(function(p) { return !p.confirmado })
  var confirmados = pendientes.filter(function(p) { return p.confirmado })

  // Totales separados por moneda
  var totalPendienteUsd = 0
  var totalPendienteEur = 0
  sinConfirmar.forEach(function(p) {
    var moneda = (p.moneda_divisa || 'USD').toUpperCase()
    if (moneda === 'EUR') {
      totalPendienteEur += Number(p.monto_esperado)
    } else {
      totalPendienteUsd += Number(p.monto_esperado)
    }
  })

  var tasaBcv = Number(config.tasaBcv) || 0
  var tasaEur = Number(config.tasaEur) || 0

  var getTasaParaMoneda = function(moneda) {
    return (moneda || 'USD').toUpperCase() === 'EUR' ? tasaEur : tasaBcv
  }

  var getBadgeParaMoneda = function(moneda) {
    return (moneda || 'USD').toUpperCase() === 'EUR' ? '€' : '$'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Pagos Pendientes
          </h2>
          {sinConfirmar.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {sinConfirmar.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={function() { setFiltro('hoy') }}
            className={filtro === 'hoy'
              ? 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/15 text-amber-400 border border-amber-500/25'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }
          >
            Hoy
          </button>
          <button
            onClick={function() { setFiltro('todos') }}
            className={filtro === 'todos'
              ? 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/15 text-amber-400 border border-amber-500/25'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }
          >
            Todos sin confirmar
          </button>
          <button
            onClick={cargarDatos}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 hover:text-white transition-all"
            title="Refrescar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Message */}
      {mensaje && (
        <div className={mensaje.type === 'error'
          ? 'px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400'
          : 'px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }>
          {mensaje.text}
        </div>
      )}

      {/* Summary */}
      {sinConfirmar.length > 0 && (
        <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-amber-400/90 text-sm">
              {sinConfirmar.length + ' pago' + (sinConfirmar.length !== 1 ? 's' : '') + ' por confirmar'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            {totalPendienteUsd > 0 && (
              <span className="text-amber-400 font-bold text-sm tabular-nums">
                {'$' + totalPendienteUsd.toFixed(2) + ' USD'}
                {tasaBcv > 0 && (
                  <span className="text-amber-400/50 font-normal ml-1.5">
                    {'(Bs ' + (totalPendienteUsd * tasaBcv).toFixed(2) + ')'}
                  </span>
                )}
              </span>
            )}
            {totalPendienteEur > 0 && (
              <span className="text-blue-400 font-bold text-sm tabular-nums">
                {'€' + totalPendienteEur.toFixed(2) + ' EUR'}
                {tasaEur > 0 && (
                  <span className="text-blue-400/50 font-normal ml-1.5">
                    {'(Bs ' + (totalPendienteEur * tasaEur).toFixed(2) + ')'}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando pendientes...</p>
        </div>
      )}

      {!loading && sinConfirmar.length === 0 && confirmados.length === 0 && (
        <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-12 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600 mx-auto mb-3">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" /><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" />
          </svg>
          <p className="text-gray-500 mb-1">Sin pagos pendientes</p>
          <p className="text-gray-600 text-sm">Los pagos del instructor en la PWA aparecerán aquí</p>
        </div>
      )}

      {/* Unconfirmed list */}
      <div className="space-y-2">
        {sinConfirmar.map(function(p) {
          var moneda = (p.moneda_divisa || 'USD').toUpperCase()
          var tasa = getTasaParaMoneda(moneda)
          var badge = getBadgeParaMoneda(moneda)
          var esEurItem = moneda === 'EUR'

          return (
            <div
              key={p.id}
              className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4 hover:border-amber-500/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-[15px] truncate">{p.socios ? p.socios.nombre : 'Socio'}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {p.tipo_plan || 'Plan'}
                    </span>
                    {esEurItem && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        EUR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span>{'C.I: ' + (p.socios ? p.socios.cedula : '-')}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(p.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {p.fecha !== obtenerFechaLocal() && (
                      <span className="text-amber-500/70 text-xs flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-VE')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <p className={'font-bold tabular-nums ' + (esEurItem ? 'text-blue-400' : 'text-amber-400')}>
                      {badge + Number(p.monto_esperado).toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs tabular-nums">
                      {tasa > 0 ? ('Bs ' + (Number(p.monto_esperado) * tasa).toFixed(2)) : 'Tasa no configurada'}
                    </p>
                  </div>
                  <button
                    onClick={function() { setPendienteConfirmando(p) }}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmed list */}
      {confirmados.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px bg-white/[0.06] flex-1" />
            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-[0.15em]">
              {'Confirmados hoy (' + confirmados.length + ')'}
            </span>
            <div className="h-px bg-white/[0.06] flex-1" />
          </div>
          <div className="space-y-1.5">
            {confirmados.map(function(p) {
              var moneda = (p.moneda_divisa || 'USD').toUpperCase()
              var badge = getBadgeParaMoneda(moneda)
              return (
                <div key={p.id} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 flex items-center justify-between opacity-60">
                  <div>
                    <p className="text-white text-sm font-medium">{p.socios ? p.socios.nombre : 'Socio'}</p>
                    <p className="text-gray-500 text-xs">
                      {(p.tipo_plan || 'Plan') + ' · ' + new Date(p.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {badge + Number(p.monto_esperado).toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {pendienteConfirmando && (
        <ConfirmarPagoModal
          pendiente={pendienteConfirmando}
          config={config}
          onConfirm={handleConfirmar}
          onCancel={function() { setPendienteConfirmando(null) }}
        />
      )}
    </div>
  )
}