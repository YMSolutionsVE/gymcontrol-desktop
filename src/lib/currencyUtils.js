export const SUPPORTED_PLAN_CURRENCIES = ['USD', 'EUR']

export const getCurrencySymbol = (currency = 'USD') => {
  if (currency === 'EUR') return 'EUR'
  return 'USD'
}

export const getCurrencyBadge = (currency = 'USD') => {
  if (currency === 'EUR') return '€'
  return '$'
}

export const getCurrencyLabel = (currency = 'USD') => {
  if (currency === 'EUR') return 'Euro'
  return 'Dólar'
}

export const getPlanCurrency = (plan) => {
  const currency = String(plan?.moneda_referencia || 'USD').toUpperCase()
  return SUPPORTED_PLAN_CURRENCIES.includes(currency) ? currency : 'USD'
}

export const getPlanReferenceAmount = (plan) => {
  const amount = Number.parseFloat(plan?.precio_usd)
  return Number.isFinite(amount) ? amount : 0
}

export const getRateForCurrency = (config, currency = 'USD') => {
  if (currency === 'EUR') return Number(config?.tasa_eur) || 0
  return Number(config?.tasa_bcv) || 0
}

export const convertForeignToBs = (amount, currency, config) => {
  const numericAmount = Number.parseFloat(amount) || 0
  const rate = getRateForCurrency(config, currency)
  if (!numericAmount || !rate) return 0
  return Math.round(numericAmount * rate * 100) / 100
}

export const convertForeignToUsdNormalized = (amount, currency, config) => {
  const numericAmount = Number.parseFloat(amount) || 0
  if (!numericAmount) return 0
  if (currency === 'USD') return numericAmount

  const tasaBcv = Number(config?.tasa_bcv) || 0
  const tasaEur = Number(config?.tasa_eur) || 0
  if (!tasaBcv || !tasaEur) return 0

  return Math.round(((numericAmount * tasaEur) / tasaBcv) * 100) / 100
}

export const getPlanBsEquivalent = (plan, config) => {
  return convertForeignToBs(getPlanReferenceAmount(plan), getPlanCurrency(plan), config)
}

export const formatMoney = (amount) => {
  const numericAmount = Number.parseFloat(amount) || 0
  return numericAmount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Agrupa un array de pagos por moneda_divisa.
 * Retorna { USD: { totalDivisa, totalBs, count }, EUR: { ... } }
 */
export const agruparPagosPorMoneda = (pagos = []) => {
  const resultado = {}

  pagos.forEach((p) => {
    const moneda = (p.moneda_divisa || 'USD').toUpperCase()
    if (!resultado[moneda]) {
      resultado[moneda] = { totalDivisa: 0, totalBs: 0, count: 0 }
    }
    resultado[moneda].totalDivisa += Number(p.monto_divisa || p.monto_usd || 0)
    resultado[moneda].totalBs += Number(p.monto_bs || 0)
    resultado[moneda].count += 1
  })

  return resultado
}

/**
 * Calcula totales de un cierre/resumen con soporte multi-moneda.
 * Recibe el array de detalle_pagos.
 * Retorna { totalUsd, totalEur, totalBs }
 */
export const calcularTotalesMultiMoneda = (pagos = []) => {
  let totalUsd = 0
  let totalEur = 0
  let totalBs = 0

  pagos.forEach((p) => {
    const moneda = (p.moneda_divisa || 'USD').toUpperCase()
    const montoDivisa = Number(p.monto_divisa || 0)
    const montoBs = Number(p.monto_bs || 0)

    if (moneda === 'EUR') {
      totalEur += montoDivisa
    } else {
      totalUsd += montoDivisa
    }
    totalBs += montoBs
  })

  return {
    totalUsd: Math.round(totalUsd * 100) / 100,
    totalEur: Math.round(totalEur * 100) / 100,
    totalBs: Math.round(totalBs * 100) / 100,
  }
}