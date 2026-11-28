import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Pencil, Plus, Milestone as MilestoneIcon } from 'lucide-react'
import clsx from 'clsx'
import Header from '../components/Header'
import Tabs from '../components/Tabs'
import { StatusBadge, PriorityBadge, CountBadge } from '../components/Badge'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import MilestoneProgress from '../components/MilestoneProgress'
import EmptyState from '../components/EmptyState'
import TaskFormModal from '../components/TaskFormModal'
import { Button, Select } from '../components/FormField'
import { TaskDetail } from './Tasks'
import useStore from '../store/useStore'
import useToast from '../store/useToast'
import useQuickAdd from '../store/useQuickAdd'
import { confirm } from '../store/useConfirm'
import { useAccess, accessLevel, ACCESS_LEVELS } from '../lib/access'
import { milestoneProgress, inr } from '../lib/payments'
import { deleteJobWithConfirm } from '../lib/deleteJob'

const PAY_LABEL = { pending: 'Not yet earned', ready: 'Ready to invoice', invoiced: 'Invoiced', paid: 'Paid' }

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default function ProjectDetail() {
  const { id } = useParams()
  const projects = useStore(s => s.projects)
  const allTasks = useStore(s => s.tasks)
  const allMilestones = useStore(s => s.milestones)
  const allFiles = useStore(s => s.files)
  const staff = useStore(s => s.staff)
  const clients = useStore(s => s.clients)
  const { isAdmin, staffId, myProjectIds, canWrite, user } = useAccess()
  const addJob = useQuickAdd(s => s.addJob)
  const openProject = useQuickAdd(s => s.openProject)
  const [tab, setTab] = useState('board')
  const [openJobId, setOpenJobId] = useState(null)
  const [editJob, setEditJob] = useState(null)

  const project = projects.find(p => p.id === id)
  if (!project || (!isAdmin && !myProjectIds.has(project.id))) return <div className="p-6">Project not found or you don't have access.</div>

  const client = clients.find(c => c.id === project.clientId)
  const manager = staff.find(s => s.id === project.managerId)
  const jobs = allTasks.filter(t => t.projectId === id)
  const milestones = allMilestones.filter(m => m.projectId === id).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
  const files = allFiles.filter(f => f.projectId === id)
  const members = (project.teamIds || []).map(tid => staff.find(s => s.id === tid)).filter(Boolean)
  const write = canWrite(project.id)
  const openJob = jobs.find(t => t.id === openJobId)
  const isMine = t => t.assigneeId === staffId

  const TABS = [
    { id: 'board', label: 'Milestones & jobs', count: milestones.length },
    { id: 'files', label: 'Files', count: files.length },
    { id: 'team', label: 'Team & access', count: members.length + (manager ? 1 : 0) },
  ]

  const facts = [
    ['Status', <StatusBadge status={project.status} />],
    ['Priority', <PriorityBadge priority={project.priority} />],
    ['Client', <span className="font-medium">{client?.name}</span>],
    ['Manager', manager && <span className="flex items-center gap-2"><Avatar name={manager.name} size="sm" />{manager.name}</span>],
    ['Timeline', `${project.startDate} → ${project.endDate}`],
    isAdmin && ['Contract value', <span className="font-mono font-semibold">{formatCurrency(project.contractValue)}</span>],
  ].filter(Boolean)

  return (
    <div className="flex flex-col h-full">
      <Header
        title={project.name}
        subtitle={`${project.type} · ${project.location}${isAdmin ? '' : ` · ${accessLevel(project, user) === 'write' ? 'You can add jobs' : 'View only'}`}`}
        actions={<>
          {isAdmin && <Button variant="secondary" onClick={() => openProject(project)}><Pencil size={14} /> Edit project</Button>}
          {write && <Button variant="secondary" onClick={() => addJob({ projectId: project.id })}><Plus size={14} /> Add job to this project</Button>}
        </>}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 border-b border-surface-200 bg-surface-0 flex flex-col gap-4">
          <Link to="/projects" className="text-xs text-surface-500 hover:text-surface-800 flex items-center gap-1 w-fit"><ArrowLeft size={12} /> All projects</Link>
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            {facts.map(([label, value]) => (
              <div key={label}><dt className="text-xs text-surface-400 mb-1">{label}</dt><dd className="text-sm text-surface-700">{value}</dd></div>
            ))}
          </dl>
          <MilestoneProgress project={project} />
        </div>

        <div className="px-6 pt-3"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>

        <div className="p-6">
          {tab === 'board' && (
            <Board project={project} milestones={milestones} jobs={jobs} write={write} isAdmin={isAdmin} isMine={isMine} onOpen={setOpenJobId} />
          )}
          {tab === 'files' && <FilesTab files={files} staff={staff} />}
          {tab === 'team' && <TeamTab project={project} manager={manager} members={members} isAdmin={isAdmin} onEdit={() => openProject(project)} />}
        </div>
      </div>

      <Modal open={!!openJob} onClose={() => setOpenJobId(null)} title={openJob?.title || ''} wide>
        {openJob && (
          <TaskDetail task={openJob} projects={projects} staff={staff}
            canEdit={isAdmin || isMine(openJob)}
            canEditDetails={isAdmin || (isMine(openJob) && write)}
            canDelete={isAdmin}
            onEdit={() => { setEditJob(openJob); setOpenJobId(null) }}
            onDelete={async () => { if (await deleteJobWithConfirm(openJob.id)) setOpenJobId(null) }}
            onStatusChange={s => useStore.getState().updateTaskStatus(openJob.id, s)}
            onLogHours={isAdmin || isMine(openJob) ? () => { setOpenJobId(null); useQuickAdd.getState().logHours({ taskId: openJob.id }) } : undefined}
          />
        )}
      </Modal>
      <TaskFormModal open={!!editJob} task={editJob} onClose={() => setEditJob(null)} />
    </div>
  )
}

// Project → Milestones → Jobs: one column per milestone, its jobs underneath.
function Board({ project, milestones, jobs, write, isAdmin, isMine, onOpen }) {
  const addJob = useQuickAdd(s => s.addJob)
  const logHours = useQuickAdd(s => s.logHours)
  const staff = useStore(s => s.staff)
  const updateTask = useStore(s => s.updateTask)
  const addFromTemplate = useStore(s => s.addMilestonesFromTemplate)
  const [dragged, setDragged] = useState(null)
  // Staff see every milestone as an overview: the active one in full, the rest as outlines they can open.
  const activeId = (milestones.find(m => m.status === 'in-progress') || milestones.find(m => m.status !== 'completed') || milestones.at(-1))?.id
  const [picked, setPicked] = useState(null)
  const focusId = milestones.some(m => m.id === picked) || picked === 'none' ? picked : activeId
  const scroller = useRef(null)
  // on a narrow screen the board scrolls sideways: bring the focused milestone into view
  useEffect(() => {
    const box = scroller.current
    const col = box?.querySelector('[data-focused=true]')
    if (col && box.scrollWidth > box.clientWidth) box.scrollLeft += col.getBoundingClientRect().left - box.getBoundingClientRect().left - 8
  }, [focusId])
  const unlinked = jobs.filter(t => !milestones.some(m => m.id === t.milestoneId))
  const canMove = t => isAdmin || (write && isMine(t))

  async function useTemplate() {
    const ok = await confirm({ title: 'Create the six stage milestones?', message: `“${project.name}” gets the six delivery stages as milestones, weighted 5, 10, 25, 20, 30 and 10 percent.`, confirmLabel: 'Create milestones' })
    if (!ok) return
    const ids = addFromTemplate(project.id)
    useToast.getState().show({ title: `${ids.length} milestones created`, detail: project.name, actions: [{ label: 'Undo', onClick: () => useStore.getState().removeMilestones(ids) }] })
  }

  async function drop(milestone) {
    const job = jobs.find(t => t.id === dragged)
    setDragged(null)
    if (!job || !canMove(job) || (job.milestoneId || null) === (milestone?.id || null)) return
    if (milestone?.status === 'completed' && job.status !== 'done') {
      useToast.getState().show({ tone: 'info', title: 'That milestone is already achieved', detail: 'An unfinished job cannot be moved into it.' })
      return
    }
    const before = job.milestoneId
    // a move can finish a milestone, which raises its payment request, so never do that on a drag alone
    const after = jobs.map(t => (t.id === job.id ? { ...t, milestoneId: milestone?.id } : t))
    const finishes = [milestone, milestones.find(m => m.id === before)].filter(m => m && m.status !== 'completed' && milestoneProgress(m, after).complete)
    if (finishes.length) {
      const ok = await confirm({
        title: 'This move completes a milestone',
        message: `Moving “${job.title}” leaves every job done in ${finishes.map(m => `“${m.name}”`).join(' and ')}.`,
        details: finishes.map(m => (m.paymentMode === 'auto' ? `The payment request for “${m.name}” will be sent straight away.` : `“${m.name}” will wait for an admin to approve its payment request.`)),
        confirmLabel: 'Move and complete',
      })
      if (!ok) return
    }
    updateTask(job.id, { milestoneId: milestone?.id })
    if (!finishes.length) useToast.getState().show({ title: 'Job moved', detail: `${job.title} → ${milestone?.name || 'No milestone'}`, actions: [{ label: 'Undo', onClick: () => useStore.getState().updateTask(job.id, { milestoneId: before }) }] })
  }

  if (!milestones.length && !jobs.length) {
    return <EmptyState icon={MilestoneIcon} title="No milestones yet"
      description={isAdmin ? 'A project is planned as milestones, and jobs sit under each one. Start from the six delivery stages or add your own.' : 'Your admin has not set up milestones for this project yet.'}
      action={isAdmin ? { label: 'Use the six stages', onClick: useTemplate } : write ? { label: 'Add job', icon: Plus, onClick: () => addJob({ projectId: project.id }) } : undefined}
      secondary={isAdmin ? { label: 'Add a custom milestone', to: '/milestones' } : undefined} />
  }

  const columns = [...milestones, ...(unlinked.length || !milestones.length ? [null] : [])]

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!milestones.length && <Button size="sm" variant="secondary" onClick={useTemplate}>Use the six stages</Button>}
          <Link to="/milestones"><Button size="sm" variant="secondary"><Plus size={14} /> Add or edit milestones</Button></Link>
        </div>
      )}
      <div ref={scroller} className={clsx('flex overflow-x-auto pb-3 p-0.5', isAdmin ? 'gap-4 items-start' : 'gap-3 items-stretch')}>
        {columns.map(m => {
          const list = m ? jobs.filter(t => t.milestoneId === m.id) : unlinked
          const pr = m ? milestoneProgress(m, jobs) : null
          const achieved = m?.status === 'completed'
          const key = m?.id || 'none'
          if (!isAdmin && milestones.length && key !== focusId) {
            return <OutlineColumn key={key} milestone={m} jobs={list} mine={list.filter(isMine).length} progress={pr} onFocus={() => setPicked(key)} onDrop={() => drop(m)} />
          }
          return (
            <section key={key} aria-label={m?.name || 'No milestone'} data-focused={isAdmin ? undefined : 'true'} className={clsx('shrink-0 flex flex-col rounded-lg bg-surface-100 border', isAdmin ? 'w-72 border-surface-200' : 'w-80 max-sm:w-[17rem] border-brand-600 ring-1 ring-brand-600')} onDragOver={e => e.preventDefault()} onDrop={() => drop(m)}>
              <header className="p-3 flex flex-col gap-2 border-b border-surface-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {!isAdmin && <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700 mb-0.5">{key === activeId ? 'Active milestone' : 'Viewing'}</p>}
                    <h3 className="text-sm font-semibold text-surface-900 leading-snug">{m?.name || 'No milestone'}</h3>
                  </div>
                  <CountBadge count={list.length} />
                </div>
                {m ? (
                  <>
                    <div className="flex items-center gap-2"><StatusBadge status={m.status} /><span className="text-xs text-surface-500">Due {m.dueDate}</span></div>
                    <ProgressBar value={achieved ? 100 : pr.pct} />
                    <p className="text-xs text-surface-500">{achieved ? 'Milestone achieved' : `${pr.done} of ${pr.total} jobs done`}</p>
                    {isAdmin && <p className="text-xs text-surface-500"><span className="font-mono font-semibold text-surface-700">{inr(m.paymentAmount)}</span> · {PAY_LABEL[m.paymentStatus] || m.paymentStatus}</p>}
                  </>
                ) : <p className="text-xs text-surface-500">Jobs not yet linked. Drag one onto a milestone.</p>}
              </header>
              <ul className="p-2 flex flex-col gap-2 min-h-20">
                {list.map(t => {
                  const who = staff.find(s => s.id === t.assigneeId)
                  return (
                    <li key={t.id} draggable={canMove(t)} onDragStart={() => setDragged(t.id)} className={clsx('rounded-md bg-surface-0 border border-surface-300 shadow-xs p-3 flex flex-col gap-2', canMove(t) && 'cursor-grab')}>
                      <button type="button" onClick={() => onOpen(t.id)} className="text-left text-sm font-medium text-surface-800 leading-snug hover:text-brand-700">{t.title}</button>
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={t.status} />
                        {who && <Avatar name={who.name} size="sm" />}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-surface-500">{t.loggedHours || 0}/{t.estimatedHours || 0}h</span>
                        {(isAdmin || isMine(t)) && <button type="button" onClick={() => logHours({ taskId: t.id })} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"><Clock size={12} /> Log hours</button>}
                      </div>
                    </li>
                  )
                })}
                {!list.length && <li className="py-3 text-center text-xs text-surface-400">No jobs yet</li>}
              </ul>
              {write && !achieved && (
                <button type="button" onClick={() => addJob({ projectId: project.id, milestoneId: m?.id })} className="m-2 mt-0 h-9 flex items-center justify-center gap-1 rounded-md text-sm font-semibold text-surface-600 hover:bg-surface-0 hover:text-surface-900 border border-dashed border-surface-300">
                  <Plus size={14} /> Add job
                </button>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

// A milestone that is not in focus: enough to read the shape of the project, drawn as a skeleton.
function OutlineColumn({ milestone: m, jobs, mine, progress, onFocus, onDrop }) {
  const name = m?.name || 'No milestone'
  const state = !m ? 'Unlinked jobs' : m.status === 'completed' ? 'Achieved' : m.status === 'in-progress' ? 'In progress' : 'Upcoming'
  const count = jobs.length ? `${jobs.length} job${jobs.length > 1 ? 's' : ''}${progress ? ` · ${progress.done} done` : ''}` : 'No jobs yet'
  return (
    <section aria-label={name} data-focused="false" className="flex-1 min-w-32 max-sm:flex-none max-sm:w-36 flex" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
      <button type="button" onClick={onFocus} aria-label={`${name}, ${state}, ${count}. Show its jobs`} className="group w-full flex flex-col gap-2 text-left rounded-lg border border-dashed border-surface-300 bg-surface-25 p-3 hover:border-surface-400 hover:bg-surface-0 transition-colors">
        <span className={clsx('flex items-center gap-1 text-2xs font-semibold uppercase tracking-wide', m?.status === 'completed' ? 'text-success-dark' : 'text-surface-500')}>
          {m?.status === 'completed' && <Check size={12} />}{state}
        </span>
        <span className="text-xs font-semibold text-surface-600 leading-snug line-clamp-3 group-hover:text-surface-900">{name}</span>
        {m && <span className="text-2xs text-surface-500">Due {m.dueDate}</span>}
        <span className="text-2xs text-surface-500">{count}</span>
        {mine > 0 && <span className="w-fit rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-2xs font-semibold text-brand-700">{mine} yours</span>}
        <span data-skeleton aria-hidden="true" className="flex flex-col gap-2 mt-1">
          {Array.from({ length: Math.min(3, Math.max(2, jobs.length)) }, (_, i) => (
            <span key={i} className={clsx('flex flex-col gap-1.5 rounded-md border border-surface-200 bg-surface-0 p-2', !jobs.length && 'opacity-50')}>
              <span className="h-2 rounded-full bg-surface-200" style={{ width: `${[90, 70, 80][i]}%` }} />
              <span className={clsx('h-2 w-2/5 rounded-full', m?.status === 'completed' ? 'bg-success-border' : 'bg-surface-200')} />
            </span>
          ))}
        </span>
        <span className="mt-auto pt-1 text-2xs font-semibold text-brand-700 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100">Show jobs</span>
      </button>
    </section>
  )
}

function FilesTab({ files, staff }) {
  return (
    <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
      <table data-m-hide="2 3 5" className="data-table w-full text-sm">
        <thead>
          <tr>
            {['File', 'Folder', 'Uploaded by', 'Date', 'Size'].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {files.map(f => (
            <tr key={f.id}>
              <td className="px-4 py-3"><p className="text-sm text-surface-800 font-medium">{f.name}</p><p className="text-2xs text-surface-400 uppercase">{f.type}</p></td>
              <td className="px-4 py-3 text-xs text-surface-500">{f.folder}</td>
              <td className="px-4 py-3 text-xs text-surface-500">{staff.find(s => s.id === f.uploadedBy)?.name}</td>
              <td className="px-4 py-3 text-xs text-surface-500">{f.date}</td>
              <td className="px-4 py-3 text-xs font-mono text-surface-500">{f.size}</td>
            </tr>
          ))}
          {!files.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-surface-400">No files uploaded</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function TeamTab({ project, manager, members, isAdmin, onEdit }) {
  const updateProject = useStore(s => s.updateProject)
  function setLevel(person, level) {
    const before = project.access || {}
    updateProject(project.id, { access: { ...before, [person.id]: level } })
    useToast.getState().show({ title: 'Access updated', detail: `${person.name} · ${ACCESS_LEVELS.find(a => a[0] === level)[1]}`, actions: [{ label: 'Undo', onClick: () => useStore.getState().updateProject(project.id, { access: before }) }] })
  }
  const row = (person, control) => (
    <li key={person.id} className="flex items-center gap-3 px-4 py-3">
      <Avatar name={person.name} size="md" />
      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-surface-800 truncate">{person.name}</p><p className="text-xs text-surface-500 truncate">{person.role}</p></div>
      {control}
    </li>
  )
  return (
    <div className="max-w-2xl flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-surface-500">Only these people see this project. “Can add jobs” also lets them upload files.</p>
        {isAdmin && <Button size="sm" variant="secondary" onClick={onEdit}>Add or remove people</Button>}
      </div>
      <ul className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm divide-y divide-surface-200">
        {manager && row(manager, <span className="text-xs text-surface-500">Manager · Can add jobs</span>)}
        {members.map(p => {
          const level = project.access?.[p.id] || 'write'
          return row(p, isAdmin ? (
            <Select size="sm" className="w-40" value={level} onChange={e => setLevel(p, e.target.value)}>
              {ACCESS_LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          ) : <span className="text-xs text-surface-500">{ACCESS_LEVELS.find(a => a[0] === level)[1]}</span>)
        })}
      </ul>
    </div>
  )
}
