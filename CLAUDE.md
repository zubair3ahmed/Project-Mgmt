# Project-Mgmt (StructFlow)

Staff, project and task management portal for a structural design consulting firm.
React 19, Vite, Tailwind v4, shadcn/ui, Zustand, React Router (hash routes).

## Rules for Claude (read first)

1. **Ask before committing.** Never run `git commit`, `git push`, `git merge`, `git rebase`,
   `git reset --hard`, or delete a branch without the user saying yes in this conversation.
   A yes covers that one action only. Show what changed (`git status`, a short summary) when asking.
2. **Work on the `develop` branch.** Do not edit or push `main` directly. Merging into `main` also needs a yes.
3. Edit files freely, but keep changes small and tell the user what changed and why.
4. Never commit secrets (`.env`, tokens, keys). `.env.example` is the only env file in git.
5. Before saying something works, build it (`npm run build`) and check the screen in a browser.

## Commands

```bash
npm install          # first time
npm run dev          # local dev server
npm run build        # app + design system into dist/ (single-file HTML, opens by double-click)
npm run docs:backend # regenerate docs/openapi.yaml, schema.sql, BACKEND.md from src/design-system/backendSpec.js
```

## How the product works (from the client's brief and questionnaire)

- Two roles: **Admin** and **Team member**. Members never see contract value, pay rates or reports.
- **Money lives on milestones only.** A milestone is a weightage % of the project's contract value.
  Tasks carry no amount; they link to a milestone. When the last linked task is done the milestone
  completes and its payment request is raised: automatically, or held as "Ready to invoice" for admin
  approval (per-milestone setting). Only an admin creates and approves milestones (six-stage template or custom).
- Order of setup: project, then milestones (weightages total 100%), then tasks.
- Task and project creation use one typed line ("Column schedule Prestige Towers @Amit !high due fri 8h").
  The parser is rule-based (`src/lib/smartTask.js`, `smartProject.js`), not an LLM.

- **The interface says "job", the code says `task`.** The industry word is job; keep identifiers, API names and storage keys as `task`.
- **Information order:** Project → Milestones → Jobs. A project's page is a board with one column per milestone.
- **Progress is milestone achievement** (weightage of completed milestones), drawn with `components/MilestoneProgress.jsx`.
- **Access is per project and set by the admin:** `write` (add jobs, upload files) or `read` (view only). People see only
  projects they are on. Anyone can update status and log hours on jobs assigned to them. Rules live in `lib/access.js`.
- Project categories: To Do (`planning`), In Progress, Completed. The six delivery stages are the milestone template.
- Top bar: centred search with one global action (admin: Add project, staff: Add job). Other actions sit in the page bar.

## Where things are

- `src/pages/` screens, `src/components/` shared UI, `src/store/` Zustand stores, `src/lib/` helpers.
- `src/store/useStore.js` workspace data, saved to localStorage and synced between tabs (`components/LiveSync.jsx`).
  `useAuth` keeps one session per tab (sessionStorage).
- `src/design-system/` component library page and the backend spec that generates `docs/`.
- `case-study/` the portfolio case study, prototype copy and LinkedIn video.
- Demo logins: admin `admin@structflow.com` / `admin123`; team members use `team123`
  (for example `sneha.k@structflow.com`). The account menu can start an empty workspace or reload demo data.

## Style

- Design tokens in `src/index.css` (Core UI: 4/8 spacing, 1px card borders, brand blue).
- Every critical action asks for confirmation and ends in a toast with Undo.
- Keep empty states, mobile layout and keyboard access working when changing a screen.
