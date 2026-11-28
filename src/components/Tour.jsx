import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react'
import clsx from 'clsx'
import useAuth from '../store/useAuth'
import useTour from '../store/useTour'
import { Button } from './FormField'

// Each step points at an element by data-tour name. `targets` lists fallbacks, so on a phone the
// sidebar step points at the menu button instead. A step with no visible target is skipped.
const ADMIN_STEPS = [
  { welcome: true, title: 'Welcome to StructFlow', body: 'A two-minute tour of where things live and the shortcuts worth knowing. You can skip it now and replay it any time from your account menu.' },
  { targets: ['nav', 'menu'], title: 'Everything is in the sidebar', body: 'Workspace has your projects, jobs and time log. Management is admin only: staff, milestones and reports.', place: 'right' },
  { targets: ['search'], title: 'Find anything in a keystroke', body: 'Press ⌘K (Ctrl K on Windows) anywhere to search projects, jobs, people and files.', place: 'bottom' },
  { route: '/', targets: ['kpis'], title: 'Your morning numbers', body: 'Active projects, open jobs, revenue and completion. Charts and the Needs attention list sit right below.', place: 'bottom' },
  { route: '/projects', targets: ['create'], title: 'Add a project from anywhere', body: 'This button is always here. Type "Prestige Tech Park Bangalore ₹2.5Cr client Prestige 12 months @Priya" and the fields fill themselves. Open a project to see its milestones and jobs, or use the pencil to edit it.', place: 'bottom' },
  { route: '/jobs', targets: ['action'], title: 'Jobs work the same way', body: 'Type "Column schedule Prestige Towers @Amit !high due fri 8h". Link it to a milestone. When the last job of a milestone is done, its payment request is raised.', place: 'bottom' },
  { route: '/milestones', targets: ['milestones'], title: 'Money lives on milestones', body: 'Milestones carry the money. Open one to see its jobs. When the last one is done, the request goes out automatically or waits here for your approval.', place: 'top' },
  { targets: ['account'], title: 'You are set', body: 'Replay this tour or sign out from here whenever you like.', place: 'bottom' },
]

const MEMBER_STEPS = [
  { welcome: true, title: 'Welcome to StructFlow', body: 'Here is a quick look at your jobs, hours and where to find things. You can skip it and replay it from your account menu.' },
  { route: '/', targets: ['up-next', 'kpis'], title: 'Your work, in order', body: 'Up next lists what you should do now. Start a job or mark it Done right from the row.', place: 'bottom' },
  { targets: ['nav', 'menu'], title: 'Where things live', body: 'Projects you have been added to, My Jobs, your Time Log and Files are all one tap away.', place: 'right' },
  { targets: ['search'], title: 'Find anything fast', body: 'Press ⌘K (Ctrl K on Windows) to search your projects, jobs and files.', place: 'bottom' },
  { route: '/jobs', targets: ['create'], title: 'Add a job by typing a line', body: 'Try "Site visit report Prestige Towers due fri 4h". It fills the project, date and estimate for you. You can add jobs to projects where your admin has given you write access.', place: 'bottom' },
  { route: '/time-log', targets: ['action'], title: 'Log your hours', body: 'See your hours for each day across projects. Log them here, or with the Log hours button on any job.', place: 'bottom' },
  { targets: ['account'], title: 'You are set', body: 'Replay this tour or sign out from here whenever you like.', place: 'bottom' },
]

const isVisible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth }
const findTarget = names => { for (const n of names || []) { const el = [...document.querySelectorAll(`[data-tour="${n}"]`)].find(isVisible); if (el) return el } return null }

export default function Tour() {
  const user = useAuth(s => s.user)
  const { active, step, start, go, close } = useTour()
  const seen = useTour(s => s.seen)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const key = user?.email
  const steps = useMemo(() => (user?.role === 'admin' ? ADMIN_STEPS : MEMBER_STEPS), [user?.role])
  const [rect, setRect] = useState(null)
  const [missing, setMissing] = useState(false)
  const cardRef = useRef(null)
  const dir = useRef(1)
  const cur = steps[step]

  // open by itself the first time this account signs in
  useEffect(() => {
    if (!key || seen.includes(key) || active) return
    const t = setTimeout(() => start(), 900)
    return () => clearTimeout(t)
  }, [key, seen, active, start])

  const finish = useCallback(() => close(key), [close, key])
  const move = useCallback(n => { dir.current = n > step ? 1 : -1; if (n >= steps.length) finish(); else if (n >= 0) go(n) }, [step, steps.length, go, finish])

  // go to the step's page, then locate its target (retrying while the page renders)
  useEffect(() => {
    if (!active || !cur) return
    setRect(null); setMissing(false)
    if (cur.route && pathname !== cur.route) { navigate(cur.route); return }
    if (cur.welcome) return
    let tries = 0, cancelled = false
    const look = () => {
      if (cancelled) return
      const el = findTarget(cur.targets)
      if (el) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); setTimeout(() => !cancelled && measure(el), 60); return }
      if (++tries > 12) { setMissing(true); return }
      setTimeout(look, 120)
    }
    const measure = el => { const r = el.getBoundingClientRect(); setRect({ x: r.left, y: r.top, w: r.width, h: r.height }) }
    look()
    const onMove = () => { const el = findTarget(cur.targets); if (el) measure(el) }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => { cancelled = true; window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true) }
  }, [active, step, pathname, cur, navigate])

  // a target that never appears (e.g. hidden on this screen size) is skipped in the direction of travel
  useEffect(() => { if (active && missing) move(step + dir.current) }, [active, missing, step, move])

  useEffect(() => {
    if (!active) return
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); finish() }
      else if (e.key === 'ArrowRight') move(step + 1)
      else if (e.key === 'ArrowLeft' && step > 0) move(step - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, step, move, finish])

  useLayoutEffect(() => { if (active) cardRef.current?.querySelector('[data-autofocus]')?.focus() }, [active, step, rect])

  if (!active || !cur) return null
  const last = step === steps.length - 1
  const pad = 6
  const mobile = typeof window !== 'undefined' && window.innerWidth < 640
  const W = 340

  let style
  if (cur.welcome || !rect) {
    style = mobile ? { left: 12, right: 12, bottom: 12 } : { left: '50%', top: '50%', width: 400, transform: 'translate(-50%,-50%)' }
  } else if (mobile) {
    style = { left: 12, right: 12, bottom: 12 }
  } else {
    const vw = window.innerWidth, vh = window.innerHeight
    const spaceRight = vw - (rect.x + rect.w), spaceBelow = vh - (rect.y + rect.h)
    let place = cur.place || 'bottom'
    if (place === 'right' && spaceRight < W + 24) place = 'bottom'
    if (place === 'bottom' && spaceBelow < 220) place = 'top'
    let left, top
    if (place === 'right') { left = rect.x + rect.w + 16; top = rect.y }
    else if (place === 'top') { left = rect.x; top = Math.max(12, rect.y - 16 - 210) }
    else { left = rect.x; top = rect.y + rect.h + 16 }
    left = Math.max(12, Math.min(vw - W - 12, left)); top = Math.max(12, Math.min(vh - 230, top))
    style = { left, top, width: W }
  }

  const spot = rect && !cur.welcome ? { left: rect.x - pad, top: rect.y - pad, width: rect.w + pad * 2, height: rect.h + pad * 2 } : null

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      {spot ? (
        <>
          <div className="absolute inset-0" onClick={e => e.stopPropagation()} />
          <div className="absolute rounded-lg pointer-events-none transition-all duration-300" style={{ ...spot, boxShadow: '0 0 0 9999px rgba(16,24,40,0.55)' }} />
          <div className="absolute rounded-lg pointer-events-none border-2 border-brand-500" style={spot} />
          <div className="tour-pulse absolute rounded-lg pointer-events-none border-2 border-brand-400" style={spot} />
        </>
      ) : (
        <div className="absolute inset-0 bg-surface-900/55" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour: ${cur.title}`}
        className={clsx('absolute bg-surface-0 rounded-xl border border-surface-200 shadow-2xl p-5 flex flex-col gap-3', cur.welcome && 'items-start')}
        style={style}
      >
        {cur.welcome && <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Sparkles size={20} /></span>}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-surface-900">{cur.welcome ? `${cur.title}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}` : cur.title}</h2>
          <button type="button" onClick={finish} aria-label="Skip tour" className="w-7 h-7 -mr-1 -mt-1 shrink-0 flex items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-700"><X size={16} /></button>
        </div>
        <p className="text-sm text-surface-600 leading-relaxed" aria-live="polite">{cur.body}</p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
            {steps.map((_, i) => <span key={i} className={clsx('h-1.5 rounded-full transition-all', i === step ? 'w-5 bg-brand-600' : 'w-1.5 bg-surface-300')} />)}
          </div>
          <div className="flex items-center gap-2">
            {step === 0 ? (
              <Button variant="ghost" size="sm" onClick={finish}>Skip</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => move(step - 1)}><ArrowLeft size={14} /> Back</Button>
            )}
            <Button size="sm" data-autofocus onClick={() => move(step + 1)}>{step === 0 ? 'Start tour' : last ? 'Finish' : <>Next <ArrowRight size={14} /></>}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
