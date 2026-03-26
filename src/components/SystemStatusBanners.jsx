import { useAuth } from '../context/AuthContext'
import UpdatePanel from './UpdatePanel'

var toneStyles = {
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

function NoticeCard(props) {
  var title = props.title
  var message = props.message
  var tone = props.tone || 'info'
  var actions = props.actions || null
  var notes = props.notes || []
  var palette = toneStyles[tone] || toneStyles.info

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: palette.background,
        border: '1px solid ' + palette.border,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold mb-1" style={{ color: palette.title }}>{title}</p>
          <p className="text-sm leading-6" style={{ color: palette.text }}>{message}</p>
          {notes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {notes.slice(0, 3).map(function (note) {
                return (
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
                )
              })}
            </div>
          )}
        </div>
        {actions}
      </div>
    </div>
  )
}

export default function SystemStatusBanners() {
  var auth = useAuth()
  var commercialNotice = auth.commercialNotice
  var isSuperAdmin = auth.isSuperAdmin

  var notices = []

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

  return (
    <div>
      <UpdatePanel />
      {notices.length > 0 && (
        <div className="px-6 pt-4 space-y-3">
          {notices}
        </div>
      )}
    </div>
  )
}