import { CheckCircle2, Info, Trash2, UserX, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useToast from '../store/useToast'

const TONES = {
  success: { Icon: CheckCircle2, color: 'text-success-border' },
  danger: { Icon: Trash2, color: 'text-danger-border' },
  warning: { Icon: UserX, color: 'text-warning-border' },
  info: { Icon: Info, color: 'text-brand-300' },
}

export default function Toast() {
  const toast = useToast(s => s.toast)
  const hide = useToast(s => s.hide)
  const navigate = useNavigate()
  if (!toast) return null
  const { Icon, color } = TONES[toast.tone] || TONES.success

  return (
    <div key={toast.id} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-xl w-[calc(100%-3rem)]" role="status" aria-live="polite">
      <div className="flex items-center gap-3 bg-surface-900 text-white rounded-lg shadow-xl pl-4 pr-2 py-3">
        <Icon size={20} className={`${color} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{toast.title}</p>
          {toast.detail && <p className="text-xs text-surface-300 truncate">{toast.detail}</p>}
        </div>
        {toast.actions?.map(a => (
          <button
            key={a.label}
            type="button"
            onClick={() => { a.to ? navigate(a.to) : a.onClick?.(); hide() }}
            className="h-8 px-3 rounded-md text-sm font-semibold text-white hover:bg-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-colors"
          >
            {a.label}
          </button>
        ))}
        <button type="button" onClick={hide} aria-label="Dismiss notification" className="w-8 h-8 flex items-center justify-center rounded-md text-surface-400 hover:bg-surface-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
