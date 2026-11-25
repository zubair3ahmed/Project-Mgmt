import { create } from 'zustand'

const useSearch = create(set => ({
  open: false,
  setOpen: open => set({ open }),
  toggle: () => set(s => ({ open: !s.open })),
}))

export default useSearch
