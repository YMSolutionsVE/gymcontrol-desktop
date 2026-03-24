import React, { useEffect, useState } from 'react'

export default function TasaBcvEditor({ tasasActuales, onUpdate, compact = false }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ tasa_bcv: '', tasa_eur: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) return
    setForm({
      tasa_bcv: tasasActuales?.tasa_bcv ? String(tasasActuales.tasa_bcv) : '',
      tasa_eur: tasasActuales?.tasa_eur ? String(tasasActuales.tasa_eur) : '',
    })
  }, [editing, tasasActuales])

  const handleOpen = () => {
    setEditing(true)
    setError('')
  }

  const handleClose = () => {
    setEditing(false)
    setSaving(false)
    setError('')
    setForm({ tasa_bcv: '', tasa_eur: '' })
  }

  const handleSave = async () => {
    setError('')

    const tasaBcv = parseFloat(form.tasa_bcv)
    const tasaEur = parseFloat(form.tasa_eur)

    if (isNaN(tasaBcv) || tasaBcv <= 0) {
      setError('Ingresa una tasa USD valida mayor a 0')
      return
    }

    if (isNaN(tasaEur) || tasaEur <= 0) {
      setError('Ingresa una tasa EUR valida mayor a 0')
      return
    }

    setSaving(true)
    try {
      const result = await onUpdate({
        tasaBcv: form.tasa_bcv,
        tasaEur: form.tasa_eur,
      })

      if (result?.success) {
        handleClose()
      } else {
        setError(result?.error || 'Error al guardar')
      }
    } catch (e) {
      setError('Error inesperado al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={compact
          ? 'bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-white text-xs transition-colors'
          : 'bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm transition-colors'}
      >
        Editar tasas
      </button>

      {editing && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          style={{ background: 'rgba(3, 7, 18, 0.72)', backdropFilter: 'blur(8px)' }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{
              background: 'linear-gradient(160deg, #0B1220, #101827)',
              border: '1px solid rgba(96,165,250,0.18)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-semibold text-lg">Tasas de cambio</p>
                <p className="text-gray-500 text-sm mt-1">Actualiza las referencias vigentes para USD y EUR contra bolivares.</p>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.14)' }}
              >
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  USD a Bs
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tasa_bcv}
                  onChange={(e) => setForm((prev) => ({ ...prev, tasa_bcv: e.target.value }))}
                  placeholder="36.45"
                  className="w-full px-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  disabled={saving}
                  autoFocus
                />
                <p className="text-gray-500 text-xs mt-2">Tasa vigente de referencia para planes en dolar.</p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}
              >
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  EUR a Bs
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tasa_eur}
                  onChange={(e) => setForm((prev) => ({ ...prev, tasa_eur: e.target.value }))}
                  placeholder="39.80"
                  className="w-full px-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  disabled={saving}
                />
                <p className="text-gray-500 text-xs mt-2">Tasa vigente de referencia para planes en euro.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold mb-1">BCV</p>
                <p className="text-blue-400 font-bold text-xl tabular-nums">Bs. {Number(form.tasa_bcv || 0).toFixed(2)}</p>
                <p className="text-gray-600 text-xs">por cada USD</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold mb-1">EUR</p>
                <p className="text-emerald-400 font-bold text-xl tabular-nums">Bs. {Number(form.tasa_eur || 0).toFixed(2)}</p>
                <p className="text-gray-600 text-xs">por cada EUR</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar tasas'}
              </button>
              <button
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white text-sm rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
