import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowBigUp, Eye, EyeOff, Info, Loader2, Lock, Mail, ShieldCheck, Users, WifiOff } from 'lucide-react'
import clsx from 'clsx'
import { FormField, Input, Button, Alert } from '../components/FormField'
import useAuth, { ADMIN_ACCOUNT, MEMBER_PASSWORD } from '../store/useAuth'
import useStore from '../store/useStore'
import LoginIllustration from '../components/LoginIllustration'

const ROLES = {
  member: { label: 'Team member', icon: Users, demo: { email: 'sneha.k@structflow.com', password: MEMBER_PASSWORD } },
  admin: { label: 'Admin', icon: ShieldCheck, demo: { email: ADMIN_ACCOUNT.email, password: ADMIN_ACCOUNT.password } },
}

const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 30
const LOCK_KEY = 'structflow-login-lock'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readLock() {
  try { return JSON.parse(sessionStorage.getItem(LOCK_KEY)) || { fails: 0, until: 0 } } catch { return { fails: 0, until: 0 } }
}
function writeLock(lock) {
  try { sessionStorage.setItem(LOCK_KEY, JSON.stringify(lock)) } catch { /* storage unavailable */ }
}

function FieldError({ id, children }) {
  if (!children) return null
  return <p id={id} className="text-xs text-danger-dark">{children}</p>
}

export default function Login() {
  const user = useAuth(s => s.user)
  const login = useAuth(s => s.login)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [caps, setCaps] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [lock, setLock] = useState(readLock)
  const [now, setNow] = useState(Date.now())

  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const pendingFocus = useRef(null)

  const locked = lock.until > now
  const remaining = Math.max(0, Math.ceil((lock.until - now) / 1000))

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (!locked) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [locked])

  useEffect(() => {
    if (!submitting && pendingFocus.current) {
      ;(pendingFocus.current === 'email' ? emailRef : passwordRef).current?.focus()
      pendingFocus.current = null
    }
  }, [submitting])

  const clearFeedback = () => { setErrors({}); setNotice(null) }

  function fillDemo(key) {
    setEmail(ROLES[key].demo.email)
    setPassword(ROLES[key].demo.password)
    clearFeedback()
  }

  function validate() {
    const errs = {}
    if (!email.trim()) errs.email = 'Enter your work email.'
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address, like you@structflow.com.'
    if (!password) errs.password = 'Enter your password.'
    return errs
  }

  const submit = useCallback(async e => {
    e?.preventDefault()
    if (submitting || locked) return
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) {
      setNotice({ tone: 'error', text: Object.keys(errs).length > 1 ? 'Fix the highlighted fields to continue.' : 'Fix the highlighted field to continue.' })
      ;(errs.email ? emailRef : passwordRef).current?.focus()
      return
    }
    setNotice(null)

    if (!navigator.onLine) {
      setNotice({ tone: 'warning', text: "You're offline. Reconnect to the internet, then try again.", action: { label: 'Retry', onClick: () => submit() } })
      return
    }

    setSubmitting(true)
    try {
      const res = await login({
        email, password,
        isInactive: id => useStore.getState().staff.find(s => s.id === id)?.status === 'inactive',
        findStaff: mail => useStore.getState().staff.find(s => (s.email || '').toLowerCase() === mail),
      })
      if (res.ok) {
        writeLock({ fails: 0, until: 0 })
        navigate('/', { replace: true })
        return
      }
      if (res.code === 'invalid') {
        const fails = readLock().fails + 1
        if (fails >= MAX_ATTEMPTS) {
          const next = { fails: 0, until: Date.now() + LOCK_SECONDS * 1000 }
          writeLock(next); setLock(next); setNow(Date.now())
          setNotice(null)
        } else {
          writeLock({ fails, until: 0 })
          setLock({ fails, until: 0 })
          const left = MAX_ATTEMPTS - fails
          setNotice({
            tone: 'error',
            text: `Email or password is incorrect.${fails >= 3 ? ` ${left} attempt${left > 1 ? 's' : ''} left before sign-in pauses for ${LOCK_SECONDS} seconds.` : ''}`,
          })
        }
        setPassword('')
        pendingFocus.current = 'password'
      } else if (res.code === 'inactive') {
        setNotice({
          tone: 'warning',
          text: 'Your account is deactivated. Contact your admin to get access back.',
          action: { label: 'Use a different account', onClick: () => { setEmail(''); setPassword(''); setNotice(null); setTimeout(() => emailRef.current?.focus(), 0) } },
        })
      } else {
        setNotice({ tone: 'error', text: res.error || 'Something went wrong. Try again.' })
      }
    } catch {
      setNotice({
        tone: 'error',
        text: 'Unable to reach the server. Check your connection and try again.',
        action: { label: 'Retry', onClick: () => submit() },
      })
    } finally {
      setSubmitting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, submitting, locked, login, navigate])

  if (user) return <Navigate to="/" replace />

  const busy = submitting
  const noticeAction = notice?.action && (
    <Button type="button" size="sm" variant="secondary" onClick={notice.action.onClick} className="shrink-0">{notice.action.label}</Button>
  )

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] bg-surface-0">
      <main className="flex flex-col px-6 sm:px-12 py-8 min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-md flex items-center justify-center text-white text-sm font-bold shadow-xs">SF</div>
          <span className="text-lg font-bold text-surface-900 tracking-tight">StructFlow</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px] flex flex-col gap-8 py-10">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Welcome back</h1>
              <p className="text-surface-500">Sign in with your work email. What you see depends on your account.</p>
            </div>

            {!online && (
              <div role="alert">
                <Alert tone="warning" icon={<WifiOff size={18} className="shrink-0" />}>You're offline. Sign-in needs an internet connection.</Alert>
              </div>
            )}

            {forgot ? (
              <div className="flex flex-col gap-5">
                <Alert tone="info" icon={<Info size={18} className="shrink-0" />}>
                  <span className="font-semibold">Reset your password</span>
                  <span className="block mt-1">
                    Ask your organization admin to reset it for you. Share your work email{email.trim() ? <> (<span className="font-medium">{email.trim()}</span>)</> : ''} so they can find your account.
                  </span>
                </Alert>
                <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => setForgot(false)}>Back to sign in</Button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="flex flex-col gap-5">
                {locked ? (
                  <div role="alert">
                    <Alert tone="error">
                      <span className="font-semibold">Too many failed attempts.</span>
                      <span className="block mt-1">Sign-in is paused to protect your account. Try again in {remaining}s.</span>
                    </Alert>
                  </div>
                ) : notice && (
                  <div role="alert">
                    <Alert tone={notice.tone} action={noticeAction}>{notice.text}</Alert>
                  </div>
                )}

                <FormField label="Work email">
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <Input
                      ref={emailRef}
                      type="email"
                      autoComplete="username"
                      value={email}
                      disabled={busy}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'login-email-error' : undefined}
                      onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(x => ({ ...x, email: undefined })) }}
                      placeholder="you@structflow.com"
                      className="pl-10"
                    />
                  </div>
                  <FieldError id="login-email-error">{errors.email}</FieldError>
                </FormField>

                <FormField label="Password">
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <Input
                      ref={passwordRef}
                      type={show ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      disabled={busy}
                      aria-invalid={!!errors.password}
                      aria-describedby={[errors.password && 'login-password-error', caps && 'login-caps'].filter(Boolean).join(' ') || undefined}
                      onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(x => ({ ...x, password: undefined })) }}
                      onKeyDown={e => setCaps(!!e.getModifierState?.('CapsLock'))}
                      onKeyUp={e => setCaps(!!e.getModifierState?.('CapsLock'))}
                      onBlur={() => setCaps(false)}
                      placeholder="Enter your password"
                      className="pl-10 pr-11"
                    />
                    <button type="button" onClick={() => setShow(s => !s)} disabled={busy} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-50">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FieldError id="login-password-error">{errors.password}</FieldError>
                  {caps && (
                    <p id="login-caps" className="flex items-center gap-1 text-xs text-warning-dark">
                      <ArrowBigUp size={14} /> Caps Lock is on
                    </p>
                  )}
                  <button type="button" onClick={() => setForgot(true)} className="self-end text-sm font-semibold text-brand-700 hover:underline">Forgot password?</button>
                </FormField>

                <Button type="submit" size="lg" className="w-full" disabled={busy || locked}>
                  {busy ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : locked ? `Try again in ${remaining}s` : 'Sign in'}
                </Button>
              </form>
            )}

            <div className="flex items-center gap-3 text-xs text-surface-400">
              <span className="flex-1 h-px bg-surface-200" /> Prototype only: demo accounts <span className="flex-1 h-px bg-surface-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(ROLES).reverse().map(([key, r]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setForgot(false); fillDemo(key) }}
                  disabled={busy}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-surface-300 bg-surface-0 hover:bg-surface-50 hover:border-surface-400 transition-colors text-left disabled:opacity-60"
                >
                  <r.icon size={18} className="shrink-0 text-brand-600" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-surface-800">Fill {r.label.toLowerCase()}</span>
                    <span className="block text-xs text-surface-500 truncate">{r.demo.email}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-surface-400">Need access? Ask your organization admin to add you.</p>
      </main>

      <aside className="hidden lg:flex flex-col items-center justify-center gap-14 bg-brand-600 text-white p-12 overflow-hidden">
        <div className="max-w-lg flex flex-col gap-5">
          <h2 className="text-4xl font-bold tracking-tight leading-tight">Every project, job and hour in one workspace.</h2>
          <p className="text-brand-100 text-lg">Track structural design work from work order to final payment, with the cost and margin picture management needs.</p>
        </div>
        <LoginIllustration />
      </aside>
    </div>
  )
}
