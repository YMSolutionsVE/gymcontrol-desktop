import React, { useState, useEffect } from 'react'
import { registrarAsistencia, getAsistenciasHoy, getSociosParaAsistencia } from '../services/asistenciasService'
import StatusBadge from '../components/StatusBadge'

export default function Asistencias() {
  const [searchTerm, setSearchTerm] = useState('')
  const [todosLosSocios, setTodosLosSocios] = useState([])
  const [sociosFiltrados, setSociosFiltrados] = useState([])
  const [asistenciasHoy, setAsistenciasHoy] = useState([])
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setSociosFiltrados(todosLosSocios.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || s.cedula.includes(searchTerm)
      ))
    } else {
      setSociosFiltrados(todosLosSocios)
    }
  }, [searchTerm, todosLosSocios])

  const cargarDatos = async () => {
    setLoading(true)
    const sociosResult = await getSociosParaAsistencia()
    if (sociosResult.success) { setTodosLosSocios(sociosResult.data); setSociosFiltrados(sociosResult.data) }
    const asistenciasResult = await getAsistenciasHoy()
    if (asistenciasResult.success) setAsistenciasHoy(asistenciasResult.data)
    setLoading(false)
  }

  const handleRegistrar = async (socioId) => {
    setMessage(null)
    const result = await registrarAsistencia(socioId)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Control de Asistencia</h1>
        <p className="text-gray-500 text-sm mt-0.5">{sociosFiltrados.length} miembros</p>
      </div>

      {/* Message */}
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
      <div className="relative mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar miembro por nombre o cédula..."
          className="w-full pl-11 pr-4 py-3 bg-[#0D1117] border border-white/[0.06] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm transition-all"
        />
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando miembros...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Members list */}
          <div className="mb-8">
            {sociosFiltrados.length === 0 && (
              <p className="text-gray-500 text-center py-8 text-sm">No se encontraron miembros</p>
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
                        <div className="h-px bg-violet-500/20 flex-1" />
                        <span className="text-violet-400/80 text-[10px] font-semibold uppercase tracking-[0.15em]">Nuevos</span>
                        <div className="h-px bg-violet-500/20 flex-1" />
                      </div>
                    )}
                    {index > 0 && !esNuevo && sociosFiltrados[index - 1].totalAsistencias === 0 && (
                      <div className="flex items-center gap-3 mb-3 mt-4">
                        <div className="h-px bg-blue-500/20 flex-1" />
                        <span className="text-blue-400/80 text-[10px] font-semibold uppercase tracking-[0.15em]">Registrados</span>
                        <div className="h-px bg-blue-500/20 flex-1" />
                      </div>
                    )}

                    <div className={`bg-[#0D1117] rounded-xl p-4 border transition-all duration-200 ${
                      yaMarcoHoy ? 'border-emerald-500/15 bg-emerald-500/[0.03]' : 'border-white/[0.06] hover:border-white/[0.1]'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-semibold text-[15px] truncate">{socio.nombre}</p>
                            <StatusBadge fechaVencimiento={socio.fecha_vencimiento} />
                            {esNuevo && (
                              <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                Nuevo
                              </span>
                            )}
                            {yaMarcoHoy && (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Marcó hoy
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>CI: {socio.cedula}</span>
                            {!esNuevo && (
                              <span className="text-gray-500 text-xs">{socio.totalAsistencias} asistencia{socio.totalAsistencias !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>

                        <button
                          disabled={yaMarcoHoy}
                          onClick={() => handleRegistrar(socio.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            yaMarcoHoy
                              ? 'bg-white/[0.04] text-gray-500 border border-white/[0.06] cursor-not-allowed'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          }`}
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
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-white/[0.06] flex-1" />
              <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-[0.15em]">
                Entradas de hoy ({asistenciasHoy.length})
              </span>
              <div className="h-px bg-white/[0.06] flex-1" />
            </div>

            {asistenciasHoy.length === 0 && (
              <p className="text-gray-600 text-center py-4 text-sm">No hay entradas registradas hoy</p>
            )}

            <div className="space-y-1.5">
              {asistenciasHoy.map(a => (
                <div key={a.id} className="bg-white/[0.02] rounded-lg px-4 py-2.5 border border-white/[0.04] flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm font-medium">{a.socios?.nombre}</p>
                    <p className="text-gray-600 text-xs">CI: {a.socios?.cedula}</p>
                  </div>
                  <p className="text-gray-500 text-sm tabular-nums">
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