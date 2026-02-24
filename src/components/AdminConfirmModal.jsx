import React, { useState } from 'react'
import { verifyAdminCredentials } from '../services/authAdminService'

export default function AdminConfirmModal({ onConfirm, onCancel }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await verifyAdminCredentials(email, password)

    if (result.success) {
      onConfirm()
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md border border-gray-700">
        <h2 className="text-xl text-white font-semibold mb-4">Confirmación de Administrador</h2>
        <p className="text-gray-400 text-sm mb-4">
          Esta acción es delicada. Ingresa credenciales de un administrador.
        </p>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Correo del administrador"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            required
          />

          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded"
            >
              {loading ? 'Verificando...' : 'Confirmar eliminación'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
