import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { actualizarGym, crearGymConAdmin, getGymsResumen } from '../../services/gymsService'

const emptyClienteForm = {
  nombreGym: '',
  adminNombre: '',
  adminEmail: '',
  password: '',
  ciudad: '',
  telefono: '',
  enTrial: false,
  trialDias: '30',
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

const focusInput = (event) => {
  event.target.style.borderColor = 'rgba(59,130,246,0.3)'
  event.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
}

const blurInput = (event) => {
  event.target.style.borderColor = 'rgba(255,255,255,0.08)'
  event.target.style.boxShadow = 'none'
}

const buildEditForm = (cliente) => ({
  nombreGym: cliente.nombre || '',
  adminNombre: cliente.admin_nombre || '',
  ciudad: cliente.ciudad || '',
  telefono: cliente.telefono || '',
  activo: Boolean(cliente.activo),
  enTrial: Boolean(cliente.en_trial),
  trialDias: cliente.en_trial && cliente.trial_end
    ? String(Math.max(1, Math.ceil((new Date(cliente.trial_end) - new Date()) / (1000 * 60 * 60 * 24))))
    : '30',
})

function ClienteEditor({ cliente, form, setForm, onSave, onCancel, saving }) {
  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(59,130,246,0.15)',
      }}
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Nombre del gym</label>
          <input
            type="text"
            value={form.nombreGym}
            onChange={(e) => setForm((prev) => ({ ...prev, nombreGym: e.target.value }))}
            style={inputStyle}
            disabled={saving}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>
        <div>
          <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Administrador principal</label>
          <input
            type="text"
            value={form.adminNombre}
            onChange={(e) => setForm((prev) => ({ ...prev, adminNombre: e.target.value }))}
            style={inputStyle}
            disabled={saving}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Ciudad</label>
          <input
            type="text"
            value={form.ciudad}
            onChange={(e) => setForm((prev) => ({ ...prev, ciudad: e.target.value }))}
            style={inputStyle}
            disabled={saving}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>
        <div>
          <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Teléfono</label>
          <input
            type="text"
            value={form.telefono}
            onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
            style={inputStyle}
            disabled={saving}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-white text-sm font-medium mb-2">Estado del gym</p>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, activo: !prev.activo }))}
            disabled={saving}
            className="w-12 h-7 rounded-full transition-all relative"
            style={{
              background: form.activo ? 'rgba(16,185,129,0.9)' : 'rgba(107,114,128,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: form.activo ? 24 : 2,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 180ms ease',
              }}
            />
          </button>
          <p className="text-gray-500 text-xs mt-2">{form.activo ? 'Visible y operativo' : 'Desactivado para uso normal'}</p>
        </div>

        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-white text-sm font-medium mb-2">Trial</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, enTrial: !prev.enTrial }))}
              disabled={saving}
              className="w-12 h-7 rounded-full transition-all relative"
              style={{
                background: form.enTrial ? 'rgba(59,130,246,0.9)' : 'rgba(107,114,128,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: form.enTrial ? 24 : 2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 180ms ease',
                }}
              />
            </button>
            {form.enTrial && (
              <input
                type="number"
                min="1"
                value={form.trialDias}
                onChange={(e) => setForm((prev) => ({ ...prev, trialDias: e.target.value }))}
                style={{ ...inputStyle, width: 100 }}
                disabled={saving}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            )}
          </div>
          <p className="text-gray-500 text-xs mt-2">{form.enTrial ? 'Al guardar se recalcula la ventana de trial' : 'Trial desactivado'}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : 'Guardar cambios'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function SuperadminClientesPanel({ showMsg }) {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clienteForm, setClienteForm] = useState(emptyClienteForm)
  const [editingClienteId, setEditingClienteId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const cargarClientes = useCallback(async () => {
    setLoading(true)
    const res = await getGymsResumen()
    if (res.success) {
      setClientes(res.data)
    } else {
      showMsg(res.error || 'No se pudo cargar la lista de clientes.', 'error')
    }
    setLoading(false)
  }, [showMsg])

  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  const stats = useMemo(() => ({
    total: clientes.length,
    activos: clientes.filter(cliente => cliente.activo).length,
    trial: clientes.filter(cliente => cliente.en_trial).length,
  }), [clientes])

  const resetForm = () => {
    setClienteForm(emptyClienteForm)
    setShowForm(false)
  }

  const handleCrearCliente = async () => {
    if (!clienteForm.nombreGym.trim()) return showMsg('El nombre del gimnasio es obligatorio.', 'error')
    if (!clienteForm.adminNombre.trim()) return showMsg('El nombre del administrador es obligatorio.', 'error')
    if (!clienteForm.adminEmail.trim()) return showMsg('El correo del administrador es obligatorio.', 'error')
    if (!clienteForm.password.trim()) return showMsg('La contraseña inicial es obligatoria.', 'error')
    if (clienteForm.password.trim().length < 6) return showMsg('La contraseña debe tener al menos 6 caracteres.', 'error')
    if (clienteForm.enTrial && (!clienteForm.trialDias || parseInt(clienteForm.trialDias, 10) <= 0)) {
      return showMsg('Los días de trial deben ser mayores a 0.', 'error')
    }

    setSaving(true)
    const payload = {
      gymName: clienteForm.nombreGym.trim(),
      adminName: clienteForm.adminNombre.trim(),
      email: clienteForm.adminEmail.trim().toLowerCase(),
      password: clienteForm.password,
      ciudad: clienteForm.ciudad.trim(),
      telefono: clienteForm.telefono.trim(),
      enTrial: clienteForm.enTrial,
      trialDays: clienteForm.enTrial ? parseInt(clienteForm.trialDias, 10) : 0,
    }

    const res = await crearGymConAdmin(payload)
    setSaving(false)

    if (!res.success) {
      showMsg(res.error, 'error')
      return
    }

    showMsg(`Cliente ${payload.gymName} creado correctamente.`)
    resetForm()
    cargarClientes()
  }

  const startEdit = (cliente) => {
    setEditingClienteId(cliente.id)
    setEditForm(buildEditForm(cliente))
  }

  const cancelEdit = () => {
    setEditingClienteId(null)
    setEditForm(null)
  }

  const handleGuardarEdicion = async (cliente) => {
    if (!editForm?.nombreGym?.trim()) return showMsg('El nombre del gimnasio es obligatorio.', 'error')
    if (!editForm?.adminNombre?.trim()) return showMsg('El nombre del administrador es obligatorio.', 'error')
    if (editForm.enTrial && (!editForm.trialDias || parseInt(editForm.trialDias, 10) <= 0)) {
      return showMsg('Los días de trial deben ser mayores a 0.', 'error')
    }

    setSaving(true)
    const res = await actualizarGym({
      gymId: cliente.id,
      gymName: editForm.nombreGym.trim(),
      adminName: editForm.adminNombre.trim(),
      ciudad: editForm.ciudad.trim(),
      telefono: editForm.telefono.trim(),
      activo: editForm.activo,
      enTrial: editForm.enTrial,
      trialDays: editForm.enTrial ? parseInt(editForm.trialDias, 10) : 0,
    })
    setSaving(false)

    if (!res.success) {
      showMsg(res.error, 'error')
      return
    }

    showMsg(`Cliente ${editForm.nombreGym.trim()} actualizado.`)
    cancelEdit()
    cargarClientes()
  }

  return (
    <div className="gc-stagger-3">
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Clientes registrados', value: stats.total, tone: '#60a5fa' },
          { label: 'Gyms activos', value: stats.activos, tone: '#34d399' },
          { label: 'En trial', value: stats.trial, tone: '#fbbf24' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-4"
            style={{
              background: 'linear-gradient(145deg, #0D1117, #111827)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-semibold mb-2">{item.label}</p>
            <p className="text-2xl font-bold" style={{ color: item.tone }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-white font-semibold">Alta de nuevos clientes</p>
          <p className="text-sm text-gray-500 mt-1">Crea y administra gimnasios, su admin principal y el estado comercial desde un solo lugar.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
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
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo cliente
          </button>
        )}
      </div>

      {showForm && (
        <div
          className="rounded-xl p-5 mb-4"
          style={{
            background: 'linear-gradient(145deg, #0D1117, #111827)',
            border: '1px solid rgba(59,130,246,0.15)',
            animation: 'gcFadeInUp 0.3s ease-out',
          }}
        >
          <p className="text-sm font-semibold text-white mb-4">Nuevo gym cliente</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Nombre del gym</label>
              <input type="text" value={clienteForm.nombreGym} onChange={(e) => setClienteForm((prev) => ({ ...prev, nombreGym: e.target.value }))} placeholder="Pugilatus Club" style={inputStyle} disabled={saving} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Administrador</label>
              <input type="text" value={clienteForm.adminNombre} onChange={(e) => setClienteForm((prev) => ({ ...prev, adminNombre: e.target.value }))} placeholder="Nombre del admin principal" style={inputStyle} disabled={saving} onFocus={focusInput} onBlur={blurInput} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Correo de acceso</label>
              <input type="email" value={clienteForm.adminEmail} onChange={(e) => setClienteForm((prev) => ({ ...prev, adminEmail: e.target.value }))} placeholder="admin@cliente.com" style={inputStyle} disabled={saving} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Contraseña inicial</label>
              <input type="password" value={clienteForm.password} onChange={(e) => setClienteForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Mínimo 6 caracteres" style={inputStyle} disabled={saving} onFocus={focusInput} onBlur={blurInput} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Ciudad</label>
              <input type="text" value={clienteForm.ciudad} onChange={(e) => setClienteForm((prev) => ({ ...prev, ciudad: e.target.value }))} placeholder="Caracas" style={inputStyle} disabled={saving} onFocus={focusInput} onBlur={blurInput} />
            </div>
            <div>
              <label className="block text-gray-500 text-[11px] uppercase tracking-wider mb-1.5">Teléfono</label>
              <input type="text" value={clienteForm.telefono} onChange={(e) => setClienteForm((prev) => ({ ...prev, telefono: e.target.value }))} placeholder="+58 412 0000000" style={inputStyle} disabled={saving} onFocus={focusInput} onBlur={blurInput} />
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-white text-sm font-medium">Activar período de trial</p>
              <p className="text-gray-500 text-xs mt-1">Si está activo, se guardará la fecha de inicio y fin automáticamente.</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setClienteForm((prev) => ({ ...prev, enTrial: !prev.enTrial }))} disabled={saving} className="w-12 h-7 rounded-full transition-all relative" style={{ background: clienteForm.enTrial ? 'rgba(59,130,246,0.9)' : 'rgba(107,114,128,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ position: 'absolute', top: 2, left: clienteForm.enTrial ? 24 : 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 180ms ease' }} />
              </button>
              {clienteForm.enTrial && (
                <input type="number" min="1" value={clienteForm.trialDias} onChange={(e) => setClienteForm((prev) => ({ ...prev, trialDias: e.target.value }))} style={{ ...inputStyle, width: 100 }} disabled={saving} onFocus={focusInput} onBlur={blurInput} />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleCrearCliente} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
              {saving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</> : <>Crear gym cliente</>}
            </button>
            <button onClick={resetForm} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-gray-400 font-medium mb-1">Todavía no hay gyms registrados</p>
          <p className="text-gray-600 text-sm">Usa el botón superior para dar de alta el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="rounded-xl p-4"
              style={{
                background: 'linear-gradient(145deg, #0D1117, #111827)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-[15px]">{cliente.nombre}</p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: cliente.activo ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${cliente.activo ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                        color: cliente.activo ? '#34d399' : '#f87171',
                      }}
                    >
                      {cliente.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    {cliente.en_trial && (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.15)',
                          color: '#fbbf24',
                        }}
                      >
                        TRIAL
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
                    <span>Slug: {cliente.slug}</span>
                    <span>Admin: {cliente.admin_nombre || 'Sin nombre'}</span>
                    <span>Email: {cliente.admin_email || 'Sin correo'}</span>
                    {cliente.ciudad && <span>Ciudad: {cliente.ciudad}</span>}
                    {cliente.telefono && <span>Teléfono: {cliente.telefono}</span>}
                    {cliente.trial_end && <span>Trial hasta: {new Date(cliente.trial_end).toLocaleDateString('es-VE')}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-600 mb-3">
                    <p>Creado</p>
                    <p>{new Date(cliente.created_at).toLocaleDateString('es-VE')}</p>
                  </div>
                  <button
                    onClick={() => startEdit(cliente)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }}
                  >
                    Editar
                  </button>
                </div>
              </div>

              {editingClienteId === cliente.id && editForm && (
                <ClienteEditor
                  cliente={cliente}
                  form={editForm}
                  setForm={setEditForm}
                  onSave={() => handleGuardarEdicion(cliente)}
                  onCancel={cancelEdit}
                  saving={saving}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
