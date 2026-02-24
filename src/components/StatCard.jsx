import React from 'react'

const icons = {
  members: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  entry: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  dollar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
}

export default function StatCard({ title, value, subtitle, color = 'blue', icon, size = 'default' }) {
  const colorConfig = {
    blue:   { text: 'text-blue-400',   border: 'from-blue-500 to-blue-600',   bg: 'bg-blue-500/[0.06]', iconBg: 'bg-blue-500/10 text-blue-400' },
    green:  { text: 'text-emerald-400', border: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/[0.06]', iconBg: 'bg-emerald-500/10 text-emerald-400' },
    red:    { text: 'text-red-400',    border: 'from-red-500 to-red-600',    bg: 'bg-red-500/[0.06]', iconBg: 'bg-red-500/10 text-red-400' },
    yellow: { text: 'text-amber-400',  border: 'from-amber-500 to-amber-600',  bg: 'bg-amber-500/[0.06]', iconBg: 'bg-amber-500/10 text-amber-400' },
    purple: { text: 'text-violet-400', border: 'from-violet-500 to-violet-600', bg: 'bg-violet-500/[0.06]', iconBg: 'bg-violet-500/10 text-violet-400' },
  }

  const c = colorConfig[color] || colorConfig.blue
  const isLarge = size === 'large'
  const iconSvg = icon ? icons[icon] : null

  return (
    <div className={`
      relative overflow-hidden rounded-xl border border-white/[0.06] 
      bg-[#0D1117] hover:bg-[#111827] transition-all duration-300
      hover:scale-[1.02] hover:border-white/[0.1]
      ${isLarge ? 'p-6' : 'p-5'}
    `}>
      {/* Left gradient border */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${c.border} rounded-l-xl`} />

      <div className="flex items-start justify-between">
        <div className="pl-2">
          <p className="text-gray-400/80 text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
          <p className={`${isLarge ? 'text-4xl' : 'text-3xl'} font-bold ${c.text} tabular-nums`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1.5">{subtitle}</p>
          )}
        </div>
        {iconSvg && (
          <div className={`${c.iconBg} p-2 rounded-lg`}>
            {iconSvg}
          </div>
        )}
      </div>
    </div>
  )
}