// src/components/qr/GestionAccesoQR.jsx
// Versión Desktop (Electron + Vite) — llama a las API routes de la PWA

import { useState } from 'react'
import { supabase } from '../../config/supabase'

const API_BASE = import.meta.env.VITE_PWA_URL || 'http://localhost:3000'

export default function GestionAccesoQR({ socio, onClose }) {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [pinPersonalizado, setPinPersonalizado] = useState('')
  const [usarPinPersonalizado, setUsarPinPersonalizado] = useState(false)

  // Crear acceso para el miembro
  const crearAcceso = async () => {
    setLoading(true)
    setError(null)
    setResultado(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Sesión expirada. Vuelve a iniciar sesión.')
        setLoading(false)
        return
      }

      const body = { socio_id: socio.id }
      if (usarPinPersonalizado && pinPersonalizado.length >= 4) {
        body.pin = pinPersonalizado
      }

      const res = await fetch(`${API_BASE}/api/miembros/crear-acceso`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error creando acceso')
      } else {
        setResultado(data)
      }

    } catch (err) {
      console.error('Error creando acceso:', err)
      setError('Error de conexión. ¿Está la PWA ejecutándose?')
    }

    setLoading(false)
  }

  // Resetear PIN
  const resetearPin = async () => {
    setLoading(true)
    setError(null)
    setResultado(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Sesión expirada. Vuelve a iniciar sesión.')
        setLoading(false)
        return
      }

      const res = await fetch(`${API_BASE}/api/miembros/reset-pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socio_id: socio.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error reseteando PIN')
      } else {
        setResultado({ ...data, tipo: 'reset' })
      }

    } catch (err) {
      console.error('Error reseteando PIN:', err)
      setError('Error de conexión. ¿Está la PWA ejecutándose?')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-white/[0.08] w-full max-w-md rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Acceso QR</h3>
            <p className="text-gray-500 text-xs mt-0.5">{socio.nombre} — C.I. {socio.cedula}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {!resultado ? (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Crea o gestiona el acceso QR para que este miembro pueda generar su código de entrada diario desde su teléfono.
              </p>

              {/* PIN personalizado toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setUsarPinPersonalizado(!usarPinPersonalizado)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${usarPinPersonalizado ? 'bg-blue-600' : 'bg-white/[0.1]'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${usarPinPersonalizado ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-gray-400 text-xs">Asignar PIN personalizado</span>
                </label>

                {usarPinPersonalizado && (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pinPersonalizado}
                    onChange={(e) => setPinPersonalizado(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="4-6 dígitos"
                    className="mt-2 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500/40 focus:outline-none transition-colors"
                  />
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={crearAcceso}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  )}
                  Crear acceso
                </button>
                <button
                  onClick={resetearPin}
                  disabled={loading}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Reset PIN
                </button>
              </div>
            </>
          ) : (
            /* Resultado */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/15 rounded-2xl mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <p className="text-emerald-400 font-semibold mb-1">{resultado.mensaje}</p>

              {resultado.credenciales && (
                <div className="mt-4 bg-[#0D1117] border border-white/[0.06] rounded-xl p-4 text-left">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Credenciales del miembro</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Cédula:</span>
                      <span className="text-white font-mono font-semibold">{resultado.credenciales.cedula}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">PIN:</span>
                      <span className="text-blue-400 font-mono font-bold text-lg tracking-widest">{resultado.credenciales.pin}</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    <p className="text-amber-400 text-xs">
                      Anota este PIN y entrégalo al miembro. Deberá cambiarlo en su primer inicio de sesión.
                    </p>
                  </div>
                </div>
              )}

              {resultado.pin && resultado.tipo === 'reset' && (
                <div className="mt-4 bg-[#0D1117] border border-white/[0.06] rounded-xl p-4 text-left">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Nuevo PIN temporal</p>
                  <p className="text-blue-400 font-mono font-bold text-2xl tracking-[0.3em] text-center">{resultado.pin}</p>
                  <p className="text-gray-500 text-xs text-center mt-2">Entregar al miembro</p>
                </div>
              )}

              <p className="text-gray-600 text-xs mt-4">
                El miembro accede desde: <span className="text-gray-400">/acceso-miembro</span>
              </p>

              <button
                onClick={onClose}
                className="mt-4 w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-all"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}