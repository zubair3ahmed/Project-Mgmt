import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// First-run walkthrough state. `seen` remembers which accounts have finished or skipped it, so it
// only opens by itself the first time someone signs in. The header menu can always replay it.
const useTour = create(
  persist(
    (set, get) => ({
      seen: [],
      active: false,
      step: 0,
      start: () => set({ active: true, step: 0 }),
      go: step => set({ step }),
      close: key => set(s => ({ active: false, step: 0, seen: key && !s.seen.includes(key) ? [...s.seen, key] : s.seen })),
      hasSeen: key => get().seen.includes(key),
    }),
    { name: 'structflow-tour', version: 1, partialize: s => ({ seen: s.seen }) }
  )
)

export default useTour
