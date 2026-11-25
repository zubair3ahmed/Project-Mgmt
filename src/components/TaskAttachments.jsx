import { DropZone, AttachmentList } from './Attachments'
import { CountBadge } from './Badge'
import useStore from '../store/useStore'
import useAuth from '../store/useAuth'

export default function TaskAttachments({ taskId }) {
  const task = useStore(s => s.tasks.find(t => t.id === taskId))
  const addAttachments = useStore(s => s.addAttachments)
  const removeAttachment = useStore(s => s.removeAttachment)
  const user = useAuth(s => s.user)
  const isAdmin = user?.role === 'admin'
  const myId = user?.staffId || 'ADMIN'
  const items = task?.attachments || []

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
        Attachments {items.length > 0 && <CountBadge count={items.length} tone="brand" />}
      </h3>
      <AttachmentList
        items={items}
        canRemove={a => isAdmin || a.addedById === myId}
        onRemove={a => removeAttachment(taskId, a.id)}
      />
      <DropZone compact count={items.length} onAdd={atts => addAttachments(taskId, atts)} />
    </section>
  )
}
