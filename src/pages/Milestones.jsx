import EmptyState from '../components/EmptyState'
import { Milestone } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, ChevronRight, AlertTriangle, Zap, Hand } from 'lucide-react'
import clsx from 'clsx'
import Avatar from '../components/Avatar'
import { inr, milestoneProgress, PAYMENT_MODES } from '../lib/payments'
import Header from '../components/Header'
import { StatusBadge } from '../components/Badge'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'
import { FormField, Input, Select, Button } from '../components/FormField'
import useStore from '../store/useStore'
import { confirm } from '../store/useConfirm'
import useToast from '../store/useToast'

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${(n / 1000).toFixed(0)}K`
}

const PAYMENT_STATUSES = ['pending', 'ready', 'invoiced', 'paid']
const PS_LABEL = { pending: 'Not yet earned', ready: 'Ready to invoice', invoiced: 'Invoiced', paid: 'Paid' }

const emptyForm = { name: '', projectId: '', weightage: '', dueDate: '', paymentAmount: '', paymentMode: 'manual' }

export default function MilestonesPage() {
  const milestones = useStore(s => s.milestones)
  const projects = useStore(s => s.projects)
  const addMilestone = useStore(s => s.addMilestone)
  const updateMilestone = useStore(s => s.updateMilestone)
  const completeMilestone = useStore(s => s.completeMilestone)
  const updatePaymentStatus = useStore(s => s.updatePaymentStatus)
  const deleteMilestone = useStore(s => s.deleteMilestone)
  const tasks = useStore(s => s.tasks)
  const staff = useStore(s => s.staff)
  const addFromTemplate = useStore(s => s.addMilestonesFromTemplate)
  const removeMilestones = useStore(s => s.removeMilestones)
  const [open, setOpen] = useState(() => new Set())
  const toggle = id => setOpen(o => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n })

  const [filterProject, setFilterProject] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = filterProject === 'all' ? milestones : milestones.filter(m => m.projectId === filterProject)
  const totalValue = filtered.reduce((s, m) => s + m.paymentAmount, 0)
  const paidValue = filtered.filter(m => m.paymentStatus === 'paid').reduce((s, m) => s + m.paymentAmount, 0)
  const completedCount = filtered.filter(m => m.status === 'completed').length

  const projectGroups = {}
  filtered.forEach(m => {
    if (!projectGroups[m.projectId]) projectGroups[m.projectId] = []
    projectGroups[m.projectId].push(m)
  })

  async function handleComplete(m) {
    const ok = await confirm({
      title: 'Mark milestone complete?',
      message: `“${m.name}” will be marked as completed.`,
      details: [`This makes ${formatCurrency(m.paymentAmount)} (${m.weightage}% of the contract) eligible for invoicing.`],
      confirmLabel: 'Mark complete',
    })
    if (!ok) return
    const before = { status: m.status, completedDate: m.completedDate }
    completeMilestone(m.id)
    useToast.getState().show({
      title: 'Milestone completed',
      detail: `${m.name} · ${formatCurrency(m.paymentAmount)} ready to invoice`,
      actions: [{ label: 'Undo', onClick: () => useStore.getState().updateMilestone(m.id, before) }],
    })
  }

  async function handlePayment(m, status) {
    if (status === m.paymentStatus) return
    const ok = await confirm({
      title: `Mark payment as ${status}?`,
      message: `${formatCurrency(m.paymentAmount)} for “${m.name}” will change from ${m.paymentStatus} to ${status}.`,
      details: status === 'paid' ? ['It will count toward revenue collected on the dashboard and in reports.'] : status === 'pending' ? ['It will no longer count as invoiced or collected.'] : ['The client will be shown as invoiced for this amount.'],
      confirmLabel: `Mark ${status}`,
    })
    if (!ok) return
    const previous = m.paymentStatus
    updatePaymentStatus(m.id, status)
    useToast.getState().show({
      title: `Payment marked ${status}`,
      detail: `${m.name} · ${formatCurrency(m.paymentAmount)}`,
      actions: [{ label: 'Undo', onClick: () => useStore.getState().updatePaymentStatus(m.id, previous) }],
    })
  }

  async function handleApprove(m) {
    const ok = await confirm({
      title: 'Approve and send the payment request?',
      message: `${inr(m.paymentAmount)} (${m.weightage}% of the contract) for “${m.name}” will be marked as invoiced to the client.`,
      confirmLabel: 'Approve and invoice',
    })
    if (!ok) return
    updatePaymentStatus(m.id, 'invoiced')
    useToast.getState().show({
      title: 'Payment request sent', detail: `${m.name} · ${inr(m.paymentAmount)}`,
      actions: [{ label: 'Undo', onClick: () => useStore.getState().updatePaymentStatus(m.id, 'ready') }],
    })
  }

  async function handleTemplate(project) {
    const ok = await confirm({
      title: 'Create the six stage milestones?',
      message: `“${project.name}” gets Work Order, Framing Layout, Foundation & Columns, Plinth & Substructure, Floor Beam & Slab and Roof, weighted 5, 10, 25, 20, 30 and 10 percent of ${inr(project.contractValue)}.`,
      details: ['You can edit the weightage, dates and payment mode of each one afterwards.'],
      confirmLabel: 'Create milestones',
    })
    if (!ok) return
    const ids = addFromTemplate(project.id)
    useToast.getState().show({ title: `${ids.length} milestones created`, detail: project.name, actions: [{ label: 'Undo', onClick: () => useStore.getState().removeMilestones(ids) }] })
  }

  async function handleDelete(m) {
    const ok = await confirm({
      title: 'Delete this milestone?',
      message: `“${m.name}” will be removed from the contract schedule.`,
      details: [`${formatCurrency(m.paymentAmount)} (${m.weightage}% of the contract) will no longer be tracked.`],
      confirmLabel: 'Delete milestone',
      tone: 'danger',
    })
    if (!ok) return
    const snapshot = deleteMilestone(m.id)
    if (snapshot) {
      useToast.getState().show({
        tone: 'danger',
        title: 'Milestone deleted',
        detail: m.name,
        actions: [{ label: 'Undo', onClick: () => useStore.getState().restoreMilestone(snapshot) }],
      })
    }
  }

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(m) {
    setForm({
      name: m.name, projectId: m.projectId,
      weightage: String(m.weightage), dueDate: m.dueDate,
      paymentAmount: String(m.paymentAmount), paymentMode: m.paymentMode || 'manual',
    })
    setEditId(m.id)
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const data = { ...form, weightage: Number(form.weightage), paymentAmount: Number(form.paymentAmount) }
    if (editId) {
      updateMilestone(editId, data)
    } else {
      addMilestone(data)
    }
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Milestones & Contracts"
        subtitle={`${milestones.length} milestones`}
        actions={<Button onClick={openAdd}><Plus size={14} /> Add Milestone</Button>}
      />

      <div className="px-6 py-3 border-b border-surface-100 bg-surface-0 flex flex-wrap items-center gap-3">
        <Select size="sm" className="w-auto min-w-40"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-4">
            <p className="text-xs text-surface-400">Total Contract Value</p>
            <p className="text-2xl font-bold text-surface-900 font-mono mt-1">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-4">
            <p className="text-xs text-surface-400">Payments Received</p>
            <p className="text-2xl font-bold text-success font-mono mt-1">{formatCurrency(paidValue)}</p>
            <ProgressBar value={totalValue > 0 ? (paidValue / totalValue) * 100 : 0} className="mt-2" />
          </div>
          <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-4">
            <p className="text-xs text-surface-400">Milestones Completed</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{completedCount} <span className="text-sm font-normal text-surface-400">/ {filtered.length}</span></p>
          </div>
        </div>

        {Object.entries(projectGroups).map(([projectId, ms]) => {
          const project = projects.find(p => p.id === projectId)
          const projectTotal = ms.reduce((s, m) => s + m.paymentAmount, 0)
          const projectPaid = ms.filter(m => m.paymentStatus === 'paid').reduce((s, m) => s + m.paymentAmount, 0)

          return (
            <div key={projectId}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900">{project?.name}</h3>
                  <p className="text-2xs text-surface-400">{project?.type} · Contract: {formatCurrency(project?.contractValue || 0)}{(() => { const w = ms.reduce((n, x) => n + x.weightage, 0); return w === 100 ? '' : <span className="text-warning-dark font-medium"> · weightage adds up to {w}%, should be 100%</span> })()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-surface-600">{formatCurrency(projectPaid)} / {formatCurrency(projectTotal)}</p>
                </div>
              </div>

              <div data-tour="milestones" className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
                <table data-m-hide="2" className="data-table w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3">Milestone</th>
                      <th className="text-left px-4 py-3">Weightage</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Due Date</th>
                      <th className="text-right px-4 py-3">Payment</th>
                      <th className="text-left px-4 py-3">Payment Status</th>
                      <th className="text-right px-4 py-3 w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ms.map(m => (
                      <Fragment key={m.id}>
                      <tr className="">
                        <td className="px-4 py-3 text-sm font-medium text-surface-800">
                          <button type="button" onClick={() => toggle(m.id)} aria-expanded={open.has(m.id)} className="flex items-center gap-2 text-left hover:text-brand-700">
                            <ChevronRight size={14} className={clsx('shrink-0 text-surface-400 transition-transform', open.has(m.id) && 'rotate-90')} />
                            <span>{m.name}</span>
                            {(() => { const pr = milestoneProgress(m, tasks); return pr.total ? <span className={clsx('text-2xs font-semibold px-1.5 py-0.5 rounded-full border whitespace-nowrap', pr.complete ? 'bg-success-light text-success-dark border-success-border' : 'bg-surface-100 text-surface-600 border-surface-300')}>{pr.done}/{pr.total} jobs</span> : <span className="text-2xs text-surface-400 whitespace-nowrap">no jobs linked</span> })()}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-surface-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-400 rounded-full" style={{ width: `${m.weightage}%` }} />
                            </div>
                            <span className="text-xs font-mono text-surface-500">{m.weightage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                        <td className="px-4 py-3 text-xs text-surface-500">{m.dueDate}</td>
                        <td className="px-4 py-3 text-sm font-mono text-surface-800 text-right">{formatCurrency(m.paymentAmount)}</td>
                        <td className="px-4 py-3">
                          <Select size="sm" className="w-auto min-w-40"
                            value={m.paymentStatus}
                            onChange={e => handlePayment(m, e.target.value)}
                          >
                            {PAYMENT_STATUSES.map(ps => <option key={ps} value={ps}>{PS_LABEL[ps]}</option>)}
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {m.status !== 'completed' && (
                              <button onClick={() => handleComplete(m)} title="Mark complete"
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-green-50 text-surface-400 hover:text-success"><CheckCircle size={14} /></button>
                            )}
                            <button onClick={() => openEdit(m)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-400 hover:text-surface-600"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(m)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 text-surface-400 hover:text-danger"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                      {open.has(m.id) && (
                        <tr><td colSpan={7} className="p-0 bg-surface-25"><ProgressPanel m={m} tasks={tasks} staff={staff} onApprove={handleApprove} onMode={mode => updateMilestone(m.id, { paymentMode: mode })} /></td></tr>
                      )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {(filterProject === 'all' ? projects : projects.filter(p => p.id === filterProject)).filter(p => !milestones.some(m => m.projectId === p.id)).map(p => (
          <div key={p.id} className="rounded-lg border border-dashed border-surface-300 bg-surface-0 p-5 flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-sm font-semibold text-surface-900">{p.name} has no milestones</p><p className="text-xs text-surface-500 mt-0.5">Start from the six delivery stages, or add your own. Weightages should add up to 100% of {inr(p.contractValue)}.</p></div>
            <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => handleTemplate(p)}>Use stage template</Button><Button size="sm" onClick={() => { setForm({ ...emptyForm, projectId: p.id }); setEditId(null); setShowForm(true) }}>Add milestone</Button></div>
          </div>
        ))}
        {Object.keys(projectGroups).length === 0 && projects.length === 0 && (
          <EmptyState icon={Milestone} title="No milestones yet"
            description="A milestone is a slice of the contract value. Jobs are linked to it, and when the last one is done its payment request is raised. Create a project first, then set its milestones here."
            action={{ label: 'Create a project', to: '/projects' }} />
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Milestone' : 'Add Milestone'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Milestone Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Foundation Design Complete" required />
          </FormField>
          <FormField label="Project" required>
            <Select value={form.projectId} onChange={e => setForm(f => { const proj = projects.find(p => p.id === e.target.value); const amt = proj && f.weightage ? Math.round(proj.contractValue * Number(f.weightage) / 100) : f.paymentAmount; return { ...f, projectId: e.target.value, paymentAmount: String(amt) } })} required>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Weightage (%)" required>
              <Input type="number" min="1" max="100" value={form.weightage} onChange={e => setForm(f => { const proj = projects.find(p => p.id === f.projectId); return { ...f, weightage: e.target.value, paymentAmount: proj && e.target.value ? String(Math.round(proj.contractValue * Number(e.target.value) / 100)) : f.paymentAmount } })} placeholder="25" required />
            </FormField>
            <FormField label="Due Date" required>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} required />
            </FormField>
            <FormField label="Payment Amount (₹)" required hint="Contract value × weightage">
              <Input type="number" value={form.paymentAmount} onChange={e => setForm(f => ({ ...f, paymentAmount: e.target.value }))} placeholder="500000" required />
            </FormField>
          </div>
          <FormField label="When a job is done" hint="How its share of this milestone's payment is triggered">
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_MODES.map(([v, l, d]) => (
                <button key={v} type="button" onClick={() => setForm(f => ({ ...f, paymentMode: v }))} className={clsx('text-left rounded-lg border p-3 transition-colors', form.paymentMode === v ? 'border-brand-600 bg-brand-50' : 'border-surface-300 hover:bg-surface-50')}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-surface-900">{v === 'auto' ? <Zap size={14} /> : <Hand size={14} />}{l}</span>
                  <span className="block text-xs text-surface-500 mt-1">{d}</span>
                </button>
              ))}
            </div>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">{editId ? 'Save Changes' : 'Add Milestone'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const TASK_TONE = { done: 'bg-success-light text-success-dark border-success-border', 'in-progress': 'bg-info-light text-brand-700 border-brand-200', review: 'bg-warning-light text-warning-dark border-warning-border' }

function ProgressPanel({ m, tasks, staff, onApprove, onMode }) {
  const pr = milestoneProgress(m, tasks)
  return (
    <div className="px-6 py-4 flex flex-col gap-4 border-t border-surface-200">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-[14rem] flex-1">
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="font-semibold text-surface-800">Milestone progress · pays {inr(m.paymentAmount)} ({m.weightage}% of the contract)</span>
            <span className="font-mono font-semibold text-surface-700">{pr.done} of {pr.total} jobs</span>
          </div>
          <ProgressBar value={pr.pct} />
          <p className="text-xs text-surface-500 mt-1.5">
            {m.paymentStatus === 'ready' ? 'Every job is done. This payment request is waiting for your approval.'
              : m.paymentStatus === 'invoiced' ? 'The payment request has been sent to the client.'
              : m.paymentStatus === 'paid' ? 'The client has paid this milestone.'
              : pr.total ? 'The payment request is raised when the last job is marked done.' : 'Link jobs to this milestone when creating them.'}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-surface-600">
          When the last job is done
          <Select size="sm" className="w-auto min-w-44" value={m.paymentMode || 'manual'} onChange={e => onMode(e.target.value)}>
            {PAYMENT_MODES.map(([v, l]) => <option key={v} value={v}>{l === 'Automatic' ? 'Send request automatically' : 'Wait for my approval'}</option>)}
          </Select>
        </label>
        {m.paymentStatus === 'ready' && <Button size="sm" onClick={() => onApprove(m)}>Approve and invoice</Button>}
      </div>
      {pr.total === 0 ? (
        <p className="text-sm text-surface-500">No jobs are linked to this milestone yet. When anyone creates a job, they can pick this milestone, and finishing every linked job completes it.</p>
      ) : (
        <div className="border border-surface-300 rounded-lg overflow-hidden bg-surface-0">
          <table className="w-full text-sm">
            <thead><tr className="bg-surface-100 text-xs text-surface-600"><th className="text-left font-semibold px-4 py-2">Job</th><th className="text-left font-semibold px-4 py-2 max-sm:hidden">Assignee</th><th className="text-left font-semibold px-4 py-2">Status</th></tr></thead>
            <tbody>
              {pr.list.map(t => {
                const who = staff.find(x => x.id === t.assigneeId)
                return (
                  <tr key={t.id} className="border-t border-surface-200">
                    <td className="px-4 py-2.5 font-medium text-surface-800">{t.title}</td>
                    <td className="px-4 py-2.5 max-sm:hidden">{who && <span className="flex items-center gap-2"><Avatar name={who.name} size="sm" interactive={false} />{who.name.split(' ')[0]}</span>}</td>
                    <td className="px-4 py-2.5"><span className={clsx('text-2xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap capitalize', TASK_TONE[t.status] || 'bg-surface-100 text-surface-600 border-surface-300')}>{t.status.replace('-', ' ')}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
