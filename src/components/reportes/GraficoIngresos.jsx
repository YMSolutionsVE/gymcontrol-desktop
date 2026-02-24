import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function GraficoIngresos({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">📈 Ingresos</h3>
        <p className="text-gray-400 text-center py-8">No hay datos de ingresos para el periodo seleccionado</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-2">{payload[0].payload.fecha}</p>
          <p className="text-green-400 font-semibold">
            USD: ${payload[0].value.toFixed(2)}
          </p>
          <p className="text-emerald-400 font-semibold">
            Bs: {payload[1].value.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">📈 Ingresos por día</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-gray-400">USD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <span className="text-gray-400">Bs</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={datos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="fecha"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#9CA3AF' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="usd"
            name="USD"
            stroke="#4ADE80"
            strokeWidth={3}
            dot={{ fill: '#4ADE80', r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="bs"
            name="Bs"
            stroke="#34D399"
            strokeWidth={3}
            dot={{ fill: '#34D399', r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}