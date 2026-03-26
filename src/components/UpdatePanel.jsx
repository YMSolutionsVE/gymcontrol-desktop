import { useAutoUpdate } from '../hooks/useAutoUpdate'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  var units = ['B', 'KB', 'MB', 'GB']
  var i = 0
  var value = bytes
  while (value >= 1024 && i < units.length - 1) {
    value = value / 1024
    i++
  }
  return value.toFixed(1) + ' ' + units[i]
}

function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond) return ''
  return formatBytes(bytesPerSecond) + '/s'
}

function ProgressBar(props) {
  var percent = props.percent || 0
  return (
    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: percent + '%',
          background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)'
        }}
      />
    </div>
  )
}

export default function UpdatePanel() {
  var u = useAutoUpdate()

  /* No mostrar nada si no hay update disponible */
  if (u.status === 'idle' || u.status === 'checking' || u.status === 'up-to-date') {
    return null
  }

  /* Error */
  if (u.status === 'error') {
    return (
      <div className="mx-6 mt-4 rounded-2xl px-5 py-4" style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.18)'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-300">Error al actualizar</p>
            <p className="text-sm text-red-400 mt-1">{u.errorMessage}</p>
          </div>
          <button
            onClick={u.checkForUpdates}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white shrink-0"
            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-6 mt-4 rounded-2xl px-5 py-5" style={{
      background: 'rgba(59,130,246,0.06)',
      border: '1px solid rgba(59,130,246,0.15)'
    }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{
              background: u.status === 'ready' ? '#34d399' : '#3b82f6',
              boxShadow: u.status === 'ready'
                ? '0 0 8px rgba(52,211,153,0.5)'
                : '0 0 8px rgba(59,130,246,0.5)'
            }} />
            <p className="text-sm font-semibold text-blue-200">
              {u.status === 'available' && 'Nueva version disponible'}
              {u.status === 'downloading' && 'Descargando actualizacion...'}
              {u.status === 'ready' && 'Actualizacion lista'}
              {u.status === 'installing' && 'Instalando...'}
            </p>
          </div>
          {u.availableVersion && (
            <p className="text-xs text-gray-400">
              {'Version ' + u.availableVersion}
              {u.releaseDate ? ' — ' + new Date(u.releaseDate).toLocaleDateString('es') : ''}
            </p>
          )}
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {u.status === 'available' && (
            <button
              onClick={u.downloadUpdate}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
            >
              Descargar e instalar
            </button>
          )}
          {u.status === 'ready' && (
            <button
              onClick={u.installUpdate}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              Reiniciar y actualizar
            </button>
          )}
          {u.status === 'installing' && (
            <div className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400" style={{
              background: 'rgba(255,255,255,0.04)'
            }}>
              Reiniciando...
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {u.status === 'downloading' && (
        <div className="mb-4">
          <ProgressBar percent={u.percent} />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {formatBytes(u.transferred) + ' / ' + formatBytes(u.total)}
            </p>
            <div className="flex items-center gap-3">
              {u.bytesPerSecond > 0 && (
                <p className="text-xs text-gray-500">{formatSpeed(u.bytesPerSecond)}</p>
              )}
              <p className="text-xs font-medium text-blue-300">{u.percent + '%'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Release notes */}
      {u.releaseNotes.length > 0 && (
        <div className="rounded-xl px-4 py-3" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <p className="text-xs font-semibold text-gray-300 mb-2">Que hay de nuevo:</p>
          <ul className="space-y-1.5">
            {u.releaseNotes.map(function (note, i) {
              return (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#3b82f6' }} />
                  <span className="text-xs text-gray-400 leading-5">{note}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}