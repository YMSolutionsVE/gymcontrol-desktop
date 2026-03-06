export default function StatusBadge({ fechaVencimiento, sesionesTotal, sesionesRestantes }) {
  // Plan por sesiones
  if (sesionesTotal !== null && sesionesTotal !== undefined) {
    if (!sesionesRestantes || sesionesRestantes <= 0) {
      return (
        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
          Agotado
        </span>
      )
    }
    if (sesionesRestantes <= 2) {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
          Pocas sesiones
        </span>
      )
    }
    return (
      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
        Al día
      </span>
    )
  }

  // Plan por días
  if (!fechaVencimiento) {
    return (
      <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
        Sin plan
      </span>
    )
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fechaVencimiento + 'T00:00:00')
  const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))

  if (dias < 0) {
    return (
      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
        Vencido
      </span>
    )
  }

  if (dias <= 3) {
    return (
      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
        Por vencer
      </span>
    )
  }

  return (
    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
      Al día
    </span>
  )
}
