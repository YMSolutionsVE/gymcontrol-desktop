import React, { useState, useEffect, useCallback } from 'react'
import { getDashboardStats } from '../services/dashboardService'
import { useConfig } from '../hooks/useConfig'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import TasaBcvEditor from '../components/TasaBcvEditor'

const getSaludo = () => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const getFechaHoy = () => {
  return new Date().toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Caracas'
  })
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { config, updateTasa } = useConfig()
  const { isAdmin } = useIsAdmin()
  const { gymId } = useAuth()

  const loadStats = useCallback(async () => {
    if (!gymId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await getDashboardStats(gymId)
      if (result.success) setStats(result.data)
      else setError(result.error)
    } catch (err) {
      console.error('Dashboard.jsx: error inesperado en loadStats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gymId])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleUpdateTasa = async (nuevaTasa) => {
    const result = await updateTasa(nuevaTasa)
    if (result.success) loadStats()
    return result
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">{error}</p>
          <button onClick={loadStats} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white text-sm transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const tasaBcv = config ? parseFloat(config.tasa_bcv) : 0
  const ingresosHoyStr = '$' + stats.ingresosHoy.toFixed(2)
  const ingresosMesStr = '$' + stats.ingresosMes.toFixed(2)
  const ingresosHoyBs = 'Bs. ' + (stats.ingresosHoy * tasaBcv).toFixed(2)
  const ingresosMesBs = 'Bs. ' + (stats.ingresosMes * tasaBcv).toFixed(2)

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gc-stagger-1">
        <div>
          <h1 className="text-2xl font-bold text-white">{getSaludo()}</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{getFechaHoy()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="relative flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{
              background: 'linear-gradient(145deg, #0D1117, #111827)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-gray-500 text-xs">Tasa BCV</span>
            <span className="text-blue-400 font-bold text-sm tabular-nums">Bs. {tasaBcv.toFixed(2)}</span>
            {isAdmin && (
              <TasaBcvEditor tasaActual={tasaBcv} onUpdate={handleUpdateTasa} compact />
            )}
          </div>
          <button
            onClick={loadStats}
            className="p-2.5 rounded-xl text-gray-400 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = '#ffffff'
              e.currentTarget.style.transform = 'rotate(45deg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.color = '#9ca3af'
              e.currentTarget.style.transform = 'rotate(0deg)'
            }}
            title="Actualizar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(stats.porVencer > 0 || stats.vencidos > 0) && (
        <div className="space-y-2 mb-6 gc-stagger-2">
          {stats.porVencer > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.12)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-sm" style={{ color: 'rgba(251,191,36,0.9)' }}>
                <span className="font-semibold">{stats.porVencer}</span> miembro{stats.porVencer !== 1 ? 's' : ''} por vencer en los próximos 3 días
              </p>
            </div>
          )}
          {stats.vencidos > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.12)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-sm" style={{ color: 'rgba(248,113,113,0.9)' }}>
                <span className="font-semibold">{stats.vencidos}</span> miembro{stats.vencidos !== 1 ? 's' : ''} con membresía vencida
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats grid - row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Miembros activos"
          value={stats.activos}
          subtitle={stats.totalSocios + ' registrados'}
          color="blue"
          icon="members"
          stagger={1}
        />
        <StatCard
          title="Vencidos"
          value={stats.vencidos}
          color="red"
          icon="alert"
          stagger={2}
        />
        <StatCard
          title="Por vencer"
          value={stats.porVencer}
          subtitle="Próximos 3 días"
          color="yellow"
          icon="clock"
          stagger={3}
        />
        <StatCard
          title="Entradas hoy"
          value={stats.asistenciasHoy}
          color="purple"
          icon="entry"
          stagger={4}
        />
      </div>

      {/* Stats grid - row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Ingresos hoy"
          value={ingresosHoyStr}
          subtitle={ingresosHoyBs}
          color="green"
          icon="dollar"
          size="large"
          stagger={5}
        />
        <StatCard
          title="Ingresos del mes"
          value={ingresosMesStr}
          subtitle={ingresosMesBs}
          color="green"
          icon="dollar"
          size="large"
          stagger={6}
        />
      </div>
    </div>
  )
}