import { create } from 'zustand'

const usePerson = create(set => ({
  personId: null,
  show: personId => set({ personId }),
  hide: () => set({ personId: null }),
}))

export default usePerson
