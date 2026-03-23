import { useAuth } from '../context/AuthContext'
import { useDesktopUpdateNotice } from '../hooks/useDesktopUpdateNotice'

const toneStyles = {
  info: {
    background: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.18)',
    title: '#bfdbfe',
    text: '#93c5fd',
    button: '#60a5fa',
  },
  warning: {
    background: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.18)',
    title: '#fde68a',
    text: '#fbbf24',
    button: '#f59e0b',
  },
}

function NoticeCard({ title, message, tone = 'info', actions = null, notes = [] }) {
  const palette = toneStyles[tone] || toneStyles.info

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: palette.background,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: palette.title }}>{title}</p>
          <p className="text-sm leading-6" style={{ color: palette.text }}>{message}</p>
          {notes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {notes.slice(0, 3).map((note) => (
                <span
                  key={note}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    color: palette.title,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions}
      </div>
    </div>
  )
}

export default function SystemStatusBanners() {
  const { commercialNotice, isSuperAdmin } = useAuth()
  const { updateNotice, dismissUpdateNotice, openUpdateDownload } = useDesktopUpdateNotice()

  const notices = []

  if (!isSuperAdmin && commercialNotice) {
    notices.push(
      <NoticeCard
        key="commercial"
        title={commercialNotice.title}
        message={commercialNotice.message}
        tone={commercialNotice.tone}
      />
    )
  }

  if (updateNotice) {
    notices.push(
      <NoticeCard
        key="update"
        title={updateNotice.title}
        message={`${updateNotice.message} Version actual: ${updateNotice.currentVersion}. Version disponible: ${updateNotice.availableVersion}.`}
        tone={updateNotice.required ? 'warning' : 'info'}
        notes={updateNotice.notes}
        actions={(
          <div className="flex gap-2 shrink-0">
            {updateNotice.downloadUrl && (
              <button
                onClick={openUpdateDownload}
                className="px-3 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
              >
                Descargar
              </button>
            )}
            {!updateNotice.required && (
              <button
                onClick={dismissUpdateNotice}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-300"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Luego
              </button>
            )}
          </div>
        )}
      />
    )
  }

  if (notices.length === 0) return null

  return (
    <div className="px-6 pt-5 space-y-3">
      {notices}
    </div>
  )
}
