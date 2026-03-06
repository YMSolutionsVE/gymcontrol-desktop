import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { getSocioById, updateSocio } from '../services/sociosService'
import { getPagosBySocio } from '../services/pagosService'
import { getNotas, createNota, deleteNota } from '../services/notasService'
import { supabase } from '../config/supabase'
import PagoForm from './PagoForm'
import SocioForm from './SocioForm'

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)

export default function MiembroDetalle({ socioId, onVolver }) {
  const { gymId, role, user } = useAuth()
  const { isAdmin } = useIsAdmin()
  const [socio, setSocio] = useState(null)
  const [pagos, setPagos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [notas, setNotas] = useState([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [savingNota, setSavingNota] = useState(false)
  const [view, setView] = useState('perfil')

  useEffect(() => {
    if (gymId) cargarDatos()
  }, [socioId, gymId])

  const cargarDatos = async () => {
    const socioRes = await getSocioById(gymId, socioId)
    if (socioRes.success) setSocio(socioRes.data)

    const pagosRes = await getPagosBySocio(gymId, socioId)
    if (pagosRes.success) setPagos(pagosRes.data)

    const { data } = await supabase
      .from('asistencias')
      .select('fecha_hora')
      .eq('gym_id', gymId)
      .eq('socio_id', socioId)
      .order('fecha_hora', { ascending: false })

    setAsistencias(data || [])

    const notasRes = await getNotas(gymId, socioId)
    if (notasRes.success) setNotas(notasRes.data)
  }

  const handleCrearNota = async () => {
    if (!nuevaNota.trim()) return
    setSavingNota(true)
    const registradoPor = role?.nombre || user?.email || 'Staff'
    const result = await createNota(gymId, socioId, nuevaNota, registradoPor)
    if (result.success) {
      setNuevaNota('')
      const notasRes = await getNotas(gymId, socioId)
      if (notasRes.success) setNotas(notasRes.data)
    }
    setSavingNota(false)
  }

  const handleEliminarNota = async (notaId) => {
    const result = await deleteNota(gymId, notaId)
    if (result.success) {
      setNotas(prev => prev.filter(n => n.id !== notaId))
    }
  }

  const handlePagoComplete = () => {
    setView('perfil')
    cargarDatos()
  }

  const handleEditSave = async (formData) => {
    const result = await updateSocio(gymId, socioId, formData)
    if (result.success) {
      setView('perfil')
      cargarDatos()
    } else {
      throw new Error(result.error)
    }
  }

  if (!socio) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (view === 'pago') {
    return <PagoForm socio={socio} onComplete={handlePagoComplete} onCancel={() => setView('perfil')} />
  }

  if (view === 'editar') {
    return <SocioForm socio={socio} onSave={handleEditSave} onCancel={() => setView('perfil')} />
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = socio.fecha_vencimiento
    ? new Date(socio.fecha_vencimiento + 'T00:00:00')
    : null

  const esPlanSesiones = socio.sesiones_total !== null && socio.sesiones_total !== undefined

  let estado = 'Sin plan'
  let estadoColor = { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', text: '#9ca3af' }

  if (esPlanSesiones) {
    if (!socio.sesiones_restantes || socio.sesiones_restantes <= 0) {
      estado = 'Sesiones agotadas'
      estadoColor = { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#f87171' }
    } else {
      estado = `${socio.sesiones_restantes}/${socio.sesiones_total} sesiones`
      estadoColor = { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa' }
    }
  } else if (vencimiento) {
    const dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
    if (dias < 0) {
      estado = 'Vencido'
      estadoColor = { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#f87171' }
    } else if (dias <= 3) {
      estado = 'Por vencer'
      estadoColor = { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#fbbf24' }
    } else {
      estado = 'Activo'
      estadoColor = { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', text: '#4ade80' }
    }
  }

  const infoFields = [
    { label: 'Cédula', value: socio.cedula },
    { label: 'Teléfono', value: socio.telefono || 'N/A' },
    { label: 'Plan actual', value: socio.plan_actual || '—' },
    esPlanSesiones
      ? { label: 'Sesiones restantes', value: `${socio.sesiones_restantes ?? 0} / ${socio.sesiones_total}` }
      : { label: 'Vence', value: socio.fecha_vencimiento || '—' },
    { label: 'Miembro desde', value: new Date(socio.created_at).toLocaleDateString() },
    { label: 'Total asistencias', value: asistencias.length },
    { label: 'Pagos realizados', value: pagos.length },
    { label: 'Última visita', value: asistencias[0] ? new Date(asistencias[0].fecha_hora).toLocaleDateString() : '—' },
  ]

  return (
    <div className="p-8 max-w-[1000px] gc-fade-in">

      {/* Back button */}
      <button
        onClick={onVolver}
        className="flex items-center gap-2 text-sm mb-6 transition-all duration-200"
        style={{ color: '#6b7280' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#60a5fa'
          e.currentTarget.style.transform = 'translateX(-3px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#6b7280'
          e.currentTarget.style.transform = 'translateX(0)'
        }}
      >
        <BackIcon />
        Volver a miembros
      </button>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa',
            }}
          >
            {socio.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{socio.nombre}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-lg"
                style={{
                  background: estadoColor.bg,
                  border: `1px solid ${estadoColor.border}`,
                  color: estadoColor.text,
                }}
              >
                {estado}
              </span>
              <span className="text-gray-600 text-xs">ID: {socio.cedula}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView('pago')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Registrar pago
          </button>
          <button
            onClick={() => setView('editar')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.15)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar datos
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div
        className="rounded-xl p-6 mb-6 gc-stagger-1"
        style={{
          background: 'linear-gradient(145deg, #0D1117, #111827)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Información</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {infoFields.map((field, i) => (
            <div key={i}>
              <p className="text-[11px] text-gray-600 uppercase tracking-wide mb-1">{field.label}</p>
              <p className="text-sm text-gray-200 font-medium">{field.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pagos */}
      <div
        className="rounded-xl p-6 mb-6 gc-stagger-2"
        style={{
          background: 'linear-gradient(145deg, #0D1117, #111827)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Historial de pagos
        </h2>
        {pagos.length === 0 ? (
          <p className="text-gray-600 text-sm py-4 text-center">Sin pagos registrados</p>
        ) : (
          <div className="space-y-1">
            {pagos.map((p, i) => (
              <div
                key={p.id}
                className="flex justify-between items-center py-3 px-3 rounded-lg transition-colors duration-150"
                style={{
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.15)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">{p.metodo || 'Pago'}</p>
                    <p className="text-[11px] text-gray-600">
                      {new Date(p.created_at).toLocaleDateString()}
                      {p.referencia && ` · Ref: ${p.referencia}`}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#34d399' }}>
                  ${p.monto_usd}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notas */}
      <div
        className="rounded-xl p-6 mb-6 gc-stagger-3"
        style={{
          background: 'linear-gradient(145deg, #0D1117, #111827)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Notas</h2>

        <div className="flex gap-2 mb-4">
          <textarea
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            placeholder="Agregar una nota..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCrearNota()
            }}
          />
          <button
            onClick={handleCrearNota}
            disabled={savingNota || !nuevaNota.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 self-start"
            style={{
              background: nuevaNota.trim() ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${nuevaNota.trim() ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
              color: nuevaNota.trim() ? '#60a5fa' : '#4b5563',
              cursor: nuevaNota.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {savingNota ? '...' : 'Agregar'}
          </button>
        </div>

        {notas.length === 0 ? (
          <p className="text-gray-600 text-sm py-4 text-center">Sin notas registradas</p>
        ) : (
          <div className="space-y-2">
            {notas.map((nota) => (
              <div
                key={nota.id}
                className="flex items-start gap-3 py-3 px-3 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.15)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{nota.nota}</p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    {new Date(nota.created_at).toLocaleDateString()} · {nota.registrado_por}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleEliminarNota(nota.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors duration-150 shrink-0"
                    title="Eliminar nota"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asistencias */}
      <div
        className="rounded-xl p-6 gc-stagger-3"
        style={{
          background: 'linear-gradient(145deg, #0D1117, #111827)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Asistencias recientes
        </h2>
        {asistencias.length === 0 ? (
          <p className="text-gray-600 text-sm py-4 text-center">Sin asistencias registradas</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {asistencias.slice(0, 20).map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                <span className="text-gray-400 text-xs">
                  {new Date(a.fecha_hora).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}