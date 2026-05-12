import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase' 
import { useAuth } from '../context/AuthContext'

const GlassPanel = ({ children, className = '' }) => (
  <div className={`bg-[#111827]/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-6 ${className}`}>
    {children}
  </div>
)

export default function Auditoria() {
  const { gymId } = useAuth()
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')

  const cargarLogs = useCallback(async () => {
    if (!gymId) return
    setCargando(true)
    
    try {
      const inicio = new Date(fechaFiltro + 'T00:00:00').toISOString()
      const fin = new Date(fechaFiltro + 'T23:59:59').toISOString()
      
      const { data, error } = await supabase
        .from('logs_asistencias')
        .select(`id, fecha_hora, tipo_registro, socio_id, registrado_por, socios (nombre, cedula)`)
        .eq('gym_id', gymId)
        .gte('fecha_hora', inicio)
        .lte('fecha_hora', fin)
        .order('fecha_hora', { ascending: false })

      if (error) throw error

      const procesados = (data || []).map(log => ({ ...log, anomalia: false }))
      for (let i = 0; i < procesados.length - 1; i++) {
        for (let j = i + 1; j < procesados.length; j++) {
          if (procesados[i].socio_id && procesados[i].socio_id === procesados[j].socio_id) {
            const fecha1 = new Date(procesados[i].fecha_hora)
            const fecha2 = new Date(procesados[j].fecha_hora)
            if (!isNaN(fecha1) && !isNaN(fecha2)) {
              const diffMins = Math.abs(fecha1 - fecha2) / 60000
              if (diffMins < 60) { procesados[i].anomalia = true; procesados[j].anomalia = true }
            }
          }
        }
      }
      setLogs(procesados)
    } catch (err) {
      console.error('Error cargando auditoría:', err)
    } finally {
      setCargando(false)
    }
  }, [gymId, fechaFiltro])

  useEffect(() => { cargarLogs() }, [cargarLogs])

  const exportarCSV = () => {
    const cabeceras = ['Hora', 'Atleta', 'Cedula', 'Tipo Registro', 'Estado']
    const filas = logs.map(l => [
      new Date(l.fecha_hora).toLocaleString('es-VE'),
      l.socios?.nombre || 'Desconocido',
      l.socios?.cedula || '-',
      l.tipo_registro || 'NO ESPECIFICADO',
      l.anomalia ? 'ANOMALIA DOBLE MARCAJE' : 'NORMAL'
    ])
    const csvContent = [cabeceras, ...filas].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Auditoria_Asistencias_${fechaFiltro}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const logsFiltrados = logs.filter(l => 
    (l.socios?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (l.socios?.cedula || '').includes(busqueda)
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .desktop-cyber-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #050505; z-index: 0; pointer-events: none; }
        .cyber-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 50px 50px; mask-image: radial-gradient(circle at center, black 40%, transparent 100%); -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%); }
        .desktop-orb-1, .desktop-orb-2 { position: absolute; border-radius: 50%; mix-blend-mode: screen; filter: blur(100px); transition: transform 0.5s ease, opacity 0.5s ease; }
        .desktop-orb-1 { width: 45vw; height: 45vw; background: rgba(59,130,246,0.25); top: -10%; left: -5%; animation: float-1 20s infinite alternate ease-in-out; }
        .desktop-orb-2 { width: 40vw; height: 40vw; background: rgba(16,185,129,0.2); bottom: -10%; right: -5%; animation: float-2 25s infinite alternate ease-in-out; }
        @keyframes float-1 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(5vw, 5vh) scale(1.1); } }
        @keyframes float-2 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(-5vw, -5vh) scale(1.2); } }
      `}} />
      <div className="desktop-cyber-bg"><div className="cyber-grid"></div><div className="desktop-orb-1"></div><div className="desktop-orb-2"></div></div>

      <div className="p-8 max-w-[1400px] mx-auto min-h-screen relative z-10 text-white font-sans">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Auditoría y Logs</h1>
            <p className="text-gray-400 mt-1 font-medium">Libro mayor inmutable de accesos.</p>
          </div>
          <button onClick={exportarCSV} disabled={logs.length === 0} className="bg-gradient-to-r from-[#10B981] to-emerald-600 disabled:opacity-50 text-white font-black py-3 px-6 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar CSV
          </button>
        </div>

        <GlassPanel className="mb-6 flex gap-4 border-t-blue-500/30">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Buscar Atleta</label>
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre o cédula..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
          </div>
          <div className="w-48">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha</label>
            <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#3B82F6] outline-none transition-colors" />
          </div>
        </GlassPanel>

        <GlassPanel className="!p-0 overflow-hidden">
          {cargando ? (
            <div className="p-16 text-center"><div className="w-10 h-10 border-4 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10">
                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hora</th>
                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Atleta</th>
                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tipo Registro</th>
                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estado (Auditoría)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logsFiltrados.length === 0 ? (
                    <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-medium">No se encontraron registros en esta fecha.</td></tr>
                  ) : (
                    logsFiltrados.map((log) => (
                      <tr key={log.id} className={`hover:bg-white/5 transition-colors ${log.anomalia ? 'bg-red-500/10' : ''}`}>
                        <td className="p-5 text-sm font-bold text-gray-300">{new Date(log.fecha_hora).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td className="p-5">
                          <p className="text-white font-black text-[15px]">{log.socios?.nombre || 'Desconocido'}</p>
                          <p className="text-gray-500 text-xs font-medium tabular-nums">C.I. {log.socios?.cedula}</p>
                        </td>
                        <td className="p-5">
                          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 px-3 py-1 rounded-md text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                            {log.tipo_registro ? String(log.tipo_registro).replace(/_/g, ' ') : 'MANUAL'}
                          </span>
                        </td>
                        <td className="p-5">
                          {log.anomalia ? (
                            <span className="inline-flex items-center gap-1.5 text-red-400 text-[11px] font-black uppercase tracking-wider bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-md shadow-inner">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              Revisar Anulable
                            </span>
                          ) : (
                            <span className="text-[#10B981] text-[12px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </>
  )
}
