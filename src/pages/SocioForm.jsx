import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../hooks/useConfig'
import { usePlanes } from '../hooks/usePlanes'

export default function SocioForm({ socio, onSave, onCancel }) {
  const { gymId } = useAuth()
  const { config } = useConfig()
  const { planes, loading: planesLoading } = usePlanes(gymId)

  const tasaBcv = config ? parseFloat(config.tasa_bcv) : 0

  const [form, setForm] = useState({
    nombre: '', cedula: '', telefono: '',
    plan_actual: '', plan_id: null,
    fecha_vencimiento: '',
    es_cortesia: false, nota_cortesia: ''
  })
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEditing = !!socio

  useEffect(() => {
    if (socio) {
      setForm({
        nombre: socio.nombre || '',
        cedula: socio.cedula || '',
        telefono: socio.telefono || '',
        plan_actual: socio.plan_actual || '',
        plan_id: socio.plan_id || null,
        fecha_vencimiento: socio.fecha_vencimiento || '',
        es_cortesia: socio.es_cortesia || false,
        nota_cortesia: socio.nota_cortesia || ''
      })
      if (socio.plan_id && planes.length > 0) {
        const found = planes.find(p => p.id === socio.plan_id)
        if (found) setSelectedPlan(found)
      }
    }
  }, [socio, planes])

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
        plan_actual: 'cortesia',
        es_cortesia: true,
        fecha_vencimiento: ''
      }))
      return
    }

    const plan = planes.find(p => p.id === planId)
    if (!plan) {
      setSelectedPlan(null)
      setForm(prev => ({
        ...prev,
        plan_id: null,
        plan_actual: '',
        es_cortesia: false,
        fecha_vencimiento: ''
      }))
      return
    }

    setSelectedPlan(plan)
    setForm(prev => ({
      ...prev,
      plan_id: plan.id,
      plan_actual: plan.nombre,
      es_cortesia: false,
      nota_cortesia: '',
      fecha_vencimiento: isEditing ? prev.fecha_vencimiento : ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (!form.cedula.trim()) return setError('La cédula es obligatoria')
    if (!form.plan_id && !form.es_cortesia) return setError('Selecciona un plan')
    if (form.es_cortesia && !form.nota_cortesia.trim()) return setError('La cortesía requiere una nota explicativa')
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = `w-full px-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-white 
    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
    disabled:opacity-50 transition-all duration-200 text-sm`

  const selectValue = form.es_cortesia ? 'cortesia' : (form.plan_id || '')

  return (
    <div className="bg-[#111827] rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            {isEditing ? (
              <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>
            ) : (
              <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>
            )}
          </svg>
          {isEditing ? 'Editar Miembro' : 'Registrar Nuevo Miembro'}
        </h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos personales */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Datos personales</p>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Nombre completo</label>
                <input type="text" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} placeholder="Nombre del miembro" className={inputClass} disabled={saving} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Cédula</label>
                  <input type="text" value={form.cedula} onChange={(e) => handleChange('cedula', e.target.value)} placeholder="V-12345678" className={inputClass} disabled={saving || isEditing} />
                  {isEditing && <p className="text-gray-600 text-[10px] mt-1">No se puede modificar</p>}
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Teléfono</label>
                  <input type="text" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} placeholder="0412-1234567" className={inputClass} disabled={saving} />
                </div>
              </div>
            </div>
          </div>

          {/* Plan */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Plan y membresía</p>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Plan</label>
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
                <select value={selectValue} onChange={(e) => handlePlanSelect(e.target.value)} className={inputClass} disabled={saving}>
                  <option value="">— Seleccionar plan —</option>
                  {planes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — ${parseFloat(p.precio_usd).toFixed(2)} ({p.tipo === 'sesiones' ? `${p.cantidad_sesiones} sesiones` : `${p.duracion_dias} días`})
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="cortesia">🎁 Cortesía</option>
                </select>
              )}

              {selectedPlan && !form.es_cortesia && (
                <div className="mt-3 rounded-xl p-3 flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedPlan.nombre}</p>
                    <p className="text-[11px] text-gray-500">
                      {selectedPlan.tipo === 'sesiones' ? `${selectedPlan.cantidad_sesiones} sesiones` : `${selectedPlan.duracion_dias} días`}
                      {selectedPlan.descripcion && ` · ${selectedPlan.descripcion}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#34d399' }}>${parseFloat(selectedPlan.precio_usd).toFixed(2)}</p>
                    {tasaBcv > 0 && <p className="text-[11px] text-gray-600">Bs. {(parseFloat(selectedPlan.precio_usd) * tasaBcv).toFixed(2)}</p>}
                  </div>
                </div>
              )}

              {!isEditing && selectedPlan && !form.es_cortesia && (
                <div className="mt-2 rounded-lg px-3 py-2" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  {selectedPlan.tipo === 'sesiones' ? (
                    <p className="text-[11px] text-blue-400/70">{selectedPlan.cantidad_sesiones} sesiones incluidas. Se descuenta 1 por cada asistencia registrada.</p>
                  ) : (
                    <p className="text-[11px] text-blue-400/70">La fecha de vencimiento se calculará automáticamente al registrar el primer pago.</p>
                  )}
                </div>
              )}
            </div>

            {isEditing && selectedPlan?.tipo !== 'sesiones' && (
              <div className="mt-3">
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Fecha de vencimiento</label>
                <input type="date" value={form.fecha_vencimiento} onChange={(e) => handleChange('fecha_vencimiento', e.target.value)} className={inputClass} disabled={saving} />
              </div>
            )}
          </div>

          {/* Cortesía */}
          {form.es_cortesia && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Cortesía</p>
              <div className="rounded-xl border px-4 py-3 mb-3" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <p className="text-blue-400 text-xs font-medium">Membresía gratuita o de prueba</p>
              </div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Nota de cortesía (requerida)</label>
              <textarea value={form.nota_cortesia} onChange={(e) => handleChange('nota_cortesia', e.target.value)} rows={2} placeholder="Razón de la cortesía..." className={`${inputClass} resize-none`} disabled={saving} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || (planes.length === 0 && !planesLoading && !form.es_cortesia)}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> {isEditing ? 'Guardar cambios' : 'Registrar miembro'}</>
              )}
            </button>
            <button type="button" onClick={onCancel} disabled={saving}
              className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] rounded-xl transition-all duration-200 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}