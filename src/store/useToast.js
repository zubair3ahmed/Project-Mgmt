import { create } from 'zustand'

let timer
const useToast = create(set => ({
  toast: null,
  show: toast => {
    clearTimeout(timer)
    const id = Date.now()
    set({ toast: { ...toast, id } })
    timer = setTimeout(() => set(s => (s.toast?.id === id ? { toast: null } : s)), toast.duration ?? 9000)
  },
  hide: () => set({ toast: null }),
}))

export default useToast
