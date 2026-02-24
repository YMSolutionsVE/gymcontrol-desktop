import React, { useState, useEffect } from 'react'
import { useConfig } from '../hooks/useConfig'
import { registrarPago } from '../services/pagosService'
import { useAuth } from '../context/AuthContext'

export default function PagoForm({ socio, onComplete, onCancel }) {
  const { config } = useConfig()
  const { user } = useAuth()

  const [form, setForm] = useState({
    monto_usd: '', metodo: 'efectivo', referencia: '',
    plan: 'mensual', nota_cortesia: ''
  })
  const [montoBs, setMontoBs] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const tasaBcv = config ? parseFloat(config.tasa_bcv) : 0

  useEffect(() => {
    const usd = parseFloat(form.monto_usd) || 0
    setMontoBs(Math.round(usd * tasaBcv * 100) / 100)
  }, [form.monto_usd, tasaBcv])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.plan !== 'cortesia') {
      const monto = parseFloat(form.monto_usd)
      if (!monto || monto <= 0) return setError('Ingresa un monto válido')
    }
    if (form.plan === 'cortesia' && !form.nota_cortesia.trim()) return setError('La cortesía requiere una nota')
    if (form.metodo !== 'efectivo' && !form.referencia.trim()) return setError('Ingresa la referencia del pago')

    setSaving(true)
    const montoUsd = form.plan === 'cortesia' ? 0 : parseFloat(form.monto_usd)
    const result = await registrarPago({
      socio_id: socio.id, monto_usd: montoUsd,
      monto_bs: form.plan === 'cortesia' ? 0 : montoBs,
      metodo: form.plan === 'cortesia' ? 'cortesia' : form.metodo,
      referencia: form.referencia, registrado_por: user?.id,
      plan: form.plan, nota_cortesia: form.nota_cortesia
    })
    if (result.success) onComplete(result)
    else setError(result.error)
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
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Tipo de plan</p>
            <div className="grid grid-cols-3 gap-2">
              {['diario', 'mensual', 'cortesia'].map(p => (
                <button
                  key={p} type="button" onClick={() => handleChange('plan', p)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all capitalize ${
                    form.plan === p
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                      : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.1]'
                  }`}
                  disabled={saving}
                >
                  {p === 'cortesia' ? 'Cortesía' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {form.plan !== 'cortesia' && (
            <>
              {/* Amount */}
              <div>
                <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Monto</p>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Monto (USD)</label>
                  <input type="number" step="0.01" value={form.monto_usd} onChange={(e) => handleChange('monto_usd', e.target.value)} className={inputClass} disabled={saving} placeholder="0.00" />
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
                      key={m.id} type="button" onClick={() => handleChange('metodo', m.id)}
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
                  <input type="text" value={form.referencia} onChange={(e) => handleChange('referencia', e.target.value)} placeholder="Número de referencia" className={inputClass} disabled={saving} />
                </div>
              )}
            </>
          )}

          {form.plan === 'cortesia' && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Cortesía</p>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Nota de cortesía</label>
              <textarea
                value={form.nota_cortesia} onChange={(e) => handleChange('nota_cortesia', e.target.value)}
                rows={2} placeholder="Motivo de la cortesía"
                className={`${inputClass} resize-none`} disabled={saving}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={saving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Registrar Pago</>
              )}
            </button>
            <button type="button" onClick={onCancel} disabled={saving}
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