import { DATE_WORD, iso, parseDatePhrase } from './smartTask'

export const PROJECT_TYPES = ['Residential', 'Commercial', 'Industrial', 'Institutional', 'Infrastructure']
export const TYPE_MONTHS = { Residential: 12, Commercial: 12, Industrial: 6, Institutional: 12, Infrastructure: 18 }
const TYPE_SKILLS = {
  Residential: ['RCC Design', 'Foundation Design', 'Detailing'],
  Commercial: ['RCC Design', 'Steel Structures', 'ETABS'],
  Industrial: ['Steel Structures', 'Foundation Design', 'STAAD Pro'],
  Institutional: ['RCC Design', 'Seismic Design', 'ETABS'],
  Infrastructure: ['Post-Tensioning', 'Seismic Design', 'Foundation Design'],
}

const TYPE_PATTERNS = [
  ['Infrastructure', /\b(bridge|road|flyover|metro|highway|infrastructure|culvert|dam)\b/i],
  ['Industrial', /\b(shed|factory|warehouse|industrial|plant|godown|workshop)\b/i],
  ['Institutional', /\b(school|college|hospital|university|institution(al)?|campus|auditorium)\b/i],
  ['Commercial', /\b(mall|office|commercial|hub|tech park|it park|cyber|retail|showroom|hotel)\b/i],
  ['Residential', /\b(tower|towers|apartment|apartments|villa|villas|residential|housing|township|flats?|bungalow)\b/i],
]

const CITIES = ['Bangalore', 'Bengaluru', 'Mumbai', 'Pune', 'Chennai', 'Gurgaon', 'Gurugram', 'Delhi', 'New Delhi', 'Noida', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi', 'Coimbatore', 'Nagpur', 'Surat', 'Lucknow', 'Indore', 'Chandigarh', 'Mysore', 'Vizag']

const STOP = new Set(['the', 'and', 'group', 'properties', 'constructions', 'housing', 'ltd', 'pvt', 'limited'])

export function addMonths(n, from = new Date()) {
  const d = new Date(from)
  d.setMonth(d.getMonth() + n)
  return iso(d)
}

function parseMoney(text) {
  let m = text.match(/(?:₹|rs\.?|inr)?\s?(\d+(?:\.\d+)?)\s?(cr(?:ore)?s?)\b/i)
  if (m) return { value: Math.round(parseFloat(m[1]) * 1e7), re: /(?:₹|rs\.?|inr)?\s?\d+(?:\.\d+)?\s?cr(?:ore)?s?\b/i }
  m = text.match(/(?:₹|rs\.?|inr)?\s?(\d+(?:\.\d+)?)\s?(l(?:akh|ac)?s?)\b/i)
  if (m) return { value: Math.round(parseFloat(m[1]) * 1e5), re: /(?:₹|rs\.?|inr)?\s?\d+(?:\.\d+)?\s?l(?:akh|ac)?s?\b/i }
  m = text.match(/(?:₹|rs\.?|inr)\s?([\d,]{5,})/i)
  if (m) return { value: Number(m[1].replace(/,/g, '')), re: /(?:₹|rs\.?|inr)\s?[\d,]{5,}/i }
  return null
}

export function matchClient(text, clients) {
  const lower = text.toLowerCase()
  const kw = clients.map(c => ({ c, words: c.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP.has(w)) }))
  const hit = kw.filter(({ words }) => words.some(w => new RegExp(`\\b${w}\\b`).test(lower)))
  return hit.length === 1 ? hit[0].c : null
}

export function clientMatches(text, clients) {
  const lower = text.toLowerCase()
  return clients.filter(c => c.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP.has(w)).some(w => new RegExp(`\\b${w}\\b`).test(lower)))
}

export function suggestManager({ staff, projects }) {
  return staff
    .filter(s => s.status === 'active' && /manager|lead/i.test(s.role))
    .map(s => ({ s, load: projects.filter(p => p.managerId === s.id && p.status !== 'completed').length }))
    .sort((a, b) => a.load - b.load)
    .map(x => x.s)
}

export function suggestTeam({ type, managerId, staff, tasks }, limit = 3) {
  const skills = TYPE_SKILLS[type] || []
  return staff
    .filter(s => s.status === 'active' && s.id !== managerId && s.department !== 'Administration' && s.department !== 'Management')
    .map(s => {
      const open = tasks.filter(t => t.assigneeId === s.id && t.status !== 'done').length
      return { s, score: s.skills.filter(k => skills.includes(k)).length * 3 - open * 0.5 }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.s)
}

export function parseProjectText(raw, { clients, staff, projects }, now = new Date()) {
  let text = ' ' + raw + ' '
  const found = {}
  const strip = re => { text = text.replace(re, ' ') }

  const mention = text.match(/(?:^|\s)@([\w.]+)/)
  if (mention) {
    const q = mention[1].toLowerCase()
    const hits = staff.filter(s => s.status === 'active' && (s.name.toLowerCase().split(' ')[0].startsWith(q) || s.name.toLowerCase().includes(q)))
    if (hits.length === 1) { found.managerId = hits[0].id; strip(/(?:^|\s)@[\w.]+/) }
  }

  const pr = text.match(/(?:^|\s)!(urgent|high|medium|med|low)\b/i)
  if (pr) { const v = pr[1].toLowerCase(); found.priority = v === 'med' ? 'medium' : v; strip(/(?:^|\s)!(urgent|high|medium|med|low)\b/i) }

  const money = parseMoney(text)
  if (money) { found.contractValue = money.value; strip(money.re) }

  const start = text.match(new RegExp(`\\b(?:start(?:s|ing)?|from)\\s+(${DATE_WORD})\\b`, 'i'))
  if (start) {
    const d = parseDatePhrase(start[1], now)
    if (d) { found.startDate = d; strip(new RegExp(`\\b(?:start(?:s|ing)?|from)\\s+${DATE_WORD}\\b`, 'i')) }
  }
  const end = text.match(new RegExp(`\\b(?:end(?:s)?|till|until|deadline|due|by)\\s+(${DATE_WORD})\\b`, 'i'))
  if (end) {
    const d = parseDatePhrase(end[1], now)
    if (d) { found.endDate = d; strip(new RegExp(`\\b(?:end(?:s)?|till|until|deadline|due|by)\\s+${DATE_WORD}\\b`, 'i')) }
  }

  const dur = text.match(/(\d+)\s?(months?|mos?|weeks?|wks?|years?|yrs?)\b/i)
  if (dur) {
    const n = Number(dur[1]), u = dur[2].toLowerCase()
    found.durationMonths = u.startsWith('y') ? n * 12 : u.startsWith('w') ? Math.max(1, Math.round(n / 4.33)) : n
    strip(/\d+\s?(?:months?|mos?|weeks?|wks?|years?|yrs?)\b/i)
  }

  const clientCue = text.match(/\bclient\s+/i)
  const client = matchClient(text, clients)
  if (client) found.clientId = client.id
  if (clientCue) strip(/\bclient\s+[A-Za-z]+\b/i)

  const known = [...CITIES, ...new Set(projects.map(p => p.location))]
  const city = known.find(c => new RegExp(`\\b${c}\\b`, 'i').test(text))
  if (city) { found.location = city; strip(new RegExp(`\\b${city}\\b`, 'i')) }

  const name = text.replace(/\s+/g, ' ').trim()
  for (const [type, re] of TYPE_PATTERNS) if (re.test(name)) { found.type = type; break }

  return { name, found }
}
