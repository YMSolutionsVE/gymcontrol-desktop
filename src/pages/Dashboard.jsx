import React, { useState, useEffect, useCallback } from 'react'
import { getDashboardStats } from '../services/dashboardService'
import { obtenerConfigCierreAuto, obtenerResumenHoy, cerrarDia } from '../services/cierreCajaService'
import { useConfig } from '../hooks/useConfig'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import { formatMoney } from '../lib/currencyUtils'
import { supabase } from '../config/supabase' 

const getSaludo = () => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const getFechaHoy = () => {
  return new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Caracas' })
}

function buildIngresosCards(stats, label) {
  const desglose = stats[label] || {}
  const bs = label === 'desgloseHoy' ? stats.ingresosHoyBs : stats.ingresosMesBs
  const cards = []
  if ((desglose.USD || 0) > 0) cards.push({ moneda: 'USD', titulo: 'Dólares', valor: '$' + formatMoney(desglose.USD), color: 'green' })
  if ((desglose.EUR || 0) > 0) cards.push({ moneda: 'EUR', titulo: 'Euros', valor: '€' + formatMoney(desglose.EUR), color: 'blue' })
  cards.push({ moneda: 'Bs', titulo: 'Bolívares', valor: 'Bs. ' + formatMoney(bs || 0), color: 'green' })
  return cards
}

function getGridCols(count) {
  if (count === 1) return 'md:grid-cols-1'
  if (count === 2) return 'md:grid-cols-2'
  return 'md:grid-cols-3'
}

const GlassPanel = ({ children, className = '' }) => (
  <div className={`bg-[#111827]/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-6 ${className}`}>{children}</div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [actividadReciente, setActividadReciente] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { config } = useConfig()
  const { gymId, user } = useAuth()
  const [pulsing, setPulsing] = useState(false)

  // CENTINELA SILENCIOSO PARA CIERRE DE CAJA AUTOMÁTICO
  useEffect(() => {
    if (!gymId || !user) return;

    const centinelaCierre = async () => {
      try {
        const configAuto = await obtenerConfigCierreAuto(gymId);
        if (!configAuto || !configAuto.cierre_auto_activo) return;

        const ahora = new Date();
        const horaLocal = ahora.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas' });
        const horaCierre = configAuto.cierre_auto_hora ? configAuto.cierre_auto_hora.substring(0, 5) : '22:00';

        if (horaLocal >= horaCierre) {
          const resumen = await obtenerResumenHoy(gymId);
          if (resumen) {
            // El backend ya protege contra duplicados si el cierre existe
            await cerrarDia(user.id, resumen, gymId);
          }
        }
      } catch (err) {
        console.error("Error silencioso en Centinela de Cierre:", err);
      }
    };

    // Revisión inmediata al cargar (Para el admin que cerró tarde o madrugó)
    centinelaCierre();

    // El centinela se queda dando rondas cada 60 segundos
    const intervalo = setInterval(centinelaCierre, 60000);
    return () => clearInterval(intervalo);
  }, [gymId, user]);

  const loadStats = useCallback(async () => {
    if (!gymId) { setLoading(false); return }
    setError(null)
    try {
      const result = await getDashboardStats(gymId)
      if (result.success) setStats(result.data); else setError(result.error)
    } catch (err) { setError(err.message) }
  }, [gymId])

  const loadActividad = useCallback(async () => {
    if (!gymId) return
    try {
      const hoy = new Date(); hoy.setHours(0,0,0,0)
      const { data, error } = await supabase.from('asistencias').select('id, fecha_hora, socios(nombre, cedula)').eq('gym_id', gymId).gte('fecha_hora', hoy.toISOString()).order('fecha_hora', { ascending: false }).limit(8)
      if (!error && data) setActividadReciente(data)
    } catch (err) { console.error(err) }
  }, [gymId])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadStats(), loadActividad()]).then(() => setLoading(false))
    if (!gymId) return
    const channel = supabase.channel('realtime_dashboard').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'asistencias', filter: `gym_id=eq.${gymId}` }, () => {
        setPulsing(true); setTimeout(() => setPulsing(false), 800)
        loadActividad(); loadStats()
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [gymId, loadStats, loadActividad])

  if (loading) return <div className="p-8 flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin mx-auto" /></div>
  if (error) return <div className="p-8 flex items-center justify-center h-full"><p className="text-red-400">{error}</p></div>
  if (!stats) return null

  const tasaBcv = Number(config?.tasa_bcv) || 0
  const tasaEur = Number(config?.tasa_eur) || 0
  const cardsHoy = buildIngresosCards(stats, 'desgloseHoy')
  const cardsMes = buildIngresosCards(stats, 'desgloseMes')

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .desktop-cyber-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #050505; z-index: 0; overflow: hidden; pointer-events: none; }
        .cyber-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 50px 50px; mask-image: radial-gradient(circle at center, black 40%, transparent 100%); -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%); }
        
        @keyframes color-shift { 0% { filter: blur(100px) hue-rotate(0deg); } 100% { filter: blur(100px) hue-rotate(360deg); } }
        
        .desktop-orb-1, .desktop-orb-2 { position: absolute; border-radius: 50%; mix-blend-mode: screen; filter: blur(100px); transition: transform 0.5s ease, opacity 0.5s ease; }
        
        .desktop-orb-1 { width: 45vw; height: 45vw; background: rgba(59,130,246,0.25); top: -10%; left: -5%; animation: float-1 20s infinite alternate ease-in-out, color-shift 15s linear infinite; }
        .desktop-orb-2 { width: 40vw; height: 40vw; background: rgba(16,185,129,0.2); bottom: -10%; right: -5%; animation: float-2 25s infinite alternate ease-in-out, color-shift 20s linear infinite reverse; }
        
        @keyframes float-1 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(5vw, 5vh) scale(1.1); } }
        @keyframes float-2 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(-5vw, -5vh) scale(1.2); } }
        .live-pulse .desktop-orb-1 { transform: scale(1.3); opacity: 0.5; background: rgba(59,130,246,0.4); }
        .live-pulse .desktop-orb-2 { transform: scale(1.4); opacity: 0.5; background: rgba(16,185,129,0.3); }
      `}} />

      <div className={`desktop-cyber-bg ${pulsing ? 'live-pulse' : ''}`}>
        <div className="cyber-grid"></div>
        <div className="desktop-orb-1"></div>
        <div className="desktop-orb-2"></div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto min-h-screen relative z-10 text-white font-sans">
        <div className="flex items-start justify-between mb-8 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{getSaludo()}, Admin</h1>
            <p className="text-gray-400 text-sm mt-1 capitalize font-medium">{getFechaHoy()}</p>
          </div>
          <div className="flex items-center gap-4">
            <GlassPanel className="!p-3 !rounded-xl flex items-center gap-4 border-t-white/20">
              <div><span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Tasa USD</span>{tasaBcv > 0 ? <span className="text-[#10B981] font-black text-sm tabular-nums">Bs. {tasaBcv.toFixed(2)}</span> : <span className="text-gray-600 text-sm">N/A</span>}</div>
              <div className="w-px h-8 bg-white/10" />
              <div><span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Tasa EUR</span>{tasaEur > 0 ? <span className="text-[#3B82F6] font-black text-sm tabular-nums">Bs. {tasaEur.toFixed(2)}</span> : <span className="text-gray-600 text-sm">N/A</span>}</div>
            </GlassPanel>
            <button onClick={() => { loadStats(); loadActividad() }} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:rotate-180 shadow-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg></button>
          </div>
        </div>

        {(stats.porVencer > 0 || stats.vencidos > 0) && (
          <div className="flex gap-4 mb-8 animate-in slide-in-from-top-4 duration-500">
            {stats.porVencer > 0 && <GlassPanel className="!p-4 !rounded-xl border-amber-500/30 bg-amber-500/10 flex items-center gap-3 flex-1"><div className="bg-amber-500/20 p-2 rounded-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div><p className="text-sm text-amber-200"><strong className="font-black text-amber-400 text-lg">{stats.porVencer}</strong> atletas vencen pronto</p></GlassPanel>}
            {stats.vencidos > 0 && <GlassPanel className="!p-4 !rounded-xl border-red-500/30 bg-red-500/10 flex items-center gap-3 flex-1"><div className="bg-red-500/20 p-2 rounded-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></div><p className="text-sm text-red-200"><strong className="font-black text-red-400 text-lg">{stats.vencidos}</strong> membresías vencidas</p></GlassPanel>}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Activos" value={stats.activos} subtitle={stats.totalSocios + ' en sistema'} color="blue" icon="members" />
              <StatCard title="Entradas hoy" value={stats.asistenciasHoy} color="purple" icon="entry" />
              <StatCard title="Por vencer" value={stats.porVencer} subtitle="Próximos 3 días" color="yellow" icon="clock" />
              <StatCard title="Vencidos" value={stats.vencidos} color="red" icon="alert" />
            </div>
            <GlassPanel className="border-t-white/20"><div className="flex items-center gap-2 mb-6"><div className="w-2 h-6 bg-gradient-to-b from-[#10B981] to-emerald-700 rounded-full" /><h2 className="text-lg font-black uppercase tracking-widest text-gray-300">Caja de Hoy</h2></div><div className={'grid grid-cols-1 ' + getGridCols(cardsHoy.length) + ' gap-4'}>{cardsHoy.map((c) => <StatCard key={'hoy-'+c.moneda} title={c.titulo} value={c.valor} color={c.color} icon="dollar" size="large" />)}</div></GlassPanel>
            <GlassPanel className="border-t-white/20"><div className="flex items-center gap-2 mb-6"><div className="w-2 h-6 bg-gradient-to-b from-[#3B82F6] to-blue-700 rounded-full" /><h2 className="text-lg font-black uppercase tracking-widest text-gray-300">Caja del Mes</h2></div><div className={'grid grid-cols-1 ' + getGridCols(cardsMes.length) + ' gap-4'}>{cardsMes.map((c) => <StatCard key={'mes-'+c.moneda} title={c.titulo} value={c.valor} color={c.color} icon="dollar" size="large" />)}</div></GlassPanel>
          </div>

          <div className="xl:col-span-1">
            <GlassPanel className="h-full flex flex-col relative overflow-hidden border-t-[#3B82F6]/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-50" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-white drop-shadow-sm flex items-center gap-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Actividad en Vivo</h2>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30"><div className={`w-2 h-2 rounded-full bg-[#3B82F6] ${pulsing ? 'animate-ping' : 'animate-pulse'}`} /><span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">En línea</span></div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {actividadReciente.length === 0 ? <div className="text-center py-10"><p className="text-gray-500 text-sm font-medium">Nadie ha entrado hoy.</p></div> : actividadReciente.map((log, i) => (
                  <div key={log.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors animate-in slide-in-from-right-8" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-10 h-10 rounded-full bg-[#1A1C23] border border-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]">{log.socios?.nombre?.charAt(0)}</div>
                    <div className="flex-1 min-w-0"><p className="text-[14px] font-bold text-white truncate drop-shadow-sm">{log.socios?.nombre}</p><p className="text-[11px] text-gray-400 font-medium">C.I. {log.socios?.cedula}</p></div>
                    <div className="text-right shrink-0"><p className="text-[12px] font-black text-[#10B981] tabular-nums">{new Date(log.fecha_hora).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</p><p className="text-[9px] text-gray-500 font-bold uppercase">Entrada</p></div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </>
  )
}