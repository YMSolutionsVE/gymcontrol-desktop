import React, { useEffect, useState } from 'react'
import { logout } from '../services/authService'
import Sidebar from '../components/Sidebar'
import Dashboard from './Dashboard'
import Socios from './Socios'
import Asistencias from './Asistencias'
import Reportes from './Reportes'
import MiembroDetalle from './MiembroDetalle'
import Configuracion from './Configuracion'
import OfflineBanner from '../components/OfflineBanner'
import SystemStatusBanners from '../components/SystemStatusBanners'
import { useAuth } from '../context/AuthContext'

const gcStyles = `
  @keyframes gcFadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes gcFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .gc-stagger-1 { animation: gcFadeInUp 0.45s ease-out forwards; opacity: 0; }
  .gc-stagger-2 { animation: gcFadeInUp 0.45s ease-out 0.06s forwards; opacity: 0; }
  .gc-stagger-3 { animation: gcFadeInUp 0.45s ease-out 0.12s forwards; opacity: 0; }
  .gc-stagger-4 { animation: gcFadeInUp 0.45s ease-out 0.18s forwards; opacity: 0; }
  .gc-stagger-5 { animation: gcFadeInUp 0.45s ease-out 0.24s forwards; opacity: 0; }
  .gc-stagger-6 { animation: gcFadeInUp 0.45s ease-out 0.30s forwards; opacity: 0; }
  .gc-fade-in { animation: gcFadeIn 0.4s ease-out forwards; }
`

export default function Home() {
  const { isSuperAdmin } = useAuth()
  const [currentPage, setCurrentPage] = useState(isSuperAdmin ? 'configuracion' : 'dashboard')
  const [miembroDetalleId, setMiembroDetalleId] = useState(null)

  useEffect(() => {
    if (isSuperAdmin) {
      setCurrentPage('configuracion')
      setMiembroDetalleId(null)
    }
  }, [isSuperAdmin])

  const handleNavigate = (page) => {
    if (isSuperAdmin && page !== 'configuracion') return
    setCurrentPage(page)
    setMiembroDetalleId(null)
  }

  const handleVerMiembro = (socioId) => {
    setMiembroDetalleId(socioId)
    setCurrentPage('miembro-detalle')
  }

  const handleVolverSocios = () => {
    setCurrentPage('socios')
    setMiembroDetalleId(null)
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <style>{gcStyles}</style>
      <div className="flex h-screen bg-[#0B0F1A] text-white overflow-hidden">
        <OfflineBanner />

        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto relative">
          <div className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)' }}
          />
          <div className="fixed bottom-0 left-[80px] w-[400px] h-[400px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)' }}
          />

          <div className="relative z-10">
            <SystemStatusBanners />
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'socios' && <Socios onVerMiembro={handleVerMiembro} />}
            {currentPage === 'miembro-detalle' && miembroDetalleId && (
              <MiembroDetalle socioId={miembroDetalleId} onVolver={handleVolverSocios} />
            )}
            {currentPage === 'asistencias' && <Asistencias />}
            {currentPage === 'reportes' && <Reportes />}
            {currentPage === 'configuracion' && <Configuracion />}
          </div>
        </div>
      </div>
    </>
  )
}
