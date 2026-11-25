import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Clock, CornerDownLeft, FileText, FolderKanban, LayoutDashboard, ListTodo, Milestone,
  Search, Settings, Users, ArrowUp, ArrowDown,
} from 'lucide-react'
import clsx from 'clsx'
import Avatar from './Avatar'
import { StatusBadge } from './Badge'
import useSearch from '../store/useSearch'
import useStore from '../store/useStore'
import { useAccess } from '../lib/access'

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Highlight({ text, q }) {
  if (!q) return text
  const parts = text.split(new RegExp(`(${esc(q)})`, 'ig'))
  return parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i} className="bg-transparent text-brand-700 font-semibold">{p}</mark> : p))
}

const GROUP_ORDER = ['Pages', 'Projects', 'Tasks', 'People', 'Files']

export default function CommandPalette() {
  const open = useSearch(s => s.open)
  const setOpen = useSearch(s => s.setOpen)
  const toggle = useSearch(s => s.toggle)
  const navigate = useNavigate()
  const { isAdmin, myProjects, myProjectIds } = useAccess()
  const tasksAll = useStore(s => s.tasks)
  const staff = useStore(s => s.staff)
  const filesAll = useStore(s => s.files)
  const clients = useStore(s => s.clients)

  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  useEffect(() => {
    if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 30) }
  }, [open])

  const items = useMemo(() => {
    const term = q.trim().toLowerCase()
    const match = (...fields) => fields.some(f => (f || '').toString().toLowerCase().includes(term))
    const score = (title) => (title.toLowerCase().startsWith(term) ? 0 : 1)
    const tasks = isAdmin ? tasksAll : tasksAll.filter(t => myProjectIds.has(t.projectId))
    const files = isAdmin ? filesAll : filesAll.filter(f => myProjectIds.has(f.projectId))
    const projectName = id => myProjects.find(p => p.id === id)?.name || ''
    const clientName = id => clients.find(c => c.id === id)?.name || ''
    const staffName = id => staff.find(s => s.id === id)?.name || ''

    const pages = [
      { to: '/', title: isAdmin ? 'Dashboard' : 'My Work', icon: LayoutDashboard },
      { to: '/projects', title: 'Projects', icon: FolderKanban },
      { to: '/tasks', title: isAdmin ? 'Tasks' : 'My Tasks', icon: ListTodo },
      { to: '/time-log', title: 'Time Log', icon: Clock },
      { to: '/files', title: 'Files', icon: FileText },
      ...(isAdmin ? [
        { to: '/staff', title: 'Staff', icon: Users },
        { to: '/milestones', title: 'Milestones', icon: Milestone },
        { to: '/reports', title: 'Reports', icon: BarChart3 },
      ] : []),
      { to: '/settings', title: 'Settings', icon: Settings },
    ].map(p => ({ ...p, kind: 'Pages', id: 'page' + p.to, sub: 'Go to page' }))

    if (!term) return pages.slice(0, 6)

    const byScore = (a, b) => score(a.title) - score(b.title)
    const out = [
      ...pages.filter(p => match(p.title)).sort(byScore).slice(0, 3),
      ...myProjects.filter(p => match(p.name, p.type, p.location, clientName(p.clientId))).map(p => ({
        kind: 'Projects', id: p.id, title: p.name, sub: `${p.type} · ${p.location}`, to: `/projects/${p.id}`, icon: FolderKanban, status: p.status,
      })).sort(byScore).slice(0, 5),
      ...tasks.filter(t => match(t.title, t.id, (t.tags || []).join(' '), staffName(t.assigneeId), t.type, projectName(t.projectId))).map(t => ({
        kind: 'Tasks', id: t.id, title: t.title, sub: `${projectName(t.projectId)} · ${staffName(t.assigneeId)}`, to: `/tasks?task=${t.id}`, icon: ListTodo, status: t.status,
      })).sort(byScore).slice(0, 6),
      ...(isAdmin ? staff.filter(s => match(s.name, s.role, s.email, (s.skills || []).join(' '))).map(s => ({
        kind: 'People', id: s.id, title: s.name, sub: s.role, to: `/staff?person=${s.id}`, person: s.name,
      })).sort(byScore).slice(0, 4) : []),
      ...files.filter(f => match(f.name, f.folder)).map(f => ({
        kind: 'Files', id: f.id, title: f.name, sub: `${f.folder} · ${projectName(f.projectId)}`, to: '/files', icon: FileText,
      })).sort(byScore).slice(0, 4),
    ]
    return out
  }, [q, isAdmin, tasksAll, filesAll, staff, clients, myProjects, myProjectIds])

  useEffect(() => { setIdx(0) }, [q])
  useEffect(() => { listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [idx, items])

  if (!open) return null

  function choose(item) {
    if (!item) return
    setOpen(false)
    navigate(item.to)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(items[idx]) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }

  const groups = GROUP_ORDER.map(g => ({ g, rows: items.map((it, i) => ({ it, i })).filter(x => x.it.kind === g) })).filter(x => x.rows.length)

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-surface-900/40" onClick={() => setOpen(false)} />
      <div role="dialog" aria-label="Search" className="relative w-[640px] max-w-[calc(100%-2rem)] bg-surface-0 border border-surface-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-surface-200 shrink-0">
          <Search size={20} className="text-surface-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={isAdmin ? 'Search projects, tasks, people, files…' : 'Search your projects, tasks, files…'}
            className="flex-1 h-full bg-transparent text-base text-surface-900 placeholder:text-surface-400 outline-none"
          />
          <kbd className="px-2 py-0.5 rounded-sm border border-surface-300 bg-surface-50 text-xs font-sans text-surface-500">Esc</kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {groups.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-surface-500">No results for “{q}”. Try a project name, task title or person.</p>
          )}
          {groups.map(({ g, rows }) => (
            <div key={g} className="mb-2 last:mb-0">
              <p className="px-3 pt-2 pb-1 text-xs font-semibold text-surface-500 uppercase tracking-wide">{q ? g : 'Jump to'}</p>
              {rows.map(({ it, i }) => (
                <button
                  key={it.kind + it.id}
                  type="button"
                  data-active={i === idx}
                  onMouseMove={() => setIdx(i)}
                  onClick={() => choose(it)}
                  className={clsx('w-full flex items-center gap-3 px-3 h-12 rounded-md text-left transition-colors', i === idx ? 'bg-brand-50' : 'hover:bg-surface-50')}
                >
                  {it.person ? <Avatar name={it.person} size="md" interactive={false} /> : (
                    <span className="w-8 h-8 rounded-md bg-surface-100 flex items-center justify-center shrink-0">
                      <it.icon size={16} className={i === idx ? 'text-brand-600' : 'text-surface-500'} />
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-surface-900 truncate"><Highlight text={it.title} q={q.trim()} /></span>
                    <span className="block text-xs text-surface-500 truncate">{it.sub}</span>
                  </span>
                  {it.status && <StatusBadge status={it.status} />}
                  {i === idx && <CornerDownLeft size={14} className="text-surface-400 shrink-0" />}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 h-10 border-t border-surface-200 bg-surface-50 text-xs text-surface-500 shrink-0">
          <span className="flex items-center gap-1"><ArrowUp size={12} /><ArrowDown size={12} /> navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={12} /> open</span>
          <span>esc close</span>
          <span className="ml-auto">{items.length} result{items.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  )
}
