import { useNavigate } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import Modal from './Modal'
import Avatar from './Avatar'
import { Button } from './FormField'
import { CountBadge, StatusBadge, Tag } from './Badge'
import usePerson from '../store/usePerson'
import useStore from '../store/useStore'
import { useAccess } from '../lib/access'

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-surface-300 bg-surface-50 p-3">
      <p className="text-xs text-surface-500">{label}</p>
      <p className="text-xl font-bold text-surface-900">{value}</p>
    </div>
  )
}

export default function PersonDialog() {
  const personId = usePerson(s => s.personId)
  const hide = usePerson(s => s.hide)
  const staff = useStore(s => s.staff)
  const tasks = useStore(s => s.tasks)
  const { isAdmin, myProjects, myProjectIds } = useAccess()
  const navigate = useNavigate()

  const person = personId ? staff.find(s => s.id === personId) : null
  if (!person) return null

  const visibleTasks = tasks.filter(t => t.assigneeId === person.id && (isAdmin || myProjectIds.has(t.projectId)))
  const open = visibleTasks.filter(t => t.status !== 'done')
  const inProgress = visibleTasks.filter(t => t.status === 'in-progress').length
  const done = visibleTasks.filter(t => t.status === 'done').length
  const projects = myProjects.filter(p => p.managerId === person.id || p.teamIds.includes(person.id))

  const go = to => { hide(); navigate(to) }

  return (
    <Modal
      open
      onClose={hide}
      title="Team member"
      footer={
        <>
          <span className="text-sm text-surface-500">{person.status === 'active' ? 'Active' : 'Inactive'} since {person.joinDate?.slice(0, 4)}</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={hide}>Close</Button>
            {isAdmin && <Button onClick={() => go(`/staff?person=${person.id}`)}>Open full profile <ArrowRight size={16} /></Button>}
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={person.name} size="xl" interactive={false} />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-surface-900">{person.name}</p>
            <p className="text-sm text-surface-500">{person.role} · {person.department}</p>
            <a href={`mailto:${person.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"><Mail size={14} /> {person.email}</a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Open jobs" value={open.length} />
          <Stat label="In progress" value={inProgress} />
          <Stat label="Completed" value={done} />
        </div>

        {person.skills?.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-surface-800">Skills</p>
            <div className="flex flex-wrap gap-2">{person.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
          </div>
        )}

        {projects.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-surface-800">Projects <CountBadge count={projects.length} /></p>
            <ul className="flex flex-col gap-1">
              {projects.map(p => (
                <li key={p.id}>
                  <button type="button" onClick={() => go(`/projects/${p.id}`)} className="w-full flex items-center justify-between gap-3 h-9 px-3 rounded-md text-sm text-surface-700 hover:bg-surface-50 text-left">
                    <span className="truncate">{p.name}</span>
                    <span className="text-xs text-surface-500">{p.managerId === person.id ? 'Manager' : 'Team'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {open.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-surface-800">Current jobs</p>
            <ul className="flex flex-col gap-1">
              {open.slice(0, 4).map(t => (
                <li key={t.id}>
                  <button type="button" onClick={() => go(`/jobs?task=${t.id}`)} className="w-full flex items-center justify-between gap-3 min-h-9 px-3 py-1.5 rounded-md text-sm text-surface-700 hover:bg-surface-50 text-left">
                    <span className="truncate">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
