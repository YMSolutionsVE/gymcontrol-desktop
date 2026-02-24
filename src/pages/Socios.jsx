import React, { useState, useEffect, useCallback } from 'react'
import { useSocios } from '../hooks/useSocios'
import {
  createSocio, updateSocio, deactivateSocio, deleteSocio
} from '../services/sociosService'
import {
  getPendientesSinConfirmar, getPendientesHoy, getPagosPorFecha
} from '../services/pagosService'

import SearchBar from '../components/SearchBar'
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
  const { socios, loading, error, searchTerm, setSearchTerm, reload, setEstado } = useSocios()

  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [view, setView] = useState('list')
  const [editingSocio, setEditingSocio] = useState(null)
  const [payingSocio, setPayingSocio] = useState(null)
  const [message, setMessage] = useState(null)
  const [socioAEliminar, setSocioAEliminar] = useState(null)
  const [cantidadPendientes, setCantidadPendientes] = useState(0)
  const [pendientesPorSocio, setPendientesPorSocio] = useState(new Set())
  const [pagadosPorSocio, setPagadosPorSocio] = useState(new Set())

  // QR Access state
  const [socioQR, setSocioQR] = useState(null)

  const cargarEstadoPagos = useCallback(async () => {
    const fechaHoy = obtenerFechaLocal()
    const pendientesResult = await getPendientesHoy()
    if (pendientesResult.success) {
      const sinConfirmar = pendientesResult.data.filter(p => !p.confirmado)
      const confirmados = pendientesResult.data.filter(p => p.confirmado)
      setPendientesPorSocio(new Set(sinConfirmar.map(p => p.socio_id)))
      const pagadosSet = new Set(confirmados.map(p => p.socio_id))
      const pagosResult = await getPagosPorFecha(fechaHoy, fechaHoy)
      if (pagosResult.success) pagosResult.data.forEach(p => pagadosSet.add(p.socio_id))
      setPagadosPorSocio(pagadosSet)
    }
    const todosResult = await getPendientesSinConfirmar()
    if (todosResult.success) setCantidadPendientes(todosResult.data.filter(p => !p.confirmado).length)
  }, [])

  useEffect(() => {
    cargarEstadoPagos()
    const interval = setInterval(cargarEstadoPagos, 30000)
    return () => clearInterval(interval)
  }, [cargarEstadoPagos])

  useEffect(() => { if (socios.length > 0) cargarEstadoPagos() }, [socios, cargarEstadoPagos])

  const getEstadoPago = (socio) => {
    if (pendientesPorSocio.has(socio.id)) return 'pendiente'
    if (pagadosPorSocio.has(socio.id)) return 'pagado'
    if (socio.plan_actual === 'mensual' && socio.fecha_vencimiento) {
      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
      if (Math.ceil((vencimiento - hoy) / (1000*60*60*24)) > 1) return 'pagado'
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
    const result = await deactivateSocio(socio.id)
    if (result.success) { showMessage(`${socio.nombre} desactivado`); reload() }
    else showMessage(result.error, 'error')
  }
  const handleDelete = (socio) => setSocioAEliminar(socio)
  const confirmDelete = async () => {
    const result = await deleteSocio(socioAEliminar.id)
    if (result.success) { showMessage('Miembro eliminado'); setSocioAEliminar(null); reload() }
    else showMessage(result.error, 'error')
  }
  const handleSave = async (formData) => {
    let result = editingSocio ? await updateSocio(editingSocio.id, formData) : await createSocio(formData)
    if (result.success) { showMessage(editingSocio ? 'Miembro actualizado' : 'Miembro registrado'); setView('list'); reload(); cargarEstadoPagos() }
    else throw new Error(result.error)
  }
  const handlePagoComplete = () => { showMessage('Pago registrado'); setView('list'); reload(); cargarEstadoPagos() }
  const handleCancel = () => { setView('list'); setEditingSocio(null); setPayingSocio(null) }
  const handleFiltroChange = (filtroId) => {
    setEstadoFiltro(filtroId)
    if (filtroId !== 'pendientes') setEstado(filtroId)
  }

  if (view === 'form') return <SocioForm socio={editingSocio} onSave={handleSave} onCancel={handleCancel} />
  if (view === 'pago') return <PagoForm socio={payingSocio} onComplete={handlePagoComplete} onCancel={handleCancel} />

  const filtros = [
    { id: 'todos', label: 'Todos' },
    { id: 'activos', label: 'Activos' },
    { id: 'por_vencer', label: 'Por vencer' },
    { id: 'vencidos', label: 'Vencidos' },
  ]

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Miembros</h1>
          <p className="text-gray-500 text-sm mt-0.5">{socios.length} registrados</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Miembro
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2 ${
          message.type === 'error'
            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
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
        <div className="relative mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            className="w-full pl-11 pr-4 py-3 bg-[#0D1117] border border-white/[0.06] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 text-sm transition-all"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filtros.map(f => (
          <button
            key={f.id}
            onClick={() => handleFiltroChange(f.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              estadoFiltro === f.id
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}

        <button
          onClick={() => handleFiltroChange('pendientes')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
            estadoFiltro === 'pendientes'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
              : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-300'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          Pendientes
          {cantidadPendientes > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {cantidadPendientes}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {estadoFiltro === 'pendientes' ? (
        <PendientesPanel />
      ) : (
        <>
          {loading && (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Cargando miembros...</p>
            </div>
          )}
          {error && <p className="text-red-400 text-center py-8 text-sm">{error}</p>}
          {!loading && !error && socios.length === 0 && (
            <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-12 text-center">
              <p className="text-gray-500 mb-1">No hay miembros registrados</p>
              <p className="text-gray-600 text-sm">Haz click en "Nuevo Miembro" para agregar el primero</p>
            </div>
          )}
          <div className="space-y-2">
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
        </>
      )}

      {socioAEliminar && (
        <AdminConfirmModal onConfirm={confirmDelete} onCancel={() => setSocioAEliminar(null)} />
      )}

      {/* Modal Acceso QR */}
      {socioQR && (
        <GestionAccesoQR
          socio={socioQR}
          onClose={() => setSocioQR(null)}
        />
      )}
    </div>
  )
}