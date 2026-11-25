// Who earned what: attribute each project's paid revenue to the people who worked on it,
// in proportion to the hours they logged there. Used by the staff profile and Reports.

export function formatINR(n) {
  const sign = n < 0 ? '-' : ''
  const v = Math.abs(n)
  if (v >= 100000) return `${sign}₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `${sign}₹${(v / 1000).toFixed(0)}K`
  return `${sign}₹${Math.round(v)}`
}

// Revenue that has actually been paid on a project (paid milestones only).
export function paidRevenue(milestones, projectId) {
  return milestones
    .filter(m => m.projectId === projectId && m.paymentStatus === 'paid')
    .reduce((s, m) => s + (m.paymentAmount || 0), 0)
}

// One row per project the person logged time on, plus totals.
export function staffBreakdown(person, { projects, timeLogs, milestones }) {
  const mine = timeLogs.filter(l => l.staffId === person.id)
  const projectIds = [...new Set(mine.map(l => l.projectId))]
  const rows = projectIds.map(pid => {
    const project = projects.find(p => p.id === pid)
    const hours = mine.filter(l => l.projectId === pid).reduce((s, l) => s + l.hours, 0)
    const projectHours = timeLogs.filter(l => l.projectId === pid).reduce((s, l) => s + l.hours, 0)
    const share = projectHours > 0 ? hours / projectHours : 0
    const revenue = paidRevenue(milestones, pid) * share
    const cost = hours * person.hourlyRate
    return { project, projectId: pid, hours, projectHours, share, revenue, cost, profit: revenue - cost, billed: revenue > 0 }
  }).filter(r => r.project).sort((a, b) => b.hours - a.hours)

  const hours = rows.reduce((s, r) => s + r.hours, 0)
  const revenue = rows.reduce((s, r) => s + r.revenue, 0)
  const cost = rows.reduce((s, r) => s + r.cost, 0)
  return {
    rows,
    hours,
    revenue,
    cost,
    profit: revenue - cost,
    revenuePerHour: hours > 0 ? revenue / hours : 0,
    unbilledHours: rows.filter(r => !r.billed).reduce((s, r) => s + r.hours, 0),
  }
}
