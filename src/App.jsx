import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Tasks from './pages/Tasks'
import Staff from './pages/Staff'
import TimeLog from './pages/TimeLog'
import Files from './pages/Files'
import Milestones from './pages/Milestones'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import useStore from './store/useStore'
import useAuth from './store/useAuth'
import Toast from './components/Toast'
import CommandPalette from './components/CommandPalette'
import PersonDialog from './components/PersonDialog'
import ConfirmDialog from './components/ConfirmDialog'
import Tour from './components/Tour'
import LiveSync from './components/LiveSync'

function Shell() {
  const user = useAuth(s => s.user)
  const collapsed = useStore(s => s.sidebarCollapsed)
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-200 ${
          collapsed ? 'md:ml-[72px]' : 'md:ml-[240px]'
        }`}
      >
        <Outlet />
      </main>
      <Toast />
      <CommandPalette />
      <PersonDialog />
      <ConfirmDialog />
      <Tour />
      <LiveSync />
    </div>
  )
}

function AdminOnly({ children }) {
  const role = useAuth(s => s.user?.role)
  return role === 'admin' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/time-log" element={<TimeLog />} />
        <Route path="/files" element={<Files />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/staff" element={<AdminOnly><Staff /></AdminOnly>} />
        <Route path="/milestones" element={<AdminOnly><Milestones /></AdminOnly>} />
        <Route path="/reports" element={<AdminOnly><Reports /></AdminOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
