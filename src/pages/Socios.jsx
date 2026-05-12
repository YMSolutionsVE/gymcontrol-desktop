import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocios } from '../hooks/useSocios'
import { createSocio, updateSocio, deactivateSocio, deleteSocio } from '../services/sociosService'
import { getPendientesSinConfirmar, getPendientesHoy, getPagosPorFecha } from '../services/pagosService'
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

const GlassPanel = ({ children, className = '' }) => (
  <div className={`bg-[#111827]/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-6 ${className}`}>{children}</div>
)

export default function Socios({ onVerMiembro }) {
  const { gymId } = useAuth()
  const { socios, loading, error, searchTerm, setSearchTerm, reload, setEstado } = useSocios(gymId)
  
  useEffect(() => { setEstado('todos') }, [setEstado])

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
    if (socio.sesiones_total !== null && socio.sesiones_total !== undefined) return socio.sesiones_restantes > 0 ? 'pagado' : 'sin_pago'
    if (socio.fecha_vencimiento) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      const vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
      if (Math.ceil((vencimiento - hoy) / 86400000) > 0) return 'pagado'
    }
    return 'sin_pago'
  }

  // 🔥 EL BUG ESTABA AQUÍ: Lógica de Fechas exacta para los filtros
  const calcularEstadoFiltro = useCallback((s) => {
    if (!s.activo) return 'inactivos'
    if (s.sesiones_total !== null && s.sesiones_total !== undefined) {
      if (!s.sesiones_restantes || s.sesiones_restantes <= 0) return 'vencidos'
      if (s.sesiones_restantes <= 2) return 'por_vencer'
      return 'activos'
    }
    // 🔥 Si no tiene plan (Sin plan), lo metemos directo a "Vencidos" para que aparezca en el filtro
    if (!s.fecha_vencimiento) return 'vencidos' 
    
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const v = new Date(s.fecha_vencimiento + 'T00:00:00')
    const d = Math.ceil((v - hoy) / 86400000)
    if (d < 0) return 'vencidos'
    if (d <= 3) return 'por_vencer'
    return 'activos'
  }, [])

  const sociosFiltrados = useMemo(() => {
    return socios.filter(s => {
      if (estadoFiltro === 'todos') return s.activo
      if (estadoFiltro === 'inactivos') return !s.activo
      if (!s.activo) return false 
      return calcularEstadoFiltro(s) === estadoFiltro
    }).filter(s => {
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      return s.nombre.toLowerCase().includes(term) || s.cedula.includes(term)
    })
  }, [socios, estadoFiltro, searchTerm, calcularEstadoFiltro])

  const contadores = useMemo(() => {
    const counts = { todos: 0, activos: 0, vencidos: 0, por_vencer: 0, inactivos: 0 }
    socios.forEach(s => {
      if (!s.activo) { counts.inactivos++; return }
      counts.todos++
      const est = calcularEstadoFiltro(s)
      if (counts[est] !== undefined) counts[est]++
    })
    return counts
  }, [socios, calcularEstadoFiltro])

  const showMessage = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage(null), 3000) }

  const handleNew = () => { setEditingSocio(null); setView('form') }
  const handleEdit = (socio) => { setEditingSocio(socio); setView('form') }
  const handlePay = (socio) => { setPayingSocio(socio); setView('pago') }
  const handleAccesoQR = (socio) => { setSocioQR(socio) }
  const handleDeactivate = async (socio) => {
    if (!window.confirm(`¿Desactivar a ${socio.nombre}?`)) return
    const result = await deactivateSocio(gymId, socio.id)
    if (result.success) { showMessage(`${socio.nombre} desactivado`); reload() } else showMessage(result.error, 'error')
  }
  const handleDelete = (socio) => setSocioAEliminar(socio)
  const confirmDelete = async () => {
    const result = await deleteSocio(gymId, socioAEliminar.id)
    if (result.success) { showMessage('Miembro eliminado'); setSocioAEliminar(null); reload() } else showMessage(result.error, 'error')
  }
  const handleSave = async (formData) => {
    let result = editingSocio ? await updateSocio(gymId, editingSocio.id, formData) : await createSocio(gymId, formData)
    if (result.success) { showMessage(editingSocio ? 'Miembro actualizado' : 'Miembro registrado'); setView('list'); reload(); cargarEstadoPagos() } else throw new Error(result.error)
  }
  const handlePagoComplete = () => { showMessage('Pago registrado'); setView('list'); reload(); cargarEstadoPagos() }
  const handleCancel = () => { setView('list'); setEditingSocio(null); setPayingSocio(null) }

  if (view === 'form') return <div className="p-8 max-w-[800px] animate-in fade-in"><SocioForm socio={editingSocio} onSave={handleSave} onCancel={handleCancel} /></div>
  if (view === 'pago') return <div className="p-8 max-w-[800px] animate-in fade-in"><PagoForm socio={payingSocio} onComplete={handlePagoComplete} onCancel={handleCancel} /></div>

  const filtrosUI = [
    { id: 'todos', label: 'Directorio', color: 'blue' },
    { id: 'activos', label: 'Al Día', color: 'emerald' },
    { id: 'por_vencer', label: 'Por vencer', color: 'amber' },
    { id: 'vencidos', label: 'Vencidos', color: 'red' },
    { id: 'inactivos', label: 'Inactivos', color: 'gray' },
  ]

  const filtroColors = {
    blue: { active: 'bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]', inactive: 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10' },
    emerald: { active: 'bg-[#10B981] text-[#050505] shadow-[0_0_15px_rgba(16,185,129,0.4)]', inactive: 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10' },
    amber: { active: 'bg-amber-500 text-[#050505] shadow-[0_0_15px_rgba(245,158,11,0.4)]', inactive: 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10' },
    red: { active: 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]', inactive: 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10' },
    gray: { active: 'bg-gray-500 text-white shadow-[0_0_15px_rgba(107,114,128,0.4)]', inactive: 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10' }
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto relative z-10 text-white font-sans animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Miembros</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">{sociosFiltrados.length} listados de {contadores.todos}</p>
        </div>
        <button onClick={handleNew} className="bg-gradient-to-r from-[#3B82F6] to-blue-600 hover:to-blue-500 text-white font-black py-3 px-6 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-95">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Inscribir Atleta
        </button>
      </div>

      {message && (
        <div className={`px-5 py-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 glassmorphism animate-in slide-in-from-top-4 ${message.type === 'error' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{message.type === 'error' ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}</svg>
          {message.text}
        </div>
      )}

      {estadoFiltro !== 'pendientes' && (
        <GlassPanel className="!p-4 mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar atleta por nombre o cédula..." className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] text-sm transition-colors" />
          </div>
        </GlassPanel>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {filtrosUI.map(f => {
          const isActive = estadoFiltro === f.id
          const colors = filtroColors[f.color]
          return (
            <button key={f.id} onClick={() => setEstadoFiltro(f.id)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-white/5 ${isActive ? colors.active : colors.inactive}`}>
              {f.label} <span className="ml-1 opacity-70">({contadores[f.id]})</span>
            </button>
          )
        })}
        <div className="w-px h-10 bg-white/10 mx-1" />
        <button onClick={() => setEstadoFiltro('pendientes')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${estadoFiltro === 'pendientes' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] border-amber-500' : 'bg-black/40 text-amber-500 hover:bg-amber-500/10 border-amber-500/30'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Deudores
          {cantidadPendientes > 0 && <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md ml-1">{cantidadPendientes}</span>}
        </button>
      </div>

      {estadoFiltro === 'pendientes' ? (
        <div className="animate-in fade-in"><PendientesPanel /></div>
      ) : (
        <>
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin" /></div>
          ) : error ? (
            <GlassPanel className="text-center py-12 border-red-500/30 bg-red-500/10"><p className="text-red-400 font-bold">{error}</p></GlassPanel>
          ) : sociosFiltrados.length === 0 ? (
            <GlassPanel className="text-center py-20 border-white/5"><p className="text-gray-500 font-medium">No se encontraron resultados para el filtro aplicado.</p></GlassPanel>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sociosFiltrados.map(socio => (
                <SocioCard key={socio.id} socio={socio} estadoPago={getEstadoPago(socio)} onEdit={handleEdit} onDeactivate={handleDeactivate} onPay={handlePay} onDelete={handleDelete} onVerMiembro={onVerMiembro} onAccesoQR={handleAccesoQR} />
              ))}
            </div>
          )}
        </>
      )}

      {socioAEliminar && <AdminConfirmModal onConfirm={confirmDelete} onCancel={() => setSocioAEliminar(null)} />}
      {socioQR && <GestionAccesoQR socio={socioQR} onClose={() => setSocioQR(null)} />}
    </div>
  )
}
