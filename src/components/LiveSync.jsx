import { useEffect } from 'react'
import useAuth from '../store/useAuth'
import useStore from '../store/useStore'
import useToast from '../store/useToast'

// Another tab (say the admin's) wrote to the shared workspace. Pull it in, then tell this person
// about anything that concerns them. Works across tabs and windows of one browser; across devices
// it needs the backend in docs/BACKEND.md.
function changesFor(user, before, after) {
  const msgs = []
  const name = id => after.staff.find(s => s.id === id)?.name || 'Someone'
  const known = new Set(before.tasks.map(t => t.id))
  const prev = Object.fromEntries(before.tasks.map(t => [t.id, t]))
  if (user.role === 'member') {
    after.tasks.filter(t => t.assigneeId === user.staffId && (!known.has(t.id) || prev[t.id].assigneeId !== user.staffId)).forEach(t => msgs.push({ title: 'New task assigned to you', detail: t.title, to: '/tasks' }))
    const mine = p => p.managerId === user.staffId || (p.teamIds || []).includes(user.staffId)
    const had = new Set(before.projects.filter(mine).map(p => p.id))
    after.projects.filter(p => mine(p) && !had.has(p.id)).forEach(p => msgs.push({ title: 'You were added to a project', detail: p.name, to: '/projects' }))
  } else {
    after.tasks.filter(t => known.has(t.id) && prev[t.id].status !== 'done' && t.status === 'done').forEach(t => msgs.push({ title: `${name(t.assigneeId)} finished a task`, detail: `${t.title}${t.paymentStatus === 'due' ? ' · payment is due' : ''}`, to: '/tasks' }))
    after.tasks.filter(t => !known.has(t.id) && t.reporterId && t.reporterId !== user.staffId).forEach(t => msgs.push({ title: `${name(t.reporterId)} created a task`, detail: t.title, to: '/tasks' }))
  }
  return msgs
}

export default function LiveSync() {
  const user = useAuth(s => s.user)
  useEffect(() => {
    if (!user) return
    const onStorage = e => {
      if (e.key !== 'structflow-data') return
      const before = useStore.getState()
      Promise.resolve(useStore.persist.rehydrate()).then(() => {
        const msgs = changesFor(user, before, useStore.getState())
        if (!msgs.length) return
        const [first] = msgs
        useToast.getState().show({
          title: msgs.length > 1 ? `${first.title} (+${msgs.length - 1} more)` : first.title,
          detail: first.detail,
          tone: 'info',
          actions: [{ label: 'View', to: first.to }],
        })
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [user])
  return null
}
