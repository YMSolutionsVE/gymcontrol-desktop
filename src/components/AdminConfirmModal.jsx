import React, { useState } from 'react'
import { verifyAdminCredentials } from '../services/authAdminService'

export default function AdminConfirmModal({ onConfirm, onCancel, titulo, descripcion, textoConfirmar, colorConfirmar }) {
  var tituloFinal = titulo || 'Confirmacion de Administrador'
  var descripcionFinal = descripcion || 'Esta accion es delicada. Ingresa credenciales de un administrador.'
  var textoBoton = textoConfirmar || 'Confirmar'
  var color = colorConfirmar || 'red'

  var [email, setEmail] = useState('')
  var [password, setPassword] = useState('')
  var [error, setError] = useState('')
  var [loading, setLoading] = useState(false)

  var handleSubmit = async function (e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    var result = await verifyAdminCredentials(email, password)

    if (result.success) {
      onConfirm()
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  var bgBoton = color === 'red'
    ? 'rgba(239,68,68,0.15)'
    : color === 'yellow'
      ? 'rgba(234,179,8,0.15)'
      : 'rgba(59,130,246,0.15)'

  var bgBotonHover = color === 'red'
    ? 'rgba(239,68,68,0.25)'
    : color === 'yellow'
      ? 'rgba(234,179,8,0.25)'
      : 'rgba(59,130,246,0.25)'

  var borderBoton = color === 'red'
    ? 'rgba(239,68,68,0.3)'
    : color === 'yellow'
      ? 'rgba(234,179,8,0.3)'
      : 'rgba(59,130,246,0.3)'

  var colorTextoBoton = color === 'red'
    ? '#f87171'
    : color === 'yellow'
      ? '#facc15'
      : '#60a5fa'

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl p-6"
        style={{
          background: 'linear-gradient(145deg, #0D1117, #111827)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          animation: 'gcFadeInUp 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: bgBoton,
              border: '1px solid ' + borderBoton
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colorTextoBoton} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{tituloFinal}</h2>
            <p className="text-gray-500 text-xs mt-0.5">{descripcionFinal}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="px-4 py-2.5 rounded-xl mb-4 text-sm flex items-center gap-2"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              color: '#f87171'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Correo del administrador</label>
            <input
              type="email"
              placeholder="admin@gimnasio.com"
              value={email}
              onChange={function (e) { setEmail(e.target.value) }}
              required
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-600 text-sm transition-all duration-200 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
              onFocus={function (e) {
                e.target.style.borderColor = 'rgba(59,130,246,0.3)'
                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
              }}
              onBlur={function (e) {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Contrasena</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={function (e) { setPassword(e.target.value) }}
              required
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-600 text-sm transition-all duration-200 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
              onFocus={function (e) {
                e.target.style.borderColor = 'rgba(59,130,246,0.3)'
                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
              }}
              onBlur={function (e) {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: bgBoton,
                border: '1px solid ' + borderBoton,
                color: colorTextoBoton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={function (e) {
                if (!loading) e.currentTarget.style.background = bgBotonHover
              }}
              onMouseLeave={function (e) {
                if (!loading) e.currentTarget.style.background = bgBoton
              }}
            >
              {loading && (
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: colorTextoBoton }} />
              )}
              {loading ? 'Verificando...' : textoBoton}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#9ca3af'
              }}
              onMouseEnter={function (e) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={function (e) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}