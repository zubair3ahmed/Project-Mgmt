import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TASKS, PROJECTS, STAFF, CLIENTS, TIME_LOGS, MILESTONES, FILES, ACTIVITIES, PROJECT_STAGES } from '../data/mockData'

import useAuth from './useAuth'
import useToast from './useToast'
import { inr, milestoneProgress, STAGE_TEMPLATE } from '../lib/payments'

const ago = h => new Date(Date.now() - h * 3600000).toISOString()
const actor = () => {
  const u = useAuth.getState().user
  return { authorId: u?.staffId || 'ADMIN', authorName: u?.name || 'System' }
}
const STATUS_LABEL = { backlog: 'Backlog', todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }

// An admin assigning work to someone outside the project gives them view access to it.
function withAssigneeAccess(projects, task) {
  return projects.map(p => {
    if (p.id !== task.projectId || !task.assigneeId || p.managerId === task.assigneeId || (p.teamIds || []).includes(task.assigneeId)) return p
    if (useAuth.getState().user?.role !== 'admin') return p
    return { ...p, teamIds: [...(p.teamIds || []), task.assigneeId], access: { ...(p.access || {}), [task.assigneeId]: 'read' } }
  })
}

const merged_ = (projects, old, updates) => (old ? withAssigneeAccess(projects, { ...old, ...updates }) : projects)

// A milestone follows its tasks. When the last linked task is done the milestone completes and its
// payment request is raised: sent at once (auto) or held as "ready" for an admin to approve (manual).
// Moving a task back out of done reopens the milestone, unless the invoice has already gone out.
function milestoneEffect(milestones, tasks, ids) {
  let event = null
  const today = new Date().toISOString().split('T')[0]
  const next = milestones.map(m => {
    if (!ids.includes(m.id)) return m
    const pr = milestoneProgress(m, tasks)
    if (!pr.total) return m
    if (pr.complete && m.status !== 'completed') {
      const auto = m.paymentMode === 'auto'
      event = { auto, milestone: m }
      return { ...m, status: 'completed', completedDate: today, paymentStatus: m.paymentStatus === 'pending' ? (auto ? 'invoiced' : 'ready') : m.paymentStatus }
    }
    if (!pr.complete && m.status === 'completed' && ['pending', 'ready'].includes(m.paymentStatus)) {
      return { ...m, status: pr.done > 0 ? 'in-progress' : 'pending', completedDate: undefined, paymentStatus: 'pending' }
    }
    if (!pr.complete && m.status === 'pending' && pr.done > 0) return { ...m, status: 'in-progress' }
    return m
  })
  return { milestones: next, event }
}

function eventMessages(event) {
  if (!event) return null
  const isAdmin = useAuth.getState().user?.role === 'admin'
  const m = event.milestone
  const amount = inr(m.paymentAmount)
  return {
    comment: event.auto ? `completed ${m.name}, so the payment request was sent automatically` : `completed ${m.name}, which is now ready to invoice`,
    toast: isAdmin
      ? { title: event.auto ? 'Payment request sent' : 'Milestone complete', detail: `${m.name} · ${amount}${event.auto ? '' : ' · approve it on Milestones'}` }
      : { title: 'Milestone complete', detail: `${m.name}. Admin has been notified.` },
  }
}

const SEED_COMMENTS = [
  { id: 'CM001', taskId: 'T006', type: 'comment', authorId: 'S002', authorName: 'Priya Patel', text: 'Please share the revised column loads before we freeze this layout. @Amit', timestamp: ago(30) },
  { id: 'CM002', taskId: 'T006', type: 'comment', authorId: 'S003', authorName: 'Amit Desai', text: 'Loads updated in the shared folder. Starting the schedule today.', timestamp: ago(22) },
  { id: 'CM003', taskId: 'T008', type: 'comment', authorId: 'S005', authorName: 'Vikram Joshi', text: 'Client asked for a 150mm slab at the terrace level. Can we check the deflection?', timestamp: ago(52) },
]

let _counter = 100
// Ids carry a time stamp so two tabs creating records at once can never produce the same id.
let nextId = (prefix) => `${prefix}${Date.now().toString(36).slice(-4)}${String(++_counter).padStart(2, '0')}`

// Workspace can start empty so every first-run screen can be seen. The choice survives a reload.
const MODE_KEY = 'structflow-workspace'
const readMode = () => { try { return localStorage.getItem(MODE_KEY) === 'empty' ? 'empty' : 'demo' } catch { return 'demo' } }
const ADMIN_STAFF = STAFF.filter(m => m.id === 'S009')
const dataFor = mode => mode === 'empty'
  ? { tasks: [], projects: [], staff: [...ADMIN_STAFF], clients: [], timeLogs: [], milestones: [], files: [], activities: [], comments: [] }
  : { tasks: [...TASKS], projects: [...PROJECTS], staff: [...STAFF], clients: [...CLIENTS], timeLogs: [...TIME_LOGS], milestones: [...MILESTONES], files: [...FILES], activities: [...ACTIVITIES], comments: [...SEED_COMMENTS] }

// Workspace data is saved to localStorage and other open tabs are told when it changes (see LiveSync).
const DATA_KEYS = ['tasks', 'projects', 'staff', 'clients', 'timeLogs', 'milestones', 'files', 'activities', 'comments', 'projectStages', 'workspaceMode']
const persistOptions = {
  name: 'structflow-data',
  // v2 adds per-person project access; older saved demo data is replaced by the new sample data.
  version: 2,
  migrate: () => undefined,
  // Blob URLs only exist in the tab that made them, so attachment links are not saved.
  partialize: s => {
    const out = {}
    DATA_KEYS.forEach(k => { out[k] = s[k] })
    out.tasks = out.tasks.map(t => (t.attachments ? { ...t, attachments: t.attachments.map(a => ({ ...a, url: undefined })) } : t))
    return out
  },
  merge: (persisted, current) => {
    if (!persisted) return current
    const urls = new Map()
    current.tasks.forEach(t => t.attachments?.forEach(a => a.url && urls.set(a.id, a.url)))
    const tasks = (persisted.tasks || []).map(t => (t.attachments ? { ...t, attachments: t.attachments.map(a => ({ ...a, url: a.url || urls.get(a.id) })) } : t))
    return { ...current, ...persisted, tasks }
  },
}

const useStore = create(persist((set, get) => ({
  ...dataFor(readMode()),
  workspaceMode: readMode(),
  projectStages: [...PROJECT_STAGES],
  setWorkspaceMode: mode => {
    try { localStorage.setItem(MODE_KEY, mode) } catch { /* private mode */ }
    set({ ...dataFor(mode), workspaceMode: mode })
  },
  sidebarCollapsed: false,
  mobileNavOpen: false,
  setMobileNav: v => set({ mobileNavOpen: v }),

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // --- Activities ---
  addActivity: (activity) =>
    set(s => ({
      activities: [{ ...activity, id: nextId('A'), timestamp: new Date().toISOString() }, ...s.activities],
    })),

  // --- Staff CRUD ---
  addStaff: (staff) =>
    set(s => {
      const id = nextId('S')
      const newStaff = { ...staff, id, status: 'active', avatar: staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }
      return {
        staff: [...s.staff, newStaff],
        activities: [{ id: nextId('A'), type: 'staff_added', userId: id, timestamp: new Date().toISOString(), message: `${staff.name} joined as ${staff.role}` }, ...s.activities],
      }
    }),

  updateStaff: (id, updates) =>
    set(s => ({
      staff: s.staff.map(st => st.id === id ? { ...st, ...updates } : st),
    })),

  toggleStaffStatus: (id) =>
    set(s => ({
      staff: s.staff.map(st =>
        st.id === id ? { ...st, status: st.status === 'active' ? 'inactive' : 'active' } : st
      ),
    })),

  // --- Client CRUD ---
  addClient: (client) =>
    set(s => ({
      clients: [...s.clients, { ...client, id: nextId('C'), projects: [] }],
    })),

  updateClient: (id, updates) =>
    set(s => ({
      clients: s.clients.map(c => c.id === id ? { ...c, ...updates } : c),
    })),

  // --- Project CRUD ---
  addProject: (project) => {
    let id
    set(s => {
      id = nextId('P')
      return {
        projects: [...s.projects, { ...project, id, currentStage: 'stage-wo', progress: 0 }],
        activities: [{ id: nextId('A'), type: 'project_created', userId: project.managerId, projectId: id, timestamp: new Date().toISOString(), message: `created project ${project.name}` }, ...s.activities],
      }
    })
    return id
  },

  updateProject: (id, updates) =>
    set(s => ({
      projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      // a changed contract value re-prices milestones that have not been invoiced yet
      milestones: updates.contractValue === undefined ? s.milestones : s.milestones.map(m =>
        m.projectId === id && !['invoiced', 'paid'].includes(m.paymentStatus) ? { ...m, paymentAmount: Math.round((updates.contractValue * m.weightage) / 100) } : m
      ),
    })),

  deleteProject: (id) =>
    set(s => ({
      projects: s.projects.filter(p => p.id !== id),
      milestones: s.milestones.filter(m => m.projectId !== id),
    })),

  // --- Task CRUD ---
  addTask: (task) => {
    let id
    set(s => {
      id = nextId('T')
      const newTask = {
        ...task,
        id,
        createdDate: new Date().toISOString().split('T')[0],
        loggedHours: 0,
        status: task.status || 'backlog',
      }
      return {
        projects: withAssigneeAccess(s.projects, newTask),
        tasks: [...s.tasks, newTask],
        comments: [{ id: nextId('CM'), taskId: id, type: 'system', ...actor(), text: 'created this job', timestamp: new Date().toISOString() }, ...s.comments],
        activities: [{ id: nextId('A'), type: 'task_created', userId: task.reporterId, taskId: id, projectId: task.projectId, timestamp: new Date().toISOString(), message: `created job ${task.title}` }, ...s.activities],
      }
    })
    return id
  },

  updateTask: (id, updates) => {
    let fx = null
    set(s => {
      const old = s.tasks.find(t => t.id === id)
      const notes = []
      if (old) {
        if (updates.status && updates.status !== old.status) notes.push(`moved this from ${STATUS_LABEL[old.status]} to ${STATUS_LABEL[updates.status]}`)
        if (updates.assigneeId && updates.assigneeId !== old.assigneeId) notes.push(`reassigned this to ${s.staff.find(x => x.id === updates.assigneeId)?.name || 'someone'}`)
        if (updates.priority && updates.priority !== old.priority) notes.push(`changed priority from ${old.priority} to ${updates.priority}`)
        if (updates.dueDate !== undefined && updates.dueDate !== old.dueDate) notes.push(updates.dueDate ? `set the due date to ${updates.dueDate}` : 'cleared the due date')
        if ('milestoneId' in updates && updates.milestoneId !== old.milestoneId) {
          const to = s.milestones.find(m => m.id === updates.milestoneId)
          notes.push(to ? `linked this to the milestone ${to.name}` : 'unlinked this from its milestone')
        }
      }
      const tasks = s.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      const touched = old ? [old.milestoneId, updates.milestoneId ?? old.milestoneId].filter(Boolean) : []
      const res = milestoneEffect(s.milestones, tasks, touched)
      fx = eventMessages(res.event)
      if (fx) notes.push(fx.comment)
      const ts = new Date().toISOString()
      return {
        projects: merged_(s.projects, old, updates),
        tasks,
        milestones: res.milestones,
        comments: [...notes.map(text => ({ id: nextId('CM'), taskId: id, type: 'system', ...actor(), text, timestamp: ts })), ...s.comments],
      }
    })
    if (fx) setTimeout(() => useToast.getState().show(fx.toast), 0)
  },

  updateTaskStatus: (taskId, newStatus, { silent = false } = {}) => {
    const old = get().tasks.find(t => t.id === taskId)
    const changed = old && old.status !== newStatus
    let fx = null
    set(s => {
      const tasks = s.tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, completedDate: newStatus === 'done' ? new Date().toISOString().split('T')[0] : undefined } : t
      )
      const res = old?.milestoneId ? milestoneEffect(s.milestones, tasks, [old.milestoneId]) : { milestones: s.milestones, event: null }
      fx = eventMessages(res.event)
      const sys = []
      if (changed) sys.push(`moved this from ${STATUS_LABEL[old.status]} to ${STATUS_LABEL[newStatus]}`)
      if (fx) sys.push(fx.comment)
      const ts = new Date().toISOString()
      return {
        tasks,
        milestones: res.milestones,
        comments: [...sys.map(text => ({ id: nextId('CM'), taskId, type: 'system', ...actor(), text, timestamp: ts })), ...s.comments],
      }
    })
    if (changed && !silent) {
      useToast.getState().show({
        title: `Moved to ${STATUS_LABEL[newStatus]}`,
        detail: old.title,
        actions: [{ label: 'Undo', onClick: () => get().updateTaskStatus(taskId, old.status, { silent: true }) }],
      })
      if (fx) setTimeout(() => useToast.getState().show(fx.toast), 60)
    }
  },

  deleteTask: id => {
    const snapshot = get().tasks.find(t => t.id === id)
    const comments = get().comments.filter(c => c.taskId === id)
    set(s => ({
      tasks: s.tasks.filter(t => t.id !== id),
      comments: s.comments.filter(c => c.taskId !== id),
    }))
    return snapshot ? { task: snapshot, comments } : null
  },

  restoreTask: ({ task, comments }) =>
    set(s => ({ tasks: [...s.tasks, task], comments: [...comments, ...s.comments] })),

  // --- Task attachments ---
  addAttachments: (taskId, atts) =>
    set(s => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, attachments: [...(t.attachments || []), ...atts] } : t),
      comments: [...atts.map(a => ({ id: nextId('CM'), taskId, type: 'system', ...actor(), text: `attached ${a.name}`, timestamp: new Date().toISOString() })), ...s.comments],
    })),

  removeAttachment: (taskId, attId) =>
    set(s => {
      const att = s.tasks.find(t => t.id === taskId)?.attachments?.find(a => a.id === attId)
      return {
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, attachments: (t.attachments || []).filter(a => a.id !== attId) } : t),
        comments: att ? [{ id: nextId('CM'), taskId, type: 'system', ...actor(), text: `removed the attachment ${att.name}`, timestamp: new Date().toISOString() }, ...s.comments] : s.comments,
      }
    }),

  // --- Task comments ---
  addComment: (taskId, text) =>
    set(s => ({
      comments: [{ id: nextId('CM'), taskId, type: 'comment', ...actor(), text: text.trim(), timestamp: new Date().toISOString() }, ...s.comments],
    })),

  updateComment: (id, text) =>
    set(s => ({
      comments: s.comments.map(c => c.id === id ? { ...c, text: text.trim(), edited: true } : c),
    })),

  deleteComment: (id) =>
    set(s => ({ comments: s.comments.filter(c => c.id !== id) })),

  // --- Time Log CRUD ---
  addTimeLog: (log) =>
    set(s => ({
      timeLogs: [...s.timeLogs, { ...log, id: nextId('TL') }],
      tasks: s.tasks.map(t =>
        t.id === log.taskId ? { ...t, loggedHours: (t.loggedHours || 0) + log.hours } : t
      ),
      activities: [{ id: nextId('A'), type: 'time_logged', userId: log.staffId, taskId: log.taskId, projectId: log.projectId, timestamp: new Date().toISOString(), message: `logged ${log.hours} hours` }, ...s.activities],
    })),

  updateTimeLog: (id, updates) =>
    set(s => {
      const old = s.timeLogs.find(l => l.id === id)
      const hoursDiff = updates.hours !== undefined ? updates.hours - (old?.hours || 0) : 0
      return {
        timeLogs: s.timeLogs.map(l => l.id === id ? { ...l, ...updates } : l),
        tasks: hoursDiff !== 0 ? s.tasks.map(t =>
          t.id === (old?.taskId) ? { ...t, loggedHours: Math.max(0, (t.loggedHours || 0) + hoursDiff) } : t
        ) : s.tasks,
      }
    }),

  deleteTimeLog: id => {
    const log = get().timeLogs.find(l => l.id === id)
    set(s => ({
      timeLogs: s.timeLogs.filter(l => l.id !== id),
      tasks: log ? s.tasks.map(t => (t.id === log.taskId ? { ...t, loggedHours: Math.max(0, (t.loggedHours || 0) - log.hours) } : t)) : s.tasks,
    }))
    return log || null
  },

  restoreTimeLog: log =>
    set(s => ({
      timeLogs: [...s.timeLogs, log],
      tasks: s.tasks.map(t => (t.id === log.taskId ? { ...t, loggedHours: (t.loggedHours || 0) + log.hours } : t)),
    })),

  // --- Milestone CRUD ---
  addMilestone: (milestone) =>
    set(s => ({
      milestones: [...s.milestones, { paymentMode: 'manual', ...milestone, id: nextId('M'), status: 'pending', paymentStatus: 'pending' }],
    })),

  updateMilestone: (id, updates) =>
    set(s => ({
      milestones: s.milestones.map(m => m.id === id ? { ...m, ...updates } : m),
    })),

  completeMilestone: (id) =>
    set(s => ({
      milestones: s.milestones.map(m =>
        m.id === id ? { ...m, status: 'completed', completedDate: new Date().toISOString().split('T')[0] } : m
      ),
    })),

  updatePaymentStatus: (id, status) =>
    set(s => ({
      milestones: s.milestones.map(m =>
        m.id === id ? { ...m, paymentStatus: status } : m
      ),
    })),

  // Predefined milestones from the six delivery stages, spread between the project's start and end dates.
  addMilestonesFromTemplate: projectId => {
    const project = get().projects.find(p => p.id === projectId)
    if (!project) return []
    const start = new Date(project.startDate || Date.now()).getTime()
    const end = new Date(project.endDate || start + 180 * 86400000).getTime()
    const step = (end - start) / STAGE_TEMPLATE.length
    const created = STAGE_TEMPLATE.map(([name, weightage], i) => ({
      id: nextId('M'), projectId, name, weightage,
      dueDate: new Date(start + step * (i + 1)).toISOString().split('T')[0],
      status: 'pending', paymentStatus: 'pending', paymentMode: 'manual',
      paymentAmount: Math.round((project.contractValue || 0) * weightage / 100),
    }))
    set(s => ({ milestones: [...s.milestones, ...created] }))
    return created.map(m => m.id)
  },

  removeMilestones: ids => set(s => ({ milestones: s.milestones.filter(m => !ids.includes(m.id)) })),

  deleteMilestone: id => {
    const snapshot = get().milestones.find(m => m.id === id)
    set(s => ({ milestones: s.milestones.filter(m => m.id !== id) }))
    return snapshot || null
  },

  restoreMilestone: milestone => set(s => ({ milestones: [...s.milestones, milestone] })),

  // --- File CRUD ---
  addFile: (file) =>
    set(s => ({
      files: [...s.files, { ...file, id: nextId('F'), date: new Date().toISOString().split('T')[0] }],
      activities: [{ id: nextId('A'), type: 'file_uploaded', userId: file.uploadedBy, projectId: file.projectId, timestamp: new Date().toISOString(), message: `uploaded ${file.name}` }, ...s.activities],
    })),

  deleteFile: id => {
    const snapshot = get().files.find(f => f.id === id)
    set(s => ({ files: s.files.filter(f => f.id !== id) }))
    return snapshot || null
  },

  restoreFile: file => set(s => ({ files: [...s.files, file] })),

  // --- Getters ---
  getTasksByStatus: (status) => get().tasks.filter(t => t.status === status),
  getTasksByProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
  getTasksByAssignee: (staffId) => get().tasks.filter(t => t.assigneeId === staffId),
}), persistOptions))

export default useStore
