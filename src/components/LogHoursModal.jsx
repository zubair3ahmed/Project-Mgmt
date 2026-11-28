import { useEffect, useState } from 'react'
import Modal from './Modal'
import { FormField, Input, Select, Textarea, Button } from './FormField'
import useStore from '../store/useStore'
import useToast from '../store/useToast'
import { useAccess, isClosed } from '../lib/access'

const today = () => new Date().toISOString().split('T')[0]

// Used from a job (preselected), from the Time Log page, and to edit an entry.
export default function LogHoursModal({ open, preset, onClose }) {
  const tasks = useStore(s => s.tasks)
  const projects = useStore(s => s.projects)
  const staff = useStore(s => s.staff)
  const addTimeLog = useStore(s => s.addTimeLog)
  const updateTimeLog = useStore(s => s.updateTimeLog)
  const { isAdmin, staffId, myProjectIds } = useAccess()
  const [form, setForm] = useState({ staffId: '', projectId: '', taskId: '', date: today(), hours: '', description: '' })
  const [error, setError] = useState('')
  const entry = preset?.entry

  useEffect(() => {
    if (!open) return
    setError('')
    if (entry) {
      setForm({ staffId: entry.staffId, projectId: entry.projectId, taskId: entry.taskId, date: entry.date, hours: String(entry.hours), description: entry.description || '' })
      return
    }
    const job = tasks.find(t => t.id === preset?.taskId)
    setForm({ staffId: isAdmin ? job?.assigneeId || '' : staffId, projectId: job?.projectId || '', taskId: job?.id || '', date: today(), hours: '', description: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset])

  // staff log against their own jobs; an admin can log against any job
  const closedIds = new Set(projects.filter(isClosed).map(p => p.id))
  const loggable = tasks.filter(t => (entry || !closedIds.has(t.projectId)) && (isAdmin ? true : t.assigneeId === staffId && myProjectIds.has(t.projectId)))
  const projectOptions = projects.filter(p => loggable.some(t => t.projectId === p.id))
  const jobOptions = loggable.filter(t => t.projectId === form.projectId)

  function submit(e) {
    e.preventDefault()
    const hours = Number(form.hours)
    if (!form.staffId || !form.taskId || !form.date || !(hours > 0)) { setError('Choose a project and job, and enter the date and hours.'); return }
    if (hours > 12) { setError('A single entry can be at most 12 hours.'); return }
    const data = { ...form, hours }
    if (entry) {
      updateTimeLog(entry.id, data)
      useToast.getState().show({ title: 'Time entry saved', detail: `${hours}h` })
    } else {
      addTimeLog(data)
      const added = useStore.getState().timeLogs.at(-1)
      const job = tasks.find(t => t.id === form.taskId)
      useToast.getState().show({
        title: `${hours}h logged`, detail: job?.title,
        actions: [{ label: 'Undo', onClick: () => useStore.getState().deleteTimeLog(added.id) }],
      })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit time entry' : 'Log hours'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {isAdmin && (
          <FormField label="Staff member" required>
            <Select value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}>
              <option value="">Select staff…</option>
              {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
        )}
        <FormField label="Project" required>
          <Select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value, taskId: '' }))}>
            <option value="">Select project…</option>
            {projectOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Job" required hint={!isAdmin && form.projectId && !jobOptions.length ? 'You have no jobs in this project.' : undefined}>
          <Select value={form.taskId} onChange={e => setForm(f => ({ ...f, taskId: e.target.value }))} disabled={!form.projectId}>
            <option value="">Select job…</option>
            {jobOptions.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" required><Input type="date" max={today()} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></FormField>
          <FormField label="Hours" required><Input type="number" step="0.5" min="0.5" max="12" data-autofocus value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="4" /></FormField>
        </div>
        <FormField label="What did you work on?"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional note" /></FormField>
        {error && <p className="text-xs text-danger" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{entry ? 'Save changes' : 'Log hours'}</Button>
        </div>
      </form>
    </Modal>
  )
}
