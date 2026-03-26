import React from 'react'
import { formatMoney, getCurrencyBadge } from '../../lib/currencyUtils'

function VariacionBadge({ valor }) {
  if (valor === null || valor === undefined) return null
  var num = parseFloat(valor)
  var positivo = num >= 0
  return (
    <span className={'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ' + (
      positivo
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    )}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        {positivo
          ? <polyline points="18 15 12 9 6 15" />
          : <polyline points="6 9 12 15 18 9" />
        }
      </svg>
      {(positivo ? '+' : '') + valor + '%'}
    </span>
  )
}

export default function MetricasResumen({
  totalUSD, totalBS, totalAsistencias,
  totalEUR,
  totalDescuentos,
  cantidadDescuentos,
  descuentosPorMoneda,
  periodoLabel,
  variacionUSD, variacionBS, variacionAsistencias,
}) {
  var tieneUSD = totalUSD > 0
  var tieneEUR = (totalEUR || 0) > 0
  var tieneDescuentos = (totalDescuentos || 0) > 0
  var descMonedas = descuentosPorMoneda || {}

  var cards = []

  if (tieneUSD) {
    cards.push({
      title: 'Total USD',
      value: '$' + formatMoney(totalUSD),
      subtitle: 'Ingresos en dólares',
      border: 'from-emerald-500 to-emerald-600',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      variacion: variacionUSD,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    })
  }

  if (tieneEUR) {
    cards.push({
      title: 'Total EUR',
      value: '€' + formatMoney(totalEUR),
      subtitle: 'Ingresos en euros',
      border: 'from-blue-500 to-blue-600',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/10 text-blue-400',
      variacion: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 6.5A8 8 0 1 0 18 17.5" />
          <line x1="4" y1="10" x2="14" y2="10" />
          <line x1="4" y1="14" x2="14" y2="14" />
        </svg>
      ),
    })
  }

  cards.push({
    title: 'Total Bs',
    value: 'Bs ' + formatMoney(totalBS),
    subtitle: 'Ingresos en bolívares',
    border: 'from-green-500 to-green-600',
    text: 'text-green-400',
    iconBg: 'bg-green-500/10 text-green-400',
    variacion: variacionBS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold" fontFamily="Arial">Bs</text>
      </svg>
    ),
  })

  cards.push({
    title: 'Asistencias',
    value: totalAsistencias,
    subtitle: 'Visitas registradas',
    border: 'from-blue-500 to-blue-600',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/10 text-blue-400',
    variacion: variacionAsistencias,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  })

  if (tieneDescuentos) {
    // Armar subtitle con desglose por moneda
    var subtitleParts = []
    Object.keys(descMonedas).forEach(function(mon) {
      subtitleParts.push(getCurrencyBadge(mon) + ' ' + formatMoney(descMonedas[mon]))
    })
    var subtitleDesc = subtitleParts.length > 0
      ? subtitleParts.join(' · ')
      : 'En el período'

    cards.push({
      title: 'Descuentos',
      value: (cantidadDescuentos || 0) + ' pagos',
      subtitle: subtitleDesc,
      border: 'from-amber-500 to-amber-600',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400',
      variacion: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    })
  }

  var gridCols = cards.length <= 3 ? 'md:grid-cols-3' : cards.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-5'

  return (
    <div className="mb-6">
      {periodoLabel && (
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-500">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-gray-500 text-xs font-medium">{periodoLabel}</span>
          {(variacionUSD !== null || variacionBS !== null) && (
            <span className="text-violet-400/60 text-[10px] ml-1">vs período anterior</span>
          )}
        </div>
      )}

      <div className={'grid grid-cols-1 ' + gridCols + ' gap-4'}>
        {cards.map(function(c) {
          return (
            <div
              key={c.title}
              className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0D1117] hover:bg-[#111827] transition-all duration-300 p-5"
            >
              <div className={'absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ' + c.border + ' rounded-l-xl'} />
              <div className="flex items-start justify-between pl-2">
                <div>
                  <p className="text-gray-400/80 text-xs font-medium uppercase tracking-wide mb-2">{c.title}</p>
                  <div className="flex items-center gap-2">
                    <p className={'text-3xl font-bold ' + c.text + ' tabular-nums'}>{c.value}</p>
                    <VariacionBadge valor={c.variacion} />
                  </div>
                  <p className="text-gray-500 text-xs mt-1.5">{c.subtitle}</p>
                </div>
                <div className={c.iconBg + ' p-2 rounded-lg'}>{c.icon}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}