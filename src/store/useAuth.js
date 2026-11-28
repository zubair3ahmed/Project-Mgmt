import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STAFF } from '../data/mockData'

export const ADMIN_ACCOUNT = {
  email: 'admin@structflow.com', password: 'admin123', role: 'admin',
  staffId: 'S009', name: 'Zubair Ahmed', avatar: 'ZA', title: 'Organization Admin',
}

export const MEMBER_PASSWORD = 'team123'

const memberAccounts = STAFF.filter(s => s.id !== 'S009').map(s => ({
  email: s.email, password: MEMBER_PASSWORD, role: 'member', status: s.status,
  staffId: s.id, name: s.name, avatar: s.avatar, title: s.role,
}))

const ACCOUNTS = [ADMIN_ACCOUNT, ...memberAccounts]

// The app always opens on the sign-in page. A session only survives a refresh of the same tab;
// opening the app again, a duplicated tab or a restored browser window starts signed out.
try {
  if (performance.getEntriesByType('navigation')[0]?.type !== 'reload') sessionStorage.removeItem('structflow-auth')
} catch { /* storage blocked: nothing is kept anyway */ }

const useAuth = create(
  persist(
    (set) => ({
      user: null,
      // Async so it can later be swapped for a network call. Resolves with { ok } or { ok: false, code }.
      // codes: 'invalid' | 'inactive' | 'wrong-role' (with correctRole). May reject on network failure.
      login: async ({ email, password, as, isInactive, findStaff }) => {
        await new Promise(r => setTimeout(r, 400))
        const key = email.trim().toLowerCase()
        let acct = ACCOUNTS.find(a => a.email.toLowerCase() === key)
        if (!acct) {
          // someone the admin added after launch
          const added = findStaff?.(key)
          if (added) acct = { email: added.email, password: MEMBER_PASSWORD, role: 'member', status: added.status, staffId: added.id, name: added.name, avatar: added.avatar, title: added.role }
        }
        if (!acct || acct.password !== password) return { ok: false, code: 'invalid', error: 'Email or password is incorrect.' }
        if (acct.status === 'inactive' || (acct.staffId && isInactive?.(acct.staffId))) {
          return { ok: false, code: 'inactive', error: 'Your account is deactivated. Contact your admin.' }
        }
        // the account decides the role; `as` is only checked when a caller asks for a specific one
        if (as && acct.role !== as) {
          return { ok: false, code: 'wrong-role', correctRole: acct.role, error: as === 'admin' ? 'This account is not an admin.' : 'This is an admin account.' }
        }
        const { password: _p, status: _s, ...user } = acct
        set({ user })
        return { ok: true }
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'structflow-auth',
      // One session per tab, so an admin and a team member can be signed in side by side.
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      migrate: persisted => ({
        ...persisted,
        user: persisted?.user?.role === 'admin' ? { ...persisted.user, staffId: ADMIN_ACCOUNT.staffId } : persisted?.user,
      }),
    }
  )
)

export default useAuth
