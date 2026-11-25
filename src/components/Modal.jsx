import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

const stack = []
let scrollLocks = 0
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ open, onClose, title, children, wide, footer }) {
  const ref = useRef(null)
  const id = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const openerRef = useRef(null)
  const wasOpen = useRef(false)
  // Capture the opener during render: a child's autoFocus would otherwise run first.
  if (open && !wasOpen.current) { openerRef.current = document.activeElement; wasOpen.current = true }
  if (!open) wasOpen.current = false

  useEffect(() => {
    if (!open) return
    stack.push(id)
    scrollLocks += 1
    document.body.style.overflow = 'hidden'
    const target = ref.current?.querySelector('[data-autofocus]')
    if (target) target.focus()
    else if (ref.current && !ref.current.contains(document.activeElement)) ref.current.focus()
    return () => {
      stack.splice(stack.indexOf(id), 1)
      scrollLocks -= 1
      if (scrollLocks === 0) document.body.style.overflow = ''
      const opener = openerRef.current
      if (opener && document.contains(opener)) opener.focus?.()
    }
  }, [open, id])

  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (stack[stack.length - 1] !== id) return
      if (document.querySelector('[role="listbox"], [role="menu"]')) return
      closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, id])

  if (!open) return null

  function trapTab(e) {
    if (e.key !== 'Tab' || !ref.current) return
    const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]">
      <div className="absolute inset-0 bg-surface-900/40" onMouseDown={() => closeRef.current()} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        onKeyDown={trapTab}
        className={`relative flex flex-col bg-surface-0 rounded-xl border border-surface-200 shadow-2xl max-h-[84vh] outline-none ${wide ? 'w-[640px]' : 'w-[480px]'} max-w-[calc(100%-2rem)]`}
      >
        <div className="flex items-center justify-between gap-4 pl-6 pr-4 py-4 border-b border-surface-200 shrink-0">
          <h2 id={`${id}-title`} className="text-base font-semibold text-surface-900 truncate">{title}</h2>
          <button
            type="button"
            onClick={() => closeRef.current()}
            aria-label="Close dialog"
            title="Close (Esc)"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-surface-200 bg-surface-0 rounded-b-xl shrink-0 flex items-center justify-between gap-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
