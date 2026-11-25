import { AlertTriangle, Info } from 'lucide-react'
import Modal from './Modal'
import { Button } from './FormField'
import useConfirm from '../store/useConfirm'

export default function ConfirmDialog() {
  const options = useConfirm(s => s.options)
  const close = useConfirm(s => s.close)
  if (!options) return null
  const { title, message, details = [], confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary' } = options
  const danger = tone === 'danger'
  const Icon = danger ? AlertTriangle : Info

  return (
    <Modal
      open
      onClose={() => close(false)}
      title={title}
      footer={
        <>
          <span />
          <div className="flex gap-2">
            <Button variant="secondary" data-autofocus={danger ? true : undefined} onClick={() => close(false)}>{cancelLabel}</Button>
            <Button variant={danger ? 'danger' : 'primary'} data-autofocus={danger ? undefined : true} onClick={() => close(true)}>{confirmLabel}</Button>
          </div>
        </>
      }
    >
      <div className="flex gap-3">
        <Icon size={22} className={`shrink-0 mt-0.5 ${danger ? 'text-danger' : 'text-brand-600'}`} />
        <div className="flex flex-col gap-3 min-w-0">
          <p className="text-sm text-surface-700">{message}</p>
          {details.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-surface-600 flex flex-col gap-1">
              {details.map(d => <li key={d}>{d}</li>)}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
