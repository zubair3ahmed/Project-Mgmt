import { milestoneProgress } from './payments'

// Project progress is milestone achievement: the share of the project (by weightage) whose
// milestones are complete. Each segment also shows how far its own jobs have got.
export function projectProgress(project, milestones, tasks) {
  const list = milestones.filter(m => m.projectId === project.id).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
  const totalWeight = list.reduce((n, m) => n + (Number(m.weightage) || 0), 0)
  const segments = list.map(m => {
    const jobs = milestoneProgress(m, tasks)
    const achieved = m.status === 'completed'
    return { milestone: m, achieved, done: jobs.done, total: jobs.total, fill: achieved ? 100 : jobs.pct, share: totalWeight ? (m.weightage / totalWeight) * 100 : 0 }
  })
  const achievedWeight = segments.filter(s => s.achieved).reduce((n, s) => n + s.share, 0)
  return { segments, percent: Math.round(achievedWeight), achieved: segments.filter(s => s.achieved).length, total: segments.length }
}
