import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { registrarAsistencia, getAsistenciasHoy, getSociosParaAsistencia, eliminarAsistencia, registrarAsistenciaRetroactiva, eliminarAsistenciaPorFecha, getAsistenciasPorMes } from '../services/asistenciasService'
import StatusBadge from '../components/StatusBadge'
import AdminConfirmModal from '../components/AdminConfirmModal'

// --- Calendario retroactivo ---
function CalendarioRetroactivo({ gymId, socio, onClose, onUpdate }) {
  var hoy = new Date()
  var [year, setYear] = useState(hoy.getFullYear())
  var [month, setMonth] = useState(hoy.getMonth())
  var [diasMarcados, setDiasMarcados] = useState(new Set())
  var [cargando, setCargando] = useState(true)
  var [procesando, setProcesando] = useState(null)

  var cargarMes = useCallback(async function () {
    setCargando(true)
    var result = await getAsistenciasPorMes(gymId, socio.id, year, month)
    if (result.success) setDiasMarcados(result.data)
    setCargando(false)
  }, [gymId, socio.id, year, month])

  useEffect(function () { cargarMes() }, [cargarMes])

  var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  var diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

  var primerDia = new Date(year, month, 1)
  var ultimoDia = new Date(year, month + 1, 0)
  var inicioSemana = primerDia.getDay() - 1
  if (inicioSemana < 0) inicioSemana = 6

  var diasEnMes = ultimoDia.getDate()
  var fechaHoyStr = hoy.toISOString().split('T')[0]

  var handleToggleDia = async function (dia) {
    var fecha = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
    if (fecha > fechaHoyStr) return

    setProcesando(dia)

    if (diasMarcados.has(fecha)) {
      var result = await eliminarAsistenciaPorFecha(gymId, socio.id, fecha)
      if (result.success) {
        setDiasMarcados(function (prev) {
          var next = new Set(prev)
          next.delete(fecha)
          return next
        })
      }
    } else {
      var result2 = await registrarAsistenciaRetroactiva(gymId, socio.id, fecha)
      if (result2.success) {
        setDiasMarcados(function (prev) { return new Set([].concat(Array.from(prev), [fecha])) })
      }
    }

    setProcesando(null)
    if (onUpdate) onUpdate()
  }

  var mesAnterior = function () {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }

  var mesSiguiente = function () {
    var limiteYear = hoy.getFullYear()
    var limiteMonth = hoy.getMonth()
    if (year > limiteYear || (year === limiteYear && month >= limiteMonth)) return
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  var puedeSiguiente = year < hoy.getFullYear() || (year === hoy.getFullYear() && month < hoy.getMonth())

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0D1117, #111827)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          animation: 'gcFadeInUp 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Marcar asistencias</h3>
                <p className="text-gray-500 text-xs mt-0.5">{socio.nombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="transition-colors duration-150"
              style={{ color: '#6b7280' }}
              onMouseEnter={function (e) { e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={function (e) { e.currentTarget.style.color = '#6b7280' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* Navegacion mes */}
        <div className="flex items-center justify-between px-6 pb-3">
          <button
            onClick={mesAnterior}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: '#9ca3af' }}
            onMouseEnter={function (e) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-white font-semibold text-sm">{meses[month] + ' ' + year}</span>
          <button
            onClick={mesSiguiente}
            disabled={!puedeSiguiente}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: puedeSiguiente ? '#9ca3af' : '#374151', cursor: puedeSiguiente ? 'pointer' : 'not-allowed' }}
            onMouseEnter={function (e) { if (puedeSiguiente) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ffffff' } }}
            onMouseLeave={function (e) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = puedeSiguiente ? '#9ca3af' : '#374151' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Calendario */}
        <div className="px-6 pb-5">
          {cargando ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {diasSemana.map(function (d) {
                  return <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: '#4b5563' }}>{d}</div>
                })}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: inicioSemana }).map(function (_, i) {
                  return <div key={'empty-' + i} />
                })}
                {Array.from({ length: diasEnMes }).map(function (_, i) {
                  var dia = i + 1
                  var fecha = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
                  var marcado = diasMarcados.has(fecha)
                  var esFuturo = fecha > fechaHoyStr
                  var esHoy = fecha === fechaHoyStr
                  var esProcesando = procesando === dia

                  var baseStyle = {
                    cursor: esFuturo ? 'not-allowed' : 'pointer',
                    background: marcado ? 'rgba(16,185,129,0.15)' : esHoy ? 'rgba(59,130,246,0.08)' : 'transparent',
                    border: '1px solid ' + (marcado ? 'rgba(16,185,129,0.3)' : esHoy ? 'rgba(59,130,246,0.2)' : 'transparent'),
                    color: esFuturo ? '#374151' : marcado ? '#34d399' : esHoy ? '#60a5fa' : '#9ca3af',
                  }

                  return (
                    <button
                      key={dia}
                      disabled={esFuturo || esProcesando}
                      onClick={function () { handleToggleDia(dia) }}
                      className="aspect-square rounded-lg text-xs font-medium transition-all duration-150 flex items-center justify-center relative"
                      style={baseStyle}
                      onMouseEnter={function (e) {
                        if (!esFuturo && !marcado) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                        }
                      }}
                      onMouseLeave={function (e) {
                        e.currentTarget.style.background = baseStyle.background
                        e.currentTarget.style.borderColor = baseStyle.border.replace('1px solid ', '')
                      }}
                    >
                      {esProcesando ? (
                        <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      ) : (
                        <>
                          {dia}
                          {marcado && (
                            <div className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ background: '#34d399' }} />
                          )}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs" style={{ color: '#6b7280' }}>
            {diasMarcados.size + ' asistencia' + (diasMarcados.size !== 1 ? 's' : '') + ' en ' + meses[month].toLowerCase()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}
            onMouseEnter={function (e) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={function (e) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Asistencias() {
  var { gymId } = useAuth()

  var [searchTerm, setSearchTerm] = useState('')
  var [todosLosSocios, setTodosLosSocios] = useState([])
  var [sociosFiltrados, setSociosFiltrados] = useState([])
  var [asistenciasHoy, setAsistenciasHoy] = useState([])
  var [message, setMessage] = useState(null)
  var [loading, setLoading] = useState(true)

  // Estado para desmarcar asistencia (requiere admin)
  var [showAdminModal, setShowAdminModal] = useState(false)
  var [asistenciaAEliminar, setAsistenciaAEliminar] = useState(null)

  // Calendario retroactivo
  var [socioCalendario, setSocioCalendario] = useState(null)

  var cargarDatos = useCallback(async function () {
    if (!gymId) { setLoading(false); return }
    setLoading(true)
    try {
      var sociosResult = await getSociosParaAsistencia(gymId)
      if (sociosResult.success) {
        setTodosLosSocios(sociosResult.data)
        setSociosFiltrados(sociosResult.data)
      }
      var asistenciasResult = await getAsistenciasHoy(gymId)
      if (asistenciasResult.success) setAsistenciasHoy(asistenciasResult.data)
    } catch (err) {
      console.error('Asistencias.jsx: error inesperado en cargarDatos:', err)
    } finally {
      setLoading(false)
    }
  }, [gymId])

  useEffect(function () { cargarDatos() }, [cargarDatos])

  useEffect(function () {
    if (searchTerm.trim().length >= 2) {
      setSociosFiltrados(todosLosSocios.filter(function (s) {
        return s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || s.cedula.includes(searchTerm)
      }))
    } else {
      setSociosFiltrados(todosLosSocios)
    }
  }, [searchTerm, todosLosSocios])

  var mostrarMensaje = function (text, type) {
    setMessage({ text: text, type: type })
    setTimeout(function () { setMessage(null) }, 4000)
  }

  // Helper para detectar si un socio necesita pago
  var socioNecesitaPago = function (socio) {
    if (socio.es_cortesia) return false
    if (socio.sesiones_total !== null && socio.sesiones_total !== undefined) {
      return !socio.sesiones_restantes || socio.sesiones_restantes <= 0
    }
    if (!socio.fecha_vencimiento) return true
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    var vencimiento = new Date(socio.fecha_vencimiento + 'T00:00:00')
    return vencimiento < hoy
  }

  // --- Registrar asistencia (sin bloqueo por pago) ---
  var handleRegistrar = async function (socioId) {
    setMessage(null)
    var result = await registrarAsistencia(gymId, socioId)

    if (result.success) {
      if (result.conPendiente) {
        mostrarMensaje('Asistencia registrada — ' + result.socio.nombre + ' tiene pago pendiente', 'warning')
      } else {
        mostrarMensaje('Asistencia registrada: ' + result.socio.nombre, 'success')
      }
      cargarDatos()
    } else {
      mostrarMensaje(result.error, 'error')
    }
  }

  var handleIniciarDesmarcar = function (asistencia) {
    setAsistenciaAEliminar(asistencia)
    setShowAdminModal(true)
  }

  var handleConfirmarDesmarcar = async function () {
    setShowAdminModal(false)
    if (!asistenciaAEliminar) return

    var result = await eliminarAsistencia(gymId, asistenciaAEliminar.id, asistenciaAEliminar.socio_id)

    if (result.success) {
      mostrarMensaje('Asistencia desmarcada: ' + (asistenciaAEliminar.socios ? asistenciaAEliminar.socios.nombre : 'Miembro'), 'success')
      cargarDatos()
    } else {
      mostrarMensaje(result.error, 'error')
    }

    setAsistenciaAEliminar(null)
  }

  var handleCancelarDesmarcar = function () {
    setShowAdminModal(false)
    setAsistenciaAEliminar(null)
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
            <p className="text-gray-500 text-sm mt-0.5">{sociosFiltrados.length + ' miembro' + (sociosFiltrados.length !== 1 ? 's' : '')}</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2"
          style={{
            background: message.type === 'error'
              ? 'rgba(239,68,68,0.06)'
              : message.type === 'warning'
                ? 'rgba(234,179,8,0.06)'
                : 'rgba(16,185,129,0.06)',
            border: '1px solid ' + (message.type === 'error'
              ? 'rgba(239,68,68,0.15)'
              : message.type === 'warning'
                ? 'rgba(234,179,8,0.15)'
                : 'rgba(16,185,129,0.15)'),
            color: message.type === 'error'
              ? '#f87171'
              : message.type === 'warning'
                ? '#facc15'
                : '#34d399',
            animation: 'gcFadeInUp 0.3s ease-out',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {message.type === 'error'
              ? <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
              : message.type === 'warning'
                ? <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
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
          type="text" value={searchTerm} onChange={function (e) { setSearchTerm(e.target.value) }}
          placeholder="Buscar miembro por nombre o cedula..."
          className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm transition-all duration-200 focus:outline-none"
          style={{
            background: 'linear-gradient(145deg, #0D1117, #111827)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={function (e) {
            e.target.style.borderColor = 'rgba(59,130,246,0.3)'
            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
          }}
          onBlur={function (e) {
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
              {sociosFiltrados.map(function (socio, index) {
                var esNuevo = socio.totalAsistencias === 0
                var yaMarcoHoy = socio.marcoHoy
                var necesitaPago = socioNecesitaPago(socio)

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
                        border: '1px solid ' + (yaMarcoHoy ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)'),
                      }}
                      onMouseEnter={function (e) {
                        if (!yaMarcoHoy) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                          e.currentTarget.style.transform = 'translateX(3px)'
                        }
                      }}
                      onMouseLeave={function (e) {
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
                              border: '1px solid ' + (yaMarcoHoy
                                ? 'rgba(16,185,129,0.2)'
                                : esNuevo
                                  ? 'rgba(139,92,246,0.2)'
                                  : 'rgba(59,130,246,0.2)'),
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
                                  Marco hoy
                                </span>
                              )}
                              {/* Indicador sutil de pago pendiente */}
                              {necesitaPago && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
                                  style={{
                                    background: 'rgba(234,179,8,0.06)',
                                    border: '1px solid rgba(234,179,8,0.12)',
                                    color: 'rgba(251,191,36,0.7)',
                                  }}
                                >
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                  Pago pendiente
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm" style={{ color: '#6b7280' }}>
                              <span>{'CI: ' + socio.cedula}</span>
                              {!esNuevo && (
                                <span className="text-xs" style={{ color: '#4b5563' }}>
                                  {socio.totalAsistencias + ' asistencia' + (socio.totalAsistencias !== 1 ? 's' : '')}
                                </span>
                              )}
                              {socio.sesiones_total !== null && socio.sesiones_total !== undefined && (
                                <span className="text-xs font-medium" style={{
                                  color: socio.sesiones_restantes <= 0 ? '#f87171' : socio.sesiones_restantes <= 2 ? '#fbbf24' : '#60a5fa'
                                }}>
                                  {socio.sesiones_restantes + '/' + socio.sesiones_total + ' ses.'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {/* Boton calendario retroactivo */}
                          <button
                            onClick={function () { setSocioCalendario(socio) }}
                            className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                            style={{
                              background: 'rgba(59,130,246,0.06)',
                              border: '1px solid rgba(59,130,246,0.15)',
                              color: '#60a5fa',
                            }}
                            title="Marcar asistencias pasadas"
                            onMouseEnter={function (e) {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.12)'
                              e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={function (e) {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.06)'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </button>

                          {/* Boton registrar entrada */}
                          <button
                            disabled={yaMarcoHoy}
                            onClick={function () { handleRegistrar(socio.id) }}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
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
                            onMouseEnter={function (e) {
                              if (!yaMarcoHoy) {
                                e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.15)'
                              }
                            }}
                            onMouseLeave={function (e) {
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
                                Ya marco hoy
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
                {'Entradas de hoy (' + asistenciasHoy.length + ')'}
              </span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
            </div>

            {asistenciasHoy.length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: '#374151' }}>No hay entradas registradas hoy</p>
            )}

            <div className="space-y-1.5">
              {asistenciasHoy.map(function (a, i) {
                return (
                  <div
                    key={a.id}
                    className="rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-150 group"
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
                        {a.socios && a.socios.nombre ? a.socios.nombre.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>{a.socios ? a.socios.nombre : ''}</p>
                        <p className="text-xs" style={{ color: '#4b5563' }}>{'CI: ' + (a.socios ? a.socios.cedula : '')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-sm tabular-nums" style={{ color: '#6b7280' }}>
                        {new Date(a.fecha_hora).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {/* Boton desmarcar */}
                      <button
                        onClick={function () { handleIniciarDesmarcar(a) }}
                        className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
                        style={{
                          background: 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.12)',
                          color: '#f87171',
                        }}
                        onMouseEnter={function (e) {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
                          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                        }}
                        onMouseLeave={function (e) {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
                          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.12)'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Desmarcar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Modal Admin para desmarcar asistencia */}
      {showAdminModal && (
        <AdminConfirmModal
          titulo="Desmarcar asistencia"
          descripcion={'Se eliminara la entrada de ' + (asistenciaAEliminar && asistenciaAEliminar.socios ? asistenciaAEliminar.socios.nombre : 'este miembro') + ' de hoy. Si es plan por sesiones, se devolvera la sesion.'}
          textoConfirmar="Desmarcar entrada"
          colorConfirmar="yellow"
          onConfirm={handleConfirmarDesmarcar}
          onCancel={handleCancelarDesmarcar}
        />
      )}

      {/* Calendario retroactivo */}
      {socioCalendario && (
        <CalendarioRetroactivo
          gymId={gymId}
          socio={socioCalendario}
          onClose={function () { setSocioCalendario(null) }}
          onUpdate={cargarDatos}
        />
      )}
    </div>
  )
}
