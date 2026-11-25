const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export const TYPE_HOURS = { design: 16, drafting: 12, review: 4, analysis: 16, estimation: 8, report: 8, 'site-visit': 6, coordination: 2 }

export const TYPE_SKILLS = {
  design: ['RCC Design', 'Steel Structures', 'Foundation Design', 'Seismic Design', 'Post-Tensioning'],
  drafting: ['AutoCAD', 'Revit', 'Drafting', 'Detailing'],
  review: ['Quality Control'],
  analysis: ['STAAD Pro', 'ETABS', 'Seismic Design'],
  estimation: ['Estimation'],
  report: ['Documentation'],
  'site-visit': ['Site Visits'],
  coordination: ['Project Coordination', 'Client Management', 'Project Planning'],
}

const TYPE_PATTERNS = [
  ['site-visit', /\b(site\s?visit|site|inspection)\b/i],
  ['review', /\b(review|qc|check|checking|verify)\b/i],
  ['estimation', /\b(estimate|estimation|boq|quantity|quantities|costing)\b/i],
  ['report', /\b(report|documentation|submission)\b/i],
  ['analysis', /\b(analysis|analyse|analyze|seismic|wind|staad|etabs|modelling|modeling)\b/i],
  ['drafting', /\b(drawings?|drafting|draft|cad|autocad|revit|detailing)\b/i],
  ['coordination', /\b(meeting|coordinate|coordination|call|sync)\b/i],
  ['design', /\b(design|calculation|calc|footing|slab|beam|column|foundation|raft)\b/i],
]

const STOP = new Set(['block', 'the', 'and', 'park'])

export const iso = d => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(n, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + n)
  return iso(d)
}

function nextWeekday(target, from = new Date()) {
  const diff = ((target - from.getDay() + 7) % 7) || 7
  return addDays(diff, from)
}

export function parseDatePhrase(p, now) {
  p = p.toLowerCase().trim()
  if (p === 'today') return iso(now)
  if (p === 'tomorrow' || p === 'tmrw') return addDays(1, now)
  if (p === 'next week') return addDays(7, now)
  let m = p.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return p
  m = p.match(/^(?:next\s+)?(sun|mon|tue|wed|thu|fri|sat)[a-z]*$/)
  if (m) return nextWeekday(DAYS.indexOf(m[1]), now)
  m = p.match(/^(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*$/)
  if (m) {
    let d = new Date(now.getFullYear(), MONTHS.indexOf(m[2]), Number(m[1]))
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate())
    return iso(d)
  }
  m = p.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/)
  if (m) {
    let y = m[3] ? Number(m[3]) : now.getFullYear()
    if (y < 100) y += 2000
    let d = new Date(y, Number(m[2]) - 1, Number(m[1]))
    if (!m[3] && d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(y + 1, d.getMonth(), d.getDate())
    return iso(d)
  }
  return null
}

export const DATE_WORD = '(?:today|tomorrow|tmrw|next week|(?:next\\s+)?(?:sun|mon|tue|wed|thu|fri|sat)[a-z]*|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?)'

export function matchProject(text, projects) {
  const lower = text.toLowerCase()
  const words = p => p.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
  const kw = projects.map(p => ({ p, words: words(p) }))
  const freq = {}
  kw.forEach(({ words }) => new Set(words).forEach(w => { freq[w] = (freq[w] || 0) + 1 }))
  const scored = kw.map(({ p, words }) => ({
    p,
    score: words.reduce((s, w) => s + (new RegExp(`\\b${w}\\b`).test(lower) ? (freq[w] === 1 ? 2 : 1) : 0), 0),
  })).filter(x => x.score > 0).sort((a, b) => b.score - a.score)
  if (!scored.length) return null
  if (scored[1] && scored[1].score === scored[0].score) return null
  return scored[0].score >= 2 ? scored[0].p : null
}

export function detectType(text) {
  for (const [type, re] of TYPE_PATTERNS) if (re.test(text)) return type
  return null
}

export function parseTaskText(raw, { projects, staff, meId }, now = new Date()) {
  let text = ' ' + raw + ' '
  const found = {}
  const strip = re => { text = text.replace(re, ' ') }

  const mention = text.match(/(?:^|\s)@([\w.]+)/)
  if (mention) {
    const q = mention[1].toLowerCase()
    if (q === 'me' && meId) { found.assigneeId = meId; strip(/(?:^|\s)@me\b/i) }
    const hits = q === 'me' ? [] : staff.filter(s => s.status === 'active' && (s.name.toLowerCase().split(' ')[0].startsWith(q) || s.name.toLowerCase().includes(q)))
    if (hits.length === 1) { found.assigneeId = hits[0].id; strip(/(?:^|\s)@[\w.]+/) }
  }

  const pr = text.match(/(?:^|\s)!(urgent|high|medium|med|low)\b/i)
  if (pr) {
    const v = pr[1].toLowerCase()
    found.priority = v === 'med' ? 'medium' : v
    strip(/(?:^|\s)!(urgent|high|medium|med|low)\b/i)
  } else if (/\b(asap|urgent)\b/i.test(text)) {
    found.priority = 'urgent'
  }

  const hrs = text.match(/(?:^|\s)(\d+(?:\.\d+)?)\s?(?:h|hr|hrs|hours)\b/i)
  if (hrs) { found.estimatedHours = Number(hrs[1]); strip(/(?:^|\s)\d+(?:\.\d+)?\s?(?:h|hr|hrs|hours)\b/i) }

  const due = text.match(new RegExp(`\\b(?:due|by|on)\\s+(${DATE_WORD})\\b`, 'i'))
  if (due) {
    const d = parseDatePhrase(due[1], now)
    if (d) { found.dueDate = d; strip(new RegExp(`\\b(?:due|by|on)\\s+${DATE_WORD}\\b`, 'i')) }
  } else {
    const bare = text.match(/\b(today|tomorrow|tmrw)\b/i)
    if (bare) { found.dueDate = parseDatePhrase(bare[1], now); strip(/\b(today|tomorrow|tmrw)\b/i) }
  }

  const tags = []
  text.replace(/(?:^|\s)#([\w-]+)/g, (_, t) => { tags.push(t.toLowerCase()); return '' })
  if (tags.length) {
    strip(/(?:^|\s)#[\w-]+/g)
    const typeTag = tags.find(t => TYPE_HOURS[t] !== undefined)
    if (typeTag) found.type = typeTag
    const rest = tags.filter(t => t !== typeTag)
    if (rest.length) found.tags = rest
  }

  const project = matchProject(text, projects)
  if (project) found.projectId = project.id

  const title = text.replace(/\s+/g, ' ').trim()
  if (!found.type) { const t = detectType(title); if (t) found.type = t }

  return { title, found }
}

export function suggestAssignees({ type, projectId, projects, staff, tasks }, limit = 3) {
  const project = projects.find(p => p.id === projectId)
  const team = project ? new Set([project.managerId, ...(project.teamIds || [])]) : null
  const skills = TYPE_SKILLS[type] || []
  return staff
    .filter(s => s.status === 'active' && s.department !== 'Administration')
    .map(s => {
      const open = tasks.filter(t => t.assigneeId === s.id && t.status !== 'done').length
      const skill = s.skills.filter(k => skills.includes(k)).length
      return { s, score: skill * 3 + (team?.has(s.id) ? 2 : 0) - open * 0.5 }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.s)
}
