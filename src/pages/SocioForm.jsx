import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../hooks/useConfig'
import { usePlanes } from '../hooks/usePlanes'
import { getCurrencyBadge, getPlanBsEquivalent, getPlanCurrency } from '../lib/currencyUtils'

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function SocioForm({ socio, onSave, onCancel }) {
  const { gymId } = useAuth()
  const { config } = useConfig()
  const { planes, loading: planesLoading } = usePlanes(gymId)

  const tasaBcv = Number(config?.tasa_bcv) || 0

  const [form, setForm] = useState({
    nombre: '', cedula: '', telefono: '',
    plan_actual: '', plan_id: null,
    fecha_vencimiento: '',
    es_cortesia: false, nota_cortesia: '',
    dias_semana: []
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
        nota_cortesia: socio.nota_cortesia || '',
        dias_semana: socio.dias_semana || []
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

  const toggleDia = (dia) => {
    setForm(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia]
    }))
  }

  const handlePlanSelect = (planId) => {
    if (planId === 'cortesia') {
      setSelectedPlan(null)
      setForm(prev => ({ ...prev, plan_id: null, plan_actual: 'cortesia', es_cortesia: true, fecha_vencimiento: '' }))
      return
    }
    const plan = planes.find(p => p.id === planId)
    if (!plan) {
      setSelectedPlan(null)
      setForm(prev => ({ ...prev, plan_id: null, plan_actual: '', es_cortesia: false, fecha_vencimiento: '' }))
      return
    }
    setSelectedPlan(plan)
    setForm(prev => ({
      ...prev, plan_id: plan.id, plan_actual: plan.nombre,
      es_cortesia: false, nota_cortesia: '',
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
    try { await onSave(form) }
    catch (err) { setError(err.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const inputBase = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  const selectValue = form.es_cortesia ? 'cortesia' : (form.plan_id || '')

  return (
    <div className="rounded-2xl overflow-hidden text-white" style={{ background: 'linear-gradient(160deg, #0B0F1C, #0D1117)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* ── HEADER ── */}
      <div className="relative px-6 py-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: isEditing ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, transparent 60%)' : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isEditing ? 'linear-gradient(135deg, #5b21b6, #8b5cf6)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: isEditing ? '0 4px 16px rgba(139,92,246,0.3)' : '0 4px 16px rgba(59,130,246,0.3)' }}>
            {isEditing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{isEditing ? 'Editar Miembro' : 'Registrar Nuevo Miembro'}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">{isEditing ? `Modificando datos de ${socio?.nombre?.split(' ')[0]}` : 'Completa los datos del nuevo miembro'}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── DATOS PERSONALES ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-400 font-bold tracking-[0.18em] uppercase">Datos personales</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Nombre completo *</label>
                <input type="text" value={form.nombre} onChange={e => handleChange('nombre', e.target.value)}
                  placeholder="Ej: María González"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition-all"
                  style={{ ...inputBase, ...(form.nombre ? { borderColor: 'rgba(99,102,241,0.3)' } : {}) }}
                  disabled={saving} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Cédula *</label>
                  <input type="text" value={form.cedula} onChange={e => handleChange('cedula', e.target.value)}
                    placeholder="V-12345678"
                    className="w-full px-4 py-3 rounded-xl text-sm placeholder-gray-600 focus:outline-none transition-all"
                    style={{ ...inputBase, color: isEditing ? '#6b7280' : 'white', cursor: isEditing ? 'not-allowed' : 'text' }}
                    disabled={saving || isEditing} />
                  {isEditing && <p className="text-gray-600 text-[10px] mt-1 flex items-center gap-1"><span>🔒</span> No editable</p>}
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Teléfono</label>
                  <input type="text" value={form.telefono} onChange={e => handleChange('telefono', e.target.value)}
                    placeholder="0412-1234567"
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition-all"
                    style={inputBase}
                    disabled={saving} />
                </div>
              </div>
            </div>
          </div>

          {/* Divisor */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          {/* ── PLAN ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-400 font-bold tracking-[0.18em] uppercase">Plan y membresía</p>
            </div>

            {planesLoading ? (
              <div className="flex items-center gap-3 py-3.5 px-4 rounded-xl" style={inputBase}>
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Cargando planes...</span>
              </div>
            ) : planes.length === 0 ? (
              <div className="py-3.5 px-4 rounded-xl text-sm flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Sin planes configurados. Ve a Configuración → Planes.
              </div>
            ) : (
              <select value={selectValue} onChange={e => handlePlanSelect(e.target.value)} disabled={saving}
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                style={{ ...inputBase, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
                <option value="" style={{ background: '#0D1117' }}>— Seleccionar plan —</option>
                {planes.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#0D1117' }}>
                    {p.nombre} — {getCurrencyBadge(getPlanCurrency(p))}{parseFloat(p.precio_usd).toFixed(2)} ({p.tipo === 'sesiones' ? `${p.cantidad_sesiones} ses.` : `${p.duracion_dias}d`})
                  </option>
                ))}
                <option disabled style={{ background: '#0D1117' }}>──────────</option>
                <option value="cortesia" style={{ background: '#0D1117' }}>🎁 Cortesía (gratuita)</option>
              </select>
            )}

            {/* Plan seleccionado — preview */}
            {selectedPlan && !form.es_cortesia && (
              <div className="mt-3 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{selectedPlan.nombre}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: selectedPlan.tipo === 'sesiones' ? 'rgba(99,102,241,0.15)' : 'rgba(59,130,246,0.12)', color: selectedPlan.tipo === 'sesiones' ? '#a5b4fc' : '#93c5fd', border: `1px solid ${selectedPlan.tipo === 'sesiones' ? 'rgba(99,102,241,0.25)' : 'rgba(59,130,246,0.2)'}` }}>
                        {selectedPlan.tipo === 'sesiones' ? `${selectedPlan.cantidad_sesiones} sesiones` : `${selectedPlan.duracion_dias} días`}
                      </span>
                      {selectedPlan.descripcion && <span className="text-gray-500 text-[11px]">{selectedPlan.descripcion}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-lg" style={{ color: '#34d399' }}>{getCurrencyBadge(getPlanCurrency(selectedPlan))}{parseFloat(selectedPlan.precio_usd).toFixed(2)}</p>
                    {getPlanBsEquivalent(selectedPlan, config) > 0 && <p className="text-[11px] text-gray-500">Bs. {getPlanBsEquivalent(selectedPlan, config).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
                  </div>
                </div>
                {!isEditing && (
                  <p className="text-[11px] text-gray-500 mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {selectedPlan.tipo === 'sesiones'
                      ? '↓ Se descuenta 1 sesión por cada asistencia registrada.'
                      : '↓ Vencimiento se calcula al registrar el primer pago.'}
                  </p>
                )}
              </div>
            )}

            {/* Fecha vencimiento en edición */}
            {isEditing && selectedPlan?.tipo !== 'sesiones' && (
              <div className="mt-3">
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Fecha de vencimiento</label>
                <input type="date" value={form.fecha_vencimiento} onChange={e => handleChange('fecha_vencimiento', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all"
                  style={inputBase} disabled={saving} />
              </div>
            )}
          </div>

          {/* ── DÍAS DE ASISTENCIA ── */}
          {selectedPlan?.tipo === 'sesiones' && !form.es_cortesia && (
            <>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold tracking-[0.18em] uppercase">Días de asistencia</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.07)' }}>
                    Opcional
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {DIAS.map((dia, i) => {
                    const activo = form.dias_semana.includes(dia)
                    return (
                      <button key={dia} type="button" onClick={() => toggleDia(dia)} disabled={saving}
                        className="flex flex-col items-center py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 active:scale-95"
                        style={{
                          background: activo ? 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(59,130,246,0.15))' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${activo ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          color: activo ? '#93c5fd' : '#4b5563',
                          boxShadow: activo ? '0 2px 10px rgba(59,130,246,0.15)' : 'none',
                        }}>
                        <span>{DIAS_CORTO[i]}</span>
                        {activo && (
                          <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: '#60a5fa' }} />
                        )}
                      </button>
                    )
                  })}
                </div>
                {form.dias_semana.length > 0 && (
                  <p className="text-[11px] mt-2.5 flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Asistirá {form.dias_semana.length} día{form.dias_semana.length !== 1 ? 's' : ''} por semana
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── CORTESÍA ── */}
          {form.es_cortesia && (
            <>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <span style={{ fontSize: 11 }}>🎁</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold tracking-[0.18em] uppercase">Membresía de cortesía</p>
                </div>
                <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <span className="text-amber-400 text-xs font-medium">Membresía gratuita o de prueba — sin cargo al miembro</span>
                </div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Nota de cortesía *</label>
                <textarea value={form.nota_cortesia} onChange={e => handleChange('nota_cortesia', e.target.value)}
                  rows={2} placeholder="Razón de la cortesía (ej: semana de prueba, referido, etc.)"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition-all resize-none"
                  style={inputBase} disabled={saving} />
              </div>
            </>
          )}

          {/* ── ACTIONS ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
            <div className="flex gap-3">
              <button type="submit"
                disabled={saving || (planes.length === 0 && !planesLoading && !form.es_cortesia)}
                className="flex-1 py-3.5 font-bold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 text-white disabled:opacity-40 active:scale-[0.99]"
                style={{
                  background: saving ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  boxShadow: saving ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
                }}>
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {isEditing ? 'Guardar cambios' : 'Registrar miembro'}
                  </>
                )}
              </button>
              <button type="button" onClick={onCancel} disabled={saving}
                className="px-5 py-3.5 font-semibold rounded-xl transition-all duration-200 text-sm text-gray-400 hover:text-white active:scale-[0.99]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
