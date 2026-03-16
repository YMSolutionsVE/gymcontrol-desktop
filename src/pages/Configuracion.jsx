import React, { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../hooks/useConfig'
import { usePlanes } from '../hooks/usePlanes'
import { createPlan, updatePlan, togglePlan, deletePlan } from '../services/planesService'
import {
  getInstructores, crearInstructor, desactivarInstructor,
  getMiembrosInstructor, asignarMiembro, desasignarMiembro,
  cambiarContrasenaInstructor,
} from '../services/instructoresService'
import { getSocios } from '../services/sociosService'
import TasaBcvEditor from '../components/TasaBcvEditor'

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const TABS = [
  { id: 'planes', label: 'Planes y Precios' },
  { id: 'instructores', label: 'Instructores' },
  { id: 'general', label: 'General' },
  { id: 'modulos', label: 'Módulos' },
]

const emptyPlanForm = { nombre: '', precio_usd: '', tipo: 'dias', duracion_dias: '30', cantidad_sesiones: '', descripcion: '' }

export default function Configuracion() {
  const { gymId, gymNombre } = useAuth()
  const { config, updateTasa } = useConfig()
  const { allPlanes, loading: planesLoading, reload: reloadPlanes } = usePlanes(gymId)

  const [activeTab, setActiveTab] = useState('planes')
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState(emptyPlanForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // ── Instructores ──
  const [instructores, setInstructores] = useState([])
  const [instructoresLoading, setInstructoresLoading] = useState(false)
  const [showInstructorForm, setShowInstructorForm] = useState(false)
  const [instructorForm, setInstructorForm] = useState({ nombre: '', email: '', password: '' })
  const [savingInstructor, setSavingInstructor] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [miembrosInstructor, setMiembrosInstructor] = useState([])
  const [todosLosSocios, setTodosLosSocios] = useState([])
  const [showAsignar, setShowAsignar] = useState(false)
  const [cambiarPassInstructor, setCambiarPassInstructor] = useState(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const tasaBcv = config ? parseFloat(config.tasa_bcv) : 0

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleOpenNew = () => {
    setEditingPlan(null)
    setPlanForm(emptyPlanForm)
    setShowForm(true)
  }

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan)
    setPlanForm({
      nombre: plan.nombre,
      precio_usd: String(plan.precio_usd),
      tipo: plan.tipo || 'dias',
      duracion_dias: String(plan.duracion_dias || ''),
      cantidad_sesiones: String(plan.cantidad_sesiones || ''),
      descripcion: plan.descripcion || '',
    })
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingPlan(null)
    setPlanForm(emptyPlanForm)
  }

  const handleSavePlan = async () => {
    if (!planForm.nombre.trim()) return showMsg('El nombre es requerido', 'error')
    if (!planForm.precio_usd || parseFloat(planForm.precio_usd) <= 0) return showMsg('El precio debe ser mayor a 0', 'error')
    if (planForm.tipo === 'sesiones' && (!planForm.cantidad_sesiones || parseInt(planForm.cantidad_sesiones) <= 0)) return showMsg('La cantidad de sesiones debe ser mayor a 0', 'error')
    if (planForm.tipo === 'dias' && (!planForm.duracion_dias || parseInt(planForm.duracion_dias) <= 0)) return showMsg('La duración debe ser mayor a 0 días', 'error')

    setSaving(true)
    try {
      let result
      if (editingPlan) {
        result = await updatePlan(gymId, editingPlan.id, planForm)
      } else {
        result = await createPlan(gymId, planForm)
      }

      if (result.success) {
        showMsg(editingPlan ? 'Plan actualizado' : 'Plan creado')
        handleCancelForm()
        reloadPlanes()
      } else {
        showMsg(result.error, 'error')
      }
    } catch (err) {
      showMsg(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (plan) => {
    const result = await togglePlan(gymId, plan.id, !plan.activo)
    if (result.success) {
      showMsg(plan.activo ? 'Plan desactivado' : 'Plan activado')
      reloadPlanes()
    } else {
      showMsg(result.error, 'error')
    }
  }

  const handleDelete = async (plan) => {
    if (!window.confirm(`¿Eliminar "${plan.nombre}"? Esta acción no se puede deshacer.`)) return
    const result = await deletePlan(gymId, plan.id)
    if (result.success) {
      showMsg('Plan eliminado')
      reloadPlanes()
    } else {
      showMsg(result.error, 'error')
    }
  }

  const handleUpdateTasa = async (nuevaTasa) => {
    const result = await updateTasa(nuevaTasa)
    if (result.success) showMsg('Tasa BCV actualizada')
    return result
  }

  // ── Cargar instructores al entrar a la tab ──
  useEffect(() => {
    if (activeTab === 'instructores' && gymId) cargarInstructores()
  }, [activeTab, gymId])

  const cargarInstructores = async () => {
    setInstructoresLoading(true)
    const res = await getInstructores(gymId)
    if (res.success) setInstructores(res.data)
    setInstructoresLoading(false)
  }

  const handleCrearInstructor = async () => {
    if (!instructorForm.nombre.trim()) return showMsg('El nombre es requerido', 'error')
    if (!instructorForm.email.trim()) return showMsg('El email es requerido', 'error')
    if (!instructorForm.password.trim()) return showMsg('La contraseña es requerida', 'error')
    setSavingInstructor(true)
    const res = await crearInstructor(gymId, instructorForm)
    setSavingInstructor(false)
    if (res.success) {
      showMsg(`Instructor ${instructorForm.nombre} creado`)
      setInstructorForm({ nombre: '', email: '', password: '' })
      setShowInstructorForm(false)
      cargarInstructores()
    } else {
      showMsg(res.error, 'error')
    }
  }

  const handleDesactivarInstructor = async (instructor) => {
    if (!window.confirm(`¿Desactivar a ${instructor.nombre}?`)) return
    const res = await desactivarInstructor(gymId, instructor.user_id)
    if (res.success) { showMsg('Instructor desactivado'); cargarInstructores() }
    else showMsg(res.error, 'error')
  }

  const handleVerMiembros = async (instructor) => {
    setSelectedInstructor(instructor)
    const res = await getMiembrosInstructor(gymId, instructor.user_id)
    if (res.success) setMiembrosInstructor(res.data)
    const sociosRes = await getSocios(gymId)
    if (sociosRes.success) setTodosLosSocios(sociosRes.data)
    setShowAsignar(true)
  }

  const handleAsignar = async (socioId) => {
    const res = await asignarMiembro(gymId, selectedInstructor.user_id, socioId)
    if (res.success) {
      const refresh = await getMiembrosInstructor(gymId, selectedInstructor.user_id)
      if (refresh.success) setMiembrosInstructor(refresh.data)
    } else showMsg(res.error, 'error')
  }

  const handleCambiarPassword = async () => {
    if (!nuevaPassword.trim()) return showMsg('Ingresa la nueva contraseña', 'error')
    setSavingPassword(true)
    const res = await cambiarContrasenaInstructor(gymId, cambiarPassInstructor.user_id, nuevaPassword)
    setSavingPassword(false)
    if (res.success) {
      showMsg(`Contraseña de ${cambiarPassInstructor.nombre} actualizada`)
      setCambiarPassInstructor(null)
      setNuevaPassword('')
    } else {
      showMsg(res.error, 'error')
    }
  }

  const handleDesasignar = async (socioId) => {
    const res = await desasignarMiembro(gymId, selectedInstructor.user_id, socioId)
    if (res.success) {
      setMiembrosInstructor(prev => prev.filter(m => m.id !== socioId))
    } else showMsg(res.error, 'error')
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: '#0D1117',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  }

  const planesActivos = allPlanes.filter(p => p.activo)
  const planesInactivos = allPlanes.filter(p => !p.activo)

  return (
    <div className="p-8 max-w-[900px] gc-fade-in">
      {/* Header */}
      <div className="mb-8 gc-stagger-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración</h1>
            <p className="text-gray-500 text-sm mt-0.5">{gymNombre}</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2"
          style={{
            background: message.type === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
            color: message.type === 'error' ? '#f87171' : '#34d399',
            animation: 'gcFadeInUp 0.3s ease-out',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 gc-stagger-2"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 4,
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: activeTab === tab.id ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: activeTab === tab.id ? '#60a5fa' : '#6b7280',
              border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: PLANES ═══════ */}
      {activeTab === 'planes' && (
        <div className="gc-stagger-3">
          {/* Add button */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">
              {planesActivos.length} plan{planesActivos.length !== 1 ? 'es' : ''} activo{planesActivos.length !== 1 ? 's' : ''}
            </p>
            {!showForm && (
              <button
                onClick={handleOpenNew}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <IconPlus /> Agregar plan
              </button>
            )}
          </div>

          {/* Inline form */}
          {showForm && (
            <div
              className="rounded-xl p-5 mb-4"
              style={{
                background: 'linear-gradient(145deg, #0D1117, #111827)',
                border: '1px solid rgba(59,130,246,0.15)',
                animation: 'gcFadeInUp 0.3s ease-out',
              }}
            >
              <p className="text-sm font-semibold text-white mb-4">
                {editingPlan ? 'Editar plan' : 'Nuevo plan'}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Nombre del plan</label>
                  <input
                    type="text"
                    value={planForm.nombre}
                    onChange={(e) => setPlanForm(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Plan Gold, Mensual, Diario..."
                    style={inputStyle}
                    disabled={saving}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Precio USD</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={planForm.precio_usd}
                    onChange={(e) => setPlanForm(p => ({ ...p, precio_usd: e.target.value }))}
                    placeholder="0.00"
                    style={inputStyle}
                    disabled={saving}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
                  />
                  {planForm.precio_usd && tasaBcv > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: '#4b5563' }}>
                      ≈ Bs. {(parseFloat(planForm.precio_usd) * tasaBcv).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              {/* Tipo de plan */}
              <div className="mb-3">
                <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Tipo de plan</label>
                <div className="flex gap-2">
                  {[{ id: 'dias', label: 'Por días' }, { id: 'sesiones', label: 'Por sesiones' }].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPlanForm(p => ({ ...p, tipo: t.id }))}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: planForm.tipo === t.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                        border: planForm.tipo === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        color: planForm.tipo === t.id ? '#60a5fa' : '#9ca3af',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  {planForm.tipo === 'sesiones' ? (
                    <>
                      <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Cantidad de sesiones</label>
                      <input
                        type="number"
                        min="1"
                        value={planForm.cantidad_sesiones}
                        onChange={(e) => setPlanForm(p => ({ ...p, cantidad_sesiones: e.target.value }))}
                        placeholder="Ej: 20"
                        style={inputStyle}
                        disabled={saving}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Duración (días)</label>
                      <input
                        type="number"
                        min="1"
                        value={planForm.duracion_dias}
                        onChange={(e) => setPlanForm(p => ({ ...p, duracion_dias: e.target.value }))}
                        style={inputStyle}
                        disabled={saving}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
                      />
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Descripción (opcional)</label>
                  <input
                    type="text"
                    value={planForm.descripcion}
                    onChange={(e) => setPlanForm(p => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Ej: 16 sesiones pesas + 8 kick boxing"
                    style={inputStyle}
                    disabled={saving}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSavePlan}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', opacity: saving ? 0.5 : 1 }}
                >
                  {saving ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                  ) : (
                    <><IconCheck /> {editingPlan ? 'Guardar cambios' : 'Crear plan'}</>
                  )}
                </button>
                <button
                  onClick={handleCancelForm}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}
                >
                  <IconX /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {planesLoading && (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Cargando planes...</p>
            </div>
          )}

          {/* Empty state */}
          {!planesLoading && allPlanes.length === 0 && !showForm && (
            <div
              className="rounded-xl p-12 text-center"
              style={{
                background: 'linear-gradient(145deg, #0D1117, #111827)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <p className="text-gray-300 font-medium mb-1">No has configurado planes todavía</p>
              <p className="text-gray-600 text-sm mb-4">Agrega tu primer plan para empezar a registrar miembros</p>
              <button
                onClick={handleOpenNew}
                className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }}
              >
                <IconPlus /> Agregar primer plan
              </button>
            </div>
          )}

          {/* Active plans */}
          {!planesLoading && planesActivos.length > 0 && (
            <div className="space-y-2">
              {planesActivos.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl p-4 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(145deg, #0D1117, #111827)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-white font-semibold text-[15px]">{plan.nombre}</p>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}
                        >
                          Activo
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span style={{ color: '#34d399', fontWeight: 600 }}>${parseFloat(plan.precio_usd).toFixed(2)}</span>
                        {tasaBcv > 0 && (
                          <span style={{ color: '#4b5563', fontSize: 12 }}>
                            Bs. {(parseFloat(plan.precio_usd) * tasaBcv).toFixed(2)}
                          </span>
                        )}
                        <span style={{ color: '#6b7280', fontSize: 12 }}>
                          {plan.tipo === 'sesiones' ? `${plan.cantidad_sesiones} sesiones` : `${plan.duracion_dias} días`}
                        </span>
                        {plan.descripcion && (
                          <span style={{ color: '#4b5563', fontSize: 12 }}>· {plan.descripcion}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: '#6b7280' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#60a5fa' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
                        title="Editar"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleToggle(plan)}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: '#6b7280' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.color = '#fbbf24' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
                        title="Desactivar"
                      >
                        <IconX />
                      </button>
                      <button
                        onClick={() => handleDelete(plan)}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: '#6b7280' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
                        title="Eliminar"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inactive plans */}
          {!planesLoading && planesInactivos.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: '#374151' }}>
                  Inactivos ({planesInactivos.length})
                </span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
              </div>
              <div className="space-y-2">
                {planesInactivos.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      opacity: 0.6,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-gray-400 font-medium text-[15px]">{plan.nombre}</p>
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.15)', color: '#6b7280' }}
                          >
                            Inactivo
                          </span>
                        </div>
                        <span style={{ color: '#4b5563', fontSize: 13 }}>
                          ${parseFloat(plan.precio_usd).toFixed(2)} · {plan.tipo === 'sesiones' ? `${plan.cantidad_sesiones} ses.` : `${plan.duracion_dias} días`}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggle(plan)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}
                      >
                        Reactivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB: GENERAL ═══════ */}
      {activeTab === 'general' && (
        <div className="space-y-4 gc-stagger-3">
          {/* Gym name */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(145deg, #0D1117, #111827)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Gimnasio</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-lg">{gymNombre}</p>
                <p className="text-gray-600 text-xs mt-0.5">Nombre visible en el sistema</p>
              </div>
            </div>
          </div>

          {/* Tasa BCV */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(145deg, #0D1117, #111827)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Tasa BCV</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 font-bold text-2xl tabular-nums">Bs. {tasaBcv.toFixed(2)}</p>
                <p className="text-gray-600 text-xs mt-0.5">Tasa de conversión USD → Bolívares</p>
              </div>
              <div className="relative">
                <TasaBcvEditor tasaActual={tasaBcv} onUpdate={handleUpdateTasa} compact />
              </div>
            </div>
          </div>

          {/* Moneda */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(145deg, #0D1117, #111827)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Moneda</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}
              >
                $
              </div>
              <div>
                <p className="text-white font-medium">Dólar Estadounidense (USD)</p>
                <p className="text-gray-600 text-xs">Moneda base del sistema. Conversión a Bs automática.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB: MÓDULOS ═══════ */}
      {activeTab === 'modulos' && (
        <div className="space-y-4 gc-stagger-3">
          {/* QR por celular - Activo */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(145deg, #0D1117, #111827)',
              border: '1px solid rgba(16,185,129,0.12)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" />
                    <rect x="14" y="14" width="4" height="4" rx="0.5" /><line x1="22" y1="14" x2="22" y2="18" /><line x1="18" y1="22" x2="22" y2="22" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Asistencia QR Móvil</p>
                  <p className="text-gray-500 text-xs mt-0.5">Genera QR por miembro. Instructores escanean con la PWA desde el celular.</p>
                </div>
              </div>
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}
              >
                ACTIVO
              </span>
            </div>
          </div>

          {/* Lector QR Hardware - Próximamente */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              opacity: 0.5,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.1)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" />
                    <rect x="14" y="14" width="4" height="4" rx="0.5" /><line x1="22" y1="14" x2="22" y2="18" /><line x1="18" y1="22" x2="22" y2="22" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold">Lector QR Hardware</p>
                  <p className="text-gray-600 text-xs mt-0.5">Conecta un lector QR USB para marcar asistencias automáticamente.</p>
                </div>
              </div>
              <span
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.1)', color: '#4b5563' }}
              >
                PRÓXIMAMENTE
              </span>
            </div>
          </div>

          {/* Reportes avanzados - Próximamente */}
          <div
            className="rounded-xl p-5"
            style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              opacity: 0.5,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.1)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold">Reportes Avanzados</p>
                  <p className="text-gray-600 text-xs mt-0.5">Métricas de retención, proyecciones y análisis de ingresos por plan.</p>
                </div>
              </div>
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.1)', color: '#4b5563' }}
              >
                PRÓXIMAMENTE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB: INSTRUCTORES ═══════ */}
      {activeTab === 'instructores' && (
        <div className="gc-stagger-3">

          {/* Panel asignación de miembros */}
          {showAsignar && selectedInstructor ? (
            <div>
              <button
                onClick={() => { setShowAsignar(false); setSelectedInstructor(null) }}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-5 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                Volver a instructores
              </button>

              <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-blue-400" style={{ background: 'rgba(59,130,246,0.15)' }}>
                  {(selectedInstructor.nombre || selectedInstructor.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{selectedInstructor.nombre || selectedInstructor.email}</p>
                  <p className="text-gray-500 text-xs">{selectedInstructor.email} · {miembrosInstructor.length} miembro{miembrosInstructor.length !== 1 ? 's' : ''} asignado{miembrosInstructor.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Asignados</p>
                  {miembrosInstructor.length === 0 ? (
                    <p className="text-gray-600 text-sm py-4 text-center">Ningún miembro asignado aún</p>
                  ) : (
                    <div className="space-y-2">
                      {miembrosInstructor.map(m => (
                        <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                          <div>
                            <p className="text-white text-sm font-medium">{m.nombre}</p>
                            <p className="text-gray-500 text-[11px]">{m.plan_actual || 'Sin plan'}</p>
                          </div>
                          <button onClick={() => handleDesasignar(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Agregar miembro</p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {todosLosSocios
                      .filter(s => !miembrosInstructor.find(m => m.id === s.id))
                      .map(s => (
                        <div key={s.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <p className="text-gray-300 text-sm">{s.nombre}</p>
                            <p className="text-gray-600 text-[11px]">{s.plan_actual || 'Sin plan'}</p>
                          </div>
                          <button onClick={() => handleAsignar(s.id)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-600 hover:text-blue-400 transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">{instructores.filter(i => i.activo).length} instructor{instructores.filter(i => i.activo).length !== 1 ? 'es' : ''} activo{instructores.filter(i => i.activo).length !== 1 ? 's' : ''}</p>
                {!showInstructorForm && (
                  <button onClick={() => setShowInstructorForm(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                    <IconPlus /> Nuevo instructor
                  </button>
                )}
              </div>

              {showInstructorForm && (
                <div className="rounded-xl p-5 mb-4" style={{ background: 'linear-gradient(145deg, #0D1117, #111827)', border: '1px solid rgba(59,130,246,0.15)', animation: 'gcFadeInUp 0.3s ease-out' }}>
                  <p className="text-sm font-semibold text-white mb-4">Nuevo instructor</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Nombre completo</label>
                      <input type="text" value={instructorForm.nombre} onChange={e => setInstructorForm(p => ({ ...p, nombre: e.target.value }))} placeholder="María García" style={inputStyle} disabled={savingInstructor}
                        onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Email</label>
                      <input type="email" value={instructorForm.email} onChange={e => setInstructorForm(p => ({ ...p, email: e.target.value }))} placeholder="maria@gimnasio.com" style={inputStyle} disabled={savingInstructor}
                        onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Contraseña privada</label>
                    <input type="password" value={instructorForm.password} onChange={e => setInstructorForm(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" style={inputStyle} disabled={savingInstructor}
                      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }} />
                    <p className="text-[11px] text-gray-600 mt-1">El instructor usará estas credenciales para ingresar a la PWA</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCrearInstructor} disabled={savingInstructor}
                      className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', opacity: savingInstructor ? 0.6 : 1 }}>
                      {savingInstructor ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</> : <><IconCheck /> Crear instructor</>}
                    </button>
                    <button onClick={() => { setShowInstructorForm(false); setInstructorForm({ nombre: '', email: '', password: '' }) }} disabled={savingInstructor}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {instructoresLoading ? (
                <div className="text-center py-12">
                  <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Cargando instructores...</p>
                </div>
              ) : instructores.length === 0 ? (
                <div className="text-center py-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-gray-400 font-medium mb-1">No hay instructores creados</p>
                  <p className="text-gray-600 text-sm">Crea el primero con el botón de arriba</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {instructores.map(inst => (
                    <div key={inst.id} className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #0D1117, #111827)', border: `1px solid ${inst.activo ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.1)'}`, opacity: inst.activo ? 1 : 0.6 }}>
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: inst.activo ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.1)', color: inst.activo ? '#60a5fa' : '#6b7280' }}>
                            {(inst.nombre || inst.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{inst.nombre}</p>
                            <p className="text-gray-500 text-[11px]">{inst.email}</p>
                          </div>
                          {!inst.activo && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>INACTIVO</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {inst.activo && (
                            <button onClick={() => handleVerMiembros(inst)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                              style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}>
                              Miembros
                            </button>
                          )}
                          {inst.activo && (
                            <button onClick={() => { setCambiarPassInstructor(cambiarPassInstructor?.id === inst.id ? null : inst); setNuevaPassword('') }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: cambiarPassInstructor?.id === inst.id ? '#60a5fa' : '#6b7280', background: cambiarPassInstructor?.id === inst.id ? 'rgba(59,130,246,0.1)' : 'transparent' }}
                              title="Cambiar contraseña">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </button>
                          )}
                          {inst.activo && (
                            <button onClick={() => handleDesactivarInstructor(inst)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Panel cambiar contraseña inline */}
                      {cambiarPassInstructor?.id === inst.id && (
                        <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-3 mb-2">Nueva contraseña</p>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={nuevaPassword}
                              onChange={e => setNuevaPassword(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                              style={{ ...inputStyle, flex: 1 }}
                              disabled={savingPassword}
                              onKeyDown={e => e.key === 'Enter' && handleCambiarPassword()}
                            />
                            <button onClick={handleCambiarPassword} disabled={savingPassword || !nuevaPassword.trim()}
                              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', whiteSpace: 'nowrap' }}>
                              {savingPassword ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Actualizar'}
                            </button>
                            <button onClick={() => { setCambiarPassInstructor(null); setNuevaPassword('') }}
                              className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white transition-colors"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  )
}