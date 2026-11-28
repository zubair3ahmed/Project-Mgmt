# Backend handoff

Generated from `src/design-system/backendSpec.js`. Regenerate with `npm run docs:backend`.

## 1. Quick start

1. Pick a stack (Node + Express/Fastify + PostgreSQL is the reference assumption).
2. Create the database: `psql -f docs/schema.sql`.
3. Implement the routes in `docs/openapi.yaml` (import it into Postman, Insomnia or Swagger UI to explore it).
4. Run the API, then copy `.env.example` to `.env.local` and set `VITE_API_URL=http://localhost:4000/api`.
5. Replace the mock store calls with `src/api` calls (see section 5).

## 2. Authentication and roles

- `POST /auth/login` with `{ email, password, as }` where `as` is `admin` or `member` (the tab used on the sign-in page).
- Return `{ token, user: { id, email, role, staffId, name, title } }`. Send the token as `Authorization: Bearer <token>`.
- Reject with 401 for wrong credentials, 403 with code `WRONG_ROLE` when the account role differs from `as`, 403 with code `ACCOUNT_DISABLED` for inactive staff, and 429 after repeated failures.

## 3. Permissions

| Resource | Admin | Member |
|---|---|---|
| Projects | Create, read, update, delete | Read only the projects they belong to. contractValue hidden. |
| Tasks | Full access | Read tasks in own projects. Create tasks assigned to self. Update own tasks. No delete. |
| Task comments | Create, edit own, delete any | Create. Edit and delete own. |
| Task attachments | Add, remove any | Add. Remove own. |
| Time logs | Full access, all staff | Own entries only (full CRUD). |
| Files | Full access | Read and upload in own projects. Delete own uploads. |
| Staff | Full access incl. rates and salary | No access. Names and avatars come embedded in task and project responses. |
| Clients | Full access | Client name only, embedded in project responses. |
| Milestones & payments | Full access | No access. |
| Reports | Full access | No access. |
| Users | Full access | No access. |

## 4. Business rules

- Task.completedDate is set when status becomes "done" and cleared when it moves back.
- Every change to a task's status, assignee, priority or due date inserts a TaskComment with type="system" (the History tab).
- TimeLog create, update and delete must recompute Task.loggedHours.
- Milestone payment amount = Project.contractValue x weightage / 100. Total weightage per project should equal 100.
- Money lives on the milestone only. Tasks never carry an amount; they link to a milestone through Task.milestoneId.
- When the last task linked to a milestone becomes done, set the milestone to completed. paymentMode=auto then sets paymentStatus=invoiced; manual sets it to ready for an admin to approve. Moving a task back out of done reopens the milestone unless it is already invoiced or paid.
- Only an admin creates, edits or approves milestones, from the six-stage template or as custom ones. Anyone may link their own task to an open milestone.
- Project access is per person: write may add jobs and upload files in that project, read may only view it. Either may change status and log hours on jobs assigned to them. Only an admin changes access. When an admin assigns a job to someone outside the project, add them with read access.
- Project progress = sum of weightage of completed milestones / total weightage.
- A project can be set to completed only when it has milestones, all of them are completed and every job is done. A completed project is read-only (milestones, jobs, hours, files, access) until an admin reopens it. Milestone.paymentStatus may still be updated.
- Enforce role scoping on the server. The React app hides UI by role but the API must refuse the request too.
- Members must never receive hourlyRate, monthlySalary or contractValue. They can link their own tasks to a milestone but cannot see or change contract money.
- Uploads are limited to 10 MB per file and 10 files per task. Validate size and type on the server.

## 5. Swapping the mock store for the API

The React app keeps all data in Zustand (`src/store/useStore.js`) seeded from `src/data/mockData.js`. Pages only read from the store, so the migration is mechanical:

1. Add `hydrate()` to the store: call `api.projects.list()`, `api.tasks.list()` and so on, then `set({ projects, tasks, ... })`. Call it once after login.
2. Convert each action to call the API first, then update state with the server response:

```js
addTask: async (task) => {
  const created = await api.tasks.create(task)
  set(s => ({ tasks: [...s.tasks, created] }))
  return created.id
},
```

3. Remove client-side side effects that the server now owns (history entries, loggedHours, progress, completedDate).
4. Replace `useAuth.login` with `api.auth.login` and store the returned token (`tokenStore` in `src/api/client.js`).
5. Switch file inputs to `api.uploads.upload(files)` and save the returned URLs instead of `URL.createObjectURL`.

## 6. Data model

### Staff  `/staff`

People who work at the firm. Admin-managed. Also the assignee/reporter/manager pool.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| name | string | yes |  |
| role | string | yes | Job title, e.g. Senior Structural Engineer |
| department | Engineering \| Management \| Drafting \| Administration | yes |  |
| email | string | yes |  |
| phone | string |  |  |
| avatar | string |  | Initials fallback. Photos are served from avatarUrl when present. |
| hourlyRate | number |  | money. Internal cost rate. Never returned to members. |
| monthlySalary | number |  | money. Admin only. |
| joinDate | date |  |  |
| status | active \| inactive | yes |  |
| skills | string[] |  |  |

### Client  `/clients`

Companies that commission projects.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| name | string | yes |  |
| contact | string | yes |  |
| email | string |  |  |
| phone | string |  |  |

### ProjectStage  `/project-stages`

Ordered delivery stages every project moves through (Work Order, Framing Layout, Stage 1 ...).

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| name | string | yes |  |
| order | integer | yes | Stored in the SQL column sort_order because ORDER is reserved. |
| optional | boolean |  |  |

### Project  `/projects`

A client engagement. Progress is derived from currentStage.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| name | string | yes |  |
| clientId | id -> Client | yes |  |
| type | Residential \| Commercial \| Industrial \| Institutional \| Infrastructure | yes |  |
| location | string | yes |  |
| priority | low \| medium \| high \| urgent | yes |  |
| status | planning \| in-progress \| on-hold \| completed | yes |  |
| startDate | date |  |  |
| endDate | date |  |  |
| contractValue | number | yes | money. Admin only. Omit from member responses. |
| description | string |  |  |
| managerId | id -> Staff | yes |  |
| teamIds | id[] -> Staff |  | Members of the project team (manager excluded). |
| access | string |  | JSON map of staffId to "write" or "read" for people in teamIds. The manager and admins always have write. Only these people can see the project. |
| currentStage | id -> ProjectStage |  |  |
| progress | integer |  | read-only. 0-100, computed from currentStage order. |

### Task  `/tasks`

Unit of work assigned to one person. Changes to status, assignee, priority and due date must write a TaskComment of type "system".

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| title | string | yes |  |
| description | string |  |  |
| projectId | id -> Project | yes |  |
| assigneeId | id -> Staff | yes |  |
| reporterId | id -> Staff |  |  |
| status | backlog \| todo \| in-progress \| review \| done | yes |  |
| priority | low \| medium \| high \| urgent | yes |  |
| type | design \| drafting \| review \| analysis \| estimation \| report \| site-visit \| coordination | yes |  |
| createdDate | date |  | read-only |
| dueDate | date |  |  |
| completedDate | date |  | read-only. Set by the server when status becomes done. |
| estimatedHours | number |  |  |
| loggedHours | number |  | read-only. Sum of TimeLog.hours for this task. |
| tags | string[] |  |  |
| milestoneId | id -> Milestone |  | The milestone this task counts toward. Tasks carry no money: the milestone owns the payment. |

### TaskComment  `/tasks/{taskId}/comments`

Comments and the automatic history feed. type=system entries are written by the server.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| taskId | id -> Task | yes |  |
| type | comment \| system | yes |  |
| authorId | id -> Staff |  |  |
| authorName | string | yes | Snapshot so history survives staff edits. |
| text | string | yes | @FirstName mentions are plain text. Parse server-side to notify. |
| edited | boolean |  | read-only |
| timestamp | datetime |  | read-only |

### TaskAttachment  `/tasks/{taskId}/attachments`

Files attached to a task. Upload with multipart/form-data, store in object storage, return the URL.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| taskId | id -> Task | yes |  |
| name | string | yes |  |
| size | integer | yes | Bytes. Limit 10 MB per file, 10 files per task. |
| mimeType | string |  |  |
| url | string | yes | read-only |
| addedById | id -> Staff |  |  |
| addedAt | datetime |  | read-only |

### TimeLog  `/time-logs`

Hours a person worked on a task. Creating, editing or deleting one must recompute Task.loggedHours.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| staffId | id -> Staff | yes |  |
| projectId | id -> Project | yes |  |
| taskId | id -> Task | yes |  |
| date | date | yes |  |
| hours | number | yes | 0.5 to 12 per entry. |
| description | string |  |  |

### Milestone  `/milestones`

Contract milestone. weightage % of contractValue triggers a client payment on completion. Admin only.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| projectId | id -> Project | yes |  |
| name | string | yes |  |
| weightage | integer | yes | Percent of contract value. Sum per project should be 100. |
| status | pending \| in-progress \| completed | yes |  |
| dueDate | date | yes |  |
| completedDate | date |  | read-only |
| paymentAmount | number | yes | money |
| paymentStatus | pending \| ready \| invoiced \| paid | yes | pending until its tasks are done, ready (waiting for admin approval), invoiced (request sent), paid. |
| paymentMode | auto \| manual | yes | auto sends the payment request when the last linked task is done; manual sets paymentStatus=ready for an admin to approve. |

### ProjectFile  `/files`

Documents filed under a project (drawings, contracts, photos). Created on project creation and from the Files page.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| projectId | id -> Project | yes |  |
| name | string | yes |  |
| folder | Drawings \| Reports \| Estimates \| Contracts \| Site Photos \| Correspondence \| Specifications | yes |  |
| type | string |  | File extension without dot. |
| size | integer |  | Bytes. |
| uploadedBy | id -> Staff |  |  |
| date | date |  | read-only |
| url | string | yes | read-only |

### Activity  `/activities`

Audit feed of notable events (task created, file uploaded, staff added). Written by the server.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| type | string | yes |  |
| userId | id -> Staff |  |  |
| projectId | id -> Project |  |  |
| taskId | id -> Task |  |  |
| message | string | yes |  |
| timestamp | datetime |  | read-only |

### User  `/users`

Login accounts. role decides what the UI and API expose. staffId links an account to a Staff record.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | id |  | read-only |
| email | string | yes |  |
| passwordHash | string | yes | write-only. bcrypt or argon2. Never returned. |
| role | admin \| member | yes |  |
| staffId | id -> Staff |  |  |

## 7. Additional endpoints

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Sign in with email, password and the role tab used. Returns { token, user }. |
| GET | `/auth/me` | any | Current user from the bearer token. |
| POST | `/auth/logout` | any | Invalidate the session (optional for stateless JWT). |
| POST | `/uploads` | any | multipart/form-data upload to object storage. Returns { url, name, size, mimeType }. |
| GET | `/search?q=` | any | Global search used by the command palette. Returns projects, tasks, staff, files already filtered by the caller's access. |
| PATCH | `/projects/{id}/stage` | admin | Move a project to a stage and recompute progress. |
| GET | `/reports/projects` | admin | Revenue, staff cost and margin per project. |
| GET | `/reports/staff` | admin | On-time rate, utilisation and performance score per person. |
