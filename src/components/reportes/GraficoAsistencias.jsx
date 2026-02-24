import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

export default function GraficoAsistencias({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-white font-semibold mb-4">📊 Asistencias</h3>
        <p className="text-gray-400 text-center py-8">No hay datos de asistencias para el periodo seleccionado</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">{payload[0].payload.fecha}</p>
          <p className="text-blue-400 font-semibold text-lg">
            {payload[0].value} {payload[0].value === 1 ? 'asistencia' : 'asistencias'}
          </p>
        </div>
      )
    }
    return null
  }

  // Colores degradados para las barras
  const getColor = (index) => {
    const colors = ['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8']
    return colors[index % colors.length]
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">📊 Asistencias por día</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 bg-blue-400 rounded"></div>
          <span className="text-gray-400">Visitas</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={datos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="fecha"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="cantidad"
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          >
            {datos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}