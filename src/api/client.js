// Thin fetch wrapper for the StructFlow API. See docs/BACKEND.md.
// Set VITE_API_URL (see .env.example). When empty the app runs on mock data.

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'structflow-token'

export const isRemote = Boolean(BASE)

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: t => { try { localStorage.setItem(TOKEN_KEY, t) } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ } },
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`)
    this.status = status
    this.code = body?.code
    this.details = body?.details
  }
}

export async function request(method, path, { body, form, query } = {}) {
  if (!isRemote) throw new ApiError(0, { message: 'VITE_API_URL is not set', code: 'NO_BACKEND' })
  const url = new URL(BASE + path)
  Object.entries(query || {}).forEach(([k, v]) => v != null && v !== '' && url.searchParams.set(k, v))
  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(url, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) })
  } catch {
    throw new ApiError(0, { message: 'Unable to reach the server. Check your connection and try again.', code: 'NETWORK' })
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401) tokenStore.clear()
    throw new ApiError(res.status, data)
  }
  return data
}
