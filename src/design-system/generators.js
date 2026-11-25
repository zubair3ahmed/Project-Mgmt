// Pure functions (no imports) so Node scripts and the browser can both use them.

const enumValues = t => t.slice(5).split('|')
const isEnum = t => t.startsWith('enum:')
const kebab = s => s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
const RESERVED = { order: 'sort_order' }
const colName = name => RESERVED[name] || kebab(name)

export function sqlColumnType(field) {
  const t = field.type
  if (t === 'id') return 'text'
  if (t === 'string') return 'text'
  if (t === 'number') return field.money ? 'numeric(14,2)' : 'numeric(8,2)'
  if (t === 'integer') return 'integer'
  if (t === 'boolean') return 'boolean'
  if (t === 'date') return 'date'
  if (t === 'datetime') return 'timestamptz'
  if (t === 'string[]') return 'text[]'
  if (isEnum(t)) return 'text'
  return 'text'
}

export function generateSql(entities) {
  const byName = Object.fromEntries(entities.map(e => [e.name, e]))
  const out = ['-- StructFlow reference schema (PostgreSQL). Generated from src/design-system/backendSpec.js', '-- Run: npm run docs:backend', '']
  const joins = []
  for (const e of entities) {
    const cols = []
    const checks = []
    for (const f of e.fields) {
      if (f.type === 'id[]') {
        joins.push({ entity: e, field: f })
        continue
      }
      const col = colName(f.name)
      const parts = [`  ${col} ${sqlColumnType(f)}`]
      if (f.name === 'id') parts.push('primary key')
      else if (f.required) parts.push('not null')
      if (f.unique) parts.push('unique')
      if (f.ref) parts.push(`references ${byName[f.ref].table}(id)${f.required ? ' on delete restrict' : ' on delete set null'}`)
      cols.push(parts.join(' '))
      if (isEnum(f.type)) checks.push(`  check (${col} in (${enumValues(f.type).map(v => `'${v}'`).join(', ')}))`)
    }
    cols.push('  created_at timestamptz not null default now()', '  updated_at timestamptz not null default now()')
    out.push(`-- ${e.description}`, `create table ${e.table} (`, [...cols, ...checks].join(',\n'), ');', '')
  }
  for (const { entity, field } of joins) {
    const ref = byName[field.ref]
    const a = `${kebab(entity.name)}_id`
    const b = `${kebab(field.ref)}_id`
    out.push(
      `create table ${field.join} (`,
      `  ${a} text not null references ${entity.table}(id) on delete cascade,`,
      `  ${b} text not null references ${ref.table}(id) on delete cascade,`,
      `  primary key (${a}, ${b})`,
      ');',
      '',
    )
  }
  out.push(
    'create index on tasks (project_id);',
    'create index on tasks (assignee_id);',
    'create index on tasks (status);',
    'create index on time_logs (task_id);',
    'create index on time_logs (staff_id, date);',
    'create index on task_comments (task_id, timestamp desc);',
    'create index on project_files (project_id);',
    'create index on milestones (project_id);',
    '',
  )
  return out.join('\n')
}

function oaType(field) {
  const t = field.type
  const base = (() => {
    if (t === 'id' || t === 'string') return { type: 'string' }
    if (t === 'number') return { type: 'number' }
    if (t === 'integer') return { type: 'integer' }
    if (t === 'boolean') return { type: 'boolean' }
    if (t === 'date') return { type: 'string', format: 'date' }
    if (t === 'datetime') return { type: 'string', format: 'date-time' }
    if (t === 'string[]') return { type: 'array', items: { type: 'string' } }
    if (t === 'id[]') return { type: 'array', items: { type: 'string' } }
    if (isEnum(t)) return { type: 'string', enum: enumValues(t) }
    return { type: 'string' }
  })()
  return base
}

const yq = v => (/^[\w./{}-]+$/.test(v) ? v : JSON.stringify(v))

export function generateOpenApi(entities, custom) {
  const L = []
  const push = (indent, s) => {
    if (s.startsWith('summary: ') && !/^summary: ["']/.test(s)) s = 'summary: ' + JSON.stringify(s.slice(9))
    L.push(' '.repeat(indent) + s)
  }
  push(0, 'openapi: 3.0.3')
  push(0, 'info:')
  push(2, 'title: StructFlow API')
  push(2, 'version: 1.0.0')
  push(2, 'description: Generated from src/design-system/backendSpec.js. Bearer JWT auth. Role scoping (admin, member) is enforced server-side.')
  push(0, 'servers:')
  push(2, '- url: http://localhost:4000/api')
  push(0, 'security:')
  push(2, '- bearerAuth: []')
  push(0, 'paths:')

  const schemaRef = e => `'#/components/schemas/${e.name}'`
  for (const e of entities) {
    if (e.access === 'nested') continue
    const base = `/${e.path}`
    const roles = { CRUD: 'create, read, update, delete', R: 'read', admin: 'admin only (create, read, update, delete)' }[e.access]
    push(2, `${base}:`)
    push(4, 'get:')
    push(6, `summary: List ${e.name} records (${roles})`)
    push(6, `tags: [${e.name}]`)
    push(6, 'parameters:')
    push(8, '- { name: q, in: query, schema: { type: string } }')
    push(8, '- { name: page, in: query, schema: { type: integer, default: 1 } }')
    push(8, '- { name: pageSize, in: query, schema: { type: integer, default: 50 } }')
    push(6, 'responses:')
    push(8, "'200':")
    push(10, 'description: OK')
    push(10, 'content:')
    push(12, 'application/json:')
    push(14, `schema: { type: array, items: { $ref: ${schemaRef(e)} } }`)
    if (e.access === 'CRUD' || e.access === 'admin') {
      push(4, 'post:')
      push(6, `summary: Create a ${e.name}`)
      push(6, `tags: [${e.name}]`)
      push(6, 'requestBody:')
      push(8, 'required: true')
      push(8, 'content:')
      push(10, 'application/json:')
      push(12, `schema: { $ref: ${schemaRef(e)} }`)
      push(6, 'responses:')
      push(8, "'201': { description: Created, content: { application/json: { schema: { $ref: " + schemaRef(e) + ' } } } }')
      push(8, "'403': { description: Forbidden for this role }")
      push(8, "'422': { description: Validation error }")
    }
    push(2, `${base}/{id}:`)
    push(4, 'parameters:')
    push(6, '- { name: id, in: path, required: true, schema: { type: string } }')
    push(4, 'get:')
    push(6, `summary: Get one ${e.name}`)
    push(6, `tags: [${e.name}]`)
    push(6, 'responses:')
    push(8, "'200': { description: OK, content: { application/json: { schema: { $ref: " + schemaRef(e) + ' } } } }')
    push(8, "'404': { description: Not found or not visible to this role }")
    if (e.access === 'CRUD' || e.access === 'admin') {
      push(4, 'patch:')
      push(6, `summary: Update a ${e.name} (partial)`)
      push(6, `tags: [${e.name}]`)
      push(6, 'requestBody:')
      push(8, 'required: true')
      push(8, 'content:')
      push(10, 'application/json:')
      push(12, `schema: { $ref: ${schemaRef(e)} }`)
      push(6, 'responses:')
      push(8, "'200': { description: Updated }")
      push(8, "'403': { description: Forbidden for this role }")
      push(4, 'delete:')
      push(6, `summary: Delete a ${e.name}`)
      push(6, `tags: [${e.name}]`)
      push(6, 'responses:')
      push(8, "'204': { description: Deleted }")
      push(8, "'403': { description: Forbidden for this role }")
    }
  }

  const comments = entities.find(e => e.name === 'TaskComment')
  const atts = entities.find(e => e.name === 'TaskAttachment')
  push(2, '/tasks/{taskId}/comments:')
  push(4, 'parameters:')
  push(6, '- { name: taskId, in: path, required: true, schema: { type: string } }')
  push(4, 'get:')
  push(6, 'summary: List comments and history for a task')
  push(6, 'tags: [TaskComment]')
  push(6, "responses: { '200': { description: OK, content: { application/json: { schema: { type: array, items: { $ref: " + schemaRef(comments) + ' } } } } } }')
  push(4, 'post:')
  push(6, 'summary: Add a comment')
  push(6, 'tags: [TaskComment]')
  push(6, 'requestBody: { required: true, content: { application/json: { schema: { type: object, required: [text], properties: { text: { type: string } } } } } }')
  push(6, "responses: { '201': { description: Created } }")
  push(2, '/comments/{id}:')
  push(4, 'parameters:')
  push(6, '- { name: id, in: path, required: true, schema: { type: string } }')
  push(4, 'patch:')
  push(6, 'summary: Edit own comment')
  push(6, 'tags: [TaskComment]')
  push(6, "responses: { '200': { description: Updated } }")
  push(4, 'delete:')
  push(6, 'summary: Delete own comment (admin: any)')
  push(6, 'tags: [TaskComment]')
  push(6, "responses: { '204': { description: Deleted } }")
  push(2, '/tasks/{taskId}/attachments:')
  push(4, 'parameters:')
  push(6, '- { name: taskId, in: path, required: true, schema: { type: string } }')
  push(4, 'get:')
  push(6, 'summary: List attachments')
  push(6, 'tags: [TaskAttachment]')
  push(6, "responses: { '200': { description: OK, content: { application/json: { schema: { type: array, items: { $ref: " + schemaRef(atts) + ' } } } } } }')
  push(4, 'post:')
  push(6, 'summary: Upload one or more files (multipart/form-data, field name "files")')
  push(6, 'tags: [TaskAttachment]')
  push(6, 'requestBody: { required: true, content: { multipart/form-data: { schema: { type: object, properties: { files: { type: array, items: { type: string, format: binary } } } } } } }')
  push(6, "responses: { '201': { description: Created }, '413': { description: File too large } }")
  push(2, '/attachments/{id}:')
  push(4, 'parameters:')
  push(6, '- { name: id, in: path, required: true, schema: { type: string } }')
  push(4, 'delete:')
  push(6, 'summary: Remove an attachment (own, or any for admin)')
  push(6, 'tags: [TaskAttachment]')
  push(6, "responses: { '204': { description: Deleted } }")

  for (const c of custom) {
    const p = c.path.split('?')[0]
    if (L.some(l => l === `  ${p}:`)) continue
    push(2, `${p}:`)
    push(4, `${c.method.toLowerCase()}:`)
    push(6, `summary: ${JSON.stringify(c.summary)}`)
    push(6, 'tags: [Custom]')
    push(6, "responses: { '200': { description: OK } }")
  }

  push(0, 'components:')
  push(2, 'securitySchemes:')
  push(4, 'bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }')
  push(2, 'schemas:')
  for (const e of entities) {
    push(4, `${e.name}:`)
    push(6, 'type: object')
    const req = e.fields.filter(x => x.required && !x.readOnly).map(x => x.name)
    if (req.length) push(6, `required: [${req.join(', ')}]`)
    push(6, 'properties:')
    for (const field of e.fields) {
      const t = oaType(field)
      push(8, `${field.name}:`)
      push(10, `type: ${t.type}`)
      if (t.format) push(10, `format: ${t.format}`)
      if (t.enum) push(10, `enum: [${t.enum.map(yq).join(', ')}]`)
      if (t.items) push(10, 'items: { type: string }')
      if (field.readOnly) push(10, 'readOnly: true')
      if (field.writeOnly) push(10, 'writeOnly: true')
      if (field.note) push(10, `description: ${JSON.stringify(field.note)}`)
    }
  }
  return L.join('\n') + '\n'
}

export function generateBackendMd({ entities, custom, permissions, rules }) {
  const md = []
  md.push('# Backend handoff', '', 'Generated from `src/design-system/backendSpec.js`. Regenerate with `npm run docs:backend`.', '')
  md.push('## 1. Quick start', '')
  md.push('1. Pick a stack (Node + Express/Fastify + PostgreSQL is the reference assumption).')
  md.push('2. Create the database: `psql -f docs/schema.sql`.')
  md.push('3. Implement the routes in `docs/openapi.yaml` (import it into Postman, Insomnia or Swagger UI to explore it).')
  md.push('4. Run the API, then copy `.env.example` to `.env.local` and set `VITE_API_URL=http://localhost:4000/api`.')
  md.push('5. Replace the mock store calls with `src/api` calls (see section 5).', '')
  md.push('## 2. Authentication and roles', '')
  md.push('- `POST /auth/login` with `{ email, password, as }` where `as` is `admin` or `member` (the tab used on the sign-in page).')
  md.push('- Return `{ token, user: { id, email, role, staffId, name, title } }`. Send the token as `Authorization: Bearer <token>`.')
  md.push('- Reject with 401 for wrong credentials, 403 with code `WRONG_ROLE` when the account role differs from `as`, 403 with code `ACCOUNT_DISABLED` for inactive staff, and 429 after repeated failures.', '')
  md.push('## 3. Permissions', '', '| Resource | Admin | Member |', '|---|---|---|')
  for (const p of permissions) md.push(`| ${p.resource} | ${p.admin} | ${p.member} |`)
  md.push('', '## 4. Business rules', '')
  rules.forEach(r => md.push(`- ${r}`))
  md.push('', '## 5. Swapping the mock store for the API', '')
  md.push('The React app keeps all data in Zustand (`src/store/useStore.js`) seeded from `src/data/mockData.js`. Pages only read from the store, so the migration is mechanical:', '')
  md.push('1. Add `hydrate()` to the store: call `api.projects.list()`, `api.tasks.list()` and so on, then `set({ projects, tasks, ... })`. Call it once after login.')
  md.push('2. Convert each action to call the API first, then update state with the server response:', '')
  md.push('```js', 'addTask: async (task) => {', '  const created = await api.tasks.create(task)', '  set(s => ({ tasks: [...s.tasks, created] }))', '  return created.id', '},', '```', '')
  md.push('3. Remove client-side side effects that the server now owns (history entries, loggedHours, progress, completedDate).')
  md.push('4. Replace `useAuth.login` with `api.auth.login` and store the returned token (`tokenStore` in `src/api/client.js`).')
  md.push('5. Switch file inputs to `api.uploads.upload(files)` and save the returned URLs instead of `URL.createObjectURL`.', '')
  md.push('## 6. Data model', '')
  for (const e of entities) {
    md.push(`### ${e.name}  \`${e.access === 'nested' ? '/' + e.path : '/' + e.path}\``, '', e.description, '', '| Field | Type | Required | Notes |', '|---|---|---|---|')
    for (const f of e.fields) {
      const t = f.type.startsWith('enum:') ? f.type.slice(5).split('|').join(' \\| ') : f.type
      md.push(`| ${f.name} | ${t}${f.ref ? ' -> ' + f.ref : ''} | ${f.required ? 'yes' : ''} | ${[f.readOnly && 'read-only', f.writeOnly && 'write-only', f.money && 'money', f.note].filter(Boolean).join('. ')} |`)
    }
    md.push('')
  }
  md.push('## 7. Additional endpoints', '', '| Method | Path | Roles | Purpose |', '|---|---|---|---|')
  for (const c of custom) md.push(`| ${c.method} | \`${c.path}\` | ${c.roles} | ${c.summary} |`)
  md.push('')
  return md.join('\n')
}
