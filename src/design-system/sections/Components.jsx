import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Demo, Section, Sub } from './Primitives'
import { Alert, Button, Checkbox, FormField, Input, Select, Textarea, Toggle } from '@/components/FormField'
import { Badge, CountBadge, PriorityBadge, StatusBadge, Tag } from '@/components/Badge'
import Avatar, { AvatarGroup } from '@/components/Avatar'
import Tabs from '@/components/Tabs'
import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import Modal from '@/components/Modal'
import { AttachmentList, DropZone } from '@/components/Attachments'
import { AnimatedNumber, BarChart, Donut } from '@/components/charts'
import { AutoTag, SmartSummary, Starters } from '@/components/SmartFill'
import useToast from '@/store/useToast'

const Row = ({ label, children }) => (
  <div className="flex flex-col gap-2 w-full">
    <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{label}</span>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
)

const PEOPLE = ['Ravi Sharma', 'Priya Patel', 'Amit Desai', 'Sneha Kulkarni', 'Vikram Joshi', 'Meera Nair'].map(name => ({ name }))

export default function Components() {
  const [select, setSelect] = useState('')
  const [check, setCheck] = useState(true)
  const [toggle, setToggle] = useState(true)
  const [tab, setTab] = useState('all')
  const [modal, setModal] = useState(false)
  const [files, setFiles] = useState([])

  return (
    <>
      <Section id="components" title="Components" description="Everything below is rendered from the real components in src/components. Copy the snippets as-is.">
        <Demo
          id="buttons" title="Button" description="Four variants and three sizes. Primary is used once per view for the main action."
          importLine="import { Button } from '@/components/FormField'"
          className="flex flex-col gap-6"
          code={`<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="danger"><Trash2 size={16} /> Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>`}
          props={[
            ['variant', "'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'", "'primary'", 'Visual style'],
            ['size', "'sm' | 'md' | 'lg'", "'md'", '36px, 40px, 48px tall'],
            ['disabled', 'boolean', 'false', 'Reduces to the disabled style'],
            ['...props', 'ButtonHTMLAttributes', '', 'type, onClick, form and so on'],
          ]}
        >
          <Row label="Variants">
            <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="tertiary">Tertiary</Button>
            <Button variant="danger"><Trash2 size={16} /> Delete</Button>
          </Row>
          <Row label="Sizes"><Button size="sm">Small</Button><Button>Medium</Button><Button size="lg">Large</Button></Row>
          <Row label="States"><Button disabled>Disabled</Button><Button><Plus size={16} /> With icon</Button></Row>
        </Demo>

        <Demo
          id="form-fields" title="Form fields" description="shadcn/ui primitives themed to Core UI, wrapped so pages keep a simple API. Controls are 40px tall with an 8px radius and a 2px brand focus ring."
          importLine="import { FormField, Input, Select, Textarea, Checkbox, Toggle } from '@/components/FormField'"
          className="grid sm:grid-cols-2 gap-6"
          code={`<FormField label="Title" required>
  <Input value={v} onChange={e => setV(e.target.value)} placeholder="What needs to be done?" />
</FormField>

<FormField label="Project">
  <Select value={project} onChange={e => setProject(e.target.value)}>
    <option value="">Select project…</option>
    <option value="P001">Prestige Towers</option>
  </Select>
</FormField>

<Checkbox checked={on} onChange={e => setOn(e.target.checked)} label="Create another" />
<Toggle checked={on} onChange={e => setOn(e.target.checked)} label="Email alerts" supporting="Task assignments" />`}
          props={[
            ['FormField.label', 'string', '', 'Visible label'],
            ['FormField.required', 'boolean', 'false', 'Adds a red asterisk'],
            ['FormField.hint', 'string', '', 'Helper text under the control'],
            ['FormField.tag', 'ReactNode', '', 'Small AutoTag next to the label'],
            ['Select', 'native-style', '', 'Accepts <option> children and onChange(e). Backed by Radix Select. An option with value="" becomes the placeholder.'],
            ['Checkbox / Toggle', '{ checked, onChange, label, supporting }', '', 'onChange receives { target: { checked } }'],
          ]}
        >
          <FormField label="Title" required><Input placeholder="What needs to be done?" /></FormField>
          <FormField label="Project">
            <Select value={select} onChange={e => setSelect(e.target.value)}>
              <option value="">Select project…</option>
              <option value="P001">Prestige Towers - Block A</option>
              <option value="P002">Tata Commercial Hub</option>
            </Select>
          </FormField>
          <FormField label="Due date" hint="Helper text sits here"><Input type="date" /></FormField>
          <FormField label="Error state"><Input className="border-danger" defaultValue="invalid value" /><p className="text-xs text-danger">Give the task a title</p></FormField>
          <div className="sm:col-span-2"><FormField label="Description"><Textarea placeholder="Add context, drawing refs, or notes…" /></FormField></div>
          <Checkbox checked={check} onChange={e => setCheck(e.target.checked)} label="Create another" />
          <Toggle checked={toggle} onChange={e => setToggle(e.target.checked)} label="Email alerts" supporting="Task assignments" />
        </Demo>

        <Demo
          id="badges" title="Badges, counts and tags" description="Pill badges carry a status dot. Counts are round and tinted by meaning. Tags are small outlined labels."
          importLine="import { StatusBadge, PriorityBadge, Badge, CountBadge, Tag } from '@/components/Badge'"
          className="flex flex-col gap-6"
          code={`<StatusBadge status="in-progress" />
<PriorityBadge priority="high" />
<Badge tone="success">Paid</Badge>
<Badge tone="error" size="sm" dot={false}>4d overdue</Badge>
<CountBadge count={12} tone="brand" />
<Tag>rcc</Tag>`}
          props={[
            ['Badge.tone', "'gray' | 'brand' | 'success' | 'warning' | 'error'", "'gray'", 'Colour meaning'],
            ['Badge.size', "'sm' | 'md'", "'md'", ''],
            ['Badge.dot', 'boolean', 'true', 'Leading status dot'],
            ['StatusBadge.status', 'task | project | payment status', '', 'Maps backlog, todo, in-progress, review, done, planning, completed, paid and more to a tone'],
            ['CountBadge.count', 'number', '', 'Number shown in the circle'],
          ]}
        >
          <Row label="Status">{['backlog', 'todo', 'in-progress', 'review', 'done', 'overdue'].map(s => <StatusBadge key={s} status={s} />)}</Row>
          <Row label="Priority">{['low', 'medium', 'high', 'urgent'].map(p => <PriorityBadge key={p} priority={p} />)}</Row>
          <Row label="Tones and sizes">
            {['gray', 'brand', 'success', 'warning', 'error'].map(t => <Badge key={t} tone={t}>{t}</Badge>)}
            <Badge tone="error" size="sm" dot={false}>4d overdue</Badge>
          </Row>
          <Row label="Counts">{['gray', 'brand', 'success', 'warning', 'error'].map((t, i) => <CountBadge key={t} count={i + 2} tone={t} />)}</Row>
          <Row label="Tags"><Tag>rcc</Tag><Tag>foundation</Tag><Tag>detailing</Tag></Row>
        </Demo>

        <Demo
          id="avatars" title="Avatar" description="Illustrated portraits for known people with an initials fallback. Overlap them in a group."
          importLine="import Avatar, { AvatarGroup } from '@/components/Avatar'"
          className="flex flex-col gap-6"
          code={`<Avatar name="Ravi Sharma" size="lg" />
<Avatar name="New Person" />          {/* initials fallback */}
<AvatarGroup people={team} max={4} size="sm" />`}
          props={[
            ['name', 'string', '', 'Used for the portrait lookup and initials'],
            ['initials', 'string', '', 'Override the derived initials'],
            ['size', "'sm' | 'md' | 'lg' | 'xl'", "'md'", '24, 32, 40, 48px'],
            ['AvatarGroup.people', '{ name }[]', '', 'Shows up to max avatars then +N'],
          ]}
        >
          <Row label="Sizes">{['sm', 'md', 'lg', 'xl'].map(s => <Avatar key={s} name="Ravi Sharma" size={s} />)}</Row>
          <Row label="Fallback initials"><Avatar name="Dev Kumar" size="lg" /><Avatar name="Asha Rao" size="lg" /></Row>
          <Row label="Group"><AvatarGroup people={PEOPLE} max={4} size="md" /></Row>
        </Demo>

        <Demo
          id="tabs" title="Tabs" description="Underline tabs with optional count badges. Pass tone per tab to match status colours."
          importLine="import Tabs from '@/components/Tabs'"
          className="block"
          code={`<Tabs
  active={tab}
  onChange={setTab}
  tabs={[
    { id: 'all', label: 'All Projects', count: 5, tone: 'brand' },
    { id: 'active', label: 'Active', count: 3, tone: 'brand' },
    { id: 'done', label: 'Completed', count: 1, tone: 'success' },
  ]}
/>`}
          props={[['tabs', '{ id, label, count?, tone? }[]', '', 'Tab definitions'], ['active', 'string', '', 'Selected id'], ['onChange', '(id) => void', '', '']]}
        >
          <Tabs active={tab} onChange={setTab} tabs={[
            { id: 'all', label: 'All Projects', count: 5, tone: 'brand' },
            { id: 'active', label: 'Active', count: 3, tone: 'brand' },
            { id: 'planning', label: 'Planning', count: 1, tone: 'gray' },
            { id: 'done', label: 'Completed', count: 1, tone: 'success' },
          ]} />
        </Demo>

        <Demo
          id="cards" title="Cards and stat tiles" description="Cards are white, 12px radius, a 1px surface-300 border and shadow-sm. Stat tiles are the same card with a label, a large number and a caption."
          importLine="import StatCard from '@/components/StatCard'"
          className="grid sm:grid-cols-3 gap-4"
          code={`<StatCard label="Open tasks" value={11} sub="2 overdue" />

<section className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-5">
  ...
</section>`}
          props={[['label', 'string', '', 'Small caption'], ['value', 'ReactNode', '', 'Large figure. Use <AnimatedNumber> for count-up'], ['sub', 'string', '', 'Supporting text'], ['trend', 'number', '', 'Optional +/- percentage']]}
        >
          <StatCard label="Active projects" value={<AnimatedNumber value={3} />} sub="5 total" />
          <StatCard label="Open tasks" value={<AnimatedNumber value={11} />} sub="2 overdue" />
          <StatCard label="Revenue collected" value="₹2.0M" sub="₹4.9M pending" />
        </Demo>

        <Demo
          id="tables" title="Data table" description="Add the data-table class and write plain table markup. Header band, striped rows, brand-tint hover and thin dividers come from CSS."
          className="block"
          code={`<div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
  <table className="data-table w-full text-sm">
    <thead><tr><th className="text-left px-4 py-3">Project</th>...</tr></thead>
    <tbody>
      <tr><td className="px-4 py-3">Prestige Towers</td>...</tr>
    </tbody>
  </table>
</div>`}
        >
          <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
            <table className="data-table w-full text-sm">
              <thead><tr>{['Project', 'Status', 'Priority', 'Progress'].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>
                {[['Prestige Towers - Block A', 'in-progress', 'high', 62], ['Tata Commercial Hub', 'in-progress', 'high', 35], ['Godrej Villa Park', 'planning', 'medium', 18], ['Prestige Industrial Shed', 'completed', 'medium', 100]].map(([n, s, p, v]) => (
                  <tr key={n}>
                    <td className="px-4 py-3 font-medium text-surface-800">{n}</td>
                    <td className="px-4 py-3"><StatusBadge status={s} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={p} /></td>
                    <td className="px-4 py-3 w-40"><ProgressBar value={v} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Demo>

        <Demo
          id="progress" title="Progress bar" description="Animates from empty on mount. Colour shifts amber, blue, green by value."
          importLine="import ProgressBar from '@/components/ProgressBar'"
          className="flex flex-col gap-4"
          code={`<ProgressBar value={62} />
<ProgressBar value={35} size="md" />`}
          props={[['value', 'number (0-100)', '', ''], ['size', "'sm' | 'md'", "'sm'", '4px or 8px tall']]}
        >
          {[20, 50, 90].map(v => <div key={v} className="w-full max-w-md"><ProgressBar value={v} size="md" /></div>)}
        </Demo>

        <Demo
          id="alerts" title="Alert" description="Inline message with a tone and an optional action."
          importLine="import { Alert } from '@/components/FormField'"
          className="flex flex-col gap-3"
          code={`<Alert tone="error" action={<Button size="sm">Retry</Button>}>
  Unable to reach the server.
</Alert>`}
          props={[['tone', "'info' | 'success' | 'warning' | 'error'", "'info'", ''], ['icon', 'ReactNode', '', 'Leading icon'], ['action', 'ReactNode', '', 'Right-aligned control']]}
        >
          <Alert tone="info">New milestone template available.</Alert>
          <Alert tone="success">Task created.</Alert>
          <Alert tone="warning">2 tasks are past due.</Alert>
          <Alert tone="error" action={<Button size="sm" variant="secondary">Retry</Button>}>Unable to reach the server.</Alert>
        </Demo>

        <Demo
          id="toast" title="Toast" description="Outcome message after a create, with Undo and View actions. Auto-dismisses after 9 seconds. Mount <Toast /> once in the app shell."
          importLine="import useToast from '@/store/useToast'"
          code={`useToast.getState().show({
  title: 'Task created',
  detail: 'Foundation check · Ravi Sharma · due Fri, 27 Nov',
  actions: [
    { label: 'Undo', onClick: () => deleteTask(id) },
    { label: 'View', to: '/tasks' },
  ],
})`}
          props={[['title', 'string', '', ''], ['detail', 'string', '', 'Second line'], ['actions', '{ label, onClick? , to? }[]', '', 'Buttons on the toast'], ['duration', 'number (ms)', '9000', '']]}
        >
          <Button variant="secondary" onClick={() => useToast.getState().show({ title: 'Task created', detail: 'Foundation check · Ravi Sharma · due Fri, 27 Nov', actions: [{ label: 'Undo', onClick: () => {} }] })}>Show toast</Button>
        </Demo>

        <Demo
          id="modal" title="Modal" description="Centered dialog with a fixed header and footer and a scrolling body. Esc and backdrop click close it."
          importLine="import Modal from '@/components/Modal'"
          code={`<Modal open={open} onClose={() => setOpen(false)} title="New Task" wide
  footer={<><span /> <Button>Create Task</Button></>}>
  ...form...
</Modal>`}
          props={[['open', 'boolean', '', ''], ['onClose', '() => void', '', ''], ['title', 'string', '', ''], ['wide', 'boolean', 'false', '640px instead of 480px'], ['footer', 'ReactNode', '', 'Pinned action bar']]}
        >
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Modal open={modal} onClose={() => setModal(false)} title="Example modal" footer={<><span className="text-sm text-surface-500">Pinned footer</span><div className="flex gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => setModal(false)}>Save</Button></div></>}>
            <p className="text-sm text-surface-600">The body scrolls while the header and footer stay put.</p>
          </Modal>
        </Demo>

        <Demo
          id="attachments" title="Attachments" description="Drop zone with drag, click, and paste-a-screenshot support, plus a thumbnail grid. Validates 10 MB and 10 files."
          importLine="import { DropZone, AttachmentList } from '@/components/Attachments'"
          className="flex flex-col gap-4"
          code={`<DropZone compact count={files.length} onAdd={atts => setFiles(f => [...f, ...atts])} />
<AttachmentList items={files} onRemove={a => remove(a.id)} />`}
          props={[['DropZone.onAdd', '(attachments[]) => void', '', 'Validated files with object URLs'], ['DropZone.count', 'number', '0', 'Existing files, for the limit'], ['AttachmentList.items', 'Attachment[]', '', '{ id, name, size, type, url, addedBy }'], ['AttachmentList.canRemove', '(a) => boolean', '() => true', '']]}
        >
          <DropZone compact count={files.length} onAdd={a => setFiles(f => [...f, ...a])} />
          <AttachmentList items={files} onRemove={a => setFiles(f => f.filter(x => x.id !== a.id))} />
        </Demo>

        <Demo
          id="charts" title="Charts and counters" description="Dependency-free SVG and CSS. They animate in on mount and respect reduced motion."
          importLine="import { Donut, BarChart, AnimatedNumber } from '@/components/charts'"
          className="grid sm:grid-cols-3 gap-6 items-center"
          code={`<Donut data={[{ label: 'Done', value: 4, color: '#079455' }, ...]} centerValue={15} centerLabel="tasks" />
<BarChart data={[{ label: '18 Nov', value: 26 }, ...]} />
<AnimatedNumber value={2000000} format={n => '₹' + (n / 1e6).toFixed(1) + 'M'} />`}
          props={[['Donut.data', '{ label, value, color }[]', '', ''], ['Donut.size / stroke', 'number', '168 / 20', ''], ['BarChart.data', '{ label, value }[]', '', ''], ['AnimatedNumber.format', '(n) => string', 'locale integer', '']]}
        >
          <div className="flex justify-center"><Donut size={140} stroke={16} centerValue="15" centerLabel="tasks" data={[{ label: 'Backlog', value: 2, color: '#d0d5dd' }, { label: 'In Progress', value: 4, color: '#1570ef' }, { label: 'Review', value: 2, color: '#dc6803' }, { label: 'Done', value: 4, color: '#079455' }]} /></div>
          <BarChart height={120} data={[{ label: '10 Jul', value: 12 }, { label: '11 Jul', value: 16 }, { label: '18 Nov', value: 26 }, { label: '19 Nov', value: 13 }]} />
          <p className="text-3xl font-bold text-surface-900 text-center"><AnimatedNumber value={2000000} format={n => `₹${(n / 1e6).toFixed(1)}M`} /></p>
        </Demo>

        <Demo
          id="smart-fill" title="Smart fill" description="Pieces of the AI-assisted forms: provenance tags, the summary with reasons and Undo, and contextual starter lines."
          importLine="import { AutoTag, SmartSummary, Starters } from '@/components/SmartFill'"
          className="flex flex-col gap-4"
          code={`<AutoTag why="Best fit for Drafting work" />
<AutoTag state="review" why="Not detected in your text" />
<SmartSummary detected={['Prestige Towers', '@Ravi Sharma']}
  assumed={[{ key: 'est', label: 'Estimate', value: '12h', why: 'Typical for Drafting tasks', onUndo }]}
  notes={["I couldn't tell which project this belongs to."]} />
<Starters items={['Drawings for Prestige Towers due fri']} onPick={setText} />`}
          props={[['AutoTag.state', "'auto' | 'review'", "'auto'", 'Blue Auto or amber Needs review'], ['SmartSummary.detected', 'string[]', '', 'Chips parsed from text'], ['SmartSummary.assumed', '{ key, label, value, why, onUndo }[]', '', 'Defaults with reasons'], ['SmartSummary.notes', 'string[]', '', 'Needs-review warnings'], ['Starters.items', 'string[]', '', 'One-click example lines']]}
        >
          <div className="flex gap-3"><AutoTag why="Best fit for Drafting work" /><AutoTag state="review" why="Not detected in your text" /></div>
          <SmartSummary detected={['Prestige Towers - Block A', '@Ravi Sharma', 'due Fri, 27 Nov']} assumed={[{ key: 'est', label: 'Estimate', value: '12h', why: 'Typical for Drafting tasks.', onUndo: () => {} }]} notes={["I couldn't tell which project this belongs to. Pick one below."]} />
          <Starters items={['Drawings for Prestige Towers @Ravi due fri', 'Site visit Godrej Villa Park 4h !high']} onPick={() => {}} />
        </Demo>
      </Section>

      <Section id="patterns" title="Patterns" description="Larger compositions. See the source files for the full implementations.">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['Sidebar', 'components/Sidebar.jsx', 'Light gray panel, grouped nav (Workspace, Management, Resources), live count badges, white active pill, user card with sign-out, icon-only collapsed mode. Admin sees Management; members see My Work and My Tasks.'],
            ['Header and global search', 'components/Header.jsx, CommandPalette.jsx', 'Page title, a wide search bar that opens the command palette (⌘K), notifications and the account menu. Search results are scoped by role.'],
            ['Smart-fill task form', 'components/TaskFormModal.jsx, lib/smartTask.js', 'One typed line fills project, assignee, priority, due date, hours and type. Auto tags, assumptions with Undo, starters, attachments, outcome toast.'],
            ['Smart-fill project form', 'components/ProjectFormModal.jsx, lib/smartProject.js', 'Parses client, type, location, ₹ value and duration. Confirms the contract value before creating. Attachments are filed in the Files module.'],
            ['Task comments and history', 'components/TaskComments.jsx', 'Composer with @mentions and quick replies, comment thread, automatic History feed, edit and delete own.'],
            ['Role-based access', 'lib/access.js, store/useAuth.js, App.jsx', 'Admin and Team member roles. Route guards, scoped data and hidden money fields. The API must enforce the same rules.'],
          ].map(([t, file, d]) => (
            <div key={t} className="rounded-lg border border-surface-300 bg-surface-0 p-5 shadow-sm flex flex-col gap-2">
              <h3 className="font-semibold text-surface-900">{t}</h3>
              <p className="text-sm text-surface-600">{d}</p>
              <code className="mt-1 text-xs font-mono text-brand-700">{file}</code>
            </div>
          ))}
        </div>
        <Sub title="Rules of thumb">
          <ul className="list-disc pl-5 text-sm text-surface-600 flex flex-col gap-1.5">
            <li>Space and size in multiples of 4. Use 8, 16, 24 for layout.</li>
            <li>Cards always carry a 1px border (surface-300) and shadow-sm. Modals use shadow-2xl.</li>
            <li>One primary button per view. Destructive actions use the danger variant and a confirm step when irreversible.</li>
            <li>Colour carries meaning (status, priority). Never rely on colour alone: badges include a label.</li>
            <li>Respect <code className="font-mono text-xs">prefers-reduced-motion</code> for every animation.</li>
          </ul>
        </Sub>
      </Section>
    </>
  )
}
