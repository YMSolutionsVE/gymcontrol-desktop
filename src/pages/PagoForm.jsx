import React, { useState, useEffect } from 'react'
import { useConfig } from '../hooks/useConfig'
import { usePlanes } from '../hooks/usePlanes'
import { registrarPago } from '../services/pagosService'
import { useAuth } from '../context/AuthContext'

export default function PagoForm({ socio, onComplete, onCancel }) {
  const { config } = useConfig()
  const { user, gymId } = useAuth()
  const { planes, loading: planesLoading } = usePlanes(gymId)

  const [form, setForm] = useState({
    plan_id: null,
    monto_usd: '',
    metodo: 'efectivo',
    referencia: '',
    es_cortesia: false,
    nota_cortesia: ''
  })
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [montoBs, setMontoBs] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const tasaBcv = config ? parseFloat(config.tasa_bcv) : 0

  // Auto-seleccionar el plan actual del socio cuando cargan los planes
  useEffect(() => {
    if (planes.length > 0 && socio.plan_id) {
      const planActual = planes.find(p => p.id === socio.plan_id)
      if (planActual) {
        setSelectedPlan(planActual)
        setForm(prev => ({
          ...prev,
          plan_id: planActual.id,
          monto_usd: String(planActual.precio_usd)
        }))
      }
    }
  }, [planes, socio.plan_id])

  // Recalcular Bs cuando cambia monto o tasa
  useEffect(() => {
    const usd = parseFloat(form.monto_usd) || 0
    setMontoBs(Math.round(usd * tasaBcv * 100) / 100)
  }, [form.monto_usd, tasaBcv])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePlanSelect = (planId) => {
    if (planId === 'cortesia') {
      setSelectedPlan(null)
      setForm(prev => ({
        ...prev,
        plan_id: null,
        monto_usd: '',
        es_cortesia: true
      }))
      return
    }

    const plan = planes.find(p => p.id === planId)
    if (!plan) {
      setSelectedPlan(null)
      setForm(prev => ({
        ...prev,
        plan_id: null,
        monto_usd: '',
        es_cortesia: false
      }))
      return
    }

    setSelectedPlan(plan)
    setForm(prev => ({
      ...prev,
      plan_id: plan.id,
      monto_usd: String(plan.precio_usd),
      es_cortesia: false,
      nota_cortesia: ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.es_cortesia) {
      if (!form.plan_id) return setError('Selecciona un plan')
      const monto = parseFloat(form.monto_usd)
      if (!monto || monto <= 0) return setError('Ingresa un monto válido')
      if (form.metodo !== 'efectivo' && !form.referencia.trim()) return setError('Ingresa la referencia del pago')
    } else {
      if (!form.nota_cortesia.trim()) return setError('La cortesía requiere una nota')
    }

    setSaving(true)
    const result = await registrarPago(gymId, {
      socio_id: socio.id,
      monto_usd: form.es_cortesia ? 0 : parseFloat(form.monto_usd),
      monto_bs: form.es_cortesia ? 0 : montoBs,
      metodo: form.es_cortesia ? 'cortesia' : form.metodo,
      referencia: form.referencia,
      registrado_por: user?.id,
      plan_id: form.plan_id,
      plan_nombre: selectedPlan?.nombre || null,
      duracion_dias: selectedPlan?.duracion_dias || null,
      tipo_plan: selectedPlan?.tipo || 'dias',
      cantidad_sesiones: selectedPlan?.cantidad_sesiones || null,
      es_cortesia: form.es_cortesia,
      nota_cortesia: form.nota_cortesia
    })

    if (result.success) {
      onComplete(result)
    } else {
      setError(result.error)
    }
    setSaving(false)
  }

  const inputClass = `w-full px-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-white 
    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
    disabled:opacity-50 transition-all duration-200 text-sm`

  const metodos = [
    {
      id: 'efectivo', label: 'Efectivo',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
    },
    {
      id: 'pago_movil', label: 'Pago Móvil',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
    },
    {
      id: 'transferencia', label: 'Transferencia',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" /></svg>
    },
  ]

  // Current select value
  const selectValue = form.es_cortesia ? 'cortesia' : (form.plan_id || '')

  return (
    <div className="bg-[#111827] rounded-2xl border border-white/[0.06] overflow-hidden max-w-lg">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-emerald-400">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Registrar Pago
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-gray-300 text-sm font-medium">{socio.nombre}</span>
          <span className="text-gray-500 text-sm">— CI: {socio.cedula}</span>
        </div>
        {socio.plan_actual && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-gray-600">Plan actual:</span>
            <span className="text-[11px] font-medium text-blue-400">{socio.plan_actual}</span>
            {socio.fecha_vencimiento && (
              <span className="text-[11px] text-gray-600">· Vence: {socio.fecha_vencimiento}</span>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan selection */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Plan</p>

            {planesLoading ? (
              <div className="flex items-center gap-2 py-3 px-4 rounded-xl" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Cargando planes...</span>
              </div>
            ) : planes.length === 0 ? (
              <div className="py-3 px-4 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                No hay planes configurados. Ve a Configuración → Planes.
              </div>
            ) : (
              <>
                <select
                  value={selectValue}
                  onChange={(e) => handlePlanSelect(e.target.value)}
                  className={inputClass}
                  disabled={saving}
                >
                  <option value="">— Seleccionar plan —</option>
                  {planes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — ${parseFloat(p.precio_usd).toFixed(2)} ({p.tipo === 'sesiones' ? `${p.cantidad_sesiones} sesiones` : `${p.duracion_dias} días`})
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="cortesia">🎁 Cortesía</option>
                </select>

                {/* Plan info card */}
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
                        $
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{selectedPlan.nombre}</p>
                        <p className="text-[11px] text-gray-500">
                          {selectedPlan.tipo === 'sesiones' ? `${selectedPlan.cantidad_sesiones} sesiones` : `${selectedPlan.duracion_dias} días`}
                          {selectedPlan.descripcion && ` · ${selectedPlan.descripcion}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: '#34d399' }}>
                        ${parseFloat(selectedPlan.precio_usd).toFixed(2)}
                      </p>
                      {tasaBcv > 0 && (
                        <p className="text-[11px] text-gray-600">
                          Bs. {(parseFloat(selectedPlan.precio_usd) * tasaBcv).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cortesía note */}
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
                onChange={(e) => handleChange('nota_cortesia', e.target.value)}
                rows={2}
                placeholder="Motivo de la cortesía"
                className={`${inputClass} resize-none`}
                disabled={saving}
              />
            </div>
          )}

          {/* Amount + Method — only for non-cortesía */}
          {!form.es_cortesia && selectedPlan && (
            <>
              {/* Amount */}
              <div>
                <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Monto</p>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Monto (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto_usd}
                    onChange={(e) => handleChange('monto_usd', e.target.value)}
                    className={inputClass}
                    disabled={saving}
                    placeholder="0.00"
                  />
                  <p className="text-gray-500 text-xs mt-1.5 tabular-nums">
                    Equivalente: <span className="text-gray-400">Bs. {montoBs.toFixed(2)}</span> · Tasa: {tasaBcv}
                  </p>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Método de pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {metodos.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleChange('metodo', m.id)}
                      className={`p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${
                        form.metodo === m.id
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                          : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.1]'
                      }`}
                      disabled={saving}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              {form.metodo !== 'efectivo' && (
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Referencia</label>
                  <input
                    type="text"
                    value={form.referencia}
                    onChange={(e) => handleChange('referencia', e.target.value)}
                    placeholder="Número de referencia"
                    className={inputClass}
                    disabled={saving}
                  />
                </div>
              )}
            </>
          )}

          {/* Actions */}
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
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