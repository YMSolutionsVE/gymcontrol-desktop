import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const obtenerFechaLocal = () => {
  const ahora = new Date()
  return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
}

import {
  getPendientesHoy,
  getPendientesSinConfirmar,
  confirmarPagoPendiente,
  obtenerConfiguracion
} from '../services/pagosService'

// ============================================
// Modal de Confirmación de Pago (Redesigned)
// ============================================
function ConfirmarPagoModal({ pendiente, config, onConfirm, onCancel }) {
  const [metodo, setMetodo] = useState('efectivo')
  const [referencia, setReferencia] = useState('')
  const [montoUsd, setMontoUsd] = useState(pendiente.monto_esperado)
  const [montoBs, setMontoBs] = useState(
    (pendiente.monto_esperado * (config?.tasaBcv || 40)).toFixed(2)
  )
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState(null)

  const handleMontoUsdChange = (valor) => {
    setMontoUsd(valor)
    const usd = parseFloat(valor) || 0
    setMontoBs((usd * config.tasaBcv).toFixed(2))
  }

  const handleMontoBsChange = (valor) => {
    setMontoBs(valor)
    const bs = parseFloat(valor) || 0
    setMontoUsd((bs / config.tasaBcv).toFixed(2))
  }

  const handleConfirmar = async () => {
    if (!metodo) return setError('Selecciona un método de pago')
    if ((metodo === 'transferencia' || metodo === 'pago_movil') && !referencia.trim()) {
      return setError('Ingresa los últimos 4 dígitos de referencia')
    }
    setConfirmando(true)
    setError(null)
    const result = await onConfirm(pendiente.id, {
      metodo,
      referencia: referencia.trim() || null,
      montoUsd: parseFloat(montoUsd) || 0,
      montoBs: parseFloat(montoBs) || 0
    })
    if (!result.success) { setError(result.error); setConfirmando(false) }
  }

  const metodos = [
    {
      id: 'efectivo', label: 'Efectivo',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
    },
    {
      id: 'transferencia', label: 'Transferencia',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="20" y1="10" x2="20" y2="21" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" /></svg>
    },
    {
      id: 'pago_movil', label: 'Pago Móvil',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
    },
  ]

  const necesitaReferencia = metodo === 'transferencia' || metodo === 'pago_movil'

  const inputClass = `w-full px-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-white 
    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
    transition-all duration-200 text-sm`

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Confirmar Pago</h3>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Member info */}
          <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
            <p className="font-semibold text-white">{pendiente.socios?.nombre}</p>
            <p className="text-sm text-gray-400 mt-0.5">C.I: {pendiente.socios?.cedula}</p>
            <div className="flex items-center gap-2 mt-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                pendiente.tipo_plan === 'diario'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {pendiente.tipo_plan === 'diario' ? 'Diario' : 'Mensual'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(pendiente.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {metodos.map(m => (
                <button
                  key={m.id} onClick={() => setMetodo(m.id)}
                  className={`p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${
                    metodo === m.id
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                      : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:border-white/[0.1] hover:bg-white/[0.04]'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          {necesitaReferencia && (
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Últimos 4 dígitos de referencia *</label>
              <input
                type="text" value={referencia}
                onChange={(e) => setReferencia(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ej: 7842" maxLength={4}
                className={`${inputClass} text-xl text-center tracking-[0.3em] font-mono`}
              />
            </div>
          )}

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Monto USD</label>
              <input type="number" step="0.01" value={montoUsd} onChange={(e) => handleMontoUsdChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Monto Bs</label>
              <input type="number" step="0.01" value={montoBs} onChange={(e) => handleMontoBsChange(e.target.value)} className={inputClass} />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 text-right -mt-3">Tasa BCV: Bs {config.tasaBcv} / $1</p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] rounded-xl transition-all text-sm font-medium">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar} disabled={confirmando}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-all text-sm font-bold flex items-center justify-center gap-2"
          >
            {confirmando ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirmando...</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Confirmar Pago</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Panel de Pendientes (Redesigned)
// ============================================
export default function PendientesPanel() {
  const { user } = useAuth()
  const [pendientes, setPendientes] = useState([])
  const [config, setConfig] = useState({ tasaBcv: 40, precioDiario: 1.50, precioMensual: 25 })
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState(null)
  const [pendienteConfirmando, setPendienteConfirmando] = useState(null)
  const [filtro, setFiltro] = useState('hoy')

  useEffect(() => { cargarDatos() }, [filtro])

  const cargarDatos = async () => {
    setLoading(true)
    const [pendientesResult, configResult] = await Promise.all([
      filtro === 'hoy' ? getPendientesHoy() : getPendientesSinConfirmar(),
      obtenerConfiguracion()
    ])
    if (pendientesResult.success) setPendientes(pendientesResult.data)
    if (configResult.success) setConfig(configResult.data)
    setLoading(false)
  }

  const handleConfirmar = async (pendienteId, datos) => {
    const result = await confirmarPagoPendiente(pendienteId, { ...datos, registradoPor: user?.id })
    if (result.success) {
      showMessage(`Pago confirmado: ${result.data.socioNombre}`, 'success')
      setPendienteConfirmando(null)
      cargarDatos()
    }
    return result
  }

  const showMessage = (text, type = 'success') => {
    setMensaje({ text, type })
    setTimeout(() => setMensaje(null), 4000)
  }

  const sinConfirmar = pendientes.filter(p => !p.confirmado)
  const confirmados = pendientes.filter(p => p.confirmado)
  const totalPendienteUsd = sinConfirmar.reduce((sum, p) => sum + Number(p.monto_esperado), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Pagos Pendientes
          </h2>
          {sinConfirmar.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {sinConfirmar.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltro('hoy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtro === 'hoy'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtro === 'todos'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            Todos sin confirmar
          </button>
          <button
            onClick={cargarDatos}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 hover:text-white transition-all"
            title="Refrescar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Message */}
      {mensaje && (
        <div className={`px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2 ${
          mensaje.type === 'error'
            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
          {mensaje.text}
        </div>
      )}

      {/* Summary */}
      {sinConfirmar.length > 0 && (
        <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-amber-400/90 text-sm">
            {sinConfirmar.length} pago{sinConfirmar.length !== 1 ? 's' : ''} por confirmar
          </span>
          <span className="text-amber-400 font-bold text-sm tabular-nums">
            ${totalPendienteUsd.toFixed(2)} USD
            <span className="text-amber-400/50 font-normal ml-1.5">
              (Bs {(totalPendienteUsd * config.tasaBcv).toFixed(2)})
            </span>
          </span>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando pendientes...</p>
        </div>
      )}

      {!loading && sinConfirmar.length === 0 && confirmados.length === 0 && (
        <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-12 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600 mx-auto mb-3">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" /><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" />
          </svg>
          <p className="text-gray-500 mb-1">Sin pagos pendientes</p>
          <p className="text-gray-600 text-sm">Los pagos del instructor en la PWA aparecerán aquí</p>
        </div>
      )}

      {/* Unconfirmed list */}
      <div className="space-y-2">
        {sinConfirmar.map(p => (
          <div
            key={p.id}
            className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4 hover:border-amber-500/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white text-[15px] truncate">{p.socios?.nombre}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    p.tipo_plan === 'diario'
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {p.tipo_plan === 'diario' ? 'Diario' : 'Mensual'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>C.I: {p.socios?.cedula}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(p.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {p.fecha !== obtenerFechaLocal() && (
                    <span className="text-amber-500/70 text-xs flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-VE')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="text-amber-400 font-bold tabular-nums">${Number(p.monto_esperado).toFixed(2)}</p>
                  <p className="text-gray-500 text-xs tabular-nums">Bs {(Number(p.monto_esperado) * config.tasaBcv).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setPendienteConfirmando(p)}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmed list */}
      {confirmados.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px bg-white/[0.06] flex-1" />
            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-[0.15em]">
              Confirmados hoy ({confirmados.length})
            </span>
            <div className="h-px bg-white/[0.06] flex-1" />
          </div>
          <div className="space-y-1.5">
            {confirmados.map(p => (
              <div key={p.id} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-white text-sm font-medium">{p.socios?.nombre}</p>
                  <p className="text-gray-500 text-xs">
                    {p.tipo_plan === 'diario' ? 'Diario' : 'Mensual'} · {new Date(p.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ${Number(p.monto_esperado).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {pendienteConfirmando && (
        <ConfirmarPagoModal
          pendiente={pendienteConfirmando}
          config={config}
          onConfirm={handleConfirmar}
          onCancel={() => setPendienteConfirmando(null)}
        />
      )}
    </div>
  )
}