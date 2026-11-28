import useAuth from '../store/useAuth'
import useStore from '../store/useStore'

// Project access is whatever the admin gave. 'write' can add jobs and upload files inside the project;
// 'read' can only view it. People see only the projects they have been added to.
export const ACCESS_LEVELS = [
  ['write', 'Can add jobs', 'View the project, add jobs and upload files.'],
  ['read', 'View only', 'View the project. Cannot add jobs or upload files.'],
]

// A completed project is closed: its milestones, jobs, hours and files are read-only until an admin
// reopens it. Payment status is the one exception, because clients often pay after handover.
export const isClosed = project => project?.status === 'completed'

export function accessLevel(project, user) {
  if (!project || !user) return null
  if (user.role === 'admin') return 'write'
  if (project.managerId === user.staffId) return 'write'
  if (!(project.teamIds || []).includes(user.staffId)) return null
  return project.access?.[user.staffId] || 'write'
}

export function useAccess() {
  const user = useAuth(s => s.user)
  const projects = useStore(s => s.projects)
  const isAdmin = user?.role === 'admin'
  const staffId = user?.staffId ?? null
  const myProjects = isAdmin ? projects : projects.filter(p => accessLevel(p, user))
  const myProjectIds = new Set(myProjects.map(p => p.id))
  const writableProjects = myProjects.filter(p => !isClosed(p) && accessLevel(p, user) === 'write')
  const canWrite = projectId => writableProjects.some(p => p.id === projectId)
  return { user, isAdmin, staffId, myProjects, myProjectIds, writableProjects, canWrite }
}
