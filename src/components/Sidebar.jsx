import { useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuth } from '../context/AuthContext'

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="4" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="11" width="7" height="10" rx="1" />
  </svg>
)

const IconMembers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const IconReportes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const IconGear = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const COLLAPSED = 68
const EXPANDED = 256
const EASE = '300ms cubic-bezier(0.4,0,0.2,1)'

export default function Sidebar({ currentPage, onNavigate }) {
  const isOnline = useOnlineStatus()
  const { logout, isAdmin, isSuperAdmin } = useAuth()
  const [expanded, setExpanded] = useState(false)

  const menuItems = [
    { id: 'dashboard',   label: 'Dashboard',   Icon: IconDashboard },
    { id: 'socios',      label: 'Miembros',    Icon: IconMembers   },
    { id: 'asistencias', label: 'Asistencias', Icon: IconCheck     },
    { id: 'reportes',    label: 'Reportes',    Icon: IconReportes  },
  ]

  const showConfig = isAdmin || isSuperAdmin

  // Padding-left that centers an icon of `iconW` in COLLAPSED width,
  // then shifts to `leftPad` when expanded
  const iconPl = (iconW, leftPad = 12) =>
    expanded ? leftPad : Math.floor((COLLAPSED - iconW) / 2)

  const labelStyle = {
    fontSize: 13,
    fontWeight: 500,
    opacity: expanded ? 1 : 0,
    maxWidth: expanded ? '180px' : '0px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    marginLeft: expanded ? 10 : 0,
    transition: `opacity 180ms ease, max-width ${EASE}, margin-left ${EASE}`,
    pointerEvents: 'none',
  }

  const sectionTitle = {
    fontSize: 10,
    color: '#374151',
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    padding: '0 8px',
    marginBottom: 6,
    opacity: expanded ? 1 : 0,
    maxHeight: expanded ? '20px' : '0px',
    overflow: 'hidden',
    transition: `opacity 150ms ease, max-height ${EASE}`,
  }

  const NavButton = ({ id, label, Icon: Ic }) => {
    const isActive = currentPage === id
    return (
      <button
        onClick={() => onNavigate(id)}
        title={!expanded ? label : ''}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: iconPl(18),
          paddingRight: 12,
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          background: isActive
            ? 'linear-gradient(90deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))'
            : 'transparent',
          color: isActive ? '#60a5fa' : '#6b7280',
          transition: `background 150ms ease, color 150ms ease, padding-left ${EASE}`,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.color = '#d1d5db'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#6b7280'
          }
        }}
      >
        {isActive && (
          <div style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 18, borderRadius: '0 3px 3px 0',
            background: 'linear-gradient(180deg, #3b82f6, #6366f1)',
            boxShadow: '0 0 8px rgba(59,130,246,0.4)',
          }} />
        )}
        <Ic />
        <span style={labelStyle}>{label}</span>
      </button>
    )
  }

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? EXPANDED : COLLAPSED,
        minWidth: expanded ? EXPANDED : COLLAPSED,
        flexShrink: 0,
        background: 'linear-gradient(180deg, #070B14 0%, #0a0f1c 50%, #080c16 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: `width ${EASE}, min-width ${EASE}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Subtle ambient glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 160, height: 160, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
      }} />

      {/* ── Header / Brand ── */}
      <div style={{
        paddingTop: 24, paddingBottom: 22,
        paddingLeft: iconPl(36, 20),
        paddingRight: 20,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: `padding-left ${EASE}`,
        position: 'relative',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src="./logo-ym-transparent.png"
            alt="GC"
            style={{ width: 36, height: 36, objectFit: 'contain', position: 'relative', zIndex: 1 }}
          />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            filter: 'blur(8px)', opacity: 0.25,
          }} />
        </div>
        <div style={{
          opacity: expanded ? 1 : 0,
          maxWidth: expanded ? '160px' : '0px',
          overflow: 'hidden',
          transition: `opacity 180ms ease, max-width ${EASE}`,
          whiteSpace: 'nowrap',
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.04em', margin: 0 }}>
            GymControl
          </p>
          <p style={{ fontSize: 10, color: 'rgba(251,146,60,0.85)', fontWeight: 600, letterSpacing: '0.12em', margin: 0 }}>
            YM SOLUTIONS
          </p>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav style={{ flex: 1, padding: '20px 8px 0' }}>
        <p style={sectionTitle}>Menú</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {menuItems.map((item) => (
            <li key={item.id}>
              <NavButton id={item.id} label={item.label} Icon={item.Icon} />
            </li>
          ))}
        </ul>

        {showConfig && (
          <div style={{ marginTop: 20 }}>
            <p style={sectionTitle}>Ajustes</p>
            <NavButton id="configuracion" label="Configuración" Icon={IconGear} />
          </div>
        )}
      </nav>

      {/* ── Footer: status + logout ── */}
      <div style={{ padding: '0 8px 18px' }}>
        <div style={{
          height: 1, margin: '0 4px 8px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        }} />

        {/* Conexión */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingTop: 6, paddingBottom: 6,
          paddingLeft: iconPl(7, 12),
          gap: 8,
          fontSize: 12,
          color: isOnline ? 'rgba(52,211,153,0.8)' : 'rgba(248,113,113,0.8)',
          transition: `padding-left ${EASE}`,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isOnline ? '#34d399' : '#f87171',
            }} />
            {isOnline && (
              <div
                className="animate-ping"
                style={{
                  position: 'absolute', inset: 0, width: 7, height: 7,
                  borderRadius: '50%', background: '#34d399', opacity: 0.35,
                }}
              />
            )}
          </div>
          <span style={{ ...labelStyle, marginLeft: 0, fontSize: 12, color: 'inherit', fontWeight: 400 }}>
            {isOnline ? 'Conectado' : 'Sin conexión'}
          </span>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={logout}
          title={!expanded ? 'Cerrar sesión' : ''}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingTop: 9, paddingBottom: 9,
            paddingLeft: iconPl(16, 12),
            paddingRight: 12,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: '#6b7280',
            transition: `color 150ms ease, background 150ms ease, padding-left ${EASE}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f87171'
            e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7280'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <IconLogout />
          <span style={labelStyle}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
