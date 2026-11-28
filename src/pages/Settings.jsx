import { STAGE_TEMPLATE } from '../lib/payments'
import { useState } from 'react'
import Header from '../components/Header'
import { FormField, Input, Select, Button, Toggle } from '../components/FormField'
import useStore from '../store/useStore'
import { useAccess } from '../lib/access'

export default function Settings() {
  const projectStages = useStore(s => s.projectStages)
  const { isAdmin } = useAccess()

  const [org, setOrg] = useState({ company: 'StructFlow Design Consultants', industry: 'Structural Design Consulting', currency: 'INR' })
  const [notifications, setNotifications] = useState({
    taskAssignment: true, statusChange: true, milestoneComplete: true, fileUpload: true, timeReminder: true,
  })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Settings"
        subtitle="Application configuration"
        actions={
          <Button onClick={handleSave}>
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {isAdmin && (
          <section>
            <h2 className="text-sm font-semibold text-surface-900 mb-3">Organization</h2>
            <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-6 space-y-4">
              <FormField label="Company Name">
                <Input value={org.company} onChange={e => setOrg(o => ({ ...o, company: e.target.value }))} />
              </FormField>
              <FormField label="Industry">
                <Input value={org.industry} onChange={e => setOrg(o => ({ ...o, industry: e.target.value }))} />
              </FormField>
              <FormField label="Default Currency">
                <Select value={org.currency} onChange={e => setOrg(o => ({ ...o, currency: e.target.value }))}>
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </Select>
              </FormField>
            </div>
          </section>
          )}

          {isAdmin && (
          <section>
            <h2 className="text-sm font-semibold text-surface-900 mb-3">Milestone Template</h2>
            <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-6 space-y-4">
              <div>
                <p className="text-xs text-surface-500 mb-1">The six delivery stages</p>
                <p className="text-xs text-surface-400 mb-2">Used as the starting milestones of a new project</p>
                <div className="space-y-2">
                  {projectStages.map(stage => (
                    <div key={stage.id} className="flex items-center gap-3 py-2">
                      <span className="w-6 h-6 rounded-md bg-surface-100 text-surface-500 text-xs flex items-center justify-center font-medium">{stage.order}</span>
                      <span className="text-sm text-surface-700">{stage.name}</span>
                      <span className="text-xs font-mono text-surface-500 ml-auto">{STAGE_TEMPLATE[stage.order - 1]?.[1]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-surface-900 mb-3">Notifications</h2>
            <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-6 space-y-4">
              {[
                { key: 'taskAssignment', label: 'Job assignments' },
                { key: 'statusChange', label: 'Job status changes' },
                { key: 'milestoneComplete', label: 'Milestone completions' },
                { key: 'fileUpload', label: 'File uploads' },
                { key: 'timeReminder', label: 'Time log reminders' },
              ].map(item => (
                <Toggle key={item.key} label={item.label} checked={notifications[item.key]} onChange={e => setNotifications(n => ({ ...n, [item.key]: e.target.checked }))} />
              ))}
            </div>
          </section>

          {isAdmin && (
          <section>
            <h2 className="text-sm font-semibold text-surface-900 mb-3">Job Types</h2>
            <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-6">
              <p className="text-xs text-surface-400 mb-3">Available job types for the organization</p>
              <div className="flex gap-2 flex-wrap">
                {['Design', 'Drafting', 'Review / QC', 'Analysis', 'Estimation', 'Report', 'Site Visit', 'Coordination'].map(t => (
                  <span key={t} className="inline-flex items-center h-8 px-3 text-xs font-medium bg-surface-50 text-surface-600 border border-surface-200 rounded-md">{t}</span>
                ))}
              </div>
            </div>
          </section>
          )}
        </div>
      </div>
    </div>
  )
}
