import React, { useEffect, useState } from 'react'
import { getSocioById, updateSocio } from '../services/sociosService'
import { getPagosBySocio } from '../services/pagosService'
import { supabase } from '../config/supabase'
import PagoForm from './PagoForm'
import SocioForm from './SocioForm'

export default function MiembroDetalle({ socioId, onVolver }) {
  const [socio, setSocio] = useState(null)
  const [pagos, setPagos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [view, setView] = useState('perfil') // perfil | pago | editar

  useEffect(() => {
    cargarDatos()
  }, [socioId])

  const cargarDatos = async () => {
    const socioRes = await getSocioById(socioId)
    if (socioRes.success) setSocio(socioRes.data)

    const pagosRes = await getPagosBySocio(socioId)
    if (pagosRes.success) setPagos(pagosRes.data)

    const { data } = await supabase
      .from('asistencias')
      .select('fecha_hora')
      .eq('socio_id', socioId)
      .order('fecha_hora', { ascending: false })

    setAsistencias(data || [])
  }

  const handlePagoComplete = () => {
    setView('perfil')
    cargarDatos()
  }

  const handleEditSave = async (formData) => {
    const result = await updateSocio(socioId, formData)
    if (result.success) {
      setView('perfil')
      cargarDatos()
    } else {
      throw new Error(result.error)
    }
  }

  if (!socio) return <div className="p-6 text-gray-400">Cargando perfil...</div>

  // 👉 Vista registrar pago
  if (view === 'pago') {
    return (
      <PagoForm
        socio={socio}
        onComplete={handlePagoComplete}
        onCancel={() => setView('perfil')}
      />
    )
  }

  // 👉 Vista editar miembro
  if (view === 'editar') {
    return (
      <SocioForm
        socio={socio}
        onSave={handleEditSave}
        onCancel={() => setView('perfil')}
      />
    )
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = socio.fecha_vencimiento
    ? new Date(socio.fecha_vencimiento + 'T00:00:00')
    : null

  let estado = 'Sin plan'
  let colorEstado = 'text-gray-400'

  if (vencimiento) {
    if (vencimiento < hoy) {
      estado = 'Vencido'
      colorEstado = 'text-red-400'
    } else if ((vencimiento - hoy) / (1000 * 60 * 60 * 24) <= 3) {
      estado = 'Por vencer'
      colorEstado = 'text-yellow-400'
    } else {
      estado = 'Activo'
      colorEstado = 'text-green-400'
    }
  }

  return (
    <div className="p-6 text-white">
      
      {/* BOTÓN VOLVER CORREGIDO */}
      <button
        onClick={onVolver}
        className="mb-4 text-blue-400 hover:underline"
      >
        ← Volver
      </button>

      <div className="flex justify-between items-start mb-2">
        <h1 className="text-3xl font-bold">{socio.nombre}</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setView('pago')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium transition"
          >
            Registrar pago
          </button>

          <button
            onClick={() => setView('editar')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition"
          >
            Editar datos
          </button>
        </div>
      </div>

      <p className={`mb-6 font-semibold ${colorEstado}`}>
        Estado: {estado}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <p><span className="text-gray-400">Cédula:</span> {socio.cedula}</p>
        <p><span className="text-gray-400">Teléfono:</span> {socio.telefono || 'N/A'}</p>
        <p><span className="text-gray-400">Plan actual:</span> {socio.plan_actual}</p>
        <p><span className="text-gray-400">Vence:</span> {socio.fecha_vencimiento || '—'}</p>
        <p><span className="text-gray-400">Miembro desde:</span> {new Date(socio.created_at).toLocaleDateString()}</p>
        <p><span className="text-gray-400">Total asistencias:</span> {asistencias.length}</p>
        <p><span className="text-gray-400">Pagos realizados:</span> {pagos.length}</p>
        <p>
          <span className="text-gray-400">Última visita:</span>{' '}
          {asistencias[0]
            ? new Date(asistencias[0].fecha_hora).toLocaleDateString()
            : '—'}
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Historial de pagos</h2>
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        {pagos.length === 0 && (
          <p className="text-gray-400">Sin pagos registrados</p>
        )}
        {pagos.map(p => (
          <div
            key={p.id}
            className="border-b border-gray-700 py-2 text-sm flex justify-between"
          >
            <span>
              {new Date(p.created_at).toLocaleDateString()} — {p.metodo}
            </span>
            <span>
              ${p.monto_usd} {p.referencia && `• Ref: ${p.referencia}`}
            </span>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-2">Asistencias</h2>
      <div className="bg-gray-800 rounded-lg p-4">
        {asistencias.length === 0 && (
          <p className="text-gray-400">Sin asistencias registradas</p>
        )}
        {asistencias.map((a, i) => (
          <div
            key={i}
            className="border-b border-gray-700 py-2 text-sm"
          >
            {new Date(a.fecha_hora).toLocaleString()}
          </div>
        ))}
      </div>

    </div>
  )
}