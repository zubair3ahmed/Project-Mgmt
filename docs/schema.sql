-- StructFlow reference schema (PostgreSQL). Generated from src/design-system/backendSpec.js
-- Run: npm run docs:backend

-- People who work at the firm. Admin-managed. Also the assignee/reporter/manager pool.
create table staff (
  id text primary key,
  name text not null,
  role text not null,
  department text not null,
  email text not null unique,
  phone text,
  avatar text,
  hourly_rate numeric(14,2),
  monthly_salary numeric(14,2),
  join_date date,
  status text not null,
  skills text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (department in ('Engineering', 'Management', 'Drafting', 'Administration')),
  check (status in ('active', 'inactive'))
);

-- Companies that commission projects.
create table clients (
  id text primary key,
  name text not null,
  contact text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ordered delivery stages every project moves through (Work Order, Framing Layout, Stage 1 ...).
create table project_stages (
  id text primary key,
  name text not null,
  sort_order integer not null,
  optional boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A client engagement. Progress is derived from currentStage.
create table projects (
  id text primary key,
  name text not null,
  client_id text not null references clients(id) on delete restrict,
  type text not null,
  location text not null,
  priority text not null,
  status text not null,
  start_date date,
  end_date date,
  contract_value numeric(14,2) not null,
  description text,
  manager_id text not null references staff(id) on delete restrict,
  current_stage text references project_stages(id) on delete set null,
  progress integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type in ('Residential', 'Commercial', 'Industrial', 'Institutional', 'Infrastructure')),
  check (priority in ('low', 'medium', 'high', 'urgent')),
  check (status in ('planning', 'in-progress', 'on-hold', 'completed'))
);

-- Unit of work assigned to one person. Changes to status, assignee, priority and due date must write a TaskComment of type "system".
create table tasks (
  id text primary key,
  title text not null,
  description text,
  project_id text not null references projects(id) on delete restrict,
  assignee_id text not null references staff(id) on delete restrict,
  reporter_id text references staff(id) on delete set null,
  status text not null,
  priority text not null,
  type text not null,
  created_date date,
  due_date date,
  completed_date date,
  estimated_hours numeric(8,2),
  logged_hours numeric(8,2),
  tags text[],
  milestone_id text references milestones(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('backlog', 'todo', 'in-progress', 'review', 'done')),
  check (priority in ('low', 'medium', 'high', 'urgent')),
  check (type in ('design', 'drafting', 'review', 'analysis', 'estimation', 'report', 'site-visit', 'coordination'))
);

-- Comments and the automatic history feed. type=system entries are written by the server.
create table task_comments (
  id text primary key,
  task_id text not null references tasks(id) on delete restrict,
  type text not null,
  author_id text references staff(id) on delete set null,
  author_name text not null,
  text text not null,
  edited boolean,
  timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type in ('comment', 'system'))
);

-- Files attached to a task. Upload with multipart/form-data, store in object storage, return the URL.
create table task_attachments (
  id text primary key,
  task_id text not null references tasks(id) on delete restrict,
  name text not null,
  size integer not null,
  mime_type text,
  url text not null,
  added_by_id text references staff(id) on delete set null,
  added_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hours a person worked on a task. Creating, editing or deleting one must recompute Task.loggedHours.
create table time_logs (
  id text primary key,
  staff_id text not null references staff(id) on delete restrict,
  project_id text not null references projects(id) on delete restrict,
  task_id text not null references tasks(id) on delete restrict,
  date date not null,
  hours numeric(8,2) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contract milestone. weightage % of contractValue triggers a client payment on completion. Admin only.
create table milestones (
  id text primary key,
  project_id text not null references projects(id) on delete restrict,
  name text not null,
  weightage integer not null,
  status text not null,
  due_date date not null,
  completed_date date,
  payment_amount numeric(14,2) not null,
  payment_status text not null,
  payment_mode text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pending', 'in-progress', 'completed')),
  check (payment_status in ('pending', 'ready', 'invoiced', 'paid')),
  check (payment_mode in ('auto', 'manual'))
);

-- Documents filed under a project (drawings, contracts, photos). Created on project creation and from the Files page.
create table project_files (
  id text primary key,
  project_id text not null references projects(id) on delete restrict,
  name text not null,
  folder text not null,
  type text,
  size integer,
  uploaded_by text references staff(id) on delete set null,
  date date,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (folder in ('Drawings', 'Reports', 'Estimates', 'Contracts', 'Site Photos', 'Correspondence', 'Specifications'))
);

-- Audit feed of notable events (task created, file uploaded, staff added). Written by the server.
create table activities (
  id text primary key,
  type text not null,
  user_id text references staff(id) on delete set null,
  project_id text references projects(id) on delete set null,
  task_id text references tasks(id) on delete set null,
  message text not null,
  timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Login accounts. role decides what the UI and API expose. staffId links an account to a Staff record.
create table users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  role text not null,
  staff_id text references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role in ('admin', 'member'))
);

create table project_members (
  project_id text not null references projects(id) on delete cascade,
  staff_id text not null references staff(id) on delete cascade,
  primary key (project_id, staff_id)
);

create index on tasks (project_id);
create index on tasks (assignee_id);
create index on tasks (status);
create index on time_logs (task_id);
create index on time_logs (staff_id, date);
create index on task_comments (task_id, timestamp desc);
create index on project_files (project_id);
create index on milestones (project_id);
