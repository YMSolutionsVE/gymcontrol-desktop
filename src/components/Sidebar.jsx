import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuth } from '../context/AuthContext'

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="4" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="11" width="7" height="10" rx="1" />
  </svg>
)

const IconMembers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const IconReportes = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const IconQR = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="8" height="8" rx="1" />
    <rect x="14" y="2" width="8" height="8" rx="1" />
    <rect x="2" y="14" width="8" height="8" rx="1" />
    <rect x="14" y="14" width="4" height="4" rx="0.5" />
    <line x1="22" y1="14" x2="22" y2="18" />
    <line x1="18" y1="22" x2="22" y2="22" />
  </svg>
)

export default function Sidebar({ currentPage, onNavigate }) {
  const isOnline = useOnlineStatus()
  const { logout } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
    { id: 'socios', label: 'Miembros', Icon: IconMembers },
    { id: 'asistencias', label: 'Asistencias', Icon: IconCheck },
    { id: 'reportes', label: 'Reportes', Icon: IconReportes },
  ]

  return (
    <div className="w-64 bg-[#070B14] border-r border-white/[0.06] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-7 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <img 
            src="./logo-ym-transparent.png" 
            alt="YM" 
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">GymControl</h1>
            <p className="text-[11px] text-orange-400/80 font-medium tracking-wider">YM SOLUTIONS</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 pt-6">
        <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase px-3 mb-3">
          Menu
        </p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 group relative ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full" />
                  )}
                  <item.Icon />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* QR MODULE PLACEHOLDER */}
        <div className="mt-6">
          <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase px-3 mb-3">
            Modulos
          </p>
          <div className="px-3 py-2.5 rounded-lg flex items-center gap-3 text-gray-600 cursor-default">
            <IconQR />
            <div className="flex-1">
              <span className="text-sm font-medium block">Asistencia QR</span>
              <span className="text-[10px] text-gray-700">Proximamente</span>
            </div>
            <span className="text-[9px] bg-violet-500/10 text-violet-400/60 border border-violet-500/15 px-1.5 py-0.5 rounded-md font-medium">
              SOON
            </span>
          </div>
        </div>
      </nav>

      {/* Connection status + Logout */}
      <div className="px-4 pb-5 space-y-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
          isOnline 
            ? 'text-emerald-400/80' 
            : 'text-red-400/80'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
          }`} />
          {isOnline ? 'Conectado' : 'Sin conexion'}
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesion
        </button>
      </div>
    </div>
  )
}