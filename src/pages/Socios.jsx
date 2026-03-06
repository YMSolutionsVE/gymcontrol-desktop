import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocios } from '../hooks/useSocios'
import {
  createSocio, updateSocio, deactivateSocio, deleteSocio
} from '../services/sociosService'
import {
  getPendientesSinConfirmar, getPendientesHoy, getPagosPorFecha
} from '../services/pagosService'

import SocioCard from '../components/SocioCard'
import SocioForm from './SocioForm'
import PagoForm from './PagoForm'
import AdminConfirmModal from '../components/AdminConfirmModal'
import PendientesPanel from '../components/PendientesPanel'
import GestionAccesoQR from '../components/qr/GestionAccesoQR'

const obtenerFechaLocal = () => {
  const ahora = new Date()
  return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })
}

export default function Socios({ onVerMiembro }) {
  const { gymId } = useAuth()
  const { socios, loading, error, searchTerm, setSearchTerm, reload, setEstado } = useSocios(gymId)

  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [view, setView] = useState('list')
  const [editingSocio, setEditingSocio] = useState(null)
  const [payingSocio, setPayingSocio] = useState(null)
  const [message, setMessage] = useState(null)
  const [socioAEliminar, setSocioAEliminar] = useState(null)
  const [cantidadPendientes, setCantidadPendientes] = useState(0)
  const [pendientesPorSocio, setPendientesPorSocio] = useState(new Set())
  const [pagadosPorSocio, setPagadosPorSocio] = useState(new Set())
  const [socioQR, setSocioQR] = useState(null)

  const cargarEstadoPagos = useCallback(async () => {
    if (!gymId) return
    const fechaHoy = obtenerFechaLocal()
    const pendientesResult = await getPendientesHoy(gymId)
    if (pendientesResult.success) {
      const sinConfirmar = pendientesResult.data.filter(p => !p.confirmado)
      const confirmados = pendientesResult.data.filter(p => p.confirmado)
      setPendientesPorSocio(new Set(sinConfirmar.map(p => p.socio_id)))
      const pagadosSet = new Set(confirmados.map(p => p.socio_id))
      const pagosResult = await getPagosPorFecha(gymId, fechaHoy, fechaHoy)
      if (pagosResult.success) pagosResult.data.forEach(p => pagadosSet.add(p.socio_id))
      setPagadosPorSocio(pagadosSet)
    }
    const todosResult = await getPendientesSinConfirmar(gymId)
    if (todosResult.success) setCantidadPendientes(todosResult.data.filter(p => !p.confirmado).length)
  }, [gymId])

  useEffect(() => {
    if (!gymId) return
    cargarEstadoPagos()
    const interval = setInterval(cargarEstadoPagos, 30000)
    return () => clearInterval(interval)
  }, [cargarEstadoPagos, gymId])

  useEffect(() => { if (socios.length > 0) cargarEstadoPagos() }, [socios, cargarEstadoPagos])

  const getEstadoPago = (socio) => {
    if (pendientesPorSocio.has(socio.id)) return 'pendiente'
    if (pagadosPorSocio.has(socio.id)) return 'pagado'
    // Plan por sesiones: tiene sesiones disponibles = está al día
    if (socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
      return socio.sesiones_restantes > 0 ? 'pagado' : 'sin_pago'
    }
    // Plan por días
    if (socio.fecha_vencimiento) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      const vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
      if (Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24)) > 0) return 'pagado'
    }
    return 'sin_pago'
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleNew = () => { setEditingSocio(null); setView('form') }
  const handleEdit = (socio) => { setEditingSocio(socio); setView('form') }
  const handlePay = (socio) => { setPayingSocio(socio); setView('pago') }
  const handleAccesoQR = (socio) => { setSocioQR(socio) }
  const handleDeactivate = async (socio) => {
    if (!window.confirm(`¿Desactivar a ${socio.nombre}?`)) return
    const result = await deactivateSocio(gymId, socio.id)
    if (result.success) { showMessage(`${socio.nombre} desactivado`); reload() }
    else showMessage(result.error, 'error')
  }
  const handleDelete = (socio) => setSocioAEliminar(socio)
  const confirmDelete = async () => {
    const result = await deleteSocio(gymId, socioAEliminar.id)
    if (result.success) { showMessage('Miembro eliminado'); setSocioAEliminar(null); reload() }
    else showMessage(result.error, 'error')
  }
  const handleSave = async (formData) => {
    let result = editingSocio
      ? await updateSocio(gymId, editingSocio.id, formData)
      : await createSocio(gymId, formData)
    if (result.success) { showMessage(editingSocio ? 'Miembro actualizado' : 'Miembro registrado'); setView('list'); reload(); cargarEstadoPagos() }
    else throw new Error(result.error)
  }
  const handlePagoComplete = () => { showMessage('Pago registrado'); setView('list'); reload(); cargarEstadoPagos() }
  const handleCancel = () => { setView('list'); setEditingSocio(null); setPayingSocio(null) }
  const handleFiltroChange = (filtroId) => {
    setEstadoFiltro(filtroId)
    if (filtroId !== 'pendientes') setEstado(filtroId)
  }

  if (view === 'form') return (
    <div className="p-8 max-w-[800px] gc-fade-in">
      <SocioForm socio={editingSocio} onSave={handleSave} onCancel={handleCancel} />
    </div>
  )

  if (view === 'pago') return (
    <div className="p-8 max-w-[800px] gc-fade-in">
      <PagoForm socio={payingSocio} onComplete={handlePagoComplete} onCancel={handleCancel} />
    </div>
  )

  const filtros = [
    { id: 'todos', label: 'Todos', color: 'blue' },
    { id: 'activos', label: 'Activos', color: 'green' },
    { id: 'por_vencer', label: 'Por vencer', color: 'yellow' },
    { id: 'vencidos', label: 'Vencidos', color: 'red' },
  ]

  const filtroColors = {
    blue: { active: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', text: '#60a5fa' },
    green: { active: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
    yellow: { active: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24' },
    red: { active: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
  }

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gc-stagger-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Miembros</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {socios.length} registrado{socios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Miembro
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2"
          style={{
            background: message.type === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
            color: message.type === 'error' ? '#f87171' : '#34d399',
            animation: 'gcFadeInUp 0.3s ease-out',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {message.type === 'error'
              ? <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
              : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
            }
          </svg>
          {message.text}
        </div>
      )}

      {/* Search */}
      {estadoFiltro !== 'pendientes' && (
        <div className="relative mb-4 gc-stagger-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm transition-all duration-200 focus:outline-none"
            style={{
              background: 'linear-gradient(145deg, #0D1117, #111827)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(59,130,246,0.3)'
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 gc-stagger-3">
        {filtros.map(f => {
          const isActive = estadoFiltro === f.id
          const colors = filtroColors[f.color]
          return (
            <button
              key={f.id}
              onClick={() => handleFiltroChange(f.id)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: isActive ? colors.active : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? colors.border : 'rgba(255,255,255,0.06)'}`,
                color: isActive ? colors.text : '#6b7280',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = '#d1d5db'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.color = '#6b7280'
                }
              }}
            >
              {f.label}
            </button>
          )
        })}

        {/* Pendientes button */}
        <button
          onClick={() => handleFiltroChange('pendientes')}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2"
          style={{
            background: estadoFiltro === 'pendientes' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${estadoFiltro === 'pendientes' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)'}`,
            color: estadoFiltro === 'pendientes' ? '#fbbf24' : '#6b7280',
          }}
          onMouseEnter={(e) => {
            if (estadoFiltro !== 'pendientes') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = '#d1d5db'
            }
          }}
          onMouseLeave={(e) => {
            if (estadoFiltro !== 'pendientes') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.color = '#6b7280'
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          Pendientes
          {cantidadPendientes > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
              }}
            >
              {cantidadPendientes}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {estadoFiltro === 'pendientes' ? (
        <div className="gc-fade-in">
          <PendientesPanel />
        </div>
      ) : (
        <>
          {loading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Cargando miembros...</p>
            </div>
          )}

          {error && (
            <div
              className="text-center py-12 rounded-xl"
              style={{
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.1)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="mx-auto mb-3">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && socios.length === 0 && (
            <div
              className="rounded-xl p-16 text-center gc-fade-in"
              style={{
                background: 'linear-gradient(145deg, #0D1117, #111827)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.12)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <p className="text-gray-300 font-medium mb-1">No hay miembros registrados</p>
              <p className="text-gray-600 text-sm">Haz click en "Nuevo Miembro" para agregar el primero</p>
            </div>
          )}

          {!loading && !error && socios.length > 0 && (
            <div className="space-y-2 gc-stagger-4">
              {socios.map(socio => (
                <SocioCard
                  key={socio.id} socio={socio}
                  estadoPago={getEstadoPago(socio)}
                  onEdit={handleEdit} onDeactivate={handleDeactivate}
                  onPay={handlePay} onDelete={handleDelete}
                  onVerMiembro={onVerMiembro}
                  onAccesoQR={handleAccesoQR}
                />
              ))}
            </div>
          )}
        </>
      )}

      {socioAEliminar && (
        <AdminConfirmModal onConfirm={confirmDelete} onCancel={() => setSocioAEliminar(null)} />
      )}

      {socioQR && (
        <GestionAccesoQR socio={socioQR} onClose={() => setSocioQR(null)} />
      )}
    </div>
  )
}