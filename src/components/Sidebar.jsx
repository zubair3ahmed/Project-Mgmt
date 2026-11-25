import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, FolderKanban, ListTodo, Users, Clock, FileText, Milestone, BarChart3,
  Settings, PanelLeftClose, PanelLeft, LogOut, Palette, ExternalLink,
} from 'lucide-react'
import clsx from 'clsx'
import Avatar from './Avatar'
import { CountBadge } from './Badge'
import useStore from '../store/useStore'
import useAuth from '../store/useAuth'
import { useAccess } from '../lib/access'

function NavItem({ to, href, icon: Icon, label, count, collapsed, end }) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={collapsed ? `${label} (opens in a new tab)` : undefined}
        className={clsx('group flex items-center h-10 rounded-md text-sm font-medium text-surface-600 hover:bg-surface-300/50 hover:text-surface-900 transition-colors', collapsed ? 'justify-center' : 'px-3 gap-3')}
      >
        <Icon size={20} className="shrink-0 text-surface-500 group-hover:text-surface-700" />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
        {!collapsed && <ExternalLink size={14} className="text-surface-400" />}
      </a>
    )
  }
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center h-10 rounded-md text-sm font-medium transition-colors',
          collapsed ? 'justify-center' : 'px-3 gap-3',
          isActive ? 'bg-surface-0 text-brand-700 shadow-xs ring-1 ring-surface-300' : 'text-surface-600 hover:bg-surface-300/50 hover:text-surface-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={clsx('shrink-0', isActive ? 'text-brand-600' : 'text-surface-500 group-hover:text-surface-700')} />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && count > 0 && <CountBadge count={count} tone={isActive ? 'brand' : 'gray'} />}
          {collapsed && count > 0 && <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-surface-200" />}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const storedCollapsed = useStore(s => s.sidebarCollapsed)
  const mobileOpen = useStore(s => s.mobileNavOpen)
  const setMobileNav = useStore(s => s.setMobileNav)
  const { pathname } = useLocation()
  const [isDesktop, setIsDesktop] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => { setMobileNav(false) }, [pathname, setMobileNav])
  useEffect(() => {
    if (!mobileOpen) return
    const k = e => { if (e.key === 'Escape') setMobileNav(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [mobileOpen, setMobileNav])
  const collapsed = storedCollapsed && isDesktop
  const toggle = useStore(s => s.toggleSidebar)
  const tasks = useStore(s => s.tasks)
  const logout = useAuth(s => s.logout)
  const { user, isAdmin, staffId, myProjects } = useAccess()

  const openTasks = tasks.filter(t => t.status !== 'done' && (isAdmin || t.assigneeId === staffId)).length
  const activeProjects = myProjects.filter(p => p.status === 'in-progress').length

  const groups = [
    {
      label: 'Workspace',
      items: [
        { to: '/', icon: LayoutDashboard, label: isAdmin ? 'Dashboard' : 'My Work', end: true },
        { to: '/projects', icon: FolderKanban, label: 'Projects', count: activeProjects },
        { to: '/tasks', icon: ListTodo, label: isAdmin ? 'Tasks' : 'My Tasks', count: openTasks },
        { to: '/time-log', icon: Clock, label: 'Time Log' },
      ],
    },
    {
      label: 'Management',
      admin: true,
      items: [
        { to: '/staff', icon: Users, label: 'Staff' },
        { to: '/milestones', icon: Milestone, label: 'Milestones' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
      ],
    },
    { label: 'Resources', items: [{ to: '/files', icon: FileText, label: 'Files' }, ...(isAdmin && isDesktop ? [{ href: './design-system.html', icon: Palette, label: 'Design System' }] : [])] },
  ].filter(g => isAdmin || !g.admin)

  return (
    <>
    {mobileOpen && <div className="md:hidden fixed inset-0 z-40 bg-surface-900/40" onClick={() => setMobileNav(false)} aria-hidden="true" />}
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-surface-200 border-r border-surface-300 flex flex-col z-50 md:z-30 transition-[width,transform] duration-200',
        collapsed ? 'w-[72px]' : 'w-[240px]',
        mobileOpen ? 'translate-x-0' : 'max-md:-translate-x-full'
      )}
    >
      <div className={clsx('h-12 shrink-0 flex items-center border-b border-surface-300', collapsed ? 'justify-center' : 'px-4 justify-between')}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">SF</div>
          {!collapsed && <span className="text-base font-bold text-surface-900 tracking-tight truncate">StructFlow</span>}
        </div>
        {!collapsed && (
          <button onClick={isDesktop ? toggle : () => setMobileNav(false)} aria-label={isDesktop ? 'Collapse sidebar' : 'Close menu'} title={isDesktop ? 'Collapse sidebar' : 'Close menu'} className="w-8 h-8 flex items-center justify-center rounded-md text-surface-500 hover:bg-surface-300/50 hover:text-surface-800 transition-colors">
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <nav data-tour="nav" className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {groups.map(g => (
          <div key={g.label} className="flex flex-col gap-1">
            {collapsed ? (
              <div className="h-px bg-surface-200 mx-3 mb-2 first:hidden" />
            ) : (
              <p className="px-3 pb-1 text-xs font-semibold text-surface-600 tracking-wide uppercase">{g.label}</p>
            )}
            {g.items.map(item => <NavItem key={item.to || item.href} {...item} collapsed={collapsed} />)}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-surface-300 p-3 flex flex-col gap-3">
        <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
        {collapsed && (
          <button onClick={toggle} aria-label="Expand sidebar" title="Expand sidebar" className="h-10 flex items-center justify-center rounded-md text-surface-500 hover:bg-surface-300/50 hover:text-surface-800 transition-colors">
            <PanelLeft size={20} />
          </button>
        )}
        <div className={clsx('flex items-center gap-2 rounded-lg border border-surface-300 bg-surface-0', collapsed ? 'justify-center p-2' : 'p-2')}>
          <Avatar name={user?.name} initials={user?.avatar} size="md" interactive={false} />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-surface-900 truncate">{user?.name}</p>
                <p className="text-xs text-surface-500 truncate">{user?.title}</p>
              </div>
              <button onClick={logout} aria-label="Sign out" title="Sign out" className="w-8 h-8 flex items-center justify-center rounded-md text-surface-400 hover:bg-surface-200 hover:text-danger transition-colors">
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
    </>
  )
}
