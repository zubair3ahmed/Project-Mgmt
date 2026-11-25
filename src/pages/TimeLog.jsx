import EmptyState from '../components/EmptyState'
import { Clock } from 'lucide-react'
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import { CountBadge } from '../components/Badge'
import Modal from '../components/Modal'
import { FormField, Input, Select, Textarea, Button } from '../components/FormField'
import useStore from '../store/useStore'
import { confirm } from '../store/useConfirm'
import useToast from '../store/useToast'
import { useAccess } from '../lib/access'

const emptyForm = { staffId: '', projectId: '', taskId: '', date: new Date().toISOString().split('T')[0], hours: '', description: '' }

export default function TimeLog() {
  const allLogs = useStore(s => s.timeLogs)
  const { isAdmin, staffId, myProjects } = useAccess()
  const timeLogs = isAdmin ? allLogs : allLogs.filter(l => l.staffId === staffId)
  const tasks = useStore(s => s.tasks)
  const staff = useStore(s => s.staff)
  const allProjects = useStore(s => s.projects)
  const projects = isAdmin ? allProjects : myProjects
  const addTimeLog = useStore(s => s.addTimeLog)
  const updateTimeLog = useStore(s => s.updateTimeLog)
  const deleteTimeLog = useStore(s => s.deleteTimeLog)

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filterStaff, setFilterStaff] = useState('all')

  const filtered = filterStaff === 'all' ? timeLogs : timeLogs.filter(t => t.staffId === filterStaff)
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
  const totalHours = filtered.reduce((s, t) => s + t.hours, 0)
  const uniqueDays = [...new Set(filtered.map(t => t.date))].length

  const projectTasks = form.projectId ? tasks.filter(t => t.projectId === form.projectId) : []

  const staffSummary = staff.map(s => {
    const logs = timeLogs.filter(t => t.staffId === s.id)
    const hours = logs.reduce((sum, t) => sum + t.hours, 0)
    return { ...s, hours }
  }).sort((a, b) => b.hours - a.hours)

  function openAdd() {
    setForm({ ...emptyForm, staffId: isAdmin ? '' : staffId })
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(log) {
    setForm({
      staffId: log.staffId, projectId: log.projectId, taskId: log.taskId,
      date: log.date, hours: String(log.hours), description: log.description || '',
    })
    setEditId(log.id)
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const data = { ...form, hours: Number(form.hours) }
    if (editId) {
      updateTimeLog(editId, data)
    } else {
      addTimeLog(data)
    }
    setShowForm(false)
  }

  async function handleDelete(id) {
    const log = timeLogs.find(l => l.id === id)
    if (!log) return
    const task = tasks.find(t => t.id === log.taskId)
    const ok = await confirm({
      title: 'Delete this time entry?',
      message: `${log.hours}h on “${task?.title || 'this task'}” (${log.date}) will be removed.`,
      details: ['The hours logged on the task will be reduced to match.'],
      confirmLabel: 'Delete entry',
      tone: 'danger',
    })
    if (!ok) return
    const snapshot = deleteTimeLog(id)
    if (snapshot) {
      useToast.getState().show({
        tone: 'danger',
        title: 'Time entry deleted',
        detail: `${log.hours}h · ${task?.title || ''}`,
        actions: [{ label: 'Undo', onClick: () => useStore.getState().restoreTimeLog(snapshot) }],
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Time Log"
        subtitle={`${totalHours} hours logged`}
        actions={<Button onClick={openAdd}><Plus size={14} /> Log Time</Button>}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {isAdmin && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {staffSummary.slice(0, 4).map(s => (
            <div key={s.id} className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={s.name} size="sm" />
                <div>
                  <p className="text-xs font-medium text-surface-800">{s.name}</p>
                  <p className="text-2xs text-surface-400">{s.role}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-surface-900 font-mono">{s.hours}h</p>
              <p className="text-2xs text-surface-400">total logged</p>
            </div>
          ))}
        </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          {isAdmin && <Select size="sm" className="w-auto min-w-40"
            value={filterStaff}
            onChange={e => setFilterStaff(e.target.value)}
          >
            <option value="all">All Staff</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>}
          <span className="flex items-center gap-2 text-sm text-surface-500"><CountBadge count={filtered.length} tone="brand" /> entries <CountBadge count={uniqueDays} /> days</span>
        </div>

        <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
          <table data-m-hide="4 5" className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Staff</th>
                <th className="text-left px-4 py-3">Project</th>
                <th className="text-left px-4 py-3">Task</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-right px-4 py-3">Hours</th>
                <th className="text-right px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(log => {
                const member = staff.find(s => s.id === log.staffId)
                const project = projects.find(p => p.id === log.projectId)
                const task = tasks.find(t => t.id === log.taskId)
                return (
                  <tr key={log.id} className="">
                    <td className="px-4 py-3 text-xs text-surface-500 font-mono">{log.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {member && <Avatar name={member.name} size="sm" />}
                        <span className="text-xs text-surface-600">{member?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500">{project?.name}</td>
                    <td className="px-4 py-3 text-xs text-surface-700 font-medium">{task?.title}</td>
                    <td className="px-4 py-3 text-xs text-surface-500 max-w-xs truncate">{log.description}</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-surface-800 text-right">{log.hours}h</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(log)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-400 hover:text-surface-600"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(log.id)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 text-surface-400 hover:text-danger"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={7} className="bg-surface-0">
                  <EmptyState compact icon={Clock} title={timeLogs.length === 0 ? 'No time logged yet' : 'No entries for this person'}
                    description={timeLogs.length === 0 ? 'Log the hours you work against a task. They feed on-time rate, utilisation and project cost.' : 'Pick another person, or log time for them.'}
                    action={{ label: 'Log time', icon: Plus, onClick: openAdd }} />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Time Entry' : 'Log Time'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
          <FormField label="Staff Member" required>
            <Select value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))} required>
              <option value="">Select staff…</option>
              {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
          )}
          <FormField label="Project" required>
            <Select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value, taskId: '' }))} required>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Task" required>
            <Select value={form.taskId} onChange={e => setForm(f => ({ ...f, taskId: e.target.value }))} required disabled={!form.projectId}>
              <option value="">Select task…</option>
              {projectTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </FormField>
            <FormField label="Hours" required>
              <Input type="number" step="0.5" min="0.5" max="12" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="4" required />
            </FormField>
          </div>
          <FormField label="Description">
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What did you work on?" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">{editId ? 'Save Changes' : 'Log Time'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
