export const generarReporteId = ({ tipo, fechaDesde, fechaHasta }) => {
  const ahora = new Date()
  const y = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  const h = String(ahora.getHours()).padStart(2, '0')
  const min = String(ahora.getMinutes()).padStart(2, '0')

  // Ej: YM-GYM-20260214-1530-DIA
  return `YM-GYM-${y}${m}${d}-${h}${min}-${tipo.toUpperCase()}`
}

export const construirMetadatosReporte = ({
  tipo,
  fechaDesde,
  fechaHasta,
  usuario
}) => {
  return {
    tipo,
    fechaDesde,
    fechaHasta,
    generadoEl: new Date().toISOString(),
    generadoPor: usuario?.email || usuario?.id || 'sistema'
  }
}
