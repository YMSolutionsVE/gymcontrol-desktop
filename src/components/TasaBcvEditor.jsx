import React, { useState } from 'react'

export default function TasaBcvEditor({ tasaActual, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleEdit = () => {
    setValue(tasaActual ? tasaActual.toString() : '')
    setEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setEditing(false)
    setValue('')
    setError('')
  }

  const handleSave = async () => {
    setError('')

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      setError('Ingresa un valor válido mayor a 0')
      return
    }

    setSaving(true)
    const result = await onUpdate(value)

    if (result.success) {
      setEditing(false)
      setValue('')
    } else {
      setError(result.error)
    }

    setSaving(false)
  }

  if (!editing) {
    return (
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-sm">Tasa BCV actual</p>
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm transition-colors"
          >
            Editar
          </button>
        </div>
        <p className="text-3xl font-bold text-blue-400">
          Bs. {tasaActual ? parseFloat(tasaActual).toFixed(2) : '0.00'}
        </p>
        <p className="text-gray-500 text-xs mt-1">por cada dólar</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-blue-500">
      <p className="text-gray-300 text-sm mb-3 font-medium">Actualizar tasa BCV</p>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-3 py-2 rounded text-xs mb-3">
          {error}
        </div>
      )}

      <div className="mb-3">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="36.45"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={saving}
          autoFocus
        />
        <p className="text-gray-500 text-xs mt-1">
          Ejemplo: 36.45 (usa punto decimal, no coma)
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}