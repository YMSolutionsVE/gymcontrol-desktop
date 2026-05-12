import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'

const GlassPanel = ({ children, className = '' }) => (
  <div className={`bg-[#111827]/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-6 ${className}`}>{children}</div>
)

export default function Leaderboard() {
  const { gymId } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [atletas, setAtletas] = useState([])
  const [filtro, setFiltro] = useState('racha')

  const cargarLeaderboard = useCallback(async () => {
    if (!gymId) return
    setCargando(true)
    try {
      const { data, error } = await supabase.from('socios').select('id, nombre, racha_actual, avatar_url, cedula').eq('gym_id', gymId).eq('activo', true)
      if (error) throw error

      let ranking = [...data]
      if (filtro === 'asistencias') {
         const { data: asisData } = await supabase.from('asistencias').select('socio_id').eq('gym_id', gymId)
         const conteos = asisData.reduce((acc, curr) => { acc[curr.socio_id] = (acc[curr.socio_id] || 0) + 1; return acc; }, {})
         ranking = ranking.map(s => ({ ...s, totalAsistencias: conteos[s.id] || 0 }))
         ranking.sort((a, b) => b.totalAsistencias - a.totalAsistencias)
      } else {
         ranking.sort((a, b) => (b.racha_actual || 0) - (a.racha_actual || 0))
      }
      setAtletas(ranking.slice(0, 100))
    } catch (err) { console.error(err) } finally { setCargando(false) }
  }, [gymId, filtro])

  useEffect(() => { cargarLeaderboard() }, [cargarLeaderboard])

  const top3 = atletas.slice(0, 3)
  const resto = atletas.slice(3)

  return (
    <div className="p-8 max-w-[1200px] mx-auto relative z-10 text-white font-sans animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Salón de la Fama</h1>
          <p className="text-amber-400 font-bold uppercase tracking-widest text-[11px] mt-1">Ranking Global del Gimnasio</p>
        </div>
        <GlassPanel className="!p-2 flex gap-2">
          <button onClick={() => setFiltro('racha')} className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${filtro === 'racha' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🔥 Racha</button>
          <button onClick={() => setFiltro('asistencias')} className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${filtro === 'asistencias' ? 'bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>💪 Entrenos</button>
        </GlassPanel>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* PODIO TOP 3 */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-6 mb-16 mt-8 h-64">
              {top3[1] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8">
                  <div className="w-20 h-20 rounded-full border-4 border-gray-300 shadow-[0_0_20px_rgba(209,213,219,0.3)] mb-3 bg-black flex items-center justify-center font-black text-2xl overflow-hidden relative">
                    {top3[1].avatar_url ? <img src={top3[1].avatar_url} className="w-full h-full object-cover"/> : top3[1].nombre[0]}
                    <div className="absolute -bottom-1 bg-gray-300 text-black text-xs px-2 rounded-full font-black border border-black">2</div>
                  </div>
                  <GlassPanel className="!p-4 w-32 flex flex-col items-center justify-end border-t-4 border-t-gray-300" style={{ height: '120px' }}>
                    <p className="text-3xl font-black text-white">{filtro === 'racha' ? top3[1].racha_actual : top3[1].totalAsistencias}</p>
                    <p className="text-xs text-gray-400 font-bold truncate w-full text-center mt-1">{top3[1].nombre.split(' ')[0]}</p>
                  </GlassPanel>
                </div>
              )}
              {top3[0] && (
                <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-12">
                  <div className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)] mb-3 bg-black flex items-center justify-center font-black text-4xl overflow-hidden relative">
                    {top3[0].avatar_url ? <img src={top3[0].avatar_url} className="w-full h-full object-cover"/> : top3[0].nombre[0]}
                    <div className="absolute -bottom-1 bg-yellow-400 text-black text-xs px-3 rounded-full font-black border border-black">👑 1</div>
                  </div>
                  <GlassPanel className="!p-4 w-40 flex flex-col items-center justify-end border-t-4 border-t-yellow-400 bg-yellow-500/5" style={{ height: '160px' }}>
                    <p className="text-4xl font-black text-white drop-shadow-md">{filtro === 'racha' ? top3[0].racha_actual : top3[0].totalAsistencias}</p>
                    <p className="text-sm text-yellow-200 font-bold truncate w-full text-center mt-1">{top3[0].nombre.split(' ')[0]}</p>
                  </GlassPanel>
                </div>
              )}
              {top3[2] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-4">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.3)] mb-3 bg-black flex items-center justify-center font-black text-2xl overflow-hidden relative">
                    {top3[2].avatar_url ? <img src={top3[2].avatar_url} className="w-full h-full object-cover"/> : top3[2].nombre[0]}
                    <div className="absolute -bottom-1 bg-amber-700 text-white text-xs px-2 rounded-full font-black border border-black">3</div>
                  </div>
                  <GlassPanel className="!p-4 w-32 flex flex-col items-center justify-end border-t-4 border-t-amber-700" style={{ height: '100px' }}>
                    <p className="text-3xl font-black text-white">{filtro === 'racha' ? top3[2].racha_actual : top3[2].totalAsistencias}</p>
                    <p className="text-xs text-amber-500 font-bold truncate w-full text-center mt-1">{top3[2].nombre.split(' ')[0]}</p>
                  </GlassPanel>
                </div>
              )}
            </div>
          )}

          {/* LISTA RESTANTE */}
          <GlassPanel className="!p-0 overflow-hidden border-t-amber-500/30">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-black/40 border-b border-white/10">
                   <th className="p-4 pl-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-16">Pos</th>
                   <th className="p-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Atleta</th>
                   <th className="p-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right pr-8">{filtro === 'racha' ? 'Racha Actual' : 'Total Entrenos'}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {resto.map((atleta, idx) => (
                   <tr key={atleta.id} className="hover:bg-white/5 transition-colors">
                     <td className="p-4 pl-6 text-gray-500 font-black text-lg">{idx + 4}</td>
                     <td className="p-4 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0">
                         {atleta.avatar_url ? <img src={atleta.avatar_url} className="w-full h-full object-cover"/> : atleta.nombre[0]}
                       </div>
                       <div>
                         <p className="font-bold text-white text-[15px]">{atleta.nombre}</p>
                         <p className="text-gray-500 text-[11px] font-medium">C.I. {atleta.cedula}</p>
                       </div>
                     </td>
                     <td className="p-4 text-right pr-8">
                       <span className="inline-flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-1.5 rounded-xl">
                         <span className="text-[16px] font-black text-amber-400 tabular-nums">{filtro === 'racha' ? atleta.racha_actual || 0 : atleta.totalAsistencias || 0}</span>
                         <span className="text-xs">{filtro === 'racha' ? '🔥' : '🏋️'}</span>
                       </span>
                     </td>
                   </tr>
                 ))}
                 {atletas.length === 0 && <tr><td colSpan="3" className="p-10 text-center text-gray-500 font-medium">No hay suficientes datos.</td></tr>}
               </tbody>
             </table>
          </GlassPanel>
        </>
      )}
    </div>
  )
}
