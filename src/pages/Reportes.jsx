import React, { useState, useEffect, useCallback } from 'react'
import { getResumenDiario } from '../services/reportesService'
import { obtenerResumenHoy, cerrarDia, obtenerCierrePorFecha } from '../services/cierreCajaService'
import { getIngresosPorRango, getAsistenciasPorRango, getMetricasResumen } from '../services/graficosService'
import { useAuth } from '../context/AuthContext'

import MetricasResumen from '../components/reportes/MetricasResumen'
import GraficoIngresos from '../components/reportes/GraficoIngresos'
import GraficoAsistencias from '../components/reportes/GraficoAsistencias'

import { exportarCierreCajaPDF } from '../services/exportService'
import { exportarCierresPeriodoPDF } from '../services/exportPeriodosService'
import { exportarCierresPorPeriodoCSV } from '../services/exportPeriodosCSVService'

const hoyStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })

const calcRango = (id) => {
  const h = new Date()
  const hasta = hoyStr()
  let d
  switch (id) {
    case 'hoy':   return { desde: hasta, hasta }
    case '7d':    d = new Date(); d.setDate(h.getDate() - 6); break
    case '30d':   d = new Date(); d.setDate(h.getDate() - 29); break
    case '90d':   d = new Date(); d.setMonth(h.getMonth() - 3); break
    case '1a':    d = new Date(); d.setFullYear(h.getFullYear() - 1); break
    default:      return null
  }
  return { desde: d.toISOString().split('T')[0], hasta }
}

const calcRangoAnterior = (desde, hasta) => {
  const d1 = new Date(desde + 'T00:00:00')
  const d2 = new Date(hasta + 'T00:00:00')
  const dias = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
  const prevHasta = new Date(d1); prevHasta.setDate(prevHasta.getDate() - 1)
  const prevDesde = new Date(prevHasta); prevDesde.setDate(prevDesde.getDate() - dias)
  return { desde: prevDesde.toISOString().split('T')[0], hasta: prevHasta.toISOString().split('T')[0] }
}

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy' },
  { id: '7d',     label: '7 días' },
  { id: '30d',    label: '30 días' },
  { id: '90d',    label: '3 meses' },
  { id: '1a',     label: '1 año' },
  { id: 'custom', label: 'Personalizado' },
]

const formatPeriodoLabel = (id, desde, hasta) => {
  switch (id) {
    case 'hoy':    return 'Hoy — ' + hasta
    case '7d':     return 'Últimos 7 días'
    case '30d':    return 'Últimos 30 días'
    case '90d':    return 'Últimos 3 meses'
    case '1a':     return 'Último año'
    case 'custom': return desde + ' → ' + hasta
    default: return ''
  }
}

export default function Reportes() {
  const { user, gymId, gymNombre } = useAuth()

  const [periodoActivo, setPeriodoActivo] = useState('7d')
  const initRango = calcRango('7d')
  const [desde, setDesde] = useState(initRango.desde)
  const [hasta, setHasta] = useState(initRango.hasta)

  const [compararPeriodo, setCompararPeriodo] = useState(false)
  const [metricasAnteriores, setMetricasAnteriores] = useState(null)
  const [datosIngresosAnt, setDatosIngresosAnt] = useState([])
  const [datosAsistenciasAnt, setDatosAsistenciasAnt] = useState([])

  const [actividad, setActividad] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarCierre, setMostrarCierre] = useState(false)
  const [resumenHoy, setResumenHoy] = useState(null)
  const [cierreConsultado, setCierreConsultado] = useState(null)
  const [cerrando, setCerrando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [datosIngresos, setDatosIngresos] = useState([])
  const [datosAsistencias, setDatosAsistencias] = useState([])
  const [metricas, setMetricas] = useState({ totalUSD: 0, totalBS: 0, totalAsistencias: 0 })

  const [periodoExportacion, setPeriodoExportacion] = useState('semana')
  const [fechaCierreEspecifica, setFechaCierreEspecifica] = useState('')

  const cargarTodo = useCallback(async (d, h) => {
    if (!gymId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [res, ing, asi, met] = await Promise.all([
        getResumenDiario(d, h, gymId),
        getIngresosPorRango(d, h, gymId),
        getAsistenciasPorRango(d, h, gymId),
        getMetricasResumen(d, h, gymId),
      ])
      if (res.success) setActividad(res.data)
      if (ing.success) setDatosIngresos(ing.data)
      if (asi.success) setDatosAsistencias(asi.data)
      if (met.success) setMetricas(met.data)
    } catch (err) {
      console.error('Reportes.jsx: error inesperado en cargarTodo:', err)
    } finally {
      setLoading(false)
    }
  }, [gymId])

  const cargarComparacion = useCallback(async (d, h) => {
    const prev = calcRangoAnterior(d, h)
    const [ing, asi, met] = await Promise.all([
      getIngresosPorRango(prev.desde, prev.hasta, gymId),
      getAsistenciasPorRango(prev.desde, prev.hasta, gymId),
      getMetricasResumen(prev.desde, prev.hasta, gymId),
    ])
    if (ing.success) setDatosIngresosAnt(ing.data)
    if (asi.success) setDatosAsistenciasAnt(asi.data)
    if (met.success) setMetricasAnteriores(met.data)
  }, [gymId])

  useEffect(() => {
    cargarTodo(desde, hasta)
  }, [desde, hasta, cargarTodo])

  useEffect(() => {
    if (compararPeriodo) {
      cargarComparacion(desde, hasta)
    } else {
      setMetricasAnteriores(null)
      setDatosIngresosAnt([])
      setDatosAsistenciasAnt([])
    }
  }, [compararPeriodo, desde, hasta, cargarComparacion])

  const handlePeriodo = (id) => {
    setPeriodoActivo(id)
    if (id !== 'custom') {
      const r = calcRango(id)
      if (r) { setDesde(r.desde); setHasta(r.hasta) }
    }
  }

  const handleCustomDesde = (e) => { setDesde(e.target.value); setPeriodoActivo('custom') }
  const handleCustomHasta = (e) => { setHasta(e.target.value); setPeriodoActivo('custom') }

  const abrirCierreHoy = async () => {
    const data = await obtenerResumenHoy(gymId)
    if (!data) return
    setResumenHoy(data); setCierreConsultado(null); setMostrarCierre(true)
  }

  const confirmarCierre = async () => {
    setCerrando(true)
    const res = await cerrarDia(user.id, resumenHoy, gymId)
    if (res.success) {
      setMensaje({ text: 'Cierre guardado correctamente', type: 'success' })
      setMostrarCierre(false)
      cargarTodo(desde, hasta)
    } else {
      setMensaje({ text: res.error, type: 'error' })
    }
    setCerrando(false)
    setTimeout(() => setMensaje(null), 4000)
  }

  const consultarCierre = async (fecha) => {
    const res = await obtenerCierrePorFecha(fecha, gymId)
    if (res.success) { setCierreConsultado(res.data); setResumenHoy(null); setMostrarCierre(true) }
  }

  const cierre = resumenHoy || cierreConsultado
  const esCierreNuevo = !!resumenHoy && !cierreConsultado

  const periodoExport = [
    { id: 'semana', label: 'Semana' }, { id: 'mes', label: 'Mes' },
    { id: '3m', label: '3 meses' }, { id: '6m', label: '6 meses' }, { id: '1a', label: '1 año' }
  ]

  const exportarPeriodoPDF = async () => {
    try {
      await exportarCierresPeriodoPDF(periodoExportacion, gymId, gymNombre)
    } catch (err) {
      setMensaje({ text: err.message || 'Error al exportar PDF', type: 'error' })
      setTimeout(() => setMensaje(null), 4000)
    }
  }

  const exportarPeriodoCSV = async () => {
    try {
      await exportarCierresPorPeriodoCSV(periodoExportacion, gymId, gymNombre)
    } catch (err) {
      setMensaje({ text: err.message || 'Error al exportar XLSX', type: 'error' })
      setTimeout(() => setMensaje(null), 4000)
    }
  }

  const calcVariation = (current, previous) => {
    if (!previous || previous === 0) return null
    return ((current - previous) / previous * 100).toFixed(1)
  }

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Dashboard financiero y cierres</p>
        </div>
        <button
          onClick={abrirCierreHoy}
          className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Cierre del día
        </button>
      </div>

      {/* Period filter */}
      <div className="bg-[#0D1117] rounded-xl border border-white/[0.06] p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-1.5">
            {PERIODOS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePeriodo(p.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  periodoActivo === p.id
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25 shadow-[0_0_8px_rgba(59,130,246,0.1)]'
                    : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodoActivo === 'custom' && (
            <>
              <div className="h-6 w-px bg-white/[0.06]" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={desde}
                  onChange={handleCustomDesde}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:border-blue-500/40 focus:outline-none transition-colors [color-scheme:dark]"
                />
                <span className="text-gray-600 text-xs">→</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={handleCustomHasta}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:border-blue-500/40 focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </>
          )}

          <div className="h-6 w-px bg-white/[0.06]" />

          <button
            onClick={() => setCompararPeriodo(!compararPeriodo)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              compararPeriodo
                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-gray-400 hover:bg-white/[0.06]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
            Comparar período anterior
          </button>

          <span className="text-gray-500 text-[11px] ml-auto tabular-nums">
            {formatPeriodoLabel(periodoActivo, desde, hasta)}
          </span>
        </div>
      </div>

      {mensaje && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 ${
          mensaje.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
          {mensaje.text}
        </div>
      )}

      <MetricasResumen
        totalUSD={metricas.totalUSD}
        totalBS={metricas.totalBS}
        totalAsistencias={metricas.totalAsistencias}
        periodoLabel={formatPeriodoLabel(periodoActivo, desde, hasta)}
        variacionUSD={compararPeriodo && metricasAnteriores ? calcVariation(metricas.totalUSD, metricasAnteriores.totalUSD) : null}
        variacionBS={compararPeriodo && metricasAnteriores ? calcVariation(metricas.totalBS, metricasAnteriores.totalBS) : null}
        variacionAsistencias={compararPeriodo && metricasAnteriores ? calcVariation(metricas.totalAsistencias, metricasAnteriores.totalAsistencias) : null}
      />

      <div className="mb-8 space-y-4">
        <GraficoIngresos
          datos={datosIngresos}
          datosComparacion={compararPeriodo ? datosIngresosAnt : null}
        />
        <GraficoAsistencias
          datos={datosAsistencias}
          datosComparacion={compararPeriodo ? datosAsistenciasAnt : null}
        />
      </div>

      {/* Daily activity */}
      <div className="bg-[#0D1117] rounded-xl border border-white/[0.06] overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Actividad diaria</h3>
          <span className="text-gray-600 text-[10px] tabular-nums">{actividad.length} día{actividad.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[300px] overflow-y-auto">
          {!loading && actividad.map(dia => (
            <div
              key={dia.fecha}
              onClick={() => consultarCierre(dia.fecha)}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <span className="text-gray-300 text-sm tabular-nums">{dia.fecha}</span>
              <div className="flex items-center gap-8">
                <span className="text-emerald-400 text-sm font-medium tabular-nums">
                  Bs {Number(dia.total_bs || 0).toFixed(2)}
                </span>
                <span className="text-gray-400 text-sm tabular-nums w-28 text-right">
                  {dia.asistencias} asistencia{dia.asistencias !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
          {!loading && actividad.length === 0 && (
            <p className="text-gray-600 text-center py-6 text-sm">Sin actividad en este período</p>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="bg-[#0D1117] rounded-xl border border-white/[0.06] p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Exportar reportes</h3>

        {/* Export by period */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {periodoExport.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodoExportacion(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  periodoExportacion === p.id
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                    : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <button onClick={exportarPeriodoPDF} className="px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            PDF
          </button>
          <button onClick={exportarPeriodoCSV} className="px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            XLSX
          </button>
        </div>

        {/* Export by specific date */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.04]">
          <span className="text-gray-500 text-xs font-medium shrink-0">Cierre por fecha:</span>
          <input
            type="date"
            value={fechaCierreEspecifica}
            max={hoyStr()}
            onChange={(e) => setFechaCierreEspecifica(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:border-blue-500/40 focus:outline-none transition-colors [color-scheme:dark]"
          />
          <button
            onClick={() => fechaCierreEspecifica && consultarCierre(fechaCierreEspecifica)}
            disabled={!fechaCierreEspecifica}
            className="px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Ver y exportar PDF
          </button>
        </div>
      </div>

      {/* Cierre modal */}
      {mostrarCierre && cierre && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-white/[0.08] w-full max-w-5xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">Cierre del día</h2>
                <p className="text-gray-500 text-xs mt-0.5">{cierre.fecha || hoyStr()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportarCierreCajaPDF(cierre, cierre.fecha, gymNombre)}
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  Exportar PDF
                </button>
                <button
                  onClick={() => setMostrarCierre(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="relative overflow-hidden bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-l-xl" />
                  <p className="text-gray-400 text-xs font-medium mb-1 pl-2">Total USD</p>
                  <p className="text-emerald-400 font-bold text-2xl pl-2 tabular-nums">{'$' + Number(cierre.total_usd || cierre.totalUSD || 0).toFixed(2)}</p>
                </div>
                <div className="relative overflow-hidden bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-green-500 to-green-600 rounded-l-xl" />
                  <p className="text-gray-400 text-xs font-medium mb-1 pl-2">Total Bs</p>
                  <p className="text-green-400 font-bold text-2xl pl-2 tabular-nums">{'Bs ' + Number(cierre.total_bs || cierre.totalBS || 0).toFixed(2)}</p>
                </div>
                <div className="relative overflow-hidden bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-500 to-blue-600 rounded-l-xl" />
                  <p className="text-gray-400 text-xs font-medium mb-1 pl-2">Asistencias</p>
                  <p className="text-blue-400 font-bold text-2xl pl-2 tabular-nums">{cierre.asistencias}</p>
                </div>
              </div>

              {cierre.detalle_metodos && Object.keys(cierre.detalle_metodos).length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Desglose por método</p>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(cierre.detalle_metodos).map(([m, v]) => (
                      <div key={m} className="bg-[#0D1117] border border-white/[0.06] rounded-lg px-4 py-3">
                        <p className="text-gray-400 text-xs capitalize mb-1">{m.replace('_', ' ')}</p>
                        <p className="text-emerald-400 font-bold tabular-nums">{'Bs ' + Number(v).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cierre.detalle_pagos && cierre.detalle_pagos.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold tracking-[0.15em] uppercase mb-3">Detalle de pagos</p>
                  <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      <span>Miembro</span><span>Cédula</span><span>Método</span><span>USD</span><span>Bs</span><span>Ref.</span>
                    </div>
                    {cierre.detalle_pagos.map((p, i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-white/[0.03] text-sm text-gray-300 hover:bg-white/[0.02]">
                        <span className="truncate">{p.socios?.nombre}</span>
                        <span className="text-gray-400">{p.socios?.cedula}</span>
                        <span className="capitalize text-gray-400">{p.metodo.replace('_', ' ')}</span>
                        <span className="tabular-nums">{'$' + Number(p.monto_usd || 0).toFixed(2)}</span>
                        <span className="tabular-nums">{'Bs ' + Number(p.monto_bs || 0).toFixed(2)}</span>
                        <span className="text-gray-500">{p.referencia || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setMostrarCierre(false)}
                className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.08] rounded-xl text-sm font-medium transition-all"
              >
                Cerrar
              </button>
              {esCierreNuevo && (
                <button
                  onClick={confirmarCierre}
                  disabled={cerrando}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  {cerrando ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Confirmar cierre
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}