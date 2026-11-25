import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import Header from '../components/Header'
import Tabs from '../components/Tabs'
import { StatusBadge, PriorityBadge, Tag } from '../components/Badge'
import Avatar from '../components/Avatar'
import ProgressBar from '../components/ProgressBar'
import useStore from '../store/useStore'
import { useAccess } from '../lib/access'

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
  const projectStages = useStore(s => s.projectStages)
  const staff = useStore(s => s.staff)
  const clients = useStore(s => s.clients)
  const updateProjectStage = useStore(s => s.updateProjectStage)

  const [tab, setTab] = useState('tasks')
  const { isAdmin, myProjectIds } = useAccess()

  const project = projects.find(p => p.id === id)
  if (!project || (!isAdmin && !myProjectIds.has(project.id))) return <div className="p-6">Project not found or you don't have access.</div>

  const client = clients.find(c => c.id === project.clientId)
  const manager = staff.find(s => s.id === project.managerId)
  const team = project.teamIds.map(tid => staff.find(s => s.id === tid)).filter(Boolean)
  const tasks = allTasks.filter(t => t.projectId === id)
  const milestones = allMilestones.filter(m => m.projectId === id)
  const files = allFiles.filter(f => f.projectId === id)
  const currentStageIdx = projectStages.findIndex(s => s.id === project.currentStage)

  const TABS = [
    { id: 'tasks', label: 'Tasks', count: tasks.length },
    { id: 'milestones', label: 'Milestones', count: milestones.length },
    { id: 'files', label: 'Files', count: files.length },
    { id: 'stages', label: 'Stages' },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title={project.name} subtitle={`${project.type} · ${project.location}`} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 border-b border-surface-100 bg-surface-0">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/projects" className="text-xs text-surface-400 hover:text-surface-600 flex items-center gap-1">
              <ArrowLeft size={12} /> Projects
            </Link>
            <span className="text-xs text-surface-300">/</span>
            <span className="text-xs text-surface-600 font-medium">{project.name}</span>
          </div>

          <div className={`grid gap-6 text-xs ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <div>
              <p className="text-surface-400 mb-1">Status</p>
              <StatusBadge status={project.status} />
            </div>
            <div>
              <p className="text-surface-400 mb-1">Priority</p>
              <PriorityBadge priority={project.priority} />
            </div>
            <div>
              <p className="text-surface-400 mb-1">Client</p>
              <p className="text-surface-700 font-medium">{client?.name}</p>
            </div>
            <div>
              <p className="text-surface-400 mb-1">Manager</p>
              <div className="flex items-center gap-2">
                {manager && <Avatar name={manager.name} size="sm" />}
                <span className="text-surface-700">{manager?.name}</span>
              </div>
            </div>
            <div>
              <p className="text-surface-400 mb-1">Timeline</p>
              <p className="text-surface-700">{project.startDate} → {project.endDate}</p>
            </div>
            {isAdmin && (
              <div>
              <p className="text-surface-400 mb-1">Contract Value</p>
              <p className="text-surface-700 font-mono font-semibold">{formatCurrency(project.contractValue)}</p>
            </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-400">Progress</span>
              <span className="text-xs font-mono text-surface-600">{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} size="md" />
          </div>
        </div>

        <div className="px-6 pt-3">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div className="p-6">
          {tab === 'tasks' && (
            <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
              <table data-m-hide="4 5" className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3">Task</th>
                    <th className="text-left px-4 py-3">Assignee</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Priority</th>
                    <th className="text-left px-4 py-3">Hours</th>
                    <th className="text-left px-4 py-3">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => {
                    const assignee = staff.find(s => s.id === t.assigneeId)
                    return (
                      <tr key={t.id} className="">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-surface-800">{t.title}</p>
                          <div className="flex gap-1 mt-1">{t.tags?.map(tag => <Tag key={tag}>{tag}</Tag>)}</div>
                        </td>
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
                  {tasks.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-surface-400">No tasks for this project</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'milestones' && (
            <div className="space-y-3">
              {milestones.map(m => (
                <div key={m.id} className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-4 flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-surface-800">{m.name}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-surface-400 mt-1">Due {m.dueDate} · {m.weightage}% weightage</p>
                  </div>
                  <div className="text-right">
                    {isAdmin && (<p className="text-sm font-mono font-semibold text-surface-800">{formatCurrency(m.paymentAmount)}</p>
                    )}
                    {isAdmin && <StatusBadge status={m.paymentStatus} />}
                  </div>
                </div>
              ))}
              {milestones.length === 0 && <div className="text-center py-8 text-sm text-surface-400">No milestones</div>}
            </div>
          )}

          {tab === 'files' && (
            <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
              <table data-m-hide="2 3 5" className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3">File</th>
                    <th className="text-left px-4 py-3">Folder</th>
                    <th className="text-left px-4 py-3">Uploaded By</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(f => {
                    const uploader = staff.find(s => s.id === f.uploadedBy)
                    return (
                      <tr key={f.id} className="">
                        <td className="px-4 py-3">
                          <p className="text-sm text-surface-800 font-medium">{f.name}</p>
                          <p className="text-2xs text-surface-400 uppercase">{f.type}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-surface-500">{f.folder}</td>
                        <td className="px-4 py-3 text-xs text-surface-500">{uploader?.name}</td>
                        <td className="px-4 py-3 text-xs text-surface-500">{f.date}</td>
                        <td className="px-4 py-3 text-xs font-mono text-surface-500">{f.size}</td>
                      </tr>
                    )
                  })}
                  {files.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-surface-400">No files uploaded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'stages' && (
            <div className="space-y-1">
              {projectStages.map((s, i) => {
                const isCurrent = s.id === project.currentStage
                const isPast = i < currentStageIdx
                return (
                  <div key={s.id}
                    onClick={() => updateProjectStage(id, s.id)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isCurrent ? 'bg-brand-50 border border-brand-200' : isPast ? 'bg-surface-0 hover:bg-surface-25' : 'opacity-50 hover:opacity-75'}`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${isPast ? 'bg-success text-white' : isCurrent ? 'bg-brand-500 text-white' : 'bg-surface-200 text-surface-500'}`}>
                      {isPast ? '✓' : s.order}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isCurrent ? 'text-brand-700' : 'text-surface-700'}`}>{s.name}</p>
                      {s.optional && <p className="text-2xs text-surface-400">Optional</p>}
                    </div>
                    {isCurrent && <span className="ml-auto text-2xs font-medium text-brand-600 bg-brand-100 px-2 py-1 rounded">Current</span>}
                    {isPast && <span className="ml-auto text-2xs font-medium text-success">Completed</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
