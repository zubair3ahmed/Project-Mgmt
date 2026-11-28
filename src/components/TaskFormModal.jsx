import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, CornerDownLeft } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import Avatar from './Avatar'
import { FormField, Input, Select, Textarea, Button, Checkbox } from './FormField'
import useStore from '../store/useStore'
import useToast from '../store/useToast'
import { AutoTag, SmartSummary, Starters } from './SmartFill'
import { DropZone, AttachmentList } from './Attachments'
import { useAccess } from '../lib/access'
import { addDays, iso, parseTaskText, suggestAssignees, TYPE_HOURS } from '../lib/smartTask'
import { milestoneProgress } from '../lib/payments'

const TYPES = [
  ['design', 'Design'], ['drafting', 'Drafting'], ['review', 'Review / QC'], ['analysis', 'Analysis'],
  ['estimation', 'Estimation'], ['report', 'Report'], ['site-visit', 'Site Visit'], ['coordination', 'Coordination'],
]
const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const STATUSES = [['backlog', 'Backlog'], ['todo', 'To Do'], ['in-progress', 'In Progress'], ['review', 'Review'], ['done', 'Done']]
const AUTO_KEYS = ['projectId', 'assigneeId', 'priority', 'dueDate', 'estimatedHours', 'type', 'tags']
const DEFAULTS = {
  raw: '', projectId: '', assigneeId: '', reporterId: '', type: 'design', priority: 'medium', status: 'backlog',
  dueDate: '', estimatedHours: '', tags: '', description: '', milestoneId: '',
}

let lastProjectId = ''

function Chip({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'h-8 px-3 rounded-md border text-sm font-medium capitalize whitespace-nowrap transition-colors',
        active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-surface-300 bg-surface-0 text-surface-600 hover:bg-surface-50',
        className
      )}
    >
      {children}
    </button>
  )
}

const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export default function TaskFormModal({ open, onClose, task, presetStatus, defaultProjectId, defaultMilestoneId }) {
  const allProjects = useStore(s => s.projects)
  const { isAdmin, staffId, myProjects, writableProjects } = useAccess()
  // new jobs can only go into projects where this person has write access
  const projects = isAdmin ? allProjects : task ? myProjects : writableProjects
  const staff = useStore(s => s.staff)
  const tasks = useStore(s => s.tasks)
  const allMilestones = useStore(s => s.milestones)
  const addTask = useStore(s => s.addTask)
  const updateTask = useStore(s => s.updateTask)
  const addAttachments = useStore(s => s.addAttachments)

  const editing = !!task
  const ctx = useMemo(() => ({ projects, staff, tasks, meId: staffId }), [projects, staff, tasks, staffId])
  const touched = useRef(new Set())
  const fromText = useRef(new Set())
  const [form, setForm] = useState(DEFAULTS)
  const [errors, setErrors] = useState({})
  const [more, setMore] = useState(false)
  const [another, setAnother] = useState(false)
  const [created, setCreated] = useState(0)
  const [attachments, setAttachments] = useState([])

  function autofill(f) {
    const n = { ...f }
    const { found } = parseTaskText(f.raw, ctx)
    for (const k of AUTO_KEYS) {
      if (touched.current.has(k)) continue
      if (found[k] !== undefined) {
        n[k] = k === 'tags' ? found.tags.join(', ') : found[k]
        fromText.current.add(k)
      } else if (fromText.current.has(k)) {
        n[k] = DEFAULTS[k]
        fromText.current.delete(k)
      }
    }
    if (!touched.current.has('estimatedHours') && found.estimatedHours === undefined) n.estimatedHours = TYPE_HOURS[n.type]
    if (!isAdmin) {
      n.assigneeId = staffId
    } else if (!touched.current.has('assigneeId') && found.assigneeId === undefined) {
      n.assigneeId = suggestAssignees({ type: n.type, projectId: n.projectId, ...ctx }, 1)[0]?.id || ''
    }
    if (!touched.current.has('reporterId')) {
      n.reporterId = isAdmin ? (projects.find(p => p.id === n.projectId)?.managerId || '') : staffId
    }
    return n
  }

  useEffect(() => {
    if (!open) return
    fromText.current = new Set()
    setErrors({})
    setMore(false)
    setCreated(0)
    setAttachments([])
    if (task) {
      touched.current = new Set(Object.keys(DEFAULTS))
      setForm({
        raw: task.title, projectId: task.projectId, assigneeId: task.assigneeId, reporterId: task.reporterId || '',
        type: task.type, priority: task.priority, status: task.status, dueDate: task.dueDate || '',
        estimatedHours: String(task.estimatedHours || ''), tags: (task.tags || []).join(', '), description: task.description || '',
        milestoneId: task.milestoneId || '',
      })
      setMore(true)
    } else {
      touched.current = new Set()
      const wanted = defaultProjectId || lastProjectId
      const pid = projects.some(p => p.id === wanted) ? wanted : ''
      if (pid) touched.current.add('projectId')
      setForm(autofill({ ...DEFAULTS, status: presetStatus || 'backlog', projectId: pid, milestoneId: pid === defaultProjectId ? defaultMilestoneId || '' : '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task])

  const parsed = useMemo(() => parseTaskText(form.raw, ctx), [form.raw, ctx])
  const suggestions = useMemo(
    () => suggestAssignees({ type: form.type, projectId: form.projectId, ...ctx }, 3),
    [form.type, form.projectId, ctx]
  )

  // Completed milestones are closed to new tasks, unless this task already belongs to one.
  const projectMilestones = useMemo(() => allMilestones.filter(m => m.projectId === form.projectId && (m.status !== 'completed' || m.id === task?.milestoneId)), [allMilestones, form.projectId, task?.milestoneId])
  const ms = projectMilestones.find(m => m.id === form.milestoneId)
  const msProgress = ms ? milestoneProgress(ms, tasks) : null
  const me = staff.find(s => s.id === staffId)
  const typeLabel = TYPES.find(t => t[0] === form.type)?.[1] || form.type
  const found = parsed.found
  const isAuto = k => !editing && !touched.current.has(k) && form[k] !== '' && form[k] != null
  const words = form.raw.trim().split(/\s+/).filter(Boolean).length
  const projectUnclear = !editing && words >= 3 && !form.projectId
  const nameOf = id => staff.find(s => s.id === id)?.name
  const assumed = editing ? [] : [
    isAuto('projectId') && !found.projectId && { key: 'projectId', label: 'Project', value: projects.find(p => p.id === form.projectId)?.name, why: defaultProjectId ? 'The project you are filtering by.' : 'The last project you used.' },
    isAdmin && isAuto('assigneeId') && found.assigneeId === undefined && { key: 'assigneeId', label: 'Assignee', value: nameOf(form.assigneeId), why: `Best fit for ${typeLabel} work: matching skills, fewest open jobs.` },
    isAuto('estimatedHours') && found.estimatedHours === undefined && { key: 'estimatedHours', label: 'Estimate', value: `${form.estimatedHours}h`, why: `Typical for ${typeLabel} jobs.` },
    isAuto('reporterId') && { key: 'reporterId', label: 'Reporter', value: nameOf(form.reporterId), why: 'The project manager is the default reporter.' },
  ].filter(Boolean).map(a => ({ ...a, onUndo: () => setField(a.key, '') }))
  const notes = projectUnclear ? ["I couldn't tell which project this belongs to. Pick one below."] : []
  const starterProject = projects.find(p => p.id === form.projectId) || projects[0]
  const starters = !editing && !form.raw.trim() && starterProject ? [
    `Drawings for ${starterProject.name}${isAdmin && suggestions[0] ? ' @' + suggestions[0].name.split(' ')[0] : ''} due fri`,
    `Site visit ${starterProject.name} 4h !high`,
    `Review calculations ${starterProject.name} tomorrow`,
  ] : []

  function setField(key, value) {
    touched.current.add(key)
    setForm(f => autofill({ ...f, [key]: value, ...(key === 'projectId' && value !== f.projectId ? { milestoneId: '' } : {}) }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function onTitle(e) {
    const raw = e.target.value
    setForm(f => (editing ? { ...f, raw } : autofill({ ...f, raw })))
    setErrors(er => ({ ...er, raw: undefined }))
  }

  function submit(e) {
    e?.preventDefault()
    const title = editing ? form.raw.trim() : (parsed.title || form.raw.trim())
    const errs = {}
    if (!title) errs.raw = 'Give the job a title'
    if (!form.projectId) errs.projectId = 'Pick a project'
    if (!form.assigneeId) errs.assigneeId = 'Pick an assignee'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const data = {
      title, description: form.description, projectId: form.projectId, assigneeId: form.assigneeId,
      reporterId: form.reporterId, type: form.type, priority: form.priority, status: form.status,
      dueDate: form.dueDate, estimatedHours: Number(form.estimatedHours) || 0,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      milestoneId: ms ? ms.id : undefined,
    }
    if (editing) {
      updateTask(task.id, data)
      if (attachments.length) addAttachments(task.id, attachments)
      useToast.getState().show({
        title: 'Changes saved',
        detail: `${title}${attachments.length ? ` · ${attachments.length} file${attachments.length > 1 ? 's' : ''} added` : ''}`,
      })
      onClose()
      return
    }
    const newId = addTask({ ...data, attachments })
    useToast.getState().show({
      title: 'Job created',
      detail: `${title} · ${staff.find(x => x.id === form.assigneeId)?.name || 'Unassigned'}${form.dueDate ? ' · due ' + fmtDate(form.dueDate) : ''}${attachments.length ? ` · ${attachments.length} file${attachments.length > 1 ? 's' : ''}` : ''}`,
      actions: [{ label: 'Undo', onClick: () => useStore.getState().deleteTask(newId) }],
    })
    lastProjectId = form.projectId
    if (another) {
      fromText.current = new Set()
      touched.current = new Set(['projectId'])
      setForm(autofill({ ...DEFAULTS, status: form.status, projectId: form.projectId }))
      setCreated(c => c + 1)
      setAttachments([])
    } else {
      onClose()
    }
  }

  const detected = []
  if (!editing && form.raw) {
    const f = parsed.found
    if (f.projectId) detected.push(projects.find(p => p.id === f.projectId)?.name)
    if (f.assigneeId) detected.push('@' + staff.find(s => s.id === f.assigneeId)?.name)
    if (f.priority) detected.push(f.priority + ' priority')
    if (f.dueDate) detected.push('due ' + fmtDate(f.dueDate))
    if (f.estimatedHours) detected.push(f.estimatedHours + 'h')
    if (f.type) detected.push(TYPES.find(t => t[0] === f.type)?.[1])
  }

  const today = iso(new Date())
  const activeStaff = staff.filter(s => s.status === 'active')

  const footer = (
    <>
      <div className="flex items-center gap-4 min-w-0">
        {!editing && <Checkbox checked={another} onChange={e => setAnother(e.target.checked)} label="Create another" />}
        {created > 0 && <span className="text-sm text-success-dark font-medium">Job created</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:flex items-center gap-1 text-xs text-surface-400 mr-1"><kbd className="font-sans">⌘</kbd><CornerDownLeft size={12} /></span>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="task-form">{editing ? 'Save Changes' : 'Create Job'}</Button>
      </div>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Job' : 'New Job'} wide footer={footer}>
      <form
        id="task-form"
        onSubmit={submit}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e) }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            value={form.raw}
            onChange={onTitle}
            placeholder="What needs to be done?"
            className={clsx('h-12 text-base', errors.raw && 'border-danger')}
          />
          {errors.raw && <p className="text-xs text-danger">{errors.raw}</p>}
        </div>

        <Starters items={starters} onPick={t => onTitle({ target: { value: t } })} />
        <SmartSummary detected={detected} assumed={assumed} notes={notes} />
        <p className="sr-only" aria-live="polite">
          {detected.length ? `Filled ${detected.length} fields from your text: ${detected.join(', ')}` : ''}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Project" required tag={projectUnclear ? <AutoTag state="review" why="Not detected in your text" /> : isAuto('projectId') ? <AutoTag why={found.projectId ? 'Matched the project name in your text' : (defaultProjectId ? 'The project you are filtering by' : 'The last project you used')} /> : null}>
            <Select value={form.projectId} onChange={e => setField('projectId', e.target.value)} className={errors.projectId && 'border-danger'}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            {errors.projectId && <p className="text-xs text-danger">{errors.projectId}</p>}
          </FormField>
          <FormField label="Assignee" required tag={isAdmin && isAuto('assigneeId') ? <AutoTag why={found.assigneeId !== undefined ? 'From your @mention' : `Best fit for ${typeLabel} work`} /> : null}>
            <Select value={form.assigneeId} disabled={!isAdmin} onChange={e => setField('assigneeId', e.target.value)} className={errors.assigneeId && 'border-danger'}>
              <option value="">Select assignee…</option>
              {activeStaff.map(s => {
                const proj = allProjects.find(p => p.id === form.projectId)
                const outside = isAdmin && proj && proj.managerId !== s.id && !(proj.teamIds || []).includes(s.id) && s.department !== 'Administration'
                return <option key={s.id} value={s.id}>{s.name}{s.id === staffId ? ' (you)' : ''} — {s.role}{outside ? ' · gets view access' : ''}</option>
              })}
            </Select>
            {errors.assigneeId && <p className="text-xs text-danger">{errors.assigneeId}</p>}
          </FormField>
        </div>

        {isAdmin && (me || suggestions.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 -mt-2">
            {me && (
              <button
                type="button"
                onClick={() => setField('assigneeId', me.id)}
                className={clsx(
                  'flex items-center gap-2 h-8 pl-1 pr-3 rounded-full border text-sm font-semibold transition-colors',
                  form.assigneeId === me.id ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-surface-300 text-surface-700 hover:bg-surface-50'
                )}
              >
                <Avatar name={me.name} size="sm" interactive={false} />
                Assign to me
              </button>
            )}
            {suggestions.filter(s => s.id !== staffId).length > 0 && <span className="text-xs text-surface-500 ml-1">Suggested</span>}
            {suggestions.filter(s => s.id !== staffId).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setField('assigneeId', s.id)}
                className={clsx(
                  'flex items-center gap-2 h-8 pl-1 pr-3 rounded-full border text-sm font-medium transition-colors',
                  form.assigneeId === s.id ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-surface-300 text-surface-600 hover:bg-surface-50'
                )}
              >
                <Avatar name={s.name} size="sm" interactive={false} />
                {s.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        <FormField label="Job type">
          <div className="flex flex-wrap gap-2">
            {TYPES.map(([v, l]) => <Chip key={v} active={form.type === v} onClick={() => setField('type', v)}>{l}</Chip>)}
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Priority">
            <div className="flex gap-2">
              {PRIORITIES.map(p => <Chip key={p} active={form.priority === p} onClick={() => setField('priority', p)}>{p}</Chip>)}
            </div>
          </FormField>
          <FormField label="Due date">
            <div className="flex flex-col gap-2">
              <Input type="date" min={today} value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} />
              <div className="flex flex-wrap gap-2">
                {[['Today', 0], ['Tomorrow', 1], ['+1 week', 7]].map(([l, n]) => (
                  <Chip key={l} active={form.dueDate === addDays(n)} onClick={() => setField('dueDate', addDays(n))}>{l}</Chip>
                ))}
              </div>
            </div>
          </FormField>
        </div>

        <FormField label="Milestone" hint={!form.projectId ? 'Pick a project first' : projectMilestones.length === 0 ? 'This project has no open milestones yet. The admin sets them up.' : 'The job counts toward this milestone. When the last one is done, the milestone completes and its payment request is raised.'}>
          <Select value={form.milestoneId} disabled={!form.projectId || projectMilestones.length === 0} onChange={e => setForm(f => ({ ...f, milestoneId: e.target.value }))}>
            <option value="">Not linked to a milestone</option>
            {projectMilestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          {msProgress && (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-surface-200 overflow-hidden"><div className="h-full bg-brand-600 rounded-full" style={{ width: `${msProgress.pct}%` }} /></div>
              <span className="text-xs text-surface-500 whitespace-nowrap">{msProgress.done} of {msProgress.total} jobs done{task?.milestoneId === ms.id ? '' : ' · this adds one'}</span>
            </div>
          )}
        </FormField>

        <FormField label="Attachments">
          <DropZone compact count={attachments.length} onAdd={atts => setAttachments(a => [...a, ...atts])} />
          <AttachmentList items={attachments} onRemove={a => { URL.revokeObjectURL(a.url); setAttachments(list => list.filter(x => x.id !== a.id)) }} />
        </FormField>

        <button
          type="button"
          onClick={() => setMore(m => !m)}
          className="flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-surface-800 w-fit"
        >
          <ChevronDown size={16} className={clsx('transition-transform', more && 'rotate-180')} />
          More options
          <span className="text-xs font-normal text-surface-400">estimate {form.estimatedHours || 0}h · reporter, status, tags, notes</span>
        </button>

        {more && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Estimated hours" hint="Pre-filled from the job type">
                <Input type="number" min="0" value={form.estimatedHours} onChange={e => setField('estimatedHours', e.target.value)} />
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onChange={e => setField('status', e.target.value)}>
                  {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Reporter" hint="Defaults to the project manager">
                <Select value={form.reporterId} onChange={e => setField('reporterId', e.target.value)}>
                  <option value="">Select reporter…</option>
                  {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Tags" hint="Comma-separated, or use #tag in the title">
                <Input value={form.tags} onChange={e => setField('tags', e.target.value)} placeholder="foundation, rcc" />
              </FormField>
            </div>
            <FormField label="Description">
              <Textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Add context, drawing refs, or notes…" />
            </FormField>
          </div>
        )}
      </form>
    </Modal>
  )
}
