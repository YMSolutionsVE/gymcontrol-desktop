import React, { useState, useRef, useEffect } from 'react'
import StatusBadge from './StatusBadge'

export default function SocioCard({ socio, onEdit, onDeactivate, onPay, onDelete, onVerMiembro, onAccesoQR, estadoPago }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const irAlPerfil = () => {
    if (onVerMiembro) onVerMiembro(socio.id)
  }

  const esPlanSesiones = socio.sesiones_total !== null && socio.sesiones_total !== undefined
  let sesionesBadgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (esPlanSesiones && socio.sesiones_restantes <= 0) sesionesBadgeClass = 'bg-red-500/10 text-red-400 border-red-500/20'
  else if (esPlanSesiones && socio.sesiones_restantes <= 2) sesionesBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'

  return (
    <div
      onClick={irAlPerfil}
      className="group relative bg-[#0D1117] rounded-xl p-4 border border-white/[0.06] flex items-center justify-between hover:border-blue-500/30 hover:bg-[#111827] cursor-pointer transition-all duration-200"
    >
      <div className="flex-1 min-w-0">
        {/* Name + badges */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <p className="text-white font-semibold text-[15px] truncate">{socio.nombre}</p>
          {esPlanSesiones ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${sesionesBadgeClass}`}>
              {socio.sesiones_restantes <= 0 ? 'Sesiones agotadas' : `${socio.sesiones_restantes}/${socio.sesiones_total} ses.`}
            </span>
          ) : (
            <StatusBadge fechaVencimiento={socio.fecha_vencimiento} />
          )}
          {socio.es_cortesia && (
            <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
              Cortesía
            </span>
          )}
          {socio.qr_acceso_activo && (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="2" y="2" width="8" height="8" rx="1" />
                <rect x="14" y="2" width="8" height="8" rx="1" />
                <rect x="2" y="14" width="8" height="8" rx="1" />
              </svg>
              QR
            </span>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            {socio.cedula}
          </span>
          {socio.telefono && (
            <span className="text-gray-500">{socio.telefono}</span>
          )}
        </div>

        {/* Plan + expiration */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="capitalize">{socio.plan_actual || 'Sin plan'}</span>
          <span className="text-gray-600">·</span>
          {socio.sesiones_total !== null && socio.sesiones_total !== undefined ? (
            <span className={socio.sesiones_restantes <= 0 ? 'text-red-400/80' : socio.sesiones_restantes <= 2 ? 'text-amber-400/80' : ''}>
              {socio.sesiones_restantes}/{socio.sesiones_total} sesiones
            </span>
          ) : (
            <span>Vence: {socio.fecha_vencimiento || '—'}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4 shrink-0" onClick={e => e.stopPropagation()}>
        {/* Payment status */}
        {estadoPago === 'pendiente' && (
          <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Pendiente
          </span>
        )}

        {estadoPago === 'pagado' && (
          <span className="px-3 py-1.5 bg-white/[0.04] text-gray-400 border border-white/[0.06] rounded-lg text-xs font-medium flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Pagado
          </span>
        )}

        {estadoPago === 'sin_pago' && onPay && (
          <button
            onClick={() => onPay(socio)}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Registrar pago
          </button>
        )}

        {/* ⋯ Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A1F2E] border border-white/[0.08] rounded-xl shadow-xl shadow-black/40 z-50 py-1 overflow-hidden">
              <button
                onClick={() => { onEdit(socio); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>

              {/* Acceso QR */}
              <button
                onClick={() => { onAccesoQR?.(socio); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 flex items-center gap-2.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                  <rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" />
                  <rect x="14" y="14" width="4" height="4" rx="0.5" />
                </svg>
                Acceso QR
              </button>

              <button
                onClick={() => { onDeactivate(socio); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
                </svg>
                Desactivar
              </button>
              <div className="border-t border-white/[0.06] my-1" />
              <button
                onClick={() => { onDelete(socio); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}