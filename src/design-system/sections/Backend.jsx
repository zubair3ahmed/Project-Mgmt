import { useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import clsx from 'clsx'
import { Section, Sub, CodeBlock } from './Primitives'
import { Button } from '@/components/FormField'
import { Badge, CountBadge } from '@/components/Badge'
import { BUSINESS_RULES, CUSTOM_ENDPOINTS, ENTITIES, PERMISSIONS } from '../backendSpec'
import { generateBackendMd, generateOpenApi, generateSql } from '../generators'

const METHOD_TONE = { GET: 'brand', POST: 'success', PATCH: 'warning', DELETE: 'error' }

function endpoints() {
  const rows = []
  for (const e of ENTITIES) {
    if (e.access === 'nested') continue
    rows.push(['GET', `/${e.path}`, `List ${e.name}`, e.access === 'admin' ? 'admin' : 'by role'])
    rows.push(['GET', `/${e.path}/{id}`, `Get one ${e.name}`, e.access === 'admin' ? 'admin' : 'by role'])
    if (e.access === 'CRUD' || e.access === 'admin') {
      rows.push(['POST', `/${e.path}`, `Create ${e.name}`, e.access === 'admin' ? 'admin' : 'by role'])
      rows.push(['PATCH', `/${e.path}/{id}`, `Update ${e.name}`, e.access === 'admin' ? 'admin' : 'by role'])
      rows.push(['DELETE', `/${e.path}/{id}`, `Delete ${e.name}`, e.access === 'admin' ? 'admin' : 'by role'])
    }
  }
  rows.push(['GET', '/tasks/{taskId}/comments', 'List comments and history', 'by role'], ['POST', '/tasks/{taskId}/comments', 'Add a comment', 'by role'])
  rows.push(['PATCH', '/comments/{id}', 'Edit own comment', 'own'], ['DELETE', '/comments/{id}', 'Delete own comment (admin: any)', 'own'])
  rows.push(['GET', '/tasks/{taskId}/attachments', 'List attachments', 'by role'], ['POST', '/tasks/{taskId}/attachments', 'Upload files (multipart)', 'by role'], ['DELETE', '/attachments/{id}', 'Remove attachment', 'own'])
  CUSTOM_ENDPOINTS.forEach(c => rows.push([c.method, c.path, c.summary, c.roles]))
  return rows
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function Entity({ e }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-surface-300 bg-surface-0 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-50">
        <span className="font-semibold text-surface-900">{e.name}</span>
        <code className="text-xs font-mono text-surface-500">/{e.path}</code>
        <CountBadge count={e.fields.length} tone="gray" />
        <span className="ml-auto"><ChevronDown size={16} className={clsx('text-surface-400 transition-transform', open && 'rotate-180')} /></span>
      </button>
      {open && (
        <div className="border-t border-surface-200">
          <p className="px-5 py-3 text-sm text-surface-600 bg-surface-50">{e.description}</p>
          <table className="data-table w-full text-sm">
            <thead><tr><th className="text-left px-4 py-3">Field</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Notes</th></tr></thead>
            <tbody>
              {e.fields.map(f => (
                <tr key={f.name}>
                  <td className="px-4 py-2 font-mono text-xs text-brand-700">{f.name}{f.required && <span className="text-danger">*</span>}</td>
                  <td className="px-4 py-2 font-mono text-xs text-surface-600">{f.type.startsWith('enum:') ? f.type.slice(5).split('|').join(' | ') : f.type}{f.ref && <span className="text-surface-400"> {'->'} {f.ref}</span>}</td>
                  <td className="px-4 py-2 text-xs text-surface-600">{[f.readOnly && 'read-only', f.writeOnly && 'write-only', f.money && 'money', f.note].filter(Boolean).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Backend() {
  const eps = endpoints()
  const files = [
    ['openapi.yaml', 'OpenAPI 3 spec: import into Postman, Insomnia or Swagger UI', () => generateOpenApi(ENTITIES, CUSTOM_ENDPOINTS), 'text/yaml'],
    ['schema.sql', 'PostgreSQL schema with constraints and indexes', () => generateSql(ENTITIES), 'text/sql'],
    ['BACKEND.md', 'Handoff guide: auth, permissions, rules, migration steps', () => generateBackendMd({ entities: ENTITIES, custom: CUSTOM_ENDPOINTS, permissions: PERMISSIONS, rules: BUSINESS_RULES }), 'text/markdown'],
  ]

  return (
    <Section id="backend" title="Backend handoff" description="Everything needed to connect the React app to a real API. The data model below is the single source of truth; the OpenAPI spec, SQL schema and guide are generated from it.">
      <div id="backend-start" className="scroll-mt-20"><Sub title="Quick start">
        <ol className="list-decimal pl-5 text-sm text-surface-600 flex flex-col gap-1.5">
          <li>Create the database with the generated schema.</li>
          <li>Implement the routes from the OpenAPI spec (any stack; Node + PostgreSQL is the reference).</li>
          <li>Run the API, then point the app at it with <code className="font-mono text-xs">VITE_API_URL</code>.</li>
          <li>Swap the mock store actions for <code className="font-mono text-xs">api.*</code> calls (migration steps below).</li>
        </ol>
        <CodeBlock code={'psql -f docs/schema.sql\n\n# .env.local\nVITE_API_URL=http://localhost:4000/api\n\nnpm run docs:backend   # regenerate docs after editing src/design-system/backendSpec.js'} />
      </Sub></div>

      <div id="backend-auth" className="scroll-mt-20"><Sub title="Authentication and roles">
        <div className="rounded-lg border border-surface-300 bg-surface-0 p-5 text-sm text-surface-600 flex flex-col gap-2">
          <p><code className="font-mono text-xs">POST /auth/login</code> with <code className="font-mono text-xs">{'{ email, password, as }'}</code> where <code className="font-mono text-xs">as</code> is <code className="font-mono text-xs">admin</code> or <code className="font-mono text-xs">member</code> (the tab on the sign-in page). Return <code className="font-mono text-xs">{'{ token, user }'}</code> and send the token as a Bearer header.</p>
          <p>Error codes the sign-in page already handles: <code className="font-mono text-xs">401</code> wrong credentials, <code className="font-mono text-xs">403 WRONG_ROLE</code>, <code className="font-mono text-xs">403 ACCOUNT_DISABLED</code>, <code className="font-mono text-xs">429</code> too many attempts, and network failures.</p>
        </div>
      </Sub></div>

      <div id="backend-permissions" className="scroll-mt-20"><Sub title="Permissions">
        <div className="rounded-lg border border-surface-300 bg-surface-0 overflow-hidden">
          <table className="data-table w-full text-sm">
            <thead><tr><th className="text-left px-4 py-3 w-48">Resource</th><th className="text-left px-4 py-3">Admin</th><th className="text-left px-4 py-3">Team member</th></tr></thead>
            <tbody>{PERMISSIONS.map(p => <tr key={p.resource}><td className="px-4 py-3 font-medium text-surface-800">{p.resource}</td><td className="px-4 py-3 text-surface-600">{p.admin}</td><td className="px-4 py-3 text-surface-600">{p.member}</td></tr>)}</tbody>
          </table>
        </div>
      </Sub></div>

      <div id="backend-rules" className="scroll-mt-20"><Sub title="Business rules the server must own">
        <ul className="list-disc pl-5 text-sm text-surface-600 flex flex-col gap-1.5">{BUSINESS_RULES.map(r => <li key={r}>{r}</li>)}</ul>
      </Sub></div>

      <div id="backend-model" className="scroll-mt-20"><Sub title="Data model" hint={`${ENTITIES.length} entities. Click to expand.`}>
        <div className="flex flex-col gap-3">{ENTITIES.map(e => <Entity key={e.name} e={e} />)}</div>
      </Sub></div>

      <div id="backend-endpoints" className="scroll-mt-20"><Sub title="Endpoints" hint={`${eps.length} routes`}>
        <div className="rounded-lg border border-surface-300 bg-surface-0 overflow-hidden">
          <table className="data-table w-full text-sm">
            <thead><tr><th className="text-left px-4 py-3 w-24">Method</th><th className="text-left px-4 py-3">Path</th><th className="text-left px-4 py-3">Purpose</th><th className="text-left px-4 py-3 w-24">Access</th></tr></thead>
            <tbody>{eps.map(([m, p, s, r], i) => (
              <tr key={m + p + i}>
                <td className="px-4 py-2"><Badge tone={METHOD_TONE[m]} size="sm" dot={false}>{m}</Badge></td>
                <td className="px-4 py-2 font-mono text-xs text-surface-800">{p}</td>
                <td className="px-4 py-2 text-surface-600">{s}</td>
                <td className="px-4 py-2 text-xs text-surface-500">{r}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Sub></div>

      <div id="backend-client" className="scroll-mt-20"><Sub title="API client and migrating off the mock store" hint="src/api">
        <CodeBlock code={`import { api } from '@/api'

// auth
const user = await api.auth.login({ email, password, as: 'admin' })

// resources: list / get / create / update / remove
const tasks = await api.tasks.list({ projectId: 'P001' })
const task  = await api.tasks.create({ title, projectId, assigneeId, type: 'design', priority: 'medium', status: 'todo' })
await api.tasks.update(task.id, { status: 'in-progress' })

// nested + uploads
await api.tasks.comments.add(task.id, 'Looks good @Priya')
await api.tasks.attachments.upload(task.id, fileInput.files)`} />
        <CodeBlock code={`// src/store/useStore.js: hydrate once after login, then call the API in each action
hydrate: async () => {
  const [projects, tasks, staff] = await Promise.all([api.projects.list(), api.tasks.list(), api.staff.list()])
  set({ projects, tasks, staff })
},
addTask: async (task) => {
  const created = await api.tasks.create(task)      // server sets id, history, dates
  set(s => ({ tasks: [...s.tasks, created] }))
  return created.id
},`} />
        <p className="text-sm text-surface-600">Remove the client-side side effects the server now owns: history entries, <code className="font-mono text-xs">loggedHours</code>, <code className="font-mono text-xs">progress</code> and <code className="font-mono text-xs">completedDate</code>. Replace <code className="font-mono text-xs">URL.createObjectURL</code> with the URLs returned by <code className="font-mono text-xs">api.uploads.upload</code>.</p>
      </Sub></div>

      <div id="backend-downloads" className="scroll-mt-20"><Sub title="Download handoff files" hint="Generated from the model above">
        <div className="grid md:grid-cols-3 gap-4">
          {files.map(([name, desc, make, type]) => (
            <div key={name} className="rounded-lg border border-surface-300 bg-surface-0 p-5 shadow-sm flex flex-col gap-3">
              <div><code className="text-sm font-mono font-semibold text-surface-900">{name}</code><p className="text-sm text-surface-600 mt-1">{desc}</p></div>
              <Button variant="secondary" size="sm" className="w-fit" onClick={() => download(name, make(), type)}><Download size={16} /> Download</Button>
            </div>
          ))}
        </div>
      </Sub></div>
    </Section>
  )
}
