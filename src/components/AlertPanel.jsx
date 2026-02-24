import React from 'react'
import { useAlerts } from '../hooks/useAlerts'

export default function AlertPanel() {
  const { alerts, loading } = useAlerts()

  if (loading) return null

  const total = alerts.porVencer.length + alerts.vencidos.length
  if (total === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {alerts.vencidos.length > 0 && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
          <p className="text-red-400 font-medium mb-2">
            Membresías vencidas ({alerts.vencidos.length})
          </p>
          <div className="space-y-1">
            {alerts.vencidos.slice(0, 5).map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{s.nombre}</span>
                <span className="text-red-400">Venció: {s.fecha_vencimiento}</span>
              </div>
            ))}
            {alerts.vencidos.length > 5 && (
              <p className="text-gray-500 text-xs mt-1">
                y {alerts.vencidos.length - 5} más...
              </p>
            )}
          </div>
        </div>
      )}

      {alerts.porVencer.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
          <p className="text-yellow-400 font-medium mb-2">
            Por vencer en 3 días ({alerts.porVencer.length})
          </p>
          <div className="space-y-1">
            {alerts.porVencer.slice(0, 5).map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{s.nombre}</span>
                <span className="text-yellow-400">Vence: {s.fecha_vencimiento}</span>
              </div>
            ))}
            {alerts.porVencer.length > 5 && (
              <p className="text-gray-500 text-xs mt-1">
                y {alerts.porVencer.length - 5} más...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}