import React, { useEffect, useState } from 'react'
import { logout } from '../services/authService'
import Sidebar from '../components/Sidebar'
import Dashboard from './Dashboard'
import Socios from './Socios'
import Asistencias from './Asistencias'
import Reportes from './Reportes'
import Auditoria from './Auditoria'
import Leaderboard from './Leaderboard' // 🔥 IMPORTAMOS RANKING
import MiembroDetalle from './MiembroDetalle'
import Configuracion from './Configuracion'
import OfflineBanner from '../components/OfflineBanner'
import SystemStatusBanners from '../components/SystemStatusBanners'
import { useAuth } from '../context/AuthContext'

const globalStyles = `
  @keyframes gcFadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes gcFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .gc-stagger-1 { animation: gcFadeInUp 0.45s ease-out forwards; opacity: 0; }
  .gc-stagger-2 { animation: gcFadeInUp 0.45s ease-out 0.06s forwards; opacity: 0; }
  .gc-stagger-3 { animation: gcFadeInUp 0.45s ease-out 0.12s forwards; opacity: 0; }
  .gc-stagger-4 { animation: gcFadeInUp 0.45s ease-out 0.18s forwards; opacity: 0; }
  .gc-stagger-5 { animation: gcFadeInUp 0.45s ease-out 0.24s forwards; opacity: 0; }
  .gc-stagger-6 { animation: gcFadeInUp 0.45s ease-out 0.30s forwards; opacity: 0; }
  .gc-fade-in { animation: gcFadeIn 0.4s ease-out forwards; }

  .desktop-cyber-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #050505; z-index: 0; pointer-events: none; overflow: hidden; }
  .cyber-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(circle at center, black 40%, transparent 100%); -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%); }
  
  @keyframes color-shift-global { 0% { filter: blur(120px) hue-rotate(0deg); } 100% { filter: blur(120px) hue-rotate(360deg); } }
  .global-orb-1, .global-orb-2 { position: absolute; border-radius: 50%; mix-blend-mode: screen; filter: blur(120px); transition: opacity 0.3s ease-out; }
  
  .global-orb-1 { width: 55vw; height: 55vw; background: rgba(59,130,246,0.35); animation: move-orb-1 30s infinite alternate ease-in-out, color-shift-global 25s linear infinite; }
  .global-orb-2 { width: 50vw; height: 50vw; background: rgba(16,185,129,0.3); animation: move-orb-2 35s infinite alternate ease-in-out, color-shift-global 30s linear infinite reverse; }
  
  @keyframes move-orb-1 { 0% { top: -20%; left: -20%; transform: scale(1); } 50% { top: 20%; left: 30%; transform: scale(1.1); } 100% { top: 60%; left: 60%; transform: scale(1); } }
  @keyframes move-orb-2 { 0% { bottom: -20%; right: -20%; transform: scale(1); } 50% { bottom: 30%; right: 40%; transform: scale(1.1); } 100% { bottom: 70%; right: 70%; transform: scale(1); } }
  
  .live-pulse-global .global-orb-1 { opacity: 0.8; background: rgba(59,130,246,0.6); }
  .live-pulse-global .global-orb-2 { opacity: 0.8; background: rgba(16,185,129,0.5); }
`

export default function Home() {
  const { isSuperAdmin } = useAuth()
  const [currentPage, setCurrentPage] = useState(isSuperAdmin ? 'configuracion' : 'dashboard')
  const [miembroDetalleId, setMiembroDetalleId] = useState(null)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    const handleGlobalClick = () => { setPulsing(true); setTimeout(() => setPulsing(false), 350) }
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  useEffect(() => { if (isSuperAdmin) { setCurrentPage('configuracion'); setMiembroDetalleId(null) } }, [isSuperAdmin])

  const handleNavigate = (page) => { if (isSuperAdmin && page !== 'configuracion') return; setCurrentPage(page); setMiembroDetalleId(null) }
  const handleVerMiembro = (socioId) => { setMiembroDetalleId(socioId); setCurrentPage('miembro-detalle') }
  const handleVolverSocios = () => { setCurrentPage('socios'); setMiembroDetalleId(null) }
  const handleLogout = async () => { await logout() }

  return (
    <>
      <style>{globalStyles}</style>

      <div className={`desktop-cyber-bg ${pulsing ? 'live-pulse-global' : ''}`}>
        <div className="cyber-grid"></div>
        <div className="global-orb-1"></div>
        <div className="global-orb-2"></div>
      </div>

      <div className="flex h-screen text-white overflow-hidden relative z-10">
        <OfflineBanner />
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} />

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="relative z-10">
            <SystemStatusBanners />
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'socios' && <Socios onVerMiembro={handleVerMiembro} />}
            {currentPage === 'miembro-detalle' && miembroDetalleId && <MiembroDetalle socioId={miembroDetalleId} onVolver={handleVolverSocios} />}
            {currentPage === 'asistencias' && <Asistencias />}
            {currentPage === 'auditoria' && <Auditoria />} 
            {currentPage === 'leaderboard' && <Leaderboard />} {/* 🔥 RUTA REGISTRADA */}
            {currentPage === 'reportes' && <Reportes />}
            {currentPage === 'configuracion' && <Configuracion />}
          </div>
        </div>
      </div>
    </>
  )
}
