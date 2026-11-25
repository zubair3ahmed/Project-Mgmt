import EmptyState from '../components/EmptyState'
import { ListTodo } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, LayoutGrid, List, Pencil, Trash2, MessageSquare } from 'lucide-react'
import Header from '../components/Header'
import { StatusBadge, PriorityBadge, Tag, CountBadge, toneForStatus } from '../components/Badge'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import TaskFormModal from '../components/TaskFormModal'
import TaskComments from '../components/TaskComments'
import TaskAttachments from '../components/TaskAttachments'
import { AttachmentCount } from '../components/Attachments'
import { FormField, Input, Select, Textarea, Button } from '../components/FormField'
import useStore from '../store/useStore'
import useToast from '../store/useToast'
import { confirm } from '../store/useConfirm'
import { useAccess } from '../lib/access'

const STATUS_LABELS = { 'backlog': 'Backlog', 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' }
const STATUS_DOT = { 'backlog': 'bg-surface-300', 'todo': 'bg-surface-500', 'in-progress': 'bg-info', 'review': 'bg-warning', 'done': 'bg-success' }
const TASK_STATUSES = ['backlog', 'todo', 'in-progress', 'review', 'done']
const TASK_TYPES = [
  { value: 'design', label: 'Design', desc: 'Structural design & calculations' },
  { value: 'drafting', label: 'Drafting', desc: 'AutoCAD/Revit drawings' },
  { value: 'review', label: 'Review / QC', desc: 'Quality checks & design reviews' },
  { value: 'analysis', label: 'Analysis', desc: 'Seismic, wind, structural analysis' },
  { value: 'estimation', label: 'Estimation', desc: 'Quantity & cost estimation' },
  { value: 'report', label: 'Report', desc: 'Documentation & reports' },
  { value: 'site-visit', label: 'Site Visit', desc: 'On-site inspections' },
  { value: 'coordination', label: 'Coordination', desc: 'Meetings & project coordination' },
]

export default function Tasks() {
  const allTasks = useStore(s => s.tasks)
  const comments = useStore(s => s.comments)
  const allProjects = useStore(s => s.projects)
  const { isAdmin, staffId, myProjects, myProjectIds } = useAccess()
  const projects = isAdmin ? allProjects : myProjects
  const tasks = isAdmin ? allTasks : allTasks.filter(t => myProjectIds.has(t.projectId))
  const [onlyMine, setOnlyMine] = useState(!isAdmin)
  const canEdit = t => isAdmin || t.assigneeId === staffId
  const staff = useStore(s => s.staff)
  const updateTaskStatus = useStore(s => s.updateTaskStatus)
  const milestones = useStore(s => s.milestones)
  const addTask = useStore(s => s.addTask)
  const updateTask = useStore(s => s.updateTask)
  const deleteTask = useStore(s => s.deleteTask)

  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'list' : 'board'))
  const [filterProject, setFilterProject] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [params, setParams] = useSearchParams()
  const [formState, setFormState] = useState({ open: false, task: null, status: 'backlog' })

  useEffect(() => {
    const id = params.get('task')
    if (id) { setSelectedTask(id); setParams({}, { replace: true }) }
  }, [params, setParams])

  const filtered = (filterProject === 'all' ? tasks : tasks.filter(t => t.projectId === filterProject)).filter(t => !onlyMine || t.assigneeId === staffId)
  const task = selectedTask ? tasks.find(t => t.id === selectedTask) : null

  function openAdd(presetStatus) {
    setFormState({ open: true, task: null, status: presetStatus || 'backlog' })
  }

  function openEdit(t) {
    setSelectedTask(null)
    setFormState({ open: true, task: t, status: t.status })
  }

  async function handleDelete(id) {
    const t = allTasks.find(x => x.id === id)
    if (!t) return
    const nComments = comments.filter(c => c.taskId === id && c.type === 'comment').length
    const nFiles = t.attachments?.length || 0
    const details = []
    if (nComments) details.push(`${nComments} comment${nComments > 1 ? 's' : ''} will be deleted with it.`)
    if (nFiles) details.push(`${nFiles} attachment${nFiles > 1 ? 's' : ''} will be removed.`)
    const ok = await confirm({
      title: 'Delete this task?',
      message: `“${t.title}” will be removed from the project.`,
      details,
      confirmLabel: 'Delete task',
      tone: 'danger',
    })
    if (!ok) return
    const snapshot = deleteTask(id)
    setSelectedTask(null)
    if (snapshot) {
      useToast.getState().show({
        tone: 'danger',
        title: 'Task deleted',
        detail: snapshot.task.title,
        actions: [{ label: 'Undo', onClick: () => useStore.getState().restoreTask(snapshot) }],
      })
    }
  }

  const handleDrop = (e, status) => {
    e.preventDefault()
    if (draggedTask && canEdit(tasks.find(t => t.id === draggedTask) || {})) {
      updateTaskStatus(draggedTask, status)
      setDraggedTask(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Tasks"
        subtitle={`${tasks.length} tasks across ${projects.length} projects`}
        actions={<Button onClick={() => openAdd()}><Plus size={14} /> New Task</Button>}
      />

      <div className="px-6 py-3 border-b border-surface-100 bg-surface-0 flex flex-wrap items-center gap-3">
        <Select size="sm" className="w-auto min-w-40"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        {!isAdmin && (
          <div className="flex items-center border border-surface-300 rounded-md overflow-hidden">
            {[['Mine', true, tasks.filter(t => t.assigneeId === staffId).length], ['Team', false, tasks.length]].map(([l, v, n]) => (
              <button key={l} onClick={() => setOnlyMine(v)} className={`h-8 pl-3 pr-2 flex items-center gap-2 text-sm font-medium transition-colors ${onlyMine === v ? 'bg-brand-50 text-brand-700' : 'text-surface-500 hover:bg-surface-50'}`}>{l}<CountBadge count={n} tone={onlyMine === v ? 'brand' : 'gray'} /></button>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center border border-surface-200 rounded-md overflow-hidden">
          <button onClick={() => setView('board')} className={`h-8 w-8 flex items-center justify-center transition-colors ${view === 'board' ? 'bg-surface-100 text-surface-700' : 'text-surface-400 hover:text-surface-600'}`}><LayoutGrid size={14} /></button>
          <button onClick={() => setView('list')} className={`h-8 w-8 flex items-center justify-center transition-colors ${view === 'list' ? 'bg-surface-100 text-surface-700' : 'text-surface-400 hover:text-surface-600'}`}><List size={14} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tasks.length === 0 ? (
          <EmptyState icon={ListTodo} title="No tasks yet"
            description="Tasks are the units of work your team picks up, each counting toward a milestone. Type one line like “Column schedule Prestige Towers @Amit !high due fri 8h” and the form fills itself."
            action={{ label: 'New task', icon: Plus, onClick: () => openAdd() }} />
        ) : view === 'board' ? (
          <div className="flex gap-4 h-full min-w-full w-max">
            {TASK_STATUSES.map(status => {
              const columnTasks = filtered.filter(t => t.status === status)
              return (
                <div key={status} className="flex-1 min-w-72 w-72 flex flex-col shrink-0" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, status)}>
                  <div className="flex items-center gap-2 px-2 pb-3">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                    <span className="text-xs font-semibold text-surface-700 uppercase tracking-wider">{STATUS_LABELS[status]}</span>
                    <CountBadge className="ml-auto" count={columnTasks.length} tone={toneForStatus(status)} />
                  </div>
                  <div className="flex-1 space-y-2 min-h-[200px]">
                    {columnTasks.map(t => {
                      const assignee = staff.find(s => s.id === t.assigneeId)
                      const project = projects.find(p => p.id === t.projectId)
                      return (
                        <div key={t.id} draggable={canEdit(t)} onDragStart={() => setDraggedTask(t.id)} onClick={() => setSelectedTask(t.id)}
                          className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-3 cursor-pointer hover:border-surface-400 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs text-surface-400">{project?.name}</p>
                            <PriorityBadge priority={t.priority} />
                          </div>
                          <p className="text-sm font-medium text-surface-800 mb-2 leading-snug">{t.title}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-surface-300 text-xs font-medium text-surface-700 capitalize">{t.type}</span>
                              {t.tags?.slice(0, 1).map(tag => <Tag key={tag}>{tag}</Tag>)}
                            </div>
                            <div className="flex items-center gap-2">
                              {comments.filter(c => c.taskId === t.id && c.type === 'comment').length > 0 && (
                                <span className="flex items-center gap-1 text-xs font-medium text-surface-500">
                                  <MessageSquare size={14} /> {comments.filter(c => c.taskId === t.id && c.type === 'comment').length}
                                </span>
                              )}
                              <AttachmentCount count={t.attachments?.length} />
                              {assignee && <Avatar name={assignee.name} size="sm" />}
                            </div>
                          </div>
                          {t.milestoneId && (
                            <p className="mt-2 text-2xs font-medium text-surface-500 truncate" title="Milestone">
                              <span className="text-surface-400">Milestone</span> · {milestones.find(m => m.id === t.milestoneId)?.name}
                            </p>
                          )}
                          {t.estimatedHours > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1 bg-surface-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.min(((t.loggedHours || 0) / t.estimatedHours) * 100, 100)}%` }} />
                              </div>
                              <span className="text-2xs font-mono text-surface-400">{t.loggedHours || 0}/{t.estimatedHours}h</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
            <table data-m-hide="2 3 4 6 7" className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3">Task</th>
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Assignee</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Hours</th>
                  <th className="text-left px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const assignee = staff.find(s => s.id === t.assigneeId)
                  const project = projects.find(p => p.id === t.projectId)
                  return (
                    <tr key={t.id} className="cursor-pointer" onClick={() => setSelectedTask(t.id)}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-surface-800">{t.title}</p>
                        <div className="flex gap-1 mt-1">{t.tags?.slice(0, 3).map(tag => <Tag key={tag}>{tag}</Tag>)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-500">{project?.name}</td>
                      <td className="px-4 py-3 text-xs text-surface-500 capitalize">{t.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {assignee && <Avatar name={assignee.name} size="sm" />}
                          <span className="text-xs">{assignee?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3 text-xs font-mono text-surface-500">{t.loggedHours || 0}/{t.estimatedHours}h</td>
                      <td className="px-4 py-3 text-xs text-surface-500">{t.dueDate}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <Modal open={!!task} onClose={() => setSelectedTask(null)} title={task?.title || ''} wide>
        {task && (
          <TaskDetail task={task} projects={projects} staff={staff}
            canEdit={canEdit(task)}
            canDelete={isAdmin}
            onEdit={() => openEdit(task)}
            onDelete={() => handleDelete(task.id)}
            onStatusChange={(s) => updateTaskStatus(task.id, s)}
          />
        )}
      </Modal>

      <TaskFormModal
        open={formState.open}
        task={formState.task}
        presetStatus={formState.status}
        defaultProjectId={filterProject !== 'all' ? filterProject : ''}
        onClose={() => setFormState(f => ({ ...f, open: false }))}
      />
    </div>
  )
}

function TaskDetail({ task, projects, staff, canEdit, canDelete, onEdit, onDelete, onStatusChange }) {
  const assignee = staff.find(s => s.id === task.assigneeId)
  const reporter = staff.find(s => s.id === task.reporterId)
  const project = projects.find(p => p.id === task.projectId)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-surface-300 text-xs font-medium text-surface-700 capitalize mb-2">{task.type}</span>
          <p className="text-sm text-surface-600">{task.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {canEdit && <Button variant="secondary" size="sm" onClick={onEdit}><Pencil size={12} /> Edit</Button>}
          {canDelete && <Button variant="danger" size="sm" onClick={onDelete}><Trash2 size={12} /> Delete</Button>}
        </div>
      </div>

      <div className="flex gap-2">
        {TASK_STATUSES.map(s => (
          <button key={s} disabled={!canEdit} onClick={() => onStatusChange(s)}
            className={`h-8 px-3 text-xs rounded-md font-medium transition-colors ${task.status === s ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}
          >{STATUS_LABELS[s]}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-surface-400 mb-1">Project</p>
          <p className="text-sm text-surface-700 font-medium">{project?.name}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400 mb-1">Type</p>
          <p className="text-sm text-surface-700 capitalize">{task.type}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400 mb-1">Assignee</p>
          <div className="flex items-center gap-2">
            {assignee && <Avatar name={assignee.name} size="sm" />}
            <span className="text-sm text-surface-700">{assignee?.name}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-surface-400 mb-1">Reporter</p>
          <div className="flex items-center gap-2">
            {reporter && <Avatar name={reporter.name} size="sm" />}
            <span className="text-sm text-surface-700">{reporter?.name || '—'}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-surface-400 mb-1">Priority</p>
          <PriorityBadge priority={task.priority} />
        </div>
        <div>
          <p className="text-xs text-surface-400 mb-1">Due Date</p>
          <p className="text-sm text-surface-700">{task.dueDate || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400 mb-1">Time Tracking</p>
          <p className="text-sm font-mono text-surface-700">{task.loggedHours || 0} / {task.estimatedHours || 0} hours</p>
        </div>
        <div>
          <p className="text-xs text-surface-400 mb-1">Created</p>
          <p className="text-sm text-surface-700">{task.createdDate}</p>
        </div>
      </div>

      {task.tags?.length > 0 && (
        <div>
          <p className="text-xs text-surface-400 mb-2">Tags</p>
          <div className="flex gap-2">{task.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</div>
        </div>
      )}

      <div className="border-t border-surface-200 pt-6">
        <TaskAttachments taskId={task.id} />
      </div>

      <div className="border-t border-surface-200 pt-6">
        <TaskComments taskId={task.id} />
      </div>
    </div>
  )
}
