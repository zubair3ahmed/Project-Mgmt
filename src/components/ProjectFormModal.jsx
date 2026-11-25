import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, CornerDownLeft, Plus } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import Avatar from './Avatar'
import { FormField, Input, Select, Textarea, Button, Alert } from './FormField'
import useStore from '../store/useStore'
import useToast from '../store/useToast'
import useAuth from '../store/useAuth'
import { AutoTag, SmartSummary, Starters } from './SmartFill'
import { DropZone, AttachmentList } from './Attachments'
import { extOf, folderFor, formatSize } from '../lib/attachments'
import { addDays, iso } from '../lib/smartTask'
import { PROJECT_TYPES, TYPE_MONTHS, addMonths, parseProjectText, suggestManager, suggestTeam, clientMatches } from '../lib/smartProject'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const STATUSES = [['planning', 'Planning'], ['in-progress', 'In Progress'], ['on-hold', 'On Hold'], ['completed', 'Completed']]
const AUTO_KEYS = ['clientId', 'managerId', 'type', 'location', 'priority', 'contractValue', 'startDate', 'endDate']
const VALUE_CHIPS = [['₹10L', 1e6], ['₹25L', 2.5e6], ['₹50L', 5e6], ['₹1Cr', 1e7], ['₹2Cr', 2e7]]
const DURATION_CHIPS = [3, 6, 12, 18]
const DEFAULTS = {
  raw: '', clientId: '', managerId: '', type: 'Residential', location: '', priority: 'medium', status: 'planning',
  contractValue: '', startDate: '', endDate: '', description: '', teamIds: [],
}

const fullINR = n => '₹' + Number(n).toLocaleString('en-IN')
const money = n => (n >= 1e7 ? `₹${+(n / 1e7).toFixed(2)}Cr` : `₹${+(n / 1e5).toFixed(2)}L`)
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

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

export default function ProjectFormModal({ open, onClose, project, onAddClient }) {
  const projects = useStore(s => s.projects)
  const staff = useStore(s => s.staff)
  const clients = useStore(s => s.clients)
  const tasks = useStore(s => s.tasks)
  const addProject = useStore(s => s.addProject)
  const updateProject = useStore(s => s.updateProject)

  const editing = !!project
  const ctx = useMemo(() => ({ clients, staff, projects, tasks }), [clients, staff, projects, tasks])
  const touched = useRef(new Set())
  const fromText = useRef(new Set())
  const clientCount = useRef(clients.length)
  const [form, setForm] = useState(DEFAULTS)
  const [errors, setErrors] = useState({})
  const [more, setMore] = useState(false)
  const [valueStage, setValueStage] = useState(null)
  const [attachments, setAttachments] = useState([])

  function autofill(f) {
    const n = { ...f }
    const { found } = parseProjectText(f.raw, ctx)
    for (const k of AUTO_KEYS) {
      if (touched.current.has(k)) continue
      if (found[k] !== undefined) { n[k] = found[k]; fromText.current.add(k) }
      else if (fromText.current.has(k)) { n[k] = DEFAULTS[k]; fromText.current.delete(k) }
    }
    if (!touched.current.has('type') && found.type === undefined) n.type = DEFAULTS.type
    if (!touched.current.has('startDate') && found.startDate === undefined) n.startDate = iso(new Date())
    if (!touched.current.has('endDate') && found.endDate === undefined) {
      const months = found.durationMonths ?? TYPE_MONTHS[n.type]
      const base = n.startDate ? new Date(n.startDate + 'T00:00:00') : new Date()
      n.endDate = addMonths(months, base)
    }
    if (!touched.current.has('managerId')) {
      n.managerId = found.managerId ?? suggestManager(ctx)[0]?.id ?? ''
    }
    if (!touched.current.has('teamIds')) {
      n.teamIds = suggestTeam({ type: n.type, managerId: n.managerId, staff, tasks }, 3).map(s => s.id)
    } else {
      n.teamIds = n.teamIds.filter(id => id !== n.managerId)
    }
    return n
  }

  useEffect(() => {
    if (!open) return
    fromText.current = new Set()
    setErrors({})
    setValueStage(null)
    setAttachments([])
    if (project) {
      touched.current = new Set([...Object.keys(DEFAULTS), 'teamIds'])
      setForm({
        raw: project.name, clientId: project.clientId, managerId: project.managerId, type: project.type, location: project.location,
        priority: project.priority, status: project.status, contractValue: String(project.contractValue), startDate: project.startDate,
        endDate: project.endDate, description: project.description || '', teamIds: [...project.teamIds],
      })
      setMore(true)
    } else {
      touched.current = new Set()
      setMore(false)
      setForm(autofill({ ...DEFAULTS }))
    }
    clientCount.current = clients.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project])

  useEffect(() => {
    if (open && clients.length > clientCount.current) setField('clientId', clients[clients.length - 1].id)
    clientCount.current = clients.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients.length])

  const parsed = useMemo(() => parseProjectText(form.raw, ctx), [form.raw, ctx])
  const managers = useMemo(() => suggestManager(ctx), [ctx])
  const teamPool = useMemo(
    () => staff.filter(s => s.status === 'active' && s.id !== form.managerId && s.department !== 'Administration'),
    [staff, form.managerId]
  )

  const found = parsed.found
  const isAuto = k => !editing && !touched.current.has(k) && form[k] !== '' && form[k] != null
  const valueFromText = !editing && fromText.current.has('contractValue') && !touched.current.has('contractValue') && Number(form.contractValue) > 0
  const matches = !editing && form.raw ? clientMatches(form.raw, clients) : []
  const clientAmbiguous = matches.length > 1 && !form.clientId
  const words = form.raw.trim().split(/\s+/).filter(Boolean).length
  const nameOf = id => staff.find(s => s.id === id)?.name
  const typeNow = form.type
  const assumed = editing ? [] : [
    isAuto('managerId') && found.managerId === undefined && { key: 'managerId', label: 'Project manager', value: nameOf(form.managerId), why: 'The project manager or lead with the fewest active projects.', onUndo: () => setField('managerId', '') },
    !touched.current.has('teamIds') && form.teamIds.length > 0 && { key: 'teamIds', label: 'Team', value: form.teamIds.map(id => nameOf(id)?.split(' ')[0]).join(', '), why: `Matched on ${typeNow.toLowerCase()} skills and current workload.`, onUndo: () => { touched.current.add('teamIds'); setForm(f => ({ ...f, teamIds: [] })) } },
    isAuto('endDate') && found.endDate === undefined && { key: 'endDate', label: 'End date', value: form.endDate && fmtDate(form.endDate), why: found.durationMonths ? `Start date plus the ${found.durationMonths} months in your text.` : `Typical ${TYPE_MONTHS[typeNow]}-month duration for ${typeNow.toLowerCase()} projects.`, onUndo: () => setField('endDate', '') },
  ].filter(Boolean)
  const notes = [
    clientAmbiguous && `Several clients match (${matches.map(c => c.name).join(', ')}). Pick one below.`,
    !editing && words >= 3 && !form.location.trim() && "I couldn't find a location. Add one below.",
  ].filter(Boolean)
  const starters = !editing && !form.raw.trim() && clients.length >= 3 ? [
    `${clients[0].name.split(' ')[0]} residential towers Bangalore ₹1.5Cr 12 months`,
    `${clients[1].name.split(' ')[0]} office park Mumbai ₹80L 9 months${managers[0] ? ' @' + managers[0].name.split(' ')[0] : ''}`,
    `${clients[2].name.split(' ')[0]} warehouse shed Pune ₹45L 6 months !high`,
  ] : []

  function setField(key, value) {
    touched.current.add(key)
    setForm(f => autofill({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function onTitle(e) {
    const raw = e.target.value
    setForm(f => (editing ? { ...f, raw } : autofill({ ...f, raw })))
    setErrors(er => ({ ...er, raw: undefined }))
    setValueStage(null)
  }

  function setDuration(months) {
    touched.current.add('endDate')
    setForm(f => ({ ...f, endDate: addMonths(months, new Date((f.startDate || iso(new Date())) + 'T00:00:00')) }))
  }

  function toggleTeam(id) {
    touched.current.add('teamIds')
    setForm(f => ({ ...f, teamIds: f.teamIds.includes(id) ? f.teamIds.filter(t => t !== id) : [...f.teamIds, id] }))
  }

  function submit(e) {
    e?.preventDefault()
    const name = editing ? form.raw.trim() : (parsed.name || form.raw.trim())
    const errs = {}
    if (!name) errs.raw = 'Give the project a name'
    if (!form.clientId) errs.clientId = 'Pick a client'
    if (!form.managerId) errs.managerId = 'Pick a project manager'
    if (!form.location.trim()) errs.location = 'Add a location'
    if (!Number(form.contractValue)) errs.contractValue = 'Add the contract value'
    if (form.endDate && form.startDate && form.endDate < form.startDate) errs.endDate = 'End date is before the start'
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (!editing && valueFromText && valueStage !== 'ok') { setValueStage('asking'); return }

    const data = {
      name, clientId: form.clientId, type: form.type, location: form.location.trim(), priority: form.priority,
      status: form.status, startDate: form.startDate, endDate: form.endDate, contractValue: Number(form.contractValue),
      description: form.description, managerId: form.managerId, teamIds: form.teamIds,
    }
    if (editing) {
      updateProject(project.id, data)
      useToast.getState().show({ title: 'Project saved', detail: name })
    }
    else {
      const newId = addProject(data)
      const me = useAuth.getState().user
      attachments.forEach(a => useStore.getState().addFile({
        name: a.name, projectId: newId, folder: folderFor(a), type: extOf(a.name) || 'file',
        size: formatSize(a.size), uploadedBy: me?.staffId || '', url: a.url,
      }))
      useToast.getState().show({
        title: 'Project created',
        detail: `${name} · ${money(data.contractValue)} · PM ${nameOf(data.managerId)}${attachments.length ? ` · ${attachments.length} file${attachments.length > 1 ? 's' : ''}` : ''}`,
        actions: [
          { label: 'View', to: `/projects/${newId}` },
          { label: 'Undo', onClick: () => useStore.getState().deleteProject(newId) },
        ],
      })
    }
    onClose()
  }

  const detected = []
  if (!editing && form.raw) {
    const f = parsed.found
    if (f.clientId) detected.push(clients.find(c => c.id === f.clientId)?.name)
    if (f.type) detected.push(f.type)
    if (f.location) detected.push(f.location)
    if (f.contractValue) detected.push(money(f.contractValue))
    if (f.managerId) detected.push('PM ' + staff.find(s => s.id === f.managerId)?.name)
    if (f.durationMonths) detected.push(f.durationMonths + ' months')
    if (f.startDate) detected.push('starts ' + fmtDate(f.startDate))
    if (f.endDate) detected.push('ends ' + fmtDate(f.endDate))
    if (f.priority) detected.push(f.priority + ' priority')
  }

  const months = form.startDate && form.endDate
    ? Math.round((new Date(form.endDate) - new Date(form.startDate)) / (30.44 * 86400000))
    : null

  const footer = (
    <>
      <p className="text-sm text-surface-500 truncate">
        {Number(form.contractValue) > 0 && <span className="font-medium text-surface-700">{money(Number(form.contractValue))}</span>}
        {Number(form.contractValue) > 0 && months != null && ' · '}
        {months != null && `${months} months`}
        {form.teamIds.length > 0 && ` · ${form.teamIds.length + 1} people`}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:flex items-center gap-1 text-xs text-surface-400 mr-1"><kbd className="font-sans">⌘</kbd><CornerDownLeft size={12} /></span>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="project-form">{editing ? 'Save Changes' : valueFromText && valueStage !== 'ok' ? 'Review & create' : 'Create Project'}</Button>
      </div>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Project' : 'New Project'} wide footer={footer}>
      <form
        id="project-form"
        onSubmit={submit}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e) }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            value={form.raw}
            onChange={onTitle}
            placeholder="Project name"
            className={clsx('h-12 text-base', errors.raw && 'border-danger')}
          />
          {errors.raw && <p className="text-xs text-danger">{errors.raw}</p>}
        </div>

        <Starters items={starters} onPick={t => onTitle({ target: { value: t } })} />
        <SmartSummary detected={detected} assumed={assumed} notes={notes} />
        <p className="sr-only" aria-live="polite">
          {detected.length ? `Filled ${detected.length} fields from your text: ${detected.join(', ')}` : ''}
        </p>
        {valueStage === 'asking' && (
          <Alert
            tone="warning"
            action={
              <div className="flex gap-2 shrink-0">
                <Button type="button" size="sm" onClick={() => { setValueStage('ok'); setTimeout(() => document.getElementById('project-form')?.requestSubmit(), 50) }}>Yes, create</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => { touched.current.add('contractValue'); setValueStage(null); document.querySelector('#project-form input[type=number]')?.focus() }}>Edit amount</Button>
              </div>
            }
          >
            I read the contract value as <strong>{fullINR(form.contractValue)}</strong> ({money(Number(form.contractValue))}). Is that right?
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Client" required tag={clientAmbiguous ? <AutoTag state="review" why="More than one client matches" /> : isAuto('clientId') ? <AutoTag why="Matched the client name in your text" /> : null}>
            <Select value={form.clientId} onChange={e => setField('clientId', e.target.value)} className={errors.clientId && 'border-danger'}>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            {errors.clientId ? <p className="text-xs text-danger">{errors.clientId}</p> : onAddClient && (
              <button type="button" onClick={onAddClient} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline w-fit">
                <Plus size={12} /> New client
              </button>
            )}
          </FormField>
          <FormField label="Project manager" required tag={isAuto('managerId') ? <AutoTag why={found.managerId !== undefined ? 'From your @mention' : 'Fewest active projects'} /> : null}>
            <Select value={form.managerId} onChange={e => setField('managerId', e.target.value)} className={errors.managerId && 'border-danger'}>
              <option value="">Select manager…</option>
              {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
            </Select>
            {errors.managerId && <p className="text-xs text-danger">{errors.managerId}</p>}
          </FormField>
        </div>

        <FormField label="Project type">
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPES.map(t => <Chip key={t} active={form.type === t} onClick={() => setField('type', t)}>{t}</Chip>)}
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Location" required tag={isAuto('location') ? <AutoTag why="Recognised in your text" /> : null}>
            <Input value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Bangalore" className={errors.location && 'border-danger'} />
            {errors.location && <p className="text-xs text-danger">{errors.location}</p>}
          </FormField>
          <FormField label="Contract value (₹)" required tag={valueFromText ? <AutoTag state="review" why="Read from your text. Please check the amount." /> : null}>
            <div className="flex flex-col gap-2">
              <Input type="number" min="0" value={form.contractValue} onChange={e => setField('contractValue', e.target.value)} placeholder="2500000" className={errors.contractValue && 'border-danger'} />
              {errors.contractValue && <p className="text-xs text-danger">{errors.contractValue}</p>}
              <div className="flex flex-wrap gap-2">
                {VALUE_CHIPS.map(([l, v]) => <Chip key={l} active={Number(form.contractValue) === v} onClick={() => setField('contractValue', v)}>{l}</Chip>)}
              </div>
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start date">
            <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
          </FormField>
          <FormField label="End date">
            <Input type="date" min={form.startDate} value={form.endDate} onChange={e => setField('endDate', e.target.value)} className={errors.endDate && 'border-danger'} />
            {errors.endDate && <p className="text-xs text-danger">{errors.endDate}</p>}
          </FormField>
        </div>
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-xs text-surface-500">Duration</span>
          {DURATION_CHIPS.map(m => <Chip key={m} active={months === m} onClick={() => setDuration(m)}>{m} months</Chip>)}
        </div>

        <FormField label="Priority">
          <div className="flex gap-2">
            {PRIORITIES.map(p => <Chip key={p} active={form.priority === p} onClick={() => setField('priority', p)}>{p}</Chip>)}
          </div>
        </FormField>

        <FormField label="Team" hint="Suggested from skills and current workload. Tap to change.">
          <div className="flex flex-wrap gap-2">
            {teamPool.map(s => {
              const on = form.teamIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleTeam(s.id)}
                  className={clsx(
                    'flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border text-sm font-medium transition-colors',
                    on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-surface-300 text-surface-600 hover:bg-surface-50'
                  )}
                >
                  <Avatar name={s.name} size="sm" interactive={false} />
                  {s.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </FormField>

        {!editing && (
          <FormField label="Attachments" hint="Work order, contract, drawings or site photos. They are filed in the project's Files.">
            <DropZone compact count={attachments.length} onAdd={atts => setAttachments(a => [...a, ...atts])} />
            <AttachmentList items={attachments} onRemove={a => { URL.revokeObjectURL(a.url); setAttachments(list => list.filter(x => x.id !== a.id)) }} />
          </FormField>
        )}

        <button
          type="button"
          onClick={() => setMore(m => !m)}
          className="flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-surface-800 w-fit"
        >
          <ChevronDown size={16} className={clsx('transition-transform', more && 'rotate-180')} />
          More options
          <span className="text-xs font-normal text-surface-400">status, description</span>
        </button>

        {more && (
          <div className="flex flex-col gap-4">
            <FormField label="Status">
              <Select value={form.status} onChange={e => setField('status', e.target.value)}>
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </FormField>
            <FormField label="Description">
              <Textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Scope, floors, key constraints…" />
            </FormField>
          </div>
        )}
      </form>
    </Modal>
  )
}
