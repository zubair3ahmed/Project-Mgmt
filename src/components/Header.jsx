import { Bell, CircleHelp, Database, LogOut, Menu, Plus, Search } from 'lucide-react'
import useQuickAdd from '../store/useQuickAdd'
import { useAccess } from '../lib/access'
import { Button } from './FormField'
import { confirm } from '../store/useConfirm'
import useToast from '../store/useToast'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../store/useAuth'
import useSearch from '../store/useSearch'
import useStore from '../store/useStore'
import useTour from '../store/useTour'
import Avatar from './Avatar'

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)

export default function Header({ title, subtitle, actions }) {
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const setSearchOpen = useSearch(s => s.setOpen)
  const navigate = useNavigate()
  const { isAdmin, writableProjects } = useAccess()
  const openProject = useQuickAdd(s => s.openProject)
  const addJob = useQuickAdd(s => s.addJob)
  const noWrite = !isAdmin && writableProjects.length === 0
  const setMobileNav = useStore(s => s.setMobileNav)
  const mode = useStore(s => s.workspaceMode)
  const setMode = useStore(s => s.setWorkspaceMode)
  async function switchMode() {
    const toEmpty = mode !== 'empty'
    setMenu(false)
    const ok = await confirm({
      title: toEmpty ? 'Start with an empty workspace?' : 'Load the demo data?',
      message: toEmpty ? 'Projects, jobs, time logs, milestones and files are cleared so you can see every first-run screen. Only you stay on the team.' : 'The sample projects, jobs, team and payments come back, replacing anything you added.',
      confirmLabel: toEmpty ? 'Start empty' : 'Load demo data',
      tone: toEmpty ? 'danger' : 'primary',
    })
    if (!ok) return
    setMode(toEmpty ? 'empty' : 'demo')
    navigate('/')
    useToast.getState().show({ tone: 'success', title: toEmpty ? 'Empty workspace' : 'Demo data loaded', detail: toEmpty ? 'Visit any page to see its first-run screen.' : 'Sample projects and jobs are back.' })
  }

  useEffect(() => {
    if (!menu) return
    const close = e => { if (!menuRef.current?.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  return (
    <>
    <header className="h-14 border-b border-surface-200 bg-surface-0 grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 md:px-6 shrink-0">
      <div className="flex items-center">
        <button type="button" onClick={() => setMobileNav(true)} className="md:hidden h-9 w-9 shrink-0 flex items-center justify-center rounded-md text-surface-600 hover:bg-surface-100" data-tour="menu" aria-label="Open menu"><Menu size={20} /></button>
      </div>

      {/* centred: a compact search with the one global create action beside it */}
      <div className="flex items-center justify-end md:justify-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="w-9 sm:w-64 lg:w-80 h-9 shrink-0 flex items-center justify-center sm:justify-start gap-2 sm:px-3 rounded-md border border-surface-300 bg-surface-0 text-sm text-surface-500 hover:border-surface-400 transition-colors"
          aria-label="Open search"
          data-tour="search"
        >
          <Search size={16} className="shrink-0" />
          <span className="flex-1 text-left truncate max-sm:hidden">Search</span>
          <kbd className="max-sm:hidden px-1.5 py-0.5 rounded-sm border border-surface-300 bg-surface-50 text-xs font-sans text-surface-500 shrink-0">{isMac ? '⌘ K' : 'Ctrl K'}</kbd>
        </button>
        <span data-tour="create" className="shrink-0" title={noWrite ? 'You have view-only access. Ask your admin for permission to add jobs.' : undefined}>
          <Button onClick={() => (isAdmin ? openProject() : addJob())} disabled={noWrite} className="h-9 max-sm:w-9 max-sm:px-0" aria-label={isAdmin ? 'Add project' : 'Add job'}>
            <Plus size={16} /> <span className="max-sm:hidden">{isAdmin ? 'Add project' : 'Add job'}</span>
          </Button>
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0">
        <button className="max-sm:hidden h-8 w-8 flex items-center justify-center rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-50 transition-colors relative" aria-label="Notifications">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>
        <div className="relative md:ml-2" ref={menuRef}>
          <button onClick={() => setMenu(m => !m)} className="rounded-full hover:ring-2 hover:ring-brand-200 transition-shadow" data-tour="account" aria-label="Account menu">
            <Avatar name={user?.name} initials={user?.avatar} size="md" interactive={false} />
          </button>
          {menu && (
            <div className="absolute right-0 top-10 z-40 w-64 bg-surface-0 border border-surface-200 rounded-lg shadow-lg p-2">
              <div className="px-3 py-2 flex flex-col">
                <Avatar name={user?.name} initials={user?.avatar} size="xl" className="mb-3" interactive={false} />
                <p className="text-sm font-semibold text-surface-900">{user?.name}</p>
                <p className="text-xs text-surface-500">{user?.title}</p>
                <span className="inline-block w-fit mt-2 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
                  {user?.role === 'admin' ? 'Admin' : 'Team member'}
                </span>
              </div>
              <div className="border-t border-surface-100 my-1" />
              <button
                onClick={switchMode}
                className="w-full flex items-center gap-2 px-3 h-10 rounded-md text-sm font-medium text-surface-700 hover:bg-surface-50"
              >
                <Database size={16} /> {mode === 'empty' ? 'Load demo data' : 'Start with empty workspace'}
              </button>
              <button
                onClick={() => { setMenu(false); useTour.getState().start() }}
                className="w-full flex items-center gap-2 px-3 h-10 rounded-md text-sm font-medium text-surface-700 hover:bg-surface-50"
              >
                <CircleHelp size={16} /> Take the tour
              </button>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="w-full flex items-center gap-2 px-3 h-10 rounded-md text-sm font-medium text-surface-700 hover:bg-surface-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* page bar: the page title, with the actions that belong to this page only */}
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 md:px-6 py-3 bg-surface-0 border-b border-surface-200 shrink-0">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-surface-900 leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-surface-500 truncate">{subtitle}</p>}
      </div>
      {actions && <div data-tour="action" className="flex items-center gap-2">{actions}</div>}
    </div>
    </>
  )
}
