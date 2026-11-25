import { create } from 'zustand'

const useConfirm = create(set => ({
  options: null,
  ask: options => new Promise(resolve => set({ options: { ...options, resolve } })),
  close: result => set(s => {
    s.options?.resolve(result)
    return { options: null }
  }),
}))

// confirm({ title, message, details?, confirmLabel?, tone?: 'danger' | 'primary' }) -> Promise<boolean>
export const confirm = options => useConfirm.getState().ask(options)

export default useConfirm
