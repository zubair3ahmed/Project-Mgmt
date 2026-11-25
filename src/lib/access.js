import useAuth from '../store/useAuth'
import useStore from '../store/useStore'

export function useAccess() {
  const user = useAuth(s => s.user)
  const projects = useStore(s => s.projects)
  const isAdmin = user?.role === 'admin'
  const staffId = user?.staffId ?? null
  const myProjects = isAdmin ? projects : projects.filter(p => p.managerId === staffId || p.teamIds.includes(staffId))
  const myProjectIds = new Set(myProjects.map(p => p.id))
  return { user, isAdmin, staffId, myProjects, myProjectIds }
}
