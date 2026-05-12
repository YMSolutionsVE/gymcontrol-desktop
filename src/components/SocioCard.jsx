import React, { useState, useRef, useEffect } from 'react'
import StatusBadge from './StatusBadge'

export default function SocioCard({ socio, onEdit, onDeactivate, onPay, onDelete, onVerMiembro, onAccesoQR, estadoPago }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const irAlPerfil = () => { if (onVerMiembro) onVerMiembro(socio.id) }

  const esPlanSesiones = socio.sesiones_total !== null && socio.sesiones_total !== undefined
  let sesionesBadgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (esPlanSesiones && socio.sesiones_restantes <= 0) sesionesBadgeClass = 'bg-red-500/10 text-red-400 border-red-500/20'
  else if (esPlanSesiones && socio.sesiones_restantes <= 2) sesionesBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'

  return (
    <div
      onClick={irAlPerfil}
      className="group relative bg-[#111827]/40 backdrop-blur-md rounded-[20px] p-5 border border-white/5 flex flex-col justify-between hover:border-[#3B82F6]/40 hover:bg-white/5 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)]"
    >
      <div className="w-full">
        {/* FILA 1: Nombre y Menú de tres puntos */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-white font-black text-[16px] truncate drop-shadow-sm group-hover:text-[#3B82F6] transition-colors">{socio.nombre}</p>
          
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0F131A] border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={() => { onEdit(socio); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-gray-300 hover:bg-white/5 flex items-center gap-3 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Editar Atleta
                </button>
                {onAccesoQR && (
                  <button onClick={() => { onAccesoQR(socio); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-[#3B82F6] hover:bg-blue-500/10 flex items-center gap-3 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" rx="0.5" /></svg>
                    Pase QR
                  </button>
                )}
                <button onClick={() => { onDeactivate(socio); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-gray-400 hover:bg-white/5 flex items-center gap-3 transition-colors border-t border-white/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                  Desactivar
                </button>
                <button onClick={() => { onDelete(socio); setMenuOpen(false) }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-white/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FILA 2: Etiquetas Dinámicas (Badges que respiran) */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {esPlanSesiones ? (
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${sesionesBadgeClass}`}>
              {socio.sesiones_restantes <= 0 ? 'SESIONES AGOTADAS' : `${socio.sesiones_restantes}/${socio.sesiones_total} SES`}
            </span>
          ) : (
            <StatusBadge fechaVencimiento={socio.fecha_vencimiento} sesionesTotal={socio.sesiones_total} sesionesRestantes={socio.sesiones_restantes} planActual={socio.plan_actual} />
          )}
          
          {socio.es_cortesia && <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Cortesía</span>}
          {socio.qr_acceso_activo && <span className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /></svg> QR Activo</span>}
        </div>

        {/* FILA 3: Info de Contacto */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mb-3">
          <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-white/5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
            {socio.cedula}
          </span>
          {socio.telefono && <span className="text-gray-500">Tel: {socio.telefono}</span>}
        </div>

        {/* FILA 4: Plan y Vencimiento */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 border-t border-white/5 pt-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3B82F6]"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <span className="truncate max-w-[120px]">{socio.plan_actual || 'Sin Plan'}</span>
          <span className="text-white/20">•</span>
          {socio.sesiones_total !== null && socio.sesiones_total !== undefined ? (
            <span className={socio.sesiones_restantes <= 0 ? 'text-red-400' : socio.sesiones_restantes <= 2 ? 'text-amber-400' : 'text-gray-400'}>{socio.sesiones_restantes} / {socio.sesiones_total} res.</span>
          ) : (
            <span className="tabular-nums">Vence: {socio.fecha_vencimiento ? new Date(socio.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-VE') : '—'}</span>
          )}
        </div>

        {/* FILA 5: Días de asistencia (Si aplica) */}
        {esPlanSesiones && socio.dias_semana && socio.dias_semana.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {socio.dias_semana.map((dia) => (
              <span key={dia} className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                {dia}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FILA FINAL: Estado de Pago / Botón Acción */}
      <div className="flex items-center justify-end border-t border-white/10 pt-4 mt-auto" onClick={(e) => e.stopPropagation()}>
        {estadoPago === 'pendiente' && (
          <span className="w-full justify-center px-4 py-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl text-[12px] font-black uppercase tracking-wider flex items-center gap-2 shadow-inner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Deuda Pendiente
          </span>
        )}

        {estadoPago === 'pagado' && (
          <span className="w-full justify-center px-4 py-2.5 bg-black/40 text-[#10B981] border border-white/5 rounded-xl text-[12px] font-black uppercase tracking-wider flex items-center gap-2 shadow-inner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            Solvente
          </span>
        )}

        {estadoPago === 'sin_pago' && onPay && (
          <button
            onClick={() => onPay(socio)}
            className="w-full justify-center px-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-black border border-[#10B981]/50 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            Registrar Pago
          </button>
        )}
      </div>
    </div>
  )
}
