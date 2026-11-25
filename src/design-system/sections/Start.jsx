import { Section, Sub, CodeBlock } from './Primitives'

const STACK = [
  ['React 19 + Vite 8', 'JavaScript (no TypeScript), hash routing so dist/index.html opens from a file'],
  ['Tailwind CSS v4', 'Design tokens live in the @theme static block of src/index.css'],
  ['shadcn/ui + Radix', 'Form primitives in src/components/ui, wrapped by src/components/FormField.jsx'],
  ['Zustand', 'Client state (src/store). Replace with the API layer (src/api) when a backend exists'],
  ['React Router (HashRouter)', 'Role-guarded routes in src/App.jsx'],
  ['lucide-react', 'Line icons'],
]

export default function Start() {
  return (
    <>
      <Section id="overview" title="StructFlow Design System" description="Component library and developer handoff for the StructFlow staff, project and task portal. It documents the tokens, the React components, and everything a backend developer needs to wire the app to real data.">
        <div className="grid sm:grid-cols-3 gap-4">
          {[['Foundations', 'Colors, type, spacing, radius, shadows, icons, exportable tokens.'], ['Components', '15 live components with copyable code and props tables.'], ['Backend', 'Data model, OpenAPI spec, SQL schema and an API client.']].map(([t, d]) => (
            <div key={t} className="rounded-lg border border-surface-300 bg-surface-0 p-5 shadow-sm"><h3 className="font-semibold text-surface-900">{t}</h3><p className="text-sm text-surface-600 mt-1">{d}</p></div>
          ))}
        </div>
      </Section>

      <Section id="getting-started" title="Getting started" description="Run the app locally and find your way around the code.">
        <Sub title="Install and run">
          <CodeBlock code={'npm install\nnpm run dev          # app: http://localhost:5173  |  this page: http://localhost:5173/design-system.html\nnpm run build        # dist/index.html (app) + dist/design-system.html (this page), both open by double-click\nnpm run docs:backend # regenerates docs/openapi.yaml, schema.sql, BACKEND.md'} />
        </Sub>
        <Sub title="Demo accounts">
          <div className="rounded-lg border border-surface-300 bg-surface-0 overflow-hidden">
            <table className="data-table w-full text-sm"><thead><tr><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Password</th></tr></thead>
              <tbody>
                <tr><td className="px-4 py-3">Admin</td><td className="px-4 py-3 font-mono text-xs">admin@structflow.com</td><td className="px-4 py-3 font-mono text-xs">admin123</td></tr>
                <tr><td className="px-4 py-3">Team member</td><td className="px-4 py-3 font-mono text-xs">sneha.k@structflow.com (any staff email)</td><td className="px-4 py-3 font-mono text-xs">team123</td></tr>
              </tbody>
            </table>
          </div>
        </Sub>
        <Sub title="Stack">
          <div className="rounded-lg border border-surface-300 bg-surface-0 divide-y divide-surface-200">
            {STACK.map(([n, d]) => <div key={n} className="grid sm:grid-cols-[220px_1fr] gap-2 px-5 py-3"><span className="text-sm font-semibold text-surface-800">{n}</span><span className="text-sm text-surface-600">{d}</span></div>)}
          </div>
        </Sub>
        <Sub title="Folder structure">
          <CodeBlock code={`src/
  api/            fetch client + one resource per REST collection (VITE_API_URL)
  components/     shared UI (Button/Input in FormField.jsx, Badge, Tabs, Modal, charts ...)
    ui/           shadcn/ui primitives
  design-system/  THIS page: its own entry (design-system.html -> main.jsx), tokens, backend spec, generators
  lib/            smart-fill parsers, access helper, attachment utils
  pages/          one file per app screen
  store/          Zustand stores: useStore (data), useAuth, useToast, useSearch
  data/           mock seed data
docs/             generated openapi.yaml, schema.sql, BACKEND.md
scripts/          gen-backend-docs.mjs`} />
        </Sub>
        <Sub title="Conventions">
          <ul className="list-disc pl-5 text-sm text-surface-600 flex flex-col gap-1.5">
            <li>Use tokens, not raw hex: <code className="font-mono text-xs">bg-brand-600</code>, <code className="font-mono text-xs">border-surface-300</code>.</li>
            <li>Import shared components from <code className="font-mono text-xs">@/components</code>. The <code className="font-mono text-xs">@</code> alias points to <code className="font-mono text-xs">src</code>.</li>
            <li>Add a new shadcn primitive with <code className="font-mono text-xs">npx shadcn@latest add &lt;name&gt;</code>, then theme it to Core UI.</li>
            <li>Role checks go through <code className="font-mono text-xs">useAccess()</code>. Never read the role string directly in pages.</li>
          </ul>
        </Sub>
      </Section>
    </>
  )
}
