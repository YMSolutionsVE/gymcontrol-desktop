import React from 'react'

export default function FiltrosAvanzados({ filtroActual, onChangeFiltro, rangoPersonalizado, onChangeRango }) {
  const filtros = [
    { id: 'dia', label: 'Hoy' },
    { id: 'semana', label: 'Esta semana' },
    { id: 'mes', label: 'Este mes' },
    { id: 'personalizado', label: 'Rango personalizado' }
  ]

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
      <h3 className="text-white font-semibold mb-4">Filtrar periodo</h3>

      <div className="flex flex-wrap gap-3 mb-4">
        {filtros.map(filtro => (
          <button
            key={filtro.id}
            onClick={() => onChangeFiltro(filtro.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroActual === filtro.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {filtroActual === 'personalizado' && (
        <div className="flex gap-3 items-center">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Desde</label>
            <input
              type="date"
              value={rangoPersonalizado.desde}
              onChange={(e) => onChangeRango({ ...rangoPersonalizado, desde: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Hasta</label>
            <input
              type="date"
              value={rangoPersonalizado.hasta}
              onChange={(e) => onChangeRango({ ...rangoPersonalizado, hasta: e.target.value })}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}