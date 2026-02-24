import React, { useState } from 'react'
import { logout } from '../services/authService'
import Sidebar from '../components/Sidebar'
import Dashboard from './Dashboard'
import Socios from './Socios'
import Asistencias from './Asistencias'
import Reportes from './Reportes'
import MiembroDetalle from './MiembroDetalle'
import OfflineBanner from '../components/OfflineBanner' // Importación agregada

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [miembroDetalleId, setMiembroDetalleId] = useState(null)

  const handleNavigate = (page) => {
    setCurrentPage(page)
    setMiembroDetalleId(null) // Limpiar ID al cambiar de página
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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Banner de estado offline agregado al inicio */}
      <OfflineBanner />
      
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
      />

      <div className="flex-1 overflow-y-auto">
        {currentPage === 'dashboard' && <Dashboard />}
        
        {currentPage === 'socios' && (
          <Socios onVerMiembro={handleVerMiembro} />
        )}
        
        {currentPage === 'miembro-detalle' && miembroDetalleId && (
          <MiembroDetalle 
            socioId={miembroDetalleId} 
            onVolver={handleVolverSocios}
          />
        )}
        
        {currentPage === 'asistencias' && <Asistencias />}
        
        {currentPage === 'reportes' && <Reportes />}
      </div>
    </div>
  )
}