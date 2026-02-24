import React, { useState, useEffect } from 'react'

function obtenerFechaHoyLocal() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
}

function calcularFechaVencimiento(plan) {
  const fechaLocal = obtenerFechaHoyLocal()

  if (plan === 'diario') {
    return fechaLocal
  }

  // Mensual y cortesía: sin fecha al registrar.
  // La fecha de vencimiento se calcula al momento de registrar el pago real.
  return ''
}

export default function SocioForm({ socio, onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre: '', cedula: '', telefono: '',
    plan_actual: 'mensual', fecha_vencimiento: '',
    es_cortesia: false, nota_cortesia: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEditing = !!socio

  useEffect(() => {
    if (socio) {
      setForm({
        nombre: socio.nombre || '', cedula: socio.cedula || '',
        telefono: socio.telefono || '', plan_actual: socio.plan_actual || 'mensual',
        fecha_vencimiento: socio.fecha_vencimiento || '',
        es_cortesia: socio.es_cortesia || false, nota_cortesia: socio.nota_cortesia || ''
      })
    } else {
      // Nuevo socio: auto-calcular fecha de vencimiento
      setForm(prev => ({
        ...prev,
        fecha_vencimiento: calcularFechaVencimiento(prev.plan_actual)
      }))
    }
  }, [socio])

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value }

      // Si cambia el plan en registro nuevo, recalcular fecha
      if (field === 'plan_actual' && !isEditing) {
        updated.fecha_vencimiento = calcularFechaVencimiento(value)
      }

      return updated
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (!form.cedula.trim()) return setError('La cédula es obligatoria')
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
          {/* Personal data section */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">
              Datos personales
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Nombre completo</label>
                <input
                  type="text" value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Nombre del miembro"
                  className={inputClass} disabled={saving}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Cedula</label>
                  <input
                    type="text" value={form.cedula}
                    onChange={(e) => handleChange('cedula', e.target.value)}
                    placeholder="V-12345678"
                    className={inputClass} disabled={saving || isEditing}
                  />
                  {isEditing && <p className="text-gray-600 text-[10px] mt-1">No se puede modificar</p>}
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Telefono</label>
                  <input
                    type="text" value={form.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="0412-1234567"
                    className={inputClass} disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plan section */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">
              Plan y membresia
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Plan</label>
                <select
                  value={form.plan_actual}
                  onChange={(e) => handleChange('plan_actual', e.target.value)}
                  className={inputClass} disabled={saving}
                >
                  <option value="diario">Diario</option>
                  <option value="mensual">Mensual</option>
                  <option value="cortesia">Cortesia</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Fecha de vencimiento</label>
                <input
                  type="date" value={form.fecha_vencimiento}
                  onChange={(e) => handleChange('fecha_vencimiento', e.target.value)}
                  className={inputClass} disabled={saving}
                />

                {/* Botones rápidos solo para nuevo socio */}
                {!isEditing && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-500 text-[10px]">Rápido:</span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleChange('fecha_vencimiento', obtenerFechaHoyLocal())}
                      className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 transition-all"
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        const fecha = new Date(obtenerFechaHoyLocal() + 'T12:00:00')
                        fecha.setMonth(fecha.getMonth() + 1)
                        handleChange('fecha_vencimiento', fecha.toISOString().split('T')[0])
                      }}
                      className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 transition-all"
                    >
                      +1 Mes
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleChange('fecha_vencimiento', '')}
                      className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                    >
                      Limpiar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cortesía toggle */}
          <div>
            <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">
              Opciones
            </p>
            <div className="flex items-center justify-between bg-[#0D1117] rounded-xl border border-white/[0.08] px-4 py-3">
              <div>
                <p className="text-gray-300 text-sm font-medium">Cortesia</p>
                <p className="text-gray-500 text-xs">Membresia gratuita o de prueba</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('es_cortesia', !form.es_cortesia)}
                disabled={saving}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  form.es_cortesia ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.es_cortesia ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {form.es_cortesia && (
              <div className="mt-3">
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Nota de cortesia</label>
                <textarea
                  value={form.nota_cortesia}
                  onChange={(e) => handleChange('nota_cortesia', e.target.value)}
                  rows={2}
                  placeholder="Razon de la cortesia..."
                  className={`${inputClass} resize-none`} disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={saving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isEditing ? 'Guardar cambios' : 'Registrar miembro'}
                </>
              )}
            </button>
            <button
              type="button" onClick={onCancel} disabled={saving}
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