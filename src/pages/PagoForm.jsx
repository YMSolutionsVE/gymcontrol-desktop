import React, { useEffect, useState } from 'react'
import { useConfig } from '../hooks/useConfig'
import { usePlanes } from '../hooks/usePlanes'
import { registrarPago } from '../services/pagosService'
import { useAuth } from '../context/AuthContext'
import {
  convertForeignToBs,
  formatMoney,
  getCurrencyBadge,
  getCurrencyLabel,
  getCurrencySymbol,
  getPlanBsEquivalent,
  getPlanCurrency,
  getRateForCurrency,
} from '../lib/currencyUtils'

export default function PagoForm({ socio, onComplete, onCancel }) {
  var configHook = useConfig()
  var config = configHook.config
  var authHook = useAuth()
  var user = authHook.user
  var gymId = authHook.gymId
  var planesHook = usePlanes(gymId)
  var planes = planesHook.planes
  var planesLoading = planesHook.loading

  var [form, setForm] = useState({
    plan_id: null,
    monto_referencia: '',
    metodo: 'efectivo',
    referencia: '',
    es_cortesia: false,
    nota_cortesia: '',
    aplicar_descuento: false,
    descuento_tipo: 'porcentaje',
    descuento_valor: '',
    motivo_descuento: ''
  })
  var [selectedPlan, setSelectedPlan] = useState(null)
  var [montoBs, setMontoBs] = useState(0)
  var [error, setError] = useState('')
  var [saving, setSaving] = useState(false)

  useEffect(function() {
    if (planes.length > 0 && socio.plan_id) {
      var planActual = planes.find(function(plan) { return plan.id === socio.plan_id })
      if (planActual) {
        setSelectedPlan(planActual)
        setForm(function(prev) {
          return Object.assign({}, prev, {
            plan_id: planActual.id,
            monto_referencia: String(planActual.precio_usd)
          })
        })
      }
    }
  }, [planes, socio.plan_id])

  // Calcular descuento
  var precioOriginal = parseFloat(form.monto_referencia) || 0
  var descuentoMonto = 0
  if (form.aplicar_descuento && form.descuento_valor) {
    var val = parseFloat(form.descuento_valor) || 0
    if (form.descuento_tipo === 'porcentaje') {
      descuentoMonto = precioOriginal * (Math.min(val, 100) / 100)
    } else {
      descuentoMonto = Math.min(val, precioOriginal)
    }
  }
  descuentoMonto = Math.round(descuentoMonto * 100) / 100
  var montoFinal = Math.max(precioOriginal - descuentoMonto, 0)
  montoFinal = Math.round(montoFinal * 100) / 100

  useEffect(function() {
    if (!selectedPlan) {
      setMontoBs(0)
      return
    }
    var monedaPlan = getPlanCurrency(selectedPlan)
    setMontoBs(convertForeignToBs(montoFinal, monedaPlan, config))
  }, [montoFinal, selectedPlan, config])

  var handleChange = function(field, value) {
    setForm(function(prev) {
      var updated = Object.assign({}, prev)
      updated[field] = value
      return updated
    })
    setError('')
  }

  var handlePlanSelect = function(planId) {
    if (planId === 'cortesia') {
      setSelectedPlan(null)
      setForm(function(prev) {
        return Object.assign({}, prev, {
          plan_id: null,
          monto_referencia: '',
          es_cortesia: true,
          aplicar_descuento: false,
          descuento_valor: '',
          motivo_descuento: ''
        })
      })
      return
    }

    var plan = planes.find(function(item) { return item.id === planId })
    if (!plan) {
      setSelectedPlan(null)
      setForm(function(prev) {
        return Object.assign({}, prev, {
          plan_id: null,
          monto_referencia: '',
          es_cortesia: false,
          aplicar_descuento: false,
          descuento_valor: '',
          motivo_descuento: ''
        })
      })
      return
    }

    setSelectedPlan(plan)
    setForm(function(prev) {
      return Object.assign({}, prev, {
        plan_id: plan.id,
        monto_referencia: String(plan.precio_usd),
        es_cortesia: false,
        nota_cortesia: '',
        aplicar_descuento: false,
        descuento_valor: '',
        motivo_descuento: ''
      })
    })
  }

  var handleToggleDescuento = function() {
    setForm(function(prev) {
      return Object.assign({}, prev, {
        aplicar_descuento: !prev.aplicar_descuento,
        descuento_valor: '',
        motivo_descuento: ''
      })
    })
  }

  var handleSubmit = async function(e) {
    e.preventDefault()
    setError('')

    if (!form.es_cortesia) {
      if (!form.plan_id) return setError('Selecciona un plan')

      if (montoFinal <= 0 && !form.aplicar_descuento) return setError('Ingresa un monto válido')
      if (montoFinal <= 0 && form.aplicar_descuento) return setError('El descuento no puede cubrir el 100% del monto')
      if (form.metodo !== 'efectivo' && !form.referencia.trim()) return setError('Ingresa la referencia del pago')

      var monedaPlanCheck = getPlanCurrency(selectedPlan)
      var tasaRequerida = getRateForCurrency(config, monedaPlanCheck)

      if (!tasaRequerida || tasaRequerida <= 0) {
        return setError('Configura la tasa ' + getCurrencySymbol(monedaPlanCheck) + ' antes de registrar pagos')
      }

      if (form.aplicar_descuento && !form.motivo_descuento.trim()) {
        return setError('Indica el motivo del descuento')
      }
    } else if (!form.nota_cortesia.trim()) {
      return setError('La cortesía requiere una nota')
    }

    setSaving(true)

    var monedaPlanFinal = getPlanCurrency(selectedPlan)
    var tasaUsada = getRateForCurrency(config, monedaPlanFinal)
    var montoBsFinal = convertForeignToBs(montoFinal, monedaPlanFinal, config)

    var result = await registrarPago(gymId, {
      socio_id: socio.id,
      monto_usd: form.es_cortesia ? 0 : (monedaPlanFinal === 'USD' ? montoFinal : 0),
      monto_bs: form.es_cortesia ? 0 : montoBsFinal,
      moneda_divisa: form.es_cortesia ? null : monedaPlanFinal,
      monto_divisa: form.es_cortesia ? 0 : montoFinal,
      tasa_aplicada: form.es_cortesia ? null : tasaUsada,
      metodo: form.es_cortesia ? 'cortesia' : form.metodo,
      referencia: form.referencia,
      registrado_por: user ? user.id : null,
      plan_id: form.plan_id,
      plan_nombre: selectedPlan ? selectedPlan.nombre : null,
      duracion_dias: selectedPlan ? selectedPlan.duracion_dias : null,
      tipo_plan: selectedPlan ? selectedPlan.tipo : 'dias',
      cantidad_sesiones: selectedPlan ? selectedPlan.cantidad_sesiones : null,
      es_cortesia: form.es_cortesia,
      nota_cortesia: form.nota_cortesia,
      descuento: form.aplicar_descuento ? descuentoMonto : 0,
      motivo_descuento: form.aplicar_descuento ? form.motivo_descuento : null
    })

    if (result.success) onComplete(result)
    else setError(result.error)

    setSaving(false)
  }

  var inputClass = 'w-full px-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 disabled:opacity-50 transition-all duration-200 text-sm'

  var metodos = [
    {
      id: 'efectivo',
      label: 'Efectivo',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    },
    {
      id: 'pago_movil',
      label: 'Pago Móvil',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      )
    },
    {
      id: 'transferencia',
      label: 'Transferencia',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 21h18" />
          <path d="M3 10h18" />
          <path d="M5 6l7-3 7 3" />
          <line x1="8" y1="14" x2="8" y2="17" />
          <line x1="12" y1="14" x2="12" y2="17" />
          <line x1="16" y1="14" x2="16" y2="17" />
        </svg>
      )
    }
  ]

  var selectValue = form.es_cortesia ? 'cortesia' : (form.plan_id || '')
  var monedaPlan = getPlanCurrency(selectedPlan)

  return (
    <div className="bg-[#111827] rounded-2xl border border-white/[0.06] overflow-hidden max-w-lg">
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-emerald-400">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Registrar Pago
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-gray-300 text-sm font-medium">{socio.nombre}</span>
          <span className="text-gray-500 text-sm">{'- CI: ' + socio.cedula}</span>
        </div>
        {socio.plan_actual && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-gray-600">Plan actual:</span>
            <span className="text-[11px] font-medium text-blue-400">{socio.plan_actual}</span>
            {socio.fecha_vencimiento && (
              <span className="text-[11px] text-gray-600">{'- Vence: ' + socio.fecha_vencimiento}</span>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Plan ── */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Plan</p>

            {planesLoading ? (
              <div className="flex items-center gap-2 py-3 px-4 rounded-xl" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Cargando planes...</span>
              </div>
            ) : planes.length === 0 ? (
              <div className="py-3 px-4 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                No hay planes configurados. Ve a Configuración / Planes.
              </div>
            ) : (
              <>
                <select
                  value={selectValue}
                  onChange={function(e) { handlePlanSelect(e.target.value) }}
                  className={inputClass}
                  disabled={saving}
                >
                  <option value="">— Seleccionar plan —</option>
                  {planes.map(function(plan) {
                    var currency = getPlanCurrency(plan)
                    var badge = getCurrencyBadge(currency)
                    var tipoLabel = plan.tipo === 'sesiones'
                      ? plan.cantidad_sesiones + ' sesiones'
                      : plan.duracion_dias + ' días'
                    return (
                      <option key={plan.id} value={plan.id}>
                        {plan.nombre + ' — ' + badge + parseFloat(plan.precio_usd).toFixed(2) + ' (' + tipoLabel + ')'}
                      </option>
                    )
                  })}
                  <option disabled>──────────</option>
                  <option value="cortesia">Cortesía</option>
                </select>

                {selectedPlan && !form.es_cortesia && (
                  <div
                    className="mt-3 rounded-xl p-3 flex items-center justify-between"
                    style={{
                      background: 'rgba(16,185,129,0.04)',
                      border: '1px solid rgba(16,185,129,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}
                      >
                        {getCurrencyBadge(monedaPlan)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{selectedPlan.nombre}</p>
                        <p className="text-[11px] text-gray-500">
                          {getCurrencyLabel(monedaPlan) + ' · ' + (selectedPlan.tipo === 'sesiones' ? selectedPlan.cantidad_sesiones + ' sesiones' : selectedPlan.duracion_dias + ' días') + (selectedPlan.descripcion ? ' · ' + selectedPlan.descripcion : '')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: '#34d399' }}>
                        {getCurrencyBadge(monedaPlan) + ' ' + parseFloat(selectedPlan.precio_usd).toFixed(2)}
                      </p>
                      {getPlanBsEquivalent(selectedPlan, config) > 0 && (
                        <p className="text-[11px] text-gray-600">
                          {'Bs. ' + formatMoney(getPlanBsEquivalent(selectedPlan, config))}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Cortesía ── */}
          {form.es_cortesia && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Cortesía</p>
              <div
                className="rounded-xl border px-4 py-3 mb-3"
                style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}
              >
                <p className="text-blue-400 text-xs font-medium">Membresía gratuita — no se registra monto</p>
              </div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Nota de cortesía (requerida)</label>
              <textarea
                value={form.nota_cortesia}
                onChange={function(e) { handleChange('nota_cortesia', e.target.value) }}
                rows={2}
                placeholder="Motivo de la cortesía"
                className={inputClass + ' resize-none'}
                disabled={saving}
              />
            </div>
          )}

          {/* ── Monto + Descuento ── */}
          {!form.es_cortesia && selectedPlan && (
            <>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Monto</p>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">
                    {'Precio del plan en ' + getCurrencyLabel(monedaPlan) + ' (' + getCurrencyBadge(monedaPlan) + ')'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto_referencia}
                    onChange={function(e) { handleChange('monto_referencia', e.target.value) }}
                    className={inputClass}
                    disabled={saving}
                    placeholder="0.00"
                  />
                </div>

                {/* ── Toggle Descuento ── */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleToggleDescuento}
                    disabled={saving}
                    className={'flex items-center gap-2 text-sm font-medium transition-all ' + (form.aplicar_descuento ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300')}
                  >
                    <div
                      className={'w-8 h-[18px] rounded-full transition-all duration-200 flex items-center ' + (form.aplicar_descuento ? 'bg-amber-500/30 justify-end' : 'bg-white/10 justify-start')}
                    >
                      <div
                        className={'w-3.5 h-3.5 rounded-full mx-0.5 transition-all duration-200 ' + (form.aplicar_descuento ? 'bg-amber-400' : 'bg-gray-500')}
                      />
                    </div>
                    Aplicar descuento
                  </button>
                </div>

                {/* ── Campos Descuento ── */}
                {form.aplicar_descuento && (
                  <div
                    className="mt-3 rounded-xl p-4 space-y-3"
                    style={{
                      background: 'rgba(245,158,11,0.04)',
                      border: '1px solid rgba(245,158,11,0.15)'
                    }}
                  >
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={function() { handleChange('descuento_tipo', 'porcentaje') }}
                        disabled={saving}
                        className={'flex-1 py-2 rounded-lg text-xs font-semibold transition-all ' + (form.descuento_tipo === 'porcentaje' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.03] text-gray-500 border border-white/[0.06]')}
                      >
                        % Porcentaje
                      </button>
                      <button
                        type="button"
                        onClick={function() { handleChange('descuento_tipo', 'fijo') }}
                        disabled={saving}
                        className={'flex-1 py-2 rounded-lg text-xs font-semibold transition-all ' + (form.descuento_tipo === 'fijo' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.03] text-gray-500 border border-white/[0.06]')}
                      >
                        {getCurrencyBadge(monedaPlan) + ' Monto fijo'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-1.5">
                        {form.descuento_tipo === 'porcentaje' ? 'Porcentaje de descuento' : 'Monto de descuento (' + getCurrencyBadge(monedaPlan) + ')'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={form.descuento_tipo === 'porcentaje' ? '100' : String(precioOriginal)}
                        value={form.descuento_valor}
                        onChange={function(e) { handleChange('descuento_valor', e.target.value) }}
                        className={inputClass}
                        disabled={saving}
                        placeholder={form.descuento_tipo === 'porcentaje' ? 'Ej: 10' : 'Ej: 5.00'}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-1.5">
                        Motivo del descuento *
                      </label>
                      <input
                        type="text"
                        value={form.motivo_descuento}
                        onChange={function(e) { handleChange('motivo_descuento', e.target.value) }}
                        className={inputClass}
                        disabled={saving}
                        placeholder="Ej: Promoción marzo, familiar, referido..."
                      />
                    </div>

                    {descuentoMonto > 0 && (
                      <div
                        className="rounded-lg p-3 flex items-center justify-between"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                      >
                        <div>
                          <p className="text-amber-400 text-xs font-semibold">Descuento aplicado</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            {form.descuento_tipo === 'porcentaje'
                              ? form.descuento_valor + '% de ' + getCurrencyBadge(monedaPlan) + ' ' + precioOriginal.toFixed(2)
                              : getCurrencyBadge(monedaPlan) + ' ' + descuentoMonto.toFixed(2) + ' fijo'
                            }
                          </p>
                        </div>
                        <p className="text-amber-400 font-bold text-sm">
                          {'-' + getCurrencyBadge(monedaPlan) + ' ' + descuentoMonto.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Resumen monto ── */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <span className="text-gray-500 text-xs">Total a pagar:</span>
                  <div className="text-right">
                    <p className={'text-sm font-bold ' + (descuentoMonto > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                      {getCurrencyBadge(monedaPlan) + ' ' + montoFinal.toFixed(2)}
                      {descuentoMonto > 0 && (
                        <span className="text-gray-600 text-xs font-normal line-through ml-2">
                          {getCurrencyBadge(monedaPlan) + ' ' + precioOriginal.toFixed(2)}
                        </span>
                      )}
                    </p>
                    {montoBs > 0 && (
                      <p className="text-[11px] text-gray-600">
                        {'Bs. ' + formatMoney(montoBs)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Método de pago ── */}
              <div>
                <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Método de pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {metodos.map(function(metodo) {
                    return (
                      <button
                        key={metodo.id}
                        type="button"
                        onClick={function() { handleChange('metodo', metodo.id) }}
                        className={'p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1.5 ' + (form.metodo === metodo.id ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.1]')}
                        disabled={saving}
                      >
                        {metodo.icon}
                        {metodo.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Referencia ── */}
              {form.metodo !== 'efectivo' && (
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Referencia</label>
                  <input
                    type="text"
                    value={form.referencia}
                    onChange={function(e) { handleChange('referencia', e.target.value) }}
                    placeholder="Número de referencia"
                    className={inputClass}
                    disabled={saving}
                  />
                </div>
              )}
            </>
          )}

          {/* ── Botones ── */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || (planes.length === 0 && !planesLoading)}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Registrar Pago
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] rounded-xl transition-all duration-200 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}