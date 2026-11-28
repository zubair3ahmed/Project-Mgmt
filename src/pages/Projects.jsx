import EmptyState from '../components/EmptyState'
import { FolderKanban, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Plus, ArrowUpRight, Search, X, Pencil } from 'lucide-react'
import { useState } from 'react'
import Header from '../components/Header'
import Tabs from '../components/Tabs'
import { StatusBadge, PriorityBadge, CountBadge } from '../components/Badge'
import { AvatarGroup } from '../components/Avatar'
import MilestoneProgress from '../components/MilestoneProgress'
import useQuickAdd from '../store/useQuickAdd'
import { projectProgress } from '../lib/progress'
import { Input, Select, Button } from '../components/FormField'
import useStore from '../store/useStore'
import { useAccess, accessLevel, isClosed } from '../lib/access'

const formatContract = n => (n >= 1e7 ? `₹${+(n / 1e7).toFixed(2)}Cr` : `₹${(n / 1e5).toFixed(1)}L`)

const PROJECT_TYPES = ['Residential', 'Commercial', 'Industrial', 'Institutional', 'Infrastructure']
const PROJECT_STATUSES = ['planning', 'in-progress', 'on-hold', 'completed']

export default function Projects() {
  const allProjects = useStore(s => s.projects)
  const { isAdmin, myProjects, user } = useAccess()
  const openProject = useQuickAdd(s => s.openProject)
  const milestones = useStore(s => s.milestones)
  const jobs = useStore(s => s.tasks)
  const projects = isAdmin ? allProjects : myProjects
  const staff = useStore(s => s.staff)
  const clients = useStore(s => s.clients)

  const [activeTab, setActiveTab] = useState('all')
  const NO_FILTERS = { q: '', client: 'all', type: 'all', priority: 'all', manager: 'all', sort: 'name' }
  const [f, setF] = useState(NO_FILTERS)
  const setFilter = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const tabs = [
    { id: 'all', label: 'All Projects', count: projects.length, tone: 'brand' },
    { id: 'planning', label: 'To Do', count: projects.filter(p => p.status === 'planning').length, tone: 'gray' },
    { id: 'in-progress', label: 'In Progress', count: projects.filter(p => p.status === 'in-progress').length, tone: 'brand' },
    { id: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length, tone: 'success' },
  ]

  const byTab = activeTab === 'all' ? projects : projects.filter(p => p.status === activeTab)
  const clientName = id => clients.find(c => c.id === id)?.name || ''
  const term = f.q.trim().toLowerCase()
  const SORTS = {
    name: (a, b) => a.name.localeCompare(b.name),
    progress: (a, b) => projectProgress(b, milestones, jobs).percent - projectProgress(a, milestones, jobs).percent,
    end: (a, b) => (a.endDate || '9').localeCompare(b.endDate || '9'),
    value: (a, b) => b.contractValue - a.contractValue,
  }
  const filtered = byTab
    .filter(p => !term || [p.name, p.location, p.type, clientName(p.clientId)].some(x => (x || '').toLowerCase().includes(term)))
    .filter(p => f.client === 'all' || p.clientId === f.client)
    .filter(p => f.type === 'all' || p.type === f.type)
    .filter(p => f.priority === 'all' || p.priority === f.priority)
    .filter(p => f.manager === 'all' || p.managerId === f.manager)
    .sort(SORTS[f.sort])
  const activeFilters = ['q', 'client', 'type', 'priority', 'manager'].filter(k => f[k] !== NO_FILTERS[k]).length
  const clientOptions = clients.filter(c => projects.some(p => p.clientId === c.id))
  const managerOptions = staff.filter(m => projects.some(p => p.managerId === m.id))
  const typeOptions = PROJECT_TYPES.filter(t => projects.some(p => p.type === t))

  const openAdd = () => openProject()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Projects"
        subtitle={`${projects.length} projects`}
      />
      <div className="px-6 pt-4">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>
      <div className="px-6 pt-4 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <Input value={f.q} onChange={e => setFilter('q', e.target.value)} placeholder="Filter by name, client, location" className="h-8 pl-9 text-sm" />
        </div>
        <Select size="sm" className="w-auto min-w-36" value={f.client} onChange={e => setFilter('client', e.target.value)}>
          <option value="all">All clients</option>
          {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select size="sm" className="w-auto min-w-32" value={f.type} onChange={e => setFilter('type', e.target.value)}>
          <option value="all">All types</option>
          {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select size="sm" className="w-auto min-w-32" value={f.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="all">All priorities</option>
          {['urgent', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select size="sm" className="w-auto min-w-36" value={f.manager} onChange={e => setFilter('manager', e.target.value)}>
          <option value="all">All managers</option>
          {managerOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
        <Select size="sm" className="w-auto min-w-36" value={f.sort} onChange={e => setFilter('sort', e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="progress">Sort: Progress</option>
          <option value="end">Sort: End date</option>
          {isAdmin && <option value="value">Sort: Contract value</option>}
        </Select>
        {activeFilters > 0 && (
          <Button variant="tertiary" size="sm" onClick={() => setF(prev => ({ ...NO_FILTERS, sort: prev.sort }))}>
            <X size={14} /> Clear filters <CountBadge count={activeFilters} tone="brand" />
          </Button>
        )}
        <span className="ml-auto flex items-center gap-2 text-sm text-surface-500">
          <CountBadge count={filtered.length} tone="brand" /> of {byTab.length} shown
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
          <table data-m-hide="2 4 6 7" className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-3">Project</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Milestone progress</th>
                <th className="text-left px-4 py-3">Team</th>
                {isAdmin && <th className="text-left px-4 py-3">Contract</th>}
                {!isAdmin && <th className="text-left px-4 py-3">Your access</th>}
                <th className="text-left px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const client = clients.find(c => c.id === p.clientId)
                const team = p.teamIds.map(id => staff.find(s => s.id === id)).filter(Boolean)
                return (
                  <tr key={p.id} className="transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${p.id}`} className="text-sm font-medium text-surface-800 hover:text-brand-600 transition-colors">{p.name}</Link>
                      <p className="text-2xs text-surface-400 mt-1">{p.type} · {p.location}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-600">{client?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={p.priority} /></td>
                    <td className="px-4 py-3 w-52"><MilestoneProgress project={p} compact /></td>
                    <td className="px-4 py-3"><AvatarGroup people={team} /></td>
                    {isAdmin && <td className="px-4 py-3 text-xs text-surface-600 font-mono">{formatContract(p.contractValue)}</td>}
                    {!isAdmin && <td className="px-4 py-3 text-xs text-surface-600 whitespace-nowrap">{accessLevel(p, user) === 'write' ? 'Can add jobs' : 'View only'}</td>}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && !isClosed(p) && <button type="button" onClick={() => openProject(p)} aria-label={`Edit ${p.name}`} title="Edit project" className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-500"><Pencil size={14} /></button>}
                        <Link to={`/projects/${p.id}`} aria-label={`Open ${p.name}`} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-500">
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="bg-surface-0">
                  {projects.length === 0 ? (
                    <EmptyState compact icon={FolderKanban} title="No projects yet"
                      description={isAdmin ? 'A project holds its jobs, milestones, files and team. Type one line like “Prestige Tech Park Bangalore ₹2.5Cr 12 months” and the rest fills itself.' : 'You have not been added to a project yet. Your admin will add you, and it will appear here.'}
                      action={isAdmin ? { label: 'New project', icon: Plus, onClick: openAdd } : undefined} />
                  ) : (
                    <EmptyState compact icon={SearchX} title="No projects match" description="Try a different search, or clear the filters to see everything."
                      secondary={{ label: 'Clear filters', onClick: () => { setF(NO_FILTERS); setActiveTab('all') } }} />
                  )}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
