import { create } from 'zustand'

// One place to open the create dialogs, so the top bar, boards and job cards all use the same ones.
const useQuickAdd = create(set => ({
  job: null,      // { projectId?, milestoneId?, status? }
  project: null,  // { project? }  with a project it edits, without it creates
  hours: null,    // { taskId?, entry? }
  addJob: (preset = {}) => set({ job: preset }),
  openProject: project => set({ project: { project: project || null } }),
  logHours: (preset = {}) => set({ hours: preset }),
  closeJob: () => set({ job: null }),
  closeProject: () => set({ project: null }),
  closeHours: () => set({ hours: null }),
}))

export default useQuickAdd
