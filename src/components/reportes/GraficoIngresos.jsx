import React from 'react'
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function GraficoIngresos({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-white font-semibold mb-4">Ingresos por día</h3>
        <p className="text-gray-500 text-center py-8 text-sm">
          No hay datos de ingresos para el período seleccionado
        </p>
      </div>
    )
  }

  // Detectar qué monedas tienen datos reales para no mostrar líneas vacías
  const tieneUSD = datos.some(d => (d.usd || 0) > 0)
  const tieneEUR = datos.some(d => (d.eur || 0) > 0)
  const tieneBS  = datos.some(d => (d.bs  || 0) > 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div
        className="rounded-xl p-3 shadow-xl text-sm"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-gray-400 mb-2 font-medium">{label}</p>
        {payload.map(entry => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {
              entry.dataKey === 'usd' ? `
$$
{entry.value.toFixed(2)}` :
              entry.dataKey === 'eur' ? `€${entry.value.toFixed(2)}` :
              `Bs. ${entry.value.toFixed(2)}`
            }
          </p>
        ))}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border p-6 mb-6"
      style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-base">Ingresos por día</h3>
        <div className="flex gap-4 text-xs">
          {tieneUSD && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-gray-400">USD</span>
            </div>
          )}
          {tieneEUR && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-gray-400">EUR</span>
            </div>
          )}
          {tieneBS && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-gray-400">Bs</span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={datos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="fecha"
            stroke="#4b5563"
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            stroke="#4b5563"
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#6b7280', fontSize: 12 }}
            iconType="circle"
          />
          {tieneUSD && (
            <Line
              type="monotone"
              dataKey="usd"
              name="USD"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={{ fill: '#34d399', r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
            />
          )}
          {tieneEUR && (
            <Line
              type="monotone"
              dataKey="eur"
              name="EUR"
              stroke="#60a5fa"
              strokeWidth={2.5}
              dot={{ fill: '#60a5fa', r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
            />
          )}
          {tieneBS && (
            <Line
              type="monotone"
              dataKey="bs"
              name="Bs"
              stroke="#a78bfa"
              strokeWidth={2.5}
              dot={{ fill: '#a78bfa', r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}