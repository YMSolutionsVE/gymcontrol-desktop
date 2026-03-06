import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { registrarAsistencia, getAsistenciasHoy, getSociosParaAsistencia } from '../services/asistenciasService'
import StatusBadge from '../components/StatusBadge'

export default function Asistencias() {
  const { gymId } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [todosLosSocios, setTodosLosSocios] = useState([])
  const [sociosFiltrados, setSociosFiltrados] = useState([])
  const [asistenciasHoy, setAsistenciasHoy] = useState([])
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    if (!gymId) { setLoading(false); return }
    setLoading(true)
    try {
      const sociosResult = await getSociosParaAsistencia(gymId)
      if (sociosResult.success) {
        setTodosLosSocios(sociosResult.data)
        setSociosFiltrados(sociosResult.data)
      }
      const asistenciasResult = await getAsistenciasHoy(gymId)
      if (asistenciasResult.success) setAsistenciasHoy(asistenciasResult.data)
    } catch (err) {
      console.error('Asistencias.jsx: error inesperado en cargarDatos:', err)
    } finally {
      setLoading(false)
    }
  }, [gymId])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setSociosFiltrados(todosLosSocios.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || s.cedula.includes(searchTerm)
      ))
    } else {
      setSociosFiltrados(todosLosSocios)
    }
  }, [searchTerm, todosLosSocios])

  const handleRegistrar = async (socioId) => {
    setMessage(null)
    const result = await registrarAsistencia(gymId, socioId)
    if (result.success) {
      setMessage({ text: `Asistencia registrada: ${result.socio.nombre}`, type: 'success' })
      cargarDatos()
    } else {
      setMessage({ text: result.error, type: 'error' })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="p-8 max-w-[1000px]">
      {/* Header */}
      <div className="mb-6 gc-stagger-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Control de Asistencia</h1>
            <p className="text-gray-500 text-sm mt-0.5">{sociosFiltrados.length} miembro{sociosFiltrados.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Message */}
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
      <div className="relative mb-6 gc-stagger-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar miembro por nombre o cédula..."
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

      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando miembros...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Members list */}
          <div className="mb-8 gc-stagger-3">
            {sociosFiltrados.length === 0 && (
              <div
                className="rounded-xl p-12 text-center"
                style={{
                  background: 'linear-gradient(145deg, #0D1117, #111827)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" className="mx-auto mb-3">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-gray-500 text-sm">No se encontraron miembros</p>
              </div>
            )}

            <div className="space-y-2">
              {sociosFiltrados.map((socio, index) => {
                const esNuevo = socio.totalAsistencias === 0
                const yaMarcoHoy = socio.marcoHoy

                return (
                  <div key={socio.id}>
                    {/* Section separators */}
                    {index === 0 && esNuevo && (
                      <div className="flex items-center gap-3 mb-3 mt-1">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(167,139,250,0.7)' }}>Nuevos</span>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />
                      </div>
                    )}
                    {index > 0 && !esNuevo && sociosFiltrados[index - 1].totalAsistencias === 0 && (
                      <div className="flex items-center gap-3 mb-3 mt-4">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)' }} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(96,165,250,0.7)' }}>Registrados</span>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)' }} />
                      </div>
                    )}

                    <div
                      className="rounded-xl p-4 transition-all duration-200"
                      style={{
                        background: yaMarcoHoy
                          ? 'linear-gradient(145deg, rgba(16,185,129,0.04), rgba(16,185,129,0.02))'
                          : 'linear-gradient(145deg, #0D1117, #111827)',
                        border: `1px solid ${yaMarcoHoy ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!yaMarcoHoy) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                          e.currentTarget.style.transform = 'translateX(3px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!yaMarcoHoy) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                            style={{
                              background: yaMarcoHoy
                                ? 'rgba(16,185,129,0.1)'
                                : esNuevo
                                  ? 'rgba(139,92,246,0.1)'
                                  : 'rgba(59,130,246,0.1)',
                              border: `1px solid ${yaMarcoHoy
                                ? 'rgba(16,185,129,0.2)'
                                : esNuevo
                                  ? 'rgba(139,92,246,0.2)'
                                  : 'rgba(59,130,246,0.2)'}`,
                              color: yaMarcoHoy ? '#34d399' : esNuevo ? '#a78bfa' : '#60a5fa',
                            }}
                          >
                            {socio.nombre.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <p className="text-white font-semibold text-[15px] truncate">{socio.nombre}</p>
                              <StatusBadge
                                fechaVencimiento={socio.fecha_vencimiento}
                                sesionesTotal={socio.sesiones_total}
                                sesionesRestantes={socio.sesiones_restantes}
                              />
                              {esNuevo && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                  style={{
                                    background: 'rgba(139,92,246,0.08)',
                                    border: '1px solid rgba(139,92,246,0.15)',
                                    color: '#a78bfa',
                                  }}
                                >
                                  Nuevo
                                </span>
                              )}
                              {yaMarcoHoy && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
                                  style={{
                                    background: 'rgba(16,185,129,0.08)',
                                    border: '1px solid rgba(16,185,129,0.15)',
                                    color: '#34d399',
                                  }}
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  Marcó hoy
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm" style={{ color: '#6b7280' }}>
                              <span>CI: {socio.cedula}</span>
                              {!esNuevo && (
                                <span className="text-xs" style={{ color: '#4b5563' }}>
                                  {socio.totalAsistencias} asistencia{socio.totalAsistencias !== 1 ? 's' : ''}
                                </span>
                              )}
                              {socio.sesiones_total !== null && socio.sesiones_total !== undefined && (
                                <span className="text-xs font-medium" style={{
                                  color: socio.sesiones_restantes <= 0 ? '#f87171' : socio.sesiones_restantes <= 2 ? '#fbbf24' : '#60a5fa'
                                }}>
                                  {socio.sesiones_restantes}/{socio.sesiones_total} ses.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={yaMarcoHoy}
                          onClick={() => handleRegistrar(socio.id)}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shrink-0 ml-3"
                          style={yaMarcoHoy ? {
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: '#4b5563',
                            cursor: 'not-allowed',
                          } : {
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            color: '#34d399',
                          }}
                          onMouseEnter={(e) => {
                            if (!yaMarcoHoy) {
                              e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                              e.currentTarget.style.transform = 'translateY(-1px)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.15)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!yaMarcoHoy) {
                              e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = 'none'
                            }
                          }}
                        >
                          {yaMarcoHoy ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                              Ya marcó hoy
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                              Registrar entrada
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today's entries */}
          <div className="gc-stagger-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: '#4b5563' }}>
                Entradas de hoy ({asistenciasHoy.length})
              </span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
            </div>

            {asistenciasHoy.length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: '#374151' }}>No hay entradas registradas hoy</p>
            )}

            <div className="space-y-1.5">
              {asistenciasHoy.map((a, i) => (
                <div
                  key={a.id}
                  className="rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-150"
                  style={{
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold"
                      style={{
                        background: 'rgba(16,185,129,0.06)',
                        border: '1px solid rgba(16,185,129,0.12)',
                        color: '#34d399',
                      }}
                    >
                      {a.socios?.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>{a.socios?.nombre}</p>
                      <p className="text-xs" style={{ color: '#4b5563' }}>CI: {a.socios?.cedula}</p>
                    </div>
                  </div>
                  <p className="text-sm tabular-nums" style={{ color: '#6b7280' }}>
                    {new Date(a.fecha_hora).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}