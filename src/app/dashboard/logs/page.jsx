'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getLogsAsistenciasAdmin } from '../../../services/asistenciasService'

export default function LogsAuditoriaPage() {
  const { gymId, loading } = useAuth()
  
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')

  const cargarLogs = useCallback(async () => {
    if (!gymId) return
    setCargando(true)
    
    // Rango del día seleccionado
    const inicio = new Date(fechaFiltro + 'T00:00:00')
    const fin = new Date(fechaFiltro + 'T23:59:59')
    
    const res = await getLogsAsistenciasAdmin(gymId, inicio.toISOString(), fin.toISOString())
    
    if (res.success) {
      // Detectar anomalías (mismo socio en menos de 60 mins)
      let procesados = res.data.map(log => ({ ...log, anomalia: false }))
      
      for (let i = 0; i < procesados.length - 1; i++) {
        for (let j = i + 1; j < procesados.length; j++) {
          if (procesados[i].socio_id === procesados[j].socio_id) {
            const diffMins = Math.abs(new Date(procesados[i].fecha_hora) - new Date(procesados[j].fecha_hora)) / 60000
            if (diffMins < 60) {
              procesados[i].anomalia = true
              procesados[j].anomalia = true
            }
          }
        }
      }
      setLogs(procesados)
    }
    setCargando(false)
  }, [gymId, fechaFiltro])

  useEffect(() => { if (!loading) cargarLogs() }, [loading, cargarLogs])

  const exportarCSV = () => {
    const cabeceras = ['Fecha y Hora', 'Atleta', 'Cédula', 'Tipo Registro', 'Anomalía']
    const filas = logs.map(l => [
      new Date(l.fecha_hora).toLocaleString('es-VE'),
      l.socios?.nombre || 'Desconocido',
      l.socios?.cedula || '-',
      l.tipo_registro,
      l.anomalia ? 'SI (Revisar)' : 'NO'
    ])
    
    const contenido = [cabeceras, ...filas].map(e => e.join(',')).join('\n')
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Auditoria_Asistencias_${fechaFiltro}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const logsFiltrados = logs.filter(l => 
    l.socios?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    l.socios?.cedula?.includes(busqueda)
  )

  if (loading) return <div className="p-8 text-white">Cargando administrador...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto text-gray-100 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Auditoría de Asistencias</h1>
          <p className="text-gray-400 mt-1">Monitorea los registros, anomalías y exporta para Andreina.</p>
        </div>
        <button 
          onClick={exportarCSV}
          disabled={logs.length === 0}
          className="bg-[#3B82F6] hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar CSV
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-[#1A1C23] p-5 rounded-2xl flex gap-4 mb-6 border border-white/5 shadow-lg">
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Buscar Atleta</label>
          <input 
            type="text" 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            placeholder="Nombre o cédula..." 
            className="w-full bg-[#0A0C10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors"
          />
        </div>
        <div className="w-48">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fecha del Log</label>
          <input 
            type="date" 
            value={fechaFiltro} 
            onChange={(e) => setFechaFiltro(e.target.value)} 
            className="w-full bg-[#0A0C10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Tabla Desktop */}
      <div className="bg-[#1A1C23] rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-gray-400">Consultando registros...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0C10] text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-white/5">Hora</th>
                <th className="p-4 font-bold border-b border-white/5">Atleta</th>
                <th className="p-4 font-bold border-b border-white/5">Tipo Registro</th>
                <th className="p-4 font-bold border-b border-white/5">Estado / Anomalía</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No hay logs para esta fecha.</td></tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${log.anomalia ? 'bg-red-500/5' : ''}`}>
                    <td className="p-4 text-sm whitespace-nowrap">
                      {new Date(log.fecha_hora).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <p className="text-white font-bold text-sm">{log.socios?.nombre || 'Socio Eliminado'}</p>
                      <p className="text-gray-500 text-xs">C.I. {log.socios?.cedula}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 bg-[#262A33] px-2.5 py-1 rounded-md text-xs font-medium text-gray-300">
                        {log.tipo_registro === 'manual_instructor' ? '📱 Por Instructor' : log.tipo_registro === 'entrada_rapida' ? '💻 Recepción' : '📷 Escáner QR'}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.anomalia ? (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-md">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Revisar (Marca Doble)
                        </span>
                      ) : (
                        <span className="text-green-400 text-xs font-bold">✓ Normal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
