// Money lives on the milestone, never on a task (per the product brief): each milestone carries a
// weightage % of the contract value, and completing it raises the client payment request.
// Tasks only say which milestone they count toward.

export const PAYMENT_MODES = [
  ['auto', 'Automatic', 'When the last task is done, the payment request is sent straight away.'],
  ['manual', 'Manual', 'When the last task is done, it waits as "Ready to invoice" for an admin to approve.'],
]

// Predefined milestones taken from the client's six delivery stages. Weights add up to 100.
export const STAGE_TEMPLATE = [
  ['Work Order', 5],
  ['Framing Layout & Structural Estimate', 10],
  ['Stage 1: Foundation & Column Details', 25],
  ['Stage 2: Plinth Beam & Substructure', 20],
  ['Floor Beam & Slab Details', 30],
  ['Roof Details', 10],
]

export const inr = n => `\u20b9${Math.round(n || 0).toLocaleString('en-IN')}`

export const milestoneTasks = (tasks, milestoneId) => tasks.filter(t => t.milestoneId === milestoneId)

export function milestoneProgress(milestone, tasks) {
  const list = milestoneTasks(tasks, milestone.id)
  const done = list.filter(t => t.status === 'done').length
  return { list, done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0, complete: list.length > 0 && done === list.length }
}
