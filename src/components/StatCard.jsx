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

const colorConfig = {
  blue: {
    text: '#60a5fa',
    border: 'linear-gradient(180deg, #3b82f6, #2563eb)',
    glow: 'rgba(59,130,246,0.12)',
    iconBg: 'rgba(59,130,246,0.08)',
    iconBorder: 'rgba(59,130,246,0.15)',
    hoverShadow: '0 4px 24px rgba(59,130,246,0.08)',
  },
  green: {
    text: '#34d399',
    border: 'linear-gradient(180deg, #10b981, #059669)',
    glow: 'rgba(16,185,129,0.12)',
    iconBg: 'rgba(16,185,129,0.08)',
    iconBorder: 'rgba(16,185,129,0.15)',
    hoverShadow: '0 4px 24px rgba(16,185,129,0.08)',
  },
  red: {
    text: '#f87171',
    border: 'linear-gradient(180deg, #ef4444, #dc2626)',
    glow: 'rgba(239,68,68,0.12)',
    iconBg: 'rgba(239,68,68,0.08)',
    iconBorder: 'rgba(239,68,68,0.15)',
    hoverShadow: '0 4px 24px rgba(239,68,68,0.08)',
  },
  yellow: {
    text: '#fbbf24',
    border: 'linear-gradient(180deg, #f59e0b, #d97706)',
    glow: 'rgba(245,158,11,0.12)',
    iconBg: 'rgba(245,158,11,0.08)',
    iconBorder: 'rgba(245,158,11,0.15)',
    hoverShadow: '0 4px 24px rgba(245,158,11,0.08)',
  },
  purple: {
    text: '#a78bfa',
    border: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
    glow: 'rgba(139,92,246,0.12)',
    iconBg: 'rgba(139,92,246,0.08)',
    iconBorder: 'rgba(139,92,246,0.15)',
    hoverShadow: '0 4px 24px rgba(139,92,246,0.08)',
  },
}

export default function StatCard({ title, value, subtitle, color = 'blue', icon, size = 'default', stagger = 0 }) {
  const c = colorConfig[color] || colorConfig.blue
  const isLarge = size === 'large'
  const iconSvg = icon ? icons[icon] : null
  const staggerClass = stagger > 0 && stagger <= 6 ? `gc-stagger-${stagger}` : ''

  return (
    <div
      className={`relative overflow-hidden rounded-xl cursor-default ${staggerClass}`}
      style={{
        background: 'linear-gradient(145deg, #0D1117 0%, #111827 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: isLarge ? '24px' : '20px',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.boxShadow = c.hoverShadow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Left gradient border with glow */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: c.border }}
      />
      <div
        className="absolute left-0 top-[10%] bottom-[10%] w-[6px] rounded-l-xl blur-sm"
        style={{ background: c.border, opacity: 0.3 }}
      />

      {/* Subtle corner glow */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
        }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="pl-2">
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
            {title}
          </p>
          <p
            className={`${isLarge ? 'text-4xl' : 'text-3xl'} font-bold tabular-nums`}
            style={{ color: c.text }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1.5" style={{ color: '#4b5563' }}>{subtitle}</p>
          )}
        </div>
        {iconSvg && (
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: c.iconBg,
              border: `1px solid ${c.iconBorder}`,
              color: c.text,
            }}
          >
            {iconSvg}
          </div>
        )}
      </div>
    </div>
  )
}